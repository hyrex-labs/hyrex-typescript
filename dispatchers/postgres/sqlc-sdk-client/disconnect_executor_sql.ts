import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const disconnectExecutorQuery = `-- name: DisconnectExecutor :exec
UPDATE hyrex_executor
SET stopped        = CURRENT_TIMESTAMP,
    last_heartbeat = CURRENT_TIMESTAMP,
    stats          = $1,
    status         = 'SHUTDOWN'::executor_status
WHERE id = $2`;

export interface DisconnectExecutorArgs {
    stats: any | null;
    id: string;
}

export async function disconnectExecutor(client: Client, args: DisconnectExecutorArgs): Promise<void> {
    await client.query({
        text: disconnectExecutorQuery,
        values: [args.stats, args.id],
        rowMode: "array"
    });
}

