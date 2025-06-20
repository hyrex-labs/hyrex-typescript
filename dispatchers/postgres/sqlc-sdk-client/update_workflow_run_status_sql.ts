import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const updateWorkflowRunStatusQuery = `-- name: UpdateWorkflowRunStatus :exec
UPDATE hyrex_workflow_run
SET status = $2::workflow_run_status,
    last_heartbeat = now()
WHERE id = $1`;

export interface UpdateWorkflowRunStatusArgs {
    id: string;
    : string;
}

export async function updateWorkflowRunStatus(client: Client, args: UpdateWorkflowRunStatusArgs): Promise<void> {
    await client.query({
        text: updateWorkflowRunStatusQuery,
        values: [args.id, args.],
        rowMode: "array"
    });
}

