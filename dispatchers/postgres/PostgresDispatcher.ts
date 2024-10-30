import { HyrexDispatcher, SerializedTask, SerializedTaskRequest } from "../HyrexDispatcher";
import { UUID } from "../../utils";
import { Client } from 'pg';
import * as sql from "./sql"

type HyrexPostgresDispatcherConfig = {
    conn: string
}


export class PostgresDispatcher implements HyrexDispatcher {
    private connectionString: string

    constructor(private config: HyrexPostgresDispatcherConfig) {
        this.connectionString = config.conn
        // this.client = new Client({ connectionString: config.conn })
        // this.client.connect()
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


    async dequeue({ numTasks }: { numTasks: number }): Promise<SerializedTask[]> {
        throw new Error("Not Implemented");
    }

    async markTaskFailed(taskId: UUID): Promise<void> {
    }

    async markTaskSuccess(taskId: UUID): Promise<void> {
    }

    async cancelTask(taskId: UUID): Promise<void> {
    }
}
