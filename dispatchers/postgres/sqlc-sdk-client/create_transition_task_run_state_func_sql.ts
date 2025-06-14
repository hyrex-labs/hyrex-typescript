import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const createTransitionTaskRunStateFuncQuery = `-- name: CreateTransitionTaskRunStateFunc :exec
CREATE OR REPLACE FUNCTION is_allowed(
    p_from task_run_status,
    p_to   task_run_status
) RETURNS boolean
    IMMUTABLE
    LANGUAGE sql AS $$
SELECT (p_from, p_to) IN (
    -- ──────────────────────
    -- AwaitDeps transitions
    -- ──────────────────────
    ROW('AWAIT_DEPS',       'AWAIT_START_TIME'),
    ROW('AWAIT_DEPS',       'CANCELED'),
    ROW('AWAIT_DEPS',       'QUEUED'),
    ROW('AWAIT_DEPS',       'SKIPPED'),

    -- ─────────────────────────────────
    -- AwaitStartTime transitions
    -- ─────────────────────────────────
    ROW('AWAIT_START_TIME', 'QUEUED'),
    ROW('AWAIT_START_TIME', 'CANCELED'),

    -- ────────────────
    -- Queued → …
    -- ────────────────
    ROW('QUEUED',           'RUNNING'),
    ROW('QUEUED',           'CANCELED'),

    -- ──────────────────────────────
    -- Running → terminal / cancel
    -- ──────────────────────────────
    ROW('RUNNING',          'STOPPED'),
    ROW('RUNNING',          'SUCCESS'),
    ROW('RUNNING',          'FAILED'),
    ROW('RUNNING',          'LOST'),
    ROW('RUNNING',          'UP_FOR_CANCEL'),

    -- ─────────────────────────
    -- UpForCancel → terminal
    -- ─────────────────────────
    ROW('UP_FOR_CANCEL',    'FAILED'),
    ROW('UP_FOR_CANCEL',    'CANCELED')
);
$$`;

export async function createTransitionTaskRunStateFunc(client: Client): Promise<void> {
    await client.query({
        text: createTransitionTaskRunStateFuncQuery,
        values: [],
        rowMode: "array"
    });
}

