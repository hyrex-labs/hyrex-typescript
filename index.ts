import { z } from 'zod'
import { v5 as uuidv5 } from 'uuid';

const AppConfigSchema = z.object({
    appId: z.string(),
    conn: z.string().optional(),
    apiKey: z.string().optional(),
    errorCallback: z.function().optional(),
})
type AppConfig = z.infer<typeof AppConfigSchema>

const CallableSchema = z.function().args().returns(z.any());
type Callable = z.infer<typeof CallableSchema>

type UUID = string

const JsonSerializable = z.object({}).passthrough().refine(
    (obj) => {
        try {
            JSON.stringify(obj);
            return true;
        } catch (e) {
            return false;
        }
    },
    {
        message: "The object is not JSON-serializable",
    }
);

const InternalTaskRegistrySchema = z.record(z.string(), CallableSchema)
type InternalTaskRegistry = z.infer<typeof InternalTaskRegistrySchema>

const TaskConfigSchema = z.record(z.string(), z.any()) // TODO: Update this to be a config
type TaskConfig = z.infer<typeof TaskConfigSchema>

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

const HyrexCallableSchema = z.function()
    .args(JsonSerializable)  // Accepts any object as the argument
    .returns(z.any());

interface JsonSerializableObject {
    [key: string]: any; // Allows any property with any value
}


class TaskWrapper<U extends JsonSerializableObject> {
    constructor(private dispatcher: HyrexDispatcher, private taskFunction: (arg: U) => any) {}

    call(context: U, config: TaskConfig = {}) {
        // console.log("Sending off async...");

        JsonSerializable.parse(context)
        // console.log("Function name", this.taskFunction.name)

        const serializedTask = {
            "name": this.taskFunction.name,
            "context": context,
            "config": config
        }

        this.dispatcher.enqueue(serializedTask)
        // const result = this.taskFunction(context);

        // console.log("...function has been executed");

        // return result;
    }
}

type CallableTaskWrapper<U extends JsonSerializableObject> = TaskWrapper<U> & ((context: U, config?: TaskConfig) => any);

type SerializedTask = {
    "name": string,
    "context": JsonSerializableObject,
    "config": TaskConfig
}


interface HyrexDispatcher {
    enqueue: (serializedTask: SerializedTask) => UUID
    dequeue: (...args: any[]) => any
}

type HyrexPostgresDispatcherConfig = {
    conn: string
}

type HyrexConsoleDispatcherConfig = {
    randomSeed?: string
}

class HyrexConsoleDispatcher implements HyrexDispatcher {
    private nonce: number
    private namespace: string

    constructor(private config?: HyrexConsoleDispatcherConfig) {
        console.log("HyrexConsoleDispatcher set.")
        this.namespace = "00000000-0000-0000-0000-000000000000"
        this.nonce = 0
    }

    private generateUUID(): UUID {
        return uuidv5(`${this.nonce++}`, this.namespace)
    }

    enqueue(serializedTask: SerializedTask): UUID {
        console.log(`Sent ${JSON.stringify(serializedTask)}`)
        return this.generateUUID()
    }

    dequeue() {

    }
}

class HyrexPostgresDispatcher implements HyrexDispatcher {
    constructor(private config: HyrexPostgresDispatcherConfig) {

    }

    enqueue(serializedTask: SerializedTask): UUID {
        return ""
    }

    dequeue() {
        throw new Error("Not Implemented");
    }
}


export class Hyrex {
    private dispatcher: HyrexDispatcher
    private appTaskRegistry: TaskRegistry

    constructor(private appConfig: AppConfig) {
        AppConfigSchema.parse(appConfig)
        if (appConfig.conn) {
            this.dispatcher = new HyrexPostgresDispatcher({ conn: appConfig.conn });
        } else {
            this.dispatcher = new HyrexConsoleDispatcher()
        }

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

}

