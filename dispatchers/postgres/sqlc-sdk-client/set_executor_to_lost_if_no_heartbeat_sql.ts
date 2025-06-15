import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const setExecutorToLostIfNoHeartbeatQuery = `-- name: SetExecutorToLostIfNoHeartbeat :exec
WITH lost_executors AS (
    UPDATE hyrex_executor
        SET status = 'LOST'::executor_status
        WHERE status = 'RUNNING'::executor_status
            AND (
                  last_heartbeat IS NULL
                      OR last_heartbeat < (NOW() - INTERVAL '5 minutes')
                  )
        RETURNING id, last_heartbeat
)
INSERT INTO hyrex_system_logs (
    id,
    timestamp,
    event_name,
    event_body
)
SELECT
    gen_random_uuid(),
    NOW(),
    'EXECUTOR_LOST',
    json_build_object(
            'executor_id', id,
            'last_heartbeat', last_heartbeat,
            'reason', CASE
                          WHEN last_heartbeat IS NULL THEN 'No heartbeat recorded'
                          ELSE 'Heartbeat timeout exceeded 5 minutes'
                END
    )
FROM lost_executors`;

export async function setExecutorToLostIfNoHeartbeat(client: Client): Promise<void> {
    await client.query({
        text: setExecutorToLostIfNoHeartbeatQuery,
        values: [],
        rowMode: "array"
    });
}

