import { UUID, JsonSerializableObject } from "../utils";

import { z } from "zod";
import { TaskHeartbeatResultMessage, ListenerMessage, ExecutorHeartbeatResultMessage } from "../types";

export const TaskConfigSchema = z.object({
    queue: z.string().optional(),
    priority: z.number().min(1).max(10).optional(),
    maxRetries: z.number().min(0).max(10).optional(),
    cron: z.string().optional(),

})

export type TaskConfig = z.infer<typeof TaskConfigSchema>

export type SerializedTaskRequest = {
    id: UUID,
    task_name: string,
    args: JsonSerializableObject,
    queue: string,
    max_retries: number,
    priority: number,
}

export type SerializedTask = {
    id: string
    task_name: string,
    args: JsonSerializableObject,
}

export type DispatcherListenerCallbacks = {
    taskHeartbeatCallback: (msg: ListenerMessage) => Promise<void>,
    taskCancelCallback: (msg: ListenerMessage) => Promise<void>
}

export interface HyrexDispatcher {
    enqueue: (serializedTasks: SerializedTaskRequest[]) => Promise<UUID[]>
    dequeue: ({ numTasks, executorId, queue }: { numTasks: number, executorId: string, queue: string }) => Promise<SerializedTask[]>
    markTaskSuccess(taskId: UUID): Promise<void>
    markTaskFailed(taskId: UUID): Promise<void>
    markTaskCanceled(taskId: UUID): Promise<boolean>
    updateTaskHeartbeat(heartbeatMsg: TaskHeartbeatResultMessage): Promise<void>
    updateExecutorHeartbeat(heartbeatMsg: ExecutorHeartbeatResultMessage): Promise<void>
    registerExecutor({ queue, executorId, executorName }: { queue: string, executorId: string, executorName: string }): Promise<void>
    disconnectExecutor({ executorId }: { executorId: string }): Promise<void>
    listen(hyrexListener: DispatcherListenerCallbacks): Promise<void>
}
