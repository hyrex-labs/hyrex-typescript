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
                'lost',
                'skipped'
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
    ON hyrex_task_run (queue, status, priority ASC, queued);

CREATE INDEX IF NOT EXISTS idx_htr_queued_started_finished
    ON hyrex_task_run(queued, started, finished);

CREATE INDEX IF NOT EXISTS idx_hyrex_task_run_root_id
    ON hyrex_task_run(root_id);
