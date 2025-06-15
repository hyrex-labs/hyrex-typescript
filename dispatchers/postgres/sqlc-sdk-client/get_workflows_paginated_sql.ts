import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const getWorkflowsPaginatedQuery = `-- name: GetWorkflowsPaginated :many
SELECT 
    ROW_NUMBER() OVER (ORDER BY last_updated DESC) as row_number,
    workflow_name,
    cron_expr,
    source_code,
    dag_structure,
    last_updated
FROM hyrex_workflow
ORDER BY last_updated DESC
LIMIT $1 OFFSET $2`;

export interface GetWorkflowsPaginatedArgs {
    limit: string;
    offset: string;
}

export interface GetWorkflowsPaginatedRow {
    rowNumber: string;
    workflowName: string;
    cronExpr: string | null;
    sourceCode: string | null;
    dagStructure: any | null;
    lastUpdated: Date | null;
}

export async function getWorkflowsPaginated(client: Client, args: GetWorkflowsPaginatedArgs): Promise<GetWorkflowsPaginatedRow[]> {
    const result = await client.query({
        text: getWorkflowsPaginatedQuery,
        values: [args.limit, args.offset],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            rowNumber: row[0],
            workflowName: row[1],
            cronExpr: row[2],
            sourceCode: row[3],
            dagStructure: row[4],
            lastUpdated: row[5]
        };
    });
}

