UPDATE hyrex_cron_job
SET active   = false,
    schedule = NULL
WHERE jobname = :jobName
  AND job_source = 'TASK';
