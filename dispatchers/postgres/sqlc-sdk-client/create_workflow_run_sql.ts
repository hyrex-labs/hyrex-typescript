import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const createWorkflowRunQuery = `-- name: CreateWorkflowRun :one
SELECT to_json(result) FROM trigger_workflow_run(
    $1::UUID, 
    $2, 
    $3::JSON, 
    $4, 
    $5, 
    $6
) AS result`;

export interface CreateWorkflowRunArgs {
    workflowRunId: string;
    workflowName: string;
    args: any;
    queue: string;
    timeoutSeconds: number;
    idempotencyKey: string;
}

export interface CreateWorkflowRunRow {
    result: string | null;
}

export async function createWorkflowRun(client: Client, args: CreateWorkflowRunArgs): Promise<CreateWorkflowRunRow | null> {
    const result = await client.query({
        text: createWorkflowRunQuery,
        values: [args.workflowRunId, args.workflowName, args.args, args.queue, args.timeoutSeconds, args.idempotencyKey],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        result: row[0]
    };
}

