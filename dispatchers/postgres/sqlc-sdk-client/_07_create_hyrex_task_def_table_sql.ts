import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const createTaskDefTableQuery = `-- name: CreateTaskDefTable :exec
CREATE TABLE IF NOT EXISTS hyrex_task_def
(
    task_name        TEXT NOT NULL PRIMARY KEY,
    cron_expr        TEXT,
    source_code      TEXT,
    arg_schema       JSON,
    queue            TEXT,
    priority         INTEGER,
    max_retries      INTEGER,
    timeout_seconds  INTEGER CHECK (timeout_seconds IS NULL OR timeout_seconds > 0),
    last_updated     TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
)`;

export async function createTaskDefTable(client: Client): Promise<void> {
    await client.query({
        text: createTaskDefTableQuery,
        values: [],
        rowMode: "array"
    });
}

