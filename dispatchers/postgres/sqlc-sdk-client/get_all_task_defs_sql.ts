import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const getAllTaskDefsQuery = `-- name: GetAllTaskDefs :many
SELECT task_name, cron_expr, source_code, default_config, arg_schema, last_updated FROM hyrex_task_def
ORDER BY task_name`;

export interface GetAllTaskDefsRow {
    taskName: string;
    cronExpr: string | null;
    sourceCode: string | null;
    defaultConfig: any | null;
    argSchema: any | null;
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
            defaultConfig: row[3],
            argSchema: row[4],
            lastUpdated: row[5]
        };
    });
}

