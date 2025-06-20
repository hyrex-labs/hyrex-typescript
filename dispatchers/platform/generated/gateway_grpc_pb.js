// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('@grpc/grpc-js');
var google_protobuf_empty_pb = require('google-protobuf/google/protobuf/empty_pb.js');
var requests_pb = require('./requests_pb.js');

function serialize_google_protobuf_Empty(arg) {
  if (!(arg instanceof google_protobuf_empty_pb.Empty)) {
    throw new Error('Expected argument of type google.protobuf.Empty');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_google_protobuf_Empty(buffer_arg) {
  return google_protobuf_empty_pb.Empty.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_hyrex_performanceserver_AdvanceWorkflowRunRequest(arg) {
  if (!(arg instanceof requests_pb.AdvanceWorkflowRunRequest)) {
    throw new Error('Expected argument of type hyrex.performanceserver.AdvanceWorkflowRunRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_hyrex_performanceserver_AdvanceWorkflowRunRequest(buffer_arg) {
  return requests_pb.AdvanceWorkflowRunRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_hyrex_performanceserver_DequeueRequest(arg) {
  if (!(arg instanceof requests_pb.DequeueRequest)) {
    throw new Error('Expected argument of type hyrex.performanceserver.DequeueRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_hyrex_performanceserver_DequeueRequest(buffer_arg) {
  return requests_pb.DequeueRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_hyrex_performanceserver_DequeueResponse(arg) {
  if (!(arg instanceof requests_pb.DequeueResponse)) {
    throw new Error('Expected argument of type hyrex.performanceserver.DequeueResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_hyrex_performanceserver_DequeueResponse(buffer_arg) {
  return requests_pb.DequeueResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_hyrex_performanceserver_DisconnectExecutorRequest(arg) {
  if (!(arg instanceof requests_pb.DisconnectExecutorRequest)) {
    throw new Error('Expected argument of type hyrex.performanceserver.DisconnectExecutorRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_hyrex_performanceserver_DisconnectExecutorRequest(buffer_arg) {
  return requests_pb.DisconnectExecutorRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_hyrex_performanceserver_EnqueueRequest(arg) {
  if (!(arg instanceof requests_pb.EnqueueRequest)) {
    throw new Error('Expected argument of type hyrex.performanceserver.EnqueueRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_hyrex_performanceserver_EnqueueRequest(buffer_arg) {
  return requests_pb.EnqueueRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_hyrex_performanceserver_ExecutorHeartbeatRequest(arg) {
  if (!(arg instanceof requests_pb.ExecutorHeartbeatRequest)) {
    throw new Error('Expected argument of type hyrex.performanceserver.ExecutorHeartbeatRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_hyrex_performanceserver_ExecutorHeartbeatRequest(buffer_arg) {
  return requests_pb.ExecutorHeartbeatRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_hyrex_performanceserver_GetAllTaskDefsRequest(arg) {
  if (!(arg instanceof requests_pb.GetAllTaskDefsRequest)) {
    throw new Error('Expected argument of type hyrex.performanceserver.GetAllTaskDefsRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_hyrex_performanceserver_GetAllTaskDefsRequest(buffer_arg) {
  return requests_pb.GetAllTaskDefsRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_hyrex_performanceserver_GetAllTaskDefsResponse(arg) {
  if (!(arg instanceof requests_pb.GetAllTaskDefsResponse)) {
    throw new Error('Expected argument of type hyrex.performanceserver.GetAllTaskDefsResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_hyrex_performanceserver_GetAllTaskDefsResponse(buffer_arg) {
  return requests_pb.GetAllTaskDefsResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_hyrex_performanceserver_GetDurableTaskRunsRequest(arg) {
  if (!(arg instanceof requests_pb.GetDurableTaskRunsRequest)) {
    throw new Error('Expected argument of type hyrex.performanceserver.GetDurableTaskRunsRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_hyrex_performanceserver_GetDurableTaskRunsRequest(buffer_arg) {
  return requests_pb.GetDurableTaskRunsRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_hyrex_performanceserver_GetDurableTaskRunsResponse(arg) {
  if (!(arg instanceof requests_pb.GetDurableTaskRunsResponse)) {
    throw new Error('Expected argument of type hyrex.performanceserver.GetDurableTaskRunsResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_hyrex_performanceserver_GetDurableTaskRunsResponse(buffer_arg) {
  return requests_pb.GetDurableTaskRunsResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_hyrex_performanceserver_GetQueuesRequest(arg) {
  if (!(arg instanceof requests_pb.GetQueuesRequest)) {
    throw new Error('Expected argument of type hyrex.performanceserver.GetQueuesRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_hyrex_performanceserver_GetQueuesRequest(buffer_arg) {
  return requests_pb.GetQueuesRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_hyrex_performanceserver_GetQueuesResponse(arg) {
  if (!(arg instanceof requests_pb.GetQueuesResponse)) {
    throw new Error('Expected argument of type hyrex.performanceserver.GetQueuesResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_hyrex_performanceserver_GetQueuesResponse(buffer_arg) {
  return requests_pb.GetQueuesResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_hyrex_performanceserver_GetTaskDefRequest(arg) {
  if (!(arg instanceof requests_pb.GetTaskDefRequest)) {
    throw new Error('Expected argument of type hyrex.performanceserver.GetTaskDefRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_hyrex_performanceserver_GetTaskDefRequest(buffer_arg) {
  return requests_pb.GetTaskDefRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_hyrex_performanceserver_GetTaskDefResponse(arg) {
  if (!(arg instanceof requests_pb.GetTaskDefResponse)) {
    throw new Error('Expected argument of type hyrex.performanceserver.GetTaskDefResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_hyrex_performanceserver_GetTaskDefResponse(buffer_arg) {
  return requests_pb.GetTaskDefResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_hyrex_performanceserver_GetTaskRunRequest(arg) {
  if (!(arg instanceof requests_pb.GetTaskRunRequest)) {
    throw new Error('Expected argument of type hyrex.performanceserver.GetTaskRunRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_hyrex_performanceserver_GetTaskRunRequest(buffer_arg) {
  return requests_pb.GetTaskRunRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_hyrex_performanceserver_GetTaskRunResponse(arg) {
  if (!(arg instanceof requests_pb.GetTaskRunResponse)) {
    throw new Error('Expected argument of type hyrex.performanceserver.GetTaskRunResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_hyrex_performanceserver_GetTaskRunResponse(buffer_arg) {
  return requests_pb.GetTaskRunResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_hyrex_performanceserver_GetTaskRunStatusRequest(arg) {
  if (!(arg instanceof requests_pb.GetTaskRunStatusRequest)) {
    throw new Error('Expected argument of type hyrex.performanceserver.GetTaskRunStatusRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_hyrex_performanceserver_GetTaskRunStatusRequest(buffer_arg) {
  return requests_pb.GetTaskRunStatusRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_hyrex_performanceserver_GetTaskRunStatusResponse(arg) {
  if (!(arg instanceof requests_pb.GetTaskRunStatusResponse)) {
    throw new Error('Expected argument of type hyrex.performanceserver.GetTaskRunStatusResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_hyrex_performanceserver_GetTaskRunStatusResponse(buffer_arg) {
  return requests_pb.GetTaskRunStatusResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_hyrex_performanceserver_GetTaskRunsUpForCancelResponse(arg) {
  if (!(arg instanceof requests_pb.GetTaskRunsUpForCancelResponse)) {
    throw new Error('Expected argument of type hyrex.performanceserver.GetTaskRunsUpForCancelResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_hyrex_performanceserver_GetTaskRunsUpForCancelResponse(buffer_arg) {
  return requests_pb.GetTaskRunsUpForCancelResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_hyrex_performanceserver_GetWorkflowDurableRunsRequest(arg) {
  if (!(arg instanceof requests_pb.GetWorkflowDurableRunsRequest)) {
    throw new Error('Expected argument of type hyrex.performanceserver.GetWorkflowDurableRunsRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_hyrex_performanceserver_GetWorkflowDurableRunsRequest(buffer_arg) {
  return requests_pb.GetWorkflowDurableRunsRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_hyrex_performanceserver_GetWorkflowDurableRunsResponse(arg) {
  if (!(arg instanceof requests_pb.GetWorkflowDurableRunsResponse)) {
    throw new Error('Expected argument of type hyrex.performanceserver.GetWorkflowDurableRunsResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_hyrex_performanceserver_GetWorkflowDurableRunsResponse(buffer_arg) {
  return requests_pb.GetWorkflowDurableRunsResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_hyrex_performanceserver_GetWorkflowRunArgsRequest(arg) {
  if (!(arg instanceof requests_pb.GetWorkflowRunArgsRequest)) {
    throw new Error('Expected argument of type hyrex.performanceserver.GetWorkflowRunArgsRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_hyrex_performanceserver_GetWorkflowRunArgsRequest(buffer_arg) {
  return requests_pb.GetWorkflowRunArgsRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_hyrex_performanceserver_GetWorkflowRunArgsResponse(arg) {
  if (!(arg instanceof requests_pb.GetWorkflowRunArgsResponse)) {
    throw new Error('Expected argument of type hyrex.performanceserver.GetWorkflowRunArgsResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_hyrex_performanceserver_GetWorkflowRunArgsResponse(buffer_arg) {
  return requests_pb.GetWorkflowRunArgsResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_hyrex_performanceserver_KVStoreGetRequest(arg) {
  if (!(arg instanceof requests_pb.KVStoreGetRequest)) {
    throw new Error('Expected argument of type hyrex.performanceserver.KVStoreGetRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_hyrex_performanceserver_KVStoreGetRequest(buffer_arg) {
  return requests_pb.KVStoreGetRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_hyrex_performanceserver_KVStoreGetResponse(arg) {
  if (!(arg instanceof requests_pb.KVStoreGetResponse)) {
    throw new Error('Expected argument of type hyrex.performanceserver.KVStoreGetResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_hyrex_performanceserver_KVStoreGetResponse(buffer_arg) {
  return requests_pb.KVStoreGetResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_hyrex_performanceserver_KVStoreSetRequest(arg) {
  if (!(arg instanceof requests_pb.KVStoreSetRequest)) {
    throw new Error('Expected argument of type hyrex.performanceserver.KVStoreSetRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_hyrex_performanceserver_KVStoreSetRequest(buffer_arg) {
  return requests_pb.KVStoreSetRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_hyrex_performanceserver_MarkCanceledRequest(arg) {
  if (!(arg instanceof requests_pb.MarkCanceledRequest)) {
    throw new Error('Expected argument of type hyrex.performanceserver.MarkCanceledRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_hyrex_performanceserver_MarkCanceledRequest(buffer_arg) {
  return requests_pb.MarkCanceledRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_hyrex_performanceserver_MarkFailedRequest(arg) {
  if (!(arg instanceof requests_pb.MarkFailedRequest)) {
    throw new Error('Expected argument of type hyrex.performanceserver.MarkFailedRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_hyrex_performanceserver_MarkFailedRequest(buffer_arg) {
  return requests_pb.MarkFailedRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_hyrex_performanceserver_MarkSuccessRequest(arg) {
  if (!(arg instanceof requests_pb.MarkSuccessRequest)) {
    throw new Error('Expected argument of type hyrex.performanceserver.MarkSuccessRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_hyrex_performanceserver_MarkSuccessRequest(buffer_arg) {
  return requests_pb.MarkSuccessRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_hyrex_performanceserver_RegisterAppRequest(arg) {
  if (!(arg instanceof requests_pb.RegisterAppRequest)) {
    throw new Error('Expected argument of type hyrex.performanceserver.RegisterAppRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_hyrex_performanceserver_RegisterAppRequest(buffer_arg) {
  return requests_pb.RegisterAppRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_hyrex_performanceserver_RegisterExecutorRequest(arg) {
  if (!(arg instanceof requests_pb.RegisterExecutorRequest)) {
    throw new Error('Expected argument of type hyrex.performanceserver.RegisterExecutorRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_hyrex_performanceserver_RegisterExecutorRequest(buffer_arg) {
  return requests_pb.RegisterExecutorRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_hyrex_performanceserver_RegisterTaskDefRequest(arg) {
  if (!(arg instanceof requests_pb.RegisterTaskDefRequest)) {
    throw new Error('Expected argument of type hyrex.performanceserver.RegisterTaskDefRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_hyrex_performanceserver_RegisterTaskDefRequest(buffer_arg) {
  return requests_pb.RegisterTaskDefRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_hyrex_performanceserver_RegisterWorkflowRequest(arg) {
  if (!(arg instanceof requests_pb.RegisterWorkflowRequest)) {
    throw new Error('Expected argument of type hyrex.performanceserver.RegisterWorkflowRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_hyrex_performanceserver_RegisterWorkflowRequest(buffer_arg) {
  return requests_pb.RegisterWorkflowRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_hyrex_performanceserver_RetryTaskRunRequest(arg) {
  if (!(arg instanceof requests_pb.RetryTaskRunRequest)) {
    throw new Error('Expected argument of type hyrex.performanceserver.RetryTaskRunRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_hyrex_performanceserver_RetryTaskRunRequest(buffer_arg) {
  return requests_pb.RetryTaskRunRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_hyrex_performanceserver_SendWorkflowRunRequest(arg) {
  if (!(arg instanceof requests_pb.SendWorkflowRunRequest)) {
    throw new Error('Expected argument of type hyrex.performanceserver.SendWorkflowRunRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_hyrex_performanceserver_SendWorkflowRunRequest(buffer_arg) {
  return requests_pb.SendWorkflowRunRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_hyrex_performanceserver_SetLogLinkRequest(arg) {
  if (!(arg instanceof requests_pb.SetLogLinkRequest)) {
    throw new Error('Expected argument of type hyrex.performanceserver.SetLogLinkRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_hyrex_performanceserver_SetLogLinkRequest(buffer_arg) {
  return requests_pb.SetLogLinkRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_hyrex_performanceserver_TaskRunHeartbeatRequest(arg) {
  if (!(arg instanceof requests_pb.TaskRunHeartbeatRequest)) {
    throw new Error('Expected argument of type hyrex.performanceserver.TaskRunHeartbeatRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_hyrex_performanceserver_TaskRunHeartbeatRequest(buffer_arg) {
  return requests_pb.TaskRunHeartbeatRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_hyrex_performanceserver_TryToCancelDurableRunRequest(arg) {
  if (!(arg instanceof requests_pb.TryToCancelDurableRunRequest)) {
    throw new Error('Expected argument of type hyrex.performanceserver.TryToCancelDurableRunRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_hyrex_performanceserver_TryToCancelDurableRunRequest(buffer_arg) {
  return requests_pb.TryToCancelDurableRunRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_hyrex_performanceserver_UpdateExecutorQueuesRequest(arg) {
  if (!(arg instanceof requests_pb.UpdateExecutorQueuesRequest)) {
    throw new Error('Expected argument of type hyrex.performanceserver.UpdateExecutorQueuesRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_hyrex_performanceserver_UpdateExecutorQueuesRequest(buffer_arg) {
  return requests_pb.UpdateExecutorQueuesRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_hyrex_performanceserver_UpdateExecutorStatsRequest(arg) {
  if (!(arg instanceof requests_pb.UpdateExecutorStatsRequest)) {
    throw new Error('Expected argument of type hyrex.performanceserver.UpdateExecutorStatsRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_hyrex_performanceserver_UpdateExecutorStatsRequest(buffer_arg) {
  return requests_pb.UpdateExecutorStatsRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_hyrex_performanceserver_WriteLogsRequest(arg) {
  if (!(arg instanceof requests_pb.WriteLogsRequest)) {
    throw new Error('Expected argument of type hyrex.performanceserver.WriteLogsRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_hyrex_performanceserver_WriteLogsRequest(buffer_arg) {
  return requests_pb.WriteLogsRequest.deserializeBinary(new Uint8Array(buffer_arg));
}


var GatewayServiceService = exports.GatewayServiceService = {
  testConnection: {
    path: '/hyrex.performanceserver.GatewayService/TestConnection',
    requestStream: false,
    responseStream: false,
    requestType: google_protobuf_empty_pb.Empty,
    responseType: google_protobuf_empty_pb.Empty,
    requestSerialize: serialize_google_protobuf_Empty,
    requestDeserialize: deserialize_google_protobuf_Empty,
    responseSerialize: serialize_google_protobuf_Empty,
    responseDeserialize: deserialize_google_protobuf_Empty,
  },
  // ---- S3 requests ----
writeLogs: {
    path: '/hyrex.performanceserver.GatewayService/WriteLogs',
    requestStream: false,
    responseStream: false,
    requestType: requests_pb.WriteLogsRequest,
    responseType: google_protobuf_empty_pb.Empty,
    requestSerialize: serialize_hyrex_performanceserver_WriteLogsRequest,
    requestDeserialize: deserialize_hyrex_performanceserver_WriteLogsRequest,
    responseSerialize: serialize_google_protobuf_Empty,
    responseDeserialize: deserialize_google_protobuf_Empty,
  },
  // ---- Valkey requests ----
enqueue: {
    path: '/hyrex.performanceserver.GatewayService/Enqueue',
    requestStream: false,
    responseStream: false,
    requestType: requests_pb.EnqueueRequest,
    responseType: google_protobuf_empty_pb.Empty,
    requestSerialize: serialize_hyrex_performanceserver_EnqueueRequest,
    requestDeserialize: deserialize_hyrex_performanceserver_EnqueueRequest,
    responseSerialize: serialize_google_protobuf_Empty,
    responseDeserialize: deserialize_google_protobuf_Empty,
  },
  dequeue: {
    path: '/hyrex.performanceserver.GatewayService/Dequeue',
    requestStream: false,
    responseStream: false,
    requestType: requests_pb.DequeueRequest,
    responseType: requests_pb.DequeueResponse,
    requestSerialize: serialize_hyrex_performanceserver_DequeueRequest,
    requestDeserialize: deserialize_hyrex_performanceserver_DequeueRequest,
    responseSerialize: serialize_hyrex_performanceserver_DequeueResponse,
    responseDeserialize: deserialize_hyrex_performanceserver_DequeueResponse,
  },
  getQueues: {
    path: '/hyrex.performanceserver.GatewayService/GetQueues',
    requestStream: false,
    responseStream: false,
    requestType: requests_pb.GetQueuesRequest,
    responseType: requests_pb.GetQueuesResponse,
    requestSerialize: serialize_hyrex_performanceserver_GetQueuesRequest,
    requestDeserialize: deserialize_hyrex_performanceserver_GetQueuesRequest,
    responseSerialize: serialize_hyrex_performanceserver_GetQueuesResponse,
    responseDeserialize: deserialize_hyrex_performanceserver_GetQueuesResponse,
  },
  getTaskRunStatus: {
    path: '/hyrex.performanceserver.GatewayService/GetTaskRunStatus',
    requestStream: false,
    responseStream: false,
    requestType: requests_pb.GetTaskRunStatusRequest,
    responseType: requests_pb.GetTaskRunStatusResponse,
    requestSerialize: serialize_hyrex_performanceserver_GetTaskRunStatusRequest,
    requestDeserialize: deserialize_hyrex_performanceserver_GetTaskRunStatusRequest,
    responseSerialize: serialize_hyrex_performanceserver_GetTaskRunStatusResponse,
    responseDeserialize: deserialize_hyrex_performanceserver_GetTaskRunStatusResponse,
  },
  markSuccess: {
    path: '/hyrex.performanceserver.GatewayService/MarkSuccess',
    requestStream: false,
    responseStream: false,
    requestType: requests_pb.MarkSuccessRequest,
    responseType: google_protobuf_empty_pb.Empty,
    requestSerialize: serialize_hyrex_performanceserver_MarkSuccessRequest,
    requestDeserialize: deserialize_hyrex_performanceserver_MarkSuccessRequest,
    responseSerialize: serialize_google_protobuf_Empty,
    responseDeserialize: deserialize_google_protobuf_Empty,
  },
  markFailed: {
    path: '/hyrex.performanceserver.GatewayService/MarkFailed',
    requestStream: false,
    responseStream: false,
    requestType: requests_pb.MarkFailedRequest,
    responseType: google_protobuf_empty_pb.Empty,
    requestSerialize: serialize_hyrex_performanceserver_MarkFailedRequest,
    requestDeserialize: deserialize_hyrex_performanceserver_MarkFailedRequest,
    responseSerialize: serialize_google_protobuf_Empty,
    responseDeserialize: deserialize_google_protobuf_Empty,
  },
  getTaskRun: {
    path: '/hyrex.performanceserver.GatewayService/GetTaskRun',
    requestStream: false,
    responseStream: false,
    requestType: requests_pb.GetTaskRunRequest,
    responseType: requests_pb.GetTaskRunResponse,
    requestSerialize: serialize_hyrex_performanceserver_GetTaskRunRequest,
    requestDeserialize: deserialize_hyrex_performanceserver_GetTaskRunRequest,
    responseSerialize: serialize_hyrex_performanceserver_GetTaskRunResponse,
    responseDeserialize: deserialize_hyrex_performanceserver_GetTaskRunResponse,
  },
  getDurableTaskRuns: {
    path: '/hyrex.performanceserver.GatewayService/GetDurableTaskRuns',
    requestStream: false,
    responseStream: false,
    requestType: requests_pb.GetDurableTaskRunsRequest,
    responseType: requests_pb.GetDurableTaskRunsResponse,
    requestSerialize: serialize_hyrex_performanceserver_GetDurableTaskRunsRequest,
    requestDeserialize: deserialize_hyrex_performanceserver_GetDurableTaskRunsRequest,
    responseSerialize: serialize_hyrex_performanceserver_GetDurableTaskRunsResponse,
    responseDeserialize: deserialize_hyrex_performanceserver_GetDurableTaskRunsResponse,
  },
  retryTaskRun: {
    path: '/hyrex.performanceserver.GatewayService/RetryTaskRun',
    requestStream: false,
    responseStream: false,
    requestType: requests_pb.RetryTaskRunRequest,
    responseType: google_protobuf_empty_pb.Empty,
    requestSerialize: serialize_hyrex_performanceserver_RetryTaskRunRequest,
    requestDeserialize: deserialize_hyrex_performanceserver_RetryTaskRunRequest,
    responseSerialize: serialize_google_protobuf_Empty,
    responseDeserialize: deserialize_google_protobuf_Empty,
  },
  taskRunHeartbeat: {
    path: '/hyrex.performanceserver.GatewayService/TaskRunHeartbeat',
    requestStream: false,
    responseStream: false,
    requestType: requests_pb.TaskRunHeartbeatRequest,
    responseType: google_protobuf_empty_pb.Empty,
    requestSerialize: serialize_hyrex_performanceserver_TaskRunHeartbeatRequest,
    requestDeserialize: deserialize_hyrex_performanceserver_TaskRunHeartbeatRequest,
    responseSerialize: serialize_google_protobuf_Empty,
    responseDeserialize: deserialize_google_protobuf_Empty,
  },
  tryToCancelDurableRun: {
    path: '/hyrex.performanceserver.GatewayService/TryToCancelDurableRun',
    requestStream: false,
    responseStream: false,
    requestType: requests_pb.TryToCancelDurableRunRequest,
    responseType: google_protobuf_empty_pb.Empty,
    requestSerialize: serialize_hyrex_performanceserver_TryToCancelDurableRunRequest,
    requestDeserialize: deserialize_hyrex_performanceserver_TryToCancelDurableRunRequest,
    responseSerialize: serialize_google_protobuf_Empty,
    responseDeserialize: deserialize_google_protobuf_Empty,
  },
  getTaskRunsUpForCancel: {
    path: '/hyrex.performanceserver.GatewayService/GetTaskRunsUpForCancel',
    requestStream: false,
    responseStream: false,
    requestType: google_protobuf_empty_pb.Empty,
    responseType: requests_pb.GetTaskRunsUpForCancelResponse,
    requestSerialize: serialize_google_protobuf_Empty,
    requestDeserialize: deserialize_google_protobuf_Empty,
    responseSerialize: serialize_hyrex_performanceserver_GetTaskRunsUpForCancelResponse,
    responseDeserialize: deserialize_hyrex_performanceserver_GetTaskRunsUpForCancelResponse,
  },
  markCanceled: {
    path: '/hyrex.performanceserver.GatewayService/MarkCanceled',
    requestStream: false,
    responseStream: false,
    requestType: requests_pb.MarkCanceledRequest,
    responseType: google_protobuf_empty_pb.Empty,
    requestSerialize: serialize_hyrex_performanceserver_MarkCanceledRequest,
    requestDeserialize: deserialize_hyrex_performanceserver_MarkCanceledRequest,
    responseSerialize: serialize_google_protobuf_Empty,
    responseDeserialize: deserialize_google_protobuf_Empty,
  },
  kVStoreSet: {
    path: '/hyrex.performanceserver.GatewayService/KVStoreSet',
    requestStream: false,
    responseStream: false,
    requestType: requests_pb.KVStoreSetRequest,
    responseType: google_protobuf_empty_pb.Empty,
    requestSerialize: serialize_hyrex_performanceserver_KVStoreSetRequest,
    requestDeserialize: deserialize_hyrex_performanceserver_KVStoreSetRequest,
    responseSerialize: serialize_google_protobuf_Empty,
    responseDeserialize: deserialize_google_protobuf_Empty,
  },
  kVStoreGet: {
    path: '/hyrex.performanceserver.GatewayService/KVStoreGet',
    requestStream: false,
    responseStream: false,
    requestType: requests_pb.KVStoreGetRequest,
    responseType: requests_pb.KVStoreGetResponse,
    requestSerialize: serialize_hyrex_performanceserver_KVStoreGetRequest,
    requestDeserialize: deserialize_hyrex_performanceserver_KVStoreGetRequest,
    responseSerialize: serialize_hyrex_performanceserver_KVStoreGetResponse,
    responseDeserialize: deserialize_hyrex_performanceserver_KVStoreGetResponse,
  },
  // ---- Postgres requests ----
registerTaskDef: {
    path: '/hyrex.performanceserver.GatewayService/RegisterTaskDef',
    requestStream: false,
    responseStream: false,
    requestType: requests_pb.RegisterTaskDefRequest,
    responseType: google_protobuf_empty_pb.Empty,
    requestSerialize: serialize_hyrex_performanceserver_RegisterTaskDefRequest,
    requestDeserialize: deserialize_hyrex_performanceserver_RegisterTaskDefRequest,
    responseSerialize: serialize_google_protobuf_Empty,
    responseDeserialize: deserialize_google_protobuf_Empty,
  },
  getTaskDef: {
    path: '/hyrex.performanceserver.GatewayService/GetTaskDef',
    requestStream: false,
    responseStream: false,
    requestType: requests_pb.GetTaskDefRequest,
    responseType: requests_pb.GetTaskDefResponse,
    requestSerialize: serialize_hyrex_performanceserver_GetTaskDefRequest,
    requestDeserialize: deserialize_hyrex_performanceserver_GetTaskDefRequest,
    responseSerialize: serialize_hyrex_performanceserver_GetTaskDefResponse,
    responseDeserialize: deserialize_hyrex_performanceserver_GetTaskDefResponse,
  },
  getAllTaskDefs: {
    path: '/hyrex.performanceserver.GatewayService/GetAllTaskDefs',
    requestStream: false,
    responseStream: false,
    requestType: requests_pb.GetAllTaskDefsRequest,
    responseType: requests_pb.GetAllTaskDefsResponse,
    requestSerialize: serialize_hyrex_performanceserver_GetAllTaskDefsRequest,
    requestDeserialize: deserialize_hyrex_performanceserver_GetAllTaskDefsRequest,
    responseSerialize: serialize_hyrex_performanceserver_GetAllTaskDefsResponse,
    responseDeserialize: deserialize_hyrex_performanceserver_GetAllTaskDefsResponse,
  },
  registerExecutor: {
    path: '/hyrex.performanceserver.GatewayService/RegisterExecutor',
    requestStream: false,
    responseStream: false,
    requestType: requests_pb.RegisterExecutorRequest,
    responseType: google_protobuf_empty_pb.Empty,
    requestSerialize: serialize_hyrex_performanceserver_RegisterExecutorRequest,
    requestDeserialize: deserialize_hyrex_performanceserver_RegisterExecutorRequest,
    responseSerialize: serialize_google_protobuf_Empty,
    responseDeserialize: deserialize_google_protobuf_Empty,
  },
  executorHeartbeat: {
    path: '/hyrex.performanceserver.GatewayService/ExecutorHeartbeat',
    requestStream: false,
    responseStream: false,
    requestType: requests_pb.ExecutorHeartbeatRequest,
    responseType: google_protobuf_empty_pb.Empty,
    requestSerialize: serialize_hyrex_performanceserver_ExecutorHeartbeatRequest,
    requestDeserialize: deserialize_hyrex_performanceserver_ExecutorHeartbeatRequest,
    responseSerialize: serialize_google_protobuf_Empty,
    responseDeserialize: deserialize_google_protobuf_Empty,
  },
  updateExecutorStats: {
    path: '/hyrex.performanceserver.GatewayService/UpdateExecutorStats',
    requestStream: false,
    responseStream: false,
    requestType: requests_pb.UpdateExecutorStatsRequest,
    responseType: google_protobuf_empty_pb.Empty,
    requestSerialize: serialize_hyrex_performanceserver_UpdateExecutorStatsRequest,
    requestDeserialize: deserialize_hyrex_performanceserver_UpdateExecutorStatsRequest,
    responseSerialize: serialize_google_protobuf_Empty,
    responseDeserialize: deserialize_google_protobuf_Empty,
  },
  updateExecutorQueues: {
    path: '/hyrex.performanceserver.GatewayService/UpdateExecutorQueues',
    requestStream: false,
    responseStream: false,
    requestType: requests_pb.UpdateExecutorQueuesRequest,
    responseType: google_protobuf_empty_pb.Empty,
    requestSerialize: serialize_hyrex_performanceserver_UpdateExecutorQueuesRequest,
    requestDeserialize: deserialize_hyrex_performanceserver_UpdateExecutorQueuesRequest,
    responseSerialize: serialize_google_protobuf_Empty,
    responseDeserialize: deserialize_google_protobuf_Empty,
  },
  disconnectExecutor: {
    path: '/hyrex.performanceserver.GatewayService/DisconnectExecutor',
    requestStream: false,
    responseStream: false,
    requestType: requests_pb.DisconnectExecutorRequest,
    responseType: google_protobuf_empty_pb.Empty,
    requestSerialize: serialize_hyrex_performanceserver_DisconnectExecutorRequest,
    requestDeserialize: deserialize_hyrex_performanceserver_DisconnectExecutorRequest,
    responseSerialize: serialize_google_protobuf_Empty,
    responseDeserialize: deserialize_google_protobuf_Empty,
  },
  registerApp: {
    path: '/hyrex.performanceserver.GatewayService/RegisterApp',
    requestStream: false,
    responseStream: false,
    requestType: requests_pb.RegisterAppRequest,
    responseType: google_protobuf_empty_pb.Empty,
    requestSerialize: serialize_hyrex_performanceserver_RegisterAppRequest,
    requestDeserialize: deserialize_hyrex_performanceserver_RegisterAppRequest,
    responseSerialize: serialize_google_protobuf_Empty,
    responseDeserialize: deserialize_google_protobuf_Empty,
  },
  setLogLink: {
    path: '/hyrex.performanceserver.GatewayService/SetLogLink',
    requestStream: false,
    responseStream: false,
    requestType: requests_pb.SetLogLinkRequest,
    responseType: google_protobuf_empty_pb.Empty,
    requestSerialize: serialize_hyrex_performanceserver_SetLogLinkRequest,
    requestDeserialize: deserialize_hyrex_performanceserver_SetLogLinkRequest,
    responseSerialize: serialize_google_protobuf_Empty,
    responseDeserialize: deserialize_google_protobuf_Empty,
  },
  registerWorkflow: {
    path: '/hyrex.performanceserver.GatewayService/RegisterWorkflow',
    requestStream: false,
    responseStream: false,
    requestType: requests_pb.RegisterWorkflowRequest,
    responseType: google_protobuf_empty_pb.Empty,
    requestSerialize: serialize_hyrex_performanceserver_RegisterWorkflowRequest,
    requestDeserialize: deserialize_hyrex_performanceserver_RegisterWorkflowRequest,
    responseSerialize: serialize_google_protobuf_Empty,
    responseDeserialize: deserialize_google_protobuf_Empty,
  },
  sendWorkflowRun: {
    path: '/hyrex.performanceserver.GatewayService/SendWorkflowRun',
    requestStream: false,
    responseStream: false,
    requestType: requests_pb.SendWorkflowRunRequest,
    responseType: google_protobuf_empty_pb.Empty,
    requestSerialize: serialize_hyrex_performanceserver_SendWorkflowRunRequest,
    requestDeserialize: deserialize_hyrex_performanceserver_SendWorkflowRunRequest,
    responseSerialize: serialize_google_protobuf_Empty,
    responseDeserialize: deserialize_google_protobuf_Empty,
  },
  getWorkflowRunArgs: {
    path: '/hyrex.performanceserver.GatewayService/GetWorkflowRunArgs',
    requestStream: false,
    responseStream: false,
    requestType: requests_pb.GetWorkflowRunArgsRequest,
    responseType: requests_pb.GetWorkflowRunArgsResponse,
    requestSerialize: serialize_hyrex_performanceserver_GetWorkflowRunArgsRequest,
    requestDeserialize: deserialize_hyrex_performanceserver_GetWorkflowRunArgsRequest,
    responseSerialize: serialize_hyrex_performanceserver_GetWorkflowRunArgsResponse,
    responseDeserialize: deserialize_hyrex_performanceserver_GetWorkflowRunArgsResponse,
  },
  advanceWorkflowRun: {
    path: '/hyrex.performanceserver.GatewayService/AdvanceWorkflowRun',
    requestStream: false,
    responseStream: false,
    requestType: requests_pb.AdvanceWorkflowRunRequest,
    responseType: google_protobuf_empty_pb.Empty,
    requestSerialize: serialize_hyrex_performanceserver_AdvanceWorkflowRunRequest,
    requestDeserialize: deserialize_hyrex_performanceserver_AdvanceWorkflowRunRequest,
    responseSerialize: serialize_google_protobuf_Empty,
    responseDeserialize: deserialize_google_protobuf_Empty,
  },
  getWorkflowDurableRuns: {
    path: '/hyrex.performanceserver.GatewayService/GetWorkflowDurableRuns',
    requestStream: false,
    responseStream: false,
    requestType: requests_pb.GetWorkflowDurableRunsRequest,
    responseType: requests_pb.GetWorkflowDurableRunsResponse,
    requestSerialize: serialize_hyrex_performanceserver_GetWorkflowDurableRunsRequest,
    requestDeserialize: deserialize_hyrex_performanceserver_GetWorkflowDurableRunsRequest,
    responseSerialize: serialize_hyrex_performanceserver_GetWorkflowDurableRunsResponse,
    responseDeserialize: deserialize_hyrex_performanceserver_GetWorkflowDurableRunsResponse,
  },
};

exports.GatewayServiceClient = grpc.makeGenericClientConstructor(GatewayServiceService, 'GatewayService');
