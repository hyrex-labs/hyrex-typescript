import { z } from 'zod'
import {
    CallableSchema, Callable, UUID, JsonSerializable, JsonSerializableObject, sleep,
} from "./utils";
import { SerializedTask, TaskConfig, HyrexDispatcher } from "./dispatchers/HyrexDispatcher";
import { ConsoleDispatcher } from "./dispatchers/ConsoleDispatcher";
import { PostgresDispatcher } from "./dispatchers/PostgresDispatcher";
import { LocalTSVDispatcher } from "./dispatchers/LocalTSVDispatcher";
import { Sqlite3Dispatcher } from "./dispatchers/Sqlite3Dispatcher";

const AppConfigSchema = z.object({
    appId: z.string(),
    conn: z.string().optional(),
    apiKey: z.string().optional(),
    errorCallback: z.function().optional(),
})
type AppConfig = z.infer<typeof AppConfigSchema>


const InternalTaskRegistrySchema = z.record(z.string(), CallableSchema)
type InternalTaskRegistry = z.infer<typeof InternalTaskRegistrySchema>


export class TaskRegistry {
    public internalTaskRegistry: InternalTaskRegistry

    constructor() {
        this.internalTaskRegistry = {}
    }

    addFunction(key: string, value: Callable) {
        if (this.internalTaskRegistry[key]) {
            throw new Error(`Function with key "${key}" is already in the registry.`);
        }
        this.internalTaskRegistry[key] = value
    }

    getFunction(key: string): Callable {
        const func = this.internalTaskRegistry[key]
        if (!func) {
            throw new Error(`Function with key "${key}" is not in the registry.`);
        }
        return func
    }
}


class TaskWrapper<U extends JsonSerializableObject> {
    constructor(private dispatcher: HyrexDispatcher, private taskFunction: (arg: U) => any) {
    }

    call(context: U, config: TaskConfig = {}) {
        // console.log("Sending off async...");

        JsonSerializable.parse(context)
        // console.log("Function name", this.taskFunction.name)

        const serializedTask = {
            "name": this.taskFunction.name,
            "context": context,
            "config": config
        }

        this.dispatcher.enqueue([serializedTask])
        // const result = this.taskFunction(context);

        // console.log("...function has been executed");

        // return result;
    }
}

type CallableTaskWrapper<U extends JsonSerializableObject> =
    TaskWrapper<U>
    & ((context: U, config?: TaskConfig) => any);


type WorkerConfig = {
    numThreads: number
    queue: string
    logLevel: string
}

export class Hyrex {
    private dispatcher: HyrexDispatcher
    private appTaskRegistry: TaskRegistry

    constructor(private appConfig: AppConfig) {
        AppConfigSchema.parse(appConfig)
        // if (appConfig.conn) {
        //     this.dispatcher = new PostgresDispatcher({ conn: appConfig.conn });
        // } else {
        //     this.dispatcher = new ConsoleDispatcher()
        // }
        this.dispatcher = new Sqlite3Dispatcher("tasks.db")

        this.appTaskRegistry = new TaskRegistry()
    }

    task<U extends JsonSerializableObject>(taskFunction: (arg: U) => any): CallableTaskWrapper<U> {
        const wrapper = new TaskWrapper(this.dispatcher, taskFunction);

        const callableFunction = (context: U, config?: TaskConfig) => {
            return wrapper.call(context, config);
        };

        const combined = Object.assign(callableFunction, wrapper);

        return combined as CallableTaskWrapper<U>;
    }

    addRegistry(taskRegistry: TaskRegistry) {
        for (const key of Object.keys(taskRegistry.internalTaskRegistry)) {
            this.appTaskRegistry.addFunction(key, taskRegistry.internalTaskRegistry[key])
        }
    }

    async runWorker(workerConfig: WorkerConfig = { queue: "default", logLevel: "INFO", numThreads: 8 }) {
        let i = 0
        const limit = 5
        while (i < limit) {
            i++
            await sleep(1000)
            await this.dispatcher.dequeue({ numTasks: 1 })
        }

    }

}

