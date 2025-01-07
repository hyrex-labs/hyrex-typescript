import { CronJobRun } from "../../HyrexCronScheduler";

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
    CREATE TABLE IF NOT EXISTS hyrex_task (
      task_name    TEXT NOT NULL PRIMARY KEY,
      cron_expr    TEXT,
      source_code  TEXT,
      last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
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

//
// CRON SQL STATEMENTS
//

// Specifically modeled on cron.job table in pg_cron
export const CreateHyrexCronJobTable = `
    CREATE TABLE IF NOT EXISTS hyrex_cron_job
    (
        jobid             bigserial PRIMARY KEY,
        schedule          text    NOT NULL,
        command           text    NOT NULL,
        active            boolean NOT NULL DEFAULT true,
        jobname           text    NOT NULL,
        activated_at      timestamptz default now(),
        scheduled_jobs_confirmed_until timestamptz default now(),
        UNIQUE (jobname)
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
  schedule_time timestamptz not null,
  start_time   timestamptz,
  end_time     timestamptz,
  UNIQUE (jobid, schedule_time)
)
`

export const CreateHyrexSchedulerLockTable = `
CREATE TABLE IF NOT EXISTS hyrex_scheduler_lock (
    lockid          bigserial   PRIMARY KEY,
    worker_name     text        NOT NULL,
    acquired_at     timestamptz NOT NULL DEFAULT now(),
    heartbeat_at    timestamptz NOT NULL DEFAULT now(),
    release_at      timestamptz NOT NULL,
    is_active       boolean     NOT NULL DEFAULT true
);
`

export const ACQUIRE_SCHEDULER_LOCK = `
INSERT INTO hyrex_scheduler_lock (
    lockid, worker_name, acquired_at, heartbeat_at, release_at, is_active
)
VALUES (
    1,                  -- single global lock id
    $1,                 -- workerName
    now(),              -- acquired_at
    now(),              -- heartbeat_at
    now() + CAST($2 AS interval),  -- release_at (e.g. now + '5 minutes')
    true                -- is_active
)
ON CONFLICT (lockid)
  DO UPDATE 
     SET worker_name  = EXCLUDED.worker_name,
         acquired_at  = EXCLUDED.acquired_at,
         heartbeat_at = EXCLUDED.heartbeat_at,
         release_at   = EXCLUDED.release_at,
         is_active    = EXCLUDED.is_active
   WHERE (
       -- Only update if the lock is not truly active,
       -- i.e. is already inactive or expired:
       hyrex_scheduler_lock.is_active = false
       OR hyrex_scheduler_lock.release_at <= now()
   )
RETURNING lockid;
`

export const RELEASE_SCHEDULER_LOCK = `
    UPDATE hyrex_scheduler_lock
    SET is_active    = false,
        release_at   = now(),
        heartbeat_at = now()
    WHERE lockid = 1
      AND worker_name = $1
    RETURNING lockid;
`

// export const INSERT_NEW_CRON_JOB_RUN = `
//     INSERT INTO hyrex_cron_job_run_details (jobid, command, status, start_time)
//     SELECT $1, $2, 'queued', $3
//     WHERE NOT EXISTS (SELECT 1
//                       FROM hyrex_cron_job_run_details
//                       WHERE jobid = $1
//                         AND start_time = $3
//                         AND status = 'queued')
//     RETURNING runid
// `



export const PULL_ACTIVE_CRON_EXPRESSIONS = `
    SELECT jobid,
           schedule,
           command,
           active,
           jobname,
           activated_at,
           scheduled_jobs_confirmed_until
    FROM hyrex_cron_job
    WHERE active = true
--       AND activated_at > NOW();
`

export const UPDATE_CRON_JOB_CONFIRMATION_TS = `
    UPDATE hyrex_cron_job
    SET scheduled_jobs_confirmed_until = now()
    WHERE jobid = $1;
`

export function cronJobRunsToSQL(runs: CronJobRun[]): string {
    // Format each run into a SQL values tuple
    const valueStrings = runs.map(run => {
        const formattedDate = run.schedule_time.toISOString();
        return `(${run.jobid}, '${run.command}', 'queued', '${formattedDate}')`
    });

    return `
        INSERT INTO hyrex_cron_job_run_details 
            (jobid, command, status, schedule_time)
        VALUES 
            ${valueStrings.join(',\n            ')}
        ON CONFLICT (jobid, schedule_time) DO NOTHING
        RETURNING runid;
    `;
}

export const CREATE_EXECUTE_QUEUED_COMMAND_FUNCTION = `
CREATE OR REPLACE FUNCTION execute_queued_command()
RETURNS text AS $$
DECLARE
    cmd text;
    selected_runid bigint;
BEGIN
    -- Select and lock the first queued command
    SELECT command, runid INTO cmd, selected_runid
    FROM hyrex_cron_job_run_details
    WHERE status = 'queued'
    AND schedule_time <= NOW()
    ORDER BY schedule_time
    LIMIT 1
    FOR UPDATE SKIP LOCKED;

    IF FOUND THEN
        -- Execute the command
        EXECUTE cmd;

        -- Update status to success using runid
        UPDATE hyrex_cron_job_run_details
        SET status = 'success',
            start_time = NOW(),
            end_time = NOW()
        WHERE runid = selected_runid
        AND status = 'queued';
        
        RETURN 'executed';
    END IF;

    RETURN 'not_found';
EXCEPTION
    WHEN OTHERS THEN
        -- Update status to failed if there's an error using runid
        UPDATE hyrex_cron_job_run_details
        SET status = 'failed',
            start_time = NOW(),
            end_time = NOW()
        WHERE runid = selected_runid
        AND status = 'queued';
        RAISE;
END;
$$ LANGUAGE plpgsql;
`
