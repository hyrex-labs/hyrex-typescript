UPDATE hyrex_scheduler_lock
SET is_active    = false,
    release_at   = now(),
    heartbeat_at = now()
WHERE lockid = 1
  AND worker_name = :workerName
RETURNING lockid;
