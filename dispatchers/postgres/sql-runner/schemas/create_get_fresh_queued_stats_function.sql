CREATE OR REPLACE FUNCTION get_fresh_queued_stats()
RETURNS TABLE (
    time_bucket timestamp,
    task_name varchar,
    status task_run_status,
    task_count bigint,
    percentage_by_task numeric,
    percentage_overall numeric
) AS $$
BEGIN
    -- Check if refresh is needed by looking at the most recent refresh event
    IF NOT EXISTS (
        SELECT 1
        FROM hyrex_system_logs
        WHERE event_name = 'hystats_queued_by_time_refresh'
          AND timestamp > NOW() - INTERVAL '5 seconds'
    ) THEN
        -- Refresh the view
        REFRESH MATERIALIZED VIEW CONCURRENTLY hystats_queued_by_time;
        
        -- Log the refresh event
        INSERT INTO hyrex_system_logs (
            id,
            timestamp,
            event_name,
            event_body
        ) VALUES (
            gen_random_uuid(),
            NOW(),
            'hystats_queued_by_time_refresh',
            '{}'::jsonb
        );
    END IF;

    -- Return the data
    RETURN QUERY SELECT * FROM hystats_queued_by_time;
END;
$$ LANGUAGE plpgsql;