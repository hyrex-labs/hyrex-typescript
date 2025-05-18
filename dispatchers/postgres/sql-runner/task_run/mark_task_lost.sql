UPDATE hyrex_task_run
SET status   = 'lost'::task_run_status,
    finished = CURRENT_TIMESTAMP
WHERE id = :taskId
