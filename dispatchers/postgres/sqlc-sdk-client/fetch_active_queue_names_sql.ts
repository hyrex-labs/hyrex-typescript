import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const fetchActiveQueueNamesQuery = `-- name: FetchActiveQueueNames :many
WITH distinct_queues AS (SELECT DISTINCT queue
                         FROM hyrex_task_run
                         WHERE status = 'QUEUED'
                           AND queue SIMILAR TO $1),
     queue_count AS (SELECT COUNT(*) AS cnt
                     FROM distinct_queues)
SELECT queue
FROM (
         -- If count <= 100000, just select all queues
         SELECT dq.queue
         FROM distinct_queues dq,
              queue_count qc
         WHERE qc.cnt <= 100000

         UNION ALL

         -- If count > 100000, select a random subset
         SELECT queue
         FROM (SELECT dq.queue,
                      row_number() OVER (ORDER BY random()) AS rn
               FROM distinct_queues dq,
                    queue_count qc
               WHERE qc.cnt > 100000) sub
         WHERE rn <= 100000) final_result`;

export interface FetchActiveQueueNamesArgs {
    queuePattern: string;
}

export interface FetchActiveQueueNamesRow {
    queue: string;
}

export async function fetchActiveQueueNames(client: Client, args: FetchActiveQueueNamesArgs): Promise<FetchActiveQueueNamesRow[]> {
    const result = await client.query({
        text: fetchActiveQueueNamesQuery,
        values: [args.queuePattern],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            queue: row[0]
        };
    });
}

