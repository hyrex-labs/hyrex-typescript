import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const createHypeCronJobStatusEnumQuery = `-- name: CreateHypeCronJobStatusEnum :exec
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'hype_cron_job_status_enum' AND typnamespace = 'public'::regnamespace) THEN
        CREATE TYPE public.hype_cron_job_status_enum AS ENUM (
            'SUCCESS',
            'QUEUED',
            'PROCESSING',
            'FAILED'
        );
    END IF;
END $$`;

export async function createHypeCronJobStatusEnum(client: Client): Promise<void> {
    await client.query({
        text: createHypeCronJobStatusEnumQuery,
        values: [],
        rowMode: "array"
    });
}

