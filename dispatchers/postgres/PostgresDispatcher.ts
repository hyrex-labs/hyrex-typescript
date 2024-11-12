import { HyrexDispatcher, SerializedTask, SerializedTaskRequest } from "../HyrexDispatcher";
import { UUID, uuidSchema } from "../../utils";
import { Client, Notification } from 'pg';
import * as sql from "./sql"
import { string } from "zod";
import { DispatcherListenerCallbacks } from "../HyrexDispatcher";
import { HeartbeatResultMessageBody, ListenerMessage } from "../../types";

type HyrexPostgresDispatcherConfig = {
    conn: string
}


export class PostgresDispatcher implements HyrexDispatcher {
    private connectionString: string

    constructor(private config: HyrexPostgresDispatcherConfig) {
        this.connectionString = config.conn
    }

    async initPostgresDB() {
        const client = new Client({ connectionString: this.connectionString })
        try {
            await client.connect();
            await client.query(sql.CreateHyrexTaskTable);
            await client.query(sql.CreateWorkerTable);
            console.log("initPostgresDB finished successfully.");
        } finally {
            await client.end();
        }
    }

    async enqueue(serializedTasks: SerializedTaskRequest[]): Promise<UUID[]> {
        const client = new Client({ connectionString: this.connectionString })
        try {
            await client.connect()
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
            await client.end();
        }
    }


    async dequeue(
        { numTasks, workerId, queue }: { numTasks: number, workerId: string, queue: string }
            = { numTasks: 1, workerId: "UnknownWorker", queue: "*" }
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
                result = await client.query<SerializedTask>(sql.FETCH_TASK_FROM_ANY_QUEUE, [workerId])
            } else {
                result = await client.query<SerializedTask>(sql.FETCH_TASK, [queue, workerId])
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

    async cancelTask(taskId: UUID): Promise<void> {
    }

    async updateHeartbeat(heartbeatMsg: HeartbeatResultMessageBody): Promise<void> {
        console.log("It would update the heartbeat here...", heartbeatMsg)
    }

    async registerWorker({ queue, workerId, workerName }: { queue: string, workerId: string, workerName: string }): Promise<void> {
        const client = new Client({ connectionString: this.connectionString })
        try {
            await client.connect();
            await client.query(sql.REGISTER_WORKER, [workerId, workerName, queue])
        } finally {
            await client.end();
        }
    }

    async disconnectWorker({ workerId }: { workerId: string }): Promise<void> {
        const client = new Client({ connectionString: this.connectionString })
        try {
            await client.connect();
            await client.query(sql.DISCONNECT_WORKER, [workerId])
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
                console.log("Heard a notification!!", pg_msg)
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
