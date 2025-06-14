import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const conditionallyRetryTaskQuery = `-- name: ConditionallyRetryTask :one
SELECT conditionally_retry_task FROM conditionally_retry_task(
    $1::UUID,
    $2::UUID,
    $3::INT
)`;

export interface ConditionallyRetryTaskArgs {
    existingTaskId: string;
    newTaskId: string;
    timeoutSeconds: number;
}

export interface ConditionallyRetryTaskRow {
    conditionallyRetryTask: string | null;
}

export async function conditionallyRetryTask(client: Client, args: ConditionallyRetryTaskArgs): Promise<ConditionallyRetryTaskRow | null> {
    const result = await client.query({
        text: conditionallyRetryTaskQuery,
        values: [args.existingTaskId, args.newTaskId, args.timeoutSeconds],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        conditionallyRetryTask: row[0]
    };
}

