CREATE MATERIALIZED VIEW hystats_queued_by_time AS
WITH time_buckets AS (
  SELECT 
    date_bin('5 seconds', queued, TIMESTAMP '2001-01-01') as time_bucket,
    task_name,
    status,
    COUNT(*) as task_count
  FROM hyrex_task_run
  WHERE 
    queued IS NOT NULL
  GROUP BY 
    date_bin('5 seconds', queued, TIMESTAMP '2001-01-01'),
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
CREATE UNIQUE INDEX hystats_queued_by_time_unique_idx 
ON hystats_queued_by_time(time_bucket, task_name, status);

-- Create additional indexes for query performance
CREATE INDEX idx_queued_stats_time_bucket 
ON hystats_queued_by_time(time_bucket);

CREATE INDEX idx_queued_stats_task_name 
ON hystats_queued_by_time(task_name);