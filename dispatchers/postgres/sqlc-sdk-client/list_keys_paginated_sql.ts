import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const listKeysPaginatedQuery = `-- name: ListKeysPaginated :many
SELECT key, value, created_at 
FROM hyrex_kv 
ORDER BY created_at DESC
LIMIT $1
OFFSET $2`;

export interface ListKeysPaginatedArgs {
    limit: string;
    offset: string;
}

export interface ListKeysPaginatedRow {
    key: string;
    value: string;
    createdAt: Date;
}

export async function listKeysPaginated(client: Client, args: ListKeysPaginatedArgs): Promise<ListKeysPaginatedRow[]> {
    const result = await client.query({
        text: listKeysPaginatedQuery,
        values: [args.limit, args.offset],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            key: row[0],
            value: row[1],
            createdAt: row[2]
        };
    });
}

