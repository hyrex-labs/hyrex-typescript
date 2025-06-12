import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const fetchTaskQuery = `-- name: FetchTask :exec
WITH next_task AS (SELECT id
                   FROM hyrex_task_run
                   WHERE hyrex_task_run.queue = $1
                     AND hyrex_task_run.status = 'queued'
                     AND hyrex_task_run.task_name IN ($2)
                   ORDER BY priority ASC, queued
                       FOR UPDATE SKIP LOCKED
                   LIMIT 1)
UPDATE hyrex_task_run AS ht
SET status      = 'running',
    started     = CURRENT_TIMESTAMP,
    executor_id = $3
FROM next_task
WHERE ht.id = next_task.id
RETURNING ht.id
    , ht.root_id
    , ht.parent_id
    , ht.workflow_run_id
    , ht.task_name
    , ht.args
    , ht.queue
    , ht.attempt_number
    , ht.max_retries
    , ht.priority
    , ht.timeout_seconds
    , ht.scheduled_start
    , ht.queued
    , ht.started`;

export interface FetchTaskArgs {
    queue: string;
    taskName: string;
    executorId: string | null;
}

export interface FetchTaskRow {
    id: string;
    rootId: string;
    parentId: string | null;
    workflowRunId: string | null;
    taskName: string;
    args: any;
    queue: string;
    attemptNumber: number;
    maxRetries: number;
    priority: number;
    timeoutSeconds: number | null;
    scheduledStart: Date | null;
    queued: Date | null;
    started: Date | null;
}

export async function fetchTask(client: Client, args: FetchTaskArgs): Promise<void> {
    await client.query({
        text: fetchTaskQuery,
        values: [args.queue, args.taskName, args.executorId],
        rowMode: "array"
    });
}

