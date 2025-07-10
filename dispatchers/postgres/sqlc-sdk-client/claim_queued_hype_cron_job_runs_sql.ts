import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const claimQueuedHypeCronJobRunsQuery = `-- name: ClaimQueuedHypeCronJobRuns :many
  UPDATE hype_cron_job_run_details
  SET status = 'PROCESSING',
      start_time = NOW()
  WHERE runid IN (
      SELECT runid
      FROM hype_cron_job_run_details
      WHERE status = 'QUEUED'
        AND schedule_time <= NOW()
      ORDER BY schedule_time ASC
      LIMIT $1
      FOR UPDATE SKIP LOCKED
  )
  RETURNING jobid, runid, command_type::text, command_params, status::text, schedule_time, start_time, end_time`;

export interface ClaimQueuedHypeCronJobRunsArgs {
    limit: string;
}

export interface ClaimQueuedHypeCronJobRunsRow {
    jobid: string;
    runid: string;
    commandType: string;
    commandParams: any;
    status: string;
    scheduleTime: Date;
    startTime: Date | null;
    endTime: Date | null;
}

export async function claimQueuedHypeCronJobRuns(client: Client, args: ClaimQueuedHypeCronJobRunsArgs): Promise<ClaimQueuedHypeCronJobRunsRow[]> {
    const result = await client.query({
        text: claimQueuedHypeCronJobRunsQuery,
        values: [args.limit],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            jobid: row[0],
            runid: row[1],
            commandType: row[2],
            commandParams: row[3],
            status: row[4],
            scheduleTime: row[5],
            startTime: row[6],
            endTime: row[7]
        };
    });
}

