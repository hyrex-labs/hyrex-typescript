import { QueryArrayConfig, QueryArrayResult } from "pg";

import { IPostgresInterval } from "postgres-interval";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const acquireSchedulerLockQuery = `-- name: AcquireSchedulerLock :one
INSERT INTO hyrex_scheduler_lock (
    lockid, worker_name, acquired_at, heartbeat_at, release_at, is_active
)
VALUES (
    1,
    $1,
    now(),
    now(),
    now() + CAST($2 AS interval),
    true
)
ON CONFLICT (lockid)
  DO UPDATE 
     SET worker_name  = EXCLUDED.worker_name,
         acquired_at  = EXCLUDED.acquired_at,
         heartbeat_at = EXCLUDED.heartbeat_at,
         release_at   = EXCLUDED.release_at,
         is_active    = EXCLUDED.is_active
   WHERE (
       -- Only update if the lock is not truly active,
       -- i.e. is already inactive or expired:
       hyrex_scheduler_lock.is_active = false
       OR hyrex_scheduler_lock.release_at <= now()
   )
RETURNING lockid`;

export interface AcquireSchedulerLockArgs {
    workerName: string;
    duration: IPostgresInterval;
}

export interface AcquireSchedulerLockRow {
    lockid: string;
}

export async function acquireSchedulerLock(client: Client, args: AcquireSchedulerLockArgs): Promise<AcquireSchedulerLockRow | null> {
    const result = await client.query({
        text: acquireSchedulerLockQuery,
        values: [args.workerName, args.duration],
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

