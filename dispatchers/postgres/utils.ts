import { SerializedTaskRequest } from "../HyrexDispatcher";

/**
 * Creates a SQL command string that inserts a task run into the database.
 * This command is stored in the cron job table and executed later by the scheduler.
 *
 * @param serializedTaskRequest The task request to convert to SQL
 * @returns SQL command string for inserting the task
 */
export function createInsertTaskCronExpression(serializedTaskRequest: SerializedTaskRequest): string {
    const tr = serializedTaskRequest;

    const sql = `WITH vars AS (
        SELECT uuid7() as shared_uuid
    ),
                      task_insertion AS (
                          INSERT INTO hyrex_task_run (
                                                      id,
                                                      durable_id,
                                                      root_id,
                                                      task_name,
                                                      args,
                                                      queue,
                                                      max_retries,
                                                      priority,
                                                      timeout_seconds,
                                                      status,
                                                      attempt_number,
                                                      queued,
                                                      idempotency_key
                              )
                              SELECT
                                  v.shared_uuid,
                                  v.shared_uuid,
                                  v.shared_uuid,
                                  '${tr.task_name}',
                                  '${JSON.stringify(tr.args)}'::json,
                                  '${tr.queue}',
                                  ${tr.max_retries},
                                  ${tr.priority},
                                  ${tr.timeout_seconds},
                                  'QUEUED'::task_run_status,
                                  0,
                                  CURRENT_TIMESTAMP,
                                  ${tr.idempotency_key === null ? 'NULL' : `'${tr.idempotency_key}'`}
                              FROM vars v
                              ON CONFLICT (task_name, idempotency_key)
                                  WHERE idempotency_key IS NOT NULL
                                  DO NOTHING
                              RETURNING id),
                      log_entry AS (
                          INSERT INTO hyrex_system_logs (
                                                         id,
                                                         timestamp,
                                                         event_name,
                                                         event_body
                              )
                              SELECT gen_random_uuid(),
                                     CURRENT_TIMESTAMP,
                                     'IDEMPOTENCY_COLLISION',
                                     json_build_object(
                                             'attempted_task_id', v.shared_uuid,
                                             'idempotency_key', ${tr.idempotency_key === null ? 'NULL' : `'${tr.idempotency_key}'`},
                                             'task_name', '${tr.task_name}',
                                             'queue', '${tr.queue}'
                                     )
                              FROM vars v
                              WHERE NOT EXISTS (SELECT 1 FROM task_insertion)
                                AND ${tr.idempotency_key === null ? 'NULL' : `'${tr.idempotency_key}'`} IS NOT NULL
                      )
                 SELECT (SELECT id FROM task_insertion) as task_created;`

    return sql;
}
