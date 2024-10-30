import { HyrexDispatcher, SerializedTask, SerializedTaskRequest } from "../HyrexDispatcher";
import { UUID } from "../../utils";
import { Client } from 'pg';
import { CreateHyrexTaskTable, CreateWorkerTable } from "./sql";

type HyrexPostgresDispatcherConfig = {
    conn: string
}


export class PostgresDispatcher implements HyrexDispatcher {
    private client: Client

    constructor(private config: HyrexPostgresDispatcherConfig) {
        this.client = new Client({ connectionString: config.conn })
    }

    async initPostgresDB() {
        try {
            // await this.client.connect();
            // await this.client.query(CreateHyrexTaskTable);
            // await this.client.query(CreateWorkerTable);
            console.log("initPostgresDB finished successfully.");
        } catch (error) {
            console.error("Error initializing database:", error);
        } finally {
            await this.client.end();
        }
    }

    async enqueue(serializedTasks: SerializedTaskRequest[]): Promise<UUID[]> {
        return [""]
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
