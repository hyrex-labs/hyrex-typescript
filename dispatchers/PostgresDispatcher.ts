import { HyrexDispatcher, SerializedTask, SerializedTaskRequest } from "./HyrexDispatcher";
import { UUID } from "../utils";

type HyrexPostgresDispatcherConfig = {
    conn: string
}


export class PostgresDispatcher implements HyrexDispatcher {
    constructor(private config: HyrexPostgresDispatcherConfig) {

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

    async cancelTask(taskId: UUID): Promise<void> {}
}
