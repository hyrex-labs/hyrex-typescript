import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const batchUpdateHeartbeatLogQuery = `-- name: BatchUpdateHeartbeatLog :exec
INSERT INTO hyrex_system_logs (id, timestamp, event_name, event_body)
VALUES (
    $1::uuid,
    NOW(),
    'BATCH_HEARTBEAT_UPDATE',
    json_build_object('updated_executor_ids', $2::uuid[])
)`;

export interface BatchUpdateHeartbeatLogArgs {
    logId: string;
    executorIds: string[];
}

export async function batchUpdateHeartbeatLog(client: Client, args: BatchUpdateHeartbeatLogArgs): Promise<void> {
    await client.query({
        text: batchUpdateHeartbeatLogQuery,
        values: [args.logId, args.executorIds],
        rowMode: "array"
    });
}

