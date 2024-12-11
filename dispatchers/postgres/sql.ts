export const CreateHyrexTaskTable = `
-- create type public.statusenum as enum ('success', 'failed', 'up_for_retry', 'running', 'queued');
DO $$
BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'statusenum' AND typnamespace = 'public'::regnamespace) THEN
CREATE TYPE public.statusenum AS ENUM ('success', 'failed', 'up_for_retry', 'running', 'queued', 'up_for_cancel', 'canceled', 'waiting');
END IF;
END $$;

create table if not exists hyrextask
(
    id              uuid       not null
primary key,
    root_id         uuid       not null,
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

create index if not exists ix_hyrextask_task_name
on public.hyrextask (task_name);

create index if not exists ix_hyrextask_status
on public.hyrextask (status);

create index if not exists ix_hyrextask_queue
on public.hyrextask (queue);

create index if not exists ix_hyrextask_scheduled_start
on public.hyrextask (scheduled_start);

create index if not exists index_queue_status
on public.hyrextask (status, queue, scheduled_start, task_name);
`

export const CreateExecutorTable = `
create table if not exists hyrexexecutor
(
    id      uuid    not null primary key,
    name    varchar not null,
    queue_pattern json not null,
    queues json not null,
    started timestamp with time zone,
    stopped timestamp with time zone,
    last_heartbeat timestamp with time zone
);
`

export const CreateResultsTable = `
create table if not exists taskresult
(
    task_id     uuid primary key references public.hyrextask(id) on delete cascade,
    result      json,
    created_at  timestamp with time zone default current_timestamp
);
`

export const ENQUEUE_TASKS = `
INSERT INTO hyrextask (
    id,
    root_id,
    task_name,
    args,
    queue,
    max_retries,
    priority,
    status,
    attempt_number,
    queued
) VALUES ($1, $2, $3, $4, $5, $6, $7, 'queued', 0, CURRENT_TIMESTAMP);
`

export const FETCH_TASK = `
WITH next_task AS (
    SELECT id
FROM hyrextask
WHERE
queue = $1 AND
status = 'queued'
ORDER BY priority DESC, queued
FOR UPDATE SKIP LOCKED
LIMIT 1
)
UPDATE hyrextask as ht
SET status = 'running', started = CURRENT_TIMESTAMP, executor_id = $2
FROM next_task
WHERE ht.id = next_task.id
RETURNING ht.id, ht.root_id, ht.task_name, ht.args, ht.queue, ht.priority, ht.scheduled_start, ht.queued, ht.started;
`

export const FETCH_TASK_WITH_CONCURRENCY_LIMIT = `
    WITH queue_lock AS (SELECT pg_try_advisory_xact_lock(hashtext($1)) as lock_acquired),
         running_tasks AS (SELECT COUNT(*) as running_count
                           FROM hyrextask
                           WHERE queue = $1
                             AND status = 'running'
                             AND executor_id IS NOT NULL),
         next_task AS (SELECT id
                       FROM hyrextask ht
                       WHERE queue = $1
                         AND status = 'queued'
                         AND EXISTS (SELECT 1
                                     FROM running_tasks rt,
                                          queue_lock ql
                                     WHERE rt.running_count < $3
                                       AND ql.lock_acquired = true)
                       ORDER BY priority DESC, queued
        FOR UPDATE SKIP LOCKED
    LIMIT 1
)
    UPDATE hyrextask as ht
    SET status         = 'running',
        started        = CURRENT_TIMESTAMP,
        executor_id    = $2,
        attempt_number = attempt_number + 1 FROM next_task
    WHERE hyrextask.id = next_task.id
        RETURNING
        CASE WHEN (SELECT lock_acquired FROM queue_lock)
        THEN hyrextask.id
        ELSE NULL
    END as 
    ht.id, ht.root_id, ht.task_name, ht.args, ht.queue, ht.priority, ht.scheduled_start, ht.queued, ht.started;
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
UPDATE hyrextask
SET status = 'failed', finished = CURRENT_TIMESTAMP
WHERE id = $1
`

export const MARK_TASK_SUCCESS = `
    UPDATE hyrextask
    SET status   = CASE
                       WHEN status = 'running' THEN 'success'::statusenum
                       WHEN status = 'up_for_cancel' THEN 'canceled'::statusenum
        END,
        finished = CURRENT_TIMESTAMP
    WHERE id = $1
      AND status IN ('running', 'up_for_cancel')
`

export const MARK_TASK_CANCELED = `
UPDATE hyrextask
SET status = 'canceled'::statusenum, finished = CURRENT_TIMESTAMP
WHERE id = $1 AND status = 'up_for_cancel'
`

export const MARK_TASK_LOST = `
UPDATE hyrextask
SET status = 'lost'::statusenum, finished = CURRENT_TIMESTAMP
WHERE id = $1
`

export const REGISTER_EXECUTOR = `
    INSERT INTO hyrexexecutor (
    id,
    name,
    queue_pattern,
    queues,
    started,
    stopped,
    last_heartbeat
) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, null, CURRENT_TIMESTAMP);
`

export const UPDATE_QUEUES_ON_EXECUTOR = `
    UPDATE hyrexexecutor
    SET queues = $2
    where id = $1;
`

export const DISCONNECT_EXECUTOR = `
    UPDATE hyrexexecutor
    SET stopped = CURRENT_TIMESTAMP, last_heartbeat = CURRENT_TIMESTAMP
    where id = $1;
`

export const UPDATE_HEARTBEAT = `
    
`

export const SAVE_RESULT = `
    INSERT INTO taskresult
        (task_id, result)
    VALUES ($1, $2)
`

export const FETCH_RESULT = `SELECT result FROM taskresult WHERE task_id = $1;`

export const FETCH_ACTIVE_QUEUE_NAMES = `
    WITH distinct_queues AS (SELECT DISTINCT queue
                             FROM hyrextask
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
