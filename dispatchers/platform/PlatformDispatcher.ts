import {
    HyrexDispatcher,
    SerializedTask,
    SerializedTaskRequest,
    DispatcherListenerCallbacks
} from "../HyrexDispatcher";
import * as grpc from '@grpc/grpc-js';
import { UUID, JsonType, HyrexTaskConfig } from "../../utils";
import { z } from 'zod';
import { AdminMessage, TaskHeartbeatResultMessage, ExecutorHeartbeatResultMessage, HyrexAppInfo } from "../../types";
import { HyrexQueue, HyrexQueuePattern } from "../../HyrexQueue";
import { CronJob, CronJobRun } from "../../cron/HyrexCronScheduler";
import { SerializedWorkflowRunRequest } from "../../workflow/HyrexWorkflow";
import { WorkflowDagJson } from "../../workflow/HyrexWorkflowBuilder";

// Import generated clients
import { GatewayServiceClient } from './generated/gateway_grpc_pb';
import * as gateway_pb from './generated/gateway_pb';
import * as requests_pb from './generated/requests_pb';
import * as task_pb from './generated/task_pb';
import * as google_protobuf_struct_pb from 'google-protobuf/google/protobuf/struct_pb';
import * as google_protobuf_empty_pb from 'google-protobuf/google/protobuf/empty_pb';
import * as google_protobuf_timestamp_pb from 'google-protobuf/google/protobuf/timestamp_pb';
import { hyrexLogger } from "../../logging/FrameworkLogger";

export class PlatformDispatcher implements HyrexDispatcher {
    private client: grpc.Client;
    private serviceClient: GatewayServiceClient;
    private metadata: grpc.Metadata;

    constructor({ apiKey }: { apiKey: string }) {
        if (!apiKey) {
            throw new Error('API key is required for PlatformDispatcher');
        }

        // Create gRPC client
        this.serviceClient = new GatewayServiceClient('api.hyrex.io', grpc.credentials.createSsl());
        this.client = this.serviceClient as unknown as grpc.Client;

        // Create metadata with API key
        this.metadata = new grpc.Metadata();
        this.metadata.set('x-api-key', apiKey);
    }

    // /**
    //  * Create a PlatformDispatcher instance using environment variables
    //  * Requires HYREX_API_KEY to be set
    //  */
    // static fromEnv(serverAddress?: string): PlatformDispatcher {
    //     const apiKey = process.env.HYREX_API_KEY;
    //     if (!apiKey) {
    //         throw new Error('HYREX_API_KEY environment variable is required');
    //     }
    //
    //     return new PlatformDispatcher({ apiKey });
    // }

    // Convert task status string to proto enum
    private taskStatusToProto(status: string): task_pb.TaskStatusMap[keyof task_pb.TaskStatusMap] {
        switch (status) {
            case 'queued':
                return task_pb.TaskStatus.QUEUED;
            case 'waiting':
                return task_pb.TaskStatus.WAITING;
            case 'running':
                return task_pb.TaskStatus.RUNNING;
            case 'success':
                return task_pb.TaskStatus.SUCCESS;
            case 'failed':
                return task_pb.TaskStatus.FAILED;
            case 'up_for_cancel':
                return task_pb.TaskStatus.UP_FOR_CANCEL;
            case 'canceled':
                return task_pb.TaskStatus.CANCELED;
            case 'lost':
                return task_pb.TaskStatus.LOST;
            case 'skipped':
                return task_pb.TaskStatus.SKIPPED;
            default:
                return task_pb.TaskStatus.UNSPECIFIED;
        }
    }

    // Convert proto task status to string
    private protoToTaskStatus(status: task_pb.TaskStatusMap[keyof task_pb.TaskStatusMap]): string {
        switch (status) {
            case task_pb.TaskStatus.QUEUED:
                return 'queued';
            case task_pb.TaskStatus.WAITING:
                return 'waiting';
            case task_pb.TaskStatus.RUNNING:
                return 'running';
            case task_pb.TaskStatus.SUCCESS:
                return 'success';
            case task_pb.TaskStatus.FAILED:
                return 'failed';
            case task_pb.TaskStatus.UP_FOR_CANCEL:
                return 'up_for_cancel';
            case task_pb.TaskStatus.CANCELED:
                return 'canceled';
            case task_pb.TaskStatus.LOST:
                return 'lost';
            case task_pb.TaskStatus.SKIPPED:
                return 'skipped';
            default:
                return 'unknown';
        }
    }

    // Convert priority number to proto enum
    private priorityToProto(priority: number): task_pb.PriorityMap[keyof task_pb.PriorityMap] {
        // Map priority 1-10 to proto enum
        return priority as unknown as task_pb.PriorityMap[keyof task_pb.PriorityMap];
    }

    // Convert proto TaskRun to SerializedTask
    private protoTaskRunToSerializedTask(taskRun: task_pb.TaskRun): SerializedTask {
        const queued = taskRun.getQueued();
        const started = taskRun.getStarted();
        const scheduled = taskRun.getScheduledStart();

        return {
            id: taskRun.getId(),
            durable_id: taskRun.getDurableId(),
            root_id: taskRun.getRootId(),
            attempt_number: taskRun.getAttemptNumber(),
            max_retries: taskRun.getMaxRetries(),
            workflow_run_id: taskRun.hasWorkflowRunId() ? taskRun.getWorkflowRunId() : null,
            parent_id: taskRun.getParentId() || null,
            task_name: taskRun.getTaskName(),
            args: (() => {
                const argsBuffer = Buffer.from(taskRun.getArgs_asU8());
                if (argsBuffer.length === 0) {
                    return null;
                }
                const argsString = argsBuffer.toString();
                try {
                    return JSON.parse(argsString);
                } catch (e) {
                    // If it's not valid JSON, treat it as a plain string
                    return argsString;
                }
            })(),
            queue: taskRun.getQueue(),
            priority: taskRun.getPriority().toString(),
            timeout_seconds: taskRun.hasTimeoutSeconds() ? taskRun.getTimeoutSeconds() : null,
            scheduled_start: scheduled ? scheduled.toDate().toISOString() : null,
            queued: queued ? queued.toDate().toISOString() : null,
            started: started ? started.toDate().toISOString() : null
        };
    }

    // Implement HyrexDispatcher interface methods
    async enqueue(serializedTasks: SerializedTaskRequest[]): Promise<UUID[]> {
        const taskIds: UUID[] = [];

        for (const task of serializedTasks) {
            const request = new requests_pb.EnqueueRequest();
            request.setId(task.id);
            request.setDurableId(task.durable_id);
            request.setRootId(task.root_id);

            if (task.workflow_run_id) {
                request.setWorkflowRunId(task.workflow_run_id);
            }

            if (task.workflow_dependencies && task.workflow_dependencies.length > 0) {
                request.setWorkflowDependenciesList(task.workflow_dependencies);
            }

            if (task.parent_id) {
                request.setParentId(task.parent_id);
            }

            // Status is not set on EnqueueRequest - it's determined by the server
            request.setTaskName(task.task_name);
            request.setArgs(Buffer.from(JSON.stringify(task.args || null)));
            request.setQueue(task.queue);
            request.setMaxRetries(task.max_retries);
            request.setPriority(this.priorityToProto(task.priority));

            if (task.timeout_seconds !== null) {
                request.setTimeoutSeconds(task.timeout_seconds);
            }

            if (task.idempotency_key) {
                request.setIdempotencyKey(task.idempotency_key);
            }

            try {
                await new Promise<void>((resolve, reject) => {
                    this.serviceClient.enqueue(request, this.metadata, (err: Error | null, response?: google_protobuf_empty_pb.Empty) => {
                        if (err) reject(err);
                        else resolve();
                    });
                });

                taskIds.push(task.id);
            } catch (error) {
                console.error('Error enqueueing task:', error);
                throw error;
            }
        }

        return taskIds;
    }

    async dequeue({ numTasks, executorId, queueName, concurrencyLimit, taskNames }: {
        numTasks: number,
        executorId: string,
        queueName: string,
        concurrencyLimit?: number,
        taskNames: string[]
    }): Promise<SerializedTask[]> {
        const serializedTasks: SerializedTask[] = [];

        // For simplicity, we'll just dequeue one task at a time
        // In a real implementation, you might want to implement batching
        for (let i = 0; i < numTasks; i++) {
            const request = new requests_pb.DequeueRequest();
            request.setExecutorId(executorId);
            request.setQueue(queueName);

            try {
                const response = await new Promise<requests_pb.DequeueResponse | undefined>((resolve, reject) => {
                    this.serviceClient.dequeue(request, this.metadata, (err: Error | null, response?: requests_pb.DequeueResponse) => {
                        if (err) reject(err);
                        else resolve(response);
                    });
                });

                if (response && response.getTaskRun()) {
                    serializedTasks.push(this.protoTaskRunToSerializedTask(response.getTaskRun()!));
                } else {
                    // No more tasks to dequeue
                    break;
                }
            } catch (error) {
                console.error('Error dequeueing task:', error);
                throw error;
            }
        }

        return serializedTasks;
    }

    async fetchActiveQueueNames({ queuePattern }: { queuePattern: string }): Promise<string[]> {
        const request = new requests_pb.GetQueuesRequest();
        request.setPattern(queuePattern);

        try {
            const response = await new Promise<requests_pb.GetQueuesResponse | undefined>((resolve, reject) => {
                this.serviceClient.getQueues(request, this.metadata, (err: Error | null, response?: requests_pb.GetQueuesResponse) => {
                    if (err) reject(err);
                    else resolve(response);
                });
            });

            return response ? response.getQueuesList() : [];
        } catch (error) {
            console.error('Error fetching active queue names:', error);
            throw error;
        }
    }

    async markTaskSuccess(taskId: UUID): Promise<void> {
        const request = new requests_pb.MarkSuccessRequest();
        request.setTaskRunId(taskId);

        try {
            await new Promise<void>((resolve, reject) => {
                this.serviceClient.markSuccess(request, this.metadata, (err: Error | null, response?: google_protobuf_empty_pb.Empty) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        } catch (error) {
            console.error('Error marking task as success:', error);
            throw error;
        }
    }

    async markTaskFailed(taskId: UUID): Promise<void> {
        const request = new requests_pb.MarkFailedRequest();
        request.setTaskRunId(taskId);

        try {
            await new Promise<void>((resolve, reject) => {
                this.serviceClient.markFailed(request, this.metadata, (err: Error | null, response?: google_protobuf_empty_pb.Empty) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        } catch (error) {
            console.error('Error marking task as failed:', error);
            throw error;
        }
    }

    // Implement other required methods from HyrexDispatcher interface
    // These are placeholders that should be implemented properly

    async markTaskCanceled(taskId: UUID): Promise<boolean> {
        // Mark as failed with a cancellation message
        const request = new requests_pb.MarkFailedRequest();
        request.setTaskRunId(taskId);

        try {
            await new Promise<void>((resolve, reject) => {
                this.serviceClient.markFailed(request, this.metadata, (err: Error | null, response?: google_protobuf_empty_pb.Empty) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
            return true;
        } catch (error) {
            console.error('Error marking task as canceled:', error);
            return false;
        }
    }

    async saveResult(taskId: UUID, result: JsonType): Promise<boolean> {
        const request = new requests_pb.MarkSuccessRequest();
        request.setTaskRunId(taskId);
        request.setResult(JSON.stringify(result));

        try {
            await new Promise<void>((resolve, reject) => {
                this.serviceClient.markSuccess(request, this.metadata, (err: Error | null, response?: google_protobuf_empty_pb.Empty) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
            return true;
        } catch (error) {
            console.error('Error saving result:', error);
            return false;
        }
    }

    async getResult(taskId: UUID): Promise<JsonType> {
        const request = new requests_pb.GetTaskRunRequest();
        request.setTaskRunId(taskId);

        try {
            const response = await new Promise<requests_pb.GetTaskRunResponse | undefined>((resolve, reject) => {
                this.serviceClient.getTaskRun(request, this.metadata, (err: Error | null, response?: requests_pb.GetTaskRunResponse) => {
                    if (err) reject(err);
                    else resolve(response);
                });
            });

            if (response && response.getTaskRun()) {
                const task = response.getTaskRun()!;
                const resultStr = task.getResult();
                return resultStr ? JSON.parse(resultStr) : ({} as JsonType);
            }

            return {} as JsonType;
        } catch (error) {
            console.error('Error getting result:', error);
            throw error;
        }
    }

    async updateTaskHeartbeat(heartbeatMsg: TaskHeartbeatResultMessage): Promise<void> {
        const request = new requests_pb.TaskRunHeartbeatRequest();
        request.setTaskRunIdsList([heartbeatMsg.body.taskId]);

        const timestamp = new google_protobuf_timestamp_pb.Timestamp();
        const now = new Date();
        timestamp.setSeconds(Math.floor(now.getTime() / 1000));
        timestamp.setNanos((now.getTime() % 1000) * 1000000);
        request.setTimestamp(timestamp);

        try {
            await new Promise<void>((resolve, reject) => {
                this.serviceClient.taskRunHeartbeat(request, this.metadata, (err: Error | null, response?: google_protobuf_empty_pb.Empty) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        } catch (error) {
            console.error('Error updating task heartbeat:', error);
            throw error;
        }
    }

    async attemptRetry(taskId: UUID): Promise<void> {
        const request = new requests_pb.RetryTaskRunRequest();
        request.setTaskRunId(taskId);
        request.setBackoffSeconds(0); // Immediate retry

        try {
            await new Promise<void>((resolve, reject) => {
                this.serviceClient.retryTaskRun(request, this.metadata, (err: Error | null, response?: google_protobuf_empty_pb.Empty) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        } catch (error) {
            console.error('Error attempting retry:', error);
            throw error;
        }
    }

    async registerExecutor({ queues, queuePattern, executorId, executorName, workerName }: {
        executorId: string,
        queues: string[],
        queuePattern: HyrexQueuePattern,
        executorName: string,
        workerName: string
    }): Promise<void> {
        const request = new requests_pb.RegisterExecutorRequest();
        request.setExecutorId(executorId);
        request.setExecutorName(executorName);
        request.setQueuePattern(queuePattern.pattern);
        request.setQueuesList(queues);
        request.setWorkerName(workerName);

        try {
            await new Promise<void>((resolve, reject) => {
                this.serviceClient.registerExecutor(request, this.metadata, (err: Error | null, response?: google_protobuf_empty_pb.Empty) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        } catch (error) {
            console.error('Error registering executor:', error);
            throw error;
        }
    }

    async disconnectExecutor({ executorId, stats }: { executorId: string, stats: object }): Promise<void> {
        const request = new requests_pb.DisconnectExecutorRequest();
        request.setExecutorId(executorId);

        try {
            await new Promise<void>((resolve, reject) => {
                this.serviceClient.disconnectExecutor(request, this.metadata, (err: Error | null, response?: google_protobuf_empty_pb.Empty) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        } catch (error) {
            console.error('Error disconnecting executor:', error);
            throw error;
        }
    }

    async emitExecutorStats({ executorId, stats }: {
        executorId: string,
        stats: object
    }): Promise<'ACCEPTED' | 'REJECTED'> {
        const request = new requests_pb.UpdateExecutorStatsRequest();
        request.setExecutorId(executorId);

        // Convert stats object to protobuf Struct
        const statsStruct = new google_protobuf_struct_pb.Struct();
        const fieldsMap = statsStruct.getFieldsMap();

        for (const [key, value] of Object.entries(stats)) {
            const protoValue = new google_protobuf_struct_pb.Value();
            if (typeof value === 'number') {
                protoValue.setNumberValue(value);
            } else if (typeof value === 'string') {
                protoValue.setStringValue(value);
            } else if (typeof value === 'boolean') {
                protoValue.setBoolValue(value);
            } else if (value === null) {
                protoValue.setNullValue(0);
            } else if (typeof value === 'object') {
                // For nested objects, convert to JSON string
                protoValue.setStringValue(JSON.stringify(value));
            }
            fieldsMap.set(key, protoValue);
        }

        request.setExecutorStats(statsStruct);

        try {
            await new Promise<void>((resolve, reject) => {
                this.serviceClient.updateExecutorStats(request, this.metadata, (err: Error | null, response?: google_protobuf_empty_pb.Empty) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
            return 'ACCEPTED';
        } catch (error) {
            console.error('Error emitting executor stats:', error);
            return 'REJECTED';
        }
    }

    async updateQueuesOnExecutor({ executorId, queues }: { executorId: string, queues: HyrexQueue[] }): Promise<void> {
        const request = new requests_pb.UpdateExecutorQueuesRequest();
        request.setExecutorId(executorId);
        request.setQueuesList(queues.map(q => q.name));

        try {
            await new Promise<void>((resolve, reject) => {
                this.serviceClient.updateExecutorQueues(request, this.metadata, (err: Error | null, response?: google_protobuf_empty_pb.Empty) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        } catch (error) {
            console.error('Error updating queues on executor:', error);
            throw error;
        }
    }

    async updateExecutorHeartbeat(heartbeatMsg: ExecutorHeartbeatResultMessage): Promise<void> {
        const request = new requests_pb.ExecutorHeartbeatRequest();
        request.setExecutorIdsList(heartbeatMsg.body.executorIds);

        const timestamp = new google_protobuf_timestamp_pb.Timestamp();
        const now = new Date();
        timestamp.setSeconds(Math.floor(now.getTime() / 1000));
        timestamp.setNanos((now.getTime() % 1000) * 1000000);
        request.setTimestamp(timestamp);

        try {
            await new Promise<void>((resolve, reject) => {
                this.serviceClient.executorHeartbeat(request, this.metadata, (err: Error | null, response?: google_protobuf_empty_pb.Empty) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        } catch (error) {
            console.error('Error updating executor heartbeat:', error);
            throw error;
        }
    }

    async updateExecutorHeartbeats({ executorIds }: { executorIds: string[] }): Promise<void> {
        const request = new requests_pb.ExecutorHeartbeatRequest();
        request.setExecutorIdsList(executorIds);

        const timestamp = new google_protobuf_timestamp_pb.Timestamp();
        const now = new Date();
        timestamp.setSeconds(Math.floor(now.getTime() / 1000));
        timestamp.setNanos((now.getTime() % 1000) * 1000000);
        request.setTimestamp(timestamp);

        try {
            await new Promise<void>((resolve, reject) => {
                this.serviceClient.executorHeartbeat(request, this.metadata, (err: Error | null, response?: google_protobuf_empty_pb.Empty) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        } catch (error) {
            console.error('Error updating executor heartbeats:', error);
            throw error;
        }
    }

    async registerTask({ taskName, taskConfig, sourceCode, argSchema }: {
        taskName: string,
        taskConfig?: HyrexTaskConfig,
        sourceCode?: string,
        argSchema?: z.ZodType
    }): Promise<void> {
        const request = new requests_pb.RegisterTaskDefRequest();
        const taskDef = new task_pb.TaskDef();
        taskDef.setTaskName(taskName);

        if (sourceCode) {
            taskDef.setSourceCode(sourceCode);
        }

        // Convert argSchema to proto format if provided
        if (argSchema) {
            const argSchemaStruct = new google_protobuf_struct_pb.Struct();
            const fieldsMap = argSchemaStruct.getFieldsMap();
            
            // Store the schema definition as a JSON string
            const val = new google_protobuf_struct_pb.Value();
            val.setStringValue(JSON.stringify(argSchema._def));
            fieldsMap.set('schema', val);
            
            taskDef.setArgSchema(argSchemaStruct);
        }

        // Convert taskConfig to proto format if provided
        if (taskConfig) {
            // TaskDef in proto only has defaultConfig as a Struct, not individual fields
            // We'll need to convert the config to a Struct
            const defaultConfig = new google_protobuf_struct_pb.Struct();
            const fieldsMap = defaultConfig.getFieldsMap();

            if (taskConfig.maxRetries !== undefined) {
                const val = new google_protobuf_struct_pb.Value();
                val.setNumberValue(taskConfig.maxRetries);
                fieldsMap.set('maxRetries', val);
            }
            if (taskConfig.timeoutSeconds !== undefined) {
                const val = new google_protobuf_struct_pb.Value();
                val.setNumberValue(taskConfig.timeoutSeconds);
                fieldsMap.set('timeoutSeconds', val);
            }
            if (taskConfig.queue !== undefined) {
                const val = new google_protobuf_struct_pb.Value();
                const queueName = typeof taskConfig.queue === 'string' ? taskConfig.queue : taskConfig.queue.name;
                val.setStringValue(queueName);
                fieldsMap.set('queue', val);
            }
            if (taskConfig.priority !== undefined) {
                const val = new google_protobuf_struct_pb.Value();
                val.setNumberValue(taskConfig.priority);
                fieldsMap.set('priority', val);
            }

            taskDef.setDefaultConfig(defaultConfig);
        }

        request.setTaskDef(taskDef);

        try {
            await new Promise<void>((resolve, reject) => {
                this.serviceClient.registerTaskDef(request, this.metadata, (err: Error | null, response?: google_protobuf_empty_pb.Empty) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        } catch (error) {
            console.error('Error registering task:', error);
            throw error;
        }
    }

    async listen(hyrexListener: DispatcherListenerCallbacks): Promise<void> {
        hyrexLogger.info("platform", "Listener callbacks automatically managed by platform", "dim");
    }

    async acquireSchedulerLock({ workerId, workerName }: {
        workerId: string,
        workerName: string
    }): Promise<number | null> {
        const request = new requests_pb.AcquireSchedulerLockRequest();
        request.setWorkerName(workerName);
        request.setDuration("5m"); // Assuming a 5-minute lock duration

        try {
            const response = await new Promise<requests_pb.AcquireSchedulerLockResponse | undefined>((resolve, reject) => {
                this.serviceClient.acquireSchedulerLock(request, this.metadata, (err: Error | null, response?: requests_pb.AcquireSchedulerLockResponse) => {
                    if (err) reject(err);
                    else resolve(response);
                });
            });

            return response && response.hasLockId() ? response.getLockId() : null;
        } catch (error) {
            console.error('Error acquiring scheduler lock:', error);
            return null;
        }
    }

    async updateLockHeartbeat({ lockId }: { lockId: number }): Promise<void> {
        hyrexLogger.info("cron-scheduling", "Scheduler lock automatically managed by platform", "dim");
    }

    async releaseSchedulerLock({ workerName }: { workerName: string }): Promise<void> {
        hyrexLogger.info("cron-scheduling", "Scheduler lock automatically managed by platform", "dim");
    }

    async pullCronJobExpressions(): Promise<CronJob[]> {
        // Not directly implemented in the proto
        return [];
    }

    async updateCronJobConfirmationTimestamp(jobId: number): Promise<void> {
        hyrexLogger.info("platform", "Cron job confirmation automatically managed by platform", "dim");
    }

    async scheduleCronJobRuns(cronJobRuns: CronJobRun[]): Promise<void> {
        hyrexLogger.info("platform", "Cron job scheduling automatically managed by platform", "dim");
    }

    async executeQueuedCronJobRun(): Promise<string | null> {
        // Not directly implemented in the proto
        return null;
    }

    async setLogLink({ taskId, logLink }: { taskId: string, logLink: string }): Promise<void> {
        const request = new requests_pb.SetLogLinkRequest();
        request.setTaskRunId(taskId);
        request.setLogLink(logLink);

        try {
            await new Promise<void>((resolve, reject) => {
                this.serviceClient.setLogLink(request, this.metadata, (err: Error | null, response?: google_protobuf_empty_pb.Empty) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        } catch (error) {
            console.error('Error setting log link:', error);
            throw error;
        }
    }

    async writeS3Logs(taskId: string, logs: string[]): Promise<void> {
        const request = new requests_pb.WriteLogsRequest();
        request.setTaskRunId(taskId);
        request.setLogs(logs.join(''));

        try {
            await new Promise<void>((resolve, reject) => {
                this.serviceClient.writeLogs(request, this.metadata, (err: Error | null, response?: google_protobuf_empty_pb.Empty) => {
                    if (err) reject(err);
                    else resolve();
                });
            });

            hyrexLogger.info('platform', `Logs successfully sent to platform for upload. taskId=${taskId}`, 'green');
        } catch (error) {
            hyrexLogger.error('platform', `Failed to send logs to platform for task ${taskId}: ${error}`, 'red');
            throw error;
        }
    }

    async registerHyrexApp(hyrexAppInfo: HyrexAppInfo): Promise<void> {
        const request = new requests_pb.RegisterAppRequest();
        const struct = new google_protobuf_struct_pb.Struct();

        // Convert app info to Struct
        const fieldsMap = struct.getFieldsMap();

        // Handle only the name field for now, since that's what HyrexAppInfo contains
        if (hyrexAppInfo && typeof hyrexAppInfo.name === 'string') {
            const val = new google_protobuf_struct_pb.Value();
            val.setStringValue(hyrexAppInfo.name);
            fieldsMap.set('name', val);
        }

        request.setAppInfo(struct);

        try {
            await new Promise<void>((resolve, reject) => {
                this.serviceClient.registerApp(request, this.metadata, (err: Error | null, response?: google_protobuf_empty_pb.Empty) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        } catch (error) {
            console.error('Error registering Hyrex app:', error);
            throw error;
        }
    }

    async acquireListenerLock({ workerName }: { workerName: string }): Promise<string | null> {
        // Not directly implemented in the proto
        return null;
    }

    async registerHyrexListener({ listenerName, sourceCode }: {
        listenerName: string,
        sourceCode: string
    }): Promise<void> {
        hyrexLogger.info("platform", "Listener registration automatically managed by platform", "dim");
    }

    async registerWorkflow({ workflowName, sourceCode, workflowDagJson }: {
        workflowName: string,
        sourceCode: string,
        workflowDagJson: WorkflowDagJson
    }): Promise<void> {
        const request = new requests_pb.RegisterWorkflowRequest();
        request.setWorkflowName(workflowName);
        request.setSourceCode(sourceCode);
        request.setWorkflowDagJson(JSON.stringify(workflowDagJson));

        // Convert workflow config to protobuf Struct if needed
        const defaultConfig = new google_protobuf_struct_pb.Struct();
        // Add any default config fields as needed
        request.setDefaultConfig(defaultConfig);

        try {
            await new Promise<void>((resolve, reject) => {
                this.serviceClient.registerWorkflow(request, this.metadata, (err: Error | null, response?: google_protobuf_empty_pb.Empty) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        } catch (error) {
            console.error('Error registering workflow:', error);
            throw error;
        }
    }

    async sendWorkflowRun({ serializedWorkflowRunRequest }: {
        serializedWorkflowRunRequest: SerializedWorkflowRunRequest
    }): Promise<string> {
        const request = new requests_pb.SendWorkflowRunRequest();
        request.setWorkflowRunId(serializedWorkflowRunRequest.id);
        request.setWorkflowName(serializedWorkflowRunRequest.workflow_name);

        // Convert args to protobuf Struct
        const argsStruct = new google_protobuf_struct_pb.Struct();
        if (serializedWorkflowRunRequest.args) {
            const fieldsMap = argsStruct.getFieldsMap();
            for (const [key, value] of Object.entries(serializedWorkflowRunRequest.args)) {
                const protoValue = new google_protobuf_struct_pb.Value();
                if (typeof value === 'number') {
                    protoValue.setNumberValue(value);
                } else if (typeof value === 'string') {
                    protoValue.setStringValue(value);
                } else if (typeof value === 'boolean') {
                    protoValue.setBoolValue(value);
                } else if (value === null) {
                    protoValue.setNullValue(0);
                } else if (typeof value === 'object') {
                    protoValue.setStringValue(JSON.stringify(value));
                }
                fieldsMap.set(key, protoValue);
            }
        }
        request.setArgs(argsStruct);

        request.setQueue(serializedWorkflowRunRequest.queue);
        if (serializedWorkflowRunRequest.timeout_seconds !== null) {
            request.setTimeoutSeconds(serializedWorkflowRunRequest.timeout_seconds);
        }
        if (serializedWorkflowRunRequest.idempotency_key) {
            request.setIdempotencyKey(serializedWorkflowRunRequest.idempotency_key);
        }

        try {
            await new Promise<void>((resolve, reject) => {
                this.serviceClient.sendWorkflowRun(request, this.metadata, (err: Error | null, response?: google_protobuf_empty_pb.Empty) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
            return serializedWorkflowRunRequest.id;
        } catch (error) {
            console.error('Error sending workflow run:', error);
            throw error;
        }
    }

    async advanceWorkflowRun({ workflowRunId }: { workflowRunId: UUID }): Promise<void> {
        const request = new requests_pb.AdvanceWorkflowRunRequest();
        request.setWorkflowRunId(workflowRunId);

        try {
            await new Promise<void>((resolve, reject) => {
                this.serviceClient.advanceWorkflowRun(request, this.metadata, (err: Error | null, response?: google_protobuf_empty_pb.Empty) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        } catch (error) {
            console.error('Error advancing workflow run:', error);
            throw error;
        }
    }

    // Additional helper methods for task definitions
    async getTaskDef(taskName: string): Promise<task_pb.TaskDef | null> {
        const request = new requests_pb.GetTaskDefRequest();
        request.setTaskName(taskName);

        try {
            const response = await new Promise<requests_pb.GetTaskDefResponse | undefined>((resolve, reject) => {
                this.serviceClient.getTaskDef(request, this.metadata, (err: Error | null, response?: requests_pb.GetTaskDefResponse) => {
                    if (err) reject(err);
                    else resolve(response);
                });
            });

            return response && response.getTaskDef() ? response.getTaskDef()! : null;
        } catch (error) {
            console.error('Error getting task definition:', error);
            return null;
        }
    }

    async getAllTaskDefs(): Promise<task_pb.TaskDef[]> {
        const request = new requests_pb.GetAllTaskDefsRequest();

        try {
            const response = await new Promise<requests_pb.GetAllTaskDefsResponse | undefined>((resolve, reject) => {
                this.serviceClient.getAllTaskDefs(request, this.metadata, (err: Error | null, response?: requests_pb.GetAllTaskDefsResponse) => {
                    if (err) reject(err);
                    else resolve(response);
                });
            });

            return response ? response.getTaskDefsList() : [];
        } catch (error) {
            console.error('Error getting all task definitions:', error);
            return [];
        }
    }

    // Get all task runs for a durable ID
    async getDurableTaskRuns(durableId: string): Promise<task_pb.TaskRun[]> {
        const request = new requests_pb.GetDurableTaskRunsRequest();
        request.setDurableId(durableId);

        try {
            const response = await new Promise<requests_pb.GetDurableTaskRunsResponse | undefined>((resolve, reject) => {
                this.serviceClient.getDurableTaskRuns(request, this.metadata, (err: Error | null, response?: requests_pb.GetDurableTaskRunsResponse) => {
                    if (err) reject(err);
                    else resolve(response);
                });
            });

            return response ? response.getTaskRunsList() : [];
        } catch (error) {
            console.error('Error getting durable task runs:', error);
            return [];
        }
    }

    // Get workflow run arguments
    async getWorkflowRunArgs(workflowRunId: string): Promise<any> {
        const request = new requests_pb.GetWorkflowRunArgsRequest();
        request.setWorkflowRunId(workflowRunId);

        try {
            const response = await new Promise<requests_pb.GetWorkflowRunArgsResponse | undefined>((resolve, reject) => {
                this.serviceClient.getWorkflowRunArgs(request, this.metadata, (err: Error | null, response?: requests_pb.GetWorkflowRunArgsResponse) => {
                    if (err) reject(err);
                    else resolve(response);
                });
            });

            if (response && response.getArgs()) {
                const argsStruct = response.getArgs()!;
                // Convert protobuf Struct to JavaScript object
                return this.structToObject(argsStruct);
            }

            return {};
        } catch (error) {
            console.error('Error getting workflow run args:', error);
            throw error;
        }
    }

    // Get workflow durable runs
    async getWorkflowDurableRuns(workflowRunId: string): Promise<string[]> {
        const request = new requests_pb.GetWorkflowDurableRunsRequest();
        request.setWorkflowRunId(workflowRunId);

        try {
            const response = await new Promise<requests_pb.GetWorkflowDurableRunsResponse | undefined>((resolve, reject) => {
                this.serviceClient.getWorkflowDurableRuns(request, this.metadata, (err: Error | null, response?: requests_pb.GetWorkflowDurableRunsResponse) => {
                    if (err) reject(err);
                    else resolve(response);
                });
            });

            return response ? response.getDurableRunIdsList() : [];
        } catch (error) {
            console.error('Error getting workflow durable runs:', error);
            return [];
        }
    }

    // Helper method to convert protobuf Struct to JavaScript object
    private structToObject(struct: google_protobuf_struct_pb.Struct): any {
        const result: any = {};
        const fields = struct.getFieldsMap();

        fields.forEach((value, key) => {
            if (value.hasNumberValue()) {
                result[key] = value.getNumberValue();
            } else if (value.hasStringValue()) {
                result[key] = value.getStringValue();
            } else if (value.hasBoolValue()) {
                result[key] = value.getBoolValue();
            } else if (value.hasNullValue()) {
                result[key] = null;
            } else if (value.hasStructValue()) {
                result[key] = this.structToObject(value.getStructValue()!);
            } else if (value.hasListValue()) {
                const list = value.getListValue()!;
                result[key] = list.getValuesList().map(v => this.valueToJs(v));
            }
        });

        return result;
    }

    // Helper method to convert protobuf Value to JavaScript value
    private valueToJs(value: google_protobuf_struct_pb.Value): any {
        if (value.hasNumberValue()) {
            return value.getNumberValue();
        } else if (value.hasStringValue()) {
            return value.getStringValue();
        } else if (value.hasBoolValue()) {
            return value.getBoolValue();
        } else if (value.hasNullValue()) {
            return null;
        } else if (value.hasStructValue()) {
            return this.structToObject(value.getStructValue()!);
        } else if (value.hasListValue()) {
            const list = value.getListValue()!;
            return list.getValuesList().map(v => this.valueToJs(v));
        }
        return null;
    }

    // Test connection to the gRPC server
    async testConnection(): Promise<boolean> {
        const request = new google_protobuf_empty_pb.Empty();

        try {
            const response = await new Promise<google_protobuf_empty_pb.Empty | undefined>((resolve, reject) => {
                this.serviceClient.testConnection(request, this.metadata, (err: Error | null, response?: google_protobuf_empty_pb.Empty) => {
                    if (err) reject(err);
                    else resolve(response);
                });
            });

            return response !== undefined;
        } catch (error) {
            console.error('Error testing connection:', error);
            return false;
        }
    }

    // Close the client connection
    close() {
        this.client.close();
    }
}
