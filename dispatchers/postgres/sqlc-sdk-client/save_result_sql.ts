import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const saveResultQuery = `-- name: SaveResult :exec
INSERT INTO hyrex_task_result
    (task_id, result)
VALUES ($1, $2)`;

export interface SaveResultArgs {
    taskId: string;
    result: any | null;
}

export async function saveResult(client: Client, args: SaveResultArgs): Promise<void> {
    await client.query({
        text: saveResultQuery,
        values: [args.taskId, args.result],
        rowMode: "array"
    });
}

