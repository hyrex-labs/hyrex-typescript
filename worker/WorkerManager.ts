// import { Worker } from 'worker_threads';
// import { v4 as uuidv4 } from 'uuid';
// import path from 'path';
//
// interface TaskOptions {
//     args?: any[];
// }
//
// interface TaskResult {
//     taskId: string;
//     result?: any;
//     error?: string;
// }
//
// type TaskFunction = (...args: any[]) => any | Promise<any>;
//
// export class WorkerManager {
//     private tasks: Map<string, Worker> = new Map();
//
//     /**
//      * Submits a task to be executed in a worker.
//      * @param func The function to execute.
//      * @param options Optional arguments to pass to the function.
//      * @returns The unique task ID.
//      */
//     submitTask(func: TaskFunction, options?: TaskOptions): string {
//         const taskId = uuidv4();
//         const functionString = func.toString();
//         const args = options?.args || [];
//
//         const worker = new Worker(path.resolve(__dirname, 'worker.js'), {
//             workerData: {
//                 taskId,
//                 functionString,
//                 args,
//             },
//         });
//
//         this.tasks.set(taskId, worker);
//
//         // Listen for messages from the worker
//         worker.on('message', (message: TaskResult) => {
//             if (message.taskId === taskId) {
//                 if (message.error) {
//                     console.error(`Task ${taskId} failed with error: ${message.error}`);
//                 } else {
//                     console.log(`Task ${taskId} completed with result:`, message.result);
//                 }
//                 // Clean up after task completion
//                 this.tasks.delete(taskId);
//                 worker.terminate();
//             }
//         });
//
//         // Listen for worker errors
//         worker.on('error', (error) => {
//             console.error(`Worker for task ${taskId} encountered error:`, error);
//             this.tasks.delete(taskId);
//         });
//
//         // Listen for worker exit
//         worker.on('exit', (code) => {
//             if (code !== 0) {
//                 console.error(`Worker for task ${taskId} stopped with exit code ${code}`);
//             }
//             this.tasks.delete(taskId);
//         });
//
//         return taskId;
//     }
//
//     /**
//      * Cancels a running task.
//      * @param taskId The ID of the task to cancel.
//      * @returns Whether the task was successfully canceled.
//      */
//     cancelTask(taskId: string): boolean {
//         const worker = this.tasks.get(taskId);
//         if (worker) {
//             worker.terminate();
//             this.tasks.delete(taskId);
//             console.log(`Task ${taskId} has been canceled.`);
//             return true;
//         } else {
//             console.warn(`Task ${taskId} not found or already completed.`);
//             return false;
//         }
//     }
//
//     /**
//      * Cleans up all running workers.
//      */
//     shutdown(): void {
//         for (const [taskId, worker] of this.tasks) {
//             worker.terminate();
//             console.log(`Task ${taskId} has been terminated during shutdown.`);
//         }
//         this.tasks.clear();
//     }
// }
