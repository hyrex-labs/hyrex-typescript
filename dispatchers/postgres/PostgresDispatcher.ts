import { HyrexDispatcher, SerializedTask, SerializedTaskRequest } from "../HyrexDispatcher";
import { UUID, uuidSchema } from "../../utils";
import { Client, Notification, Pool } from 'pg';
import * as sql from "./sql"
import { string } from "zod";
import { DispatcherListenerCallbacks } from "../HyrexDispatcher";
import { TaskHeartbeatResultMessage, ListenerMessage, ExecutorHeartbeatResultMessage } from "../../types";

type HyrexPostgresDispatcherConfig = {
    conn: string
}


export class PostgresDispatcher implements HyrexDispatcher {
    private connectionString: string
    private pool: Pool

    constructor(private config: HyrexPostgresDispatcherConfig) {
        this.connectionString = config.conn
        this.pool = new Pool({
            connectionString: this.connectionString,
            // Optional additional config
            max: 20,
            idleTimeoutMillis: 30000,
        })

        console.log("Successfully created postgres pool!")
    }

    async initPostgresDB() {
        const client = new Client({ connectionString: this.connectionString })
        try {
            await client.connect();
            await client.query(sql.CreateHyrexTaskTable);
            await client.query(sql.CreateExecutorTable);
            console.log("initPostgresDB finished successfully.");
        } catch (error) {
            console.error(error);
        } finally {
            await client.end();
        }
    }

    async enqueue(serializedTasks: SerializedTaskRequest[]): Promise<UUID[]> {
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
            await client.release();
        }
    }


    async dequeue(
        { numTasks, executorId, queue }: { numTasks: number, executorId: string, queue: string }
            = { numTasks: 1, executorId: "UnknownExecutor", queue: "*" }
    ): Promise<SerializedTask[]> {
        if (numTasks !== 1) {
            throw new Error("Dequeued multiple tasks is not implemented. Set numTasks to 1.");
        }

        const client = new Client({ connectionString: this.connectionString })
        const dequeuedTasks: SerializedTask[] = []
        try {
            await client.connect();
            let result
            if (queue === "*") {
                result = await client.query<SerializedTask>(sql.FETCH_TASK_FROM_ANY_QUEUE, [executorId])
            } else {
                result = await client.query<SerializedTask>(sql.FETCH_TASK, [queue, executorId])
            }

            dequeuedTasks.push(...result.rows);
            return dequeuedTasks

        } finally {
            await client.end();
        }
    }

    async markTaskFailed(taskId: UUID): Promise<void> {
        const client = new Client({ connectionString: this.connectionString })
        try {
            await client.connect();
            await client.query(sql.MARK_TASK_FAILED, [taskId])
        } finally {
            await client.end();
        }
    }

    async markTaskSuccess(taskId: UUID): Promise<void> {
        const client = new Client({ connectionString: this.connectionString })
        try {
            await client.connect();
            await client.query(sql.MARK_TASK_SUCCESS, [taskId])
        } finally {
            await client.end();
        }
    }

    async markTaskCanceled(taskId: UUID): Promise<boolean> {
        const client = new Client({ connectionString: this.connectionString })
        try {
            await client.connect();
            const result = await client.query(sql.MARK_TASK_CANCELED, [taskId])
            return result.rows.length > 0
        } finally {
            await client.end();
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
        const client = new Client({ connectionString: this.connectionString })
        try {
            await client.connect();
            await client.query(sql.REGISTER_EXECUTOR, [executorId, executorName, queue])
        } finally {
            await client.end();
        }
    }

    async disconnectExecutor({ executorId }: { executorId: string }): Promise<void> {
        const client = new Client({ connectionString: this.connectionString })
        try {
            await client.connect();
            await client.query(sql.DISCONNECT_EXECUTOR, [executorId])
        } finally {
            await client.end();
        }
    }

    /*
    Listens for cancellation and heartbeat requests from server.
     */
    async listen(hyrexListener: DispatcherListenerCallbacks) {
        console.log("Starting listener!")
        const TASK_HEARTBEAT = "TASK_HEARTBEAT"
        const TASK_CANCEL = "TASK_CANCEL"
        const client = new Client({ connectionString: this.connectionString })
        try {

            await client.connect();


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
            throw error;
        } finally {
            // await client.end()
        }
    }
}
