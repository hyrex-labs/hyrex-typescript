import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const createCronJobStatusEnumQuery = `-- name: CreateCronJobStatusEnum :exec
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'cron_job_status_enum' AND typnamespace = 'public'::regnamespace) THEN
        CREATE TYPE public.cron_job_status_enum AS ENUM (
            'success',
            'queued',
            'failed'
        );
    END IF;
END $$`;

export async function createCronJobStatusEnum(client: Client): Promise<void> {
    await client.query({
        text: createCronJobStatusEnumQuery,
        values: [],
        rowMode: "array"
    });
}

