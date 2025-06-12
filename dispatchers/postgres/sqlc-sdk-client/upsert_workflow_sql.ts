import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const upsertWorkflowQuery = `-- name: UpsertWorkflow :exec
INSERT INTO hyrex_workflow (workflow_name, cron_expr, source_code, dag_structure, last_updated)
VALUES ($1, $2, $3, $4, NOW())
ON CONFLICT (workflow_name)
DO UPDATE SET 
    cron_expr = EXCLUDED.cron_expr,
    source_code = EXCLUDED.source_code,
    dag_structure = EXCLUDED.dag_structure,
    last_updated = NOW()`;

export interface UpsertWorkflowArgs {
    workflowName: string;
    cronExpr: string | null;
    sourceCode: string | null;
    dagStructure: any | null;
}

export async function upsertWorkflow(client: Client, args: UpsertWorkflowArgs): Promise<void> {
    await client.query({
        text: upsertWorkflowQuery,
        values: [args.workflowName, args.cronExpr, args.sourceCode, args.dagStructure],
        rowMode: "array"
    });
}

