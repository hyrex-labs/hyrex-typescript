import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const setOrphanedTaskExecutionToLostAndRetryQuery = `-- name: SetOrphanedTaskExecutionToLostAndRetry :exec
WITH lost_tasks AS (
    UPDATE hyrex_task_run
        SET status = 'LOST'::task_run_status
        WHERE status = 'RUNNING'::task_run_status
            AND (
                  executor_id IS NULL
                      OR NOT EXISTS (
                      SELECT 1
                      FROM hyrex_executor
                      WHERE hyrex_executor.id = hyrex_task_run.executor_id
                        AND hyrex_executor.status = 'RUNNING'::executor_status
                  )
                  )
        RETURNING id, durable_id, root_id, parent_id, workflow_run_id, workflow_dependencies, task_name, args, queue, max_retries, priority, timeout_seconds, status, attempt_number, scheduled_start, executor_id, queued, started, finished, last_heartbeat, idempotency_key, log_link
)
INSERT INTO hyrex_task_run (
    id,
    durable_id,
    root_id,
    parent_id,
    workflow_run_id,
    workflow_dependencies,
    task_name,
    args,
    queue,
    max_retries,
    priority,
    timeout_seconds,
    status,
    attempt_number,
    idempotency_key,
    queued
)
SELECT
    gen_random_uuid(),
    durable_id,
    root_id,
    parent_id,
    workflow_run_id,
    workflow_dependencies,
    task_name,
    args,
    queue,
    max_retries,
    priority,
    timeout_seconds,
    'queued',
    attempt_number + 1,
    idempotency_key,
    NOW()
FROM lost_tasks
WHERE attempt_number < max_retries`;

export async function setOrphanedTaskExecutionToLostAndRetry(client: Client): Promise<void> {
    await client.query({
        text: setOrphanedTaskExecutionToLostAndRetryQuery,
        values: [],
        rowMode: "array"
    });
}

