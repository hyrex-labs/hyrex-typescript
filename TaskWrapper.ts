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
import { v7 as uuidv7 } from 'uuid';
import { string, z } from "zod";
import { COMMANDS } from "./commands";
import { getHyrexContext } from "./HyrexContext";

// Concurrency limit cannot be set at send time. This type removes concurrency limit at send time.
type SendableHyrexTaskConfig = Omit<HyrexTaskConfigInput, 'queue'> & {
    queue?: string | { name: string };
};

export class TaskWrapper<U extends JsonType> {
    private taskFunction: HyrexTaskFunction
    private dispatcher: HyrexDispatcher
    private taskConfig: HyrexTaskConfig
    private taskName: string;

    constructor(dispatcher: HyrexDispatcher, taskName: string, taskFunction: HyrexTaskFunction, defaultTaskConfig: HyrexTaskConfig) {
        this.dispatcher = dispatcher
        this.taskFunction = taskFunction as HyrexTaskFunction
        this.taskConfig =  HyrexTaskConfigSchema.parse(defaultTaskConfig)
        this.taskName = taskName
    }

    withConfig(taskConfig: SendableHyrexTaskConfig) : TaskWrapper<U> {
        const newTaskConfig = {...this.taskConfig, ...taskConfig}
        return new TaskWrapper(this.dispatcher, this.taskName, this.taskFunction, newTaskConfig)
    }

    async send(context?: U | {}): Promise<UUID> {
        if (!context) {
            context = {}
        }

        const hyrexContext = getHyrexContext()

        JsonSerializable.parse(context)

        const currentId = uuidv7()
        const serializedTaskRequest: SerializedTaskRequest = {
            id: currentId,
            durable_id: currentId,
            root_id: hyrexContext ? hyrexContext.rootId : currentId,
            parent_id: hyrexContext ? hyrexContext.taskId : null,
            queue: typeof this.taskConfig.queue === 'string' ? this.taskConfig.queue : this.taskConfig.queue.name,
            task_name: this.taskName,
            args: context,
            max_retries: this.taskConfig.maxRetries,
            priority: this.taskConfig.priority,
            timeout_seconds: this.taskConfig.timeoutSeconds || null,
            idempotency_key: this.taskConfig.idempotencyKey || null
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
