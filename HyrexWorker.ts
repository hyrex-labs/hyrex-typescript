import { z } from 'zod'
import {
    CallableSchema, Callable, UUID, JsonSerializable, JsonSerializableObject, sleep, range, InternalTaskRegistry
} from "./utils";
import { SerializedTask, TaskConfig, HyrexDispatcher, SerializedTaskRequest } from "./dispatchers/HyrexDispatcher";
import { HyrexSynchronousWorker } from "./worker/HyrexSynchronousWorker";
import { HyrexRegistry } from "./HyrexRegistry";
import { PostgresDispatcher } from "./dispatchers/postgres/PostgresDispatcher";
import { COMMANDS } from "./commands";

const AppConfigSchema = z.object({
    appId: z.string(),
    conn: z.string().optional(),
    apiKey: z.string().optional(),
    errorCallback: z.function().optional(),
}).strict()

type AppConfig = z.infer<typeof AppConfigSchema>

const stringSchema = z.string()


type WorkerConfig = {
    numThreads: number
    queue: string
    logLevel: string
}

export class HyrexWorker {
    private dispatcher: HyrexDispatcher
    private appTaskRegistry: HyrexRegistry
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

        this.appTaskRegistry = new HyrexRegistry()
    }

    async init() {
        if (process.env[COMMANDS.INIT_DB]) {
            await this.initDB()
        } else if (process.env[COMMANDS.RUN_WORKER]) {
            await this.runWorker()
        }
    }

    addRegistry(taskRegistry: HyrexRegistry) {
        console.log("Calling add Registry!")
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

    private addFunctionToRegistry(taskFunction: Callable) {
        const stringValidation = stringSchema.safeParse(taskFunction.name)
        if (!stringValidation) {
            throw new Error(`TaskFunction name must be a string. Instead got ${typeof taskFunction.name}`)
        }

        this.appTaskRegistry.addFunction(taskFunction.name, taskFunction)
    }

}

