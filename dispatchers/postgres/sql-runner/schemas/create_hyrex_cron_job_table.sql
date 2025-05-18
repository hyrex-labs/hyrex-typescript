DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'job_source_type') THEN
        CREATE TYPE job_source_type AS ENUM ('SYSTEM', 'TASK', 'APPLICATION');
    END IF;
END
$$;

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
);
