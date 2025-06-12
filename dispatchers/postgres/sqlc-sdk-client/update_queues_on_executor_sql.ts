import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const updateQueuesOnExecutorQuery = `-- name: UpdateQueuesOnExecutor :exec
UPDATE hyrex_executor
SET queues = $1
WHERE id = $2`;

export interface UpdateQueuesOnExecutorArgs {
    queues: string[];
    id: string;
}

export async function updateQueuesOnExecutor(client: Client, args: UpdateQueuesOnExecutorArgs): Promise<void> {
    await client.query({
        text: updateQueuesOnExecutorQuery,
        values: [args.queues, args.id],
        rowMode: "array"
    });
}

