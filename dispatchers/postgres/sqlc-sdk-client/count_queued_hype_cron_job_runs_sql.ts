import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const countQueuedHypeCronJobRunsQuery = `-- name: CountQueuedHypeCronJobRuns :one
  SELECT COUNT(*)::int AS count
  FROM hype_cron_job_run_details
  WHERE status = 'QUEUED'
    AND schedule_time <= NOW()`;

export interface CountQueuedHypeCronJobRunsRow {
    count: number;
}

export async function countQueuedHypeCronJobRuns(client: Client): Promise<CountQueuedHypeCronJobRunsRow | null> {
    const result = await client.query({
        text: countQueuedHypeCronJobRunsQuery,
        values: [],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        count: row[0]
    };
}

