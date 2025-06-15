import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const getWorkflowRunTaskRunsQuery = `-- name: GetWorkflowRunTaskRuns :many
WITH latest_attempts AS (
    SELECT 
        id as task_id,
        durable_id,
        task_name,
        status,
        workflow_dependencies,
        queued,
        ROW_NUMBER() OVER (PARTITION BY durable_id ORDER BY queued DESC) as rn
    FROM hyrex_task_run
    WHERE workflow_run_id = $1
)
SELECT 
    task_id,
    durable_id,
    task_name,
    status,
    workflow_dependencies
FROM latest_attempts
WHERE rn = 1
ORDER BY queued`;

export interface GetWorkflowRunTaskRunsArgs {
    workflowRunId: string | null;
}

export interface GetWorkflowRunTaskRunsRow {
    taskId: string;
    durableId: string;
    taskName: string;
    status: string;
    workflowDependencies: string[] | null;
}

export async function getWorkflowRunTaskRuns(client: Client, args: GetWorkflowRunTaskRunsArgs): Promise<GetWorkflowRunTaskRunsRow[]> {
    const result = await client.query({
        text: getWorkflowRunTaskRunsQuery,
        values: [args.workflowRunId],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            taskId: row[0],
            durableId: row[1],
            taskName: row[2],
            status: row[3],
            workflowDependencies: row[4]
        };
    });
}

