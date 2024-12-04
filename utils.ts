import { z } from "zod";
import { TaskConfig } from "./dispatchers/HyrexDispatcher";
import { TaskWrapper } from "./TaskWrapper";

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

// const literalSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);
// type Literal = z.infer<typeof literalSchema>;

// export const JsonSchema: z.ZodType<unknown> = z.lazy(() =>
//     z.union([
//         literalSchema,
//         z.array(JsonSchema),
//         z.record(JsonSchema),
//     ])
// );

// export const CallableSchema = z.function().args(z.union([
//     z.tuple([]),
//     z.tuple([JsonSerializable])
// ])).returns(z.union([JsonSerializable, z.undefined()]));

// export type Callable = z.infer<typeof CallableSchema>

type JsonPrimitive = string | number | boolean | null
type JsonArray = JsonValue[]
type JsonObject = { [key: string]: JsonValue }
type JsonValue = JsonPrimitive | JsonObject | JsonArray

// export type JsonType = z.infer<typeof JsonSerializable>;
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

// export type HyrexTaskFunction =
//     | (() => JsonType | void | Promise<JsonType | void>)
//     | ((arg: JsonType) => JsonType | void | Promise<JsonType | void>);

// export type HyrexTaskFunction = {
//     // No argument variant
//     <R extends JsonType>(): R | void | Promise<R | void>
//     // Single argument variant - allows any object shape
//     <T extends JsonType, R extends JsonType>(arg: T): R | void | Promise<R | void>
// }

export type HyrexTaskFunction<T extends JsonType = any, R extends JsonType = JsonType> =
    | ((arg: T) => R | void | Promise<R | void>)
    | (() => R | void | Promise<R | void>);

export type UUID = string

export const uuidSchema = z.string().uuid();


// export interface JsonSerializableObject {
//     [key: string]: any; // Allows any property with any value
// }


const HyrexTaskConfigSchema = z.object({
    onInit: z.function().args(z.any()).returns(z.any()).optional()
});

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

// export type InternalTaskRegistry = {
//     [key: string]: TaskRegistry
// }

const HyrexCallableSchema = z.function()
    .args(JsonSerializable)  // Accepts any object as the argument
    .returns(z.any());

export function range(n: number): number[] {
    return Array.from({ length: n }, (_, i) => i);
}

export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export type CallableTaskWrapper<U extends JsonType> =
    TaskWrapper<U>
    & ((context?: U, config?: TaskConfig) => Promise<UUID>);
