import { JsonSerializable, JsonSerializableObject, UUID } from "./utils";
import { HyrexDispatcher, SerializedTaskRequest } from "./dispatchers/HyrexDispatcher";
import { randomUUID } from "node:crypto";
import { z } from "zod";

export const TaskConfigSchema = z.object({
    queue: z.string().default("default"),
    priority: z.number().min(1).max(10).default(3),
    maxRetries: z.number().min(0).max(10).default(3),
    cron: z.string().optional(),

})

export type TaskConfig = Partial<z.infer<typeof TaskConfigSchema>>

export class TaskWrapper<U extends JsonSerializableObject> {
    constructor(private dispatcher: HyrexDispatcher, private taskFunction: (arg: U) => any) {
    }

    async call(context: U, config: TaskConfig = {}): Promise<UUID> {

        JsonSerializable.parse(context)
        const parsedConfig = TaskConfigSchema.parse(config);

        const serializedTaskRequest: SerializedTaskRequest = {
            id: randomUUID(),
            queue: parsedConfig.queue,
            task_name: this.taskFunction.name,
            args: context,
            max_retries: parsedConfig.maxRetries,
            priority: parsedConfig.priority
        }

        return (await this.dispatcher.enqueue([serializedTaskRequest]))[0]
    }
}
