import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const getExecutorStatusesQuery = `-- name: GetExecutorStatuses :many
SELECT
    id,
    status::text as status
FROM hyrex_executor
WHERE id = ANY($1::uuid[])
ORDER BY id`;

export interface GetExecutorStatusesArgs {
    executorIds: string[];
}

export interface GetExecutorStatusesRow {
    id: string;
    status: string;
}

export async function getExecutorStatuses(client: Client, args: GetExecutorStatusesArgs): Promise<GetExecutorStatusesRow[]> {
    const result = await client.query({
        text: getExecutorStatusesQuery,
        values: [args.executorIds],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            id: row[0],
            status: row[1]
        };
    });
}

