// src/cli.ts
import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { UPDATE_TASK_ID } from "./worker/HyrexSynchronousWorker";

// Store references to all spawned workers
let isShuttingDown = false;
const taskIdToWorker = new Map<string, ChildProcess>();
const workers: ChildProcess[] = [];

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
        (args) => {
            const scriptPath = path.resolve(process.cwd(), args.script as string);
            const count = args.count as number;

            console.log(`Spawning ${count} worker processes for script: ${scriptPath}`);

            for (let i = 0; i < count; i++) {
                spawnWorker(scriptPath, i + 1);
                // const worker = spawn('ts-node', [scriptPath, '--worker'], {
                //     stdio: ['ignore', 'inherit', 'inherit'],
                //     env: process.env,
                // });
                //
                // worker.on('exit', (code) => {
                //     if (code !== 0) {
                //         console.error(`Worker ${i + 1} exited with code ${code}`);
                //     } else {
                //         console.log(`Worker ${i + 1} exited successfully.`);
                //     }
                // });
                //
                // worker.on('error', (err) => {
                //     console.error(`Worker ${i + 1} encountered an error:`, err);
                // });
            }
        }
    )
    .demandCommand(1, 'You need to specify a command.')
    .help()
    .argv;

/**
 * Spawns a single worker process.
 * @param scriptPath Absolute path to the user script.
 * @param workerNumber Identifier for the worker.
 */
function spawnWorker(scriptPath: string, workerNumber: number) {
    // const workerScriptPath = path.resolve(__dirname, './worker/worker-runner.ts');
    const worker: ChildProcess = spawn('ts-node', [scriptPath, '--worker'], {
        env: {
            ...process.env,
            HYREX_WORKER_NAME: `W${workerNumber}`
        },
        stdio: ['ignore', 'inherit', 'inherit', "ipc"],
    });

    workers.push(worker);

    console.log(`Worker ${workerNumber} started with PID: ${worker.pid}`);

    worker.on('message', (message) => {
        handleWorkerMessage(worker, message);
    });

    worker.on('exit', (code, signal) => {
        if (code !== null) {
            console.log(`Worker ${workerNumber} exited with code ${code}`);
        } else if (signal !== null) {
            console.log(`Worker ${workerNumber} was killed by signal ${signal}`);
        } else {
            console.log(`Worker ${workerNumber} exited`);
        }

        // Optionally, respawn the worker if it exited unexpectedly
        if (!isShuttingDown) {
            console.log(`Respawning Worker ${workerNumber}...`);
            spawnWorker(scriptPath, workerNumber);
        }
    });

    worker.on('error', (err) => {
        console.error(`Worker ${workerNumber} encountered an error:`, err);
    });
}

function handleWorkerMessage(worker: ChildProcess, message: any) {
    if (message && message.type === UPDATE_TASK_ID) {
        const { taskId, name } = message;
        console.log(`${name} (Worker PID ${worker.pid}) is working on Task ID ${taskId}`);

        // Remove any existing mapping of this worker to a task ID
        for (const [existingTaskId, existingWorker] of taskIdToWorker.entries()) {
            if (existingWorker === worker) {
                taskIdToWorker.delete(existingTaskId);
                break;
            }
        }

        // Map the new task ID to the worker
        console.log("Setting taskId", taskId)
        taskIdToWorker.set(taskId, worker);
    }
}

// Function to kill a task
function killTask(taskId: string) {
    const worker = taskIdToWorker.get(taskId);
    if (worker) {
        console.log(`Killing worker PID ${worker.pid} handling Task ID ${taskId}`);
        worker.kill('SIGTERM');

        // Optionally, remove the mapping immediately
        taskIdToWorker.delete(taskId);
    } else {
        console.warn(`No worker found handling Task ID ${taskId}`);
        console.log(`Options are ${Array.from(taskIdToWorker.keys()).join(', ')}`);
    }
}

// Handle shutdown signals
const shutdown = () => {
    console.log("Shutting down all workers...");
    isShuttingDown = true;

    const workerExitPromises = workers.map((worker) => {
        return new Promise<void>((resolve) => {
            worker.once('exit', resolve);
        });
    });


    for (const worker of workers) {
        worker.kill('SIGTERM');
    }

    const timeout = 15_000;

    // Forcefully kill workers that don't exit within the timeout
    const timeoutHandle = setTimeout(() => {
        for (const worker of workers) {
            if (!worker.killed) {
                console.warn(`Worker with PID ${worker.pid} did not exit in time. Sending SIGKILL.`);
                worker.kill('SIGKILL');
            }
        }
    }, timeout);

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
import readline from 'readline';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

console.log('Type "kill <taskId>" to terminate a task.');

rl.on('line', (input) => {
    const [command, taskId] = input.trim().split(' ');
    if (command === 'kill' && taskId) {
        killTask(taskId);
    } else {
        console.log('Invalid command. Use "kill <taskId>".');
    }
});
