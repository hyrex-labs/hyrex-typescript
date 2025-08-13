import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const getHypeCronJobsQuery = `-- name: GetHypeCronJobs :many
SELECT jobid, schedule, command_type::text, command_params, active, jobname, activated_at,
       scheduled_jobs_confirmed_until, should_backfill
FROM hype_cron_job
ORDER BY jobid`;

export interface GetHypeCronJobsRow {
    jobid: string;
    schedule: string | null;
    commandType: string;
    commandParams: any;
    active: boolean;
    jobname: string;
    activatedAt: Date | null;
    scheduledJobsConfirmedUntil: Date | null;
    shouldBackfill: boolean | null;
}

export async function getHypeCronJobs(client: Client): Promise<GetHypeCronJobsRow[]> {
    const result = await client.query({
        text: getHypeCronJobsQuery,
        values: [],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            jobid: row[0],
            schedule: row[1],
            commandType: row[2],
            commandParams: row[3],
            active: row[4],
            jobname: row[5],
            activatedAt: row[6],
            scheduledJobsConfirmedUntil: row[7],
            shouldBackfill: row[8]
        };
    });
}

