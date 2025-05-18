UPDATE hyrex_task_run
SET status   = 'canceled'::task_run_status,
    finished = CURRENT_TIMESTAMP
WHERE id = :taskId
  AND status = 'up_for_cancel'
