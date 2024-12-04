import { HyrexRegistry } from "../HyrexRegistry";
import { HyrexDispatcher, SerializedTask } from "../dispatchers/HyrexDispatcher";
import { HyrexTaskFunction, JsonType, sleep, UUID } from "../utils";
import { ExpBackoff } from "./ExpBackoff";
import { randomUUID } from "node:crypto";
import { ExecutorMessage } from "../types";


type HyrexWorkerConfig = {
    name: string
    queue: string
    taskRegistry: HyrexRegistry
    dispatcher: HyrexDispatcher
}

export class HyrexExecutor {
    private dispatcher: HyrexDispatcher
    private taskRegistry: HyrexRegistry
    private name: string
    private queue: string
    private backoff: ExpBackoff
    private executorId: UUID

    constructor(config: HyrexWorkerConfig) {
        const defaultConfig = {}
        const mergedConfig = { ...defaultConfig, ...config }
        const { dispatcher, taskRegistry, name, queue } = mergedConfig
        this.dispatcher = dispatcher
        this.taskRegistry = taskRegistry
        this.name = name
        this.queue = queue

        this.executorId = randomUUID()
        this.backoff = new ExpBackoff()

        this.setExecutorId(this.executorId)
    }

    private async processTask(task: SerializedTask): Promise<JsonType | undefined> {
        const { task_name, args } = task
        const func: HyrexTaskFunction = this.taskRegistry.getFunction(task_name)
        if (args) {
            const withArgsFunc = func as ((arg: JsonType) => JsonType | undefined)
            return await withArgsFunc(args)
        } else {
            const noArgsFunc = func as (() => JsonType | undefined)
            return await noArgsFunc()
        }
    }

    private updateTaskId(taskId: string | null) {
        if (process.send) {
            process.send({ messageType: "UPDATE_TASK_ID", taskId, name: this.name } as ExecutorMessage);
        } else {
            console.error('process.send is undefined. IPC channel might not be set up.');
        }
    }

    private setExecutorId(executorId: string) {
        if (process.send) {
            process.send({ messageType: "SET_EXECUTOR_ID", executorId } as ExecutorMessage);
        } else {
            console.error('process.send is undefined. IPC channel might not be set up.');
        }
    }


    async runExecutor({ queue }: { queue: string } = { queue: "*" }) {
        // console.log("TaskRegistry", this.taskRegistry)
        let shouldStop = false

        const handleShutdown = (signal: string) => {
            console.log(`\nReceived ${signal}. Stopping worker...`);
            shouldStop = true; // Set flag to stop the loop
        };

        process.on('SIGINT', handleShutdown);
        process.on('SIGTERM', handleShutdown);

        await this.dispatcher.registerExecutor({ queue, executorId: this.executorId, executorName: this.name });

        while (!shouldStop) {
            // Process
            const tasks = await this.dispatcher.dequeue({ numTasks: 1, executorId: this.executorId, queue })
            if (tasks.length === 0) {
                console.log("No tasks found... going to sleep", new Date())
                await this.backoff.wait()
                continue
            } else {
                this.backoff.clear()
            }
            const task = tasks[0]

            try {
                console.log(`Starting to process task ${task.id}`)
                this.updateTaskId(task.id)
                const result = await this.processTask(task)
                if (result) {
                    await this.dispatcher.saveResult(task.id, result)
                }
                await this.dispatcher.markTaskSuccess(task.id)
                console.log(`Successfully processed ${task.id}`)
                this.updateTaskId(null)
            } catch (error) {
                console.error(error)
                await this.dispatcher.markTaskFailed(task.id)
                console.log(`Failed processing on ${task.id}`)
                this.updateTaskId(null)
            }

        }

        await this.dispatcher.disconnectExecutor({ executorId: this.executorId })
        console.log(`Worker ${this.name} stopped.`)
    }
}
