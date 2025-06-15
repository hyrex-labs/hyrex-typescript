import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const releaseSchedulerLockQuery = `-- name: ReleaseSchedulerLock :one
UPDATE hyrex_scheduler_lock
SET is_active    = false,
    release_at   = now(),
    heartbeat_at = now()
WHERE lockid = 1
  AND worker_name = $1
RETURNING lockid`;

export interface ReleaseSchedulerLockArgs {
    workerName: string;
}

export interface ReleaseSchedulerLockRow {
    lockid: string;
}

export async function releaseSchedulerLock(client: Client, args: ReleaseSchedulerLockArgs): Promise<ReleaseSchedulerLockRow | null> {
    const result = await client.query({
        text: releaseSchedulerLockQuery,
        values: [args.workerName],
        rowMode: "array"
    });
    if (result.rows.length !== 1) {
        return null;
    }
    const row = result.rows[0];
    return {
        lockid: row[0]
    };
}

