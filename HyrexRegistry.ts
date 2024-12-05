import {
    UUID,
    JsonSerializable,
    JsonType,
    sleep,
    range,
    InternalTaskRegistry,
    CallableTaskWrapper,
    HyrexTaskConfig,
    HyrexTaskConfigSchema,
    HyrexTaskFunction,
    TaskRegistration,
    HyrexTaskConfigInput
} from "./utils"
import { HyrexDispatcher, TaskConfig } from "./dispatchers/HyrexDispatcher";
import { PostgresDispatcher } from "./dispatchers/postgres/PostgresDispatcher";
import { TaskWrapper } from "./TaskWrapper";
import { z } from "zod";

export class HyrexRegistry {
    private dispatcher: HyrexDispatcher
    public internalTaskRegistry: InternalTaskRegistry

    constructor() {
        this.internalTaskRegistry = {}

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
        // const wrapper = new TaskWrapper(this.dispatcher, taskFunction, taskConfig);

        // let callableFunction;
        //
        // if (taskFunction.length === 0) {
        //     callableFunction = (config?: TaskConfig) => {
        //         return wrapper.call({}, config);
        //     };
        // } else {
        //     callableFunction = (context: U, config?: TaskConfig) => {
        //         return wrapper.call(context, config);
        //     }
        // }

        const validatedTaskConfig = HyrexTaskConfigSchema.parse(taskConfig)
        this.addFunctionToRegistry(taskFunction as HyrexTaskFunction, validatedTaskConfig);
        return new TaskWrapper<U>(this.dispatcher, taskFunction, validatedTaskConfig);

        // const combined = Object.assign(callableFunction, wrapper);
        //
        // return combined as CallableTaskWrapper<U>;
    }

    private addFunctionToRegistry(taskFunction: HyrexTaskFunction, taskConfig: HyrexTaskConfig) {
        const stringValidation = z.string().safeParse(taskFunction.name)
        if (!stringValidation) {
            throw new Error(`TaskFunction name must be a string. Instead got ${typeof taskFunction.name}`)
        }

        this.addFunction(taskFunction.name, taskFunction, taskConfig)
    }

    addFunction(taskName: string, taskFunc: HyrexTaskFunction, taskConfig: HyrexTaskConfig) {
        const taskRegistration = {
            taskFunc,
            taskConfig,
        }

        if (this.internalTaskRegistry[taskName]) {
            throw new Error(`Function with name "${taskName}" is already in the registry.`);
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
