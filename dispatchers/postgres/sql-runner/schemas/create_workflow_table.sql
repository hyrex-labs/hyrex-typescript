CREATE TABLE IF NOT EXISTS hyrex_workflow
(
    workflow_name TEXT NOT NULL PRIMARY KEY,
    cron_expr     TEXT,
    source_code   TEXT,
    dag_structure JSON,
    last_updated  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
