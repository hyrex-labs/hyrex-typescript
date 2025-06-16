import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const scheduleCronJobRunsJsonQuery = `-- name: ScheduleCronJobRunsJson :one
WITH input_data AS (
    SELECT 
        json_array_elements($1::json) AS run_data
),
converted_runs AS (
    SELECT ARRAY_AGG(
        ROW(
            (run_data->>'jobid')::BIGINT,
            run_data->>'command',
            (run_data->>'schedule_time')::TIMESTAMPTZ
        )::cron_job_run_input
    ) AS runs_array
    FROM input_data
)
SELECT 
    json_build_object(
        'success', success,
        'message', message,
        'inserted_count', inserted_count,
        'runids', runids
    ) AS result
FROM converted_runs, 
LATERAL schedule_cron_job_runs(runs_array)`;

export interface ScheduleCronJobRunsJsonArgs {
    runsJson: any;
}

export interface ScheduleCronJobRunsJsonRow {
    result: any;
}

export async function scheduleCronJobRunsJson(client: Client, args: ScheduleCronJobRunsJsonArgs): Promise<ScheduleCronJobRunsJsonRow | null> {
    const result = await client.query({
        text: scheduleCronJobRunsJsonQuery,
        values: [args.runsJson],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        result: row[0]
    };
}

