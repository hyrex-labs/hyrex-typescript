import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const registerAppInfoQuery = `-- name: RegisterAppInfo :exec
INSERT INTO hyrex_app (
    id,
    app_info
) VALUES (
    $1,
    $2
)
ON CONFLICT (id) DO UPDATE SET
    app_info = $2`;

export interface RegisterAppInfoArgs {
    id: string;
    appInfo: any | null;
}

export async function registerAppInfo(client: Client, args: RegisterAppInfoArgs): Promise<void> {
    await client.query({
        text: registerAppInfoQuery,
        values: [args.id, args.appInfo],
        rowMode: "array"
    });
}

