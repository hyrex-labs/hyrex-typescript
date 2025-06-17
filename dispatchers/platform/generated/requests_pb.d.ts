// package: hyrex.performanceserver
// file: requests.proto

import * as jspb from "google-protobuf";
import * as google_protobuf_timestamp_pb from "google-protobuf/google/protobuf/timestamp_pb";
import * as google_protobuf_struct_pb from "google-protobuf/google/protobuf/struct_pb";
import * as task_pb from "./task_pb";

export class EnqueueRequest extends jspb.Message {
  getId(): string;
  setId(value: string): void;

  getDurableId(): string;
  setDurableId(value: string): void;

  getRootId(): string;
  setRootId(value: string): void;

  hasWorkflowRunId(): boolean;
  clearWorkflowRunId(): void;
  getWorkflowRunId(): string;
  setWorkflowRunId(value: string): void;

  clearWorkflowDependenciesList(): void;
  getWorkflowDependenciesList(): Array<string>;
  setWorkflowDependenciesList(value: Array<string>): void;
  addWorkflowDependencies(value: string, index?: number): string;

  hasParentId(): boolean;
  clearParentId(): void;
  getParentId(): string;
  setParentId(value: string): void;

  getTaskName(): string;
  setTaskName(value: string): void;

  getArgs(): Uint8Array | string;
  getArgs_asU8(): Uint8Array;
  getArgs_asB64(): string;
  setArgs(value: Uint8Array | string): void;

  getQueue(): string;
  setQueue(value: string): void;

  getMaxRetries(): number;
  setMaxRetries(value: number): void;

  hasAttemptNumber(): boolean;
  clearAttemptNumber(): void;
  getAttemptNumber(): number;
  setAttemptNumber(value: number): void;

  getPriority(): task_pb.PriorityMap[keyof task_pb.PriorityMap];
  setPriority(value: task_pb.PriorityMap[keyof task_pb.PriorityMap]): void;

  hasTimeoutSeconds(): boolean;
  clearTimeoutSeconds(): void;
  getTimeoutSeconds(): number;
  setTimeoutSeconds(value: number): void;

  hasIdempotencyKey(): boolean;
  clearIdempotencyKey(): void;
  getIdempotencyKey(): string;
  setIdempotencyKey(value: string): void;

  hasScheduledStart(): boolean;
  clearScheduledStart(): void;
  getScheduledStart(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setScheduledStart(value?: google_protobuf_timestamp_pb.Timestamp): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): EnqueueRequest.AsObject;
  static toObject(includeInstance: boolean, msg: EnqueueRequest): EnqueueRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: EnqueueRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): EnqueueRequest;
  static deserializeBinaryFromReader(message: EnqueueRequest, reader: jspb.BinaryReader): EnqueueRequest;
}

export namespace EnqueueRequest {
  export type AsObject = {
    id: string,
    durableId: string,
    rootId: string,
    workflowRunId: string,
    workflowDependenciesList: Array<string>,
    parentId: string,
    taskName: string,
    args: Uint8Array | string,
    queue: string,
    maxRetries: number,
    attemptNumber: number,
    priority: task_pb.PriorityMap[keyof task_pb.PriorityMap],
    timeoutSeconds: number,
    idempotencyKey: string,
    scheduledStart?: google_protobuf_timestamp_pb.Timestamp.AsObject,
  }
}

export class DequeueRequest extends jspb.Message {
  getExecutorId(): string;
  setExecutorId(value: string): void;

  getQueue(): string;
  setQueue(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DequeueRequest.AsObject;
  static toObject(includeInstance: boolean, msg: DequeueRequest): DequeueRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: DequeueRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): DequeueRequest;
  static deserializeBinaryFromReader(message: DequeueRequest, reader: jspb.BinaryReader): DequeueRequest;
}

export namespace DequeueRequest {
  export type AsObject = {
    executorId: string,
    queue: string,
  }
}

export class DequeueResponse extends jspb.Message {
  hasTaskRun(): boolean;
  clearTaskRun(): void;
  getTaskRun(): task_pb.TaskRun | undefined;
  setTaskRun(value?: task_pb.TaskRun): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DequeueResponse.AsObject;
  static toObject(includeInstance: boolean, msg: DequeueResponse): DequeueResponse.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: DequeueResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): DequeueResponse;
  static deserializeBinaryFromReader(message: DequeueResponse, reader: jspb.BinaryReader): DequeueResponse;
}

export namespace DequeueResponse {
  export type AsObject = {
    taskRun?: task_pb.TaskRun.AsObject,
  }
}

export class GetQueuesRequest extends jspb.Message {
  getMaxNumQueues(): number;
  setMaxNumQueues(value: number): void;

  getPattern(): string;
  setPattern(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetQueuesRequest.AsObject;
  static toObject(includeInstance: boolean, msg: GetQueuesRequest): GetQueuesRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: GetQueuesRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetQueuesRequest;
  static deserializeBinaryFromReader(message: GetQueuesRequest, reader: jspb.BinaryReader): GetQueuesRequest;
}

export namespace GetQueuesRequest {
  export type AsObject = {
    maxNumQueues: number,
    pattern: string,
  }
}

export class GetQueuesResponse extends jspb.Message {
  getMessage(): string;
  setMessage(value: string): void;

  clearQueuesList(): void;
  getQueuesList(): Array<string>;
  setQueuesList(value: Array<string>): void;
  addQueues(value: string, index?: number): string;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetQueuesResponse.AsObject;
  static toObject(includeInstance: boolean, msg: GetQueuesResponse): GetQueuesResponse.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: GetQueuesResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetQueuesResponse;
  static deserializeBinaryFromReader(message: GetQueuesResponse, reader: jspb.BinaryReader): GetQueuesResponse;
}

export namespace GetQueuesResponse {
  export type AsObject = {
    message: string,
    queuesList: Array<string>,
  }
}

export class RetryTaskRunRequest extends jspb.Message {
  getTaskRunId(): string;
  setTaskRunId(value: string): void;

  getBackoffSeconds(): number;
  setBackoffSeconds(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): RetryTaskRunRequest.AsObject;
  static toObject(includeInstance: boolean, msg: RetryTaskRunRequest): RetryTaskRunRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: RetryTaskRunRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): RetryTaskRunRequest;
  static deserializeBinaryFromReader(message: RetryTaskRunRequest, reader: jspb.BinaryReader): RetryTaskRunRequest;
}

export namespace RetryTaskRunRequest {
  export type AsObject = {
    taskRunId: string,
    backoffSeconds: number,
  }
}

export class GetTaskRunRequest extends jspb.Message {
  getTaskRunId(): string;
  setTaskRunId(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetTaskRunRequest.AsObject;
  static toObject(includeInstance: boolean, msg: GetTaskRunRequest): GetTaskRunRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: GetTaskRunRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetTaskRunRequest;
  static deserializeBinaryFromReader(message: GetTaskRunRequest, reader: jspb.BinaryReader): GetTaskRunRequest;
}

export namespace GetTaskRunRequest {
  export type AsObject = {
    taskRunId: string,
  }
}

export class GetTaskRunResponse extends jspb.Message {
  hasTaskRun(): boolean;
  clearTaskRun(): void;
  getTaskRun(): task_pb.TaskRun | undefined;
  setTaskRun(value?: task_pb.TaskRun): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetTaskRunResponse.AsObject;
  static toObject(includeInstance: boolean, msg: GetTaskRunResponse): GetTaskRunResponse.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: GetTaskRunResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetTaskRunResponse;
  static deserializeBinaryFromReader(message: GetTaskRunResponse, reader: jspb.BinaryReader): GetTaskRunResponse;
}

export namespace GetTaskRunResponse {
  export type AsObject = {
    taskRun?: task_pb.TaskRun.AsObject,
  }
}

export class GetTaskRunStatusRequest extends jspb.Message {
  getTaskRunId(): string;
  setTaskRunId(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetTaskRunStatusRequest.AsObject;
  static toObject(includeInstance: boolean, msg: GetTaskRunStatusRequest): GetTaskRunStatusRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: GetTaskRunStatusRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetTaskRunStatusRequest;
  static deserializeBinaryFromReader(message: GetTaskRunStatusRequest, reader: jspb.BinaryReader): GetTaskRunStatusRequest;
}

export namespace GetTaskRunStatusRequest {
  export type AsObject = {
    taskRunId: string,
  }
}

export class GetTaskRunStatusResponse extends jspb.Message {
  getStatus(): task_pb.TaskStatusMap[keyof task_pb.TaskStatusMap];
  setStatus(value: task_pb.TaskStatusMap[keyof task_pb.TaskStatusMap]): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetTaskRunStatusResponse.AsObject;
  static toObject(includeInstance: boolean, msg: GetTaskRunStatusResponse): GetTaskRunStatusResponse.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: GetTaskRunStatusResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetTaskRunStatusResponse;
  static deserializeBinaryFromReader(message: GetTaskRunStatusResponse, reader: jspb.BinaryReader): GetTaskRunStatusResponse;
}

export namespace GetTaskRunStatusResponse {
  export type AsObject = {
    status: task_pb.TaskStatusMap[keyof task_pb.TaskStatusMap],
  }
}

export class TaskRunHeartbeatRequest extends jspb.Message {
  clearTaskRunIdsList(): void;
  getTaskRunIdsList(): Array<string>;
  setTaskRunIdsList(value: Array<string>): void;
  addTaskRunIds(value: string, index?: number): string;

  hasTimestamp(): boolean;
  clearTimestamp(): void;
  getTimestamp(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setTimestamp(value?: google_protobuf_timestamp_pb.Timestamp): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): TaskRunHeartbeatRequest.AsObject;
  static toObject(includeInstance: boolean, msg: TaskRunHeartbeatRequest): TaskRunHeartbeatRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: TaskRunHeartbeatRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): TaskRunHeartbeatRequest;
  static deserializeBinaryFromReader(message: TaskRunHeartbeatRequest, reader: jspb.BinaryReader): TaskRunHeartbeatRequest;
}

export namespace TaskRunHeartbeatRequest {
  export type AsObject = {
    taskRunIdsList: Array<string>,
    timestamp?: google_protobuf_timestamp_pb.Timestamp.AsObject,
  }
}

export class MarkSuccessRequest extends jspb.Message {
  getTaskRunId(): string;
  setTaskRunId(value: string): void;

  hasResult(): boolean;
  clearResult(): void;
  getResult(): string;
  setResult(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): MarkSuccessRequest.AsObject;
  static toObject(includeInstance: boolean, msg: MarkSuccessRequest): MarkSuccessRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: MarkSuccessRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): MarkSuccessRequest;
  static deserializeBinaryFromReader(message: MarkSuccessRequest, reader: jspb.BinaryReader): MarkSuccessRequest;
}

export namespace MarkSuccessRequest {
  export type AsObject = {
    taskRunId: string,
    result: string,
  }
}

export class MarkFailedRequest extends jspb.Message {
  getTaskRunId(): string;
  setTaskRunId(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): MarkFailedRequest.AsObject;
  static toObject(includeInstance: boolean, msg: MarkFailedRequest): MarkFailedRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: MarkFailedRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): MarkFailedRequest;
  static deserializeBinaryFromReader(message: MarkFailedRequest, reader: jspb.BinaryReader): MarkFailedRequest;
}

export namespace MarkFailedRequest {
  export type AsObject = {
    taskRunId: string,
  }
}

export class GetDurableTaskRunsRequest extends jspb.Message {
  getDurableId(): string;
  setDurableId(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetDurableTaskRunsRequest.AsObject;
  static toObject(includeInstance: boolean, msg: GetDurableTaskRunsRequest): GetDurableTaskRunsRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: GetDurableTaskRunsRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetDurableTaskRunsRequest;
  static deserializeBinaryFromReader(message: GetDurableTaskRunsRequest, reader: jspb.BinaryReader): GetDurableTaskRunsRequest;
}

export namespace GetDurableTaskRunsRequest {
  export type AsObject = {
    durableId: string,
  }
}

export class GetDurableTaskRunsResponse extends jspb.Message {
  clearTaskRunsList(): void;
  getTaskRunsList(): Array<task_pb.TaskRun>;
  setTaskRunsList(value: Array<task_pb.TaskRun>): void;
  addTaskRuns(value?: task_pb.TaskRun, index?: number): task_pb.TaskRun;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetDurableTaskRunsResponse.AsObject;
  static toObject(includeInstance: boolean, msg: GetDurableTaskRunsResponse): GetDurableTaskRunsResponse.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: GetDurableTaskRunsResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetDurableTaskRunsResponse;
  static deserializeBinaryFromReader(message: GetDurableTaskRunsResponse, reader: jspb.BinaryReader): GetDurableTaskRunsResponse;
}

export namespace GetDurableTaskRunsResponse {
  export type AsObject = {
    taskRunsList: Array<task_pb.TaskRun.AsObject>,
  }
}

export class SetLogLinkRequest extends jspb.Message {
  getTaskRunId(): string;
  setTaskRunId(value: string): void;

  getLogLink(): string;
  setLogLink(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SetLogLinkRequest.AsObject;
  static toObject(includeInstance: boolean, msg: SetLogLinkRequest): SetLogLinkRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: SetLogLinkRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SetLogLinkRequest;
  static deserializeBinaryFromReader(message: SetLogLinkRequest, reader: jspb.BinaryReader): SetLogLinkRequest;
}

export namespace SetLogLinkRequest {
  export type AsObject = {
    taskRunId: string,
    logLink: string,
  }
}

export class RegisterTaskDefRequest extends jspb.Message {
  hasTaskDef(): boolean;
  clearTaskDef(): void;
  getTaskDef(): task_pb.TaskDef | undefined;
  setTaskDef(value?: task_pb.TaskDef): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): RegisterTaskDefRequest.AsObject;
  static toObject(includeInstance: boolean, msg: RegisterTaskDefRequest): RegisterTaskDefRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: RegisterTaskDefRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): RegisterTaskDefRequest;
  static deserializeBinaryFromReader(message: RegisterTaskDefRequest, reader: jspb.BinaryReader): RegisterTaskDefRequest;
}

export namespace RegisterTaskDefRequest {
  export type AsObject = {
    taskDef?: task_pb.TaskDef.AsObject,
  }
}

export class GetTaskDefRequest extends jspb.Message {
  getTaskName(): string;
  setTaskName(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetTaskDefRequest.AsObject;
  static toObject(includeInstance: boolean, msg: GetTaskDefRequest): GetTaskDefRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: GetTaskDefRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetTaskDefRequest;
  static deserializeBinaryFromReader(message: GetTaskDefRequest, reader: jspb.BinaryReader): GetTaskDefRequest;
}

export namespace GetTaskDefRequest {
  export type AsObject = {
    taskName: string,
  }
}

export class GetTaskDefResponse extends jspb.Message {
  hasTaskDef(): boolean;
  clearTaskDef(): void;
  getTaskDef(): task_pb.TaskDef | undefined;
  setTaskDef(value?: task_pb.TaskDef): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetTaskDefResponse.AsObject;
  static toObject(includeInstance: boolean, msg: GetTaskDefResponse): GetTaskDefResponse.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: GetTaskDefResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetTaskDefResponse;
  static deserializeBinaryFromReader(message: GetTaskDefResponse, reader: jspb.BinaryReader): GetTaskDefResponse;
}

export namespace GetTaskDefResponse {
  export type AsObject = {
    taskDef?: task_pb.TaskDef.AsObject,
  }
}

export class GetAllTaskDefsRequest extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetAllTaskDefsRequest.AsObject;
  static toObject(includeInstance: boolean, msg: GetAllTaskDefsRequest): GetAllTaskDefsRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: GetAllTaskDefsRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetAllTaskDefsRequest;
  static deserializeBinaryFromReader(message: GetAllTaskDefsRequest, reader: jspb.BinaryReader): GetAllTaskDefsRequest;
}

export namespace GetAllTaskDefsRequest {
  export type AsObject = {
  }
}

export class GetAllTaskDefsResponse extends jspb.Message {
  clearTaskDefsList(): void;
  getTaskDefsList(): Array<task_pb.TaskDef>;
  setTaskDefsList(value: Array<task_pb.TaskDef>): void;
  addTaskDefs(value?: task_pb.TaskDef, index?: number): task_pb.TaskDef;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetAllTaskDefsResponse.AsObject;
  static toObject(includeInstance: boolean, msg: GetAllTaskDefsResponse): GetAllTaskDefsResponse.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: GetAllTaskDefsResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetAllTaskDefsResponse;
  static deserializeBinaryFromReader(message: GetAllTaskDefsResponse, reader: jspb.BinaryReader): GetAllTaskDefsResponse;
}

export namespace GetAllTaskDefsResponse {
  export type AsObject = {
    taskDefsList: Array<task_pb.TaskDef.AsObject>,
  }
}

export class RegisterCronRequest extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): RegisterCronRequest.AsObject;
  static toObject(includeInstance: boolean, msg: RegisterCronRequest): RegisterCronRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: RegisterCronRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): RegisterCronRequest;
  static deserializeBinaryFromReader(message: RegisterCronRequest, reader: jspb.BinaryReader): RegisterCronRequest;
}

export namespace RegisterCronRequest {
  export type AsObject = {
  }
}

export class RegisterExecutorRequest extends jspb.Message {
  getExecutorId(): string;
  setExecutorId(value: string): void;

  getExecutorName(): string;
  setExecutorName(value: string): void;

  getQueuePattern(): string;
  setQueuePattern(value: string): void;

  clearQueuesList(): void;
  getQueuesList(): Array<string>;
  setQueuesList(value: Array<string>): void;
  addQueues(value: string, index?: number): string;

  getWorkerName(): string;
  setWorkerName(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): RegisterExecutorRequest.AsObject;
  static toObject(includeInstance: boolean, msg: RegisterExecutorRequest): RegisterExecutorRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: RegisterExecutorRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): RegisterExecutorRequest;
  static deserializeBinaryFromReader(message: RegisterExecutorRequest, reader: jspb.BinaryReader): RegisterExecutorRequest;
}

export namespace RegisterExecutorRequest {
  export type AsObject = {
    executorId: string,
    executorName: string,
    queuePattern: string,
    queuesList: Array<string>,
    workerName: string,
  }
}

export class UpdateExecutorQueuesRequest extends jspb.Message {
  getExecutorId(): string;
  setExecutorId(value: string): void;

  clearQueuesList(): void;
  getQueuesList(): Array<string>;
  setQueuesList(value: Array<string>): void;
  addQueues(value: string, index?: number): string;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): UpdateExecutorQueuesRequest.AsObject;
  static toObject(includeInstance: boolean, msg: UpdateExecutorQueuesRequest): UpdateExecutorQueuesRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: UpdateExecutorQueuesRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): UpdateExecutorQueuesRequest;
  static deserializeBinaryFromReader(message: UpdateExecutorQueuesRequest, reader: jspb.BinaryReader): UpdateExecutorQueuesRequest;
}

export namespace UpdateExecutorQueuesRequest {
  export type AsObject = {
    executorId: string,
    queuesList: Array<string>,
  }
}

export class UpdateExecutorStatsRequest extends jspb.Message {
  getExecutorId(): string;
  setExecutorId(value: string): void;

  hasExecutorStats(): boolean;
  clearExecutorStats(): void;
  getExecutorStats(): google_protobuf_struct_pb.Struct | undefined;
  setExecutorStats(value?: google_protobuf_struct_pb.Struct): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): UpdateExecutorStatsRequest.AsObject;
  static toObject(includeInstance: boolean, msg: UpdateExecutorStatsRequest): UpdateExecutorStatsRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: UpdateExecutorStatsRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): UpdateExecutorStatsRequest;
  static deserializeBinaryFromReader(message: UpdateExecutorStatsRequest, reader: jspb.BinaryReader): UpdateExecutorStatsRequest;
}

export namespace UpdateExecutorStatsRequest {
  export type AsObject = {
    executorId: string,
    executorStats?: google_protobuf_struct_pb.Struct.AsObject,
  }
}

export class ExecutorHeartbeatRequest extends jspb.Message {
  clearExecutorIdsList(): void;
  getExecutorIdsList(): Array<string>;
  setExecutorIdsList(value: Array<string>): void;
  addExecutorIds(value: string, index?: number): string;

  hasTimestamp(): boolean;
  clearTimestamp(): void;
  getTimestamp(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setTimestamp(value?: google_protobuf_timestamp_pb.Timestamp): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ExecutorHeartbeatRequest.AsObject;
  static toObject(includeInstance: boolean, msg: ExecutorHeartbeatRequest): ExecutorHeartbeatRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: ExecutorHeartbeatRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ExecutorHeartbeatRequest;
  static deserializeBinaryFromReader(message: ExecutorHeartbeatRequest, reader: jspb.BinaryReader): ExecutorHeartbeatRequest;
}

export namespace ExecutorHeartbeatRequest {
  export type AsObject = {
    executorIdsList: Array<string>,
    timestamp?: google_protobuf_timestamp_pb.Timestamp.AsObject,
  }
}

export class DisconnectExecutorRequest extends jspb.Message {
  getExecutorId(): string;
  setExecutorId(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DisconnectExecutorRequest.AsObject;
  static toObject(includeInstance: boolean, msg: DisconnectExecutorRequest): DisconnectExecutorRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: DisconnectExecutorRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): DisconnectExecutorRequest;
  static deserializeBinaryFromReader(message: DisconnectExecutorRequest, reader: jspb.BinaryReader): DisconnectExecutorRequest;
}

export namespace DisconnectExecutorRequest {
  export type AsObject = {
    executorId: string,
  }
}

export class RegisterAppRequest extends jspb.Message {
  hasAppInfo(): boolean;
  clearAppInfo(): void;
  getAppInfo(): google_protobuf_struct_pb.Struct | undefined;
  setAppInfo(value?: google_protobuf_struct_pb.Struct): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): RegisterAppRequest.AsObject;
  static toObject(includeInstance: boolean, msg: RegisterAppRequest): RegisterAppRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: RegisterAppRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): RegisterAppRequest;
  static deserializeBinaryFromReader(message: RegisterAppRequest, reader: jspb.BinaryReader): RegisterAppRequest;
}

export namespace RegisterAppRequest {
  export type AsObject = {
    appInfo?: google_protobuf_struct_pb.Struct.AsObject,
  }
}

export class AcquireSchedulerLockRequest extends jspb.Message {
  getWorkerName(): string;
  setWorkerName(value: string): void;

  getDuration(): string;
  setDuration(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): AcquireSchedulerLockRequest.AsObject;
  static toObject(includeInstance: boolean, msg: AcquireSchedulerLockRequest): AcquireSchedulerLockRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: AcquireSchedulerLockRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): AcquireSchedulerLockRequest;
  static deserializeBinaryFromReader(message: AcquireSchedulerLockRequest, reader: jspb.BinaryReader): AcquireSchedulerLockRequest;
}

export namespace AcquireSchedulerLockRequest {
  export type AsObject = {
    workerName: string,
    duration: string,
  }
}

export class AcquireSchedulerLockResponse extends jspb.Message {
  hasLockId(): boolean;
  clearLockId(): void;
  getLockId(): number;
  setLockId(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): AcquireSchedulerLockResponse.AsObject;
  static toObject(includeInstance: boolean, msg: AcquireSchedulerLockResponse): AcquireSchedulerLockResponse.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: AcquireSchedulerLockResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): AcquireSchedulerLockResponse;
  static deserializeBinaryFromReader(message: AcquireSchedulerLockResponse, reader: jspb.BinaryReader): AcquireSchedulerLockResponse;
}

export namespace AcquireSchedulerLockResponse {
  export type AsObject = {
    lockId: number,
  }
}

export class WriteLogsRequest extends jspb.Message {
  getTaskRunId(): string;
  setTaskRunId(value: string): void;

  getLogs(): string;
  setLogs(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): WriteLogsRequest.AsObject;
  static toObject(includeInstance: boolean, msg: WriteLogsRequest): WriteLogsRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: WriteLogsRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): WriteLogsRequest;
  static deserializeBinaryFromReader(message: WriteLogsRequest, reader: jspb.BinaryReader): WriteLogsRequest;
}

export namespace WriteLogsRequest {
  export type AsObject = {
    taskRunId: string,
    logs: string,
  }
}

export class RegisterWorkflowRequest extends jspb.Message {
  getWorkflowName(): string;
  setWorkflowName(value: string): void;

  getSourceCode(): string;
  setSourceCode(value: string): void;

  getWorkflowDagJson(): string;
  setWorkflowDagJson(value: string): void;

  hasWorkflowArgSchema(): boolean;
  clearWorkflowArgSchema(): void;
  getWorkflowArgSchema(): google_protobuf_struct_pb.Struct | undefined;
  setWorkflowArgSchema(value?: google_protobuf_struct_pb.Struct): void;

  hasDefaultConfig(): boolean;
  clearDefaultConfig(): void;
  getDefaultConfig(): google_protobuf_struct_pb.Struct | undefined;
  setDefaultConfig(value?: google_protobuf_struct_pb.Struct): void;

  hasCron(): boolean;
  clearCron(): void;
  getCron(): string;
  setCron(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): RegisterWorkflowRequest.AsObject;
  static toObject(includeInstance: boolean, msg: RegisterWorkflowRequest): RegisterWorkflowRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: RegisterWorkflowRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): RegisterWorkflowRequest;
  static deserializeBinaryFromReader(message: RegisterWorkflowRequest, reader: jspb.BinaryReader): RegisterWorkflowRequest;
}

export namespace RegisterWorkflowRequest {
  export type AsObject = {
    workflowName: string,
    sourceCode: string,
    workflowDagJson: string,
    workflowArgSchema?: google_protobuf_struct_pb.Struct.AsObject,
    defaultConfig?: google_protobuf_struct_pb.Struct.AsObject,
    cron: string,
  }
}

export class SendWorkflowRunRequest extends jspb.Message {
  getWorkflowRunId(): string;
  setWorkflowRunId(value: string): void;

  getWorkflowName(): string;
  setWorkflowName(value: string): void;

  hasArgs(): boolean;
  clearArgs(): void;
  getArgs(): google_protobuf_struct_pb.Struct | undefined;
  setArgs(value?: google_protobuf_struct_pb.Struct): void;

  getQueue(): string;
  setQueue(value: string): void;

  hasTimeoutSeconds(): boolean;
  clearTimeoutSeconds(): void;
  getTimeoutSeconds(): number;
  setTimeoutSeconds(value: number): void;

  hasIdempotencyKey(): boolean;
  clearIdempotencyKey(): void;
  getIdempotencyKey(): string;
  setIdempotencyKey(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SendWorkflowRunRequest.AsObject;
  static toObject(includeInstance: boolean, msg: SendWorkflowRunRequest): SendWorkflowRunRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: SendWorkflowRunRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SendWorkflowRunRequest;
  static deserializeBinaryFromReader(message: SendWorkflowRunRequest, reader: jspb.BinaryReader): SendWorkflowRunRequest;
}

export namespace SendWorkflowRunRequest {
  export type AsObject = {
    workflowRunId: string,
    workflowName: string,
    args?: google_protobuf_struct_pb.Struct.AsObject,
    queue: string,
    timeoutSeconds: number,
    idempotencyKey: string,
  }
}

export class GetWorkflowRunArgsRequest extends jspb.Message {
  getWorkflowRunId(): string;
  setWorkflowRunId(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetWorkflowRunArgsRequest.AsObject;
  static toObject(includeInstance: boolean, msg: GetWorkflowRunArgsRequest): GetWorkflowRunArgsRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: GetWorkflowRunArgsRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetWorkflowRunArgsRequest;
  static deserializeBinaryFromReader(message: GetWorkflowRunArgsRequest, reader: jspb.BinaryReader): GetWorkflowRunArgsRequest;
}

export namespace GetWorkflowRunArgsRequest {
  export type AsObject = {
    workflowRunId: string,
  }
}

export class GetWorkflowRunArgsResponse extends jspb.Message {
  hasArgs(): boolean;
  clearArgs(): void;
  getArgs(): google_protobuf_struct_pb.Struct | undefined;
  setArgs(value?: google_protobuf_struct_pb.Struct): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetWorkflowRunArgsResponse.AsObject;
  static toObject(includeInstance: boolean, msg: GetWorkflowRunArgsResponse): GetWorkflowRunArgsResponse.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: GetWorkflowRunArgsResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetWorkflowRunArgsResponse;
  static deserializeBinaryFromReader(message: GetWorkflowRunArgsResponse, reader: jspb.BinaryReader): GetWorkflowRunArgsResponse;
}

export namespace GetWorkflowRunArgsResponse {
  export type AsObject = {
    args?: google_protobuf_struct_pb.Struct.AsObject,
  }
}

export class AdvanceWorkflowRunRequest extends jspb.Message {
  getWorkflowRunId(): string;
  setWorkflowRunId(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): AdvanceWorkflowRunRequest.AsObject;
  static toObject(includeInstance: boolean, msg: AdvanceWorkflowRunRequest): AdvanceWorkflowRunRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: AdvanceWorkflowRunRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): AdvanceWorkflowRunRequest;
  static deserializeBinaryFromReader(message: AdvanceWorkflowRunRequest, reader: jspb.BinaryReader): AdvanceWorkflowRunRequest;
}

export namespace AdvanceWorkflowRunRequest {
  export type AsObject = {
    workflowRunId: string,
  }
}

export class GetWorkflowDurableRunsRequest extends jspb.Message {
  getWorkflowRunId(): string;
  setWorkflowRunId(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetWorkflowDurableRunsRequest.AsObject;
  static toObject(includeInstance: boolean, msg: GetWorkflowDurableRunsRequest): GetWorkflowDurableRunsRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: GetWorkflowDurableRunsRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetWorkflowDurableRunsRequest;
  static deserializeBinaryFromReader(message: GetWorkflowDurableRunsRequest, reader: jspb.BinaryReader): GetWorkflowDurableRunsRequest;
}

export namespace GetWorkflowDurableRunsRequest {
  export type AsObject = {
    workflowRunId: string,
  }
}

export class GetWorkflowDurableRunsResponse extends jspb.Message {
  clearDurableIdsList(): void;
  getDurableIdsList(): Array<string>;
  setDurableIdsList(value: Array<string>): void;
  addDurableIds(value: string, index?: number): string;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetWorkflowDurableRunsResponse.AsObject;
  static toObject(includeInstance: boolean, msg: GetWorkflowDurableRunsResponse): GetWorkflowDurableRunsResponse.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: GetWorkflowDurableRunsResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetWorkflowDurableRunsResponse;
  static deserializeBinaryFromReader(message: GetWorkflowDurableRunsResponse, reader: jspb.BinaryReader): GetWorkflowDurableRunsResponse;
}

export namespace GetWorkflowDurableRunsResponse {
  export type AsObject = {
    durableIdsList: Array<string>,
  }
}

export class TryToCancelDurableRunRequest extends jspb.Message {
  getDurableId(): string;
  setDurableId(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): TryToCancelDurableRunRequest.AsObject;
  static toObject(includeInstance: boolean, msg: TryToCancelDurableRunRequest): TryToCancelDurableRunRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: TryToCancelDurableRunRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): TryToCancelDurableRunRequest;
  static deserializeBinaryFromReader(message: TryToCancelDurableRunRequest, reader: jspb.BinaryReader): TryToCancelDurableRunRequest;
}

export namespace TryToCancelDurableRunRequest {
  export type AsObject = {
    durableId: string,
  }
}

export class GetTaskRunsUpForCancelResponse extends jspb.Message {
  clearTaskRunIdsList(): void;
  getTaskRunIdsList(): Array<string>;
  setTaskRunIdsList(value: Array<string>): void;
  addTaskRunIds(value: string, index?: number): string;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GetTaskRunsUpForCancelResponse.AsObject;
  static toObject(includeInstance: boolean, msg: GetTaskRunsUpForCancelResponse): GetTaskRunsUpForCancelResponse.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: GetTaskRunsUpForCancelResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): GetTaskRunsUpForCancelResponse;
  static deserializeBinaryFromReader(message: GetTaskRunsUpForCancelResponse, reader: jspb.BinaryReader): GetTaskRunsUpForCancelResponse;
}

export namespace GetTaskRunsUpForCancelResponse {
  export type AsObject = {
    taskRunIdsList: Array<string>,
  }
}

export class MarkCanceledRequest extends jspb.Message {
  getTaskRunId(): string;
  setTaskRunId(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): MarkCanceledRequest.AsObject;
  static toObject(includeInstance: boolean, msg: MarkCanceledRequest): MarkCanceledRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: MarkCanceledRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): MarkCanceledRequest;
  static deserializeBinaryFromReader(message: MarkCanceledRequest, reader: jspb.BinaryReader): MarkCanceledRequest;
}

export namespace MarkCanceledRequest {
  export type AsObject = {
    taskRunId: string,
  }
}

export class KVStoreSetRequest extends jspb.Message {
  getKey(): string;
  setKey(value: string): void;

  getValue(): string;
  setValue(value: string): void;

  hasOverwrite(): boolean;
  clearOverwrite(): void;
  getOverwrite(): boolean;
  setOverwrite(value: boolean): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): KVStoreSetRequest.AsObject;
  static toObject(includeInstance: boolean, msg: KVStoreSetRequest): KVStoreSetRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: KVStoreSetRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): KVStoreSetRequest;
  static deserializeBinaryFromReader(message: KVStoreSetRequest, reader: jspb.BinaryReader): KVStoreSetRequest;
}

export namespace KVStoreSetRequest {
  export type AsObject = {
    key: string,
    value: string,
    overwrite: boolean,
  }
}

export class KVStoreGetRequest extends jspb.Message {
  getKey(): string;
  setKey(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): KVStoreGetRequest.AsObject;
  static toObject(includeInstance: boolean, msg: KVStoreGetRequest): KVStoreGetRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: KVStoreGetRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): KVStoreGetRequest;
  static deserializeBinaryFromReader(message: KVStoreGetRequest, reader: jspb.BinaryReader): KVStoreGetRequest;
}

export namespace KVStoreGetRequest {
  export type AsObject = {
    key: string,
  }
}

export class KVStoreGetResponse extends jspb.Message {
  getValue(): string;
  setValue(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): KVStoreGetResponse.AsObject;
  static toObject(includeInstance: boolean, msg: KVStoreGetResponse): KVStoreGetResponse.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: KVStoreGetResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): KVStoreGetResponse;
  static deserializeBinaryFromReader(message: KVStoreGetResponse, reader: jspb.BinaryReader): KVStoreGetResponse;
}

export namespace KVStoreGetResponse {
  export type AsObject = {
    value: string,
  }
}

