import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const transitionTaskStateQuery = `-- name: TransitionTaskState :one
SELECT transition_task_state(
    $1::UUID,
    $2::task_run_status
) AS task_run`;

export interface TransitionTaskStateArgs {
    taskId: string;
    nextState: string;
}

export interface TransitionTaskStateRow {
    taskRun: string | null;
}

export async function transitionTaskState(client: Client, args: TransitionTaskStateArgs): Promise<TransitionTaskStateRow | null> {
    const result = await client.query({
        text: transitionTaskStateQuery,
        values: [args.taskId, args.nextState],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        taskRun: row[0]
    };
}

