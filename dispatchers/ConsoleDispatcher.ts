import { v5 as uuidv5 } from "uuid";
import { HyrexDispatcher, SerializedTask, SerializedTaskRequest } from "./HyrexDispatcher";
import { UUID } from "../utils";

type HyrexConsoleDispatcherConfig = {
    randomSeed?: string
}

export class ConsoleDispatcher implements HyrexDispatcher {
    private nonce: number
    private namespace: string

    constructor(private config?: HyrexConsoleDispatcherConfig) {
        console.log("HyrexConsoleDispatcher set.")
        this.namespace = "00000000-0000-0000-0000-000000000000"
        this.nonce = 0
    }

    private generateUUID(): UUID {
        return uuidv5(`${this.nonce++}`, this.namespace)
    }

    async enqueue(serializedTasks: SerializedTaskRequest[]): Promise<UUID[]> {
        for (const task of serializedTasks) {
            console.log(`Sent ${JSON.stringify(task)}`)
        }

        return [this.generateUUID()]
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
