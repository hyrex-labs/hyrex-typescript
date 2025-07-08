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
import { IWorkflowTask, WorkflowTask, HyrexWorkflowBuilder } from "./workflow/HyrexWorkflowBuilder";
import { HyrexExecutor } from "./worker/HyrexExecutor";

// Concurrency limit cannot be set at send time. This type removes concurrency limit at send time.
type SendableHyrexTaskConfig = Omit<HyrexTaskConfigInput, 'queue'> & {
    queue?: string | { name: string };
};


export class TaskWrapper<U extends JsonType> implements IWorkflowTask {
    private taskFunction: HyrexTaskFunction
    private dispatcher: HyrexDispatcher
    private taskConfig: HyrexTaskConfig
    public taskName: string;
    private argSchema?: z.ZodType;
    private copyIndex: number = 0;

    constructor(dispatcher: HyrexDispatcher, taskName: string, taskFunction: HyrexTaskFunction, defaultTaskConfig: HyrexTaskConfig, argSchema?: z.ZodType) {
        this.dispatcher = dispatcher
        this.taskFunction = taskFunction as HyrexTaskFunction
        this.taskConfig = HyrexTaskConfigSchema.parse(defaultTaskConfig)
        this.taskName = taskName
        this.argSchema = argSchema
    }

    // Implement IWorkflowTask interface
    next(nextTask: IWorkflowTask | IWorkflowTask[]): IWorkflowTask {
        // Check if we're in a workflow building context
        if (HyrexWorkflowBuilder.currentBuilder) {
            // Use the builder's registry to get or create the node
            const thisNode = HyrexWorkflowBuilder.currentBuilder.getOrCreateNode(this.taskName);
            // Call next on the node with the registry context
            return thisNode.next(nextTask, HyrexWorkflowBuilder.currentBuilder.getTaskRegistry());
        }
        
        // Fallback for non-workflow usage
        const thisNode = new WorkflowTask(this.taskName);
        return thisNode.next(nextTask);
    }

    // Create a copy of this task with a unique name for the workflow
    copy(): TaskWrapper<U> {
        const copiedWrapper = new TaskWrapper(this.dispatcher, this.taskName, this.taskFunction, this.taskConfig, this.argSchema);
        
        // Extract base name (remove existing _copy_N suffix if present)
        const baseName = this.taskName.replace(/_copy_\d+$/, '');
        
        // TODO: Make the DAG node name different from the task name
        // Currently both the task name and DAG node name are the same (e.g., "validateIdentity_copy_1")
        // Consider separating internal DAG node naming from the actual task name that gets executed
        
        // Check if we're in a workflow building context
        if (HyrexWorkflowBuilder.currentBuilder) {
            // Use the workflow-scoped copy counter
            const copyNum = HyrexWorkflowBuilder.currentBuilder.getNextCopyNumber(baseName);
            copiedWrapper.taskName = `${baseName}_copy_${copyNum}`;
        } else {
            // Fallback for non-workflow usage
            copiedWrapper.copyIndex = this.copyIndex + 1;
            copiedWrapper.taskName = `${baseName}_copy_${copiedWrapper.copyIndex}`;
        }
        
        return copiedWrapper;
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

        const promise = this.dispatcher.enqueue([serializedTaskRequest]).then(ids => ids[0]);
        
        // Track the promise if we're running within a task execution context
        const sendPromiseSet = HyrexExecutor.getCurrentSendPromises();
        if (sendPromiseSet) {
            sendPromiseSet.add(promise);
            // Clean up the promise from the set once it settles
            promise.finally(() => sendPromiseSet.delete(promise));
        }
        
        return promise;
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
