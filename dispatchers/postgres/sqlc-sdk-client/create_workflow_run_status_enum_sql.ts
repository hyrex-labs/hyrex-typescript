import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const createWorkflowRunStatusEnumQuery = `-- name: CreateWorkflowRunStatusEnum :exec
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 
                   FROM pg_type 
                   WHERE typname = 'workflow_run_status' 
                     AND typnamespace = 'public'::regnamespace) THEN
        CREATE TYPE public.workflow_run_status AS ENUM (
            'SUCCESS',
            'FAILED',
            'RUNNING',
            'UP_FOR_CANCEL',
            'CANCELED',
            'ASLEEP'
        );
    END IF;
END $$`;

export async function createWorkflowRunStatusEnum(client: Client): Promise<void> {
    await client.query({
        text: createWorkflowRunStatusEnumQuery,
        values: [],
        rowMode: "array"
    });
}

