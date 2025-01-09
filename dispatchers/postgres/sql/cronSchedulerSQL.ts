import { CronJobRun } from "../../../HyrexCronScheduler";

export const CreateHyrexCronJobTable = `
    CREATE TABLE IF NOT EXISTS hyrex_cron_job
    (
        jobid                          bigserial PRIMARY KEY,
        schedule                       text    NOT NULL,
        command                        text    NOT NULL,
        active                         boolean NOT NULL DEFAULT true,
        jobname                        text    NOT NULL,
        activated_at                   timestamptz      default now(),
        scheduled_jobs_confirmed_until timestamptz      default now(),
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
    CREATE TABLE IF NOT EXISTS hyrex_scheduler_lock
    (
        lockid       bigserial PRIMARY KEY,
        worker_name  text        NOT NULL,
        acquired_at  timestamptz NOT NULL DEFAULT now(),
        heartbeat_at timestamptz NOT NULL DEFAULT now(),
        release_at   timestamptz NOT NULL,
        is_active    boolean     NOT NULL DEFAULT true
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

function createInsertTaskCronExpression() {

}

export const CREATE_CRON_JOB_FOR_TASK = `
    
`
