SELECT jobid,
       schedule,
       command,
       active,
       jobname,
       activated_at,
       scheduled_jobs_confirmed_until,
       should_backfill
FROM hyrex_cron_job
WHERE active = true
