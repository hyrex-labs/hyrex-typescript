WITH updated AS (
    UPDATE hyrex_executor
        SET last_heartbeat = CURRENT_TIMESTAMP,
            stats = :stats
        WHERE id = :executorId
            AND status = 'RUNNING'::executor_status
        RETURNING id, status, last_heartbeat, stats),
     executor_state AS (SELECT CASE WHEN u.id IS NOT NULL THEN 'ACCEPTED' ELSE 'REJECTED' END AS result,
                               COALESCE(u.status, e.status)                                   AS status,
                               COALESCE(u.last_heartbeat, e.last_heartbeat)                   AS last_heartbeat,
                               COALESCE(u.stats, e.stats)                                     AS stats
                        FROM hyrex_executor e
                                 LEFT JOIN updated u ON e.id = u.id
                        WHERE e.id = :executorId),
     insert_log AS (
         INSERT INTO hyrex_system_logs (id, timestamp, event_name, event_body)
             SELECT gen_random_uuid(),
                    CURRENT_TIMESTAMP,
                    'HEARTBEAT_REJECTED',
                    json_build_object('executor_id', :executorId, 'current_status', es.status, 'stats', :stats)
             FROM executor_state es
             WHERE es.result = 'REJECTED'
             RETURNING NULL)
SELECT es.*
FROM executor_state es;
