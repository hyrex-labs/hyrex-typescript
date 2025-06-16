import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const setWorkflowRunStatusBasedOnTaskRunsQuery = `-- name: SetWorkflowRunStatusBasedOnTaskRuns :one
SELECT set_workflow_run_status_based_on_task_runs FROM set_workflow_run_status_based_on_task_runs($1)`;

export interface SetWorkflowRunStatusBasedOnTaskRunsArgs {
    workflowRunId: string;
}

export interface SetWorkflowRunStatusBasedOnTaskRunsRow {
    setWorkflowRunStatusBasedOnTaskRuns: string | null;
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
        setWorkflowRunStatusBasedOnTaskRuns: row[0]
    };
}

