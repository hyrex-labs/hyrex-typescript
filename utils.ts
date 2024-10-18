import { z } from "zod";

export const CallableSchema = z.function().args().returns(z.any());
export type Callable = z.infer<typeof CallableSchema>

export type UUID = string


export interface JsonSerializableObject {
    [key: string]: any; // Allows any property with any value
}

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

const HyrexCallableSchema = z.function()
    .args(JsonSerializable)  // Accepts any object as the argument
    .returns(z.any());

export function range(n: number): number[] {
    return Array.from({ length: n }, (_, i) => i);
}

export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}
