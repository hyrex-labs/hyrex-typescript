import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const flushKeysQuery = `-- name: FlushKeys :exec
DELETE FROM hyrex_kv`;

export async function flushKeys(client: Client): Promise<void> {
    await client.query({
        text: flushKeysQuery,
        values: [],
        rowMode: "array"
    });
}

