import sqlite3 from 'sqlite3';
import { HyrexDispatcher, SerializedTask, SerializedTaskRequest } from "./HyrexDispatcher";
import { UUID } from "../utils";
import { v4 as uuidv4 } from "uuid";
import { promisify } from 'util';



export class Sqlite3Dispatcher implements HyrexDispatcher {
    private db: sqlite3.Database;
    private verbose: boolean;

    constructor(fileName: string, verbose: boolean = false) {
        this.verbose = verbose
        this.db = new sqlite3.Database(fileName, (err) => {
            if (err) {
                console.error('Error opening database', err);
            } else {
                if (verbose) {
                    console.log('Database opened');
                }
                this.initialize();
            }
        });
    }

    // Initialize SQLite and create the tasks table if it doesn't exist
    private initialize() {
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS tasks (
                id TEXT PRIMARY KEY,
                name TEXT,
                queue, TEXT,
                status TEXT,
                config TEXT,
                context TEXT
            )
        `;
        this.db.run(createTableQuery, (err) => {
            if (err) {
                console.error('Error creating table:', err);
            } else {
                if (this.verbose) {
                    console.log('Table created or already exists');
                }
            }
        });
    }

    private runAsync(query: string, params: any[]): Promise<void> {
        return new Promise((resolve, reject) => {
            this.db.run(query, params, function (err) {
                if (err) {
                    return reject(err);
                }
                resolve();
            });
        });
    }

    private allAsync(query: string, params: any[]): Promise<any[]> {
        return new Promise((resolve, reject) => {
            this.db.all(query, params, (err, rows) => {
                if (err) {
                    return reject(err);
                }
                resolve(rows);
            });
        });
    }


    async enqueue(serializedTasks: SerializedTaskRequest[]): Promise<UUID[]> {
        const ids: UUID[] = [];
        const query = `INSERT INTO tasks (id, name, queue, status, config, context) VALUES (?, ?, ?, ?, ?, ?)`;

        await new Promise<void>((resolve, reject) => {
            this.db.serialize(async () => {
                try {
                    for (const task of serializedTasks) {
                        const id = uuidv4();
                        await this.runAsync(query, [
                            id,
                            task.name,
                            "DEFAULT",
                            "QUEUED",
                            JSON.stringify(task.config),
                            JSON.stringify(task.context)
                        ]);
                        ids.push(id);
                    }
                    resolve();
                } catch (err) {
                    reject(err);
                }
            });
        });
        return ids;
    }

    async dequeue({ numTasks }: { numTasks: number }): Promise<SerializedTask[]> {
        const selectQuery = `SELECT id, name, queue, config, context FROM tasks WHERE status = 'QUEUED' LIMIT ?`;
        const updateQuery = `UPDATE tasks SET status = 'RUNNING' WHERE id = ?`;

        // Get the queued tasks
        const tasks = await this.allAsync(selectQuery, [numTasks]);

        if (!tasks.length) {
            return [];
        }

        // Update status of dequeued tasks
        await new Promise<void>((resolve, reject) => {
            this.db.serialize(async () => {
                try {
                    for (const task of tasks) {
                        await this.runAsync(updateQuery, [task.id]);
                    }
                    resolve();
                } catch (err) {
                    reject(err);
                }
            });
        });

        // Return the dequeued tasks with the deserialized config and context
        return tasks.map(task => ({
            id: task.id,
            name: task.name,
            queue: task.queue,
            config: JSON.parse(task.config),
            context: JSON.parse(task.context)
        }));
    }

    async markTaskSuccess(taskId:UUID) {
        const updateQuery = `UPDATE tasks SET status = 'SUCCESS' WHERE id = ?`;

        await this.runAsync(updateQuery, [taskId]);

        if (this.verbose) {
            console.log(`Task ${taskId} marked as SUCCESS`);
        }
    }

    async markTaskFailed(taskId:UUID) {
        const updateQuery = `UPDATE tasks SET status = 'FAILED' WHERE id = ?`;

        await this.runAsync(updateQuery, [taskId]);

        if (this.verbose) {
            console.log(`Task ${taskId} marked as FAILED`);
        }
    }
}
