import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const getExecutorsPaginatedQuery = `-- name: GetExecutorsPaginated :many
SELECT 
    ROW_NUMBER() OVER (ORDER BY started DESC NULLS LAST) as row_number,
    id,
    name,
    worker_name,
    queue_pattern,
    queues,
    started,
    stopped,
    last_heartbeat,
    stats,
    CASE
        WHEN stopped IS NOT NULL THEN 'SHUTDOWN'
        WHEN last_heartbeat < NOW() - INTERVAL '1 minute' THEN 'LOST'
        WHEN last_heartbeat >= NOW() - INTERVAL '1 minute' THEN 'RUNNING'
        ELSE 'UNKNOWN'
    END as status
FROM hyrex_executor
ORDER BY started DESC NULLS LAST
LIMIT $1 OFFSET $2`;

export interface GetExecutorsPaginatedArgs {
    limit: string;
    offset: string;
}

export interface GetExecutorsPaginatedRow {
    rowNumber: string;
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

export async function getExecutorsPaginated(client: Client, args: GetExecutorsPaginatedArgs): Promise<GetExecutorsPaginatedRow[]> {
    const result = await client.query({
        text: getExecutorsPaginatedQuery,
        values: [args.limit, args.offset],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            rowNumber: row[0],
            id: row[1],
            name: row[2],
            workerName: row[3],
            queuePattern: row[4],
            queues: row[5],
            started: row[6],
            stopped: row[7],
            lastHeartbeat: row[8],
            stats: row[9],
            status: row[10]
        };
    });
}

