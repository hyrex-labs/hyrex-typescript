import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const registerHypeCronJobQuery = `-- name: RegisterHypeCronJob :exec
INSERT INTO hype_cron_job (jobname, schedule, command_type, command_params, active, should_backfill)
VALUES ($1, $2, $3, $4, $5, $6)
ON CONFLICT (jobname)
DO UPDATE SET 
    schedule = EXCLUDED.schedule,
    command_type = EXCLUDED.command_type,
    command_params = EXCLUDED.command_params,
    active = EXCLUDED.active,
    should_backfill = EXCLUDED.should_backfill`;

export interface RegisterHypeCronJobArgs {
    jobname: string;
    schedule: string | null;
    commandType: string;
    commandParams: any;
    active: boolean;
    shouldBackfill: boolean | null;
}

export async function registerHypeCronJob(client: Client, args: RegisterHypeCronJobArgs): Promise<void> {
    await client.query({
        text: registerHypeCronJobQuery,
        values: [args.jobname, args.schedule, args.commandType, args.commandParams, args.active, args.shouldBackfill],
        rowMode: "array"
    });
}

