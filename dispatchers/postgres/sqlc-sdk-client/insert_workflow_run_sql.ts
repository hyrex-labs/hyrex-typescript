import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const insertWorkflowRunQuery = `-- name: InsertWorkflowRun :exec
INSERT INTO hyrex_workflow_run (
  id,
  parent_id,
  workflow_name,
  args,
  queue,
  timeout_seconds,
  status,
  queued,
  last_heartbeat,
  idempotency_key
)
VALUES ($1, NULL, $2, $3::jsonb, $4, $5, 'running'::workflow_run_status, now(), now(), $6)
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

export async function insertWorkflowRun(client: Client, args: InsertWorkflowRunArgs): Promise<void> {
    await client.query({
        text: insertWorkflowRunQuery,
        values: [args.id, args.workflowName, args.args, args.queue, args.timeoutSeconds, args.idempotencyKey],
        rowMode: "array"
    });
}

