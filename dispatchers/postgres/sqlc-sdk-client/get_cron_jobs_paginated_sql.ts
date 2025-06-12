import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const getCronJobsPaginatedQuery = `-- name: GetCronJobsPaginated :many
SELECT 
    jobid,
    schedule,
    command,
    active,
    jobname,
    job_source,
    activated_at,
    scheduled_jobs_confirmed_until
FROM hyrex_cron_job
ORDER BY jobid DESC
LIMIT $1 OFFSET $2`;

export interface GetCronJobsPaginatedArgs {
    limit: string;
    offset: string;
}

export interface GetCronJobsPaginatedRow {
    jobid: string;
    schedule: string | null;
    command: string;
    active: boolean;
    jobname: string;
    jobSource: string;
    activatedAt: Date | null;
    scheduledJobsConfirmedUntil: Date | null;
}

export async function getCronJobsPaginated(client: Client, args: GetCronJobsPaginatedArgs): Promise<GetCronJobsPaginatedRow[]> {
    const result = await client.query({
        text: getCronJobsPaginatedQuery,
        values: [args.limit, args.offset],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            jobid: row[0],
            schedule: row[1],
            command: row[2],
            active: row[3],
            jobname: row[4],
            jobSource: row[5],
            activatedAt: row[6],
            scheduledJobsConfirmedUntil: row[7]
        };
    });
}

