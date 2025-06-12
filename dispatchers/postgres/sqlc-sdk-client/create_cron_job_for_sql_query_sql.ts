import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const createCronJobForSqlQueryQuery = `-- name: CreateCronJobForSqlQuery :exec
INSERT INTO hyrex_cron_job (schedule, command, jobname, should_backfill, job_source)
VALUES ($1, $2, $3, $4, 'SYSTEM')
ON CONFLICT (jobname) 
DO UPDATE SET 
    schedule = EXCLUDED.schedule,
    command = EXCLUDED.command,
    should_backfill = EXCLUDED.should_backfill,
    job_source = 'SYSTEM',
    active = true`;

export interface CreateCronJobForSqlQueryArgs {
    schedule: string | null;
    command: string;
    jobname: string;
    shouldBackfill: boolean | null;
}

export async function createCronJobForSqlQuery(client: Client, args: CreateCronJobForSqlQueryArgs): Promise<void> {
    await client.query({
        text: createCronJobForSqlQueryQuery,
        values: [args.schedule, args.command, args.jobname, args.shouldBackfill],
        rowMode: "array"
    });
}

