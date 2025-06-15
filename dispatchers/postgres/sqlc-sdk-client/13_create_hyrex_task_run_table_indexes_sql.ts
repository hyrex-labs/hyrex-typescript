import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const createTaskRunTableIndexesQuery = `-- name: CreateTaskRunTableIndexes :exec
DO $$
BEGIN
    -- Create indexes for hyrex_task_run table
    CREATE INDEX IF NOT EXISTS ix_hyrex_task_run_task_name
        ON public.hyrex_task_run (task_name);

    CREATE INDEX IF NOT EXISTS ix_hyrex_task_run_status
        ON public.hyrex_task_run (status);

    CREATE INDEX IF NOT EXISTS ix_hyrex_task_run_queue
        ON public.hyrex_task_run (queue);

    CREATE INDEX IF NOT EXISTS ix_hyrex_task_run_scheduled_start
        ON public.hyrex_task_run (scheduled_start);

    CREATE INDEX IF NOT EXISTS index_queue_status
        ON public.hyrex_task_run (status, queue, scheduled_start, task_name);

    CREATE UNIQUE INDEX IF NOT EXISTS ix_hyrex_task_run_idempotency_key
        ON public.hyrex_task_run (task_name, idempotency_key)
        WHERE idempotency_key IS NOT NULL;

    CREATE INDEX IF NOT EXISTS idx_hyrex_task_run_queue_status_priority_queued
        ON hyrex_task_run (queue, status, priority ASC, queued);

    CREATE INDEX IF NOT EXISTS idx_htr_queued_started_finished
        ON hyrex_task_run(queued, started, finished);

    CREATE INDEX IF NOT EXISTS idx_hyrex_task_run_root_id
        ON hyrex_task_run(root_id);
END $$`;

export async function createTaskRunTableIndexes(client: Client): Promise<void> {
    await client.query({
        text: createTaskRunTableIndexesQuery,
        values: [],
        rowMode: "array"
    });
}

