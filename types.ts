export type ListenerMesssageType = "TASK_CANCEL" | "TASK_HEARTBEAT"
import { UUID } from "./utils"

export type ListenerMessage = {
    messageType: ListenerMesssageType
    taskId: UUID
}

export type HeartbeatResultMessageBody = {
    taskId: UUID,
    status: "RUNNING" | "LOST",
    timestamp: string
}

export type ListenerResultMessage = {
    messageType: ListenerMesssageType,
    body: HeartbeatResultMessageBody
}
