import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const createStatsTaskStatusCountsTableQuery = `-- name: CreateStatsTaskStatusCountsTable :exec
CREATE TABLE IF NOT EXISTS hyrex_stats_task_status_counts
(
    timepoint     TIMESTAMP WITH TIME ZONE PRIMARY KEY,
    queued        INTEGER,
    running       INTEGER,
    waiting       INTEGER,
    failed        INTEGER,
    success       INTEGER,
    lost          INTEGER,
    total         INTEGER,
    queued_delta  INTEGER,
    success_delta INTEGER,
    failed_delta  INTEGER,
    lost_delta    INTEGER
)`;

export async function createStatsTaskStatusCountsTable(client: Client): Promise<void> {
    await client.query({
        text: createStatsTaskStatusCountsTableQuery,
        values: [],
        rowMode: "array"
    });
}

