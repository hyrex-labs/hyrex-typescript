INSERT INTO hyrex_workflow (workflow_name, cron_expr, source_code, dag_structure, last_updated)
VALUES (:workflowName, :cronExpr, :sourceCode, :dagStructure, NOW())
ON CONFLICT (workflow_name)
DO UPDATE SET 
    cron_expr = EXCLUDED.cron_expr,
    source_code = EXCLUDED.source_code,
    dag_structure = EXCLUDED.dag_structure,
    last_updated = NOW();
