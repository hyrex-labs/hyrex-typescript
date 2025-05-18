INSERT INTO hyrex_cron_job (schedule, command, jobname, job_source)
VALUES (:schedule, :command, :jobName, 'TASK')
ON CONFLICT (jobname) 
DO UPDATE SET 
    schedule = EXCLUDED.schedule,
    command = EXCLUDED.command,
    job_source = 'TASK',
    active = true;
