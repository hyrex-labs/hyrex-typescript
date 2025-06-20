import { HyrexDispatcher, SerializedTask, SerializedTaskRequest } from "../HyrexDispatcher";
import { HyrexTaskConfig, JsonType, UUID, uuidSchema } from "../../utils";
import { Notification, Pool, PoolClient } from 'pg';
import { string } from "zod";
import { DispatcherListenerCallbacks } from "../HyrexDispatcher";
import { TaskHeartbeatResultMessage, AdminMessage, ExecutorHeartbeatResultMessage, HyrexAppInfo } from "../../types";
import { HyrexQueue, HyrexQueuePattern } from "../../HyrexQueue";
import { v7 as uuidv7 } from 'uuid';
import { CronJob, CronJobRun } from "../../cron/HyrexCronScheduler";
import { hyrexLogger } from "../../logging/FrameworkLogger";
import { createInsertTaskCronExpression } from "./legacy-sql/cronSql";
import { HyrexWorkflowBuilder, WorkflowDagJson } from "../../workflow/HyrexWorkflowBuilder";
import { z } from "zod";
import { SerializedWorkflowRunRequest, WorkflowRunStatus } from "../../workflow/HyrexWorkflow";
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { envVariables } from "../../EnvironmentVariables";

// ──────────────────────────────────────────────────────────────
// sqlc-generated helpers (new, typed queries)
// We will gradually migrate PostgresDispatcher to these helpers.
// For now we only use a small subset so we import them explicitly.
// ──────────────────────────────────────────────────────────────

import {
    fetchActiveQueueNames as fetchActiveQueueNamesQuery,
    FetchActiveQueueNamesRow,
    registerExecutor as registerExecutorQuery,
    RegisterExecutorArgs,
    createTaskRun as createTaskRunQuery,
    CreateTaskRunArgs,
    transitionTaskState as transitionTaskStateQuery,
    TransitionTaskStateArgs,
    saveResult as saveResultQuery,
    SaveResultArgs,
    fetchResult as fetchResultQuery,
    FetchResultArgs,
    updateQueuesOnExecutor as updateQueuesOnExecutorQuery,
    UpdateQueuesOnExecutorArgs,
    disconnectExecutor as disconnectExecutorQuery,
    DisconnectExecutorArgs,
    updateExecutorStats as updateExecutorStatsQuery,
    UpdateExecutorStatsArgs,
    batchUpdateHeartbeatOnExecutors as batchUpdateHeartbeatOnExecutorsQuery,
    BatchUpdateHeartbeatOnExecutorsArgs,
    batchUpdateHeartbeatLog as batchUpdateHeartbeatLogQuery,
    BatchUpdateHeartbeatLogArgs,
    conditionallyRetryTask as conditionallyRetryTaskQuery,
    ConditionallyRetryTaskArgs,
    setLogLink as setLogLinkQuery,
    SetLogLinkArgs,
    registerAppInfo as registerAppInfoQuery,
    RegisterAppInfoArgs,
    registerTaskDef,
    triggerExecuteQueuedCronJob as triggerExecuteQueuedCronJobQuery,
    scheduleCronJobRunsJson as scheduleCronJobRunsQuery,
    ScheduleCronJobRunsJsonArgs,
    createTables, createFunctions, createEnums,
    fetchTask,
    fetchTaskWithConcurrencyLimit,
    createCronJobForSqlQuery,
    CreateCronJobForSqlQueryArgs,
    fillHistoricalTaskStatusCountsTableQuery,
    setOrphanedTaskExecutionToLostAndRetryQuery,
    setExecutorToLostIfNoHeartbeatQuery,
    createCronJobForTask as createCronJobForTaskQuery,
    CreateCronJobForTaskArgs,
    turnOffCronForTask as turnOffCronForTaskQuery,
    TurnOffCronForTaskArgs,
    acquireSchedulerLock as acquireSchedulerLockQuery,
    AcquireSchedulerLockArgs,
    pullActiveCronExpressions as pullActiveCronExpressionsQuery,
    releaseSchedulerLock as releaseSchedulerLockQuery,
    ReleaseSchedulerLockArgs,
    updateCronJobConfirmationTs as updateCronJobConfirmationTsQuery,
    UpdateCronJobConfirmationTsArgs,
    registerWorkflow as registerWorkflowQuery,
    RegisterWorkflowArgs,
    createWorkflowRun as createWorkflowRunQuery,
    CreateWorkflowRunArgs,
    setWorkflowRunStatusBasedOnTaskRuns as setWorkflowRunStatusBasedOnTaskRunsQuery,
    SetWorkflowRunStatusBasedOnTaskRunsArgs,
    skipWaitingTaskForWorkflowRunId as skipWaitingTaskForWorkflowRunIdQuery,
    SkipWaitingTaskForWorkflowRunIdArgs,
    advanceWorkflowRunFunc,
    AdvanceWorkflowRunFuncArgs
} from "./sqlc-sdk-client";

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
        await this.queryWithRetry(async (client) => {
            const args: RegisterAppInfoArgs = {
                id: '1',
                appInfo: hyrexAppInfo
            };
            await registerAppInfoQuery(client, args);
        });
    }

    async initPostgresDB(): Promise<void> {
        hyrexLogger.info("postgres", "Initializing schema via sqlc createTables()/createFunctions()", "magenta")

        await this.queryWithRetry(async (client) => {
            await createEnums(client);
            await createTables(client);
            await createFunctions(client); // Create PL/pgSQL helper functions
        });

        // Register built-in cron maintenance jobs using SDK methods
        await this.queryWithRetry(async (client) => {
            const fillHistoryArgs: CreateCronJobForSqlQueryArgs = {
                jobname: "FillHistoryTaskCountsTable",
                schedule: "* * * * *",
                command: fillHistoricalTaskStatusCountsTableQuery,
                shouldBackfill: false
            };
            await createCronJobForSqlQuery(client, fillHistoryArgs);

            const orphanedTaskArgs: CreateCronJobForSqlQueryArgs = {
                jobname: "SetOrphanedRunningTaskToLost",
                schedule: "* * * * *",
                command: setOrphanedTaskExecutionToLostAndRetryQuery,
                shouldBackfill: false
            };
            await createCronJobForSqlQuery(client, orphanedTaskArgs);

            const executorHeartbeatArgs: CreateCronJobForSqlQueryArgs = {
                jobname: "SetExecutorToLostIfNoHeartbeat",
                schedule: "* * * * *",
                command: setExecutorToLostIfNoHeartbeatQuery,
                shouldBackfill: false
            };
            await createCronJobForSqlQuery(client, executorHeartbeatArgs);
        });

        hyrexLogger.info("postgres", "initPostgresDB finished successfully.", "magenta")
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
                const enqueuedIds: UUID[] = [];

                for (const task of serializedTasks) {
                    const createTaskArgs: CreateTaskRunArgs = {
                        id: task.id,
                        durableId: task.durable_id,
                        rootId: task.root_id,
                        parentId: task.parent_id || null as any, // null for no parent
                        status: task.status === 'queued' ? 'QUEUED' : 'AWAIT_DEPS',
                        taskName: task.task_name,
                        args: task.args,
                        queue: task.queue,
                        maxRetries: task.max_retries,
                        priority: task.priority,
                        timeoutSeconds: task.timeout_seconds || null as any,
                        idempotencyKey: task.idempotency_key || null as any,
                        scheduledStart: null as any, // Not used for regular enqueue
                        workflowRunId: task.workflow_run_id || null as any,
                        workflowDependencies: task.workflow_dependencies || []
                    };

                    const result = await createTaskRunQuery(client, createTaskArgs);

                    // createTaskRun returns null if there was an idempotency conflict
                    if (result && result.id) {
                        enqueuedIds.push(result.id);
                    } else {
                        // Still count the task as "enqueued" even if it was a duplicate
                        // to maintain backwards compatibility
                        enqueuedIds.push(task.id);
                    }
                }

                await client.query('COMMIT');
                return enqueuedIds;
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
            if (concurrencyLimit) {
                const args = {
                    executorId,
                    queue: queueName,
                    taskNames,
                    concurrencyLimit
                }
                const row = await fetchTaskWithConcurrencyLimit(client, args)

                if (!row) {
                    return [];
                }

                // Map the row to SerializedTask format
                const task: SerializedTask = {
                    id: row.id,
                    durable_id: row.durableId,
                    root_id: row.rootId,
                    attempt_number: row.attemptNumber,
                    max_retries: row.maxRetries,
                    workflow_run_id: row.workflowRunId,
                    parent_id: row.parentId,
                    task_name: row.taskName,
                    args: row.args,
                    queue: row.queue,
                    priority: row.priority.toString(),
                    timeout_seconds: row.timeoutSeconds,
                    scheduled_start: row.scheduledStart?.toISOString() || null,
                    queued: row.queued?.toISOString() || null,
                    started: row.started?.toISOString() || null
                };
                return [task];

            } else {
                // For non-concurrency limited case, pass all task names at once
                const args = {
                    queue: queueName,
                    taskNames: taskNames,
                    executorId: executorId
                }
                const row = await fetchTask(client, args)

                if (row) {
                    // Map the row to SerializedTask format
                    const task: SerializedTask = {
                        id: row.id,
                        durable_id: row.durableId,
                        root_id: row.rootId,
                        attempt_number: row.attemptNumber,
                        max_retries: row.maxRetries,
                        workflow_run_id: row.workflowRunId,
                        parent_id: row.parentId,
                        task_name: row.taskName,
                        args: row.args,
                        queue: row.queue,
                        priority: row.priority.toString(),
                        timeout_seconds: row.timeoutSeconds,
                        scheduled_start: row.scheduledStart?.toISOString() || null,
                        queued: row.queued?.toISOString() || null,
                        started: row.started?.toISOString() || null
                    };
                    return [task];
                }
                return [];
            }
        });

        return result
    }

    async markTaskFailed(taskId: UUID): Promise<void> {
        await this.queryWithRetry(async (client) => {
            const args: TransitionTaskStateArgs = {
                taskId: taskId,
                nextState: 'FAILED'
            };
            await transitionTaskStateQuery(client, args);
        });
    }

    async markTaskSuccess(taskId: UUID): Promise<void> {
        await this.queryWithRetry(async (client) => {
            const args: TransitionTaskStateArgs = {
                taskId: taskId,
                nextState: 'SUCCESS'
            };
            await transitionTaskStateQuery(client, args);
        });
    }

    async markTaskCanceled(taskId: UUID): Promise<boolean> {
        return this.queryWithRetry(async (client) => {
            const args: TransitionTaskStateArgs = {
                taskId: taskId,
                nextState: 'CANCELED'
            };
            const result = await transitionTaskStateQuery(client, args);
            return result !== null;
        });
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
            const args: BatchUpdateHeartbeatOnExecutorsArgs = {
                executorIds: executorIds
            };
            await batchUpdateHeartbeatOnExecutorsQuery(client, args);

            // Log the heartbeat update
            const logId = uuidv7();
            const logArgs: BatchUpdateHeartbeatLogArgs = {
                logId: logId,
                executorIds: executorIds
            };
            await batchUpdateHeartbeatLogQuery(client, logArgs);
        });
    }

    async registerExecutor({ queues, queuePattern, executorId, executorName, workerName }: {
        queues: string[],
        queuePattern: HyrexQueuePattern,
        executorId: string,
        executorName: string,
        workerName: string
    }): Promise<void> {
        return this.queryWithRetry(async (client) => {
            const args: RegisterExecutorArgs = {
                id: executorId,
                name: executorName,
                queuePattern: queuePattern.pattern,
                queues,
                workerName
            }

            await registerExecutorQuery(client, args);
        });
    }

    async updateQueuesOnExecutor({ executorId, queues }: { executorId: string, queues: HyrexQueue[] }) {
        await this.queryWithRetry(async (client) => {
            const args: UpdateQueuesOnExecutorArgs = {
                id: executorId,
                queues: queues.map(q => q.name)
            };
            await updateQueuesOnExecutorQuery(client, args);
        });
    }

    async disconnectExecutor({ executorId, stats }: { executorId: string, stats: object }): Promise<void> {
        await this.queryWithRetry(async (client) => {
            const args: DisconnectExecutorArgs = {
                id: executorId,
                stats: stats
            };
            await disconnectExecutorQuery(client, args);
        });
    }

    async emitExecutorStats({ executorId, stats }: {
        executorId: string,
        stats: object
    }): Promise<'ACCEPTED' | 'REJECTED'> {
        return this.queryWithRetry(async (client) => {
            const args: UpdateExecutorStatsArgs = {
                id: executorId,
                stats: stats
            };

            const result = await updateExecutorStatsQuery(client, args);

            if (!result) {
                throw new Error(`No executor found with id ${executorId}`);
            }

            return result.result as 'ACCEPTED' | 'REJECTED';
        });
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
        await this.queryWithRetry(async (client) => {
            const args: SaveResultArgs = {
                taskId: taskId,
                result: result
            };
            await saveResultQuery(client, args);
        });
        return true;
    }

    async getResult(taskId: UUID): Promise<JsonType> {
        return this.queryWithRetry(async (client) => {
            const args: FetchResultArgs = {
                taskId: taskId
            };
            const results = await fetchResultQuery(client, args);
            return results.length > 0 ? results[0].result : null;
        });
    }

    async attemptRetry(taskId: UUID): Promise<void> {
        const newTaskId = uuidv7();
        await this.queryWithRetry(async (client) => {
            const args: ConditionallyRetryTaskArgs = {
                existingTaskId: taskId,
                newTaskId: newTaskId,
                timeoutSeconds: null
            };
            await conditionallyRetryTaskQuery(client, args);
        });
    }

    async fetchActiveQueueNames({ queuePattern }: { queuePattern: string }): Promise<string[]> {
        return this.queryWithRetry(async (client) => {
            const sqlPattern = globToSqlLike(queuePattern);

            const rows: FetchActiveQueueNamesRow[] = await fetchActiveQueueNamesQuery(client, { queuePattern: sqlPattern });

            return rows.map(r => r.queue);
        });
    }

    async updateLockHeartbeat({ lockId }: { lockId: number }): Promise<void> {

    }

    async registerTask({ taskName, taskConfig, sourceCode, argSchema }: {
        taskName: string,
        taskConfig?: HyrexTaskConfig,
        sourceCode?: string,
        argSchema?: z.ZodType
    }) {
        return this.queryWithRetry(async (client) => {
            await registerTaskDef(client, {
                taskName: taskName,
                cronExpr: taskConfig?.cron || null,
                sourceCode: sourceCode || null,
                argSchema: argSchema ? JSON.stringify(argSchema._def) : null
            })
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
                const createCronArgs: CreateCronJobForTaskArgs = {
                    schedule: taskConfig.cron,
                    command: insertTaskCommand,
                    jobname: cronJobName
                };
                await createCronJobForTaskQuery(client, createCronArgs);
            } else {
                const turnOffArgs: TurnOffCronForTaskArgs = {
                    jobname: cronJobName
                };
                await turnOffCronForTaskQuery(client, turnOffArgs);
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
            const args: AcquireSchedulerLockArgs = {
                workerName: workerName,
                duration: lockDuration as any // PostgreSQL will handle the interval casting
            };
            const result = await acquireSchedulerLockQuery(client, args);
            if (result) {
                return Number(result.lockid);
            } else {
                // No rows => couldn't acquire
                return null
            }
        })
    }

    async pullCronJobExpressions(): Promise<CronJob[]> {
        return this.queryWithRetry(async (client) => {
            const rows = await pullActiveCronExpressionsQuery(client);
            // Map the sqlc-generated rows to CronJob interface
            return rows.map((row) => ({
                jobid: Number(row.jobid),
                schedule: row.schedule || '',
                command: row.command,
                active: row.active,
                jobname: row.jobname,
                activated_at: row.activatedAt || new Date(),
                scheduled_jobs_confirmed_until: row.scheduledJobsConfirmedUntil || new Date(),
                should_backfill: row.shouldBackfill || false
            }));
        })
    }

    async releaseSchedulerLock({ workerName }: { workerName: string }): Promise<void> {
        return this.queryWithRetry(async (client) => {
            const args: ReleaseSchedulerLockArgs = {
                workerName: workerName
            };
            await releaseSchedulerLockQuery(client, args);
        })
    }

    async scheduleCronJobRuns(cronJobRuns: CronJobRun[]): Promise<void> {
        hyrexLogger.info("cron-scheduling", `scheduleCronJobRuns ${cronJobRuns}`, "dim")

        if (cronJobRuns.length === 0) {
            return
        }

        await this.queryWithRetry(async (client) => {
            const args: ScheduleCronJobRunsJsonArgs = {
                runsJson: JSON.stringify(cronJobRuns.map(run => ({
                    jobid: run.jobid,
                    command: run.command,
                    schedule_time: run.schedule_time.toISOString()
                })))
            };

            const queryResult = await scheduleCronJobRunsQuery(client, args);

            if (!queryResult) {
                throw new Error("Failed to schedule cron job runs");
            }

            const result = queryResult.result;

            if (!result.success) {
                throw new Error(`Failed to schedule cron job runs: ${result.message}`);
            }

            hyrexLogger.info("cron-scheduling",
                `Scheduled cron jobs: ${result.message}, inserted: ${result.inserted_count}`,
                "dim");
        });
    }

    // Note: updateCronJobConfirmationTimestamp is now handled within the schedule_cron_job_runs PL/pgSQL function
    async updateCronJobConfirmationTimestamp(jobId: number): Promise<void> {
        await this.queryWithRetry(async (client) => {
            const args: UpdateCronJobConfirmationTsArgs = {
                jobid: String(jobId)
            };
            await updateCronJobConfirmationTsQuery(client, args);
        })
    }

    async executeQueuedCronJobRun(): Promise<string | null> {
        return this.queryWithRetry(async (client) => {
            const result = await triggerExecuteQueuedCronJobQuery(client)
            if (result === null) {
                throw new Error("Hyrex framework error.")
            }
            return result.result
        })
    }


    async setLogLink({ taskId, logLink }: { taskId: string, logLink: string }): Promise<void> {
        await this.queryWithRetry(async (client) => {
            const args: SetLogLinkArgs = {
                id: taskId,
                logLink: logLink
            };
            await setLogLinkQuery(client, args);
        });
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
            const args: RegisterWorkflowArgs = {
                workflowName: workflowName,
                cronExpr: cronExpr,
                sourceCode: sourceCode,
                dagStructure: workflowDagJson
            };
            await registerWorkflowQuery(client, args);
        })
    }

    async sendWorkflowRun({ serializedWorkflowRunRequest }: {
        serializedWorkflowRunRequest: SerializedWorkflowRunRequest
    }): Promise<string> {
        return this.queryWithRetry(async (client) => {
            const { id, workflow_name, args, queue, timeout_seconds, idempotency_key } = serializedWorkflowRunRequest
            const triggerArgs: CreateWorkflowRunArgs = {
                workflowRunId: id,
                workflowName: workflow_name,
                args: args,
                queue: queue,
                timeoutSeconds: timeout_seconds || 0,
                idempotencyKey: idempotency_key || ''
            };
            const result = await createWorkflowRunQuery(client, triggerArgs);

            if (!result || !result.result) {
                throw new Error("Trigger workflow failed.")
            }

            return id;
        })
    }

    async advanceWorkflowRun({ workflowRunId }: { workflowRunId: UUID }): Promise<void> {
        hyrexLogger.info('workflow', `Advancing workflow run ${workflowRunId}`, "brightBlue")
        return this.queryWithRetry(async (client) => {
            const statusArgs: SetWorkflowRunStatusBasedOnTaskRunsArgs = {
                workflowRunId: workflowRunId
            };
            const statusResult = await setWorkflowRunStatusBasedOnTaskRunsQuery(client, statusArgs);

            if (!statusResult) {
                hyrexLogger.warn('workflow', 'Result of SET_WORKFLOW_RUN_STATUS_BASED_ON_TASK_RUNS is not one row.', 'red')
                return
            }

            const workflowStatus = statusResult.setWorkflowRunStatusBasedOnTaskRuns
            if (workflowStatus === 'FAILED' || workflowStatus === 'SUCCESS') {
                if (workflowStatus === 'FAILED') {
                    hyrexLogger.error('workflow', `Workflow ${workflowRunId} failed. Skipping all tasks.`, 'brightBlue')
                    const skipArgs: SkipWaitingTaskForWorkflowRunIdArgs = {
                        workflowRunId: workflowRunId
                    };
                    await skipWaitingTaskForWorkflowRunIdQuery(client, skipArgs);
                }
                return // workflowStatus
            }

            const advanceArgs: AdvanceWorkflowRunFuncArgs = {
                workflowRunId: workflowRunId
            };
            await advanceWorkflowRunFunc(client, advanceArgs);

        })
    }
}
