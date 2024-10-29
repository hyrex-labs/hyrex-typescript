import { parentPort, workerData } from 'worker_threads';
import { HyrexSynchronousWorker } from '../HyrexSynchronousWorker';
import { Hyrex } from "../../HyrexApp";

// Destructure the configuration from workerData
const { name } = workerData;
console.log("Doing the worker thread!")

// Create and start the worker
const worker = new Hyrex({ name: });

worker.runWorker().then(() => {
    console.log(`${name} has completed all tasks.`);
    parentPort?.postMessage({ type: 'done' });
});
