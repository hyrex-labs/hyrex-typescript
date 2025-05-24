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

function serialize_hyrex_performanceserver_AcquireSchedulerLockRequest(arg) {
  if (!(arg instanceof requests_pb.AcquireSchedulerLockRequest)) {
    throw new Error('Expected argument of type hyrex.performanceserver.AcquireSchedulerLockRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_hyrex_performanceserver_AcquireSchedulerLockRequest(buffer_arg) {
  return requests_pb.AcquireSchedulerLockRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_hyrex_performanceserver_AcquireSchedulerLockResponse(arg) {
  if (!(arg instanceof requests_pb.AcquireSchedulerLockResponse)) {
    throw new Error('Expected argument of type hyrex.performanceserver.AcquireSchedulerLockResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_hyrex_performanceserver_AcquireSchedulerLockResponse(buffer_arg) {
  return requests_pb.AcquireSchedulerLockResponse.deserializeBinary(new Uint8Array(buffer_arg));
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

function serialize_hyrex_performanceserver_EnqueueRequest(arg) {
  if (!(arg instanceof requests_pb.EnqueueRequest)) {
    throw new Error('Expected argument of type hyrex.performanceserver.EnqueueRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_hyrex_performanceserver_EnqueueRequest(buffer_arg) {
  return requests_pb.EnqueueRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_hyrex_performanceserver_EnqueueResponse(arg) {
  if (!(arg instanceof requests_pb.EnqueueResponse)) {
    throw new Error('Expected argument of type hyrex.performanceserver.EnqueueResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_hyrex_performanceserver_EnqueueResponse(buffer_arg) {
  return requests_pb.EnqueueResponse.deserializeBinary(new Uint8Array(buffer_arg));
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

function serialize_hyrex_performanceserver_MarkFailedRequest(arg) {
  if (!(arg instanceof requests_pb.MarkFailedRequest)) {
    throw new Error('Expected argument of type hyrex.performanceserver.MarkFailedRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_hyrex_performanceserver_MarkFailedRequest(buffer_arg) {
  return requests_pb.MarkFailedRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_hyrex_performanceserver_MarkFailedResponse(arg) {
  if (!(arg instanceof requests_pb.MarkFailedResponse)) {
    throw new Error('Expected argument of type hyrex.performanceserver.MarkFailedResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_hyrex_performanceserver_MarkFailedResponse(buffer_arg) {
  return requests_pb.MarkFailedResponse.deserializeBinary(new Uint8Array(buffer_arg));
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

function serialize_hyrex_performanceserver_MarkSuccessResponse(arg) {
  if (!(arg instanceof requests_pb.MarkSuccessResponse)) {
    throw new Error('Expected argument of type hyrex.performanceserver.MarkSuccessResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_hyrex_performanceserver_MarkSuccessResponse(buffer_arg) {
  return requests_pb.MarkSuccessResponse.deserializeBinary(new Uint8Array(buffer_arg));
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

function serialize_hyrex_performanceserver_RegisterAppResponse(arg) {
  if (!(arg instanceof requests_pb.RegisterAppResponse)) {
    throw new Error('Expected argument of type hyrex.performanceserver.RegisterAppResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_hyrex_performanceserver_RegisterAppResponse(buffer_arg) {
  return requests_pb.RegisterAppResponse.deserializeBinary(new Uint8Array(buffer_arg));
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

function serialize_hyrex_performanceserver_RegisterExecutorResponse(arg) {
  if (!(arg instanceof requests_pb.RegisterExecutorResponse)) {
    throw new Error('Expected argument of type hyrex.performanceserver.RegisterExecutorResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_hyrex_performanceserver_RegisterExecutorResponse(buffer_arg) {
  return requests_pb.RegisterExecutorResponse.deserializeBinary(new Uint8Array(buffer_arg));
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

function serialize_hyrex_performanceserver_RegisterTaskDefResponse(arg) {
  if (!(arg instanceof requests_pb.RegisterTaskDefResponse)) {
    throw new Error('Expected argument of type hyrex.performanceserver.RegisterTaskDefResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_hyrex_performanceserver_RegisterTaskDefResponse(buffer_arg) {
  return requests_pb.RegisterTaskDefResponse.deserializeBinary(new Uint8Array(buffer_arg));
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

function serialize_hyrex_performanceserver_SetLogLinkResponse(arg) {
  if (!(arg instanceof requests_pb.SetLogLinkResponse)) {
    throw new Error('Expected argument of type hyrex.performanceserver.SetLogLinkResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_hyrex_performanceserver_SetLogLinkResponse(buffer_arg) {
  return requests_pb.SetLogLinkResponse.deserializeBinary(new Uint8Array(buffer_arg));
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

function serialize_hyrex_performanceserver_UpdateExecutorQueuesResponse(arg) {
  if (!(arg instanceof requests_pb.UpdateExecutorQueuesResponse)) {
    throw new Error('Expected argument of type hyrex.performanceserver.UpdateExecutorQueuesResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_hyrex_performanceserver_UpdateExecutorQueuesResponse(buffer_arg) {
  return requests_pb.UpdateExecutorQueuesResponse.deserializeBinary(new Uint8Array(buffer_arg));
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
  // ---- Valkey requests ----
enqueue: {
    path: '/hyrex.performanceserver.GatewayService/Enqueue',
    requestStream: false,
    responseStream: false,
    requestType: requests_pb.EnqueueRequest,
    responseType: requests_pb.EnqueueResponse,
    requestSerialize: serialize_hyrex_performanceserver_EnqueueRequest,
    requestDeserialize: deserialize_hyrex_performanceserver_EnqueueRequest,
    responseSerialize: serialize_hyrex_performanceserver_EnqueueResponse,
    responseDeserialize: deserialize_hyrex_performanceserver_EnqueueResponse,
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
    responseType: requests_pb.MarkSuccessResponse,
    requestSerialize: serialize_hyrex_performanceserver_MarkSuccessRequest,
    requestDeserialize: deserialize_hyrex_performanceserver_MarkSuccessRequest,
    responseSerialize: serialize_hyrex_performanceserver_MarkSuccessResponse,
    responseDeserialize: deserialize_hyrex_performanceserver_MarkSuccessResponse,
  },
  markFailed: {
    path: '/hyrex.performanceserver.GatewayService/MarkFailed',
    requestStream: false,
    responseStream: false,
    requestType: requests_pb.MarkFailedRequest,
    responseType: requests_pb.MarkFailedResponse,
    requestSerialize: serialize_hyrex_performanceserver_MarkFailedRequest,
    requestDeserialize: deserialize_hyrex_performanceserver_MarkFailedRequest,
    responseSerialize: serialize_hyrex_performanceserver_MarkFailedResponse,
    responseDeserialize: deserialize_hyrex_performanceserver_MarkFailedResponse,
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
  // ---- Postgres requests ----
registerTaskDef: {
    path: '/hyrex.performanceserver.GatewayService/RegisterTaskDef',
    requestStream: false,
    responseStream: false,
    requestType: requests_pb.RegisterTaskDefRequest,
    responseType: requests_pb.RegisterTaskDefResponse,
    requestSerialize: serialize_hyrex_performanceserver_RegisterTaskDefRequest,
    requestDeserialize: deserialize_hyrex_performanceserver_RegisterTaskDefRequest,
    responseSerialize: serialize_hyrex_performanceserver_RegisterTaskDefResponse,
    responseDeserialize: deserialize_hyrex_performanceserver_RegisterTaskDefResponse,
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
    responseType: requests_pb.RegisterExecutorResponse,
    requestSerialize: serialize_hyrex_performanceserver_RegisterExecutorRequest,
    requestDeserialize: deserialize_hyrex_performanceserver_RegisterExecutorRequest,
    responseSerialize: serialize_hyrex_performanceserver_RegisterExecutorResponse,
    responseDeserialize: deserialize_hyrex_performanceserver_RegisterExecutorResponse,
  },
  updateExecutorQueues: {
    path: '/hyrex.performanceserver.GatewayService/UpdateExecutorQueues',
    requestStream: false,
    responseStream: false,
    requestType: requests_pb.UpdateExecutorQueuesRequest,
    responseType: requests_pb.UpdateExecutorQueuesResponse,
    requestSerialize: serialize_hyrex_performanceserver_UpdateExecutorQueuesRequest,
    requestDeserialize: deserialize_hyrex_performanceserver_UpdateExecutorQueuesRequest,
    responseSerialize: serialize_hyrex_performanceserver_UpdateExecutorQueuesResponse,
    responseDeserialize: deserialize_hyrex_performanceserver_UpdateExecutorQueuesResponse,
  },
  registerApp: {
    path: '/hyrex.performanceserver.GatewayService/RegisterApp',
    requestStream: false,
    responseStream: false,
    requestType: requests_pb.RegisterAppRequest,
    responseType: requests_pb.RegisterAppResponse,
    requestSerialize: serialize_hyrex_performanceserver_RegisterAppRequest,
    requestDeserialize: deserialize_hyrex_performanceserver_RegisterAppRequest,
    responseSerialize: serialize_hyrex_performanceserver_RegisterAppResponse,
    responseDeserialize: deserialize_hyrex_performanceserver_RegisterAppResponse,
  },
  setLogLink: {
    path: '/hyrex.performanceserver.GatewayService/SetLogLink',
    requestStream: false,
    responseStream: false,
    requestType: requests_pb.SetLogLinkRequest,
    responseType: requests_pb.SetLogLinkResponse,
    requestSerialize: serialize_hyrex_performanceserver_SetLogLinkRequest,
    requestDeserialize: deserialize_hyrex_performanceserver_SetLogLinkRequest,
    responseSerialize: serialize_hyrex_performanceserver_SetLogLinkResponse,
    responseDeserialize: deserialize_hyrex_performanceserver_SetLogLinkResponse,
  },
  acquireSchedulerLock: {
    path: '/hyrex.performanceserver.GatewayService/AcquireSchedulerLock',
    requestStream: false,
    responseStream: false,
    requestType: requests_pb.AcquireSchedulerLockRequest,
    responseType: requests_pb.AcquireSchedulerLockResponse,
    requestSerialize: serialize_hyrex_performanceserver_AcquireSchedulerLockRequest,
    requestDeserialize: deserialize_hyrex_performanceserver_AcquireSchedulerLockRequest,
    responseSerialize: serialize_hyrex_performanceserver_AcquireSchedulerLockResponse,
    responseDeserialize: deserialize_hyrex_performanceserver_AcquireSchedulerLockResponse,
  },
};

exports.GatewayServiceClient = grpc.makeGenericClientConstructor(GatewayServiceService, 'GatewayService');
