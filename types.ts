export type ListenerMesssageType = "TASK_CANCEL" | "TASK_HEARTBEAT"
import { UUID } from "./utils"

type ExecutorUpdateTaskIdMessage = { messageType: "UPDATE_TASK_ID", taskId: string, name: string }
type ExecutorSetIdMessage = { messageType: "SET_EXECUTOR_ID", executorId: string }
export type ExecutorMessage = ExecutorUpdateTaskIdMessage | ExecutorSetIdMessage

export type ListenerMessage = {
    messageType: ListenerMesssageType
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

export type ListenerResultMessage = TaskHeartbeatResultMessage | CancelResultMessage | ExecutorHeartbeatResultMessage | BatchHeartbeatMessage
