import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const fetchTaskWithConcurrencyLimitQuery = `-- name: FetchTaskWithConcurrencyLimit :exec
WITH lock_result AS (SELECT pg_try_advisory_xact_lock(hashtext($1)) AS lock_acquired),
     next_task AS (SELECT id
                   FROM hyrex_task_run,
                        lock_result
                   WHERE lock_acquired = TRUE
                     AND hyrex_task_run.queue = $1
                     AND hyrex_task_run.status = 'queued'
                     AND hyrex_task_run.task_name = ANY($2)
                     AND (SELECT COUNT(*) FROM hyrex_task_run WHERE hyrex_task_run.queue = $1 AND hyrex_task_run.status = 'running') < $3
                   ORDER BY priority ASC, queued
                       FOR UPDATE SKIP LOCKED
                   LIMIT 1)
UPDATE hyrex_task_run AS ht
SET status         = 'running',
    started        = CURRENT_TIMESTAMP,
    last_heartbeat = CURRENT_TIMESTAMP,
    executor_id    = $4
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

export interface FetchTaskWithConcurrencyLimitArgs {
    hashtext: string;
    taskName: string;
    queue: string;
    executorId: string | null;
}

export interface FetchTaskWithConcurrencyLimitRow {
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

export async function fetchTaskWithConcurrencyLimit(client: Client, args: FetchTaskWithConcurrencyLimitArgs): Promise<void> {
    await client.query({
        text: fetchTaskWithConcurrencyLimitQuery,
        values: [args.hashtext, args.taskName, args.queue, args.executorId],
        rowMode: "array"
    });
}

