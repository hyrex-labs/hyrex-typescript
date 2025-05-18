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
