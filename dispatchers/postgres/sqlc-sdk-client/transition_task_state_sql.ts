import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const transitionTaskStateQuery = `-- name: TransitionTaskState :one
SELECT id, durable_id, root_id, parent_id, workflow_run_id, workflow_dependencies, task_name, args, queue, max_retries, priority, timeout_seconds, status, attempt_number, scheduled_start, executor_id, queued, started, finished, last_heartbeat, idempotency_key, log_link FROM transition_task_state(
    $1::UUID,
    $2::task_run_status
)`;

export interface TransitionTaskStateArgs {
    taskId: string;
    nextState: string;
}

export interface TransitionTaskStateRow {
    id: string;
    durableId: string;
    rootId: string;
    parentId: string | null;
    workflowRunId: string | null;
    workflowDependencies: string[] | null;
    taskName: string;
    args: any;
    queue: string;
    maxRetries: number;
    priority: number;
    timeoutSeconds: number | null;
    status: string;
    attemptNumber: number;
    scheduledStart: Date | null;
    executorId: string | null;
    queued: Date | null;
    started: Date | null;
    finished: Date | null;
    lastHeartbeat: Date | null;
    idempotencyKey: string | null;
    logLink: string | null;
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
        id: row[0],
        durableId: row[1],
        rootId: row[2],
        parentId: row[3],
        workflowRunId: row[4],
        workflowDependencies: row[5],
        taskName: row[6],
        args: row[7],
        queue: row[8],
        maxRetries: row[9],
        priority: row[10],
        timeoutSeconds: row[11],
        status: row[12],
        attemptNumber: row[13],
        scheduledStart: row[14],
        executorId: row[15],
        queued: row[16],
        started: row[17],
        finished: row[18],
        lastHeartbeat: row[19],
        idempotencyKey: row[20],
        logLink: row[21]
    };
}

