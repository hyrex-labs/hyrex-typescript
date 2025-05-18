CREATE TABLE IF NOT EXISTS hyrex_task
(
    task_name    TEXT NOT NULL PRIMARY KEY,
    cron_expr    TEXT,
    source_code  TEXT,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
