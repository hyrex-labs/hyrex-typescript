import { QueryArrayConfig, QueryArrayResult } from "pg";

import { IPostgresInterval } from "postgres-interval";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const markLostExecutorsQuery = `-- name: MarkLostExecutors :many
UPDATE hyrex_executor
SET status = 'LOST',
    stopped = last_heartbeat
WHERE status = 'RUNNING'
AND last_heartbeat < CURRENT_TIMESTAMP - INTERVAL $1
AND stopped IS NULL
RETURNING id`;

export interface MarkLostExecutorsArgs {
    : IPostgresInterval;
}

export interface MarkLostExecutorsRow {
    id: string;
}

export async function markLostExecutors(client: Client, args: MarkLostExecutorsArgs): Promise<MarkLostExecutorsRow[]> {
    const result = await client.query({
        text: markLostExecutorsQuery,
        values: [args.],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            id: row[0]
        };
    });
}

