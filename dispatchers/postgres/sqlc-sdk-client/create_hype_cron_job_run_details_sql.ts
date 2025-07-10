import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const createHypeCronJobRunDetailsQuery = `-- name: CreateHypeCronJobRunDetails :exec
INSERT INTO hype_cron_job_run_details (jobid, command_type, command_params, status, schedule_time)
VALUES ($1, $2, $3, $4, $5)`;

export interface CreateHypeCronJobRunDetailsArgs {
    jobid: string;
    commandType: string;
    commandParams: any;
    status: string | null;
    scheduleTime: Date;
}

export async function createHypeCronJobRunDetails(client: Client, args: CreateHypeCronJobRunDetailsArgs): Promise<void> {
    await client.query({
        text: createHypeCronJobRunDetailsQuery,
        values: [args.jobid, args.commandType, args.commandParams, args.status, args.scheduleTime],
        rowMode: "array"
    });
}

