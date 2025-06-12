import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const enqueueTaskQuery = `-- name: EnqueueTask :one
WITH task_insertion AS (
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
                                scheduled_start
        )
        VALUES (
                   $1::UUID,
                   $2::UUID,
                   $3::UUID,
                   $4::UUID,
                   'queued'::task_run_status,
                   $5,
                   $6::JSON,
                   $7,
                   $8::SMALLINT,
                   $9::SMALLINT,
                   $10::INT,
                   0,
                   CURRENT_TIMESTAMP,
                   $11,
                   $12::TIMESTAMP WITH TIME ZONE
               )
        ON CONFLICT (task_name, idempotency_key)
            WHERE idempotency_key IS NOT NULL
            DO NOTHING
        RETURNING id
)
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM task_insertion) 
        THEN (SELECT id FROM task_insertion)
        ELSE NULL
    END as id`;

export interface EnqueueTaskArgs {
    id: string;
    durableId: string;
    rootId: string;
    parentId: string;
    taskName: string;
    args: any;
    queue: string;
    maxRetries: number;
    priority: number;
    timeoutSeconds: number;
    idempotencyKey: string | null;
    scheduledStart: Date;
}

export interface EnqueueTaskRow {
    id: string | null;
}

export async function enqueueTask(client: Client, args: EnqueueTaskArgs): Promise<EnqueueTaskRow | null> {
    const result = await client.query({
        text: enqueueTaskQuery,
        values: [args.id, args.durableId, args.rootId, args.parentId, args.taskName, args.args, args.queue, args.maxRetries, args.priority, args.timeoutSeconds, args.idempotencyKey, args.scheduledStart],
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

