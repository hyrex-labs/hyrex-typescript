export type ListenerMesssageType = "TASK_CANCEL" | "TASK_HEARTBEAT"
import { UUID } from "./utils"

export type ListenerMessage = {
    messageType: ListenerMesssageType
    taskId: UUID
}


export type HeartbeatResultMessage = {
    messageType: "TASK_HEARTBEAT",
    body: {
        taskId: UUID,
        status: "RUNNING" | "LOST",
        timestamp: string
    }
}

export type CancelResultMessage = {
    messageType: "TASK_CANCEL",
    body: {
        taskId: UUID,
        status: "CANCELED" | "LOST"
    }
}

export type ListenerResultMessage = HeartbeatResultMessage | CancelResultMessage
