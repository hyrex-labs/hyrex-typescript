DO $$
BEGIN
    -- Create enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'executor_status') THEN
        CREATE TYPE executor_status AS ENUM ('SHUTDOWN', 'LOST', 'RUNNING', 'UNKNOWN');
    END IF;
END$$;

-- Create or replace the table with the status column
CREATE TABLE IF NOT EXISTS hyrex_executor
(
    id             UUID    NOT NULL PRIMARY KEY,
    name           VARCHAR NOT NULL,
    worker_name    VARCHAR NOT NULL,
    queue_pattern  VARCHAR NOT NULL,
    queues         VARCHAR[] NOT NULL,
    started        TIMESTAMP WITH TIME ZONE,
    stopped        TIMESTAMP WITH TIME ZONE,
    last_heartbeat TIMESTAMP WITH TIME ZONE,
    stats          JSON,
    status         executor_status NOT NULL DEFAULT 'UNKNOWN'
);
