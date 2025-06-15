import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const createWorkflowRunTableQuery = `-- name: CreateWorkflowRunTable :exec
CREATE TABLE IF NOT EXISTS hyrex_workflow_run (
    id              UUID                        NOT NULL PRIMARY KEY,
    parent_id       UUID,
    workflow_name   VARCHAR                     NOT NULL,
    args            JSON                        NOT NULL,
    queue           VARCHAR                     NOT NULL,
    timeout_seconds INT                         DEFAULT NULL CHECK (timeout_seconds IS NULL OR timeout_seconds > 0),
    status          workflow_run_status             NOT NULL,
    scheduled_start TIMESTAMP WITH TIME ZONE,
    queued          TIMESTAMP WITH TIME ZONE,
    started         TIMESTAMP WITH TIME ZONE,
    finished        TIMESTAMP WITH TIME ZONE,
    last_heartbeat  TIMESTAMP WITH TIME ZONE,
    idempotency_key VARCHAR
)`;

export async function createWorkflowRunTable(client: Client): Promise<void> {
    await client.query({
        text: createWorkflowRunTableQuery,
        values: [],
        rowMode: "array"
    });
}

