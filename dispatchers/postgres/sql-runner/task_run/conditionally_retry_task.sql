WITH existing_task AS (SELECT durable_id,
                              root_id,
                              parent_id,
                              workflow_run_id,
                              workflow_dependencies,
                              task_name,
                              args,
                              queue,
                              attempt_number,
                              max_retries,
                              priority
                       FROM hyrex_task_run
                       WHERE id = :originalTaskId
                         AND attempt_number < max_retries)
INSERT
INTO hyrex_task_run (id,
                     durable_id,
                     root_id,
                     parent_id,
                     workflow_run_id,
                     workflow_dependencies,
                     queued,
                     status,
                     task_name,
                     args,
                     queue,
                     attempt_number,
                     max_retries,
                     priority)
SELECT :newTaskId             AS id,
       durable_id,
       root_id,
       parent_id,
       workflow_run_id,
       workflow_dependencies,
       CURRENT_TIMESTAMP  as queued,
       'queued'          AS status,
       task_name,
       args,
       queue,
       attempt_number + 1 AS attempt_number,
       max_retries,
       priority
FROM existing_task;
