CREATE TABLE IF NOT EXISTS hyrex_task_result
(
    task_id    UUID PRIMARY KEY REFERENCES public.hyrex_task_run (id) ON DELETE CASCADE,
    result     JSON,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
