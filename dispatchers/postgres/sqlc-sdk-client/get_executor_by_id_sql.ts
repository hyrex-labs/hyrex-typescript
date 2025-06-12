import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const getExecutorByIdQuery = `-- name: GetExecutorById :one
SELECT 
    e.id,
    e.name,
    e.worker_name,
    e.queue_pattern,
    e.queues,
    e.started,
    e.stopped,
    e.last_heartbeat,
    e.stats,
    CASE
        WHEN e.stopped IS NOT NULL THEN 'SHUTDOWN'
        WHEN (EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - e.last_heartbeat)) * 1000) > (20 * 1000) THEN 'LOST'
        WHEN (EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - e.last_heartbeat)) * 1000) <= (20 * 1000) THEN 'RUNNING'
        ELSE 'UNKNOWN'
    END AS status
FROM public.hyrex_executor e
WHERE e.id = $1`;

export interface GetExecutorByIdArgs {
    id: string;
}

export interface GetExecutorByIdRow {
    id: string;
    name: string;
    workerName: string;
    queuePattern: string;
    queues: string[];
    started: Date | null;
    stopped: Date | null;
    lastHeartbeat: Date | null;
    stats: any | null;
    status: string;
}

export async function getExecutorById(client: Client, args: GetExecutorByIdArgs): Promise<GetExecutorByIdRow | null> {
    const result = await client.query({
        text: getExecutorByIdQuery,
        values: [args.id],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        id: row[0],
        name: row[1],
        workerName: row[2],
        queuePattern: row[3],
        queues: row[4],
        started: row[5],
        stopped: row[6],
        lastHeartbeat: row[7],
        stats: row[8],
        status: row[9]
    };
}

