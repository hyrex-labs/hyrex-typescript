import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const pullActiveCronExpressionsQuery = `-- name: PullActiveCronExpressions :many
SELECT jobid,
       schedule,
       command,
       active,
       jobname,
       activated_at,
       scheduled_jobs_confirmed_until,
       should_backfill
FROM hyrex_cron_job
WHERE active = true`;

export interface PullActiveCronExpressionsRow {
    jobid: string;
    schedule: string | null;
    command: string;
    active: boolean;
    jobname: string;
    activatedAt: Date | null;
    scheduledJobsConfirmedUntil: Date | null;
    shouldBackfill: boolean | null;
}

export async function pullActiveCronExpressions(client: Client): Promise<PullActiveCronExpressionsRow[]> {
    const result = await client.query({
        text: pullActiveCronExpressionsQuery,
        values: [],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            jobid: row[0],
            schedule: row[1],
            command: row[2],
            active: row[3],
            jobname: row[4],
            activatedAt: row[5],
            scheduledJobsConfirmedUntil: row[6],
            shouldBackfill: row[7]
        };
    });
}

