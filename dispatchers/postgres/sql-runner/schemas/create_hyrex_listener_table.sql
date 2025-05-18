CREATE TABLE IF NOT EXISTS hyrex_listener
(
    listener_name TEXT        NOT NULL PRIMARY KEY,
    source_code   TEXT,
    is_active     BOOLEAN     NOT NULL DEFAULT TRUE,
    lock_acquired_at   timestamptz DEFAULT NULL,
    lock_released_at    timestamptz DEFAULT NULL
);
