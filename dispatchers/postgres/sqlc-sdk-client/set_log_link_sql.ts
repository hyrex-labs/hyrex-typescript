import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const setLogLinkQuery = `-- name: SetLogLink :exec
UPDATE hyrex_task_run
SET log_link = $1
WHERE id = $2`;

export interface SetLogLinkArgs {
    logLink: string | null;
    id: string;
}

export async function setLogLink(client: Client, args: SetLogLinkArgs): Promise<void> {
    await client.query({
        text: setLogLinkQuery,
        values: [args.logLink, args.id],
        rowMode: "array"
    });
}

