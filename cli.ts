#!/usr/bin/env node

// src/cli.ts
import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { COMMANDS } from "./commands";
import { sleep } from "./utils";
import { ExecutorMessage, ListenerMessage, ListenerResultMessage } from "./types";

// Settings
const SHUTDOWN_TIMEOUT = 25_000

// Store references to all spawned workers
let isShuttingDown = false;
const taskIdToProcess = new Map<string, ChildProcess>();
const executorIdToProcess = new Map<string, ChildProcess>();
const childProcesses: ChildProcess[] = [];
const listenerProcesses: ChildProcess[] = [];

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
                });
        },
        async (args) => {
            const scriptPath = path.resolve(process.cwd(), args.script as string);
            const count = args.count as number;

            console.log(`Spawning ${count} worker processes for script: ${scriptPath}`);

            for (let i = 0; i < count; i++) {
                spawnExectuor(scriptPath, i + 1);
            }

            spawnListener(scriptPath)

            childProcesses[0].killed

            while (!isShuttingDown) {
                console.log("/---Child Processes----\\")
                console.log("Child Processes", childProcesses.map(cp => ({pid: cp.pid, killed: cp.killed})))
                console
                // console.log("taskIdsToExecutor", Object.values(taskIdToWorker).map(p => p.pid))
                taskIdToProcess.forEach((worker, taskId) => {
                    console.log({taskId, pid: worker.pid})
                });

                executorIdToProcess.forEach((worker, executorId) => {
                    console.log({executorId, pid: worker.pid})
                });
                console.log("\\-------------------------/")
                await sleep(3_000)
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
function spawnExectuor(scriptPath: string, executorNumber: number) {
    // const workerScriptPath = path.resolve(__dirname, './worker/worker-runner.ts');
    const executor: ChildProcess = spawn('ts-node', [scriptPath], {
        env: {
            ...process.env,
            [COMMANDS.RUN_WORKER]: "1",
            HYREX_WORKER_NAME: `E${executorNumber}`,
        },
        stdio: ['ignore', 'inherit', 'inherit', "ipc"],
    });

    childProcesses.push(executor);

    console.log(`Executor ${executorNumber} started with PID: ${executor.pid}`);

    executor.on('message', (message) => {
        handleExecutorMessage(executor, message as ExecutorMessage);
    });

    executor.on('exit', (code, signal) => {
        if (code !== null) {
            console.log(`Executor ${executorNumber} exited with code ${code}`);
        } else if (signal !== null) {
            console.log(`Executor ${executorNumber} was killed by signal ${signal}`);
        } else {
            console.log(`Executor ${executorNumber} exited`);
        }

        // Optionally, respawn the executor if it exited unexpectedly
        if (!isShuttingDown) {
            console.log(`Respawning Executor ${executorNumber}...`);
            spawnExectuor(scriptPath, executorNumber);
        }
    });

    executor.on('error', (err) => {
        console.error(`Executor ${executorNumber} encountered an error:`, err);
    });
}

function spawnListener(scriptPath: string) {
    const listener: ChildProcess = spawn('ts-node', [scriptPath], {
        env: {
            ...process.env,
            [COMMANDS.RUN_WORKER_LISTENER]: "1",
        },
        stdio: ['ignore', 'inherit', 'inherit', "ipc"],
    });

    childProcesses.push(listener);
    listenerProcesses.push(listener)

    listener.on('message', (message) => {
        handleListenerMessage(listener, message as ListenerMessage);
    });

    listener.on('exit', (code, signal) => {
        if (code !== null) {
            console.log(`Listener exited with code ${code}`);
        } else if (signal !== null) {
            console.log(`Listener was killed by signal ${signal}`);
        } else {
            console.log(`Listener exited`);
        }

        // Optionally, respawn the worker if it exited unexpectedly
        if (!isShuttingDown) {
            console.log(`Respawning Listener...`);
            spawnListener(scriptPath);
        }
    });

    listener.on('error', (err) => {
        console.error(`Listener encountered an error:`, err);
    });

}

function handleExecutorMessage(executor: ChildProcess, message: ExecutorMessage) {
    if (message.messageType === "UPDATE_TASK_ID") {
        const { taskId, name } = message;
        console.log(`${name} (Worker PID ${executor.pid}) is working on Task ID ${taskId}`);
        // Remove any existing mapping of this worker to a task ID
        for (const [existingTaskId, existingExecutor] of taskIdToProcess.entries()) {
            if (existingExecutor === executor) {
                taskIdToProcess.delete(existingTaskId);
                break;
            }
        }

        // Map the new task ID to the worker
        if (taskId !== null) {
            console.log("Setting taskId", taskId)
            taskIdToProcess.set(taskId, executor);
        }
    } else if (message.messageType === "SET_EXECUTOR_ID") {
        const { executorId } = message;
        executorIdToProcess.set(executorId, executor)
    } else {
        console.error(`Unrecognized message type ${message}`)
    }
}

function handleListenerMessage(listener: ChildProcess, message: ListenerMessage) {
    if (message && message.messageType === "TASK_CANCEL") {
        console.log("Killing task...", message.taskId)
        killTask(message.taskId)
        listener.send({
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
        const heartbeatMsg: ListenerResultMessage = {
            messageType: "TASK_HEARTBEAT",
            body: {
                taskId: message.taskId,
                status,
                timestamp,
            }
        }
        listener.send(heartbeatMsg)
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
    console.log("Shutting down all workers...");
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
                console.warn(`Worker with PID ${worker.pid} did not exit in time. Sending SIGKILL.`);
                worker.kill('SIGKILL');
            }
        }
    }, SHUTDOWN_TIMEOUT);

    // Wait for all workers to exit
    Promise.all(workerExitPromises)
        .then(() => {
            clearTimeout(timeoutHandle); // Clear the timeout if all workers have exited
            console.log("All workers have exited. Shutting down parent process.");
            process.exit();
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
