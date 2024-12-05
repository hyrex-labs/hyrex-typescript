import { z } from 'zod'
import {
    UUID,
    JsonSerializable,
    JsonType,
    sleep,
    range,
    InternalTaskRegistry,
    HyrexTaskFunction,
    HyrexTaskConfig
} from "./utils";
import {
    SerializedTask,
    TaskConfig,
    HyrexDispatcher,
    SerializedTaskRequest,
} from "./dispatchers/HyrexDispatcher";
import { HyrexExecutor } from "./worker/HyrexExecutor";
import { HyrexRegistry } from "./HyrexRegistry";
import { PostgresDispatcher } from "./dispatchers/postgres/PostgresDispatcher";
import { COMMANDS } from "./commands";
import { HyrexAdmin } from "./HyrexAdmin";

const AppConfigSchema = z.object({
    appId: z.string(),
    conn: z.string().optional(),
    apiKey: z.string().optional(),
    errorCallback: z.function().optional(),
}).strict()

type AppConfig = z.infer<typeof AppConfigSchema>

const stringSchema = z.string()


type WorkerConfig = {
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
        } else if (process.env[COMMANDS.RUN_WORKER_LISTENER]) {
            await this.runWorkerAdmin()
        }
    }

    addRegistry(taskRegistry: HyrexRegistry) {
        console.log("Calling add Registry!")
        for (const key of Object.keys(taskRegistry.internalTaskRegistry)) {
            const { taskFunc, taskConfig } = taskRegistry.internalTaskRegistry[key]
            this.appTaskRegistry.addFunction(key, taskFunc, taskConfig)
        }
    }

    async runWorker({ queue, logLevel }: WorkerConfig = {
        queue: "default",
        logLevel: "INFO",
    }) {
        const workerName = process.env.HYREX_WORKER_NAME
        if (!workerName) {
            throw new Error("No HYREX_WORKER_NAME Found. Ensure this command is being executed via the CLI.")
        }

        const executor = new HyrexExecutor({
            name: workerName,
            queue,
            taskRegistry: this.appTaskRegistry,
            dispatcher: this.dispatcher
        })

        executor.runExecutor()
    }

    async runWorkerAdmin() {
        const listener = new HyrexAdmin({
            dispatcher: this.dispatcher
        })

        listener.runAdmin()
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

    public addFunctionToRegistry(taskFunction: HyrexTaskFunction, taskConfig: HyrexTaskConfig) {
        const stringValidation = stringSchema.safeParse(taskFunction.name)
        if (!stringValidation) {
            throw new Error(`TaskFunction name must be a string. Instead got ${typeof taskFunction.name}`)
        }

        this.appTaskRegistry.addFunction(taskFunction.name, taskFunction, taskConfig)
    }

}

