import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const markTaskFailedQuery = `-- name: MarkTaskFailed :exec
UPDATE hyrex_task_run
SET status   = 'failed',
    finished = CURRENT_TIMESTAMP
WHERE id = $1`;

export interface MarkTaskFailedArgs {
    id: string;
}

export async function markTaskFailed(client: Client, args: MarkTaskFailedArgs): Promise<void> {
    await client.query({
        text: markTaskFailedQuery,
        values: [args.id],
        rowMode: "array"
    });
}

