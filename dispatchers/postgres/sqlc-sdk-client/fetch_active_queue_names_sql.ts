import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const fetchActiveQueueNamesQuery = `-- name: FetchActiveQueueNames :many
/* Fetch up to 100 000 distinct queue names that are currently queued
   If there are fewer than 100 000, you’ll simply get them all.        */
SELECT DISTINCT queue
FROM   hyrex_task_run
WHERE  status = 'queued'
  AND  queue  LIKE $1
ORDER  BY random()        -- randomise the order
LIMIT  100000`;

export interface FetchActiveQueueNamesArgs {
    queue: string;
}

export interface FetchActiveQueueNamesRow {
    queue: string;
}

export async function fetchActiveQueueNames(client: Client, args: FetchActiveQueueNamesArgs): Promise<FetchActiveQueueNamesRow[]> {
    const result = await client.query({
        text: fetchActiveQueueNamesQuery,
        values: [args.queue],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            queue: row[0]
        };
    });
}

