import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const deleteValueQuery = `-- name: DeleteValue :exec
DELETE FROM hyrex_kv WHERE key = $1`;

export interface DeleteValueArgs {
    key: string;
}

export async function deleteValue(client: Client, args: DeleteValueArgs): Promise<void> {
    await client.query({
        text: deleteValueQuery,
        values: [args.key],
        rowMode: "array"
    });
}

