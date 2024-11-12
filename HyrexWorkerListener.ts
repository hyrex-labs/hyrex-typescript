import { HyrexDispatcher } from "./dispatchers/HyrexDispatcher";
import { ListenerMessage, ListenerResultMessage } from "./types";

export type hyrexWorkerListenerConfig = {
    dispatcher: HyrexDispatcher,
}

export class HyrexWorkerListener {
    private dispatcher: HyrexDispatcher

    constructor({ dispatcher }: hyrexWorkerListenerConfig) {
        this.dispatcher = dispatcher
        this.setupIPCListener()
    }

    private setupIPCListener() {
        process.on('message', this.handleMessage.bind(this));
    }

    private handleMessage(message: ListenerResultMessage) {
        if (message.messageType === "TASK_HEARTBEAT") {
            this.dispatcher.updateHeartbeat(message)
        } else if (message.messageType === "TASK_CANCEL") {
            this.dispatcher.markTaskCanceled(message.body.taskId)
        }
    }

    async runListener() {
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
