import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const createStatsTaskStatusCountsTableIndexesQuery = `-- name: CreateStatsTaskStatusCountsTableIndexes :exec
CREATE INDEX IF NOT EXISTS idx_hstsc_timepoint
    ON hyrex_stats_task_status_counts(timepoint)`;

export async function createStatsTaskStatusCountsTableIndexes(client: Client): Promise<void> {
    await client.query({
        text: createStatsTaskStatusCountsTableIndexesQuery,
        values: [],
        rowMode: "array"
    });
}

