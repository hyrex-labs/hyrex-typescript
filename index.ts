import { z } from 'zod'

const AppConfigSchema = z.object({
    appId: z.string(),
    conn: z.string().optional(),
    apiKey: z.string().optional(),
    errorCallback: z.function().optional(),
})
type AppConfig = z.infer<typeof AppConfigSchema>

const CallableSchema = z.function().args().returns(z.any());
type Callable = z.infer<typeof CallableSchema>

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
type HyrexCallable<T extends object> = (arg: T) => any;

type EnsureSingleObjectArg<T> = T extends (arg: infer A) => any
    ? A extends object
        ? T
        : never
    : never;

class TaskWrapper<T extends HyrexCallable<U>, U extends object> {

    constructor(private taskFunction: T) {
        const callable = (context: U, config?: TaskConfig) => {
            console.log("Sending off async...");

            const result = this.taskFunction(context);

            console.log("...function has been executed");
        };

        return Object.assign(callable, this);
    }
}

type CallableTaskWrapper<T extends (arg: object) => any, U extends object> =
    TaskWrapper<T, U> & ((context: U, config?: TaskConfig) => ReturnType<T>);


interface HyrexCore {
    enqueue: (...args: any[]) => any
    dequeue: (...args: any[]) => any
}

type HyrexPostgresCoreConfig = {
    conn: string
}

class HyrexConsoleCore implements HyrexCore {
    enqueue() {

    }

    dequeue() {

    }
}

class HyrexPostgresCore implements HyrexCore {
    constructor(private config: HyrexPostgresCoreConfig) {

    }

    enqueue() {

    }

    dequeue() {
        throw new Error("Not Implemented");
    }
}


export class Hyrex {
    private core: HyrexCore
    private appTaskRegistry: TaskRegistry

    constructor(private appConfig: AppConfig) {
        AppConfigSchema.parse(appConfig)
        if (appConfig.conn) {
            this.core = new HyrexPostgresCore({ conn: appConfig.conn });
        } else {
            this.core = new HyrexConsoleCore()
        }

        this.appTaskRegistry = new TaskRegistry()
    }

    // task<T extends HyrexCallable<U>, U extends object>(taskFunction: T): CallableTaskWrapper<T, U> {
    //     return new TaskWrapper(taskFunction) as unknown as CallableTaskWrapper<T, U>;
    // }

    // task<T extends (arg: U) => any, U extends object>(taskFunction: T): CallableTaskWrapper<T, U> {
    //     // TaskWrapper and CallableTaskWrapper both use T and U consistently
    //     return new TaskWrapper(taskFunction) as unknown as CallableTaskWrapper<T, U>;
    // }

    task<T extends (arg: U) => any, U extends object>(taskFunction: T): CallableTaskWrapper<T, U> {
        // Safely create the TaskWrapper with inferred types and return the correct type
        return new TaskWrapper(taskFunction) as unknown as CallableTaskWrapper<T, U>;
    }

    addRegistry(taskRegistry: TaskRegistry) {
        for (const key of Object.keys(taskRegistry.internalTaskRegistry)) {
            this.appTaskRegistry.addFunction(key, taskRegistry.internalTaskRegistry[key])
        }
    }

}

