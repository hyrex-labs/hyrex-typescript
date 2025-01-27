import { UUID, JsonType, HyrexTaskConfig } from "../utils";

import { string, z } from "zod";
import { TaskHeartbeatResultMessage, ListenerMessage, ExecutorHeartbeatResultMessage, HyrexAppInfo } from "../types";
import { HyrexQueue, HyrexQueuePattern } from "../HyrexQueue";
import { CronJob, CronJobRun } from "../HyrexCronScheduler";

export type SerializedTaskRequest = {
    id: UUID,
    durable_id: string,
    root_id: string,
    parent_id: string | null,
    task_name: string,
    args: JsonType,
    queue: string,
    max_retries: number,
    priority: number,
    timeout_seconds: number | null,
    idempotency_key: string | null,
}

export type SerializedTask = {
    id: string,
    durable_id: string,
    root_id: string,
    parent_id: string | null,
    task_name: string,
    args: JsonType,
    queue: string,
    priority: string,
    timeout_seconds: number | null,
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

    attemptRetry(taskId: UUID): Promise<void>

    // Executor settings
    registerExecutor({ queues, queuePattern, executorId, executorName, workerName }: {
        executorId: string,
        queues: HyrexQueue[],
        queuePattern: HyrexQueuePattern,
        executorName: string,
        workerName: string
    }): Promise<void>

    disconnectExecutor({ executorId, stats }: { executorId: string, stats: object }): Promise<void>

    emitExecutorStats({ executorId, stats }: { executorId: string, stats: object }): Promise<void>

    updateQueuesOnExecutor({ executorId, queues }: { executorId: string, queues: HyrexQueue[] }): Promise<void>

    updateExecutorHeartbeat(heartbeatMsg: ExecutorHeartbeatResultMessage): Promise<void>

    // Tasks
    registerTask({ taskName, taskConfig, sourceCode }: {
        taskName: string,
        taskConfig?: HyrexTaskConfig,
        sourceCode?: string
    }): Promise<void>

    // Listening
    listen(hyrexListener: DispatcherListenerCallbacks): Promise<void>

    // Cron scheduling
    acquireSchedulerLock({ workerId, workerName }: { workerId: string, workerName: string }): Promise<number | null>

    updateLockHeartbeat({ lockId }: { lockId: number }): Promise<void>

    releaseSchedulerLock({ workerName }: { workerName: string }): Promise<void>

    pullCronJobExpressions(): Promise<CronJob[]>

    updateCronJobConfirmationTimestamp(jobId: number): Promise<void>

    scheduleCronJobRuns(cronJobRuns: CronJobRun[]): Promise<void>

    executeQueuedCronJobRun(): Promise<string>

    // Remote Logs
    setLogLink({ taskId, logLink }: { taskId: string, logLink: string }): Promise<void>

    registerHyrexApp(hyrexAppInfo: HyrexAppInfo): Promise<void>
}
