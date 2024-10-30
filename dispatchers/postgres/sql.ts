export const CreateHyrexTaskTable = `
-- create type public.statusenum as enum ('success', 'failed', 'up_for_retry', 'running', 'queued');
DO $$
BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'statusenum' AND typnamespace = 'public'::regnamespace) THEN
CREATE TYPE public.statusenum AS ENUM ('success', 'failed', 'up_for_retry', 'running', 'queued');
END IF;
END $$;

create table if not exists public.hyrextask
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
    worker_id       uuid,
    queued          timestamp with time zone,
    started         timestamp with time zone,
    finished        timestamp with time zone
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

export const CreateWorkerTable = `
create table if not exists public.hyrexworker
(
    id      uuid    not null
primary key,
    name    varchar not null,
    queue   varchar not null,
    started timestamp,
    stopped timestamp
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
ORDER BY priority DESC, id
FOR UPDATE SKIP LOCKED
LIMIT 1
)
UPDATE hyrextask
SET status = 'running', started = CURRENT_TIMESTAMP, worker_id = $2
FROM next_task
WHERE hyrextask.id = next_task.id
RETURNING hyrextask.id, hyrextask.task_name, hyrextask.args;
`

export const FETCH_TASK_FROM_ANY_QUEUE = `
WITH next_task AS (
    SELECT id
FROM hyrextask
WHERE status = 'queued'
ORDER BY priority DESC, id
FOR UPDATE SKIP LOCKED
LIMIT 1
)
UPDATE hyrextask
SET status = 'running', started = CURRENT_TIMESTAMP, worker_id = $1
FROM next_task
WHERE hyrextask.id = next_task.id
RETURNING hyrextask.id, hyrextask.task_name, hyrextask.args;
`

export const MARK_TASK_FAILED = `
UPDATE hyrextask
SET status = 'failed', finished = CURRENT_TIMESTAMP
WHERE id = $1
`

export const MARK_TASK_SUCCESS = `
UPDATE hyrextask
SET status = 'success', finished = CURRENT_TIMESTAMP
WHERE id = $1
`
