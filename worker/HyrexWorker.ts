import { TaskRegistry } from "../TaskRegistry";
import { HyrexDispatcher, SerializedTask } from "../dispatchers/HyrexDispatcher";
import { sleep, UUID } from "../utils";
import {ExpBackoff} from "./ExpBackoff";

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
    private backoff: ExpBackoff

    constructor(config: HyrexWorkerConfig) {
        const defaultConfig = {}
        const mergedConfig = { ...defaultConfig, ...config }
        const { dispatcher, taskRegistry, name, queue } = mergedConfig
        this.dispatcher = dispatcher
        this.taskRegistry = taskRegistry
        this.name = name
        this.queue = queue

        this.backoff = new ExpBackoff()
    }

    private async processTask(task: SerializedTask): Promise<void> {
        const { name, context, config } = task
        const func = this.taskRegistry.getFunction(name)
        const result = await func(context)
        return
    }


    async runWorker() {
        console.log("TaskRegistry", this.taskRegistry)
        let shouldStop = false

        const handleShutdown = (signal: string) => {
            console.log(`\nReceived ${signal}. Stopping worker...`);
            shouldStop = true; // Set flag to stop the loop
        };

        process.on('SIGINT', handleShutdown);
        process.on('SIGTERM', handleShutdown);

        while (!shouldStop) {

            // Process
            const tasks = await this.dispatcher.dequeue({ numTasks: 1 })
            if (tasks.length === 0) {
                console.log("No tasks found... going to sleep", new Date())
                await this.backoff.wait()
                continue
            } else {
                this.backoff.clear()
            }
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

        console.log(`Worker ${this.name} stopped.`)
    }
}
