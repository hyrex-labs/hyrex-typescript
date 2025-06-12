import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const getCronJobRunDetailsQuery = `-- name: GetCronJobRunDetails :one
SELECT 
    jobid,
    runid,
    command,
    status,
    schedule_time,
    start_time,
    end_time
FROM hyrex_cron_job_run_details
WHERE jobid = $1
ORDER BY schedule_time DESC
LIMIT 100`;

export interface GetCronJobRunDetailsArgs {
    jobid: string;
}

export interface GetCronJobRunDetailsRow {
    jobid: string;
    runid: string;
    command: string;
    status: string | null;
    scheduleTime: Date;
    startTime: Date | null;
    endTime: Date | null;
}

export async function getCronJobRunDetails(client: Client, args: GetCronJobRunDetailsArgs): Promise<GetCronJobRunDetailsRow | null> {
    const result = await client.query({
        text: getCronJobRunDetailsQuery,
        values: [args.jobid],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        jobid: row[0],
        runid: row[1],
        command: row[2],
        status: row[3],
        scheduleTime: row[4],
        startTime: row[5],
        endTime: row[6]
    };
}

