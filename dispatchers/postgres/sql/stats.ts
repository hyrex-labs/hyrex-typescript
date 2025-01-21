const CREATE_MATERIALIZED_VIEW_FINISHED_STATS = `
CREATE MATERIALIZED VIEW hystats_finished_by_time AS
WITH time_buckets AS (
  SELECT 
    date_bin('5 seconds'::interval, finished, TIMESTAMP WITH TIME ZONE '2001-01-01') as time_bucket,
    task_name,
    status,
    COUNT(*) as task_count
  FROM hyrex_task_execution
  WHERE 
    finished IS NOT NULL
  GROUP BY 
    date_bin('5 seconds'::interval, finished, TIMESTAMP WITH TIME ZONE '2001-01-01'),
    task_name,
    status
)
SELECT 
  time_bucket,
  task_name,
  status,
  task_count,
  ROUND(100.0 * task_count / SUM(task_count) OVER (
    PARTITION BY time_bucket, task_name
  ), 2) as percentage_by_task,
  ROUND(100.0 * task_count / SUM(task_count) OVER (
    PARTITION BY time_bucket
  ), 2) as percentage_overall
FROM time_buckets
ORDER BY 
  time_bucket,
  task_name,
  status;

-- Create a unique index required for concurrent refresh
CREATE UNIQUE INDEX hystats_finished_by_time_unique_idx 
ON hystats_finished_by_time(time_bucket, task_name, status);

-- Create additional indexes for query performance
CREATE INDEX idx_task_stats_time_bucket 
ON hystats_finished_by_time(time_bucket);

CREATE INDEX idx_task_stats_task_name 
ON hystats_finished_by_time(task_name);
`

const CREATE_GET_FRESH_STATS_FUNCTION = `
CREATE OR REPLACE FUNCTION get_fresh_task_stats(lookback_period INTERVAL = '1 hour'::INTERVAL)
RETURNS TABLE (
    time_bucket timestamp with time zone,
    task_name varchar,
    status STATUS_ENUM,
    task_count bigint,
    percentage_by_task numeric,
    percentage_overall numeric
) AS $$
BEGIN
    -- Check if refresh is needed by looking at the most recent refresh event
    IF NOT EXISTS (
        SELECT 1
        FROM hyrex_system_logs
        WHERE event_name = 'hystats_finished_by_time_refresh'
        AND timestamp > NOW() - INTERVAL '5 seconds'
    ) THEN
        -- Refresh the view
        REFRESH MATERIALIZED VIEW CONCURRENTLY hystats_finished_by_time;
        
        -- Log the refresh event
        INSERT INTO hyrex_system_logs (
            id,
            timestamp,
            event_name,
            event_body
        ) VALUES (
            gen_random_uuid(),
            NOW(),
            'hystats_finished_by_time_refresh',
            '{}'::jsonb
        );
    END IF;

    -- Return the data filtered by lookback period
    RETURN QUERY 
    SELECT * FROM hystats_finished_by_time mv
    WHERE mv.time_bucket > NOW() - lookback_period
    ORDER BY mv.time_bucket DESC;
END;
$$ LANGUAGE plpgsql;
`

const CREATE_MATERIALIZED_VIEW_QUEUED_STATS = `
CREATE MATERIALIZED VIEW hystats_queued_by_time AS
WITH time_buckets AS (
  SELECT 
    date_bin('5 seconds'::interval, queued, TIMESTAMP WITH TIME ZONE '2001-01-01') as time_bucket,
    task_name,
    status,
    COUNT(*)::numeric / 5 as tasks_per_second
  FROM hyrex_task_execution
  WHERE 
    queued IS NOT NULL
  GROUP BY 
    date_bin('5 seconds'::interval, queued, TIMESTAMP WITH TIME ZONE '2001-01-01'),
    task_name,
    status
)
SELECT 
  time_bucket,
  task_name,
  status,
  ROUND(tasks_per_second, 2) as tasks_per_second,
  ROUND(100.0 * tasks_per_second / SUM(tasks_per_second) OVER (
    PARTITION BY time_bucket, task_name
  ), 2) as percentage_by_task,
  ROUND(100.0 * tasks_per_second / SUM(tasks_per_second) OVER (
    PARTITION BY time_bucket
  ), 2) as percentage_overall
FROM time_buckets
ORDER BY 
  time_bucket,
  task_name,
  status;

-- Create a unique index required for concurrent refresh
CREATE UNIQUE INDEX hystats_queued_by_time_unique_idx 
ON hystats_queued_by_time(time_bucket, task_name, status);

-- Create additional indexes for query performance
CREATE INDEX idx_queued_stats_time_bucket 
ON hystats_queued_by_time(time_bucket);

CREATE INDEX idx_queued_stats_task_name 
ON hystats_queued_by_time(task_name);
`

const CREATE_GET_FRESH_QUEUED_STATS_FUNCTION = `
CREATE OR REPLACE FUNCTION get_fresh_queued_stats(lookback_period INTERVAL = '1 hour'::INTERVAL)
RETURNS TABLE (
    time_bucket timestamp with time zone,
    task_name varchar,
    status STATUS_ENUM,
    tasks_per_second numeric,
    percentage_by_task numeric,
    percentage_overall numeric
) AS $$
BEGIN
    -- Check if refresh is needed by looking at the most recent refresh event
    IF NOT EXISTS (
        SELECT 1
        FROM hyrex_system_logs
        WHERE event_name = 'hystats_queued_by_time_refresh'
        AND timestamp > NOW() - INTERVAL '5 seconds'
    ) THEN
        -- Refresh the view
        REFRESH MATERIALIZED VIEW CONCURRENTLY hystats_queued_by_time;
        
        -- Log the refresh event
        INSERT INTO hyrex_system_logs (
            id,
            timestamp,
            event_name,
            event_body
        ) VALUES (
            gen_random_uuid(),
            NOW(),
            'hystats_queued_by_time_refresh',
            '{}'::jsonb
        );
    END IF;

    -- Return the data filtered by lookback period
    RETURN QUERY 
    SELECT * FROM hystats_queued_by_time mv
    WHERE mv.time_bucket > NOW() - lookback_period
    ORDER BY mv.time_bucket DESC;
END;
$$ LANGUAGE plpgsql;
`

