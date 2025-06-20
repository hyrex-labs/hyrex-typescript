import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const registerTaskDefQuery = `-- name: RegisterTaskDef :exec
INSERT INTO hyrex_task_def (task_name, cron_expr, source_code, arg_schema, last_updated)
VALUES ($1, $2, $3, $4, NOW())
ON CONFLICT (task_name)
DO UPDATE SET
    cron_expr = EXCLUDED.cron_expr,
    source_code = EXCLUDED.source_code,
    arg_schema = EXCLUDED.arg_schema,
    last_updated = NOW()`;

export interface RegisterTaskDefArgs {
    taskName: string;
    cronExpr: string | null;
    sourceCode: string | null;
    argSchema: any | null;
}

export async function registerTaskDef(client: Client, args: RegisterTaskDefArgs): Promise<void> {
    await client.query({
        text: registerTaskDefQuery,
        values: [args.taskName, args.cronExpr, args.sourceCode, args.argSchema],
        rowMode: "array"
    });
}

