import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const upsertTaskQuery = `-- name: UpsertTask :exec
INSERT INTO hyrex_task_def (task_name, cron_expr, source_code, last_updated)
VALUES ($1, $2, $3, NOW())
ON CONFLICT (task_name)
DO UPDATE SET 
    cron_expr = EXCLUDED.cron_expr,
    source_code = EXCLUDED.source_code,
    last_updated = NOW()`;

export interface UpsertTaskArgs {
    taskName: string;
    cronExpr: string | null;
    sourceCode: string | null;
}

export async function upsertTask(client: Client, args: UpsertTaskArgs): Promise<void> {
    await client.query({
        text: upsertTaskQuery,
        values: [args.taskName, args.cronExpr, args.sourceCode],
        rowMode: "array"
    });
}

