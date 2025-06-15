import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const updateExecutorStatsQuery = `-- name: UpdateExecutorStats :one
WITH updated AS (
    UPDATE hyrex_executor
        SET last_heartbeat = CURRENT_TIMESTAMP,
            stats = $1
        WHERE hyrex_executor.id = $2
            AND hyrex_executor.status = 'RUNNING'::executor_status
        RETURNING id, status, last_heartbeat, stats),
     executor_state AS (SELECT CASE WHEN u.id IS NOT NULL THEN 'ACCEPTED' ELSE 'REJECTED' END AS result,
                               COALESCE(u.status, e.status)                                   AS status,
                               COALESCE(u.last_heartbeat, e.last_heartbeat)                   AS last_heartbeat,
                               COALESCE(u.stats, e.stats)                                     AS stats
                        FROM hyrex_executor e
                                 LEFT JOIN updated u ON e.id = u.id
                        WHERE e.id = $2),
     insert_log AS (
         INSERT INTO hyrex_system_logs (id, timestamp, event_name, event_body)
             SELECT gen_random_uuid(),
                    CURRENT_TIMESTAMP,
                    'HEARTBEAT_REJECTED',
                    json_build_object('executor_id', $2, 'current_status', es.status, 'stats', $1)
             FROM executor_state es
             WHERE es.result = 'REJECTED'
             RETURNING NULL)
SELECT es.result, es.status, es.last_heartbeat, es.stats
FROM executor_state es`;

export interface UpdateExecutorStatsArgs {
    stats: any | null;
    id: string;
}

export interface UpdateExecutorStatsRow {
    result: string;
    status: string;
    lastHeartbeat: Date | null;
    stats: any | null;
}

export async function updateExecutorStats(client: Client, args: UpdateExecutorStatsArgs): Promise<UpdateExecutorStatsRow | null> {
    const result = await client.query({
        text: updateExecutorStatsQuery,
        values: [args.stats, args.id],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        result: row[0],
        status: row[1],
        lastHeartbeat: row[2],
        stats: row[3]
    };
}

