import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const advanceWorkflowRunFuncQuery = `-- name: AdvanceWorkflowRunFunc :many
SELECT advance_workflow_run FROM advance_workflow_run($1::UUID)`;

export interface AdvanceWorkflowRunFuncArgs {
    workflowRunId: string;
}

export interface AdvanceWorkflowRunFuncRow {
    advanceWorkflowRun: string | null;
}

export async function advanceWorkflowRunFunc(client: Client, args: AdvanceWorkflowRunFuncArgs): Promise<AdvanceWorkflowRunFuncRow[]> {
    const result = await client.query({
        text: advanceWorkflowRunFuncQuery,
        values: [args.workflowRunId],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            advanceWorkflowRun: row[0]
        };
    });
}

