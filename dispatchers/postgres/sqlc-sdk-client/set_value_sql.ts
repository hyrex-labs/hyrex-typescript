import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const setValueQuery = `-- name: SetValue :exec
INSERT INTO hyrex_kv (key, value) 
VALUES ($1, $2)
ON CONFLICT (key) 
DO UPDATE SET value = EXCLUDED.value, created_at = CURRENT_TIMESTAMP`;

export interface SetValueArgs {
    key: string;
    value: string;
}

export async function setValue(client: Client, args: SetValueArgs): Promise<void> {
    await client.query({
        text: setValueQuery,
        values: [args.key, args.value],
        rowMode: "array"
    });
}

