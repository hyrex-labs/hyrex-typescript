import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const triggerWorkflowQuery = `-- name: TriggerWorkflow :exec
SELECT trigger_workflow_run($1::UUID, $2, $3::JSONB, $4, $5, $6)`;

export interface TriggerWorkflowArgs {
    workflowRunId: string;
    workflowName: string;
    args: any;
    queue: string;
    timeoutSeconds: number;
    idempotencyKey: string;
}

export interface TriggerWorkflowRow {
    triggerWorkflowRun: string;
}

export async function triggerWorkflow(client: Client, args: TriggerWorkflowArgs): Promise<void> {
    await client.query({
        text: triggerWorkflowQuery,
        values: [args.workflowRunId, args.workflowName, args.args, args.queue, args.timeoutSeconds, args.idempotencyKey],
        rowMode: "array"
    });
}

