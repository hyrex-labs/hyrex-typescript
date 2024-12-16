import {
    JsonType,
    InternalTaskRegistry,
    HyrexTaskConfig,
    HyrexTaskConfigSchema,
    HyrexTaskFunction,
    HyrexTaskConfigInput, InternalQueueRegistry
} from "./utils"
import { HyrexDispatcher } from "./dispatchers/HyrexDispatcher";
import { PostgresDispatcher } from "./dispatchers/postgres/PostgresDispatcher";
import { TaskWrapper } from "./TaskWrapper";
import { z } from "zod";
import { HyrexQueue } from "./HyrexQueue";

export class HyrexRegistry {
    private dispatcher: HyrexDispatcher
    public internalTaskRegistry: InternalTaskRegistry
    public internalQueueRegistry: InternalQueueRegistry

    constructor() {
        this.internalTaskRegistry = {}
        this.internalQueueRegistry = {}

        if (process.env.HYREX_DATABASE_URL) {
            this.dispatcher = new PostgresDispatcher({ conn: process.env.HYREX_DATABASE_URL })
        } else if (process.env.HYREX_API_KEY) {
            throw new Error("Registry is not implemented")
        } else {
            throw new Error("HYREX_DATABASE_URL is missing")
        }

    }

    print() {
        console.log("Task Registry:", Object.entries(this.internalTaskRegistry));
    }


    task<U extends JsonType>(taskFunction: HyrexTaskFunction<U>, taskConfig: HyrexTaskConfigInput = {}): TaskWrapper<U> {
        const validatedTaskConfig = HyrexTaskConfigSchema.parse(taskConfig)
        this.addFunctionToRegistry(taskFunction as HyrexTaskFunction, validatedTaskConfig);
        return new TaskWrapper<U>(this.dispatcher, taskFunction, validatedTaskConfig);
    }

    private addFunctionToRegistry(taskFunction: HyrexTaskFunction, taskConfig: HyrexTaskConfig) {
        const stringValidation = z.string().safeParse(taskFunction.name)
        if (!stringValidation) {
            throw new Error(`TaskFunction name must be a string. Instead got ${typeof taskFunction.name}`)
        }

        this.addFunction(taskFunction.name, taskFunction, taskConfig)
    }

    addQueue(queue: HyrexQueue) {
        if (this.internalQueueRegistry[queue.name] && !this.internalQueueRegistry[queue.name].equals(queue)) {
            throw new Error(`Conflicting concurrency limits set on queue ${queue.name}`)
        }

        this.internalQueueRegistry[queue.name] = queue;
    }

    addFunction(taskName: string, taskFunc: HyrexTaskFunction, taskConfig: HyrexTaskConfig) {
        const taskRegistration = {
            taskFunc,
            taskConfig,
        }

        if (this.internalTaskRegistry[taskName]) {
            throw new Error(`Function with name "${taskName}" is already in the registry.`);
        }

        if (taskConfig.queue) {
            console.log("Adding queue!!", taskName, taskConfig.queue)
            if (typeof taskConfig.queue === "string") {
                this.addQueue(new HyrexQueue({ name: taskConfig.queue }))
            } else {
                this.addQueue(new HyrexQueue(taskConfig.queue))
            }
        }

        this.internalTaskRegistry[taskName] = taskRegistration
    }

    getFunction(key: string): HyrexTaskFunction {
        const taskRegistration = this.internalTaskRegistry[key]
        if (!taskRegistration) {
            throw new Error(`Function with key "${key}" is not in the registry.`);
        }
        return taskRegistration.taskFunc
    }
}
