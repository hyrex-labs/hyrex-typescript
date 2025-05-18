UPDATE hyrex_task_run
SET status   = 'skipped'::task_run_status,
    finished = CURRENT_TIMESTAMP
WHERE status = 'waiting'
  AND workflow_run_id = :workflowRunId
