import {
    HyrexTaskFunction,
    JsonSerializable,
    JsonType,
    UUID,
    HyrexTaskConfig,
    HyrexTaskConfigSchema,
    HyrexTaskConfigInput
} from "./utils";
import { HyrexDispatcher, SerializedTaskRequest } from "./dispatchers/HyrexDispatcher";
import { randomUUID } from "node:crypto";
import { z } from "zod";

export class TaskWrapper<U extends JsonType> {
    private taskFunction: HyrexTaskFunction
    private dispatcher: HyrexDispatcher
    private taskConfig: HyrexTaskConfig

    constructor(dispatcher: HyrexDispatcher, taskFunction: HyrexTaskFunction, defaultTaskConfig: HyrexTaskConfig) {
        this.dispatcher = dispatcher
        this.taskFunction = taskFunction as HyrexTaskFunction
        this.taskConfig =  HyrexTaskConfigSchema.parse(defaultTaskConfig)
    }

    withConfig(taskConfig: HyrexTaskConfigInput) : TaskWrapper<U> {
        const newTaskConfig = {...this.taskConfig, ...taskConfig}
        return new TaskWrapper(this.dispatcher, this.taskFunction, newTaskConfig)
    }

    async send(context: U): Promise<UUID> {

        JsonSerializable.parse(context)

        const serializedTaskRequest: SerializedTaskRequest = {
            id: randomUUID(),
            queue: this.taskConfig.queue,
            task_name: this.taskFunction.name,
            args: context,
            max_retries: this.taskConfig.maxRetries,
            priority: this.taskConfig.priority
        }

        return (await this.dispatcher.enqueue([serializedTaskRequest]))[0]
    }

    // async call(context: U, config: HyrexTaskConfig): Promise<UUID> {
    //
    //     JsonSerializable.parse(context)
    //     const parsedConfig = HyrexTaskConfigSchema.parse(config);
    //
    //     const serializedTaskRequest: SerializedTaskRequest = {
    //         id: randomUUID(),
    //         queue: parsedConfig.queue,
    //         task_name: this.taskFunction.name,
    //         args: context,
    //         max_retries: parsedConfig.maxRetries,
    //         priority: parsedConfig.priority
    //     }
    //
    //     return (await this.dispatcher.enqueue([serializedTaskRequest]))[0]
    // }
}
