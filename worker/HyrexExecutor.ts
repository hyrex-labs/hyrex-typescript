import { HyrexRegistry } from "../HyrexRegistry";
import { HyrexDispatcher, SerializedTask } from "../dispatchers/HyrexDispatcher";
import { HyrexTaskFunction, JsonType, QueueType, shuffle, sleep, timeoutWrapper, UUID } from "../utils";
import { ExpBackoff } from "./ExpBackoff";
import { randomUUID } from "node:crypto";
import { ExecutorMessage } from "../types";
import { HyrexQueue, HyrexQueuePattern } from "../HyrexQueue";
import { clearHyrexContext, setHyrexContext } from "../HyrexContext";
import { performance } from "perf_hooks";
import { S3Logger } from "../S3Logger";
import { COMMANDS } from "../commands";
import { hyrexLogger } from "../logging/FrameworkLogger";
import { TimeSeriesAverager } from "./TimeSeriesAverager";

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
    private refreshQueueDurationAvgr: TimeSeriesAverager
    private numDistinctQueuesAvgr: TimeSeriesAverager

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
        this.refreshQueueDurationAvgr = new TimeSeriesAverager()
        this.numDistinctQueuesAvgr = new TimeSeriesAverager()
    }

    private async processTask(task: SerializedTask): Promise<JsonType | undefined> {
        hyrexLogger.info('task-processing', `▶ Starting task: task_name=${task.task_name}, task_id=${task.id}`, 'green')
        const { task_name, args } = task
        const func: HyrexTaskFunction = this.taskRegistry.getFunction(task_name)
        const s3Logger = new S3Logger({ dispatcher: this.dispatcher })
        try {
            setHyrexContext({
                taskId: task.id,
                durableId: task.durable_id,
                rootId: task.root_id,
                parentId: task.parent_id,
                taskName: task.task_name,
                queue: task.queue,
                priority: task.priority,
                timeoutSeconds: task.timeout_seconds,
                scheduledStart: task.scheduled_start,
                queued: task.queued,
                started: task.started,
                executorId: this.executorId,
            });

            s3Logger.startCapture(
                `${task.id}`  // Creates a hierarchy of logs under id
            );

            let funcToExecute: () => Promise<any>;

            if (args) {
                const withArgsFunc = func as ((arg: JsonType) => JsonType | undefined)
                funcToExecute = async () => withArgsFunc(args)
            } else {
                const noArgsFunc = func as (() => JsonType | undefined)
                funcToExecute = async () => noArgsFunc()
            }

            if (task.timeout_seconds) {
                funcToExecute = timeoutWrapper(funcToExecute, task.timeout_seconds * 1000)
            }

            const result = await funcToExecute()

            hyrexLogger.info('task-processing', `Returning Task Function. result=${JSON.stringify(result)}`, 'green')
            return result


        } finally {
            hyrexLogger.info('task-processing', `⏹ Ending task: task_name=${task.task_name}, task_id=${task.id}`, 'green')
            clearHyrexContext()
            await s3Logger.endCapture();
            s3Logger.uploadLogs()
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

        hyrexLogger.info('flow-control', `Refreshing concrete queues. queuePattern=${JSON.stringify(this.queuePattern)}.`, 'blue')
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

        hyrexLogger.info('flow-control', `Succesfully refreshed queue names. queueNamesSetSize=${queueNamesSet.size}`, 'blue')

        const concreteQueues = [...queueNamesSet].map((queueName) => {
            return this.taskRegistry.internalQueueRegistry[queueName] ? this.taskRegistry.internalQueueRegistry[queueName] : new HyrexQueue({ name: queueName })
        })

        this.queues = shuffle(concreteQueues);

        this.dispatcher.updateQueuesOnExecutor({ executorId: this.executorId, queues: this.queues })

        hyrexLogger.info('flow-control', `concreteQueues=${JSON.stringify(this.queues)}`, 'blue')
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
        hyrexLogger.info("flow-control", `queueIndex=${this.queueListIndex}, queueLength=${this.queues.length}`, 'blue')
        return queue;
    }


    async runExecutor() {
        let shouldStop = false

        const handleShutdown = (signal: string) => {
            hyrexLogger.info("process-management", `Received ${signal}. Stopping executor...`, 'magenta')
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

        const dequeueDurationAvgr = new TimeSeriesAverager()

        while (!shouldStop) {
            //
            // THIS IS THE FETCH LOOP
            //

            const nextQueue = await this.getNextQueueRoundRobin()
            if (!nextQueue) {
                hyrexLogger.info("flow-control", "No queues found. Going to sleep", "blue")
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
                hyrexLogger.info(`flow-control`, `No tasks found on queue "${nextQueue.name}". EmptyQueueCounter=${this.emptyQueueCounter++}`, 'blue')
                if (this.emptyQueueCounter >= 5) {
                    hyrexLogger.info(`flow-control`, `Queue Refresh Because Empty Queue Counter Hit.`, 'blue')
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
                this.updateTaskId(task.id)
                const result = await this.processTask(task)
                if (result) {
                    await this.dispatcher.saveResult(task.id, result)
                }
                await this.dispatcher.markTaskSuccess(task.id)
                this.updateTaskId(null)
            } catch (error) {
                console.error(error)
                await this.dispatcher.markTaskFailed(task.id)
                hyrexLogger.error('task-processing', `Failed processing. taskId=${task.id}`, 'red')
                this.updateTaskId(null)
                await this.dispatcher.attemptRetry(task.id)
            }

            const stats = {
                "dequeueLatencyMs": dequeueDurationAvgr.getTimeSeries(),
                "refreshQueueLatencyMs": this.refreshQueueDurationAvgr.getTimeSeries(),
                "numDistinctQueues": this.numDistinctQueuesAvgr.getTimeSeries()
            }

            if (Math.random() < 0.04) { // 1/25 chance
                this.dispatcher.emitExecutorStats({ executorId: this.executorId, stats }).then(result => {
                    if (result === 'REJECTED') {
                        console.error('Failed while emitting stats. Executor status is REJECTED. Shutting down the process.');
                        process.exit(1);
                    }
                })
            }
        }

        const stats = {
            "dequeueLatencyMs": dequeueDurationAvgr.getTimeSeries(),
            "refreshQueueLatencyMs": this.refreshQueueDurationAvgr.getTimeSeries(),
            "numDistinctQueues": this.numDistinctQueuesAvgr.getTimeSeries()
        }

        await this.dispatcher.disconnectExecutor({ executorId: this.executorId, stats })
        hyrexLogger.info('task-processing', `Executor ${this.name} stopped.`, 'green')
    }
}
