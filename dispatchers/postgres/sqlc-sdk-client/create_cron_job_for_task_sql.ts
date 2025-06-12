import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const createCronJobForTaskQuery = `-- name: CreateCronJobForTask :exec
INSERT INTO hyrex_cron_job (schedule, command, jobname, job_source)
VALUES ($1, $2, $3, 'TASK')
ON CONFLICT (jobname) 
DO UPDATE SET 
    schedule = EXCLUDED.schedule,
    command = EXCLUDED.command,
    job_source = 'TASK',
    active = true`;

export interface CreateCronJobForTaskArgs {
    schedule: string | null;
    command: string;
    jobname: string;
}

export async function createCronJobForTask(client: Client, args: CreateCronJobForTaskArgs): Promise<void> {
    await client.query({
        text: createCronJobForTaskQuery,
        values: [args.schedule, args.command, args.jobname],
        rowMode: "array"
    });
}

