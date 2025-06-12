import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const markTaskCanceledQuery = `-- name: MarkTaskCanceled :exec
UPDATE hyrex_task_run
SET status   = 'canceled'::task_run_status,
    finished = CURRENT_TIMESTAMP
WHERE id = $1
  AND status = 'up_for_cancel'`;

export interface MarkTaskCanceledArgs {
    id: string;
}

export async function markTaskCanceled(client: Client, args: MarkTaskCanceledArgs): Promise<void> {
    await client.query({
        text: markTaskCanceledQuery,
        values: [args.id],
        rowMode: "array"
    });
}

