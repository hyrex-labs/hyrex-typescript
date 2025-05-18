UPDATE hyrex_executor
SET stopped        = CURRENT_TIMESTAMP,
    last_heartbeat = CURRENT_TIMESTAMP,
    stats          = :stats,
    status         = 'SHUTDOWN'::executor_status
WHERE id = :executorId;
