import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const createScheduleCronJobRunsFuncQuery = `-- name: CreateScheduleCronJobRunsFunc :exec
DO $$
BEGIN
    -- First create the composite type for input if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'cron_job_run_input') THEN
        CREATE TYPE cron_job_run_input AS (
            jobid BIGINT,
            command TEXT,
            schedule_time TIMESTAMPTZ
        );
    END IF;

    -- Create the function to schedule cron job runs
    CREATE OR REPLACE FUNCTION schedule_cron_job_runs(
        p_runs cron_job_run_input[]
    ) RETURNS TABLE (
        success BOOLEAN,
        message TEXT,
        inserted_count INT,
        runids BIGINT[]
    ) AS $func$
    DECLARE
        v_jobid BIGINT;
        v_run cron_job_run_input;
        v_inserted_runids BIGINT[] := '{}';
        v_inserted_count INT := 0;
        v_runid BIGINT;
    BEGIN
        -- Validate input
        IF p_runs IS NULL OR array_length(p_runs, 1) IS NULL THEN
            RETURN QUERY SELECT FALSE, 'No cron job runs provided', 0, NULL::BIGINT[];
            RETURN;
        END IF;
        
        -- Extract the first jobid for validation
        v_jobid := (p_runs[1]).jobid;
        
        -- Validate all runs have the same jobid
        FOREACH v_run IN ARRAY p_runs
        LOOP
            IF v_run.jobid != v_jobid THEN
                RETURN QUERY SELECT FALSE, 'All cron job runs must have the same job id', 0, NULL::BIGINT[];
                RETURN;
            END IF;
        END LOOP;
        
        -- Insert all runs
        FOREACH v_run IN ARRAY p_runs
        LOOP
            INSERT INTO hyrex_cron_job_run_details (
                jobid,
                command,
                status,
                schedule_time
            )
            VALUES (
                v_run.jobid,
                v_run.command,
                'QUEUED'::cron_job_status_enum,
                v_run.schedule_time
            )
            ON CONFLICT (jobid, schedule_time) DO NOTHING
            RETURNING runid INTO v_runid;
            
            -- If a row was inserted (no conflict), add to our array
            IF v_runid IS NOT NULL THEN
                v_inserted_runids := array_append(v_inserted_runids, v_runid);
                v_inserted_count := v_inserted_count + 1;
                v_runid := NULL; -- Reset for next iteration
            END IF;
        END LOOP;
        
        -- Update the cron job confirmation timestamp
        UPDATE hyrex_cron_job
        SET scheduled_jobs_confirmed_until = now()
        WHERE jobid = v_jobid;
        
        -- Log the scheduling event
        INSERT INTO hyrex_system_logs (id, timestamp, event_name, event_body)
        VALUES (
            gen_random_uuid(),
            CURRENT_TIMESTAMP,
            'cron_jobs_scheduled',
            json_build_object(
                'jobid', v_jobid,
                'scheduled_count', array_length(p_runs, 1),
                'inserted_count', v_inserted_count,
                'runids', v_inserted_runids
            )
        );
        
        RETURN QUERY SELECT 
            TRUE, 
            format('Scheduled %s cron job runs, %s inserted', array_length(p_runs, 1), v_inserted_count),
            v_inserted_count,
            v_inserted_runids;
            
    EXCEPTION
        WHEN OTHERS THEN
            -- Log the error
            INSERT INTO hyrex_system_logs (id, timestamp, event_name, event_body)
            VALUES (
                gen_random_uuid(),
                CURRENT_TIMESTAMP,
                'cron_jobs_schedule_error',
                json_build_object(
                    'jobid', v_jobid,
                    'error', SQLERRM,
                    'sqlstate', SQLSTATE
                )
            );
            
            RETURN QUERY SELECT FALSE, format('Error scheduling cron jobs: %s', SQLERRM), 0, NULL::BIGINT[];
    END;
    $func$ LANGUAGE plpgsql;
END
$$`;

export async function createScheduleCronJobRunsFunc(client: Client): Promise<void> {
    await client.query({
        text: createScheduleCronJobRunsFuncQuery,
        values: [],
        rowMode: "array"
    });
}

