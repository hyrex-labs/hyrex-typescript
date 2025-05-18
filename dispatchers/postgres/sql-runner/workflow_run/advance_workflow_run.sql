WITH latest_attempts AS (
    -- Get the latest attempt for each durable_id
    SELECT DISTINCT ON (durable_id) durable_id,
                                    status
    FROM hyrex_task_run
    ORDER BY durable_id, attempt_number DESC),
     tasks_ready_to_queue AS (
         -- Find waiting tasks where all dependencies are successful
         SELECT t.id
         FROM hyrex_task_run t
         WHERE t.workflow_run_id = :workflowRunId
           AND t.status = 'waiting'
           AND (
             -- Handle both cases: no dependencies, or all dependencies are successful
             t.workflow_dependencies IS NULL
                 OR NOT EXISTS (
                 -- Check if there are any dependencies that aren't successful
                 SELECT 1
                 FROM unnest(t.workflow_dependencies) AS dep_durable_id
                          LEFT JOIN latest_attempts la ON la.durable_id = dep_durable_id
                 WHERE la.status IS NULL
                    OR la.status != 'success')
             ))
UPDATE hyrex_task_run
SET status = 'queued'
WHERE id IN (SELECT id FROM tasks_ready_to_queue)
RETURNING status, workflow_run_id;
