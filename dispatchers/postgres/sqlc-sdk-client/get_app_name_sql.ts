import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const getAppNameQuery = `-- name: GetAppName :one
SELECT app_info->>'name' as app_name
FROM hyrex_app
LIMIT 1`;

export interface GetAppNameRow {
    appName: string | null;
}

export async function getAppName(client: Client): Promise<GetAppNameRow | null> {
    const result = await client.query({
        text: getAppNameQuery,
        values: [],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        appName: row[0]
    };
}

