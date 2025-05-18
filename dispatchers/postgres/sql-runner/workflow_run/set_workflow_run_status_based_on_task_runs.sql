WITH latest_attempts AS (
    -- Get the latest attempt for each durable_id
    SELECT DISTINCT ON (durable_id)
        durable_id,
        workflow_run_id,
        status,
        attempt_number,
        max_retries
    FROM hyrex_task_run
    ORDER BY durable_id, attempt_number DESC
),
     workflow_statuses AS (
         SELECT w.id AS workflow_run_id,
                CASE
                    -- If any task has failed on its final attempt, workflow is failed
                    WHEN EXISTS (
                        SELECT 1
                        FROM latest_attempts
                        WHERE latest_attempts.workflow_run_id = w.id
                          AND status = 'failed'
                          AND attempt_number >= max_retries
                    ) THEN 'failed'::workflow_run_status

                    -- If any task is still in progress, workflow is running
                    WHEN EXISTS (
                        SELECT 1
                        FROM latest_attempts
                        WHERE latest_attempts.workflow_run_id = w.id
                          AND status IN ('running', 'queued', 'waiting', 'up_for_cancel')
                    ) THEN 'running'::workflow_run_status

                    -- If all tasks are either success or skipped, workflow is success
                    WHEN NOT EXISTS (
                        SELECT 1
                        FROM latest_attempts
                        WHERE latest_attempts.workflow_run_id = w.id
                          AND status NOT IN ('success', 'skipped')
                    ) THEN 'success'::workflow_run_status

                    -- Handle other states (lost, canceled)
                    WHEN EXISTS (
                        SELECT 1
                        FROM latest_attempts
                        WHERE latest_attempts.workflow_run_id = w.id
                          AND status IN ('lost', 'canceled')
                    ) THEN 'failed'::workflow_run_status

                    -- Otherwise, keep current status
                    ELSE w.status
                    END AS new_status
         FROM hyrex_workflow_run w
         WHERE w.id = :workflowRunId -- Specific workflow
           AND w.status NOT IN ('success', 'failed') -- Only if not in terminal state
     )
UPDATE hyrex_workflow_run w
SET status   = ws.new_status,
    finished = CASE
                   WHEN ws.new_status IN ('success', 'failed')
                       THEN CURRENT_TIMESTAMP
                   ELSE w.finished
        END
FROM workflow_statuses ws
WHERE w.id = ws.workflow_run_id
RETURNING w.id, w.status;
