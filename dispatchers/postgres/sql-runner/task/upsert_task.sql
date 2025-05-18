INSERT INTO hyrex_task (task_name, cron_expr, source_code, last_updated)
VALUES (:taskName, :cronExpr, :sourceCode, NOW())
ON CONFLICT (task_name)
DO UPDATE SET 
    cron_expr = EXCLUDED.cron_expr,
    source_code = EXCLUDED.source_code,
    last_updated = NOW();
