import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const createJobSourceTypeEnumQuery = `-- name: CreateJobSourceTypeEnum :exec
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'job_source_type') THEN
        CREATE TYPE job_source_type AS ENUM ('SYSTEM', 'TASK', 'APPLICATION');
    END IF;
END
$$`;

export async function createJobSourceTypeEnum(client: Client): Promise<void> {
    await client.query({
        text: createJobSourceTypeEnumQuery,
        values: [],
        rowMode: "array"
    });
}

export const createCronJobTableQuery = `-- name: CreateCronJobTable :exec
CREATE TABLE IF NOT EXISTS hyrex_cron_job
(
    jobid                          bigserial PRIMARY KEY,
    schedule                       text,
    command                        text    NOT NULL,
    active                         boolean NOT NULL DEFAULT true,
    jobname                        text    NOT NULL,
    job_source                     job_source_type NOT NULL,
    activated_at                   timestamptz      default now(),
    scheduled_jobs_confirmed_until timestamptz      default now(),
    should_backfill                boolean default true,
    UNIQUE (jobname)
)`;

export async function createCronJobTable(client: Client): Promise<void> {
    await client.query({
        text: createCronJobTableQuery,
        values: [],
        rowMode: "array"
    });
}

export const createAppTableQuery = `-- name: CreateAppTable :exec
CREATE TABLE IF NOT EXISTS hyrex_app
(
    id       BIGSERIAL NOT NULL PRIMARY KEY,
    app_info JSON
)`;

export async function createAppTable(client: Client): Promise<void> {
    await client.query({
        text: createAppTableQuery,
        values: [],
        rowMode: "array"
    });
}

export const createWorkflowRunStatusEnumQuery = `-- name: CreateWorkflowRunStatusEnum :exec
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 
                   FROM pg_type 
                   WHERE typname = 'workflow_run_status' 
                     AND typnamespace = 'public'::regnamespace) THEN
        CREATE TYPE public.workflow_run_status AS ENUM (
            'success',
            'failed',
            'running',
            'up_for_cancel',
            'canceled',
            'asleep'
        );
    END IF;
END $$`;

export async function createWorkflowRunStatusEnum(client: Client): Promise<void> {
    await client.query({
        text: createWorkflowRunStatusEnumQuery,
        values: [],
        rowMode: "array"
    });
}

export const createWorkflowRunTableQuery = `-- name: CreateWorkflowRunTable :exec
CREATE TABLE IF NOT EXISTS hyrex_workflow_run (
    id              UUID                        NOT NULL PRIMARY KEY,
    parent_id       UUID,
    workflow_name   VARCHAR                     NOT NULL,
    args            JSON                        NOT NULL,
    queue           VARCHAR                     NOT NULL,
    timeout_seconds INT                         DEFAULT NULL CHECK (timeout_seconds IS NULL OR timeout_seconds > 0),
    status          workflow_run_status             NOT NULL,
    scheduled_start TIMESTAMP WITH TIME ZONE,
    queued          TIMESTAMP WITH TIME ZONE,
    started         TIMESTAMP WITH TIME ZONE,
    finished        TIMESTAMP WITH TIME ZONE,
    last_heartbeat  TIMESTAMP WITH TIME ZONE,
    idempotency_key VARCHAR
)`;

export async function createWorkflowRunTable(client: Client): Promise<void> {
    await client.query({
        text: createWorkflowRunTableQuery,
        values: [],
        rowMode: "array"
    });
}

export const createSystemLogTableQuery = `-- name: CreateSystemLogTable :exec
CREATE TABLE IF NOT EXISTS hyrex_system_logs
(
    id         UUID    NOT NULL PRIMARY KEY,
    timestamp  TIMESTAMP WITH TIME ZONE,
    event_name VARCHAR NOT NULL,
    event_body JSON    NOT NULL
)`;

export async function createSystemLogTable(client: Client): Promise<void> {
    await client.query({
        text: createSystemLogTableQuery,
        values: [],
        rowMode: "array"
    });
}

export const createTaskRunStatusEnumQuery = `-- name: CreateTaskRunStatusEnum :exec
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
                'lost',
                'skipped'
                );
        END IF;
    END $$`;

export async function createTaskRunStatusEnum(client: Client): Promise<void> {
    await client.query({
        text: createTaskRunStatusEnumQuery,
        values: [],
        rowMode: "array"
    });
}

export const createTaskRunTableQuery = `-- name: CreateTaskRunTable :exec
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
)`;

export async function createTaskRunTable(client: Client): Promise<void> {
    await client.query({
        text: createTaskRunTableQuery,
        values: [],
        rowMode: "array"
    });
}

export const createTaskRunIndexesQuery = `-- name: CreateTaskRunIndexes :exec
CREATE INDEX IF NOT EXISTS ix_hyrex_task_run_task_name
    ON public.hyrex_task_run (task_name)`;

export async function createTaskRunIndexes(client: Client): Promise<void> {
    await client.query({
        text: createTaskRunIndexesQuery,
        values: [],
        rowMode: "array"
    });
}

export const createResultsTableQuery = `-- name: CreateResultsTable :exec
CREATE TABLE IF NOT EXISTS hyrex_task_result
(
    task_id    UUID PRIMARY KEY REFERENCES public.hyrex_task_run (id) ON DELETE CASCADE,
    result     JSON,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
)`;

export async function createResultsTable(client: Client): Promise<void> {
    await client.query({
        text: createResultsTableQuery,
        values: [],
        rowMode: "array"
    });
}

export const createStatsTaskStatusCountsTableQuery = `-- name: CreateStatsTaskStatusCountsTable :exec
CREATE TABLE IF NOT EXISTS hyrex_stats_task_status_counts
(
    timepoint     TIMESTAMP WITH TIME ZONE PRIMARY KEY,
    queued        INTEGER,
    running       INTEGER,
    waiting       INTEGER,
    failed        INTEGER,
    success       INTEGER,
    lost          INTEGER,
    total         INTEGER,
    queued_delta  INTEGER,
    success_delta INTEGER,
    failed_delta  INTEGER,
    lost_delta    INTEGER
)`;

export async function createStatsTaskStatusCountsTable(client: Client): Promise<void> {
    await client.query({
        text: createStatsTaskStatusCountsTableQuery,
        values: [],
        rowMode: "array"
    });
}

export const createStatsTaskStatusCountsIndexQuery = `-- name: CreateStatsTaskStatusCountsIndex :exec
CREATE INDEX IF NOT EXISTS idx_hstsc_timepoint
    ON hyrex_stats_task_status_counts(timepoint)`;

export async function createStatsTaskStatusCountsIndex(client: Client): Promise<void> {
    await client.query({
        text: createStatsTaskStatusCountsIndexQuery,
        values: [],
        rowMode: "array"
    });
}

export const createExecutorStatusEnumQuery = `-- name: CreateExecutorStatusEnum :exec
DO $$
BEGIN
    -- Create enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'executor_status') THEN
        CREATE TYPE executor_status AS ENUM ('SHUTDOWN', 'LOST', 'RUNNING', 'UNKNOWN');
    END IF;
END$$`;

export async function createExecutorStatusEnum(client: Client): Promise<void> {
    await client.query({
        text: createExecutorStatusEnumQuery,
        values: [],
        rowMode: "array"
    });
}

export const createExecutorTableQuery = `-- name: CreateExecutorTable :exec
CREATE TABLE IF NOT EXISTS hyrex_executor
(
    id             UUID    NOT NULL PRIMARY KEY,
    name           VARCHAR NOT NULL,
    worker_name    VARCHAR NOT NULL,
    queue_pattern  VARCHAR NOT NULL,
    queues         VARCHAR[] NOT NULL,
    started        TIMESTAMP WITH TIME ZONE,
    stopped        TIMESTAMP WITH TIME ZONE,
    last_heartbeat TIMESTAMP WITH TIME ZONE,
    stats          JSON,
    status         executor_status NOT NULL DEFAULT 'UNKNOWN'
)`;

export async function createExecutorTable(client: Client): Promise<void> {
    await client.query({
        text: createExecutorTableQuery,
        values: [],
        rowMode: "array"
    });
}

export const createSchedulerLockTableQuery = `-- name: CreateSchedulerLockTable :exec
CREATE TABLE IF NOT EXISTS hyrex_scheduler_lock
(
    lockid       bigserial PRIMARY KEY,
    worker_name  text        NOT NULL,
    acquired_at  timestamptz NOT NULL DEFAULT now(),
    heartbeat_at timestamptz NOT NULL DEFAULT now(),
    release_at   timestamptz NOT NULL,
    is_active    boolean     NOT NULL DEFAULT true
)`;

export async function createSchedulerLockTable(client: Client): Promise<void> {
    await client.query({
        text: createSchedulerLockTableQuery,
        values: [],
        rowMode: "array"
    });
}

export const createTaskDefTableQuery = `-- name: CreateTaskDefTable :exec
CREATE TABLE IF NOT EXISTS hyrex_task_def
(
    task_name      TEXT NOT NULL PRIMARY KEY,
    cron_expr      TEXT,
    source_code    TEXT,
    default_config JSON,
    arg_schema     JSON,
    last_updated   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
)`;

export async function createTaskDefTable(client: Client): Promise<void> {
    await client.query({
        text: createTaskDefTableQuery,
        values: [],
        rowMode: "array"
    });
}

export const createWorkflowTableQuery = `-- name: CreateWorkflowTable :exec
CREATE TABLE IF NOT EXISTS hyrex_workflow
(
    workflow_name TEXT NOT NULL PRIMARY KEY,
    cron_expr     TEXT,
    source_code   TEXT,
    dag_structure JSONB,
    last_updated  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
)`;

export async function createWorkflowTable(client: Client): Promise<void> {
    await client.query({
        text: createWorkflowTableQuery,
        values: [],
        rowMode: "array"
    });
}

export const createCronJobStatusEnumQuery = `-- name: CreateCronJobStatusEnum :exec
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'cron_job_status_enum' AND typnamespace = 'public'::regnamespace) THEN
        CREATE TYPE public.cron_job_status_enum AS ENUM (
            'success',
            'queued',
            'failed'
        );
    END IF;
END $$`;

export async function createCronJobStatusEnum(client: Client): Promise<void> {
    await client.query({
        text: createCronJobStatusEnumQuery,
        values: [],
        rowMode: "array"
    });
}

export const createCronJobRunDetailsTableQuery = `-- name: CreateCronJobRunDetailsTable :exec
CREATE TABLE IF NOT EXISTS hyrex_cron_job_run_details (
  jobid        bigint      NOT NULL,
  runid        bigserial   PRIMARY KEY,
  command      text        NOT NULL,
  status       cron_job_status_enum,
  schedule_time timestamptz not null,
  start_time   timestamptz,
  end_time     timestamptz,
  UNIQUE (jobid, schedule_time)
)`;

export async function createCronJobRunDetailsTable(client: Client): Promise<void> {
    await client.query({
        text: createCronJobRunDetailsTableQuery,
        values: [],
        rowMode: "array"
    });
}

