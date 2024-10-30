import { UUID, JsonSerializableObject } from "../utils";

import { z } from "zod";

export const TaskConfigSchema = z.record(z.string(), z.any()) // TODO: Update this to be a config
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

}
