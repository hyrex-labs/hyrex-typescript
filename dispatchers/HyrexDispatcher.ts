import { UUID, JsonSerializableObject } from "../utils";

import { z } from "zod";

export const TaskConfigSchema = z.record(z.string(), z.any()) // TODO: Update this to be a config
export type TaskConfig = z.infer<typeof TaskConfigSchema>

export type SerializedTaskRequest = {
    name: string,
    queue: string,
    context: JsonSerializableObject,
    config: TaskConfig
}

export type SerializedTask = {
    id: string
    name: string,
    queue: string,
    context: JsonSerializableObject,
    config: TaskConfig
}

export interface HyrexDispatcher {
    enqueue: (serializedTasks: SerializedTaskRequest[]) => Promise<UUID[]>
    dequeue: ({ numTasks }: { numTasks: number }) => Promise<SerializedTask[]>
    markTaskSuccess(taskId: UUID): Promise<void>
    markTaskFailed(taskId: UUID): Promise<void>
    cancelTask(taskId: UUID): Promise<void>

}
