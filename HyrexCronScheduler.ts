import { HyrexDispatcher } from "./dispatchers/HyrexDispatcher";
import parser from 'cron-parser';
import { ListenerMessage, ListenerResultMessage } from "./types";

export type CronJob = {
    jobid: number
    schedule: string
    command: string
    active: boolean
    jobname: string
}

export type CronJobRun = {
    jobid: number
    command: string
}

export type HyrexCronProcessArgs = {
    dispatcher: HyrexDispatcher,
    workerId: string,
    workerName: string
}

export class HyrexCronProcess {
    private dispatcher: HyrexDispatcher
    private workerId: string
    private workerName: string
    private readonly DEFAULT_HEARTBEAT_INTERVAL = 10000 // 10 seconds in milliseconds

    constructor({ dispatcher, workerId, workerName }: HyrexCronProcessArgs) {
        this.dispatcher = dispatcher
        this.workerId = workerId
        this.workerName = workerName
    }

    private async acquireSchedulerLock(): Promise<number | null> {
        return await this.dispatcher.acquireSchedulerLock({ workerId: this.workerId, workerName: this.workerName })
    }

    private async updateLockHeartbeat(lockId: number): Promise<void> {
        await this.dispatcher.updateLockHeartbeat({ lockId })
    }

    async scheduleJobRun(cronJob: CronJob): Promise<void> {
        const prevRun = parser.parseExpression(cronJob.schedule).prev()
        // ().toDate()
        const cronJobRun: CronJobRun = {
            jobid: cronJob.jobid,
            command: cronJob.command,
        }
        this.dispatcher.scheduleCronJobRun(cronJob)
    }

    async runCronScheduler(): Promise<void> {
        while (true) {
            // Pull cron expressions

            // Queue cron job runs

            // Execute cron job runs
        }
    }
}
