import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const getProjectStatsQuery = `-- name: GetProjectStats :many
SELECT 
    timepoint,
    queued,
    running,
    waiting,
    failed,
    success,
    lost,
    queued + running + waiting + failed + lost as total,
    queued_delta,
    success_delta,
    failed_delta,
    lost_delta
FROM hyrex_stats_task_status_counts
WHERE timepoint >= NOW() - INTERVAL '24 hours'
ORDER BY timepoint DESC`;

export interface GetProjectStatsRow {
    timepoint: Date;
    queued: number | null;
    running: number | null;
    waiting: number | null;
    failed: number | null;
    success: number | null;
    lost: number | null;
    total: string;
    queuedDelta: number | null;
    successDelta: number | null;
    failedDelta: number | null;
    lostDelta: number | null;
}

export async function getProjectStats(client: Client): Promise<GetProjectStatsRow[]> {
    const result = await client.query({
        text: getProjectStatsQuery,
        values: [],
        rowMode: "array"
    });
    return result.rows.map(row => {
        return {
            timepoint: row[0],
            queued: row[1],
            running: row[2],
            waiting: row[3],
            failed: row[4],
            success: row[5],
            lost: row[6],
            total: row[7],
            queuedDelta: row[8],
            successDelta: row[9],
            failedDelta: row[10],
            lostDelta: row[11]
        };
    });
}

