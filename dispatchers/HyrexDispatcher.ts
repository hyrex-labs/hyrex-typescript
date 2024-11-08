import { UUID, JsonSerializableObject } from "../utils";

import { z } from "zod";

export const TaskConfigSchema = z.object({
    queue: z.string().optional(),
    priority: z.number().min(1).max(10).optional(),
    maxRetries: z.number().min(0).max(10).optional(),
    cron: z.string().optional(),

})

export type TaskConfig = z.infer<typeof TaskConfigSchema>

export type SerializedTaskRequest = {
    id: UUID,
    task_name: string,
    args: JsonSerializableObject,
    queue: string,
    max_retries: number,
    priority: number,
}

export type SerializedTask = {
    id: string
    task_name: string,
    args: JsonSerializableObject,
}

export interface HyrexDispatcher {
    enqueue: (serializedTasks: SerializedTaskRequest[]) => Promise<UUID[]>
    dequeue: ({ numTasks, workerId, queue }: { numTasks: number, workerId: string, queue: string }) => Promise<SerializedTask[]>
    markTaskSuccess(taskId: UUID): Promise<void>
    markTaskFailed(taskId: UUID): Promise<void>
    cancelTask(taskId: UUID): Promise<void>
    registerWorker({ queue, workerId, workerName }: { queue: string, workerId: string, workerName: string }): Promise<void>
    disconnectWorker({ workerId }: { workerId: string }): Promise<void>
}
