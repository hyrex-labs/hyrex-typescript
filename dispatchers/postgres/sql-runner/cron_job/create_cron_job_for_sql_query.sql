INSERT INTO hyrex_cron_job (schedule, command, jobname, should_backfill, job_source)
VALUES (:schedule, :command, :jobName, :shouldBackfill, 'SYSTEM')
ON CONFLICT (jobname) 
DO UPDATE SET 
    schedule = EXCLUDED.schedule,
    command = EXCLUDED.command,
    should_backfill = EXCLUDED.should_backfill,
    job_source = 'SYSTEM',
    active = true;
