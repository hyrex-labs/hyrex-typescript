import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const turnOffCronForTaskQuery = `-- name: TurnOffCronForTask :exec
UPDATE hyrex_cron_job
SET active   = false,
    schedule = NULL
WHERE jobname = $1
  AND job_source = 'TASK'`;

export interface TurnOffCronForTaskArgs {
    jobname: string;
}

export async function turnOffCronForTask(client: Client, args: TurnOffCronForTaskArgs): Promise<void> {
    await client.query({
        text: turnOffCronForTaskQuery,
        values: [args.jobname],
        rowMode: "array"
    });
}

