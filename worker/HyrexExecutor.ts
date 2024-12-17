import { HyrexRegistry } from "../HyrexRegistry";
import { HyrexDispatcher, SerializedTask } from "../dispatchers/HyrexDispatcher";
import { HyrexTaskFunction, JsonType, QueueType, shuffle, sleep, UUID } from "../utils";
import { ExpBackoff } from "./ExpBackoff";
import { randomUUID } from "node:crypto";
import { ExecutorMessage } from "../types";
import { HyrexQueue, HyrexQueuePattern } from "../HyrexQueue";
import { clearHyrexContext, setHyrexContext } from "../HyrexContext";
import { performance } from "perf_hooks";
import { COMMANDS } from "../commands";

class Averager {
    private count: number
    private runningSum: number

    constructor() {
        this.count = 0
        this.runningSum = 0
    }

    avg() {
        return this.runningSum / this.count
    }

    submit(x: number) {
        this.count++
        this.runningSum += x
    }

}

type HyrexExecutorConfig = {
    workerName: string
    name: string
    queuePattern: HyrexQueuePattern
    taskRegistry: HyrexRegistry
    dispatcher: HyrexDispatcher
}

export class HyrexExecutor {
    private dispatcher: HyrexDispatcher
    private taskRegistry: HyrexRegistry
    private name: string
    private workerName: string

    // Queue stuff
    private queuePattern: HyrexQueuePattern
    private queues: HyrexQueue[]
    private queueListIndex: number
    private queueLastRefreshCounter: number
    private emptyQueueCounter: number

    private backoff: ExpBackoff
    private executorId: UUID

    // Perf metrics
    private refreshQueueDurationAvgr: Averager
    private numDistinctQueuesAvgr: Averager

    constructor(config: HyrexExecutorConfig) {
        const defaultConfig = {}
        const mergedConfig = { ...defaultConfig, ...config }
        const { dispatcher, taskRegistry, name, queuePattern, workerName } = mergedConfig
        this.dispatcher = dispatcher
        this.taskRegistry = taskRegistry
        this.name = name
        this.workerName = workerName

        // Queue stuff
        this.queuePattern = queuePattern
        this.queues = []
        this.queueListIndex = 0
        this.queueLastRefreshCounter = 0
        this.emptyQueueCounter = 0

        this.executorId = randomUUID()
        this.backoff = new ExpBackoff()

        this.setExecutorId(this.executorId)

        // Perf metrics
        this.refreshQueueDurationAvgr = new Averager()
        this.numDistinctQueuesAvgr = new Averager()
    }

    private async processTask(task: SerializedTask): Promise<JsonType | undefined> {
        const { task_name, args } = task
        const func: HyrexTaskFunction = this.taskRegistry.getFunction(task_name)

        try {
            setHyrexContext({
                taskId: task.id,
                durableId: task.durable_id,
                rootId: task.root_id,
                parentId: task.parent_id,
                taskName: task.task_name,
                queue: task.queue,
                priority: task.priority,
                scheduledStart: task.scheduled_start,
                queued: task.queued,
                started: task.started,
                executorId: this.executorId,
            });

            process.env[COMMANDS.PARENT_ID] = task.id
            process.env[COMMANDS.ROOT_ID] = task.root_id

            if (args) {
                const withArgsFunc = func as ((arg: JsonType) => JsonType | undefined)
                return await withArgsFunc(args)
            } else {
                const noArgsFunc = func as (() => JsonType | undefined)
                return await noArgsFunc()
            }
        } finally {
            clearHyrexContext()
            delete process.env[COMMANDS.PARENT_ID]
            delete process.env[COMMANDS.ROOT_ID]
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

    private async refreshConcreteQueues(): Promise<void> {
        this.queueListIndex = 0;

        console.log(`Refreshing concrete queue names with pattern ${JSON.stringify(this.queuePattern)}`)
        const queueNamesSet = new Set<string>();

        const start = performance.now()
        const queueNames = await this.dispatcher.fetchActiveQueueNames({ queuePattern: this.queuePattern.pattern })
        const end = performance.now()
        this.refreshQueueDurationAvgr.submit(end - start)
        this.numDistinctQueuesAvgr.submit(queueNames.length)

        // console.log("Pattern results are...", queueNames)

        for (const queueName of queueNames) {

            // Handle potentially conflicting concurrency limits
            const exitingQueueSettings = this.taskRegistry.internalQueueRegistry[queueName]
            if (exitingQueueSettings && this.queuePattern.concurrencyLimit) {
                console.log(`Found potentially conflicting queue settings on name ${queueName}`)
                const newConcurrencyLimit = exitingQueueSettings.concurrencyLimit ? Math.min(exitingQueueSettings.concurrencyLimit, this.queuePattern.concurrencyLimit) : this.queuePattern.concurrencyLimit
                this.taskRegistry.internalQueueRegistry[queueName] = new HyrexQueue({
                    name: queueName,
                    concurrencyLimit: newConcurrencyLimit
                })
            }


            queueNamesSet.add(queueName)
        }

        console.log("Got queue names set...", queueNamesSet.size)

        const concreteQueues = [...queueNamesSet].map((queueName) => {
            return this.taskRegistry.internalQueueRegistry[queueName] ? this.taskRegistry.internalQueueRegistry[queueName] : new HyrexQueue({ name: queueName })
        })

        this.queues = shuffle(concreteQueues);

        this.dispatcher.updateQueuesOnExecutor({ executorId: this.executorId, queues: this.queues })

        console.log("Fetched queues", JSON.stringify(this.queues))
    }

    private async getNextQueueRoundRobin(): Promise<HyrexQueue | null> {
        if (this.queueListIndex === this.queues.length) {
            this.queueListIndex = 0;

            if (this.queueLastRefreshCounter >= 100 || this.queues.length === 0) {
                await this.refreshConcreteQueues();
                this.queueLastRefreshCounter = 0
                if (this.queues.length === 0) {
                    return null
                }

                return this.getNextQueueRoundRobin();
            }
        }

        const queue = this.queues[this.queueListIndex++];
        console.log("queueIndex", this.queueListIndex, "queueLength", this.queues.length)
        return queue;
    }


    async runExecutor() {
        let shouldStop = false

        const handleShutdown = (signal: string) => {
            console.log(`\nReceived ${signal}. Stopping worker...`);
            shouldStop = true; // Set flag to stop the loop
        };

        process.on('SIGINT', handleShutdown);
        process.on('SIGTERM', handleShutdown);

        // TODO: Figure out how to register executor
        await this.dispatcher.registerExecutor({
            executorId: this.executorId,
            workerName: this.workerName,
            queuePattern: this.queuePattern,
            queues: this.queues,
            executorName: this.name
        });

        await this.refreshConcreteQueues()

        const dequeueDurationAvgr = new Averager()

        while (!shouldStop) {
            //
            // THIS IS THE FETCH LOOP
            //

            const nextQueue = await this.getNextQueueRoundRobin()
            if (!nextQueue) {
                console.log("No queues found... going to sleep", new Date())
                await this.backoff.wait()
                continue
            }

            // Perf monitoring
            const start = performance.now()
            //

            const tasks = await this.dispatcher.dequeue({
                numTasks: 1,
                executorId: this.executorId,
                queueName: nextQueue.name,
                concurrencyLimit: nextQueue.concurrencyLimit
            })

            // Perf monitoring
            const end = performance.now()
            dequeueDurationAvgr.submit(end - start)
            //

            if (tasks.length === 0) {
                console.log(`No tasks found on queue "${nextQueue.name}". EmptyQueueCounter: ${this.emptyQueueCounter++}`, new Date())
                if (this.emptyQueueCounter >= 5) {
                    console.log("<===============================>")
                    console.log("QUEUEING REFRESH BECAUSE OF EMPTY QUEUE COUNTRY")
                    console.log("<===============================>")
                    this.emptyQueueCounter = 0
                    await this.refreshConcreteQueues()
                }
                await this.backoff.wait()
                continue
            } else {
                this.emptyQueueCounter = 0
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

        const stats = {
            "avgDequeueDurationMS": dequeueDurationAvgr.avg(),
            "avgRefreshQueueDurationMS": this.refreshQueueDurationAvgr.avg(),
            "numDistinctQueues": this.numDistinctQueuesAvgr.avg()
        }

        await this.dispatcher.disconnectExecutor({ executorId: this.executorId, stats })
        console.log(`Executor ${this.name} stopped.`)
    }
}
