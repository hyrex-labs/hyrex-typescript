import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const createAppTableQuery = `-- name: CreateAppTable :exec
CREATE TABLE IF NOT EXISTS hyrex_app
(
    id       BIGSERIAL NOT NULL PRIMARY KEY,
    app_info JSON
)`;

export async function createAppTable(client: Client): Promise<void> {
    await client.query({
        text: createAppTableQuery,
        values: [],
        rowMode: "array"
    });
}

