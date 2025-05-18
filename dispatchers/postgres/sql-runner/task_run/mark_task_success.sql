UPDATE hyrex_task_run
SET status   = CASE
                   WHEN status = 'running' THEN 'success'::task_run_status
                   WHEN status = 'up_for_cancel' THEN 'canceled'::task_run_status
    END,
    finished = CURRENT_TIMESTAMP
WHERE id = :taskId
  AND status IN ('running', 'up_for_cancel')
