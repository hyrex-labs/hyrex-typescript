CREATE TABLE IF NOT EXISTS hyrex_scheduler_lock
(
    lockid       bigserial PRIMARY KEY,
    worker_name  text        NOT NULL,
    acquired_at  timestamptz NOT NULL DEFAULT now(),
    heartbeat_at timestamptz NOT NULL DEFAULT now(),
    release_at   timestamptz NOT NULL,
    is_active    boolean     NOT NULL DEFAULT true
);
