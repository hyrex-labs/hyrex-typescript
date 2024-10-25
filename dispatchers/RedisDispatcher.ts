import { HyrexDispatcher, SerializedTask, SerializedTaskRequest } from "./HyrexDispatcher";
import { UUID } from "../utils";
import { createClient, RedisClientType } from 'redis';


type HyrexRedisDispatcherConfig = {
    conn: string
}


export class RedisDispatcher implements HyrexDispatcher {
    private client: RedisClientType

    constructor(private config: HyrexRedisDispatcherConfig) {
        const conn =
        this.client = createClient() as RedisClientType
        this.client.on('error', err => console.log('Redis Client Error', err));
        this.client.connect().then(() => {
            console.log("Client connected!")
        })
    }

    async enqueue(serializedTasks: SerializedTaskRequest[]): Promise<UUID[]> {
        // this.client.
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
