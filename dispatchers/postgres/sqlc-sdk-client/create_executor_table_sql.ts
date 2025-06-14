import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const createExecutorTableQuery = `-- name: CreateExecutorTable :exec
CREATE TABLE IF NOT EXISTS hyrex_executor
(
    id             UUID    NOT NULL PRIMARY KEY,
    name           VARCHAR NOT NULL,
    worker_name    VARCHAR NOT NULL,
    queue_pattern  VARCHAR NOT NULL,
    queues         VARCHAR[] NOT NULL,
    started        TIMESTAMP WITH TIME ZONE,
    stopped        TIMESTAMP WITH TIME ZONE,
    last_heartbeat TIMESTAMP WITH TIME ZONE,
    stats          JSON,
    status         executor_status NOT NULL DEFAULT 'UNKNOWN'
)`;

export async function createExecutorTable(client: Client): Promise<void> {
    await client.query({
        text: createExecutorTableQuery,
        values: [],
        rowMode: "array"
    });
}

