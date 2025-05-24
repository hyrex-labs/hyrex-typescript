// GENERATED CODE -- DO NOT EDIT!

// package: hyrex.performanceserver
// file: gateway.proto

import * as gateway_pb from "./gateway_pb";
import * as google_protobuf_empty_pb from "google-protobuf/google/protobuf/empty_pb";
import * as requests_pb from "./requests_pb";
import * as grpc from "@grpc/grpc-js";

interface IGatewayServiceService extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
  testConnection: grpc.MethodDefinition<google_protobuf_empty_pb.Empty, google_protobuf_empty_pb.Empty>;
  enqueue: grpc.MethodDefinition<requests_pb.EnqueueRequest, requests_pb.EnqueueResponse>;
  dequeue: grpc.MethodDefinition<requests_pb.DequeueRequest, requests_pb.DequeueResponse>;
  getQueues: grpc.MethodDefinition<requests_pb.GetQueuesRequest, requests_pb.GetQueuesResponse>;
  getTaskRunStatus: grpc.MethodDefinition<requests_pb.GetTaskRunStatusRequest, requests_pb.GetTaskRunStatusResponse>;
  markSuccess: grpc.MethodDefinition<requests_pb.MarkSuccessRequest, requests_pb.MarkSuccessResponse>;
  markFailed: grpc.MethodDefinition<requests_pb.MarkFailedRequest, requests_pb.MarkFailedResponse>;
  getTaskRun: grpc.MethodDefinition<requests_pb.GetTaskRunRequest, requests_pb.GetTaskRunResponse>;
  getDurableTaskRuns: grpc.MethodDefinition<requests_pb.GetDurableTaskRunsRequest, requests_pb.GetDurableTaskRunsResponse>;
  registerTaskDef: grpc.MethodDefinition<requests_pb.RegisterTaskDefRequest, requests_pb.RegisterTaskDefResponse>;
  getTaskDef: grpc.MethodDefinition<requests_pb.GetTaskDefRequest, requests_pb.GetTaskDefResponse>;
  getAllTaskDefs: grpc.MethodDefinition<requests_pb.GetAllTaskDefsRequest, requests_pb.GetAllTaskDefsResponse>;
  registerExecutor: grpc.MethodDefinition<requests_pb.RegisterExecutorRequest, requests_pb.RegisterExecutorResponse>;
  updateExecutorQueues: grpc.MethodDefinition<requests_pb.UpdateExecutorQueuesRequest, requests_pb.UpdateExecutorQueuesResponse>;
  registerApp: grpc.MethodDefinition<requests_pb.RegisterAppRequest, requests_pb.RegisterAppResponse>;
  setLogLink: grpc.MethodDefinition<requests_pb.SetLogLinkRequest, requests_pb.SetLogLinkResponse>;
  acquireSchedulerLock: grpc.MethodDefinition<requests_pb.AcquireSchedulerLockRequest, requests_pb.AcquireSchedulerLockResponse>;
}

export const GatewayServiceService: IGatewayServiceService;

export interface IGatewayServiceServer extends grpc.UntypedServiceImplementation {
  testConnection: grpc.handleUnaryCall<google_protobuf_empty_pb.Empty, google_protobuf_empty_pb.Empty>;
  enqueue: grpc.handleUnaryCall<requests_pb.EnqueueRequest, requests_pb.EnqueueResponse>;
  dequeue: grpc.handleUnaryCall<requests_pb.DequeueRequest, requests_pb.DequeueResponse>;
  getQueues: grpc.handleUnaryCall<requests_pb.GetQueuesRequest, requests_pb.GetQueuesResponse>;
  getTaskRunStatus: grpc.handleUnaryCall<requests_pb.GetTaskRunStatusRequest, requests_pb.GetTaskRunStatusResponse>;
  markSuccess: grpc.handleUnaryCall<requests_pb.MarkSuccessRequest, requests_pb.MarkSuccessResponse>;
  markFailed: grpc.handleUnaryCall<requests_pb.MarkFailedRequest, requests_pb.MarkFailedResponse>;
  getTaskRun: grpc.handleUnaryCall<requests_pb.GetTaskRunRequest, requests_pb.GetTaskRunResponse>;
  getDurableTaskRuns: grpc.handleUnaryCall<requests_pb.GetDurableTaskRunsRequest, requests_pb.GetDurableTaskRunsResponse>;
  registerTaskDef: grpc.handleUnaryCall<requests_pb.RegisterTaskDefRequest, requests_pb.RegisterTaskDefResponse>;
  getTaskDef: grpc.handleUnaryCall<requests_pb.GetTaskDefRequest, requests_pb.GetTaskDefResponse>;
  getAllTaskDefs: grpc.handleUnaryCall<requests_pb.GetAllTaskDefsRequest, requests_pb.GetAllTaskDefsResponse>;
  registerExecutor: grpc.handleUnaryCall<requests_pb.RegisterExecutorRequest, requests_pb.RegisterExecutorResponse>;
  updateExecutorQueues: grpc.handleUnaryCall<requests_pb.UpdateExecutorQueuesRequest, requests_pb.UpdateExecutorQueuesResponse>;
  registerApp: grpc.handleUnaryCall<requests_pb.RegisterAppRequest, requests_pb.RegisterAppResponse>;
  setLogLink: grpc.handleUnaryCall<requests_pb.SetLogLinkRequest, requests_pb.SetLogLinkResponse>;
  acquireSchedulerLock: grpc.handleUnaryCall<requests_pb.AcquireSchedulerLockRequest, requests_pb.AcquireSchedulerLockResponse>;
}

export class GatewayServiceClient extends grpc.Client {
  constructor(address: string, credentials: grpc.ChannelCredentials, options?: object);
  testConnection(argument: google_protobuf_empty_pb.Empty, callback: grpc.requestCallback<google_protobuf_empty_pb.Empty>): grpc.ClientUnaryCall;
  testConnection(argument: google_protobuf_empty_pb.Empty, metadataOrOptions: grpc.Metadata | grpc.CallOptions | null, callback: grpc.requestCallback<google_protobuf_empty_pb.Empty>): grpc.ClientUnaryCall;
  testConnection(argument: google_protobuf_empty_pb.Empty, metadata: grpc.Metadata | null, options: grpc.CallOptions | null, callback: grpc.requestCallback<google_protobuf_empty_pb.Empty>): grpc.ClientUnaryCall;
  enqueue(argument: requests_pb.EnqueueRequest, callback: grpc.requestCallback<requests_pb.EnqueueResponse>): grpc.ClientUnaryCall;
  enqueue(argument: requests_pb.EnqueueRequest, metadataOrOptions: grpc.Metadata | grpc.CallOptions | null, callback: grpc.requestCallback<requests_pb.EnqueueResponse>): grpc.ClientUnaryCall;
  enqueue(argument: requests_pb.EnqueueRequest, metadata: grpc.Metadata | null, options: grpc.CallOptions | null, callback: grpc.requestCallback<requests_pb.EnqueueResponse>): grpc.ClientUnaryCall;
  dequeue(argument: requests_pb.DequeueRequest, callback: grpc.requestCallback<requests_pb.DequeueResponse>): grpc.ClientUnaryCall;
  dequeue(argument: requests_pb.DequeueRequest, metadataOrOptions: grpc.Metadata | grpc.CallOptions | null, callback: grpc.requestCallback<requests_pb.DequeueResponse>): grpc.ClientUnaryCall;
  dequeue(argument: requests_pb.DequeueRequest, metadata: grpc.Metadata | null, options: grpc.CallOptions | null, callback: grpc.requestCallback<requests_pb.DequeueResponse>): grpc.ClientUnaryCall;
  getQueues(argument: requests_pb.GetQueuesRequest, callback: grpc.requestCallback<requests_pb.GetQueuesResponse>): grpc.ClientUnaryCall;
  getQueues(argument: requests_pb.GetQueuesRequest, metadataOrOptions: grpc.Metadata | grpc.CallOptions | null, callback: grpc.requestCallback<requests_pb.GetQueuesResponse>): grpc.ClientUnaryCall;
  getQueues(argument: requests_pb.GetQueuesRequest, metadata: grpc.Metadata | null, options: grpc.CallOptions | null, callback: grpc.requestCallback<requests_pb.GetQueuesResponse>): grpc.ClientUnaryCall;
  getTaskRunStatus(argument: requests_pb.GetTaskRunStatusRequest, callback: grpc.requestCallback<requests_pb.GetTaskRunStatusResponse>): grpc.ClientUnaryCall;
  getTaskRunStatus(argument: requests_pb.GetTaskRunStatusRequest, metadataOrOptions: grpc.Metadata | grpc.CallOptions | null, callback: grpc.requestCallback<requests_pb.GetTaskRunStatusResponse>): grpc.ClientUnaryCall;
  getTaskRunStatus(argument: requests_pb.GetTaskRunStatusRequest, metadata: grpc.Metadata | null, options: grpc.CallOptions | null, callback: grpc.requestCallback<requests_pb.GetTaskRunStatusResponse>): grpc.ClientUnaryCall;
  markSuccess(argument: requests_pb.MarkSuccessRequest, callback: grpc.requestCallback<requests_pb.MarkSuccessResponse>): grpc.ClientUnaryCall;
  markSuccess(argument: requests_pb.MarkSuccessRequest, metadataOrOptions: grpc.Metadata | grpc.CallOptions | null, callback: grpc.requestCallback<requests_pb.MarkSuccessResponse>): grpc.ClientUnaryCall;
  markSuccess(argument: requests_pb.MarkSuccessRequest, metadata: grpc.Metadata | null, options: grpc.CallOptions | null, callback: grpc.requestCallback<requests_pb.MarkSuccessResponse>): grpc.ClientUnaryCall;
  markFailed(argument: requests_pb.MarkFailedRequest, callback: grpc.requestCallback<requests_pb.MarkFailedResponse>): grpc.ClientUnaryCall;
  markFailed(argument: requests_pb.MarkFailedRequest, metadataOrOptions: grpc.Metadata | grpc.CallOptions | null, callback: grpc.requestCallback<requests_pb.MarkFailedResponse>): grpc.ClientUnaryCall;
  markFailed(argument: requests_pb.MarkFailedRequest, metadata: grpc.Metadata | null, options: grpc.CallOptions | null, callback: grpc.requestCallback<requests_pb.MarkFailedResponse>): grpc.ClientUnaryCall;
  getTaskRun(argument: requests_pb.GetTaskRunRequest, callback: grpc.requestCallback<requests_pb.GetTaskRunResponse>): grpc.ClientUnaryCall;
  getTaskRun(argument: requests_pb.GetTaskRunRequest, metadataOrOptions: grpc.Metadata | grpc.CallOptions | null, callback: grpc.requestCallback<requests_pb.GetTaskRunResponse>): grpc.ClientUnaryCall;
  getTaskRun(argument: requests_pb.GetTaskRunRequest, metadata: grpc.Metadata | null, options: grpc.CallOptions | null, callback: grpc.requestCallback<requests_pb.GetTaskRunResponse>): grpc.ClientUnaryCall;
  getDurableTaskRuns(argument: requests_pb.GetDurableTaskRunsRequest, callback: grpc.requestCallback<requests_pb.GetDurableTaskRunsResponse>): grpc.ClientUnaryCall;
  getDurableTaskRuns(argument: requests_pb.GetDurableTaskRunsRequest, metadataOrOptions: grpc.Metadata | grpc.CallOptions | null, callback: grpc.requestCallback<requests_pb.GetDurableTaskRunsResponse>): grpc.ClientUnaryCall;
  getDurableTaskRuns(argument: requests_pb.GetDurableTaskRunsRequest, metadata: grpc.Metadata | null, options: grpc.CallOptions | null, callback: grpc.requestCallback<requests_pb.GetDurableTaskRunsResponse>): grpc.ClientUnaryCall;
  registerTaskDef(argument: requests_pb.RegisterTaskDefRequest, callback: grpc.requestCallback<requests_pb.RegisterTaskDefResponse>): grpc.ClientUnaryCall;
  registerTaskDef(argument: requests_pb.RegisterTaskDefRequest, metadataOrOptions: grpc.Metadata | grpc.CallOptions | null, callback: grpc.requestCallback<requests_pb.RegisterTaskDefResponse>): grpc.ClientUnaryCall;
  registerTaskDef(argument: requests_pb.RegisterTaskDefRequest, metadata: grpc.Metadata | null, options: grpc.CallOptions | null, callback: grpc.requestCallback<requests_pb.RegisterTaskDefResponse>): grpc.ClientUnaryCall;
  getTaskDef(argument: requests_pb.GetTaskDefRequest, callback: grpc.requestCallback<requests_pb.GetTaskDefResponse>): grpc.ClientUnaryCall;
  getTaskDef(argument: requests_pb.GetTaskDefRequest, metadataOrOptions: grpc.Metadata | grpc.CallOptions | null, callback: grpc.requestCallback<requests_pb.GetTaskDefResponse>): grpc.ClientUnaryCall;
  getTaskDef(argument: requests_pb.GetTaskDefRequest, metadata: grpc.Metadata | null, options: grpc.CallOptions | null, callback: grpc.requestCallback<requests_pb.GetTaskDefResponse>): grpc.ClientUnaryCall;
  getAllTaskDefs(argument: requests_pb.GetAllTaskDefsRequest, callback: grpc.requestCallback<requests_pb.GetAllTaskDefsResponse>): grpc.ClientUnaryCall;
  getAllTaskDefs(argument: requests_pb.GetAllTaskDefsRequest, metadataOrOptions: grpc.Metadata | grpc.CallOptions | null, callback: grpc.requestCallback<requests_pb.GetAllTaskDefsResponse>): grpc.ClientUnaryCall;
  getAllTaskDefs(argument: requests_pb.GetAllTaskDefsRequest, metadata: grpc.Metadata | null, options: grpc.CallOptions | null, callback: grpc.requestCallback<requests_pb.GetAllTaskDefsResponse>): grpc.ClientUnaryCall;
  registerExecutor(argument: requests_pb.RegisterExecutorRequest, callback: grpc.requestCallback<requests_pb.RegisterExecutorResponse>): grpc.ClientUnaryCall;
  registerExecutor(argument: requests_pb.RegisterExecutorRequest, metadataOrOptions: grpc.Metadata | grpc.CallOptions | null, callback: grpc.requestCallback<requests_pb.RegisterExecutorResponse>): grpc.ClientUnaryCall;
  registerExecutor(argument: requests_pb.RegisterExecutorRequest, metadata: grpc.Metadata | null, options: grpc.CallOptions | null, callback: grpc.requestCallback<requests_pb.RegisterExecutorResponse>): grpc.ClientUnaryCall;
  updateExecutorQueues(argument: requests_pb.UpdateExecutorQueuesRequest, callback: grpc.requestCallback<requests_pb.UpdateExecutorQueuesResponse>): grpc.ClientUnaryCall;
  updateExecutorQueues(argument: requests_pb.UpdateExecutorQueuesRequest, metadataOrOptions: grpc.Metadata | grpc.CallOptions | null, callback: grpc.requestCallback<requests_pb.UpdateExecutorQueuesResponse>): grpc.ClientUnaryCall;
  updateExecutorQueues(argument: requests_pb.UpdateExecutorQueuesRequest, metadata: grpc.Metadata | null, options: grpc.CallOptions | null, callback: grpc.requestCallback<requests_pb.UpdateExecutorQueuesResponse>): grpc.ClientUnaryCall;
  registerApp(argument: requests_pb.RegisterAppRequest, callback: grpc.requestCallback<requests_pb.RegisterAppResponse>): grpc.ClientUnaryCall;
  registerApp(argument: requests_pb.RegisterAppRequest, metadataOrOptions: grpc.Metadata | grpc.CallOptions | null, callback: grpc.requestCallback<requests_pb.RegisterAppResponse>): grpc.ClientUnaryCall;
  registerApp(argument: requests_pb.RegisterAppRequest, metadata: grpc.Metadata | null, options: grpc.CallOptions | null, callback: grpc.requestCallback<requests_pb.RegisterAppResponse>): grpc.ClientUnaryCall;
  setLogLink(argument: requests_pb.SetLogLinkRequest, callback: grpc.requestCallback<requests_pb.SetLogLinkResponse>): grpc.ClientUnaryCall;
  setLogLink(argument: requests_pb.SetLogLinkRequest, metadataOrOptions: grpc.Metadata | grpc.CallOptions | null, callback: grpc.requestCallback<requests_pb.SetLogLinkResponse>): grpc.ClientUnaryCall;
  setLogLink(argument: requests_pb.SetLogLinkRequest, metadata: grpc.Metadata | null, options: grpc.CallOptions | null, callback: grpc.requestCallback<requests_pb.SetLogLinkResponse>): grpc.ClientUnaryCall;
  acquireSchedulerLock(argument: requests_pb.AcquireSchedulerLockRequest, callback: grpc.requestCallback<requests_pb.AcquireSchedulerLockResponse>): grpc.ClientUnaryCall;
  acquireSchedulerLock(argument: requests_pb.AcquireSchedulerLockRequest, metadataOrOptions: grpc.Metadata | grpc.CallOptions | null, callback: grpc.requestCallback<requests_pb.AcquireSchedulerLockResponse>): grpc.ClientUnaryCall;
  acquireSchedulerLock(argument: requests_pb.AcquireSchedulerLockRequest, metadata: grpc.Metadata | null, options: grpc.CallOptions | null, callback: grpc.requestCallback<requests_pb.AcquireSchedulerLockResponse>): grpc.ClientUnaryCall;
}
