import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const registerWorkflowQuery = `-- name: RegisterWorkflow :exec
INSERT INTO hyrex_workflow (workflow_name, cron_expr, source_code, dag_structure, last_updated)
VALUES ($1, $2, $3, $4, NOW())
ON CONFLICT (workflow_name)
DO UPDATE SET 
    cron_expr = EXCLUDED.cron_expr,
    source_code = EXCLUDED.source_code,
    dag_structure = EXCLUDED.dag_structure,
    last_updated = NOW()`;

export interface RegisterWorkflowArgs {
    workflowName: string;
    cronExpr: string | null;
    sourceCode: string | null;
    dagStructure: any | null;
}

export async function registerWorkflow(client: Client, args: RegisterWorkflowArgs): Promise<void> {
    await client.query({
        text: registerWorkflowQuery,
        values: [args.workflowName, args.cronExpr, args.sourceCode, args.dagStructure],
        rowMode: "array"
    });
}

