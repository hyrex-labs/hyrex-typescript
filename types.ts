export type AdminMessageType = "TASK_CANCEL" | "TASK_HEARTBEAT"
import { UUID } from "./utils"

export type HyrexAppInfo = {
    name: string;
}

type ExecutorUpdateTaskIdMessage = { messageType: "UPDATE_TASK_ID", taskId: string, name: string }
type ExecutorSetIdMessage = { messageType: "SET_EXECUTOR_ID", executorId: string }
type ExecutorEmitStatsMessage = { messageType: "EMIT_STATS", executorStats: string }
export type ExecutorMessage = ExecutorUpdateTaskIdMessage | ExecutorSetIdMessage

export type AdminMessage = {
    messageType: AdminMessageType
    taskId: UUID
}


export type TaskHeartbeatResultMessage = {
    messageType: "TASK_HEARTBEAT",
    body: {
        taskId: UUID,
        status: "RUNNING" | "LOST",
        timestamp: string
    }
}

export type ExecutorHeartbeatResultMessage = {
    messageType: "EXECUTOR_HEARTBEAT",
    body: {
        executorIds: UUID[],
    }
}

export type CancelResultMessage = {
    messageType: "TASK_CANCEL",
    body: {
        taskId: UUID,
        status: "CANCELED" | "LOST"
    }
}

export type BatchHeartbeatMessage = {
    messageType: "BATCH_HEARTBEAT",
    body: {
        taskHeartbeatMessages: TaskHeartbeatResultMessage[]
        executorHeartbeatMessages: ExecutorHeartbeatResultMessage[]
    }
}

export type AdminResultMessage = TaskHeartbeatResultMessage | CancelResultMessage | ExecutorHeartbeatResultMessage | BatchHeartbeatMessage
