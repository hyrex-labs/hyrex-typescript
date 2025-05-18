INSERT INTO hyrex_scheduler_lock (
    lockid, worker_name, acquired_at, heartbeat_at, release_at, is_active
)
VALUES (
    1,                  -- single global lock id
    :workerName,        -- workerName
    now(),              -- acquired_at
    now(),              -- heartbeat_at
    now() + CAST(:releaseDuration AS interval),  -- release_at (e.g. now + '5 minutes')
    true                -- is_active
)
ON CONFLICT (lockid)
  DO UPDATE 
     SET worker_name  = EXCLUDED.worker_name,
         acquired_at  = EXCLUDED.acquired_at,
         heartbeat_at = EXCLUDED.heartbeat_at,
         release_at   = EXCLUDED.release_at,
         is_active    = EXCLUDED.is_active
   WHERE (
       -- Only update if the lock is not truly active,
       -- i.e. is already inactive or expired:
       hyrex_scheduler_lock.is_active = false
       OR hyrex_scheduler_lock.release_at <= now()
   )
RETURNING lockid;
