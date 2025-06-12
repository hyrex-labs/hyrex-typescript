import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const skipWaitingTaskForWorkflowRunIdQuery = `-- name: SkipWaitingTaskForWorkflowRunId :exec
UPDATE hyrex_task_run
SET status   = 'skipped'::task_run_status,
    finished = CURRENT_TIMESTAMP
WHERE status = 'waiting'
  AND workflow_run_id = $1`;

export interface SkipWaitingTaskForWorkflowRunIdArgs {
    workflowRunId: string | null;
}

export async function skipWaitingTaskForWorkflowRunId(client: Client, args: SkipWaitingTaskForWorkflowRunIdArgs): Promise<void> {
    await client.query({
        text: skipWaitingTaskForWorkflowRunIdQuery,
        values: [args.workflowRunId],
        rowMode: "array"
    });
}

