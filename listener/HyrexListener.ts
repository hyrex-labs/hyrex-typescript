// import { HyrexDispatcher } from "../dispatchers/HyrexDispatcher";
// import { hyrexLogger } from "../logging/FrameworkLogger";
// import { HyrexCronProcessArgs } from "../cron/HyrexCronScheduler";
//
// export class HyrexListener {
//     private dispatcher: HyrexDispatcher
//     private workerId: string
//     private workerName: string
//
//     constructor({ dispatcher, workerId, workerName }: HyrexCronProcessArgs) {
//         this.dispatcher = dispatcher
//         this.workerId = workerId
//         this.workerName = workerName
//     }
//
//
//     private async runListener(): Promise<number | null> {
//         hyrexLogger.info("listener", "Starting listener...", "dim")
//
//         const lock = await this.dispatcher.acquireListenerLock({ workerName: this.workerName})
//         return 1
//         // hyrexLogger.info("cron-scheduling", `lockId=${result}`, "dim")
//         // return result
//     }
//
// }
