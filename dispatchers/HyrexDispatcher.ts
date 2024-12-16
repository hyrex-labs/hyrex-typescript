import { UUID, JsonType } from "../utils";

import { string, z } from "zod";
import { TaskHeartbeatResultMessage, ListenerMessage, ExecutorHeartbeatResultMessage } from "../types";
import { HyrexQueue, HyrexQueuePattern } from "../HyrexQueue";

export type SerializedTaskRequest = {
    id: UUID,
    parent_id: string | null,
    task_name: string,
    args: JsonType,
    queue: string,
    max_retries: number,
    priority: number,
}

export type SerializedTask = {
    id: string,
    root_id: string,
    parent_id: string | null,
    task_name: string,
    args: JsonType,
    queue: string,
    priority: string,
    scheduled_start: string | null,
    queued: string,
    started: string
}

export type DispatcherListenerCallbacks = {
    taskHeartbeatCallback: (msg: ListenerMessage) => Promise<void>,
    taskCancelCallback: (msg: ListenerMessage) => Promise<void>
}

export interface HyrexDispatcher {
    enqueue: (serializedTasks: SerializedTaskRequest[]) => Promise<UUID[]>
    dequeue: ({ numTasks, executorId, queueName, concurrencyLimit }: {
        numTasks: number,
        executorId: string,
        queueName: string,
        concurrencyLimit?: number
    }) => Promise<SerializedTask[]>
    fetchActiveQueueNames: ({ queuePattern }: { queuePattern: string }) => Promise<string[]>

    markTaskSuccess(taskId: UUID): Promise<void>

    markTaskFailed(taskId: UUID): Promise<void>

    markTaskCanceled(taskId: UUID): Promise<boolean>

    saveResult(taskId: UUID, result: JsonType): Promise<boolean>

    getResult(taskId: UUID): Promise<JsonType>

    updateTaskHeartbeat(heartbeatMsg: TaskHeartbeatResultMessage): Promise<void>

    // Executor settings
    registerExecutor({ queues, queuePattern, executorId, executorName, workerName }: {
        executorId: string,
        queues: HyrexQueue[],
        queuePattern: HyrexQueuePattern,
        executorName: string,
        workerName: string
    }): Promise<void>

    disconnectExecutor({ executorId, stats }: { executorId: string, stats: object }): Promise<void>

    updateQueuesOnExecutor({ executorId, queues }: { executorId: string, queues: HyrexQueue[] }): Promise<void>

    updateExecutorHeartbeat(heartbeatMsg: ExecutorHeartbeatResultMessage): Promise<void>


    // Listening
    listen(hyrexListener: DispatcherListenerCallbacks): Promise<void>
}
