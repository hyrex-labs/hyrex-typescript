import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const createResultsTableQuery = `-- name: CreateResultsTable :exec
CREATE TABLE IF NOT EXISTS hyrex_task_result
(
    task_id    UUID PRIMARY KEY REFERENCES public.hyrex_task_run (id) ON DELETE CASCADE,
    result     JSON,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
)`;

export async function createResultsTable(client: Client): Promise<void> {
    await client.query({
        text: createResultsTableQuery,
        values: [],
        rowMode: "array"
    });
}

