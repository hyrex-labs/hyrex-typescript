export const SET_ORPHANED_TASK_EXECUTION_TO_LOST = `
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
);
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
