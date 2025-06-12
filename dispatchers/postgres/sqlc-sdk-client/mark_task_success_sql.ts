import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const markTaskSuccessQuery = `-- name: MarkTaskSuccess :exec
UPDATE hyrex_task_run
SET status   = CASE
                   WHEN status = 'running' THEN 'success'::task_run_status
                   WHEN status = 'up_for_cancel' THEN 'canceled'::task_run_status
    END,
    finished = CURRENT_TIMESTAMP
WHERE id = $1
  AND status IN ('running', 'up_for_cancel')`;

export interface MarkTaskSuccessArgs {
    id: string;
}

export async function markTaskSuccess(client: Client, args: MarkTaskSuccessArgs): Promise<void> {
    await client.query({
        text: markTaskSuccessQuery,
        values: [args.id],
        rowMode: "array"
    });
}

