import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const getTasksPaginatedQuery = `-- name: GetTasksPaginated :exec
SELECT 
    ROW_NUMBER() OVER (ORDER BY last_updated DESC) as row_number,
    task_name,
    cron_expr,
    source_code,
    last_updated
FROM hyrex_task_def
ORDER BY last_updated DESC
LIMIT $1 OFFSET $2`;

export interface GetTasksPaginatedArgs {
    limit: string;
    offset: string;
}

export interface GetTasksPaginatedRow {
    rowNumber: string;
    taskName: string;
    cronExpr: string | null;
    sourceCode: string | null;
    lastUpdated: Date | null;
}

export async function getTasksPaginated(client: Client, args: GetTasksPaginatedArgs): Promise<void> {
    await client.query({
        text: getTasksPaginatedQuery,
        values: [args.limit, args.offset],
        rowMode: "array"
    });
}

