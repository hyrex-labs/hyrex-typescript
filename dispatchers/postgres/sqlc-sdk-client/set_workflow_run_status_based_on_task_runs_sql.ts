import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const setWorkflowRunStatusBasedOnTaskRunsQuery = `-- name: SetWorkflowRunStatusBasedOnTaskRuns :one
WITH latest_attempts AS (
    -- Get the latest attempt for each durable_id
    SELECT DISTINCT ON (durable_id)
        durable_id,
        workflow_run_id,
        status,
        attempt_number,
        max_retries
    FROM hyrex_task_run
    ORDER BY durable_id, attempt_number DESC
),
     workflow_statuses AS (
         SELECT w.id AS workflow_run_id,
                CASE
                    -- If any task has failed on its final attempt, workflow is failed
                    WHEN EXISTS (
                        SELECT 1
                        FROM latest_attempts
                        WHERE latest_attempts.workflow_run_id = w.id
                          AND status = 'FAILED'::task_run_status
                          AND attempt_number >= max_retries
                    ) THEN 'FAILED'::workflow_run_status

                    -- If any task is still in progress, workflow is running
                    WHEN EXISTS (
                        SELECT 1
                        FROM latest_attempts
                        WHERE latest_attempts.workflow_run_id = w.id
                          AND status IN ('RUNNING', 'QUEUED', 'AWAIT_DEPS', 'AWAIT_START_TIME', 'UP_FOR_CANCEL')
                    ) THEN 'RUNNING'::workflow_run_status

                    -- If all tasks are either success or skipped, workflow is success
                    WHEN NOT EXISTS (
                        SELECT 1
                        FROM latest_attempts
                        WHERE latest_attempts.workflow_run_id = w.id
                          AND status NOT IN ('SUCCESS', 'SKIPPED')
                    ) THEN 'SUCCESS'::workflow_run_status

                    -- Handle other states (lost, canceled)
                    WHEN EXISTS (
                        SELECT 1
                        FROM latest_attempts
                        WHERE latest_attempts.workflow_run_id = w.id
                          AND status IN ('LOST', 'CANCELED')
                    ) THEN 'FAILED'::workflow_run_status

                    -- Otherwise, keep current status
                    ELSE w.status
                    END AS new_status
         FROM hyrex_workflow_run w
         WHERE w.id = $1 -- Specific workflow
           AND w.status NOT IN ('SUCCESS', 'FAILED') -- Only if not in terminal state
     )
UPDATE hyrex_workflow_run w
SET status   = ws.new_status,
    finished = CASE
                   WHEN ws.new_status IN ('SUCCESS', 'FAILED')
                       THEN CURRENT_TIMESTAMP
                   ELSE w.finished
        END
FROM workflow_statuses ws
WHERE w.id = ws.workflow_run_id
RETURNING w.id, w.status`;

export interface SetWorkflowRunStatusBasedOnTaskRunsArgs {
    workflowRunId: string;
}

export interface SetWorkflowRunStatusBasedOnTaskRunsRow {
    id: string;
    status: string;
}

export async function setWorkflowRunStatusBasedOnTaskRuns(client: Client, args: SetWorkflowRunStatusBasedOnTaskRunsArgs): Promise<SetWorkflowRunStatusBasedOnTaskRunsRow | null> {
    const result = await client.query({
        text: setWorkflowRunStatusBasedOnTaskRunsQuery,
        values: [args.workflowRunId],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        id: row[0],
        status: row[1]
    };
}

