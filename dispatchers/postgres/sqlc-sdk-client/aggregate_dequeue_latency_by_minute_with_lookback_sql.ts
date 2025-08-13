import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const aggregateDequeueLatencyByMinuteWithLookbackQuery = `-- name: AggregateDequeueLatencyByMinuteWithLookback :many
WITH metric_data AS (
  -- Extract the dequeueLatencyMs JSON array from the stats column
  SELECT 
    id AS executor_id,
    jsonb_array_elements(
      (stats->>'dequeueLatencyMs')::jsonb
    ) AS latency_entry
  FROM hyrex_executor
  WHERE 
    stats IS NOT NULL 
    AND stats->>'dequeueLatencyMs' IS NOT NULL
),
parsed_metrics AS (
  -- Parse the minute timestamp and average value from each entry
  SELECT 
    executor_id,
    to_timestamp((latency_entry->>'minute')::bigint / 1000) AS minute_timestamp,
    (latency_entry->>'average')::numeric AS avg_latency
  FROM metric_data
  WHERE to_timestamp((latency_entry->>'minute')::bigint / 1000) >= NOW() - make_interval(mins => $1::int)
)
SELECT 
  minute_timestamp,
  AVG(avg_latency)::float8 AS avg_dequeue_latency_ms
FROM parsed_metrics
GROUP BY minute_timestamp
ORDER BY minute_timestamp DESC`;

export interface AggregateDequeueLatencyByMinuteWithLookbackArgs {
    lookbackMinutes: number;
}

export interface AggregateDequeueLatencyByMinuteWithLookbackRow {
    minuteTimestamp: string;
    avgDequeueLatencyMs: number;
}

export async function aggregateDequeueLatencyByMinuteWithLookback(client: Client, args: AggregateDequeueLatencyByMinuteWithLookbackArgs): Promise<AggregateDequeueLatencyByMinuteWithLookbackRow[]> {
    const result = await client.query({
        text: aggregateDequeueLatencyByMinuteWithLookbackQuery,
        values: [args.lookbackMinutes],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            minuteTimestamp: row[0],
            avgDequeueLatencyMs: row[1]
        };
    });
}

