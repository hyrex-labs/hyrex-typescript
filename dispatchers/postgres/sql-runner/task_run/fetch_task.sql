WITH next_task AS (SELECT id
                   FROM hyrex_task_run
                   WHERE queue = :taskQueue
                     AND status = 'queued'
                     AND task_name IN (:taskNames)
                   ORDER BY priority ASC, queued
                       FOR UPDATE SKIP LOCKED
                   LIMIT 1)
UPDATE hyrex_task_run AS ht
SET status      = 'running',
    started     = CURRENT_TIMESTAMP,
    executor_id = :executorId
FROM next_task
WHERE ht.id = next_task.id
RETURNING ht.id
    , ht.root_id
    , ht.parent_id
    , ht.workflow_run_id
    , ht.task_name
    , ht.args
    , ht.queue
    , ht.attempt_number
    , ht.max_retries
    , ht.priority
    , ht.timeout_seconds
    , ht.scheduled_start
    , ht.queued
    , ht.started;
