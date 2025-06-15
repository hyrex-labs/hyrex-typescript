import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const fetchTaskWithConcurrencyLimitQuery = `-- name: FetchTaskWithConcurrencyLimit :one
WITH lock_result AS (SELECT pg_try_advisory_xact_lock(hashtext($2::VARCHAR)) AS lock_acquired),
     next_task AS (SELECT id
                   FROM hyrex_task_run,
                        lock_result
                   WHERE lock_acquired = TRUE
                     AND hyrex_task_run.queue = $2::VARCHAR
                     AND hyrex_task_run.status = 'QUEUED'::task_run_status
                     AND hyrex_task_run.task_name = ANY($3::VARCHAR[])
                     AND (SELECT COUNT(*) FROM hyrex_task_run WHERE hyrex_task_run.queue = $2::VARCHAR AND hyrex_task_run.status = 'RUNNING'::task_run_status) < $4::INT
                   ORDER BY priority ASC, queued
                       FOR UPDATE SKIP LOCKED
                   LIMIT 1)
UPDATE hyrex_task_run AS ht
SET status         = 'RUNNING'::task_run_status,
    started        = CURRENT_TIMESTAMP,
    last_heartbeat = CURRENT_TIMESTAMP,
    executor_id    = $1::UUID
FROM next_task
WHERE ht.id = next_task.id
RETURNING ht.id
    , ht.durable_id
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
    executorId: string;
    queue: string;
    taskNames: string[];
    concurrencyLimit: number;
}

export interface FetchTaskWithConcurrencyLimitRow {
    id: string;
    durableId: string;
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

export async function fetchTaskWithConcurrencyLimit(client: Client, args: FetchTaskWithConcurrencyLimitArgs): Promise<FetchTaskWithConcurrencyLimitRow | null> {
    const result = await client.query({
        text: fetchTaskWithConcurrencyLimitQuery,
        values: [args.executorId, args.queue, args.taskNames, args.concurrencyLimit],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        id: row[0],
        durableId: row[1],
        rootId: row[2],
        parentId: row[3],
        workflowRunId: row[4],
        taskName: row[5],
        args: row[6],
        queue: row[7],
        attemptNumber: row[8],
        maxRetries: row[9],
        priority: row[10],
        timeoutSeconds: row[11],
        scheduledStart: row[12],
        queued: row[13],
        started: row[14]
    };
}

