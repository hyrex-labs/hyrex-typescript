// Auto-generated file by generate-exports.ts
// This file exports all SQLC generated query functions plus convenience helpers
// Generated on: 2025-06-12T20:45:47.573Z

// Scheduler
export * from './acquire_scheduler_lock_sql';
export * from './release_scheduler_lock_sql';

// Workflow Run
export * from './advance_workflow_run_sql';
export * from './set_workflow_run_status_based_on_task_runs_sql';
export * from './skip_waiting_task_for_workflow_run_id_sql';
export * from './trigger_workflow_sql';

// Executor
export * from './batch_update_heartbeat_log_sql';
export * from './batch_update_heartbeat_on_executors_sql';
export * from './disconnect_executor_sql';
export * from './register_executor_sql';
export * from './update_executor_stats_sql';
export * from './update_queues_on_executor_sql';

// Task Run
export * from './conditionally_retry_task_sql';
export * from './enqueue_task_sql';
export * from './fetch_active_queue_names_sql';
export * from './fetch_result_sql';
export * from './fetch_task_sql';
export * from './fetch_task_with_concurrency_limit_sql';
export * from './mark_task_canceled_sql';
export * from './mark_task_failed_sql';
export * from './mark_task_lost_sql';
export * from './mark_task_success_sql';
export * from './save_result_sql';
export * from './set_log_link_sql';

// Cron Job
export * from './create_cron_job_for_sql_query_sql';
export * from './create_cron_job_for_task_sql';
export * from './pull_active_cron_expressions_sql';
export * from './turn_off_cron_for_task_sql';
export * from './update_cron_job_confirmation_ts_sql';

// Stats
export * from './fill_historical_task_status_counts_table_sql';

// Dashboard
export * from './get_app_name_sql';
export * from './get_cron_job_run_details_sql';
export * from './get_cron_jobs_paginated_sql';
export * from './get_executor_by_id_sql';
export * from './get_executors_paginated_sql';
export * from './get_project_stats_sql';
export * from './get_task_attempts_by_durable_id_sql';
export * from './get_task_by_name_sql';
export * from './get_task_run_by_id_sql';
export * from './get_task_runs_by_status_paginated_sql';
export * from './get_task_runs_paginated_sql';
export * from './get_tasks_paginated_sql';
export * from './get_workflow_by_name_sql';
export * from './get_workflow_run_by_id_sql';
export * from './get_workflow_run_task_runs_sql';
export * from './get_workflow_runs_paginated_sql';
export * from './get_workflows_paginated_sql';

// App
export * from './register_app_info_sql';

// Durability
export * from './set_executor_to_lost_if_no_heartbeat_sql';
export * from './set_orphaned_task_execution_to_lost_and_retry_sql';

// Task
export * from './upsert_task_sql';

// Workflow
export * from './upsert_workflow_sql';

// Other
export * from './create_functions_sql';
export * from './create_tables_sql';
export * from './create_workflow_trigger_sql';
export * from './insert_workflow_run_sql';
import { createJobSourceTypeEnum, createCronJobTable, createAppTable, createWorkflowRunStatusEnum, createWorkflowRunTable, createSystemLogTable, createTaskRunStatusEnum, createTaskRunTable, createTaskRunIndexes, createResultsTable, createStatsTaskStatusCountsTable, createStatsTaskStatusCountsIndex, createExecutorStatusEnum, createExecutorTable, createSchedulerLockTable, createTaskDefTable, createWorkflowTable, createCronJobStatusEnum, createCronJobRunDetailsTable } from './create_tables_sql';
import { createExecuteQueuedCronJobFunction, createUuid7Function, createTriggerWorkflowRunFunction } from './create_functions_sql';
import { QueryArrayConfig, QueryArrayResult } from 'pg';

export interface DatabaseClient { query: (config: QueryArrayConfig) => Promise<QueryArrayResult>; }

export async function createTables(client: DatabaseClient): Promise<void> {
  await createJobSourceTypeEnum(client);
  await createCronJobTable(client);
  await createAppTable(client);
  await createWorkflowRunStatusEnum(client);
  await createWorkflowRunTable(client);
  await createSystemLogTable(client);
  await createTaskRunStatusEnum(client);
  await createTaskRunTable(client);
  await createTaskRunIndexes(client);
  await createResultsTable(client);
  await createStatsTaskStatusCountsTable(client);
  await createStatsTaskStatusCountsIndex(client);
  await createExecutorStatusEnum(client);
  await createExecutorTable(client);
  await createSchedulerLockTable(client);
  await createTaskDefTable(client);
  await createWorkflowTable(client);
  await createCronJobStatusEnum(client);
  await createCronJobRunDetailsTable(client);
}

export async function createFunctions(client: DatabaseClient): Promise<void> {
  await createExecuteQueuedCronJobFunction(client);
  await createUuid7Function(client);
  await createTriggerWorkflowRunFunction(client);
}

