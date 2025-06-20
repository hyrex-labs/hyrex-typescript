// package: hyrex.performanceserver
// file: task.proto

import * as jspb from "google-protobuf";
import * as google_protobuf_timestamp_pb from "google-protobuf/google/protobuf/timestamp_pb";
import * as google_protobuf_struct_pb from "google-protobuf/google/protobuf/struct_pb";

export class TaskRun extends jspb.Message {
  getId(): string;
  setId(value: string): void;

  getDurableId(): string;
  setDurableId(value: string): void;

  getRootId(): string;
  setRootId(value: string): void;

  getParentId(): string;
  setParentId(value: string): void;

  getTaskName(): string;
  setTaskName(value: string): void;

  getStatus(): TaskStatusMap[keyof TaskStatusMap];
  setStatus(value: TaskStatusMap[keyof TaskStatusMap]): void;

  getArgs(): Uint8Array | string;
  getArgs_asU8(): Uint8Array;
  getArgs_asB64(): string;
  setArgs(value: Uint8Array | string): void;

  getQueue(): string;
  setQueue(value: string): void;

  getPriority(): PriorityMap[keyof PriorityMap];
  setPriority(value: PriorityMap[keyof PriorityMap]): void;

  hasTimeoutSeconds(): boolean;
  clearTimeoutSeconds(): void;
  getTimeoutSeconds(): number;
  setTimeoutSeconds(value: number): void;

  hasScheduledStart(): boolean;
  clearScheduledStart(): void;
  getScheduledStart(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setScheduledStart(value?: google_protobuf_timestamp_pb.Timestamp): void;

  hasQueued(): boolean;
  clearQueued(): void;
  getQueued(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setQueued(value?: google_protobuf_timestamp_pb.Timestamp): void;

  hasStarted(): boolean;
  clearStarted(): void;
  getStarted(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setStarted(value?: google_protobuf_timestamp_pb.Timestamp): void;

  hasFinished(): boolean;
  clearFinished(): void;
  getFinished(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setFinished(value?: google_protobuf_timestamp_pb.Timestamp): void;

  hasWorkflowRunId(): boolean;
  clearWorkflowRunId(): void;
  getWorkflowRunId(): string;
  setWorkflowRunId(value: string): void;

  clearWorkflowDependenciesList(): void;
  getWorkflowDependenciesList(): Array<string>;
  setWorkflowDependenciesList(value: Array<string>): void;
  addWorkflowDependencies(value: string, index?: number): string;

  getAttemptNumber(): number;
  setAttemptNumber(value: number): void;

  getMaxRetries(): number;
  setMaxRetries(value: number): void;

  getResult(): string;
  setResult(value: string): void;

  getLogLink(): string;
  setLogLink(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): TaskRun.AsObject;
  static toObject(includeInstance: boolean, msg: TaskRun): TaskRun.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: TaskRun, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): TaskRun;
  static deserializeBinaryFromReader(message: TaskRun, reader: jspb.BinaryReader): TaskRun;
}

export namespace TaskRun {
  export type AsObject = {
    id: string,
    durableId: string,
    rootId: string,
    parentId: string,
    taskName: string,
    status: TaskStatusMap[keyof TaskStatusMap],
    args: Uint8Array | string,
    queue: string,
    priority: PriorityMap[keyof PriorityMap],
    timeoutSeconds: number,
    scheduledStart?: google_protobuf_timestamp_pb.Timestamp.AsObject,
    queued?: google_protobuf_timestamp_pb.Timestamp.AsObject,
    started?: google_protobuf_timestamp_pb.Timestamp.AsObject,
    finished?: google_protobuf_timestamp_pb.Timestamp.AsObject,
    workflowRunId: string,
    workflowDependenciesList: Array<string>,
    attemptNumber: number,
    maxRetries: number,
    result: string,
    logLink: string,
  }
}

export class TaskDef extends jspb.Message {
  getTaskName(): string;
  setTaskName(value: string): void;

  hasArgSchema(): boolean;
  clearArgSchema(): void;
  getArgSchema(): google_protobuf_struct_pb.Struct | undefined;
  setArgSchema(value?: google_protobuf_struct_pb.Struct): void;

  hasDefaultConfig(): boolean;
  clearDefaultConfig(): void;
  getDefaultConfig(): google_protobuf_struct_pb.Struct | undefined;
  setDefaultConfig(value?: google_protobuf_struct_pb.Struct): void;

  hasCron(): boolean;
  clearCron(): void;
  getCron(): string;
  setCron(value: string): void;

  hasSourceCode(): boolean;
  clearSourceCode(): void;
  getSourceCode(): string;
  setSourceCode(value: string): void;

  hasLastUpdated(): boolean;
  clearLastUpdated(): void;
  getLastUpdated(): google_protobuf_timestamp_pb.Timestamp | undefined;
  setLastUpdated(value?: google_protobuf_timestamp_pb.Timestamp): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): TaskDef.AsObject;
  static toObject(includeInstance: boolean, msg: TaskDef): TaskDef.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: TaskDef, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): TaskDef;
  static deserializeBinaryFromReader(message: TaskDef, reader: jspb.BinaryReader): TaskDef;
}

export namespace TaskDef {
  export type AsObject = {
    taskName: string,
    argSchema?: google_protobuf_struct_pb.Struct.AsObject,
    defaultConfig?: google_protobuf_struct_pb.Struct.AsObject,
    cron: string,
    sourceCode: string,
    lastUpdated?: google_protobuf_timestamp_pb.Timestamp.AsObject,
  }
}

export interface PriorityMap {
  P_UNSPECIFIED: 0;
  P1: 1;
  P2: 2;
  P3: 3;
  P4: 4;
  P5: 5;
  P6: 6;
  P7: 7;
  P8: 8;
  P9: 9;
  P10: 10;
}

export const Priority: PriorityMap;

export interface TaskStatusMap {
  UNSPECIFIED: 0;
  SUCCESS: 1;
  FAILED: 2;
  RUNNING: 3;
  QUEUED: 4;
  UP_FOR_CANCEL: 5;
  CANCELED: 6;
  LOST: 7;
  STOPPED: 8;
  SKIPPED: 9;
  AWAIT_DEPS: 10;
  AWAIT_START_TIME: 11;
}

export const TaskStatus: TaskStatusMap;

