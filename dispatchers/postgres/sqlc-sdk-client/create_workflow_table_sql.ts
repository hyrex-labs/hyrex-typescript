import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const createWorkflowTableQuery = `-- name: CreateWorkflowTable :exec
CREATE TABLE IF NOT EXISTS hyrex_workflow
(
    workflow_name TEXT NOT NULL PRIMARY KEY,
    cron_expr     TEXT,
    source_code   TEXT,
    dag_structure JSONB,
    last_updated  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
)`;

export async function createWorkflowTable(client: Client): Promise<void> {
    await client.query({
        text: createWorkflowTableQuery,
        values: [],
        rowMode: "array"
    });
}

