import {
    HyrexDispatcher,
    SerializedTask,
    SerializedTaskRequest,
    DispatcherListenerCallbacks
} from "../HyrexDispatcher";
import * as grpc from '@grpc/grpc-js';
import { UUID, JsonType, HyrexTaskConfig } from "../../utils";
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
        // Not directly implemented in the proto, but we can use GetTaskRunStatus to check if task is still running
        const request = new requests_pb.GetTaskRunStatusRequest();
        request.setTaskRunId(heartbeatMsg.body.taskId);

        try {
            const response = await new Promise<requests_pb.GetTaskRunStatusResponse | undefined>((resolve, reject) => {
                this.serviceClient.getTaskRunStatus(request, this.metadata, (err: Error | null, response?: requests_pb.GetTaskRunStatusResponse) => {
                    if (err) reject(err);
                    else resolve(response);
                });
            });

            // The heartbeat was successful if we got a response
            // In a real implementation, you might want to check the status and handle accordingly
        } catch (error) {
            console.error('Error updating task heartbeat:', error);
            throw error;
        }
    }

    async attemptRetry(taskId: UUID): Promise<void> {
        // Platform handles retries automatically, so this is a no-op
        // Log for debugging purposes
        console.log(`Retry requested for task ${taskId} - platform will handle automatically`);
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
        // Since there's no specific disconnect endpoint, we'll update the executor with empty queues
        // to indicate it's no longer active
        const request = new requests_pb.UpdateExecutorQueuesRequest();
        request.setExecutorId(executorId);
        request.setQueuesList([]); // Empty queues list indicates disconnection

        try {
            await new Promise<void>((resolve, reject) => {
                this.serviceClient.updateExecutorQueues(request, this.metadata, (err: Error | null, response?: google_protobuf_empty_pb.Empty) => {
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
        // Not directly implemented in the proto
        return 'ACCEPTED';
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
        // Not directly implemented in the proto
        throw new Error("Method not implemented.");
    }

    async updateExecutorHeartbeats({ executorIds }: { executorIds: string[] }): Promise<void> {
        // Not directly implemented in the proto
        throw new Error("Method not implemented.");
    }

    async registerTask({ taskName, taskConfig, sourceCode }: {
        taskName: string,
        taskConfig?: HyrexTaskConfig,
        sourceCode?: string
    }): Promise<void> {
        const request = new requests_pb.RegisterTaskDefRequest();
        const taskDef = new task_pb.TaskDef();
        taskDef.setTaskName(taskName);

        if (sourceCode) {
            taskDef.setSourceCode(sourceCode);
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
        // Not directly implemented in the proto
        throw new Error("Method not implemented.");
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
        // Not directly implemented in the proto
        throw new Error("Method not implemented.");
    }

    async releaseSchedulerLock({ workerName }: { workerName: string }): Promise<void> {
        hyrexLogger.info("cron-scheduling", "Scheduler lock automatically managed by platform", "dim");
    }

    async pullCronJobExpressions(): Promise<CronJob[]> {
        // Not directly implemented in the proto
        return [];
    }

    async updateCronJobConfirmationTimestamp(jobId: number): Promise<void> {
        // Not directly implemented in the proto
        throw new Error("Method not implemented.");
    }

    async scheduleCronJobRuns(cronJobRuns: CronJobRun[]): Promise<void> {
        // Not directly implemented in the proto
        throw new Error("Method not implemented.");
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
        // Not directly implemented in the proto
        throw new Error("Method not implemented.");
    }

    async registerWorkflow({ workflowName, sourceCode, workflowDagJson }: {
        workflowName: string,
        sourceCode: string,
        workflowDagJson: WorkflowDagJson
    }): Promise<void> {
        // Not directly implemented in the proto
        throw new Error("Method not implemented.");
    }

    async sendWorkflowRun({ serializedWorkflowRunRequest }: {
        serializedWorkflowRunRequest: SerializedWorkflowRunRequest
    }): Promise<string> {
        // Not directly implemented in the proto
        throw new Error("Method not implemented.");
    }

    async advanceWorkflowRun({ workflowRunId }: { workflowRunId: UUID }): Promise<void> {
        // Not directly implemented in the proto
        throw new Error("Method not implemented.");
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
