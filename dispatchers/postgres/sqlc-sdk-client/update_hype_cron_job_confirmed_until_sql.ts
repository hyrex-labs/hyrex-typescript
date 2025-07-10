import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const updateHypeCronJobConfirmedUntilQuery = `-- name: UpdateHypeCronJobConfirmedUntil :exec
UPDATE hype_cron_job
SET scheduled_jobs_confirmed_until = $2
WHERE jobid = $1`;

export interface UpdateHypeCronJobConfirmedUntilArgs {
    jobid: string;
    scheduledJobsConfirmedUntil: Date | null;
}

export async function updateHypeCronJobConfirmedUntil(client: Client, args: UpdateHypeCronJobConfirmedUntilArgs): Promise<void> {
    await client.query({
        text: updateHypeCronJobConfirmedUntilQuery,
        values: [args.jobid, args.scheduledJobsConfirmedUntil],
        rowMode: "array"
    });
}

