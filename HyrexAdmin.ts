import { HyrexDispatcher } from "./dispatchers/HyrexDispatcher";
import { ListenerMessage, ListenerResultMessage } from "./types";

export type hyrexWorkerListenerConfig = {
    dispatcher: HyrexDispatcher,
}

export class HyrexAdmin {
    private dispatcher: HyrexDispatcher
    private heartbeatInterval: NodeJS.Timeout | null = null
    private readonly DEFAULT_HEARTBEAT_INTERVAL = 10000 // 10 seconds in milliseconds

    constructor({ dispatcher }: hyrexWorkerListenerConfig) {
        this.dispatcher = dispatcher
        this.setupIPCListener()
    }

    private setupIPCListener() {
        process.on('message', this.handleMessage.bind(this));
    }

    private async handleMessage(message: ListenerResultMessage) {
        if (message.messageType === "TASK_HEARTBEAT") {
            this.dispatcher.updateTaskHeartbeat(message)
        } else if (message.messageType === "TASK_CANCEL") {
            this.dispatcher.markTaskCanceled(message.body.taskId)
        } else if (message.messageType === "EXECUTOR_HEARTBEAT") {
            this.dispatcher.updateExecutorHeartbeat(message)
        } else if (message.messageType === "BATCH_HEARTBEAT") {
            // for (const taskId in message.body.taskIds) {
            //     this.dispatcher.updateExecutorHeartbeat()
            // }
        }

    }

    async runAdmin() {
        const emitIPCMessage = async (msg: ListenerMessage) => {
            console.log("Emitting ipc message from worker listener...", msg)
            if (process.send) {
                process.send(msg);
            } else {
                console.error('process.send is undefined. IPC channel might not be set up.');
            }
        }

        await this.dispatcher.listen({
            taskCancelCallback: emitIPCMessage,
            taskHeartbeatCallback: emitIPCMessage
        })
    }
}
