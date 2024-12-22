import { z } from 'zod'
import {
    HyrexTaskFunction,
    HyrexTaskConfig
} from "./utils";
import { HyrexDispatcher } from "./dispatchers/HyrexDispatcher";
import { HyrexExecutor } from "./worker/HyrexExecutor";
import { HyrexRegistry } from "./HyrexRegistry";
import { PostgresDispatcher } from "./dispatchers/postgres/PostgresDispatcher";
import { COMMANDS } from "./commands";
import { HyrexAdmin } from "./HyrexAdmin";
import { HyrexQueue, HyrexQueuePattern } from "./HyrexQueue";
import { HyrexCronScheduler } from "./HyrexCronScheduler";

const AppConfigSchema = z.object({
    appId: z.string(),
    conn: z.string().optional(),
    apiKey: z.string().optional(),
    errorCallback: z.function().optional(),
}).strict()

type AppConfig = z.infer<typeof AppConfigSchema>

const stringSchema = z.string()


type WorkerConfig = {
    queuePattern: string
    logLevel?: string
}

export class HyrexWorker {
    private dispatcher: HyrexDispatcher
    private appRegistry: HyrexRegistry
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

        this.appRegistry = new HyrexRegistry()
    }

    async init() {
        if (process.env[COMMANDS.INIT_DB]) {
            await this.initDB()
        } else if (process.env[COMMANDS.RUN_WORKER]) {
            const queuePattern = process.env[COMMANDS.QUEUE_PATTERN]
            if (queuePattern) {
                await this.runWorker({ queuePattern })
            } else {
                await this.runWorker()
            }
        } else if (process.env[COMMANDS.RUN_ADMIN]) {
            await this.runWorkerAdmin()
        } else if (process.env[COMMANDS.RUN_CRON_SCHEDULER]){
            await this.runCronScheduler()
        }
    }

    private registerTaskWithServer(taskName: string, taskFunc: HyrexTaskFunction, taskConfig: HyrexTaskConfig) {
        this.dispatcher.registerTask({
            taskName,
            cronExpr: taskConfig.cron,
            sourceCode: taskFunc.toString()
        })
    }

    addRegistry(taskRegistry: HyrexRegistry) {
        for (const key of Object.keys(taskRegistry.internalTaskRegistry)) {
            const { taskFunc, taskConfig } = taskRegistry.internalTaskRegistry[key]
            this.appRegistry.addFunction(key, taskFunc, taskConfig)
        }

        for (const key of Object.keys(taskRegistry.internalQueueRegistry)) {
            const queue = taskRegistry.internalQueueRegistry[key]
            this.appRegistry.addQueue(queue)
        }
    }

    async runWorker({ queuePattern, logLevel }: WorkerConfig = {
        queuePattern: "*",
        logLevel: "INFO",
    }) {
        const executorName = process.env[COMMANDS.EXECUTOR_NAME]
        if (!executorName) {
            throw new Error("No HYREX_EXECUTOR_NAME Found. Ensure this command is being executed via the CLI.")
        }

        const workerName = process.env[COMMANDS.WORKER_NAME]
        if (!workerName) {
            throw new Error("No HYREX_WORKER_NAME Found. Ensure this command is being executed via the CLI.")
        }

        console.log(`Received queue pattern: ${queuePattern}`)

        const executor = new HyrexExecutor({
            workerName: workerName,
            name: executorName,
            queuePattern: new HyrexQueuePattern({ pattern: queuePattern }),
            taskRegistry: this.appRegistry,
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

    async runCronScheduler() {
        const workerName = process.env[COMMANDS.WORKER_NAME]
        if (!workerName) {
            throw new Error("No HYREX_WORKER_NAME Found. Ensure this command is being executed via the CLI.")
        }

        const cronScheduler = new HyrexCronScheduler({
            dispatcher: this.dispatcher,
            workerName,
            workerId: workerName
        })

        cronScheduler.runCronScheduler()
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

        this.appRegistry.addFunction(taskFunction.name, taskFunction, taskConfig)
        this.registerTaskWithServer(taskFunction.name, taskFunction, taskConfig)
    }

}

