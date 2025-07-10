import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const updateHypeCronJobRunStatusQuery = `-- name: UpdateHypeCronJobRunStatus :exec
UPDATE hype_cron_job_run_details
SET status = $1::hype_cron_job_status_enum,
    start_time = CASE WHEN start_time IS NULL THEN NOW() ELSE start_time END,
    end_time = CASE WHEN $1 IN ('SUCCESS', 'FAILED') THEN NOW() ELSE end_time END
WHERE runid = $2`;

export interface UpdateHypeCronJobRunStatusArgs {
    status: string;
    runid: string;
}

export async function updateHypeCronJobRunStatus(client: Client, args: UpdateHypeCronJobRunStatusArgs): Promise<void> {
    await client.query({
        text: updateHypeCronJobRunStatusQuery,
        values: [args.status, args.runid],
        rowMode: "array"
    });
}

