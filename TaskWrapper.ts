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
    public taskName: string;
    private argSchema?: z.ZodType;

    constructor(dispatcher: HyrexDispatcher, taskName: string, taskFunction: HyrexTaskFunction, defaultTaskConfig: HyrexTaskConfig, argSchema?: z.ZodType) {
        this.dispatcher = dispatcher
        this.taskFunction = taskFunction as HyrexTaskFunction
        this.taskConfig = HyrexTaskConfigSchema.parse(defaultTaskConfig)
        this.taskName = taskName
        this.argSchema = argSchema
    }

    withConfig(taskConfig: SendableHyrexTaskConfig): TaskWrapper<U> {
        const newTaskConfig = { ...this.taskConfig, ...taskConfig }
        return new TaskWrapper(this.dispatcher, this.taskName, this.taskFunction, newTaskConfig, this.argSchema)
    }

    async send(args?: U | {}): Promise<UUID> {
        if (!args) {
            args = {}
        }

        // Validate against argSchema if provided
        if (this.argSchema && args) {
            this.argSchema.parse(args)
        }

        let hyrexContext = null;
        try {
            hyrexContext = getHyrexContext();
        } catch (error) {
            // Context is not available when submitting tasks from outside a task execution
            // This is normal and expected behavior
        }

        JsonSerializable.parse(args)

        const currentId = uuidv7()
        const serializedTaskRequest: SerializedTaskRequest = {
            id: currentId,
            durable_id: currentId,
            root_id: hyrexContext ? hyrexContext.rootId : currentId,
            parent_id: hyrexContext ? hyrexContext.taskId : null,
            workflow_run_id: null,
            workflow_dependencies: null,
            queue: typeof this.taskConfig.queue === 'string' ? this.taskConfig.queue : this.taskConfig.queue.name,
            status: 'queued',
            task_name: this.taskName,
            args: args,
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
