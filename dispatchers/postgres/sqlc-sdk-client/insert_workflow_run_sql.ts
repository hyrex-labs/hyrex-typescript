import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const insertWorkflowRunQuery = `-- name: InsertWorkflowRun :one
INSERT INTO hyrex_workflow_run (
    id,
    parent_id,
    workflow_name,
    args,
    queue,
    timeout_seconds,
    status,
    queued,
    started,
    last_heartbeat,
    idempotency_key
)
VALUES ($1, NULL, $2, $3, $4, $5, 'RUNNING'::workflow_run_status, now(), now(), now(), $6)
RETURNING id`;

export interface InsertWorkflowRunArgs {
    id: string;
    workflowName: string;
    args: any;
    queue: string;
    timeoutSeconds: number | null;
    idempotencyKey: string | null;
}

export interface InsertWorkflowRunRow {
    id: string;
}

export async function insertWorkflowRun(client: Client, args: InsertWorkflowRunArgs): Promise<InsertWorkflowRunRow | null> {
    const result = await client.query({
        text: insertWorkflowRunQuery,
        values: [args.id, args.workflowName, args.args, args.queue, args.timeoutSeconds, args.idempotencyKey],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        id: row[0]
    };
}

