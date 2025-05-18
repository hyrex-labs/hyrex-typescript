WITH distinct_queues AS (SELECT DISTINCT queue
                         FROM hyrex_task_run
                         WHERE status = 'queued'
                           AND queue LIKE :queuePattern),
     queue_count AS (SELECT COUNT(*) AS cnt
                     FROM distinct_queues)
SELECT queue
FROM (
         -- If count <= 100000, just select all queues
         SELECT dq.queue
         FROM distinct_queues dq,
              queue_count qc
         WHERE qc.cnt <= 100000

         UNION ALL

         -- If count > 100000, select a random subset
         SELECT queue
         FROM (SELECT dq.queue,
                      row_number() OVER (ORDER BY random()) AS rn
               FROM distinct_queues dq,
                    queue_count qc
               WHERE qc.cnt > 100000) sub
         WHERE rn <= 100000) final_result;
