import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const createHypeCronJobTableQuery = `-- name: CreateHypeCronJobTable :exec
CREATE TABLE IF NOT EXISTS hype_cron_job
(
    jobid                          bigserial PRIMARY KEY,
    schedule                       text,
    command_type                   hype_command_type NOT NULL,
    command_params                 JSONB   NOT NULL,
    active                         boolean NOT NULL DEFAULT true,
    jobname                        text    NOT NULL,
    activated_at                   timestamptz      default now(),
    scheduled_jobs_confirmed_until timestamptz      default now(),
    should_backfill                boolean default true,
    UNIQUE (jobname)
)`;

export async function createHypeCronJobTable(client: Client): Promise<void> {
    await client.query({
        text: createHypeCronJobTableQuery,
        values: [],
        rowMode: "array"
    });
}

