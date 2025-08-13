import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const flushAllDataQuery = `-- name: FlushAllData :exec
BEGIN`;

export async function flushAllData(client: Client): Promise<void> {
    await client.query({
        text: flushAllDataQuery,
        values: [],
        rowMode: "array"
    });
}

