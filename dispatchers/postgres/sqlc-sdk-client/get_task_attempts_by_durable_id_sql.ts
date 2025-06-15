import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const getTaskAttemptsByDurableIdQuery = `-- name: GetTaskAttemptsByDurableId :many
SELECT 
    tr.id,
    tr.durable_id,
    tr.root_id,
    tr.parent_id,
    tr.task_name,
    tr.args,
    tr.queue,
    tr.max_retries,
    tr.priority,
    tr.status,
    tr.attempt_number,
    tr.scheduled_start,
    tr.executor_id,
    tr.queued,
    tr.started,
    tr.finished,
    tr.log_link,
    t.source_code,
    res.result
FROM hyrex_task_run tr
LEFT JOIN hyrex_task_def t ON tr.task_name = t.task_name
LEFT JOIN hyrex_task_result res ON tr.id = res.task_id
WHERE tr.durable_id = $1
ORDER BY tr.attempt_number DESC`;

export interface GetTaskAttemptsByDurableIdArgs {
    durableId: string;
}

export interface GetTaskAttemptsByDurableIdRow {
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
    sourceCode: string | null;
    result: any | null;
}

export async function getTaskAttemptsByDurableId(client: Client, args: GetTaskAttemptsByDurableIdArgs): Promise<GetTaskAttemptsByDurableIdRow[]> {
    const result = await client.query({
        text: getTaskAttemptsByDurableIdQuery,
        values: [args.durableId],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            id: row[0],
            durableId: row[1],
            rootId: row[2],
            parentId: row[3],
            taskName: row[4],
            args: row[5],
            queue: row[6],
            maxRetries: row[7],
            priority: row[8],
            status: row[9],
            attemptNumber: row[10],
            scheduledStart: row[11],
            executorId: row[12],
            queued: row[13],
            started: row[14],
            finished: row[15],
            logLink: row[16],
            sourceCode: row[17],
            result: row[18]
        };
    });
}

