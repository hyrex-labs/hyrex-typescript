import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const getTaskByNameQuery = `-- name: GetTaskByName :one
SELECT 
    task_name,
    cron_expr,
    source_code,
    last_updated
FROM hyrex_task_def
WHERE task_name = $1`;

export interface GetTaskByNameArgs {
    taskName: string;
}

export interface GetTaskByNameRow {
    taskName: string;
    cronExpr: string | null;
    sourceCode: string | null;
    lastUpdated: Date | null;
}

export async function getTaskByName(client: Client, args: GetTaskByNameArgs): Promise<GetTaskByNameRow | null> {
    const result = await client.query({
        text: getTaskByNameQuery,
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
        lastUpdated: row[3]
    };
}

