// src/workers/worker-runner.ts
import path from 'path';
import { pathToFileURL } from 'url';
import { sleep } from "../utils";



async function runWorker() {
    // Retrieve the user script path from command-line arguments
    const userScriptPath = process.argv[2];

    if (!userScriptPath) {
        console.error('No user script path provided to worker-runner.');
        process.exit(1);
    }

    // Resolve the absolute path to the user script
    const absolutePath = path.resolve(process.cwd(), userScriptPath);

    try {
        // Dynamically import the user script as an ES module
        console.log("absolutePath", absolutePath)
        const userModule = await import(pathToFileURL(absolutePath).href);

        // Retrieve the exported Hyrex instance
        const hyrex = userModule.hyrex;

        if (!hyrex) {
            throw new Error('No Hyrex instance exported from the user script.');
        }

        // Run the worker
        hyrex.runWorker();

        console.log(`Worker [PID: ${process.pid}] started and running...`);
    } catch (error: any) {
        console.error('Error in worker-runner:', error.message);
        sleep(1000)
        process.exit(1);
    }
}

// Execute the worker runner
runWorker();

// Handle graceful shutdown within the worker
process.on('SIGINT', () => {
    console.log(`Worker [PID: ${process.pid}] received SIGINT. Shutting down...`);
    process.exit();
});

process.on('SIGTERM', () => {
    console.log(`Worker [PID: ${process.pid}] received SIGTERM. Shutting down...`);
    process.exit();
});
