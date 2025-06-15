import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const getWorkflowByNameQuery = `-- name: GetWorkflowByName :one
SELECT 
    workflow_name,
    cron_expr,
    source_code,
    dag_structure,
    last_updated
FROM hyrex_workflow
WHERE workflow_name = $1`;

export interface GetWorkflowByNameArgs {
    workflowName: string;
}

export interface GetWorkflowByNameRow {
    workflowName: string;
    cronExpr: string | null;
    sourceCode: string | null;
    dagStructure: any | null;
    lastUpdated: Date | null;
}

export async function getWorkflowByName(client: Client, args: GetWorkflowByNameArgs): Promise<GetWorkflowByNameRow | null> {
    const result = await client.query({
        text: getWorkflowByNameQuery,
        values: [args.workflowName],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        workflowName: row[0],
        cronExpr: row[1],
        sourceCode: row[2],
        dagStructure: row[3],
        lastUpdated: row[4]
    };
}

