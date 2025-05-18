CREATE TABLE IF NOT EXISTS hyrex_system_logs
(
    id         UUID    NOT NULL PRIMARY KEY,
    timestamp  TIMESTAMP WITH TIME ZONE,
    event_name VARCHAR NOT NULL,
    event_body JSON    NOT NULL
);
