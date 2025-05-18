INSERT INTO hyrex_executor (id,
                            name,
                            queue_pattern,
                            queues,
                            worker_name,
                            started,
                            stopped,
                            last_heartbeat,
                            status)
VALUES (:executorId, :executorName, :queuePattern, :queues, :workerName, CURRENT_TIMESTAMP, null, CURRENT_TIMESTAMP, 'RUNNING'::executor_status);
