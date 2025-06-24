import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const registerTaskDefQuery = `-- name: RegisterTaskDef :exec
INSERT INTO hyrex_task_def (task_name, cron_expr, source_code, arg_schema, queue, priority, max_retries, timeout_seconds, last_updated)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
ON CONFLICT (task_name)
DO UPDATE SET
    cron_expr = EXCLUDED.cron_expr,
    source_code = EXCLUDED.source_code,
    arg_schema = EXCLUDED.arg_schema,
    queue = EXCLUDED.queue,
    priority = EXCLUDED.priority,
    max_retries = EXCLUDED.max_retries,
    timeout_seconds = EXCLUDED.timeout_seconds,
    last_updated = NOW()`;

export interface RegisterTaskDefArgs {
    taskName: string;
    cronExpr: string | null;
    sourceCode: string | null;
    argSchema: any | null;
    queue: string | null;
    priority: number | null;
    maxRetries: number | null;
    timeoutSeconds: number | null;
}

export async function registerTaskDef(client: Client, args: RegisterTaskDefArgs): Promise<void> {
    await client.query({
        text: registerTaskDefQuery,
        values: [args.taskName, args.cronExpr, args.sourceCode, args.argSchema, args.queue, args.priority, args.maxRetries, args.timeoutSeconds],
        rowMode: "array"
    });
}

