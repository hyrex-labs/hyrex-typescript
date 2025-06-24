import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const getAllTaskDefsQuery = `-- name: GetAllTaskDefs :many
SELECT task_name, cron_expr, source_code, arg_schema, queue, priority, max_retries, timeout_seconds, last_updated FROM hyrex_task_def
ORDER BY task_name`;

export interface GetAllTaskDefsRow {
    taskName: string;
    cronExpr: string | null;
    sourceCode: string | null;
    argSchema: any | null;
    queue: string | null;
    priority: number | null;
    maxRetries: number | null;
    timeoutSeconds: number | null;
    lastUpdated: Date | null;
}

export async function getAllTaskDefs(client: Client): Promise<GetAllTaskDefsRow[]> {
    const result = await client.query({
        text: getAllTaskDefsQuery,
        values: [],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            taskName: row[0],
            cronExpr: row[1],
            sourceCode: row[2],
            argSchema: row[3],
            queue: row[4],
            priority: row[5],
            maxRetries: row[6],
            timeoutSeconds: row[7],
            lastUpdated: row[8]
        };
    });
}

