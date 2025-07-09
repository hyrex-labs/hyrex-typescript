import { HyrexDispatcher } from "./dispatchers/HyrexDispatcher";
import { AdminMessage, RootMessage } from "./types";
import { hyrexLogger } from "./logging/FrameworkLogger";

export type hyrexWorkerAdminConfig = {
    dispatcher: HyrexDispatcher,
    mode: "postgres" | "platform"
}

export class HyrexAdmin {
    private dispatcher: HyrexDispatcher
    private heartbeatInterval: NodeJS.Timeout | null = null
    private readonly DEFAULT_HEARTBEAT_INTERVAL = 10000 // 10 seconds in milliseconds
    private mode: "postgres" | "platform"

    constructor({ dispatcher, mode }: hyrexWorkerAdminConfig) {
        this.dispatcher = dispatcher
        this.mode = mode
        this.setupIPCListener()
    }

    private setupIPCListener() {
        process.on('message', this.handleMessage.bind(this));
    }

    private async handleMessage(message: RootMessage) {
        hyrexLogger.info("process-management", `Admin Received Message: ${JSON.stringify(message)}`, 'cyan')
        if (message.messageType === "TASK_HEARTBEAT") {
            this.dispatcher.updateTaskHeartbeat(message)
        } else if (message.messageType === "TASK_CANCEL") {
            this.dispatcher.markTaskCanceled(message.body.taskId)
        } else if (message.messageType === "EXECUTOR_HEARTBEAT") {
            this.dispatcher.updateExecutorHeartbeat(message)
        } else if (message.messageType === "BATCH_HEARTBEAT") {
            await this.dispatcher.updateExecutorHeartbeats({ executorIds: message.body.executorIds })
        }

    }

    async runAdmin() {
        const emitIPCMessage = async (msg: AdminMessage) => {
            console.log("Emitting ipc message from worker listener...", msg)
            if (process.send) {
                process.send(msg);
            } else {
                console.error('process.send is undefined. IPC channel might not be set up.');
            }
        }

        // Set up cleanup handlers
        const cleanup = () => {
            if (this.dispatcher && typeof (this.dispatcher as any).close === 'function') {
                (this.dispatcher as any).close();
            }
            process.exit(0);
        };

        process.on('SIGINT', cleanup);
        process.on('SIGTERM', cleanup);

        // await this.dispatcher.listen({
        //     taskCancelCallback: emitIPCMessage,
        //     taskHeartbeatCallback: emitIPCMessage
        // })
    }
}
