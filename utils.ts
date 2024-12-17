import { z } from "zod";
import { TaskWrapper } from "./TaskWrapper";
import { HyrexQueue, HyrexQueuePattern } from "./HyrexQueue";

export const JsonSerializable = z.object({}).passthrough().refine(
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

type JsonPrimitive = string | number | boolean | null
type JsonArray = JsonValue[]
type JsonObject = { [key: string]: JsonValue }
type JsonValue = JsonPrimitive | JsonObject | JsonArray

export type JsonType = JsonObject

export const HyrexTaskFunctionSchema = z.union([
    // Function with no arguments
    z.function()
        .args()
        .returns(z.union([JsonSerializable, z.undefined()])),
    // Function with exactly one JSON serializable argument
    z.function()
        .args(JsonSerializable)
        .returns(z.union([JsonSerializable, z.undefined()]))
]);

export type HyrexTaskFunction<T extends JsonType = any, R extends JsonType = JsonType> =
    | ((arg: T) => R | void | Promise<R | void>)
    | (() => R | void | Promise<R | void>);

export type UUID = string

export const uuidSchema = z.string().uuid();

// const ThrottleSchema = z.object({
//     periodInSeconds: z.number().int().positive(),
//     limit: z.number().int().positive()
// })

export const HyrexQueuePatternArgsSchema = z.object({
    pattern: z.string(),
    concurrencyLimit: z.number().int().positive().optional(),
})

export type HyrexQueuePatternArgsType = z.infer<typeof HyrexQueuePatternArgsSchema>

const QueueObjectSchema = z.object({
    name: z.string(),
    concurrencyLimit: z.number().int().positive().optional(),
})

export const QueueSchema = z.union([
    z.string(),
    QueueObjectSchema
])

export type QueueType = z.infer<typeof QueueSchema>

export const HyrexTaskConfigSchema = z.object({
    onInit: z.function().args(z.any()).returns(z.any()).optional(),
    idempotencyKey: z.string().optional(),
    queue: QueueSchema.default("default"),
    queuePattern: HyrexQueuePatternArgsSchema.optional(),
    priority: z.number().min(1).max(10).default(3),
    maxRetries: z.number().min(0).max(10).default(3),
    cron: z.string().optional(),
});

export type HyrexTaskConfigInput = z.input<typeof HyrexTaskConfigSchema>
export type HyrexTaskConfig = z.infer<typeof HyrexTaskConfigSchema>;

export const TaskRegistrationSchema = z.object({ taskFunc: HyrexTaskFunctionSchema, taskConfig: HyrexTaskConfigSchema })

export type TaskRegistration = {
    taskFunc: HyrexTaskFunction,
    taskConfig: HyrexTaskConfig,
}

export const InternalTaskRegistrySchema = z.record(z.string(), TaskRegistrationSchema)
export type InternalTaskRegistry = {
    [key: string]: TaskRegistration
}

export type InternalQueueRegistry = {
    [key: string]: HyrexQueue
}

const HyrexCallableSchema = z.function()
    .args(JsonSerializable)  // Accepts any object as the argument
    .returns(z.any());

export function range(n: number): number[] {
    return Array.from({ length: n }, (_, i) => i);
}

export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function shuffle<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]]; // Swap elements
    }
    return array;
}
