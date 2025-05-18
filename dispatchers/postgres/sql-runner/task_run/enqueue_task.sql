WITH task_insertion AS (
    INSERT INTO hyrex_task_run (
                                id,
                                durable_id,
                                root_id,
                                workflow_run_id,
                                workflow_dependencies,
                                parent_id,
                                status,
                                task_name,
                                args,
                                queue,
                                max_retries,
                                priority,
                                timeout_seconds,
                                attempt_number,
                                queued,
                                idempotency_key
        )
        VALUES (
                   :taskId, :durableId, :rootId, :workflowRunId, :workflowDependencies, :parentId, :status, 
                   :taskName, :taskArgs, :queue, :maxRetries, :priority, :timeoutSeconds,
                   0,
                   CURRENT_TIMESTAMP,
                   :idempotencyKey
               )
        ON CONFLICT (task_name, idempotency_key)
            WHERE idempotency_key IS NOT NULL
            DO NOTHING
        RETURNING id
),
     log_entry AS (
         INSERT INTO hyrex_system_logs (
                                        id,
                                        timestamp,
                                        event_name,
                                        event_body
             )
             SELECT
                 gen_random_uuid(),
                 CURRENT_TIMESTAMP,
                 'IDEMPOTENCY_COLLISION',
                 json_build_object(
                         'attempted_task_id', :taskId,
                         'idempotency_key', :idempotencyKey,
                         'task_name', :taskName,
                         'queue', :queue
                 )
             WHERE NOT EXISTS (SELECT 1 FROM task_insertion)
               AND :idempotencyKey IS NOT NULL
     )
SELECT EXISTS (SELECT 1 FROM task_insertion) as task_created;
