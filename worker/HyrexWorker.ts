import { TaskRegistry } from "../TaskRegistry";
import { HyrexDispatcher, SerializedTask } from "../dispatchers/HyrexDispatcher";
import { UUID } from "../utils";

type HyrexWorkerConfig = {
    name: string
    queue: string
    taskRegistry: TaskRegistry
    dispatcher: HyrexDispatcher
}

export class HyrexWorker {
    private dispatcher: HyrexDispatcher
    private taskRegistry: TaskRegistry
    private name: string
    private queue: string

    constructor(config: HyrexWorkerConfig) {
        const defaultConfig = {}
        const mergedConfig = { ...defaultConfig, ...config }
        const { dispatcher, taskRegistry, name, queue } = mergedConfig
        this.dispatcher = dispatcher
        this.taskRegistry = taskRegistry
        this.name = name
        this.queue = queue
    }

    private async processTask(task: SerializedTask): Promise<void> {
        const { name, context, config } = task
        const func = this.taskRegistry.getFunction(name)
        const result = await func(context)
        return
    }


    async runWorker() {
        console.log("TaskRegistry", this.taskRegistry)

        // Process
        const tasks = await this.dispatcher.dequeue({ numTasks: 1 })
        const task = tasks[0]
        try {
            await this.processTask(task)
            await this.dispatcher.markTaskSuccess(task.id)
            console.log(`Successfully processed ${task.id}`)
        } catch (error) {
            console.error(error)
            await this.dispatcher.markTaskFailed(task.id)
            console.log(`Failed processing on ${task.id}`)
        }

    }
}
