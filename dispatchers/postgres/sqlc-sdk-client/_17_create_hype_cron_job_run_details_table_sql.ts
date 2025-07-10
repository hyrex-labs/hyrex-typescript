import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const createHypeCronJobRunDetailsTableQuery = `-- name: CreateHypeCronJobRunDetailsTable :exec
CREATE TABLE IF NOT EXISTS hype_cron_job_run_details (
  jobid          bigint      NOT NULL,
  runid          bigserial   PRIMARY KEY,
  command_type   hype_command_type NOT NULL,
  command_params JSONB       NOT NULL,
  status         hype_cron_job_status_enum,
  schedule_time  timestamptz not null,
  start_time     timestamptz,
  end_time       timestamptz,
  UNIQUE (jobid, schedule_time)
)`;

export async function createHypeCronJobRunDetailsTable(client: Client): Promise<void> {
    await client.query({
        text: createHypeCronJobRunDetailsTableQuery,
        values: [],
        rowMode: "array"
    });
}

