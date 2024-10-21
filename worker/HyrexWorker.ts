import { TaskRegistry } from "../TaskRegistry";
import { HyrexDispatcher } from "../dispatchers/HyrexDispatcher";

type HyrexWorkerConfig = {
    name: string
    queue: string
    taskRegistry: TaskRegistry
    dispatcher: HyrexDispatcher
}

export class HyrexWorker {
    private config: HyrexWorkerConfig

    constructor(config: HyrexWorkerConfig) {
        const defaultConfig = {}
        this.config = { ...defaultConfig, ...config }
    }

    runWorker() {
        console.log("TaskRegistry", this.config.taskRegistry)
    }

}
