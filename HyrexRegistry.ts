import {
    JsonType,
    InternalTaskRegistry,
    HyrexTaskConfig,
    HyrexTaskConfigSchema,
    HyrexTaskFunction,
    HyrexTaskConfigInput, InternalQueueRegistry, HyrexListenerRegistrationSchema, HyrexQueuePatternArgsSchema
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
import { HyrexWorkflowBuilder } from "./workflow/HyrexWorkflowBuilder";
import { WorkflowTask } from "./workflow/HyrexWorkflowBuilder";
import { HyrexWorkflow, HyrexWorkflowSchema } from "./workflow/HyrexWorkflow";
import { PlatformDispatcher } from "./dispatchers/platform/PlatformDispatcher";

type HyrexTaskProps = {
    name: string;
    config?: HyrexTaskConfigInput
    argSchema?: z.ZodType;
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
        const apiKey = envVariables.getApiKey()
        if (apiKey) {
            hyrexLogger.info("platform", `Created New PlatformDispatcher in registry. pid=${process.pid}`, 'brown')
            this.dispatcher = new PlatformDispatcher({ apiKey })
        } else if (databaseUrl) {
            hyrexLogger.info("postgres", `Created New PostgresDispatcher in registry. pid=${process.pid}`, 'magenta')
            this.dispatcher = new PostgresDispatcher({ conn: databaseUrl })
        } else {
            throw new Error("Both HYREX_DATABASE_URL and HYREX_API_KEY are missing.")
        }

    }

    workflow({ name, config, workflowArgSchema, body }: {
        name: string,
        config: HyrexTaskConfigInput,
        workflowArgSchema?: z.ZodType,
        body: (workflowBuilder: HyrexWorkflowBuilder) => HyrexWorkflowBuilder
    }): HyrexWorkflow {
        hyrexLogger.info("workflow", `Registering workflow!`, `brightRed`)
        const validatedTaskConfig = HyrexTaskConfigSchema.parse(config)
        HyrexWorkflowSchema.parse({ name, config: validatedTaskConfig, workflowArgSchema, body })

        const workflowBuilder = new HyrexWorkflowBuilder()
        const completedWorkflowBuilder = body(workflowBuilder)

        if (!process.env[COMMANDS.INIT_DB]) {
            this.dispatcher.registerWorkflow({
                workflowName: name,
                sourceCode: body.toString(),
                workflowDagJson: completedWorkflowBuilder.toJson()
            })
        }

        return new HyrexWorkflow({
            name,
            config: validatedTaskConfig,
            workflowArgSchema,
            workflowDagJson: completedWorkflowBuilder.toJson(),
            dispatcher: this.dispatcher
        })
    }


    task<U extends JsonType>({ name, config, argSchema, func }: HyrexTaskProps): TaskWrapper<U> {
        if (!config) {
            config = {}
        }
        const validatedTaskConfig = HyrexTaskConfigSchema.parse(config)
        this.addFunctionToRegistry(name, func as HyrexTaskFunction, validatedTaskConfig, argSchema);
        return new TaskWrapper<U>(this.dispatcher, name, func, validatedTaskConfig, argSchema);
    }

    private addFunctionToRegistry(name: string, taskFunction: HyrexTaskFunction, taskConfig: HyrexTaskConfig, argSchema?: z.ZodType) {
        const stringValidation = z.string().safeParse(name)
        if (!stringValidation) {
            throw new Error(`TaskFunction name must be a string. Instead got ${typeof taskFunction.name}`)
        }

        this.addFunction(name, taskFunction, taskConfig, argSchema)
    }

    private registerTaskWithServer(taskName: string, taskFunc: HyrexTaskFunction, taskConfig: HyrexTaskConfig, argSchema?: z.ZodType) {
        if (process.env[COMMANDS.INIT_DB]) {
            return // Skip registration during database initialization
        }

        this.dispatcher.registerTask({
            taskName,
            taskConfig: taskConfig,
            sourceCode: taskFunc.toString(),
            argSchema: argSchema
        })
    }

    addQueue(queue: HyrexQueue) {
        if (this.internalQueueRegistry[queue.name] && !this.internalQueueRegistry[queue.name].equals(queue)) {
            throw new Error(`Conflicting concurrency limits set on queue ${queue.name}`)
        }

        this.internalQueueRegistry[queue.name] = queue;
    }

    addFunction(taskName: string, taskFunc: HyrexTaskFunction, taskConfig: HyrexTaskConfig, argSchema?: z.ZodType) {
        const taskRegistration = {
            taskFunc,
            taskConfig,
            argSchema
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
        this.registerTaskWithServer(taskName, taskFunc, taskConfig, argSchema)
    }

    getFunction(key: string): HyrexTaskFunction {
        const taskRegistration = this.internalTaskRegistry[key]
        if (!taskRegistration) {
            throw new Error(`Function with key "${key}" is not in the registry.`);
        }
        return taskRegistration.taskFunc
    }
}
