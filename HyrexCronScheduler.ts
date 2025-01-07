import { HyrexDispatcher } from "./dispatchers/HyrexDispatcher";
import parser from 'cron-parser';
import { sleep } from "./utils";
import { ListenerMessage, ListenerResultMessage } from "./types";

export type CronJob = {
    jobid: number;
    schedule: string;
    command: string;
    active: boolean;
    jobname: string;
    activated_at: Date;
    scheduled_jobs_confirmed_until: Date;
}

export type CronJobRun = {
    jobid: number,
    command: string,
    schedule_time: Date
}

export type HyrexCronProcessArgs = {
    dispatcher: HyrexDispatcher,
    workerId: string,
    workerName: string
}

export class HyrexCronScheduler {
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
        console.log("Acquiring lock!")
        const result = await this.dispatcher.acquireSchedulerLock({ workerId: this.workerId, workerName: this.workerName })
        console.log("lock result", result)
        return result
    }

    private async updateLockHeartbeat(lockId: number): Promise<void> {
        await this.dispatcher.updateLockHeartbeat({ lockId })
    }

    private calculateNextRun(schedule: string, fromTime: Date = new Date()): Date {
        try {
            const interval = parser.parseExpression(schedule, {
                currentDate: fromTime
            });
            return interval.next().toDate();
        } catch (error) {
            console.error(`Error parsing schedule: ${schedule}`, error);
            throw error;
        }
    }

    private async getScheduledCronJobRunsList(cronJob: CronJob): Promise<CronJobRun[]> {
        const interval = parser.parseExpression(cronJob.schedule, {
            currentDate: cronJob.scheduled_jobs_confirmed_until,
            iterator: true
        })

        const cronJobRuns: CronJobRun[] = []
        const now = new Date()
        let nextIntervalDate = new Date(interval.next().value.toString())

        while (nextIntervalDate <= now) {

            cronJobRuns.push({
                jobid: cronJob.jobid,
                command: cronJob.command,
                schedule_time: nextIntervalDate,
            })

            nextIntervalDate = new Date(interval.next().value.toString())
        }

        return cronJobRuns
    }



    // TODO: Require LockId when scheduling jobs and have the database determine that the lockid is still valid
    // Before doing any writes with the lockid
    async runCronScheduler(): Promise<void> {
        console.log("Running cron scheduler!")
        let lockId: number | null = null

        try {
            // Keep trying to acquire lock until successful
            while (!lockId) {
                lockId = await this.acquireSchedulerLock()
                if (!lockId) {
                    console.log("Could not acquire lock. Going to sleep...")
                    await sleep(15 * 1000) // Sleep 15 secs
                }
            }

            console.log("Acquired lock!")

            const LOOP_RATE_SEC = 30

            // Main scheduler loop - now with the lock held
            while (true) {
                const loopStartTime = new Date()
                try {
                    // Pull cron expressions
                    const cronExpressions = await this.dispatcher.pullCronJobExpressions()

                    // Queue cron job runs
                    for (const cronJob of cronExpressions) {
                        console.log("Got cron job", cronJob)
                        const scheduledJobs = await this.getScheduledCronJobRunsList(cronJob)
                        await this.dispatcher.scheduleCronJobRuns(scheduledJobs)
                    }

                    // Execute cron job runs
                    // ...

                } catch (error) {
                    console.error("Error in scheduler loop:", error)
                    // Maybe add some error backoff/handling here
                    break // Or handle differently depending on error type
                }

                // Sleep
                const elapsedMs = Date.now() - loopStartTime.getTime()
                const remainingMs = Math.max(LOOP_RATE_SEC * 1000 - elapsedMs, 0)
                console.log("remainingMs", remainingMs)
                await sleep(remainingMs) // Sleep a little
            }

        } finally {
            // Only release lock if we acquired it
            if (lockId) {
                console.log("Releasing scheduler lock...")
                await this.dispatcher.releaseSchedulerLock({
                    workerName: this.workerName
                })
            }
        }
    }
}
