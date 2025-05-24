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

  getStatus(): task_pb.TaskStatusMap[keyof task_pb.TaskStatusMap];
  setStatus(value: task_pb.TaskStatusMap[keyof task_pb.TaskStatusMap]): void;

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
    status: task_pb.TaskStatusMap[keyof task_pb.TaskStatusMap],
    taskName: string,
    args: Uint8Array | string,
    queue: string,
    maxRetries: number,
    priority: task_pb.PriorityMap[keyof task_pb.PriorityMap],
    timeoutSeconds: number,
    idempotencyKey: string,
    scheduledStart?: google_protobuf_timestamp_pb.Timestamp.AsObject,
  }
}

export class EnqueueResponse extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): EnqueueResponse.AsObject;
  static toObject(includeInstance: boolean, msg: EnqueueResponse): EnqueueResponse.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: EnqueueResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): EnqueueResponse;
  static deserializeBinaryFromReader(message: EnqueueResponse, reader: jspb.BinaryReader): EnqueueResponse;
}

export namespace EnqueueResponse {
  export type AsObject = {
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

export class GetTaskRunRequest extends jspb.Message {
  getTaskId(): string;
  setTaskId(value: string): void;

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
    taskId: string,
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
  getTaskId(): string;
  setTaskId(value: string): void;

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
    taskId: string,
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

export class MarkSuccessRequest extends jspb.Message {
  getTaskId(): string;
  setTaskId(value: string): void;

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
    taskId: string,
    result: string,
  }
}

export class MarkSuccessResponse extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): MarkSuccessResponse.AsObject;
  static toObject(includeInstance: boolean, msg: MarkSuccessResponse): MarkSuccessResponse.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: MarkSuccessResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): MarkSuccessResponse;
  static deserializeBinaryFromReader(message: MarkSuccessResponse, reader: jspb.BinaryReader): MarkSuccessResponse;
}

export namespace MarkSuccessResponse {
  export type AsObject = {
  }
}

export class MarkFailedRequest extends jspb.Message {
  getTaskId(): string;
  setTaskId(value: string): void;

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
    taskId: string,
  }
}

export class MarkFailedResponse extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): MarkFailedResponse.AsObject;
  static toObject(includeInstance: boolean, msg: MarkFailedResponse): MarkFailedResponse.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: MarkFailedResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): MarkFailedResponse;
  static deserializeBinaryFromReader(message: MarkFailedResponse, reader: jspb.BinaryReader): MarkFailedResponse;
}

export namespace MarkFailedResponse {
  export type AsObject = {
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
  getTaskId(): string;
  setTaskId(value: string): void;

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
    taskId: string,
    logLink: string,
  }
}

export class SetLogLinkResponse extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SetLogLinkResponse.AsObject;
  static toObject(includeInstance: boolean, msg: SetLogLinkResponse): SetLogLinkResponse.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: SetLogLinkResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SetLogLinkResponse;
  static deserializeBinaryFromReader(message: SetLogLinkResponse, reader: jspb.BinaryReader): SetLogLinkResponse;
}

export namespace SetLogLinkResponse {
  export type AsObject = {
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

export class RegisterTaskDefResponse extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): RegisterTaskDefResponse.AsObject;
  static toObject(includeInstance: boolean, msg: RegisterTaskDefResponse): RegisterTaskDefResponse.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: RegisterTaskDefResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): RegisterTaskDefResponse;
  static deserializeBinaryFromReader(message: RegisterTaskDefResponse, reader: jspb.BinaryReader): RegisterTaskDefResponse;
}

export namespace RegisterTaskDefResponse {
  export type AsObject = {
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

export class RegisterCronResponse extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): RegisterCronResponse.AsObject;
  static toObject(includeInstance: boolean, msg: RegisterCronResponse): RegisterCronResponse.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: RegisterCronResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): RegisterCronResponse;
  static deserializeBinaryFromReader(message: RegisterCronResponse, reader: jspb.BinaryReader): RegisterCronResponse;
}

export namespace RegisterCronResponse {
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

export class RegisterExecutorResponse extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): RegisterExecutorResponse.AsObject;
  static toObject(includeInstance: boolean, msg: RegisterExecutorResponse): RegisterExecutorResponse.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: RegisterExecutorResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): RegisterExecutorResponse;
  static deserializeBinaryFromReader(message: RegisterExecutorResponse, reader: jspb.BinaryReader): RegisterExecutorResponse;
}

export namespace RegisterExecutorResponse {
  export type AsObject = {
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

export class UpdateExecutorQueuesResponse extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): UpdateExecutorQueuesResponse.AsObject;
  static toObject(includeInstance: boolean, msg: UpdateExecutorQueuesResponse): UpdateExecutorQueuesResponse.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: UpdateExecutorQueuesResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): UpdateExecutorQueuesResponse;
  static deserializeBinaryFromReader(message: UpdateExecutorQueuesResponse, reader: jspb.BinaryReader): UpdateExecutorQueuesResponse;
}

export namespace UpdateExecutorQueuesResponse {
  export type AsObject = {
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

export class RegisterAppResponse extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): RegisterAppResponse.AsObject;
  static toObject(includeInstance: boolean, msg: RegisterAppResponse): RegisterAppResponse.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: RegisterAppResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): RegisterAppResponse;
  static deserializeBinaryFromReader(message: RegisterAppResponse, reader: jspb.BinaryReader): RegisterAppResponse;
}

export namespace RegisterAppResponse {
  export type AsObject = {
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

