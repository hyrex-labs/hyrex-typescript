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
);

CREATE INDEX IF NOT EXISTS idx_hstsc_timepoint
    ON hyrex_stats_task_status_counts(timepoint);
