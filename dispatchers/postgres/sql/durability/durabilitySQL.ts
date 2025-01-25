export const SET_ORPHANED_TASK_EXECUTION_TO_LOST_AND_RETRY = `
    WITH lost_tasks AS (
        UPDATE hyrex_task_execution
            SET status = 'lost'
            WHERE status = 'running'
                AND (
                      executor_id IS NULL
                          OR NOT EXISTS (
                          SELECT 1
                          FROM hyrex_executor
                          WHERE hyrex_executor.id = hyrex_task_execution.executor_id
                            AND hyrex_executor.status = 'RUNNING'
                      )
                      )
            RETURNING *
    )
    INSERT INTO hyrex_task_execution (
        id,
        durable_id,
        root_id,
        parent_id,
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
    WHERE attempt_number < max_retries;
`

export const SET_EXECUTOR_TO_LOST_IF_NO_HEARTBEAT = `
UPDATE hyrex_executor
SET status = 'LOST'
WHERE status = 'RUNNING'
AND (
    last_heartbeat IS NULL 
    OR last_heartbeat < (NOW() - INTERVAL '5 minutes')
);
`
