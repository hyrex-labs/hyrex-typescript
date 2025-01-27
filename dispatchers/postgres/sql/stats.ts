export const CREATE_HISTORICAL_TASK_STATUS_COUNTS = `
    CREATE TABLE IF NOT EXISTS hyrex_stats_task_status_counts
    (
        timepoint     TIMESTAMP WITH TIME ZONE PRIMARY KEY,
        queued        INTEGER,
        running       INTEGER,
        waiting       INTEGER,
        failed        INTEGER,
        success       INTEGER,
        total         INTEGER,
        queued_delta  INTEGER,
        success_delta INTEGER
    );

    CREATE INDEX IF NOT EXISTS idx_hstsc_timepoint
        ON hyrex_stats_task_status_counts(timepoint);
`

export const FILL_HISTORICAL_TASK_STATUS_COUNTS_TABLE = `WITH RECURSIVE timepoints AS (
    -- 1) Start from the larger of:
    --    - The last known timepoint from the stats table (if any)
    --    - 10 minutes ago (rounded to a 15s boundary)
    SELECT GREATEST(
               COALESCE(
                   (SELECT MAX(timepoint) FROM hyrex_stats_task_status_counts),
                   date_bin(
                       INTERVAL '15 seconds',
                       now() - INTERVAL '10 minutes',
                       TIMESTAMP '2000-01-01 00:00:00+00'
                   )
               ),
               date_bin(
                   INTERVAL '15 seconds',
                   now() - INTERVAL '10 minutes',
                   TIMESTAMP '2000-01-01 00:00:00+00'
               )
           ) + INTERVAL '15 seconds' AS timepoint

    UNION ALL

    -- 2) Keep adding 15 seconds, up to 'now' (also rounded to a 15s boundary)
    SELECT timepoint + INTERVAL '15 seconds'
    FROM timepoints
    WHERE timepoint < date_bin(
        INTERVAL '15 seconds',
        now(),
        TIMESTAMP '2000-01-01 00:00:00+00'
    )
),

 -- 2) For each timepoint, count the tasks in each status
 queue_counts AS (
     SELECT
         t.timepoint,
         COUNT(CASE
                   WHEN he.queued <= t.timepoint
                       AND (he.started IS NULL OR he.started > t.timepoint)
                       THEN 1 END) AS queued,
         COUNT(CASE
                   WHEN he.started <= t.timepoint
                       AND (he.finished IS NULL OR he.finished > t.timepoint)
                       AND he.status = 'running'
                       THEN 1 END) AS running,
         COUNT(CASE
                   WHEN he.status = 'waiting'
                       AND he.queued <= t.timepoint
                       AND (he.finished IS NULL OR he.finished > t.timepoint)
                       THEN 1 END) AS waiting,
         COUNT(CASE
                   WHEN he.status IN ('failed','up_for_retry')
                       AND he.finished <= t.timepoint
                       THEN 1 END) AS failed,
         COUNT(CASE
                   WHEN he.status = 'success'
                       AND he.finished <= t.timepoint
                       THEN 1 END) AS success
     FROM timepoints t
              LEFT JOIN hyrex_task_run htr
                        ON (
                            -- Include tasks that existed during this timepoint
                            htr.queued <= t.timepoint
                                AND (
                                -- Either they're still in the system
                                htr.finished IS NULL
                                    OR
                                    -- Or they finished after this timepoint
                                htr.finished > t.timepoint
                                    OR
                                    -- Or they failed/retry/succeeded at this exact timepoint
                                (
                                    htr.status IN ('failed','up_for_retry','success', 'lost')
                                        AND he.finished <= t.timepoint
                                    )
                                )
                            )
     GROUP BY t.timepoint
 ),

 -- 3) Compute deltas in a separate CTE so we can filter rows with NULL deltas
 final_counts AS (
     SELECT
         timepoint,
         queued,
         running,
         waiting,
         failed,
         success,
         (queued + running + waiting + failed) AS total,
         (queued - LAG(queued, 1) OVER (ORDER BY timepoint))   AS queued_delta,
         (success - LAG(success, 1) OVER (ORDER BY timepoint)) AS success_delta
     FROM queue_counts
 )

-- 4) Insert new rows, skipping those where deltas are NULL
 INSERT INTO hyrex_stats_task_status_counts
 SELECT
     timepoint,
     queued,
     running,
     waiting,
     failed,
     success,
     total,
     queued_delta,
     success_delta
 FROM final_counts
 WHERE queued_delta IS NOT NULL
    AND success_delta IS NOT NULL
 ON CONFLICT (timepoint) DO NOTHING;
`
