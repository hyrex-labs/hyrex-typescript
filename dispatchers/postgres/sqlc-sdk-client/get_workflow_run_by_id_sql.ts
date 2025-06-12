import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const getWorkflowRunByIdQuery = `-- name: GetWorkflowRunById :one
SELECT 
    id,
    parent_id,
    workflow_name,
    args,
    queue,
    timeout_seconds,
    status,
    scheduled_start,
    queued,
    started,
    finished,
    last_heartbeat,
    idempotency_key
FROM hyrex_workflow_run
WHERE id = $1`;

export interface GetWorkflowRunByIdArgs {
    id: string;
}

export interface GetWorkflowRunByIdRow {
    id: string;
    parentId: string | null;
    workflowName: string;
    args: any;
    queue: string;
    timeoutSeconds: number | null;
    status: string;
    scheduledStart: Date | null;
    queued: Date | null;
    started: Date | null;
    finished: Date | null;
    lastHeartbeat: Date | null;
    idempotencyKey: string | null;
}

export async function getWorkflowRunById(client: Client, args: GetWorkflowRunByIdArgs): Promise<GetWorkflowRunByIdRow | null> {
    const result = await client.query({
        text: getWorkflowRunByIdQuery,
        values: [args.id],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        id: row[0],
        parentId: row[1],
        workflowName: row[2],
        args: row[3],
        queue: row[4],
        timeoutSeconds: row[5],
        status: row[6],
        scheduledStart: row[7],
        queued: row[8],
        started: row[9],
        finished: row[10],
        lastHeartbeat: row[11],
        idempotencyKey: row[12]
    };
}

