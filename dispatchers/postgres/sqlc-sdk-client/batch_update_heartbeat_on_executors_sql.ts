import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const batchUpdateHeartbeatOnExecutorsQuery = `-- name: BatchUpdateHeartbeatOnExecutors :exec
UPDATE hyrex_executor
SET last_heartbeat = NOW()
WHERE id = ANY ($1::uuid[])`;

export interface BatchUpdateHeartbeatOnExecutorsArgs {
    executorIds: string[];
}

export async function batchUpdateHeartbeatOnExecutors(client: Client, args: BatchUpdateHeartbeatOnExecutorsArgs): Promise<void> {
    await client.query({
        text: batchUpdateHeartbeatOnExecutorsQuery,
        values: [args.executorIds],
        rowMode: "array"
    });
}

