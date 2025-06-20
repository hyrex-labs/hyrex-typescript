import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const trimTaskStatsQuery = `-- name: TrimTaskStats :exec
DELETE FROM hyrex_stats_task_status_counts WHERE timepoint < $1`;

export interface TrimTaskStatsArgs {
    timepoint: Date;
}

export async function trimTaskStats(client: Client, args: TrimTaskStatsArgs): Promise<void> {
    await client.query({
        text: trimTaskStatsQuery,
        values: [args.timepoint],
        rowMode: "array"
    });
}

