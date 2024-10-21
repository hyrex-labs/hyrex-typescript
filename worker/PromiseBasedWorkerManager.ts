import { parentPort, workerData } from 'worker_threads';
import { HyrexDispatcher } from "../dispatchers/HyrexDispatcher";
import { TaskRegistry } from "../TaskRegistry";

type HyrexWorkerConfig = {
    name: string
    queue: string
    taskRegistry: TaskRegistry
    dispatcher: HyrexDispatcher
}

export class PromiseBasedWorkerManager {
    private config: HyrexWorkerConfig

    constructor(config: HyrexWorkerConfig) {
        const defaultConfig = {}
        this.config = { ...defaultConfig, ...config }
    }

    runWorker() {

    }

    // processTask(taskData: any) {
    //     // Simulate a task that takes time, e.g., heavy computation
    //     return `Processed task with data: ${taskData}`;
    // }
    //
    // if (parentPort: any) {
    //     const result = this.processTask(workerData);
    //     parentPort.postMessage(result); // Send the result back to the parent thread
    // }
}
