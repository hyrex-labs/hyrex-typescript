import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const insertSingleTaskStatusCountsRowQuery = `-- name: InsertSingleTaskStatusCountsRow :exec
WITH new_values AS (
    -- Parameters passed from your Go application
    SELECT
        $1::TIMESTAMPTZ AS current_timepoint,
        $2::INTEGER AS current_queued,
        $3::INTEGER AS current_running,
        $4::INTEGER AS current_waiting,
        $5::INTEGER AS current_failed,
        $6::INTEGER AS current_success,
        $7::INTEGER AS current_lost
),
previous_latest AS (
    -- Get the most recent record from the table for relevant delta calculations
    SELECT
        queued AS prev_queued,
        success AS prev_success,
        failed AS prev_failed,
        lost AS prev_lost
    FROM hyrex_stats_task_status_counts
    ORDER BY timepoint DESC
    LIMIT 1
)
INSERT INTO hyrex_stats_task_status_counts (
    timepoint,
    queued,
    running,
    waiting,
    failed,
    success,
    lost,
    total,
    queued_delta,
    success_delta,
    failed_delta,
    lost_delta
)
SELECT
    nv.current_timepoint,
    nv.current_queued,
    nv.current_running,
    nv.current_waiting,
    nv.current_failed,
    nv.current_success,
    nv.current_lost,
    -- Calculate total directly from new values
    (nv.current_queued + nv.current_running + nv.current_waiting + nv.current_failed + nv.current_success + nv.current_lost) AS total_count,

    -- Calculate absolute deltas from the previous row
    -- If no previous row, prev_xxx will be NULL, (current - NULL) is NULL. COALESCE makes it 0.
    COALESCE(nv.current_queued - pl.prev_queued, 0) AS queued_delta,
    COALESCE(nv.current_success - pl.prev_success, 0) AS success_delta,
    COALESCE(nv.current_failed - pl.prev_failed, 0) AS failed_delta,
    COALESCE(nv.current_lost - pl.prev_lost, 0) AS lost_delta
FROM
    new_values nv
LEFT JOIN
    previous_latest pl ON TRUE -- Ensures new_values always processed; pl columns will be NULL if table is empty
ON CONFLICT (timepoint) DO UPDATE SET
    queued = EXCLUDED.queued,
    running = EXCLUDED.running,
    waiting = EXCLUDED.waiting,
    failed = EXCLUDED.failed,
    success = EXCLUDED.success,
    lost = EXCLUDED.lost,
    total = EXCLUDED.total,
    queued_delta = EXCLUDED.queued_delta,
    success_delta = EXCLUDED.success_delta,
    failed_delta = EXCLUDED.failed_delta,
    lost_delta = EXCLUDED.lost_delta`;

export interface InsertSingleTaskStatusCountsRowArgs {
    timepoint: Date;
    queued: number;
    running: number;
    waiting: number;
    failed: number;
    success: number;
    lost: number;
}

export async function insertSingleTaskStatusCountsRow(client: Client, args: InsertSingleTaskStatusCountsRowArgs): Promise<void> {
    await client.query({
        text: insertSingleTaskStatusCountsRowQuery,
        values: [args.timepoint, args.queued, args.running, args.waiting, args.failed, args.success, args.lost],
        rowMode: "array"
    });
}

