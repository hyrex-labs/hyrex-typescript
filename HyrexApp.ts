import { z } from 'zod'
import {
    CallableSchema, Callable, UUID, JsonSerializable, JsonSerializableObject, sleep, range, InternalTaskRegistry
} from "./utils";
import { SerializedTask, TaskConfig, HyrexDispatcher } from "./dispatchers/HyrexDispatcher";
import { Sqlite3Dispatcher } from "./dispatchers/Sqlite3Dispatcher";
import { HyrexSynchronousWorker } from "./worker/HyrexSynchronousWorker";
import { TaskRegistry } from "./TaskRegistry";


const AppConfigSchema = z.object({
    appId: z.string(),
    conn: z.string().optional(),
    apiKey: z.string().optional(),
    errorCallback: z.function().optional(),
}).strict()

type AppConfig = z.infer<typeof AppConfigSchema>

const stringSchema = z.string()

class TaskWrapper<U extends JsonSerializableObject> {
    constructor(private dispatcher: HyrexDispatcher, private taskFunction: (arg: U) => any) {
    }

    call(context: U, config: TaskConfig = {}) {

        JsonSerializable.parse(context)

        const serializedTaskRequest = {
            "queue": "default",
            "name": this.taskFunction.name,
            "context": context,
            "config": config
        }

        this.dispatcher.enqueue([serializedTaskRequest])
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
    private appId: string
    private conn?: string
    private apiKey?: string
    private errorCallback?: ErrorCallback

    constructor({
                    appId,
                    conn,
                    apiKey,
                    errorCallback,
                }: AppConfig) {

        const appConfig = {
            appId,
            conn,
            apiKey,
            errorCallback
        }

        AppConfigSchema.parse(appConfig)

        this.appId = appId
        this.conn = conn
        this.apiKey = apiKey
        this.errorCallback = errorCallback
        // if (appConfig.conn) {
        //     this.dispatcher = new PostgresDispatcher({ conn: appConfig.conn });
        // } else {
        //     this.dispatcher = new ConsoleDispatcher()
        // }
        this.dispatcher = new Sqlite3Dispatcher("tasks.db")

        this.appTaskRegistry = new TaskRegistry()
    }

    private addFunctionToRegistry(taskFunction: Callable) {
        const stringValidation = stringSchema.safeParse(taskFunction.name)
        if (!stringValidation) {
            throw new Error(`TaskFunction name must be a string. Instead got ${typeof taskFunction.name}`)
        }

        this.appTaskRegistry.addFunction(taskFunction.name, taskFunction)
    }

    task<U extends JsonSerializableObject>(taskFunction: (arg: U) => any): CallableTaskWrapper<U> {
        const wrapper = new TaskWrapper(this.dispatcher, taskFunction);

        const callableFunction = (context: U, config?: TaskConfig) => {
            return wrapper.call(context, config);
        };

        this.addFunctionToRegistry(taskFunction as Callable);

        const combined = Object.assign(callableFunction, wrapper);

        return combined as CallableTaskWrapper<U>;
    }

    addRegistry(taskRegistry: TaskRegistry) {
        for (const key of Object.keys(taskRegistry.internalTaskRegistry)) {
            this.appTaskRegistry.addFunction(key, taskRegistry.internalTaskRegistry[key])
        }
    }

    async runWorker({ queue, logLevel, numThreads }: WorkerConfig = {
        queue: "default",
        logLevel: "INFO",
        numThreads: 1
    }) {
        const workerName = process.env.HYREX_WORKER_NAME
        if (!workerName) {
            throw new Error("No HYREX_WORKER_NAME Found. Ensure this command is being executed via the CLI.")
        }

        const worker = new HyrexSynchronousWorker({
            name: workerName,
            queue,
            taskRegistry: this.appTaskRegistry,
            dispatcher: this.dispatcher
        })

        worker.runWorker()
    }


}

