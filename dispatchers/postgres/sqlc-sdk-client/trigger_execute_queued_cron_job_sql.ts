import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const triggerExecuteQueuedCronJobQuery = `-- name: TriggerExecuteQueuedCronJob :one
SELECT execute_queued_cron_job() AS result`;

export interface TriggerExecuteQueuedCronJobRow {
    result: string;
}

export async function triggerExecuteQueuedCronJob(client: Client): Promise<TriggerExecuteQueuedCronJobRow | null> {
    const result = await client.query({
        text: triggerExecuteQueuedCronJobQuery,
        values: [],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        result: row[0]
    };
}

