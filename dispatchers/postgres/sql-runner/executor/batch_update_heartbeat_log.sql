INSERT INTO hyrex_system_logs (id, timestamp, event_name, event_body)
VALUES (
    :logId,
    NOW(),
    'BATCH_HEARTBEAT_UPDATE',
    json_build_object('updated_executor_ids', :executorIds::uuid[])
);
