import { HyrexDispatcher, SerializedTask, SerializedTaskRequest } from "../HyrexDispatcher";
import { HyrexTaskConfig, JsonType, UUID, uuidSchema } from "../../utils";
import { Notification, Pool, PoolClient } from 'pg';
import * as sql from "./sql/sql"
import * as cronSQL from "./sql/cronSql"
import * as statsSQL from "./sql/stats"
import * as durabilitySQL from './sql/durability/durabilitySql'
import * as workflowSQL from "./sql/workflowSql"
import { string } from "zod";
import { DispatcherListenerCallbacks } from "../HyrexDispatcher";
import { TaskHeartbeatResultMessage, AdminMessage, ExecutorHeartbeatResultMessage, HyrexAppInfo } from "../../types";
import { HyrexQueue, HyrexQueuePattern } from "../../HyrexQueue";
import { v7 as uuidv7 } from 'uuid';
import { CronJob, CronJobRun } from "../../cron/HyrexCronScheduler";
import { hyrexLogger } from "../../logging/FrameworkLogger";
import { createInsertTaskCronExpression, TURN_OFF_CRON_FOR_TASK } from "./sql/cronSql";
import { HyrexWorkflowBuilder, WorkflowDagJson } from "../../workflow/HyrexWorkflowBuilder";
import { UPSERT_WORKFLOW } from "./sql/workflowSql";
import { z } from "zod";
import { SerializedWorkflowRunRequest, WorkflowRunStatus } from "../../workflow/HyrexWorkflow";
import { createDequeueQuery } from "./sql/sql";
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { envVariables } from "../../EnvironmentVariables";

type HyrexPostgresDispatcherConfig = {
    conn: string
}

/**
 * Converts glob patterns to PostgreSQL LIKE patterns.
 * Handles basic and extended glob syntax including *, ?, [], {}, and character classes.
 */
export function globToSqlLike(glob: string): string {
    if (!glob) return '%';

    let inCharClass = false;
    let inCurlyBrace = false;
    let escaped = false;
    let result = '';

    // Handle special case of '**' for recursive matching
    glob = glob.replace(/\*\*/g, '{DOUBLE_STAR}');

    for (let i = 0; i < glob.length; i++) {
        const char = glob[i];

        if (escaped) {
            result += char;
            escaped = false;
            continue;
        }

        if (char === '\\') {
            escaped = true;
            continue;
        }

        if (char === '[' && !inCharClass) {
            inCharClass = true;
            result += '[';
            continue;
        }

        if (char === ']' && inCharClass) {
            inCharClass = false;
            result += ']';
            continue;
        }

        if (char === '{' && !inCurlyBrace) {
            inCurlyBrace = true;
            result += '(';
            continue;
        }

        if (char === '}' && inCurlyBrace) {
            inCurlyBrace = false;
            result += ')';
            continue;
        }

        if (char === ',' && inCurlyBrace) {
            result += '|';
            continue;
        }

        switch (char) {
            case '*':
                result += '%';
                break;
            case '?':
                result += '_';
                break;
            case '%':
                result += '\\%';
                break;
            case '_':
                result += '\\_';
                break;
            case '|':
                result += '\\|';
                break;
            default:
                result += char;
        }
    }

    // Replace the double star placeholder with the actual pattern
    result = result.replace(/{DOUBLE_STAR}/g, '%');

    return result;
}


export class PostgresDispatcher implements HyrexDispatcher {
    private pool: Pool
    private s3Client: S3Client | null = null
    private bucket: string | null = null

    constructor(private config: HyrexPostgresDispatcherConfig) {
        this.pool = new Pool({
            connectionString: config.conn,
            max: 20,
            idleTimeoutMillis: 30000,
            maxUses: 7500,
            allowExitOnIdle: true
        })

        const dbName = new URL(config.conn).pathname.substring(1)
        hyrexLogger.info('postgres', `Created Postgres Pool. dbName="${dbName}" pid=${process.pid}`, 'magenta')

        // Initialize S3 client if bucket is configured
        const s3LogBucket = envVariables.getS3LogBucket()
        if (s3LogBucket) {
            this.bucket = s3LogBucket
            try {
                this.s3Client = new S3Client({})
                hyrexLogger.info('postgres', `S3 client initialized for bucket: ${s3LogBucket}`, 'magenta')
            } catch (err) {
                hyrexLogger.error('postgres', `Failed to initialize S3 client: ${err}`, 'red')
                this.s3Client = null
            }
        }
    }

    async registerHyrexApp(hyrexAppInfo: HyrexAppInfo): Promise<void> {
        this.queryWithRetry(async (client) => {
            await client.query(sql.REGISTER_APP_INFO_SQL, [1, hyrexAppInfo])
        })
    }

    async initPostgresDB() {
        hyrexLogger.info("postgres", "Creating PostgresDB...", "magenta");
        const client = await this.pool.connect()
        try {
            await client.query(sql.CreateHyrexAppTable);
            await client.query(sql.CreateHyrexTaskExecutionTable);
            await client.query(sql.CreateExecutorTable);
            await client.query(sql.CreateResultsTable);
            await client.query(sql.CreateSystemLogTable);
            await client.query(sql.CreateHyrexTaskTable);
            await client.query(cronSQL.CreateHyrexCronJobTable);
            await client.query(cronSQL.CreateHyrexCronJobRunDetailsTable);
            await client.query(cronSQL.CreateHyrexSchedulerLockTable);
            await client.query(cronSQL.CREATE_EXECUTE_QUEUED_COMMAND_FUNCTION);
            await client.query(statsSQL.CREATE_HISTORICAL_TASK_STATUS_COUNTS);
            await client.query(workflowSQL.CreateWorkflowTable)
            await client.query(workflowSQL.CreateWorkflowRunTable)

            // Cron Queries
            await this.registerCronSQLQuery({
                cronJobName: "FillHistoryTaskCountsTable",
                cronExpr: "* * * * *",
                cronSqlQuery: statsSQL.FILL_HISTORICAL_TASK_STATUS_COUNTS_TABLE,
                shouldBackfill: false
            })

            await this.registerCronSQLQuery({
                cronJobName: "SetOrphanedRunningTaskToLost",
                cronExpr: "* * * * *",
                cronSqlQuery: durabilitySQL.SET_ORPHANED_TASK_EXECUTION_TO_LOST_AND_RETRY,
                shouldBackfill: false
            })

            await this.registerCronSQLQuery({
                cronJobName: "SetExecutorToLostIfNoHeartbeat",
                cronExpr: "* * * * *",
                cronSqlQuery: durabilitySQL.SET_EXECUTOR_TO_LOST_IF_NO_HEARTBEAT,
                shouldBackfill: false
            })


            console.log("initPostgresDB finished successfully.");
        } catch (error) {
            console.error(error);
        } finally {
            client.release();
        }
    }

    private async queryWithRetry<T>(
        queryFn: (client: PoolClient) => Promise<T>,
        options: {
            maxRetries: number,
            retryOnlyOnTooManyClients: boolean
        } = {
            maxRetries: 5,
            retryOnlyOnTooManyClients: true
        }
    ): Promise<T> {
        const { maxRetries } = options;
        let lastError: unknown;

        for (let attempt = 0; attempt < maxRetries; attempt++) {
            let client = null;
            try {
                if (attempt > 0) {
                    const backoffMs = Math.min(1000 * Math.pow(2, attempt), 10000);
                    await new Promise(resolve => setTimeout(resolve, backoffMs));
                }

                client = await this.pool.connect();
                return await queryFn(client);

            } catch (error: unknown) {
                lastError = error;
                // Type guard to check if error is an object with a message property
                if (error && typeof error === 'object' && 'message' in error) {
                    if (typeof error.message === 'string' && error.message.includes('too many clients')) {
                        console.warn(`Connection pool exhausted, attempt ${attempt + 1}/${maxRetries}`);
                        continue;
                    }
                    if (options.retryOnlyOnTooManyClients) {
                        throw error;
                    }
                }
                continue;
            } finally {
                if (client) {
                    client.release();
                }
            }
        }

        // Handle the final error message with proper type checking
        const errorMessage = lastError && typeof lastError === 'object' && 'message' in lastError
            ? lastError.message
            : 'Unknown error';
        throw new Error(`Failed after ${maxRetries} attempts: ${errorMessage}`);
    }

    async enqueue(serializedTasks: SerializedTaskRequest[]): Promise<UUID[]> {
        return this.queryWithRetry(async (client) => {
            await client.query('BEGIN');
            try {
                for (const task of serializedTasks) {
                    const {
                        id,
                        root_id,
                        workflow_run_id,
                        workflow_dependencies,
                        parent_id,
                        status,
                        task_name,
                        args,
                        queue,
                        max_retries,
                        priority,
                        timeout_seconds,
                        idempotency_key
                    } = task;
                    await client.query(sql.ENQUEUE_TASKS, [
                        id,
                        id,
                        root_id,
                        workflow_run_id,
                        workflow_dependencies,
                        parent_id,
                        status,
                        task_name,
                        args,
                        queue,
                        max_retries,
                        priority,
                        timeout_seconds,
                        idempotency_key
                    ]);
                }
                await client.query('COMMIT');
                return serializedTasks.map(st => st.id);
            } catch (error) {
                await client.query('ROLLBACK');
                throw error;
            }
        });
    }

    async dequeue(
        { numTasks, executorId, queueName, concurrencyLimit, taskNames }: {
            numTasks: number,
            executorId: string,
            queueName: string,
            concurrencyLimit?: number
            taskNames: string[],
        }
    ): Promise<SerializedTask[]> {
        if (numTasks !== 1) {
            throw new Error("Dequeued multiple tasks is not implemented. Set numTasks to 1.");
        }
        hyrexLogger.info("flow-control", `Dequeuing. concurrencyLimit=${concurrencyLimit}`, 'blue')

        const result = await this.queryWithRetry(async (client) => {
            let result;
            if (concurrencyLimit) {
                result = await client.query<SerializedTask>(
                    sql.FETCH_TASK_WITH_CONCURRENCY_LIMIT,
                    [queueName, concurrencyLimit, executorId, taskNames]
                );
            } else {
                result = await client.query<SerializedTask>(
                    createDequeueQuery(taskNames),
                    [queueName, executorId, ...taskNames]
                );
            }
            return result.rows;
        });

        return result
    }

    async markTaskFailed(taskId: UUID): Promise<void> {
        const client = await this.pool.connect()
        try {
            await client.query(sql.MARK_TASK_FAILED, [taskId])
        } finally {
            client.release();
        }
    }

    async markTaskSuccess(taskId: UUID): Promise<void> {
        const client = await this.pool.connect()
        try {
            await client.query(sql.MARK_TASK_SUCCESS, [taskId])
        } finally {
            client.release();
        }
    }

    async markTaskCanceled(taskId: UUID): Promise<boolean> {
        const client = await this.pool.connect()
        try {
            const result = await client.query(sql.MARK_TASK_CANCELED, [taskId])
            return result.rows.length > 0
        } finally {
            client.release();
        }
    }

    async updateTaskHeartbeat(heartbeatMsg: TaskHeartbeatResultMessage): Promise<void> {
        console.log("It would update the heartbeat here...", heartbeatMsg)
    }

    async updateExecutorHeartbeat(heartbeatMsg: ExecutorHeartbeatResultMessage): Promise<void> {
        console.log("It would update the heartbeat here...", heartbeatMsg)
    }

    async updateExecutorHeartbeats({ executorIds }: { executorIds: string[] }): Promise<void> {
        hyrexLogger.info('durability', `BATCH_UPDATE_HEARTBEAT: ${executorIds}`, 'brightRed')
        return this.queryWithRetry(async (client) => {
            await client.query(sql.BATCH_UPDATE_HEARTBEAT_ON_EXECUTORS, [executorIds])
            const logId = uuidv7()
            await client.query(sql.BATCH_UPDATE_HEARTBEAT_LOG, [logId, executorIds])
        })
    }

    async registerExecutor({ queues, queuePattern, executorId, executorName, workerName }: {
        queues: string[],
        queuePattern: HyrexQueuePattern,
        executorId: string,
        executorName: string,
        workerName: string
    }): Promise<void> {
        const client = await this.pool.connect()
        try {
            await client.query(sql.REGISTER_EXECUTOR, [executorId, executorName, queuePattern.pattern, queues, workerName])
        } finally {
            client.release();
        }
    }

    async updateQueuesOnExecutor({ executorId, queues }: { executorId: string, queues: HyrexQueue[] }) {
        const client = await this.pool.connect()
        try {
            await client.query(sql.UPDATE_QUEUES_ON_EXECUTOR, [executorId, queues])
        } finally {
            client.release();
        }
    }

    async disconnectExecutor({ executorId, stats }: { executorId: string, stats: object }): Promise<void> {
        const client = await this.pool.connect()
        try {
            await client.query(sql.DISCONNECT_EXECUTOR, [executorId, JSON.stringify(stats)])
        } finally {
            client.release();
        }
    }

    async emitExecutorStats({ executorId, stats }: {
        executorId: string,
        stats: object
    }): Promise<'ACCEPTED' | 'REJECTED'> {
        const client = await this.pool.connect()
        try {
            const result = await client.query<{
                result: 'ACCEPTED' | 'REJECTED',
                status: string,
                last_heartbeat: Date,
                stats: any;
            }>(sql.UPDATE_EXECUTOR_STATS, [executorId, JSON.stringify(stats)])

            if (result.rows.length === 0) {
                throw new Error(`No executor found with id ${executorId}`);
            }

            return result.rows[0].result
        } finally {
            client.release();
        }
    }

    async listen(hyrexPgListener: DispatcherListenerCallbacks) {
        hyrexLogger.info("postgres", "Starting postgres listener.", "dim")
        const TASK_HEARTBEAT = "TASK_HEARTBEAT"
        const TASK_CANCEL = "TASK_CANCEL"
        // For the listener, we need a dedicated client connection that stays open
        const client = await this.pool.connect()
        try {
            await client.query(`LISTEN "${TASK_HEARTBEAT}"`);
            await client.query(`LISTEN "${TASK_CANCEL}"`);

            client.on("notification", async (pg_msg: Notification) => {
                if (pg_msg.channel === TASK_HEARTBEAT) {
                    const taskId = uuidSchema.parse(pg_msg.payload)
                    const message: AdminMessage = {
                        messageType: "TASK_HEARTBEAT",
                        taskId
                    }
                    await hyrexPgListener.taskHeartbeatCallback(message)
                } else if (pg_msg.channel === TASK_CANCEL) {
                    const taskId = uuidSchema.parse(pg_msg.payload)
                    const message: AdminMessage = {
                        messageType: "TASK_CANCEL",
                        taskId
                    }
                    await hyrexPgListener.taskCancelCallback(message)
                } else {
                    console.error(`Notification channel not recognized: ${pg_msg.channel}`);
                }
            })
        } catch (error) {
            client.release();
            throw error;
        }
        // Note: We don't release the client in the finally block for the listener
        // as it needs to maintain an open connection
    }

    async saveResult(taskId: UUID, result: JsonType): Promise<boolean> {
        const client = await this.pool.connect()
        try {
            await client.query(sql.SAVE_RESULT, [taskId, result])
        } finally {
            client.release();
        }
        return true
    }

    async getResult(taskId: UUID): Promise<JsonType> {
        const client = await this.pool.connect()
        try {
            const { rows } = await client.query<JsonType>(sql.FETCH_RESULT, [taskId])
            return rows[0]
        } finally {
            client.release()
        }
    }

    async attemptRetry(taskId: UUID): Promise<void> {
        const newTaskId = uuidv7()
        return this.queryWithRetry(async (client) => {
            await client.query(sql.CONDITIONALLY_RETRY_TASK, [taskId, newTaskId])
        })
    }

    async fetchActiveQueueNames({ queuePattern }: { queuePattern: string }): Promise<string[]> {
        return this.queryWithRetry(async (client) => {
            const sqlPattern = globToSqlLike(queuePattern);
            const { rows } = await client.query<{ queue: string }>(
                sql.FETCH_ACTIVE_QUEUE_NAMES,
                [sqlPattern]
            );
            return rows.map(r => r.queue);
        });
    }

    async registerTask({ taskName, taskConfig, sourceCode }: {
        taskName: string,
        taskConfig?: HyrexTaskConfig,
        sourceCode?: string
    }) {
        return this.queryWithRetry(async (client) => {
            await client.query(sql.UPSERT_TASK, [taskName, taskConfig?.cron, sourceCode])
            const cronJobName = `ScheduledTask-${taskName}`
            if (taskConfig?.cron) {
                const currentId = uuidv7()
                const taskRequest: SerializedTaskRequest = {
                    id: currentId,
                    durable_id: currentId,
                    workflow_run_id: null,
                    workflow_dependencies: null,
                    root_id: currentId,
                    parent_id: null,
                    queue: typeof taskConfig.queue === 'string' ? taskConfig.queue : taskConfig.queue.name,
                    status: 'queued',
                    task_name: taskName,
                    args: {},
                    max_retries: taskConfig.maxRetries,
                    priority: taskConfig.priority,
                    timeout_seconds: taskConfig.timeoutSeconds || null,
                    idempotency_key: taskConfig.idempotencyKey || null
                }

                const insertTaskCommand = createInsertTaskCronExpression(taskRequest)
                await client.query(cronSQL.CREATE_CRON_JOB_FOR_TASK, [
                    taskConfig.cron, insertTaskCommand, cronJobName
                ])
            } else {
                await client.query(cronSQL.TURN_OFF_CRON_FOR_TASK, [cronJobName])
            }

        })
    }

    // Cron methods
    async acquireSchedulerLock({ workerId, workerName }: {
        workerId: string,
        workerName: string
    }): Promise<number | null> {
        const lockDuration = "1 minute"
        return this.queryWithRetry(async (client) => {
            const { rows } = await client.query<{
                lockid: string
            }>(cronSQL.ACQUIRE_SCHEDULER_LOCK, [workerName, lockDuration])
            if (rows.length > 0) {
                return Number(rows[0].lockid)
            } else {
                // No rows => couldn't acquire
                return null
            }
        })
    }

    async pullCronJobExpressions(): Promise<CronJob[]> {
        return this.queryWithRetry(async (client) => {
            const { rows } = await client.query<CronJob>(cronSQL.PULL_ACTIVE_CRON_EXPRESSIONS)
            return rows
        })
    }

    async updateLockHeartbeat({ lockId }: { lockId: number }): Promise<void> {

    }

    async releaseSchedulerLock({ workerName }: { workerName: string }): Promise<void> {
        return this.queryWithRetry(async (client) => {
            await client.query(cronSQL.RELEASE_SCHEDULER_LOCK, [workerName])
        })
    }

    async scheduleCronJobRuns(cronJobRuns: CronJobRun[]): Promise<void> {
        const allSameId = cronJobRuns.every(job => job.jobid === cronJobRuns[0].jobid)
        if (!allSameId) {
            console.log("Got jobIds", cronJobRuns.map(o => o.jobid), cronJobRuns)
            throw new Error("All cronJobsRuns submitted here need to have the same job id.")
        }

        if (cronJobRuns.length === 0) {
            return
        }

        const result = await this.queryWithRetry(async (client) => {

            const { sql, values } = cronSQL.cronJobRunsToSQL(cronJobRuns)
            // hyrexLogger.info("cron-scheduling", `<====== Running SQL =======>:\n\n${sql}\n\n${values}\n\n<==== DONE =====>\n\n`, 'dim')
            await client.query(sql, values)
        })


        await this.updateCronJobConfirmationTimestamp(cronJobRuns[0].jobid)

        return result
    }

    async updateCronJobConfirmationTimestamp(jobId: number): Promise<void> {
        await this.queryWithRetry(async (client) => {
            await client.query(cronSQL.UPDATE_CRON_JOB_CONFIRMATION_TS, [jobId])
        })
    }

    async executeQueuedCronJobRun(): Promise<string | null> {
        return this.queryWithRetry(async (client) => {
            const { rows } = await client.query<{
                execute_queued_command: string | null
            }>("SELECT execute_queued_command();")
            if (rows.length === 0) {
                throw new Error("Hyrex framework error.")
            }
            return rows[0].execute_queued_command
        })
    }

    async registerCronSQLQuery({ cronJobName, cronSqlQuery, cronExpr, shouldBackfill }: {
        cronJobName: string;
        cronSqlQuery: string;
        cronExpr: string,
        shouldBackfill: boolean
    }): Promise<void> {
        return this.queryWithRetry(async (client) => {
            await client.query(cronSQL.CREATE_CRON_JOB_FOR_SQL_QUERY, [cronExpr, cronSqlQuery, cronJobName, shouldBackfill])
        })
    }

    async setLogLink({ taskId, logLink }: { taskId: string, logLink: string }): Promise<void> {
        return this.queryWithRetry(async (client) => {
            await client.query(sql.SET_LOG_LINK, [taskId, logLink])
        })
    }

    async writeS3Logs(taskId: string, logs: string[]): Promise<void> {
        if (!this.bucket || !this.s3Client) {
            hyrexLogger.warn('postgres', 'S3 client not initialized, skipping log upload', 'yellow')
            return
        }

        if (!taskId) {
            throw new Error('No taskId provided for writeS3Logs')
        }

        const objectKey = `hyrex-logs/${taskId}.log`
        const putObjectCommand: PutObjectCommand = new PutObjectCommand({
            Bucket: this.bucket,
            Key: objectKey,
            Body: logs.join(''),
            ContentType: 'text/plain',
        })

        try {
            await this.s3Client.send(putObjectCommand)

            // Construct the S3 link and update it in the database
            const logLink = `s3://${this.bucket}/${objectKey}`
            await this.setLogLink({ taskId, logLink })

            hyrexLogger.info('postgres', `Logs successfully uploaded to S3. taskId=${taskId}, logLink=${logLink}`, 'green')
        } catch (error: any) {
            // Handle S3 errors gracefully
            if (error.Code === 'AccessDenied' || error.name === 'AccessDenied') {
                hyrexLogger.error('postgres', `S3 Access Denied: Unable to upload logs for task ${taskId}. Please check S3 bucket permissions.`, 'red')
            } else if (error.$metadata?.httpStatusCode === 403) {
                hyrexLogger.error('postgres', `S3 Permission Error (403): Unable to upload logs for task ${taskId}. Please verify IAM permissions for bucket: ${this.bucket}`, 'red')
            } else {
                hyrexLogger.error('postgres', `Failed to upload logs to S3 for task ${taskId}: ${error.message || error}`, 'red')
            }
            throw error
        }
    }

    // Workflow
    async registerWorkflow({ workflowName, sourceCode, workflowDagJson }: {
        workflowName: string,
        sourceCode: string,
        workflowDagJson: WorkflowDagJson
    }): Promise<void> {
        hyrexLogger.info('workflow', JSON.stringify(workflowDagJson, null, 2), 'brightBlue')
        return this.queryWithRetry(async (client) => {
            const cronExpr = null
            await client.query(workflowSQL.UPSERT_WORKFLOW, [workflowName, cronExpr, sourceCode, workflowDagJson])
        })
    }

    async sendWorkflowRun({ serializedWorkflowRunRequest }: {
        serializedWorkflowRunRequest: SerializedWorkflowRunRequest
    }): Promise<string> {
        return this.queryWithRetry(async (client) => {
            const { id, workflow_name, args, queue, timeout_seconds, idempotency_key } = serializedWorkflowRunRequest
            const { rows } = await client.query<{
                id: string
            }>(workflowSQL.INSERT_WORKFLOW_RUN, [id, workflow_name, args, queue, timeout_seconds, idempotency_key])
            if (rows.length !== 1) {
                throw new Error("Insert workflow run failed.")
            }

            return rows[0].id
        })
    }

    async advanceWorkflowRun({ workflowRunId }: { workflowRunId: UUID }): Promise<void> {
        hyrexLogger.info('workflow', `Advancing workflow run ${workflowRunId}`, "brightBlue")
        return this.queryWithRetry(async (client) => {
            const { rows } = await client.query<{
                id: UUID,
                status: WorkflowRunStatus
            }>(workflowSQL.SET_WORKFLOW_RUN_STATUS_BASED_ON_TASK_RUNS, [workflowRunId])

            if (rows.length !== 1) {
                hyrexLogger.warn('workflow', 'Result of SET_WORKFLOW_RUN_STATUS_BASED_ON_TASK_RUNS is not one row.', 'red')
                return
            }

            const workflowStatus = rows[0].status
            if (workflowStatus === 'failed' || workflowStatus === 'success') {
                if (workflowStatus === 'failed') {
                    hyrexLogger.error('workflow', `Workflow ${workflowRunId} failed. Skipping all tasks.`, 'brightBlue')
                    await client.query(workflowSQL.SKIP_WAITING_TASK_FOR_WORKFLOW_RUN_ID, [workflowRunId])
                }
                return // workflowStatus
            }

            await client.query(workflowSQL.ADVANCE_WORKFLOW_RUN, [workflowRunId])

        })
    }
}
