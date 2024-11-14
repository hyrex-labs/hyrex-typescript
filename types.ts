export type ListenerMesssageType = "TASK_CANCEL" | "TASK_HEARTBEAT"
import { UUID } from "./utils"

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
        executorId: UUID,
    }
}

export type CancelResultMessage = {
    messageType: "TASK_CANCEL",
    body: {
        taskId: UUID,
        status: "CANCELED" | "LOST"
    }
}

export type ListenerResultMessage = TaskHeartbeatResultMessage | CancelResultMessage | ExecutorHeartbeatResultMessage
