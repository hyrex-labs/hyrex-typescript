import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const createCronJobRunDetailsTableQuery = `-- name: CreateCronJobRunDetailsTable :exec
CREATE TABLE IF NOT EXISTS hyrex_cron_job_run_details (
  jobid        bigint      NOT NULL,
  runid        bigserial   PRIMARY KEY,
  command      text        NOT NULL,
  status       cron_job_status_enum,
  schedule_time timestamptz not null,
  start_time   timestamptz,
  end_time     timestamptz,
  UNIQUE (jobid, schedule_time)
)`;

export async function createCronJobRunDetailsTable(client: Client): Promise<void> {
    await client.query({
        text: createCronJobRunDetailsTableQuery,
        values: [],
        rowMode: "array"
    });
}

