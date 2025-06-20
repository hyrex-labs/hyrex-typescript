import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const createHyrexKvTableQuery = `-- name: CreateHyrexKvTable :exec
CREATE TABLE IF NOT EXISTS hyrex_kv (
    key VARCHAR NOT NULL PRIMARY KEY,
    value TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
)`;

export async function createHyrexKvTable(client: Client): Promise<void> {
    await client.query({
        text: createHyrexKvTableQuery,
        values: [],
        rowMode: "array"
    });
}

