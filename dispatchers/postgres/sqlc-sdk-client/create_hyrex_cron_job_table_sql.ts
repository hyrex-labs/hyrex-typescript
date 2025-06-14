import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const createCronJobTableQuery = `-- name: CreateCronJobTable :exec
CREATE TABLE IF NOT EXISTS hyrex_cron_job
(
    jobid                          bigserial PRIMARY KEY,
    schedule                       text,
    command                        text    NOT NULL,
    active                         boolean NOT NULL DEFAULT true,
    jobname                        text    NOT NULL,
    job_source                     job_source_type NOT NULL,
    activated_at                   timestamptz      default now(),
    scheduled_jobs_confirmed_until timestamptz      default now(),
    should_backfill                boolean default true,
    UNIQUE (jobname)
)`;

export async function createCronJobTable(client: Client): Promise<void> {
    await client.query({
        text: createCronJobTableQuery,
        values: [],
        rowMode: "array"
    });
}

