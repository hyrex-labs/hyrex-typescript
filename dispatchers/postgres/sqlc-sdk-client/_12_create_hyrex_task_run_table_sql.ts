import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const createTaskRunTableQuery = `-- name: CreateTaskRunTable :exec
CREATE TABLE IF NOT EXISTS hyrex_task_run (
                                              id              UUID                        NOT NULL PRIMARY KEY,
                                              durable_id      UUID                        NOT NULL,
                                              root_id         UUID                        NOT NULL,
                                              parent_id       UUID,
                                              workflow_run_id UUID DEFAULT NULL,
                                              workflow_dependencies UUID[] DEFAULT NULL,
                                              task_name       VARCHAR                     NOT NULL,
                                              args            JSON                        NOT NULL,
                                              queue           VARCHAR                     NOT NULL,
                                              max_retries     SMALLINT                    NOT NULL,
                                              priority        SMALLINT                    NOT NULL,
                                              timeout_seconds INT                         DEFAULT NULL CHECK (timeout_seconds IS NULL OR timeout_seconds > 0),
                                              status          task_run_status             NOT NULL,
                                              attempt_number  SMALLINT                    NOT NULL,
                                              scheduled_start TIMESTAMP WITH TIME ZONE,
                                              executor_id     UUID,
                                              queued          TIMESTAMP WITH TIME ZONE,
                                              started         TIMESTAMP WITH TIME ZONE,
                                              finished        TIMESTAMP WITH TIME ZONE,
                                              last_heartbeat  TIMESTAMP WITH TIME ZONE,
                                              idempotency_key VARCHAR,
                                              log_link        VARCHAR
)`;

export async function createTaskRunTable(client: Client): Promise<void> {
    await client.query({
        text: createTaskRunTableQuery,
        values: [],
        rowMode: "array"
    });
}

