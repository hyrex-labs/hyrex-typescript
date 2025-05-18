UPDATE hyrex_cron_job
SET scheduled_jobs_confirmed_until = now()
WHERE jobid = :jobId;
