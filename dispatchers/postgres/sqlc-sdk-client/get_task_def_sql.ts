import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const getTaskDefQuery = `-- name: GetTaskDef :one
SELECT task_name, cron_expr, source_code, default_config, arg_schema, last_updated FROM hyrex_task_def
WHERE task_name = $1`;

export interface GetTaskDefArgs {
    taskName: string;
}

export interface GetTaskDefRow {
    taskName: string;
    cronExpr: string | null;
    sourceCode: string | null;
    defaultConfig: any | null;
    argSchema: any | null;
    lastUpdated: Date | null;
}

export async function getTaskDef(client: Client, args: GetTaskDefArgs): Promise<GetTaskDefRow | null> {
    const result = await client.query({
        text: getTaskDefQuery,
        values: [args.taskName],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        taskName: row[0],
        cronExpr: row[1],
        sourceCode: row[2],
        defaultConfig: row[3],
        argSchema: row[4],
        lastUpdated: row[5]
    };
}

