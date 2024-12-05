import { HyrexDispatcher, SerializedTask, SerializedTaskRequest } from "../HyrexDispatcher";
import { JsonType, UUID, uuidSchema } from "../../utils";
import { Notification, Pool } from 'pg';
import * as sql from "./sql"
import { string } from "zod";
import { DispatcherListenerCallbacks } from "../HyrexDispatcher";
import { TaskHeartbeatResultMessage, ListenerMessage, ExecutorHeartbeatResultMessage } from "../../types";

type HyrexPostgresDispatcherConfig = {
    conn: string
}

export class PostgresDispatcher implements HyrexDispatcher {
    private pool: Pool

    constructor(private config: HyrexPostgresDispatcherConfig) {
        this.pool = new Pool({
            connectionString: config.conn,
            max: 20,
            idleTimeoutMillis: 30000,
        })

        console.log("Successfully created postgres pool!")
    }

    async initPostgresDB() {
        const client = await this.pool.connect()
        try {
            await client.query(sql.CreateHyrexTaskTable);
            await client.query(sql.CreateExecutorTable);
            await client.query(sql.CreateResultsTable);
            console.log("initPostgresDB finished successfully.");
        } catch (error) {
            console.error(error);
        } finally {
            client.release();
        }
    }

    async enqueue(serializedTasks: SerializedTaskRequest[]): Promise<UUID[]> {
        const maxRetries = 3;
        const retryDelay = 1000; // 1 second

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            const client = await this.pool.connect()
            try {
                await client.query('BEGIN');

                for (const task of serializedTasks) {
                    const { id, task_name, args, queue, max_retries, priority } = task;
                    await client.query(sql.ENQUEUE_TASKS, [
                        id,
                        id,
                        task_name,
                        args,
                        queue,
                        max_retries,
                        priority,
                    ]);
                }

                await client.query('COMMIT');
                return serializedTasks.map(st => st.id);
            } catch (error) {
                await client.query('ROLLBACK');
                console.error("Error enqueuing tasks:", error);
                throw error;
            } finally {
                client.release();
            }
        }
        throw new Error('Enqueue failed and max retries reached')
    }

    async dequeue(
        { numTasks, executorId, queue }: { numTasks: number, executorId: string, queue: string }
            = { numTasks: 1, executorId: "UnknownExecutor", queue: "*" }
    ): Promise<SerializedTask[]> {
        if (numTasks !== 1) {
            throw new Error("Dequeued multiple tasks is not implemented. Set numTasks to 1.");
        }

        const client = await this.pool.connect()
        const dequeuedTasks: SerializedTask[] = []
        try {
            let result
            if (queue === "*") {
                result = await client.query<SerializedTask>(sql.FETCH_TASK_FROM_ANY_QUEUE, [executorId])
            } else {
                result = await client.query<SerializedTask>(sql.FETCH_TASK, [queue, executorId])
            }

            dequeuedTasks.push(...result.rows);
            return dequeuedTasks
        } finally {
            client.release();
        }
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

    async registerExecutor({ queue, executorId, executorName }: {
        queue: string,
        executorId: string,
        executorName: string
    }): Promise<void> {
        const client = await this.pool.connect()
        try {
            await client.query(sql.REGISTER_EXECUTOR, [executorId, executorName, queue])
        } finally {
            client.release();
        }
    }

    async disconnectExecutor({ executorId }: { executorId: string }): Promise<void> {
        const client = await this.pool.connect()
        try {
            await client.query(sql.DISCONNECT_EXECUTOR, [executorId])
        } finally {
            client.release();
        }
    }

    async listen(hyrexListener: DispatcherListenerCallbacks) {
        console.log("Starting listener!")
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
                    const message: ListenerMessage = {
                        messageType: "TASK_HEARTBEAT",
                        taskId
                    }
                    await hyrexListener.taskHeartbeatCallback(message)
                } else if (pg_msg.channel === TASK_CANCEL) {
                    const taskId = uuidSchema.parse(pg_msg.payload)
                    const message: ListenerMessage = {
                        messageType: "TASK_CANCEL",
                        taskId
                    }
                    await hyrexListener.taskCancelCallback(message)
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
}
