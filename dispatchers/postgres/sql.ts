export const CreateHyrexTaskTable = `
-- create type public.statusenum as enum ('success', 'failed', 'up_for_retry', 'running', 'queued');
DO $$
BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'statusenum' AND typnamespace = 'public'::regnamespace) THEN
CREATE TYPE public.statusenum AS ENUM ('success', 'failed', 'up_for_retry', 'running', 'queued', 'up_for_cancel', 'canceled', 'waiting');
END IF;
END $$;

create table if not exists hyrex_task
(
    id              uuid       not null
primary key,
    root_id         uuid       not null,
    parent_id       uuid,
    task_name       varchar    not null,
    args            json       not null,
    queue           varchar    not null,
    max_retries     smallint   not null,
    priority        smallint   not null,
    status          statusenum not null,
    attempt_number  smallint   not null,
    scheduled_start timestamp with time zone,
    executor_id       uuid,
    queued          timestamp with time zone,
    started         timestamp with time zone,
    finished        timestamp with time zone,
    last_heartbeat  timestamp with time zone
);

create index if not exists ix_hyrex_task_task_name
on public.hyrex_task (task_name);

create index if not exists ix_hyrex_task_status
on public.hyrex_task (status);

create index if not exists ix_hyrex_task_queue
on public.hyrex_task (queue);

create index if not exists ix_hyrex_task_scheduled_start
on public.hyrex_task (scheduled_start);

create index if not exists index_queue_status
on public.hyrex_task (status, queue, scheduled_start, task_name);
`

// language=SQL format=false
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
        task_id    UUID PRIMARY KEY REFERENCES public.hyrex_task (id) ON DELETE CASCADE,
        result     JSON,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
`
export const ENQUEUE_TASKS = `
    INSERT INTO hyrex_task (id,
                           root_id,
                           task_name,
                           args,
                           queue,
                           max_retries,
                           priority,
                           status,
                           attempt_number,
                           queued)
    VALUES ($1, $2, $3, $4, $5, $6, $7, 'queued', 0, CURRENT_TIMESTAMP);
`

export const FETCH_TASK = `
    WITH next_task AS (SELECT id
                       FROM hyrex_task
                       WHERE queue = $1
                         AND status = 'queued'
                       ORDER BY priority DESC, queued
                           FOR UPDATE SKIP LOCKED
                       LIMIT 1)
    UPDATE hyrex_task as ht
    SET status      = 'running',
        started     = CURRENT_TIMESTAMP,
        executor_id = $2
    FROM next_task
    WHERE ht.id = next_task.id
    RETURNING ht.id
        , ht.root_id
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
                       FROM hyrex_task,
                            lock_result
                       WHERE lock_acquired = TRUE
                         AND queue = $1
                         AND status = 'queued'
                         AND (SELECT COUNT(*) FROM hyrex_task WHERE queue = $1 AND status = 'running') < $2
                       ORDER BY priority DESC, queued
                           FOR UPDATE SKIP LOCKED
                       LIMIT 1)
    UPDATE hyrex_task as ht
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

// export const FETCH_TASK_FROM_ANY_QUEUE = `
// WITH next_task AS (
//     SELECT id
// FROM hyrextask
// WHERE status = 'queued'
// ORDER BY priority DESC, queued
// FOR UPDATE SKIP LOCKED
// LIMIT 1
// )
// UPDATE hyrextask
// SET status = 'running', started = CURRENT_TIMESTAMP, executor_id = $1
// FROM next_task
// WHERE hyrextask.id = next_task.id
// RETURNING hyrextask.id, hyrextask.task_name, hyrextask.args;
// `

export const MARK_TASK_FAILED = `
    UPDATE hyrex_task
    SET status   = 'failed',
        finished = CURRENT_TIMESTAMP
    WHERE id = $1
`

export const MARK_TASK_SUCCESS = `
    UPDATE hyrex_task
    SET status   = CASE
                       WHEN status = 'running' THEN 'success'::statusenum
                       WHEN status = 'up_for_cancel' THEN 'canceled'::statusenum
        END,
        finished = CURRENT_TIMESTAMP
    WHERE id = $1
      AND status IN ('running', 'up_for_cancel')
`

export const MARK_TASK_CANCELED = `
    UPDATE hyrex_task
    SET status   = 'canceled'::statusenum,
        finished = CURRENT_TIMESTAMP
    WHERE id = $1
      AND status = 'up_for_cancel'
`

export const MARK_TASK_LOST = `
    UPDATE hyrex_task
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
                             FROM hyrex_task
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
