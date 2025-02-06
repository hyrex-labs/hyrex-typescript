export const CreateHyrexTaskExecutionTable = `
-- Create task_run_status enum type if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 
                   FROM pg_type 
                   WHERE typname = 'task_run_status' 
                     AND typnamespace = 'public'::regnamespace) THEN
        CREATE TYPE public.task_run_status AS ENUM (
            'success',
            'failed',
            'running',
            'queued',
            'up_for_cancel',
            'canceled',
            'waiting',
            'lost'
        );
    END IF;
END $$;

-- Create task run table (renamed from hyrex_task_execution)
CREATE TABLE IF NOT EXISTS hyrex_task_run (
    id              UUID                        NOT NULL PRIMARY KEY,
    durable_id      UUID                        NOT NULL,
    root_id         UUID                        NOT NULL,
    parent_id       UUID,
    workflow_run_id UUID DEFAULT NULL,
    workflow_dependencies UUID[] DEFAULT NULL,
    task_name       VARCHAR                     NOT NULL,
    args            JSON                        NOT NULL,
    queue           VARCHAR                     NOT NULL,
    max_retries     SMALLINT                    NOT NULL,
    priority        SMALLINT                    NOT NULL,
    timeout_seconds INT                         DEFAULT NULL CHECK (timeout_seconds IS NULL OR timeout_seconds > 0),
    status          task_run_status             NOT NULL,
    attempt_number  SMALLINT                    NOT NULL,
    scheduled_start TIMESTAMP WITH TIME ZONE,
    executor_id     UUID,
    queued          TIMESTAMP WITH TIME ZONE,
    started         TIMESTAMP WITH TIME ZONE,
    finished        TIMESTAMP WITH TIME ZONE,
    last_heartbeat  TIMESTAMP WITH TIME ZONE,
    idempotency_key VARCHAR,
    log_link        VARCHAR
);

-- Create indexes
CREATE INDEX IF NOT EXISTS ix_hyrex_task_run_task_name
    ON public.hyrex_task_run (task_name);

CREATE INDEX IF NOT EXISTS ix_hyrex_task_run_status
    ON public.hyrex_task_run (status);

CREATE INDEX IF NOT EXISTS ix_hyrex_task_run_queue
    ON public.hyrex_task_run (queue);

CREATE INDEX IF NOT EXISTS ix_hyrex_task_run_scheduled_start
    ON public.hyrex_task_run (scheduled_start);

CREATE INDEX IF NOT EXISTS index_queue_status
    ON public.hyrex_task_run (status, queue, scheduled_start, task_name);

CREATE UNIQUE INDEX IF NOT EXISTS ix_hyrex_task_run_idempotency_key
    ON public.hyrex_task_run (task_name, idempotency_key)
    WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_hyrex_task_run_queue_status_priority_queued
    ON hyrex_task_run (queue, status, priority DESC, queued);

CREATE INDEX IF NOT EXISTS idx_htr_queued_started_finished
    ON hyrex_task_run(queued, started, finished);

CREATE INDEX IF NOT EXISTS idx_hyrex_task_run_root_id
    ON hyrex_task_run(root_id);
`

export const CreateHyrexTaskTable = `
    CREATE TABLE IF NOT EXISTS hyrex_task
    (
        task_name    TEXT NOT NULL PRIMARY KEY,
        cron_expr    TEXT,
        source_code  TEXT,
        last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
`

export const CreateSystemLogTable = `
    CREATE TABLE IF NOT EXISTS hyrex_system_logs
    (
        id         UUID    NOT NULL PRIMARY KEY,
        timestamp  TIMESTAMP WITH TIME ZONE,
        event_name VARCHAR NOT NULL,
        event_body JSON    NOT NULL
    );
`

export const CreateHyrexAppTable = `
    CREATE TABLE IF NOT EXISTS hyrex_app
    (
        id       BIGSERIAL NOT NULL PRIMARY KEY,
        app_info JSON
    );
`

export const REGISTER_APP_INFO_SQL = `
    INSERT INTO hyrex_app (
        id,
        app_info
    ) VALUES (
        $1,
        $2
    )
    ON CONFLICT (id) DO UPDATE SET
        app_info = $2;
`;

export const CreateExecutorTable = `
    DO $$
BEGIN
    -- Create enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'executor_status') THEN
        CREATE TYPE executor_status AS ENUM ('SHUTDOWN', 'LOST', 'RUNNING', 'UNKNOWN');
    END IF;
END$$;

-- Create or replace the table with the status column
CREATE TABLE IF NOT EXISTS hyrex_executor
(
    id             UUID    NOT NULL PRIMARY KEY,
    name           VARCHAR NOT NULL,
    worker_name    VARCHAR NOT NULL,
    queue_pattern  VARCHAR NOT NULL,
    queues         JSON    NOT NULL,
    started        TIMESTAMP WITH TIME ZONE,
    stopped        TIMESTAMP WITH TIME ZONE,
    last_heartbeat TIMESTAMP WITH TIME ZONE,
    stats          JSON,
    status         executor_status NOT NULL DEFAULT 'UNKNOWN'
);
`

export const CreateResultsTable = `
    CREATE TABLE IF NOT EXISTS hyrex_task_result
    (
        task_id    UUID PRIMARY KEY REFERENCES public.hyrex_task_run (id) ON DELETE CASCADE,
        result     JSON,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
`

export const ENQUEUE_TASKS = `
    WITH task_insertion AS (
        INSERT INTO hyrex_task_run (
                                    id,
                                    durable_id,
                                    root_id,
                                    workflow_run_id,
                                    workflow_dependencies,
                                    parent_id,
                                    task_name,
                                    args,
                                    queue,
                                    max_retries,
                                    priority,
                                    timeout_seconds,
                                    status,
                                    attempt_number,
                                    queued,
                                    idempotency_key
            )
            VALUES (
                       $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
                       'queued'::task_run_status,
                       0,
                       CURRENT_TIMESTAMP,
                       $13
                   )
            ON CONFLICT (task_name, idempotency_key)
                WHERE idempotency_key IS NOT NULL
                DO NOTHING
            RETURNING id
    ),
         log_entry AS (
             INSERT INTO hyrex_system_logs (
                                            id,
                                            timestamp,
                                            event_name,
                                            event_body
                 )
                 SELECT
                     gen_random_uuid(),
                     CURRENT_TIMESTAMP,
                     'IDEMPOTENCY_COLLISION',
                     json_build_object(
                             'attempted_task_id', $1,
                             'idempotency_key', $13,
                             'task_name', $7,
                             'queue', $9
                     )
                 WHERE NOT EXISTS (SELECT 1 FROM task_insertion)
                   AND $13 IS NOT NULL
         )
    SELECT EXISTS (SELECT 1 FROM task_insertion) as task_created;
`;

export const FETCH_TASK = `
    WITH next_task AS (SELECT id
                       FROM hyrex_task_run
                       WHERE queue = $1
                         AND status = 'queued'
                       ORDER BY priority DESC, queued
                           FOR UPDATE SKIP LOCKED
                       LIMIT 1)
    UPDATE hyrex_task_run AS ht
    SET status      = 'running',
        started     = CURRENT_TIMESTAMP,
        executor_id = $2
    FROM next_task
    WHERE ht.id = next_task.id
    RETURNING ht.id
        , ht.root_id
        , ht.parent_id
        , ht.task_name
        , ht.args
        , ht.queue
        , ht.priority
        , ht.timeout_seconds
        , ht.scheduled_start
        , ht.queued
        , ht.started;
`

export const FETCH_TASK_WITH_CONCURRENCY_LIMIT = `
    WITH lock_result AS (SELECT pg_try_advisory_xact_lock(hashtext($1)) AS lock_acquired),
         next_task AS (SELECT id
                       FROM hyrex_task_run,
                            lock_result
                       WHERE lock_acquired = TRUE
                         AND queue = $1
                         AND status = 'queued'
                         AND (SELECT COUNT(*) FROM hyrex_task_run WHERE queue = $1 AND status = 'running') < $2
                       ORDER BY priority DESC, queued
                           FOR UPDATE SKIP LOCKED
                       LIMIT 1)
    UPDATE hyrex_task_run AS ht
    SET status         = 'running',
        started        = CURRENT_TIMESTAMP,
        last_heartbeat = CURRENT_TIMESTAMP,
        executor_id    = $3
    FROM next_task
    WHERE ht.id = next_task.id
    RETURNING ht.id
        , ht.root_id
        , ht.parent_id
        , ht.task_name
        , ht.args
        , ht.queue
        , ht.priority
        , ht.timeout_seconds
        , ht.scheduled_start
        , ht.queued
        , ht.started;
`

export const MARK_TASK_FAILED = `
    UPDATE hyrex_task_run
    SET status   = 'failed',
        finished = CURRENT_TIMESTAMP
    WHERE id = $1
`

export const MARK_TASK_SUCCESS = `
    UPDATE hyrex_task_run
    SET status   = CASE
                       WHEN status = 'running' THEN 'success'::task_run_status
                       WHEN status = 'up_for_cancel' THEN 'canceled'::task_run_status
        END,
        finished = CURRENT_TIMESTAMP
    WHERE id = $1
      AND status IN ('running', 'up_for_cancel')
`

export const MARK_TASK_CANCELED = `
    UPDATE hyrex_task_run
    SET status   = 'canceled'::task_run_status,
        finished = CURRENT_TIMESTAMP
    WHERE id = $1
      AND status = 'up_for_cancel'
`

export const MARK_TASK_LOST = `
    UPDATE hyrex_task_run
    SET status   = 'lost'::task_run_status,
        finished = CURRENT_TIMESTAMP
    WHERE id = $1
`

export const REGISTER_EXECUTOR = `
    INSERT INTO hyrex_executor (id,
                                name,
                                queue_pattern,
                                queues,
                                worker_name,
                                started,
                                stopped,
                                last_heartbeat,
                                status)
    VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, null, CURRENT_TIMESTAMP, 'RUNNING'::executor_status);
`

export const UPDATE_QUEUES_ON_EXECUTOR = `
    UPDATE hyrex_executor
    SET queues = $2
    WHERE id = $1;
`

export const DISCONNECT_EXECUTOR = `
    UPDATE hyrex_executor
    SET stopped        = CURRENT_TIMESTAMP,
        last_heartbeat = CURRENT_TIMESTAMP,
        stats          = $2,
        status         = 'SHUTDOWN'::executor_status
    WHERE id = $1;
`

export const UPDATE_EXECUTOR_STATS = `
    WITH updated AS (
        UPDATE hyrex_executor
            SET last_heartbeat = CURRENT_TIMESTAMP,
                stats = $2
            WHERE id = $1
                AND status = 'RUNNING'::executor_status
            RETURNING id, status, last_heartbeat, stats),
         executor_state AS (SELECT CASE WHEN u.id IS NOT NULL THEN 'ACCEPTED' ELSE 'REJECTED' END AS result,
                                   COALESCE(u.status, e.status)                                   AS status,
                                   COALESCE(u.last_heartbeat, e.last_heartbeat)                   AS last_heartbeat,
                                   COALESCE(u.stats, e.stats)                                     AS stats
                            FROM hyrex_executor e
                                     LEFT JOIN updated u ON e.id = u.id
                            WHERE e.id = $1),
         insert_log AS (
             INSERT INTO hyrex_system_logs (id, timestamp, event_name, event_body)
                 SELECT gen_random_uuid(),
                        CURRENT_TIMESTAMP,
                        'HEARTBEAT_REJECTED',
                        json_build_object('executor_id', $1, 'current_status', es.status, 'stats', $2)
                 FROM executor_state es
                 WHERE es.result = 'REJECTED'
                 RETURNING NULL)
    SELECT es.*
    FROM executor_state es;
`

export const BATCH_UPDATE_HEARTBEAT_ON_EXECUTORS = `
    UPDATE hyrex_executor
    SET last_heartbeat = NOW()
    WHERE id = ANY ($1::uuid[]);
`

export const BATCH_UPDATE_HEARTBEAT_LOG = `
INSERT INTO hyrex_system_logs (id, timestamp, event_name, event_body)
VALUES (
    $1,
    NOW(),
    'BATCH_HEARTBEAT_UPDATE',
    json_build_object('updated_executor_ids', $2::uuid[])
);
`

export const SAVE_RESULT = `
    INSERT INTO hyrex_task_result
        (task_id, result)
    VALUES ($1, $2)
`

export const FETCH_RESULT = `
    SELECT result
    FROM hyrex_task_result
    WHERE task_id = $1;
`

export const FETCH_ACTIVE_QUEUE_NAMES = `
    WITH distinct_queues AS (SELECT DISTINCT queue
                             FROM hyrex_task_run
                             WHERE status = 'queued'
                               AND queue LIKE $1),
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
             WHERE rn <= 100000) final_result;
`

export const CONDITIONALLY_RETRY_TASK = `
    WITH existing_task AS (SELECT durable_id,
                                  root_id,
                                  parent_id,
                                  task_name,
                                  args,
                                  queue,
                                  attempt_number,
                                  max_retries,
                                  priority
                           FROM hyrex_task_run
                           WHERE id = $1
                             AND attempt_number < max_retries)
    INSERT
    INTO hyrex_task_run (id,
                         durable_id,
                         root_id,
                         parent_id,
                         queued,
                         status,
                         task_name,
                         args,
                         queue,
                         attempt_number,
                         max_retries,
                         priority)
    SELECT $2                 AS id,
           durable_id,
           root_id,
           parent_id,
           CURRENT_TIMESTAMP  as queued,
           'queued'           AS status,
           task_name,
           args,
           queue,
           attempt_number + 1 AS attempt_number,
           max_retries,
           priority
    FROM existing_task;
`

export const UPSERT_TASK = `
INSERT INTO hyrex_task (task_name, cron_expr, source_code, last_updated)
VALUES ($1, $2, $3, NOW())
ON CONFLICT (task_name)
DO UPDATE SET 
    cron_expr = EXCLUDED.cron_expr,
    source_code = EXCLUDED.source_code,
    last_updated = NOW();
`

export const SET_LOG_LINK = `
    UPDATE hyrex_task_run
    SET log_link = $2
    WHERE id = $1
`

const CREATE_MATERIALIZED_VIEW_QUEUED_STATS = `
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
`

const CREATE_GET_FRESH_QUEUED_STATS_FUNCTION = `
CREATE OR REPLACE FUNCTION get_fresh_queued_stats()
RETURNS TABLE (
    time_bucket timestamp,
    task_name varchar,
    status task_run_status,
    task_count bigint,
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

    -- Return the data
    RETURN QUERY SELECT * FROM hystats_queued_by_time;
END;
$$ LANGUAGE plpgsql;
`
