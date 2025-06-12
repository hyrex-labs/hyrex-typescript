import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const markTaskLostQuery = `-- name: MarkTaskLost :exec
UPDATE hyrex_task_run
SET status   = 'lost'::task_run_status,
    finished = CURRENT_TIMESTAMP
WHERE id = $1`;

export interface MarkTaskLostArgs {
    id: string;
}

export async function markTaskLost(client: Client, args: MarkTaskLostArgs): Promise<void> {
    await client.query({
        text: markTaskLostQuery,
        values: [args.id],
        rowMode: "array"
    });
}

