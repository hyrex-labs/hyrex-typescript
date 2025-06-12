import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const releaseSchedulerLockQuery = `-- name: ReleaseSchedulerLock :exec
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

export async function releaseSchedulerLock(client: Client, args: ReleaseSchedulerLockArgs): Promise<void> {
    await client.query({
        text: releaseSchedulerLockQuery,
        values: [args.workerName],
        rowMode: "array"
    });
}

