import { z } from 'zod'
import {
    CallableSchema, Callable, UUID, JsonSerializable, JsonSerializableObject, sleep, range, InternalTaskRegistry
} from "./utils";
import { SerializedTask, TaskConfig, HyrexDispatcher, SerializedTaskRequest } from "./dispatchers/HyrexDispatcher";
// import { Sqlite3Dispatcher } from "./dispatchers/Sqlite3Dispatcher";
import { HyrexSynchronousWorker } from "./worker/HyrexSynchronousWorker";
import { TaskRegistry } from "./TaskRegistry";
import { PostgresDispatcher } from "./dispatchers/postgres/PostgresDispatcher";
import { COMMANDS } from "./commands";
import { randomUUID } from "node:crypto";

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

    async call(context: U, config: TaskConfig = {}): Promise<UUID> {

        JsonSerializable.parse(context)

        const serializedTaskRequest: SerializedTaskRequest = {
            id: randomUUID(),
            queue: "default",
            task_name: this.taskFunction.name,
            args: context,
            max_retries: 3,
            priority: 3
        }

        return (await this.dispatcher.enqueue([serializedTaskRequest]))[0]
    }
}

type CallableTaskWrapper<U extends JsonSerializableObject> =
    TaskWrapper<U>
    & ((context: U, config?: TaskConfig) => Promise<UUID>);


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
        this.conn = conn || process.env.HYREX_DATABASE_URL
        this.apiKey = apiKey
        this.errorCallback = errorCallback

        if (this.conn) {
            this.dispatcher = new PostgresDispatcher({ conn: this.conn })
        } else {
            throw new Error("Could not find conn...")
            // this.dispatcher = new Sqlite3Dispatcher("tasks.db")
        }

        this.appTaskRegistry = new TaskRegistry()
    }

    async init() {
        if (process.env[COMMANDS.INIT_DB]) {
            await this.initDB()
        } else if (process.env[COMMANDS.RUN_WORKER]) {
            await this.runWorker()
        }
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

    async initDB() {
        if (!this.conn) {
            throw new Error(
                "To initialize the DB, you must first set the connection string by " +
                "passing it to Hyrex or setting the env var HYREX_DATABASE_URL"
            )
        }

        if (this.dispatcher instanceof PostgresDispatcher) {
            await this.dispatcher.initPostgresDB();
        } else {
            throw new Error("Dispatcher does not support initPostgresDB");
        }
    }

}

