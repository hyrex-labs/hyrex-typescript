import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const getWorkflowRunsPaginatedQuery = `-- name: GetWorkflowRunsPaginated :many
SELECT 
    ROW_NUMBER() OVER (ORDER BY queued DESC) as row_number,
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
ORDER BY queued DESC
LIMIT $1 OFFSET $2`;

export interface GetWorkflowRunsPaginatedArgs {
    limit: string;
    offset: string;
}

export interface GetWorkflowRunsPaginatedRow {
    rowNumber: string;
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

export async function getWorkflowRunsPaginated(client: Client, args: GetWorkflowRunsPaginatedArgs): Promise<GetWorkflowRunsPaginatedRow[]> {
    const result = await client.query({
        text: getWorkflowRunsPaginatedQuery,
        values: [args.limit, args.offset],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            rowNumber: row[0],
            id: row[1],
            parentId: row[2],
            workflowName: row[3],
            args: row[4],
            queue: row[5],
            timeoutSeconds: row[6],
            status: row[7],
            scheduledStart: row[8],
            queued: row[9],
            started: row[10],
            finished: row[11],
            lastHeartbeat: row[12],
            idempotencyKey: row[13]
        };
    });
}

