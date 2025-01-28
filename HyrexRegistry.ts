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
import { isValidCron } from 'cron-validator'
import { envVariables } from "./EnvironmentVariables";
import { hyrexLogger } from "./logging/FrameworkLogger";
import { COMMANDS } from "./commands";

type HyrexTaskProps = {
    name: string;
    config?: HyrexTaskConfigInput
    func: HyrexTaskFunction;
}


export class HyrexRegistry {
    private dispatcher: HyrexDispatcher
    public internalTaskRegistry: InternalTaskRegistry
    public internalQueueRegistry: InternalQueueRegistry

    constructor() {
        this.internalTaskRegistry = {}
        this.internalQueueRegistry = {}

        const databaseUrl = envVariables.getDatabaseUrl()
        if (databaseUrl) {
            hyrexLogger.info("postgres", `Created New PostgresDispatcher in registry. pid=${process.pid}`, 'magenta')
            this.dispatcher = new PostgresDispatcher({ conn: databaseUrl })
        } else if (process.env.HYREX_API_KEY) {
            throw new Error("Registry is not implemented")
        } else {
            throw new Error("HYREX_DATABASE_URL is missing")
        }

    }

    print() {
        console.log("Task Registry:", Object.entries(this.internalTaskRegistry));
    }


    task<U extends JsonType>({ name, config, func }: HyrexTaskProps): TaskWrapper<U> {
        if (!config) {
            config = {}
        }
        const validatedTaskConfig = HyrexTaskConfigSchema.parse(config)
        this.addFunctionToRegistry(name, func as HyrexTaskFunction, validatedTaskConfig);
        return new TaskWrapper<U>(this.dispatcher, name, func, validatedTaskConfig);
    }

    private addFunctionToRegistry(name: string, taskFunction: HyrexTaskFunction, taskConfig: HyrexTaskConfig) {
        const stringValidation = z.string().safeParse(name)
        if (!stringValidation) {
            throw new Error(`TaskFunction name must be a string. Instead got ${typeof taskFunction.name}`)
        }

        this.addFunction(name, taskFunction, taskConfig)
    }

    private registerTaskWithServer(taskName: string, taskFunc: HyrexTaskFunction, taskConfig: HyrexTaskConfig) {
        if (process.env[COMMANDS.INIT_DB]) {
            return // Skip registration during database initialization
        }

        this.dispatcher.registerTask({
            taskName,
            taskConfig: taskConfig,
            sourceCode: taskFunc.toString()
        })
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

        if (taskConfig.cron && !isValidCron(taskConfig.cron)) {
            throw new Error(`Cron expr '${taskConfig.cron}' is invalid.`)
        }

        if (taskConfig.queue) {
            // console.log("Adding queue!!", taskName, taskConfig.queue)
            if (typeof taskConfig.queue === "string") {
                this.addQueue(new HyrexQueue({ name: taskConfig.queue }))
            } else {
                this.addQueue(new HyrexQueue(taskConfig.queue))
            }
        }

        this.internalTaskRegistry[taskName] = taskRegistration
        this.registerTaskWithServer(taskName, taskFunc, taskConfig)
    }

    getFunction(key: string): HyrexTaskFunction {
        const taskRegistration = this.internalTaskRegistry[key]
        if (!taskRegistration) {
            throw new Error(`Function with key "${key}" is not in the registry.`);
        }
        return taskRegistration.taskFunc
    }
}
