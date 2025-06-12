import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const registerExecutorQuery = `-- name: RegisterExecutor :exec
INSERT INTO hyrex_executor (id,
                            name,
                            queue_pattern,
                            queues,
                            worker_name,
                            started,
                            stopped,
                            last_heartbeat,
                            status)
VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, null, CURRENT_TIMESTAMP, 'RUNNING'::executor_status)`;

export interface RegisterExecutorArgs {
    id: string;
    name: string;
    queuePattern: string;
    queues: string[];
    workerName: string;
}

export async function registerExecutor(client: Client, args: RegisterExecutorArgs): Promise<void> {
    await client.query({
        text: registerExecutorQuery,
        values: [args.id, args.name, args.queuePattern, args.queues, args.workerName],
        rowMode: "array"
    });
}

