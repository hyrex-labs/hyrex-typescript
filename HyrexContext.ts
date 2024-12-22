import { JsonType, HyrexTaskFunction } from "./utils";
import { SerializedTask } from "./dispatchers/HyrexDispatcher";
import { string } from "zod";

/**
 * Represents the execution context of a Hyrex task.
 * This context contains metadata about the task's lifecycle and execution environment.
 */
export type HyrexContext = {
    /** Unique identifier for the task */
    taskId: string;
    /** Persistent identifier for durable task storage */
    durableId: string;
    /** Identifier for the root task in the task tree */
    rootId: string;
    /** Identifier of the parent task, null if this is a root task */
    parentId: string | null;
    /** Name of the task being executed */
    taskName: string;
    /** Queue name where the task is processed */
    queue: string;
    /** Task priority level */
    priority: string;
    /** ISO timestamp when the task is scheduled to start, null for immediate execution */
    scheduledStart: string | null;
    /** ISO timestamp when the task was queued */
    queued: string;
    /** ISO timestamp when the task execution started */
    started: string;
    /** Unique identifier of the executor processing this task */
    executorId: string;
};

/**
 * Holds the current task execution context.
 * This is maintained as module-level state to track the currently executing task.
 */
let currentContext: HyrexContext | null = null;

/**
 * Retrieves the current Hyrex task execution context.
 *
 * @returns A copy of the current context object to prevent external mutation,
 *          or null if no context is currently set
 *
 * @example
 * const context = getHyrexContext();
 * if (context) {
 *   console.log(`Currently executing task: ${context.taskName}`);
 * }
 */
export const getHyrexContext = (): HyrexContext | null => {
    if (currentContext === null) {
        return null;
    }
    return { ...currentContext }; // Return copy to prevent mutation
};

/**
 * Sets the current Hyrex task execution context.
 * Creates a defensive copy of the provided context to prevent external mutation.
 *
 * @param context - The context object to set as current
 *
 * @example
 * const newContext: HyrexContext = {
 *   taskId: 'task-123',
 *   // ... other required fields
 * };
 * setHyrexContext(newContext);
 */
export const setHyrexContext = (context: HyrexContext) => {
    currentContext = { ...context };
};

/**
 * Clears the current Hyrex task execution context.
 * This should be called after task execution completes to prevent context leaks.
 *
 * @example
 * try {
 *   // Execute task
 * } finally {
 *   clearHyrexContext();
 * }
 */
export const clearHyrexContext = () => {
    currentContext = null;
};
