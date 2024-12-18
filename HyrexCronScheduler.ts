import { HyrexDispatcher } from "./dispatchers/HyrexDispatcher";
import { ListenerMessage, ListenerResultMessage } from "./types";

export type hyrexCronProcess = {
    dispatcher: HyrexDispatcher,
    workerId: string,
    workerName: string
}

export class HyrexCronProcess {
    private dispatcher: HyrexDispatcher
    private workerId: string
    private workerName: string
    private readonly DEFAULT_HEARTBEAT_INTERVAL = 10000 // 10 seconds in milliseconds

    constructor({ dispatcher, workerId, workerName }: hyrexCronProcess) {
        this.dispatcher = dispatcher
        this.workerId = workerId
        this.workerName = workerName
    }

    private async acquireSchedulerLock(): Promise<number | null> {
        return await this.dispatcher.acquireSchedulerLock({ workerId: this.workerId, workerName: this.workerName })
    }

    async runCronScheduler(): Promise<void> {
        while (true) {
            // Pull cron expressions

            // Queue cron job runs

            // Execute cron job runs
        }
    }
}
