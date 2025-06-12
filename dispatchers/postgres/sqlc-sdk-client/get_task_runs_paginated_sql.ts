import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const getTaskRunsPaginatedQuery = `-- name: GetTaskRunsPaginated :many
SELECT 
    ROW_NUMBER() OVER (ORDER BY queued DESC) as row_number,
    id,
    durable_id,
    root_id,
    parent_id,
    task_name,
    args,
    queue,
    max_retries,
    priority,
    status,
    attempt_number,
    scheduled_start,
    executor_id,
    queued,
    started,
    finished,
    log_link
FROM hyrex_task_run
ORDER BY queued DESC
LIMIT $1 OFFSET $2`;

export interface GetTaskRunsPaginatedArgs {
    limit: string;
    offset: string;
}

export interface GetTaskRunsPaginatedRow {
    rowNumber: string;
    id: string;
    durableId: string;
    rootId: string;
    parentId: string | null;
    taskName: string;
    args: any;
    queue: string;
    maxRetries: number;
    priority: number;
    status: string;
    attemptNumber: number;
    scheduledStart: Date | null;
    executorId: string | null;
    queued: Date | null;
    started: Date | null;
    finished: Date | null;
    logLink: string | null;
}

export async function getTaskRunsPaginated(client: Client, args: GetTaskRunsPaginatedArgs): Promise<GetTaskRunsPaginatedRow[]> {
    const result = await client.query({
        text: getTaskRunsPaginatedQuery,
        values: [args.limit, args.offset],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            rowNumber: row[0],
            id: row[1],
            durableId: row[2],
            rootId: row[3],
            parentId: row[4],
            taskName: row[5],
            args: row[6],
            queue: row[7],
            maxRetries: row[8],
            priority: row[9],
            status: row[10],
            attemptNumber: row[11],
            scheduledStart: row[12],
            executorId: row[13],
            queued: row[14],
            started: row[15],
            finished: row[16],
            logLink: row[17]
        };
    });
}

