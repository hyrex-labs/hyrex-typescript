import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const createSystemLogTableQuery = `-- name: CreateSystemLogTable :exec
CREATE TABLE IF NOT EXISTS hyrex_system_logs
(
    id         UUID    NOT NULL PRIMARY KEY,
    timestamp  TIMESTAMP WITH TIME ZONE,
    event_name VARCHAR NOT NULL,
    event_body JSON    NOT NULL
)`;

export async function createSystemLogTable(client: Client): Promise<void> {
    await client.query({
        text: createSystemLogTableQuery,
        values: [],
        rowMode: "array"
    });
}

