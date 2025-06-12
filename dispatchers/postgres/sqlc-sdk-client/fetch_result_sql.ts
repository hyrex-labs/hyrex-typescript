import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const fetchResultQuery = `-- name: FetchResult :many
SELECT result
FROM hyrex_task_result
WHERE task_id = $1`;

export interface FetchResultArgs {
    taskId: string;
}

export interface FetchResultRow {
    result: any | null;
}

export async function fetchResult(client: Client, args: FetchResultArgs): Promise<FetchResultRow[]> {
    const result = await client.query({
        text: fetchResultQuery,
        values: [args.taskId],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            result: row[0]
        };
    });
}

