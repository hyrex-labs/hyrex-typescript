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
            'SUCCESS',
            'FAILED',
            'RUNNING',
            'QUEUED',
            'UP_FOR_CANCEL',
            'CANCELED',
            'LOST',
            'STOPPED',
            'SKIPPED',
            'AWAIT_DEPS',
            'AWAIT_START_TIME'
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

