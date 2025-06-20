import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const createAdvanceWorkflowRunFunctionQuery = `-- name: CreateAdvanceWorkflowRunFunction :exec
CREATE OR REPLACE FUNCTION advance_workflow_run(p_workflow_run_id uuid)
    RETURNS TABLE (task_id uuid, new_status task_run_status, workflow_run_id uuid)
    LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
        WITH latest AS (
            -- one row (the most-recent attempt) per durable_id in this workflow run
            SELECT DISTINCT ON (tr.durable_id)
                tr.id, tr.durable_id, tr.status, tr.workflow_dependencies
            FROM   hyrex_task_run tr
            WHERE  tr.workflow_run_id = p_workflow_run_id
            ORDER  BY tr.durable_id, tr.attempt_number DESC
            ),

            -- explode dependencies; keep rows even when there are none
            deps AS (
                SELECT l.id                        AS task_id,
                       d.dep_durable_id
                FROM   latest l
                           LEFT   JOIN LATERAL unnest(l.workflow_dependencies)  -- returns zero rows for NULL/empty
                    AS d(dep_durable_id) ON TRUE
                ),

            dep_status AS (
                /* For every dependency edge, pull the latest status of that dependency.
                   If a dependency durable_id doesn’t exist in "latest", dep_status will be NULL. */
                SELECT d.task_id,
                       bool_and(ld.status = 'SUCCESS')          AS all_success,
                       bool_and(ld.status IS NOT NULL)          AS all_present
                FROM   deps d
                           LEFT   JOIN latest ld ON ld.durable_id = d.dep_durable_id
                GROUP BY d.task_id
                ),

            ready AS (
                /* A task is ready when:
                   • its own latest status is AWAIT_DEPS, AND
                   • (it has no deps) OR (all deps are present AND all succeeded) */
                SELECT l.id
                FROM   latest l
                           LEFT   JOIN dep_status s ON s.task_id = l.id
                WHERE  l.status = 'AWAIT_DEPS'
                  AND (
                    l.workflow_dependencies IS NULL
                        OR array_length(l.workflow_dependencies,1) = 0
                        OR (s.all_present AND s.all_success)
                    )
                ),

            locked AS (
                -- make promotion idempotent under concurrency
                SELECT tr.id
                FROM   hyrex_task_run tr
                           JOIN   ready r ON r.id = tr.id
                    FOR UPDATE SKIP LOCKED
                )

            UPDATE hyrex_task_run trg
                SET status = 'QUEUED'::task_run_status,
                    queued = now()
                FROM locked
                WHERE trg.id = locked.id
                RETURNING trg.id AS task_id, trg.status AS status, trg.workflow_run_id AS workflow_run_id;
END;
$$`;

export async function createAdvanceWorkflowRunFunction(client: Client): Promise<void> {
    await client.query({
        text: createAdvanceWorkflowRunFunctionQuery,
        values: [],
        rowMode: "array"
    });
}

