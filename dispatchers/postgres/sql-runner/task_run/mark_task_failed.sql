UPDATE hyrex_task_run
SET status   = 'failed',
    finished = CURRENT_TIMESTAMP
WHERE id = :taskId
