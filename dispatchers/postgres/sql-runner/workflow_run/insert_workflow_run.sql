INSERT INTO hyrex_workflow_run (
  id,
  parent_id,
  workflow_name,
  args,
  queue,
  timeout_seconds,
  status,
  queued,
  last_heartbeat,
  idempotency_key
)
VALUES (:workflowRunId, NULL, :workflowName, :args, :queue, :timeoutSeconds, 'running'::workflow_run_status, now(), now(), :idempotencyKey)
RETURNING id;
