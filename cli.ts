#!/usr/bin/env node

// src/cli.ts
import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { COMMANDS } from "./commands";
import { sleep } from "./utils";
import {
    BatchHeartbeatMessage,
    ExecutorHeartbeatResultMessage,
    ExecutorMessage,
    AdminMessage,
    RootMessage,
    TaskHeartbeatResultMessage
} from "./types";
import { generateWorkerName } from "./WorkerContext";
import { hyrexLogger } from "./logging/FrameworkLogger";
import { asciiHyrexLogo } from "./constants";

// Settings
const SHUTDOWN_TIMEOUT = 25_000

// Store references to all spawned workers
let isShuttingDown = false;
const taskIdToProcess = new Map<string, ChildProcess>();
const executorIdToProcess = new Map<string, ChildProcess>();
const childProcesses: ChildProcess[] = [];
const adminProcesses: ChildProcess[] = [];
const cronSchedulerProcesses: ChildProcess[] = [];

const argv = yargs(hideBin(process.argv))
    .command(
        'run-worker <script> [count]',
        'Run multiple worker processes',
        (yargs) => {
            yargs
                .positional('script', {
                    describe: 'Path to the worker script',
                    type: 'string',
                })
                .positional('count', {
                    describe: 'Number of worker processes to spawn',
                    type: 'number',
                    default: 1,
                })
                .option('lifespan', {
                    describe: 'Lifespan of the worker in seconds',
                    type: 'number',
                    alias: 'l'
                })
                .option('exit-on-sleep', {
                    describe: 'If the worker should exit on sleep',
                    type: 'boolean',
                    alias: 'eos',
                    default: false
                })
                .option('queue', {
                    describe: 'The name of the queue this worker should subscribe to. (Glob syntax is acceptable.)',
                    type: 'string',
                    alias: 'q',
                    default: '*'
                })
        },
        async (args) => {
            const scriptPath = path.resolve(process.cwd(), args.script as string);
            const count = args.count as number;
            const lifespan = args.lifespan as number | undefined;
            const exitOnSleep = args.exitOnSleep as boolean;
            const queuePattern = args.queue as string

            const workerName = generateWorkerName()

            hyrexLogger.info('system', asciiHyrexLogo, 'green')

            hyrexLogger.info("process-management", `Kicking off with workers. workerCount=${count} scriptPath=${scriptPath}`, 'magenta')
            for (let i = 0; i < count; i++) {
                spawnExectuor({workerName, scriptPath, exitOnSleep, executorNumber: i + 1, queuePattern});
            }

            spawnAdmin(scriptPath)
            spawnCronScheduler(workerName, scriptPath)

            // Set up a heartbeat interval to run every 30 seconds
            const heartbeatInterval = setInterval(() => {
                // Filter for alive admin processes
                const aliveAdminProcesses = adminProcesses.filter(p => !p.killed);
                if (aliveAdminProcesses.length === 0) {
                    return;
                } else if (aliveAdminProcesses.length > 1) {
                    // If there isn't exactly one alive admin process, log and skip this interval
                    hyrexLogger.info("durability", `Found ${aliveAdminProcesses.length} alive admin processes. Is everything okay?`, 'brightRed')
                    return;
                }

                const adminProcess = aliveAdminProcesses[0];
                const timestamp = new Date().toUTCString();


                // Build executors id message for executors by filtering out dead processes
                const executorIds: string[] = Array.from(executorIdToProcess.entries())
                    .filter(([, executorProc]) => !executorProc.killed)
                    .map(([executorId]) => (executorId))

                if (executorIds.length === 0) {
                    return
                }

                // Send the heartbeat message to the admin process
                adminProcess.send({
                    messageType: "BATCH_HEARTBEAT",
                    body: {
                        // taskHeartbeatMessages,
                        executorIds: executorIds,
                    }
                } as RootMessage);
            }, 3_000);

            // hyrexLogger.info('durability', `Created heartbeat interval: ${heartbeatInterval}`, 'brightRed')

            if (lifespan) {
                console.log(`Process will shutdown after ${lifespan} seconds`);
                setTimeout(() => {
                    console.log(`Process reached lifespan limit of ${lifespan} seconds`);
                    console.log('Initiating complete shutdown...');
                    shutdown(); // Use the existing shutdown function
                }, lifespan * 1000); // Convert seconds to milliseconds
            }

            const printStatus = () => {
                console.log("/---Child Processes----\\")
                console.log("Child Processes", childProcesses.map(cp => ({ pid: cp.pid, killed: cp.killed })))
                // console.log("taskIdsToExecutor", Object.values(taskIdToWorker).map(p => p.pid))
                taskIdToProcess.forEach((worker, taskId) => {
                    console.log({ taskId, pid: worker.pid })
                });

                executorIdToProcess.forEach((worker, executorId) => {
                    console.log({ executorId, pid: worker.pid })
                });
                console.log("\\-------------------------/")
            }

            while (!isShuttingDown) {
                await sleep(3_000)
                const aliveAdminProcesses = adminProcesses.filter(p => !p.killed)
                if (aliveAdminProcesses.length === 0) {
                    continue
                } else if (aliveAdminProcesses.length > 1) {
                    throw new Error("Too many admin processes")
                } else { // Exactly 1 aliveAdminProcesses
                    const adminProcess = aliveAdminProcesses[0]
                    const timestamp = (new Date()).toUTCString()
                    const taskHeartbeatMessages: TaskHeartbeatResultMessage[] = Object.keys(taskIdToProcess).map(taskId => ({
                        messageType: "TASK_HEARTBEAT",
                        body: {
                            taskId,
                            status: "RUNNING",
                            timestamp
                        }
                    }))

                    const executorHeartbeatMessages = Object.keys(executorIdToProcess).map((executorIds) => ({
                        messageType: "EXECUTOR_HEARTBEAT",
                    } as ExecutorHeartbeatResultMessage))

                    // adminProcess.send({
                    //     messageType: "BATCH_HEARTBEAT",
                    //     body: {
                    //         taskHeartbeatMessages,
                    //         executorIds: Object.keys(executorIdToProcess),
                    //     }
                    // } as BatchHeartbeatMessage)
                }


            }
        }
    )
    .command(
        'init-db <script>',
        'Initialize the database for Postgres mode',
        (yargs) => {
            yargs.positional('script', {
                describe: 'Path to the script that initializes the database',
                type: 'string',
            });
        },
        async (args) => {
            const scriptPath = path.resolve(process.cwd(), args.script as string);
            const worker: ChildProcess = spawn('ts-node', [scriptPath, '--initDB'], {
                env: {
                    ...process.env,
                    [COMMANDS.INIT_DB]: "1",
                },
                stdio: ['ignore', 'inherit', 'inherit', "ipc"],
            });

            worker.on('exit', (code) => {
                if (code === 0) {
                    console.log('Database initialized successfully.');
                    /* TODO:
                    * Sometimes this says "Database initialized successfully when it hasn't.
                    * (e.g. when running npm run init-db app/app.ts instead of npm run init-db app/hyrex-app.ts)
                    */
                    process.exit(code);
                } else {
                    console.error(`Database initialization failed with exit code ${code}.`);
                    process.exit(code || 1);
                }
            });

            worker.on('error', (err) => {
                console.error('Error during database initialization:', err);
                process.exit(1);
            });
        }
    )
    .demandCommand(1, 'You need to specify a command.')
    .help()
    .argv;

/**
 * Spawns a single worker process.
 * @param scriptPath Absolute path to the user script.
 * @param executorNumber Identifier for the worker.
 */
function spawnExectuor({ workerName, scriptPath, exitOnSleep, executorNumber, queuePattern }: {
    workerName: string,
    scriptPath: string,
    exitOnSleep: boolean,
    executorNumber: number,
    queuePattern: string
}) {
    // const workerScriptPath = path.resolve(__dirname, './worker/worker-runner.ts');
    const workerEnv = {
        ...process.env,
        [COMMANDS.RUN_WORKER]: "1",
        [COMMANDS.EXECUTOR_NAME]: `E${executorNumber}`,
        [COMMANDS.WORKER_NAME]: workerName,
        [COMMANDS.QUEUE_PATTERN]: queuePattern,
    }

    const executor: ChildProcess = spawn('ts-node', [scriptPath], {
        env: workerEnv,
        stdio: ['ignore', 'inherit', 'inherit', "ipc"],
    });

    childProcesses.push(executor);

    hyrexLogger.info("process-management", `Executor ${executorNumber} Spawned. pid=${executor.pid}`, 'magenta')

    executor.on('message', (message) => {
        handleExecutorMessage(executor, message as ExecutorMessage, exitOnSleep);
    });

    executor.on('exit', (code, signal) => {
        if (code !== null) {
            hyrexLogger.info("process-management", `Executor ${executorNumber} exited with code ${code}.`, "magenta")
        } else if (signal !== null) {
            hyrexLogger.info("process-management", `Executor ${executorNumber} was killed by signal ${signal}.`, "magenta")
        } else {
            hyrexLogger.info("process-management", `Executor ${executorNumber} exited.`, "magenta")
        }

        // Optionally, respawn the executor if it exited unexpectedly
        if (!isShuttingDown) {
            console.log(`Respawning Executor ${executorNumber}...`);
            spawnExectuor({workerName, scriptPath, exitOnSleep, executorNumber, queuePattern});
        }
    });

    executor.on('error', (err) => {
        console.error(`Executor ${executorNumber} encountered an error:`, err);
    });
}

function spawnCronScheduler(workerName: string, scriptPath: string) {
    const schedulerProcess: ChildProcess = spawn('ts-node', [scriptPath], {
        env: {
            ...process.env,
            [COMMANDS.RUN_CRON_SCHEDULER]: "1",
            [COMMANDS.WORKER_NAME]: workerName,
        },
        stdio: ['ignore', 'inherit', 'inherit', "ipc"],
    })

    hyrexLogger.info("process-management", `Cron Scheduler Spawned. pid=${schedulerProcess.pid}`, 'magenta')

    childProcesses.push(schedulerProcess);
    cronSchedulerProcesses.push(schedulerProcess)

    // schedulerProcess.on('error', (err) => {
    //     console.error('CronScheduler encountered an error:', err);
    // });
    //
    // schedulerProcess.stderr!.on('data', (data) => {
    //     console.error(`CronScheduler stderr: ${data}`);
    // });

    schedulerProcess.on('exit', (code, signal) => {
        if (code !== null) {
            hyrexLogger.info("process-management", `CronScheduler exited with code ${code}`, "magenta");
        } else if (signal !== null) {
            hyrexLogger.info("process-management", `CronScheduler killed by signal ${signal}`, "magenta");
        } else {
            hyrexLogger.info("process-management", "CronScheduler exited", "magenta");
        }

        // Optionally, respawn the worker if it exited unexpectedly
        if (!isShuttingDown) {
            hyrexLogger.info("process-management", "Respawning CronScheduler...", "magenta");
            spawnCronScheduler(workerName, scriptPath);
        }
    })
}

function spawnAdmin(scriptPath: string) {
    // if (adminProcesses.filter(p => !p.killed)) {
    //     throw new Error("Spawning a new admin process")
    // }

    const adminProcess: ChildProcess = spawn('ts-node', [scriptPath], {
        env: {
            ...process.env,
            [COMMANDS.RUN_ADMIN]: "1",
        },
        stdio: ['ignore', 'inherit', 'inherit', "ipc"],
    });

    hyrexLogger.info("process-management", `Admin Spawned. pid=${adminProcess.pid}`, 'magenta')

    childProcesses.push(adminProcess);
    adminProcesses.push(adminProcess);

    adminProcess.on('message', (message: AdminMessage) => {
        handleAdminMessage(adminProcess, message);
    });

    adminProcess.on('exit', (code, signal) => {
        if (code !== null) {
            hyrexLogger.info("process-management", `Admin exited with code ${code}`, 'magenta')
        } else if (signal !== null) {
            hyrexLogger.info("process-management", `Admin was killed by signal ${signal}`, 'magenta')
        } else {
            hyrexLogger.info("process-management", `Admin exited.`, 'magenta')
        }

        // Optionally, respawn the admin if it exited unexpectedly
        if (!isShuttingDown) {
            hyrexLogger.info("process-management", "Respawning Admin...", "magenta")
            spawnAdmin(scriptPath);
        }
    });

    adminProcess.on('error', (err) => {
        console.error(`Listener encountered an error:`, err);
    });

}

let shutdownTimeout: NodeJS.Timeout | null = null;

function handleExecutorMessage(executor: ChildProcess, message: ExecutorMessage, exitOnSleep: boolean) {
    if (message.messageType === "UPDATE_TASK_ID") {
        const { taskId, name } = message;
        hyrexLogger.info('process-management', `Setting taskID on Worker. workerName=${name}, pid=${executor.pid}, taskId=${taskId}`, 'magenta');
        // Remove any existing mapping of this worker to a task ID
        for (const [existingTaskId, existingExecutor] of taskIdToProcess.entries()) {
            if (existingExecutor === executor) {
                taskIdToProcess.delete(existingTaskId);
                break;
            }
        }

        // Map the new task ID to the worker
        if (taskId !== null) {
            taskIdToProcess.set(taskId, executor);
        }

        // Clear any pending shutdown if tasks are still active
        if (shutdownTimeout && taskIdToProcess.size > 0) {
            clearTimeout(shutdownTimeout);
            shutdownTimeout = null;
            console.log("Pending shutdown canceled because tasks are active.");
        }

        if (exitOnSleep && taskIdToProcess.size === 0) {
            if (!shutdownTimeout) {
                console.log("No active task IDs, scheduling shutdown in 10 seconds...");
                shutdownTimeout = setTimeout(() => {
                    console.log("No task IDs received. Proceeding with shutdown.");
                    shutdown();
                }, 30000); // 30 seconds
            }
        }

    } else if (message.messageType === "SET_EXECUTOR_ID") {
        const { executorId } = message;
        executorIdToProcess.set(executorId, executor)
    } else {
        console.error(`Unrecognized message type ${message}`)
    }
}

function handleAdminMessage(adminProcess: ChildProcess, message: AdminMessage) {
    if (message && message.messageType === "TASK_CANCEL") {
        console.log("Killing task...", message.taskId)
        killTask(message.taskId)
        adminProcess.send({
            messageType: "TASK_CANCEL",
            body: {
                taskId: message.taskId,
            }
        })
    } else if (message && message.messageType === "TASK_HEARTBEAT") {
        const workerForTask = taskIdToProcess.get(message.taskId)
        console.log("workerForTask", workerForTask)
        console.log("/---taskIds to workers----\\")
        taskIdToProcess.forEach((worker, taskId) => {
            console.log(`Task ID: ${taskId}`);
            console.log(`Worker PID: ${worker.pid}`);
        });
        console.log("\\-------------------------/")

        const status = workerForTask ? "RUNNING" : "LOST"
        const timestamp = (new Date()).toUTCString()
        const heartbeatMsg: RootMessage = {
            messageType: "TASK_HEARTBEAT",
            body: {
                taskId: message.taskId,
                status,
                timestamp,
            }
        }
        adminProcess.send(heartbeatMsg)
    } else {
        console.error("Received unrecognized message...", message);
    }
}

// Function to kill a task
function killTask(taskId: string) {
    const worker = taskIdToProcess.get(taskId);
    if (worker) {
        console.log(`Killing worker PID ${worker.pid} handling Task ID ${taskId}`);
        worker.kill('SIGKILL');

        // Optionally, remove the mapping immediately
        taskIdToProcess.delete(taskId);
    } else {
        console.warn(`No worker found handling Task ID ${taskId}`);
        console.log(`Options are ${Array.from(taskIdToProcess.keys()).join(', ')}`);
    }
}

// Handle shutdown signals
const shutdown = () => {
    hyrexLogger.info("process-management", "Shutting down all workers...", 'magenta')
    isShuttingDown = true;

    const workerExitPromises = childProcesses.map((worker) => {
        return new Promise<void>((resolve) => {
            worker.once('exit', resolve);
        });
    });


    for (const worker of childProcesses) {
        worker.kill('SIGTERM');
    }

    // Forcefully kill workers that don't exit within the timeout
    const timeoutHandle = setTimeout(() => {
        for (const worker of childProcesses) {
            if (!worker.killed) {
                hyrexLogger.warn('process-management', `Worker with PID ${worker.pid} did not exit in time. Sending SIGKILL.`, 'yellow')
                worker.kill('SIGKILL');
            }
        }
    }, SHUTDOWN_TIMEOUT);

    // Wait for all workers to exit
    Promise.all(workerExitPromises)
        .then(() => {
            clearTimeout(timeoutHandle); // Clear the timeout if all workers have exited
            hyrexLogger.info("process-management", "All workers have exited. Shutting down parent process.", 'magenta');
            process.exit(0);
        })
        .catch((err) => {
            console.error("Error while waiting for workers to exit:", err);
            process.exit(1);
        });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Simulate receiving a kill task signal via command-line input
// import readline from 'readline';
//
// const rl = readline.createInterface({
//     input: process.stdin,
//     output: process.stdout,
// });
//
// console.log('Type "kill <taskId>" to terminate a task.');
//
// rl.on('line', (input) => {
//     const [command, taskId] = input.trim().split(' ');
//     if (command === 'kill' && taskId) {
//         killTask(taskId);
//     } else {
//         console.log('Invalid command. Use "kill <taskId>".');
//     }
// });
