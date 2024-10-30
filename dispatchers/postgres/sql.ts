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
    task_name       varchar    not null,
    status          statusenum not null,
    queue           varchar    not null,
    scheduled_start timestamp with time zone,
    worker_id       uuid,
    queued          timestamp with time zone,
    started         timestamp with time zone,
    finished        timestamp with time zone,
    retried         integer    not null,
    args            json
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
