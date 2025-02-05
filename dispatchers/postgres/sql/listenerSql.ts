export const CreateHyrexListenerTable = `
    CREATE TABLE IF NOT EXISTS hyrex_listener
    (
        listener_name TEXT        NOT NULL PRIMARY KEY,
        source_code   TEXT,
        is_active     BOOLEAN     NOT NULL DEFAULT TRUE,
        lock_acquired_at   timestamptz DEFAULT NULL,
        lock_released_at    timestamptz DEFAULT NULL
    );
`

export const REGISTER_HYREX_LISTENER = `
    INSERT INTO hyrex_listener (
        listener_name,
        source_code,
        is_active,
        lock_acquired_at,
        lock_released_at
    )
    VALUES (
        $1,
        $2,
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
`
