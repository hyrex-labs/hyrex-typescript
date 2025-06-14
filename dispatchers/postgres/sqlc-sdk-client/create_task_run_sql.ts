import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const createTaskRunQuery = `-- name: CreateTaskRun :one
SELECT create_task_run(
    $1::UUID,
    $2::UUID,
    $3::UUID,
    $4::UUID,
    $5::task_run_status,
    $6::VARCHAR,
    $7::JSON,
    $8::VARCHAR,
    $9::SMALLINT,
    $10::SMALLINT,
    $11::INT,
    $12::VARCHAR,
    $13::TIMESTAMP WITH TIME ZONE,
    $14::UUID,
    $15::UUID[]
) AS id`;

export interface CreateTaskRunArgs {
    id: string;
    durableId: string;
    rootId: string;
    parentId: string;
    status: string;
    taskName: string;
    args: any;
    queue: string;
    maxRetries: number;
    priority: number;
    timeoutSeconds: number;
    idempotencyKey: string;
    scheduledStart: Date;
    workflowRunId: string;
    workflowDependencies: string[];
}

export interface CreateTaskRunRow {
    id: string;
}

export async function createTaskRun(client: Client, args: CreateTaskRunArgs): Promise<CreateTaskRunRow | null> {
    const result = await client.query({
        text: createTaskRunQuery,
        values: [args.id, args.durableId, args.rootId, args.parentId, args.status, args.taskName, args.args, args.queue, args.maxRetries, args.priority, args.timeoutSeconds, args.idempotencyKey, args.scheduledStart, args.workflowRunId, args.workflowDependencies],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        id: row[0]
    };
}

export const createTaskRunFunctionQuery = `-- name: CreateTaskRunFunction :exec
CREATE OR REPLACE FUNCTION create_task_run(
    p_id UUID,
    p_durable_id UUID,
    p_root_id UUID,
    p_parent_id UUID,
    p_status task_run_status,
    p_task_name VARCHAR,
    p_args JSON,
    p_queue VARCHAR,
    p_max_retries SMALLINT,
    p_priority SMALLINT,
    p_timeout_seconds INT DEFAULT NULL,
    p_idempotency_key VARCHAR DEFAULT NULL,
    p_scheduled_start TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_workflow_run_id UUID DEFAULT NULL,
    p_workflow_dependencies UUID[] DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_task_id UUID;
    v_queued_timestamp TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Validate inputs
    IF p_status = 'AWAIT_START_TIME' AND p_scheduled_start IS NULL THEN
        RAISE EXCEPTION 'scheduled_start is required when status is AWAIT_START_TIME';
    END IF;
    
    IF p_status NOT IN ('QUEUED', 'AWAIT_START_TIME', 'AWAIT_DEPS') THEN
        RAISE EXCEPTION 'Initial task status must be QUEUED, AWAIT_START_TIME, or AWAIT_DEPS';
    END IF;
    
    -- Set queued timestamp only for QUEUED status
    IF p_status = 'QUEUED' THEN
        v_queued_timestamp := CURRENT_TIMESTAMP;
    ELSE
        v_queued_timestamp := NULL;
    END IF;
    
    -- Insert the task
    INSERT INTO hyrex_task_run (
        id,
        durable_id,
        root_id,
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
        idempotency_key,
        scheduled_start,
        workflow_run_id,
        workflow_dependencies
    )
    VALUES (
        p_id,
        p_durable_id,
        p_root_id,
        p_parent_id,
        p_status,
        p_task_name,
        p_args,
        p_queue,
        p_max_retries,
        p_priority,
        p_timeout_seconds,
        0,
        v_queued_timestamp,
        p_idempotency_key,
        p_scheduled_start,
        p_workflow_run_id,
        p_workflow_dependencies
    )
    ON CONFLICT (task_name, idempotency_key)
        WHERE idempotency_key IS NOT NULL
        DO NOTHING
    RETURNING id INTO v_task_id;
    
    -- Log idempotency conflict if it occurred
    IF v_task_id IS NULL AND p_idempotency_key IS NOT NULL THEN
        INSERT INTO hyrex_system_logs (id, timestamp, event_name, event_body)
        VALUES (
            gen_random_uuid(),
            CURRENT_TIMESTAMP,
            'task_idempotency_conflict',
            json_build_object(
                'task_name', p_task_name,
                'idempotency_key', p_idempotency_key,
                'attempted_task_id', p_id,
                'queue', p_queue,
                'status', p_status::TEXT
            )
        );
    END IF;
    
    -- Return NULL if conflict occurred, otherwise return the new task ID
    RETURN v_task_id;
END;
$$ LANGUAGE plpgsql`;

export async function createTaskRunFunction(client: Client): Promise<void> {
    await client.query({
        text: createTaskRunFunctionQuery,
        values: [],
        rowMode: "array"
    });
}

