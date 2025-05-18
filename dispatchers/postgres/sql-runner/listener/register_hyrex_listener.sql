INSERT INTO hyrex_listener (
    listener_name,
    source_code,
    is_active,
    lock_acquired_at,
    lock_released_at
)
VALUES (
    :listenerName,
    :sourceCode,
    TRUE,
    NULL,
    NULL
)
ON CONFLICT (listener_name) 
DO UPDATE SET
    source_code = EXCLUDED.source_code,
    is_active = TRUE,
    lock_acquired_at = NULL,
    lock_released_at = NULL
RETURNING *;
