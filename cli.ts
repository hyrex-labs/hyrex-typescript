// src/cli.ts
import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

// Store references to all spawned workers
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
                spawnWorker(scriptPath, i+1);
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
    const workerScriptPath = path.resolve(__dirname, './worker/worker-runner.ts');
    const worker: ChildProcess = spawn('ts-node', [scriptPath, '--worker'], {
        env: { ...process.env },
        stdio: ['ignore', 'inherit', 'inherit'],
    });

    workers.push(worker);

    console.log(`Worker ${workerNumber} started with PID: ${worker.pid}`);

    worker.on('exit', (code, signal) => {
        if (code !== null) {
            console.log(`Worker ${workerNumber} exited with code ${code}`);
        } else if (signal !== null) {
            console.log(`Worker ${workerNumber} was killed by signal ${signal}`);
        } else {
            console.log(`Worker ${workerNumber} exited`);
        }

        // Optionally, respawn the worker if it exited unexpectedly
        if (code !== 0) {
            console.log(`Respawning Worker ${workerNumber}...`);
            spawnWorker(scriptPath, workerNumber);
        }
    });

    worker.on('error', (err) => {
        console.error(`Worker ${workerNumber} encountered an error:`, err);
    });
}

// Handle shutdown signals
const shutdown = () => {
    console.log("Shutting down all workers...");
    for (const worker of workers) {
        worker.kill('SIGTERM');
    }
    process.exit();
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
