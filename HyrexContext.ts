import { JsonType, HyrexTaskFunction } from "./utils";
import { SerializedTask } from "./dispatchers/HyrexDispatcher";
import { string } from "zod";

export type HyrexContext = {
    taskId: string,
    rootId: string,
    parentId: string | null,
    taskName: string,
    queue: string,
    priority: string,
    scheduledStart: string | null,
    queued: string,
    started: string,
    executorId: string,
};

let currentContext: HyrexContext | null  = null;

export const getHyrexContext = (): HyrexContext | null => {
    if (currentContext === null) {
        return null
    }
    return { ...currentContext }; // Return copy to prevent mutation
};

export const setHyrexContext = (context: HyrexContext) => {
    currentContext = { ...context };
};

export const clearHyrexContext = () => {
    currentContext = null
};
