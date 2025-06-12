import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const updateCronJobConfirmationTsQuery = `-- name: UpdateCronJobConfirmationTs :exec
UPDATE hyrex_cron_job
SET scheduled_jobs_confirmed_until = now()
WHERE jobid = $1`;

export interface UpdateCronJobConfirmationTsArgs {
    jobid: string;
}

export async function updateCronJobConfirmationTs(client: Client, args: UpdateCronJobConfirmationTsArgs): Promise<void> {
    await client.query({
        text: updateCronJobConfirmationTsQuery,
        values: [args.jobid],
        rowMode: "array"
    });
}

