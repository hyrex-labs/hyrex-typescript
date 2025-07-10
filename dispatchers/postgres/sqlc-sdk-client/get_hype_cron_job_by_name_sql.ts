import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const getHypeCronJobByNameQuery = `-- name: GetHypeCronJobByName :one
SELECT jobid, schedule, command_type, command_params, active, jobname, activated_at, scheduled_jobs_confirmed_until, should_backfill FROM hype_cron_job
WHERE jobname = $1`;

export interface GetHypeCronJobByNameArgs {
    jobname: string;
}

export interface GetHypeCronJobByNameRow {
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

export async function getHypeCronJobByName(client: Client, args: GetHypeCronJobByNameArgs): Promise<GetHypeCronJobByNameRow | null> {
    const result = await client.query({
        text: getHypeCronJobByNameQuery,
        values: [args.jobname],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
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
}

