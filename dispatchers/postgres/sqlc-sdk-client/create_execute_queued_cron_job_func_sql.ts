import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const createExecuteQueuedCronJobFunctionQuery = `-- name: CreateExecuteQueuedCronJobFunction :exec
CREATE OR REPLACE FUNCTION execute_queued_cron_job()
RETURNS text AS
$$
DECLARE
    cmd              text;
    selected_runid   bigint;
    selected_jobid   bigint;
    start_ts         timestamp;
    job_name         text;
BEGIN
    -- 1) Grab the first queued command (row) and lock it, also fetching the jobid.
    SELECT command, runid, jobid
      INTO cmd, selected_runid, selected_jobid
      FROM hyrex_cron_job_run_details
     WHERE status = 'QUEUED'
       AND schedule_time <= now()
     ORDER BY schedule_time
     LIMIT 1
     FOR UPDATE SKIP LOCKED;

    IF FOUND THEN
        -- 2) Mark start_time right before execution.
        start_ts := clock_timestamp();

        -- 3) Execute the command text.
        EXECUTE cmd;

        -- 4) Mark the end_time and set status.
        UPDATE hyrex_cron_job_run_details
           SET status      = 'SUCCESS',
               start_time  = start_ts,
               end_time    = clock_timestamp()
         WHERE runid = selected_runid
           AND status = 'QUEUED';

        -- 5) Retrieve the jobname using the selected jobid.
        SELECT jobname
          INTO job_name
          FROM hyrex_cron_job
         WHERE jobid = selected_jobid;

        RETURN 'executed ' || COALESCE(job_name, 'unknown job');
    END IF;

    RETURN 'not_found';

EXCEPTION
    WHEN OTHERS THEN
        -- In the event of an error, mark job as failed and record times.
        UPDATE hyrex_cron_job_run_details
           SET status      = 'FAILED',
               start_time  = COALESCE(start_ts, clock_timestamp()),
               end_time    = clock_timestamp()
         WHERE runid = selected_runid
           AND status = 'QUEUED';
        RAISE;
END;
$$
LANGUAGE plpgsql`;

export async function createExecuteQueuedCronJobFunction(client: Client): Promise<void> {
    await client.query({
        text: createExecuteQueuedCronJobFunctionQuery,
        values: [],
        rowMode: "array"
    });
}

