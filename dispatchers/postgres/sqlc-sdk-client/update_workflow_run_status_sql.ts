import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const updateWorkflowRunStatusQuery = `-- name: UpdateWorkflowRunStatus :exec
UPDATE hyrex_workflow_run
SET status = $1::workflow_run_status,
    last_heartbeat = now(),
    finished = CASE 
        WHEN $1::workflow_run_status IN ('SUCCESS', 'FAILED', 'CANCELED') THEN now()
        ELSE finished
    END
WHERE id = $2`;

export interface UpdateWorkflowRunStatusArgs {
    status: string;
    id: string;
}

export async function updateWorkflowRunStatus(client: Client, args: UpdateWorkflowRunStatusArgs): Promise<void> {
    await client.query({
        text: updateWorkflowRunStatusQuery,
        values: [args.status, args.id],
        rowMode: "array"
    });
}

