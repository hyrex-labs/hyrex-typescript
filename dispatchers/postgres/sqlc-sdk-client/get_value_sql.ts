import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const getValueQuery = `-- name: GetValue :one
SELECT value FROM hyrex_kv WHERE key = $1`;

export interface GetValueArgs {
    key: string;
}

export interface GetValueRow {
    value: string;
}

export async function getValue(client: Client, args: GetValueArgs): Promise<GetValueRow | null> {
    const result = await client.query({
        text: getValueQuery,
        values: [args.key],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        value: row[0]
    };
}

