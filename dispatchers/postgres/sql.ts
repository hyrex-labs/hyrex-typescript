export const CreateHyrexTaskExecutionTable = `
-- Create status enum type if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_enum' AND typnamespace = 'public'::regnamespace) THEN
        CREATE TYPE public.status_enum AS ENUM (
            'success',
            'failed',
            'up_for_retry',
            'running',
            'queued',
            'up_for_cancel',
            'canceled',
            'waiting'
        );
    END IF;
END $$;

-- Create task execution table
CREATE TABLE IF NOT EXISTS hyrex_task_execution (
    id              UUID                        NOT NULL PRIMARY KEY,
    durable_id      UUID                        NOT NULL,
    root_id         UUID                        NOT NULL,
    parent_id       UUID,
    task_name       VARCHAR                     NOT NULL,
    args            JSON                        NOT NULL,
    queue           VARCHAR                     NOT NULL,
    max_retries     SMALLINT                    NOT NULL,
    priority        SMALLINT                    NOT NULL,
    status          STATUS_ENUM                 NOT NULL,
    attempt_number  SMALLINT                    NOT NULL,
    scheduled_start TIMESTAMP WITH TIME ZONE,
    executor_id     UUID,
    queued          TIMESTAMP WITH TIME ZONE,
    started         TIMESTAMP WITH TIME ZONE,
    finished        TIMESTAMP WITH TIME ZONE,
    last_heartbeat  TIMESTAMP WITH TIME ZONE,
    idempotency_key VARCHAR
);

-- Create indexes
CREATE INDEX IF NOT EXISTS ix_hyrex_task_execution_task_name
    ON public.hyrex_task_execution (task_name);

CREATE INDEX IF NOT EXISTS ix_hyrex_task_execution_status
    ON public.hyrex_task_execution (status);

CREATE INDEX IF NOT EXISTS ix_hyrex_task_execution_queue
    ON public.hyrex_task_execution (queue);

CREATE INDEX IF NOT EXISTS ix_hyrex_task_execution_scheduled_start
    ON public.hyrex_task_execution (scheduled_start);

CREATE INDEX IF NOT EXISTS index_queue_status
    ON public.hyrex_task_execution (status, queue, scheduled_start, task_name);

CREATE UNIQUE INDEX IF NOT EXISTS ix_hyrex_task_execution_idempotency_key 
    ON public.hyrex_task_execution (task_name, idempotency_key)
    WHERE idempotency_key IS NOT NULL;
`

export const CreateHyrexTaskTable = `
    CREATE TABLE IF NOT EXISTS hyrex_task
    (
        task_name   varchar not null primary key,
        cron_expr   varchar,
        source_code varchar,
        last_updated TIMESTAMP WITH TIME ZONE
    )
`

export const CreateSystemLogTable = `
CREATE TABLE IF NOT EXISTS hyrex_system_logs (
    id UUID NOT NULL PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE,
    event_name VARCHAR NOT NULL,
    event_body JSON NOT NULL
);
`

export const CreateExecutorTable = `
    CREATE TABLE IF NOT EXISTS hyrex_executor
    (
        id             UUID    NOT NULL PRIMARY KEY,
        name           VARCHAR NOT NULL,
        worker_name    VARCHAR NOT NULL,
        queue_pattern  JSON    NOT NULL,
        queues         JSON    NOT NULL,
        started        TIMESTAMP WITH TIME ZONE,
        stopped        TIMESTAMP WITH TIME ZONE,
        last_heartbeat TIMESTAMP WITH TIME ZONE,
        stats          JSON
    );
`

export const CreateResultsTable = `
    CREATE TABLE IF NOT EXISTS hyrex_task_result
    (
        task_id    UUID PRIMARY KEY REFERENCES public.hyrex_task_execution (id) ON DELETE CASCADE,
        result     JSON,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
`

export const ENQUEUE_TASKS = `
    WITH task_insertion AS (
        INSERT INTO hyrex_task_execution (
                                          id,
                                          durable_id,
                                          root_id,
                                          parent_id,
                                          task_name,
                                          args,
                                          queue,
                                          max_retries,
                                          priority,
                                          status,
                                          attempt_number,
                                          queued,
                                          idempotency_key
            )
            VALUES (
                       $1, $2, $3, $4, $5, $6, $7, $8, $9,
                       'queued',
                       0,
                       CURRENT_TIMESTAMP,
                       $10
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
                             'idempotency_key', $10,
                             'task_name', $5,
                             'queue', $7
                     )
                 WHERE NOT EXISTS (SELECT 1 FROM task_insertion)
                   AND $10 IS NOT NULL
         )
    SELECT EXISTS (SELECT 1 FROM task_insertion) as task_created;
`

export const FETCH_TASK = `
    WITH next_task AS (SELECT id
                       FROM hyrex_task_execution
                       WHERE queue = $1
                         AND status = 'queued'
                       ORDER BY priority DESC, queued
                           FOR UPDATE SKIP LOCKED
                       LIMIT 1)
    UPDATE hyrex_task_execution as ht
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
        , ht.scheduled_start
        , ht.queued
        , ht.started;
`

export const FETCH_TASK_WITH_CONCURRENCY_LIMIT = `
    WITH lock_result AS (SELECT pg_try_advisory_xact_lock(hashtext($1)) AS lock_acquired),
         next_task AS (SELECT id
                       FROM hyrex_task_execution,
                            lock_result
                       WHERE lock_acquired = TRUE
                         AND queue = $1
                         AND status = 'queued'
                         AND (SELECT COUNT(*) FROM hyrex_task_execution WHERE queue = $1 AND status = 'running') < $2
                       ORDER BY priority DESC, queued
                           FOR UPDATE SKIP LOCKED
                       LIMIT 1)
    UPDATE hyrex_task_execution as ht
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
        , ht.scheduled_start
        , ht.queued
        , ht.started;
`

export const MARK_TASK_FAILED = `
    UPDATE hyrex_task_execution
    SET status   = 'failed',
        finished = CURRENT_TIMESTAMP
    WHERE id = $1
`

export const MARK_TASK_SUCCESS = `
    UPDATE hyrex_task_execution
    SET status   = CASE
                       WHEN status = 'running' THEN 'success'::statusenum
                       WHEN status = 'up_for_cancel' THEN 'canceled'::statusenum
        END,
        finished = CURRENT_TIMESTAMP
    WHERE id = $1
      AND status IN ('running', 'up_for_cancel')
`

export const MARK_TASK_CANCELED = `
    UPDATE hyrex_task_execution
    SET status   = 'canceled'::statusenum,
        finished = CURRENT_TIMESTAMP
    WHERE id = $1
      AND status = 'up_for_cancel'
`

export const MARK_TASK_LOST = `
    UPDATE hyrex_task_execution
    SET status   = 'lost'::statusenum,
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
                                last_heartbeat)
    VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, null, CURRENT_TIMESTAMP);
`

export const UPDATE_QUEUES_ON_EXECUTOR = `
    UPDATE hyrex_executor
    SET queues = $2
    where id = $1;
`

export const DISCONNECT_EXECUTOR = `
    UPDATE hyrex_executor
    SET stopped        = CURRENT_TIMESTAMP,
        last_heartbeat = CURRENT_TIMESTAMP,
        stats          = $2
    where id = $1;
`

export const UPDATE_HEARTBEAT = `
    
`

export const SAVE_RESULT = `
    INSERT INTO hyrex_task_result
        (task_id, result)
    VALUES ($1, $2)
`

export const FETCH_RESULT = `SELECT result
                             FROM hyrex_task_result
                             WHERE task_id = $1;`

export const FETCH_ACTIVE_QUEUE_NAMES = `
    WITH distinct_queues AS (SELECT DISTINCT queue
                             FROM hyrex_task_execution
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
WITH existing_task AS (
    SELECT
        durable_id,
        root_id,
        parent_id,
        task_name,
        args,
        queue,
        attempt_number,
        max_retries,
        priority
    FROM hyrex_task_execution
    WHERE id = $1
      AND attempt_number < max_retries
)
INSERT INTO hyrex_task_execution (
    id,
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
    priority
)
SELECT
    $2 AS id,
    durable_id,
    root_id,
    parent_id,
    CURRENT_TIMESTAMP as queued,
    'queued' AS status,
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

// Specifically modeled on cron.job table in pg_cron
export const CreateHyrexCronJobTable = `
CREATE TABLE IF NOT EXISTS hyrex_cron_job (
    jobid        bigserial PRIMARY KEY,
    schedule     text        NOT NULL,
    command      text        NOT NULL,
    active       boolean     NOT NULL DEFAULT true,
    jobname      text        NOT NULL
);
`

// Specifically modeled on cron.job_run_details table in pg_cron
export const CreateHyrexCronJobRunDetailsTable = `
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'cron_job_status_enum' AND typnamespace = 'public'::regnamespace) THEN
        CREATE TYPE public.cron_job_status_enum AS ENUM (
            'success',
            'queued',
            'failed'
        );
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS hyrex_cron_job_run_details (
  jobid        bigint      NOT NULL,
  runid        bigserial   PRIMARY KEY,
  command      text        NOT NULL,
  status       cron_job_status_enum,
  start_time   timestamptz NOT NULL DEFAULT now(),
  end_time     timestamptz
)
`
