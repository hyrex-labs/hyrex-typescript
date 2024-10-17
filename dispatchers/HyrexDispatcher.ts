import { UUID, TaskConfig, JsonSerializableObject } from "../utils";

export type SerializedTask = {
    "name": string,
    "context": JsonSerializableObject,
    "config": TaskConfig
}

export interface HyrexDispatcher {
    enqueue: (serializedTask: SerializedTask) => UUID
    dequeue: (...args: any[]) => any
}
