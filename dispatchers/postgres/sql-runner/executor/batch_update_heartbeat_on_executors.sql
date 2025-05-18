UPDATE hyrex_executor
SET last_heartbeat = NOW()
WHERE id = ANY (:executorIds::uuid[]);
