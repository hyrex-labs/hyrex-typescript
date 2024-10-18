import { UUID, JsonSerializableObject } from "../utils";

import { z } from "zod";

export const TaskConfigSchema = z.record(z.string(), z.any()) // TODO: Update this to be a config
export type TaskConfig = z.infer<typeof TaskConfigSchema>

export type SerializedTask = {
    name: string,
    context: JsonSerializableObject,
    config: TaskConfig
}

export interface HyrexDispatcher {
    enqueue: (serializedTasks: SerializedTask[]) => Promise<UUID[]>
    dequeue: ({ numTasks }: { numTasks: number }) => any
}
