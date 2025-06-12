import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const createExecuteQueuedCronJobFunctionQuery = `-- name: CreateExecuteQueuedCronJobFunction :exec
CREATE OR REPLACE FUNCTION execute_queued_cron_job()
RETURNS text AS
$$
DECLARE
    cmd              text;
    selected_runid   bigint;
    selected_jobid   bigint;
    start_ts         timestamp;
    job_name         text;
BEGIN
    -- 1) Grab the first queued command (row) and lock it, also fetching the jobid.
    SELECT command, runid, jobid
      INTO cmd, selected_runid, selected_jobid
      FROM hyrex_cron_job_run_details
     WHERE status = 'queued'
       AND schedule_time <= now()
     ORDER BY schedule_time
     LIMIT 1
     FOR UPDATE SKIP LOCKED;

    IF FOUND THEN
        -- 2) Mark start_time right before execution.
        start_ts := clock_timestamp();

        -- 3) Execute the command text.
        EXECUTE cmd;

        -- 4) Mark the end_time and set status.
        UPDATE hyrex_cron_job_run_details
           SET status      = 'success',
               start_time  = start_ts,
               end_time    = clock_timestamp()
         WHERE runid = selected_runid
           AND status = 'queued';

        -- 5) Retrieve the jobname using the selected jobid.
        SELECT jobname
          INTO job_name
          FROM hyrex_cron_job
         WHERE jobid = selected_jobid;

        RETURN 'executed ' || COALESCE(job_name, 'unknown job');
    END IF;

    RETURN 'not_found';

EXCEPTION
    WHEN OTHERS THEN
        -- In the event of an error, mark job as failed and record times.
        UPDATE hyrex_cron_job_run_details
           SET status      = 'failed',
               start_time  = COALESCE(start_ts, clock_timestamp()),
               end_time    = clock_timestamp()
         WHERE runid = selected_runid
           AND status = 'queued';
        RAISE;
END;
$$
LANGUAGE plpgsql`;

export async function createExecuteQueuedCronJobFunction(client: Client): Promise<void> {
    await client.query({
        text: createExecuteQueuedCronJobFunctionQuery,
        values: [],
        rowMode: "array"
    });
}

export const createUuid7FunctionQuery = `-- name: CreateUuid7Function :exec
CREATE OR REPLACE FUNCTION uuid7() RETURNS uuid
    LANGUAGE plpgsql
    VOLATILE  -- ← must be VOLATILE
AS $$
DECLARE
    ts         bigint;
    hex_ts     text;
    rand_hex   text;
    u          text;
    var_nibble text := to_hex(8 + floor(random()*4))::text; -- 8–B → RFC 4122 "10xx" variant
BEGIN
    -- 48-bit millisecond Unix epoch
    ts      := floor(extract(epoch FROM clock_timestamp()) * 1000);
    hex_ts  := lpad(to_hex(ts), 12, '0');

    -- 80 bits of random-ish hex (you'll use 74 of them, per RFC 9562 §6.9)
    rand_hex := substr(md5(random()::text), 1, 20);

    -- Assemble UUIDv7:  time_hi | time_mid | ver+randA | var+randB | randC
    u :=
            substr(hex_ts,1,8)               || '-' ||
            substr(hex_ts,9,4)               || '-' ||
            '7'       || substr(rand_hex,1,3)   || '-' ||
            var_nibble|| substr(rand_hex,4,3)   || '-' ||
            substr(rand_hex,7,12);

    RETURN u::uuid;
END;
$$`;

export async function createUuid7Function(client: Client): Promise<void> {
    await client.query({
        text: createUuid7FunctionQuery,
        values: [],
        rowMode: "array"
    });
}

export const createTriggerWorkflowRunFunctionQuery = `-- name: CreateTriggerWorkflowRunFunction :exec
CREATE OR REPLACE FUNCTION trigger_workflow_run(
    p_workflow_run_id UUID,
    p_workflow_name TEXT,
    p_args JSONB,
    p_queue TEXT,
    p_timeout_seconds INTEGER,
    p_idempotency_key TEXT
) RETURNS TABLE (
    workflow_run_id UUID,
    task_count INTEGER,
    success BOOLEAN,
    message TEXT
) AS $$
DECLARE
    v_workflow_record RECORD;
    v_node RECORD;
    v_task_id UUID;
    v_task_count INTEGER := 0;
    v_workflow_dependencies UUID[];
    v_dep_durable_id TEXT;
    v_node_id_map JSONB := '{}'::JSONB;
BEGIN
    -- Start transaction
    BEGIN
        -- Get workflow definition including DAG structure
        SELECT * INTO v_workflow_record
        FROM hyrex_workflow
        WHERE workflow_name = p_workflow_name
        LIMIT 1;

        IF v_workflow_record IS NULL THEN
            RETURN QUERY SELECT
                NULL::UUID,
                0,
                FALSE,
                'Workflow not found: ' || p_workflow_name;
            RETURN;
        END IF;

        -- Insert workflow run
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
        VALUES (
            p_workflow_run_id,
            NULL,
            p_workflow_name,
            p_args,
            p_queue,
            p_timeout_seconds,
            'running'::workflow_run_status,
            NOW(),
            NOW(),
            p_idempotency_key
        );

        -- Create task runs from DAG structure
        IF v_workflow_record.dag_structure IS NOT NULL AND
           v_workflow_record.dag_structure->'nodes' IS NOT NULL THEN

            -- First pass: Create mapping of node IDs to task UUIDs
            FOR v_node IN
                SELECT value FROM jsonb_array_elements(v_workflow_record.dag_structure->'nodes')
            LOOP
                -- Generate a new UUID for this task
                v_task_id := gen_random_uuid();

                -- Store the mapping from node ID to task UUID
                v_node_id_map := v_node_id_map || jsonb_build_object(v_node.value->>'id', v_task_id::TEXT);
            END LOOP;

            -- Second pass: Create task runs with proper dependencies
            FOR v_node IN
                SELECT value FROM jsonb_array_elements(v_workflow_record.dag_structure->'nodes')
            LOOP
                -- Get the task UUID we generated for this node
                v_task_id := (v_node_id_map->>(v_node.value->>'id'))::UUID;

                -- Build workflow_dependencies array based on edges
                v_workflow_dependencies := ARRAY[]::UUID[];

                -- Find all nodes that point to this node (dependencies)
                FOR v_dep_durable_id IN
                    SELECT DISTINCT value->>'from'
                    FROM jsonb_array_elements(v_workflow_record.dag_structure->'edges')
                    WHERE value->>'to' = v_node.value->>'id'
                LOOP
                    -- Map the dependency node ID to its task UUID
                    v_workflow_dependencies := array_append(v_workflow_dependencies, (v_node_id_map->>v_dep_durable_id)::UUID);
                END LOOP;

                -- Insert task run
                INSERT INTO hyrex_task_run (
                    id,
                    durable_id,
                    root_id,
                    parent_id,
                    workflow_run_id,
                    workflow_dependencies,
                    task_name,
                    args,
                    queue,
                    max_retries,
                    priority,
                    timeout_seconds,
                    idempotency_key,
                    status,
                    attempt_number,
                    scheduled_start,
                    queued,
                    last_heartbeat
                )
                VALUES (
                    v_task_id,
                    v_task_id,  -- SDK uses same UUID for id and durable_id
                    v_task_id,  -- SDK uses same UUID for root_id too
                    NULL,  -- No parent for workflow tasks
                    p_workflow_run_id,
                    v_workflow_dependencies,
                    v_node.value->>'name',
                    p_args,  -- Pass workflow args to each task
                    p_queue,
                    3,  -- Default max retries
                    0,  -- Default priority
                    p_timeout_seconds,
                    NULL,  -- No idempotency key for individual tasks
                    CASE
                        WHEN array_length(v_workflow_dependencies, 1) IS NULL OR array_length(v_workflow_dependencies, 1) = 0
                        THEN 'queued'::task_run_status
                        ELSE 'waiting'::task_run_status
                    END,
                    0,  -- Initial attempt number
                    NULL,  -- No scheduled_start for workflow tasks
                    NOW(),
                    NOW()
                );

                v_task_count := v_task_count + 1;
            END LOOP;
        END IF;

        -- Return success
        RETURN QUERY SELECT
            p_workflow_run_id,
            v_task_count,
            TRUE,
            'Workflow triggered successfully with ' || v_task_count || ' tasks';

    EXCEPTION WHEN OTHERS THEN
        -- Rollback will happen automatically
        RETURN QUERY SELECT
            NULL::UUID,
            0,
            FALSE,
            'Error triggering workflow: ' || SQLERRM;
    END;
END;
$$ LANGUAGE plpgsql`;

export async function createTriggerWorkflowRunFunction(client: Client): Promise<void> {
    await client.query({
        text: createTriggerWorkflowRunFunctionQuery,
        values: [],
        rowMode: "array"
    });
}

