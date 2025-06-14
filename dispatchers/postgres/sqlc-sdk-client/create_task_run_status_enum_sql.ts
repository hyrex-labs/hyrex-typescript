import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const createTaskRunStatusEnumQuery = `-- name: CreateTaskRunStatusEnum :exec
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1
                   FROM pg_type
                   WHERE typname = 'task_run_status'
                     AND typnamespace = 'public'::regnamespace) THEN
        CREATE TYPE public.task_run_status AS ENUM (
            'success',
            'failed',
            'running',
            'queued',
            'up_for_cancel',
            'canceled',
            'waiting',
            'lost',
            'skipped'
            );
    END IF;
END $$`;

export async function createTaskRunStatusEnum(client: Client): Promise<void> {
    await client.query({
        text: createTaskRunStatusEnumQuery,
        values: [],
        rowMode: "array"
    });
}

