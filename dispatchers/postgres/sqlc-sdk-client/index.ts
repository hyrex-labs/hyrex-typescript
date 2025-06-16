// Auto-generated file by generate-exports.ts
// This file exports all SQLC generated query functions plus convenience helpers
// Generated on: 2025-06-16T17:04:14.499Z

// Tables
export * from './01_create_executor_table_sql';
export * from './02_create_hyrex_app_table_sql';
export * from './03_create_hyrex_cron_job_table_sql';
export * from './04_create_hyrex_scheduler_lock_table_sql';
export * from './05_create_hyrex_stats_task_status_counts_table_sql';
export * from './06_create_hyrex_stats_task_status_counts_table_indexes_sql';
export * from './07_create_hyrex_task_def_table_sql';
export * from './08_create_workflow_table_sql';
export * from './09_create_system_log_table_sql';
export * from './10_create_workflow_run_table_sql';
export * from './11_create_hyrex_cron_job_run_details_table_sql';
export * from './12_create_hyrex_task_run_table_sql';
export * from './13_create_hyrex_task_run_table_indexes_sql';
export * from './14_create_results_table_sql';

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
export * from './fetch_active_queue_names_sql';
export * from './fetch_result_sql';
export * from './fetch_task_sql';
export * from './fetch_task_with_concurrency_limit_sql';
export * from './save_result_sql';
export * from './set_log_link_sql';
export * from './transition_task_state_sql';

// Functions
export * from './create_conditionally_retry_task_func_sql';
export * from './create_execute_queued_cron_job_func_sql';
export * from './create_schedule_cron_job_runs_func_sql';
export * from './create_task_run_sql';
export * from './create_transition_task_run_state_func_sql';
export * from './create_uuid7_func_sql';
export * from './create_workflow_trigger_func_sql';

// Cron Job
export * from './create_cron_job_for_sql_query_sql';
export * from './create_cron_job_for_task_sql';
export * from './pull_active_cron_expressions_sql';
export * from './schedule_cron_job_runs_json_sql';
export * from './trigger_execute_queued_cron_job_sql';
export * from './turn_off_cron_for_task_sql';
export * from './update_cron_job_confirmation_ts_sql';

// Enums
export * from './create_cron_job_status_enum_sql';
export * from './create_executor_status_enum_sql';
export * from './create_job_source_type_enum_sql';
export * from './create_task_run_status_enum_sql';
export * from './create_workflow_run_status_enum_sql';

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

// Task Def
export * from './register_task_def_sql';

// Durability
export * from './set_executor_to_lost_if_no_heartbeat_sql';
export * from './set_orphaned_task_execution_to_lost_and_retry_sql';

// Workflow
export * from './upsert_workflow_sql';

import { QueryArrayConfig, QueryArrayResult } from 'pg';

export interface DatabaseClient { query: (config: QueryArrayConfig) => Promise<QueryArrayResult>; }

import { createCronJobStatusEnum } from './create_cron_job_status_enum_sql';
import { createExecutorStatusEnum } from './create_executor_status_enum_sql';
import { createJobSourceTypeEnum } from './create_job_source_type_enum_sql';
import { createTaskRunStatusEnum } from './create_task_run_status_enum_sql';
import { createWorkflowRunStatusEnum } from './create_workflow_run_status_enum_sql';
import { createExecutorTable } from './01_create_executor_table_sql';
import { createAppTable } from './02_create_hyrex_app_table_sql';
import { createCronJobTable } from './03_create_hyrex_cron_job_table_sql';
import { createSchedulerLockTable } from './04_create_hyrex_scheduler_lock_table_sql';
import { createStatsTaskStatusCountsTable } from './05_create_hyrex_stats_task_status_counts_table_sql';
import { createStatsTaskStatusCountsTableIndexes } from './06_create_hyrex_stats_task_status_counts_table_indexes_sql';
import { createTaskDefTable } from './07_create_hyrex_task_def_table_sql';
import { createWorkflowTable } from './08_create_workflow_table_sql';
import { createSystemLogTable } from './09_create_system_log_table_sql';
import { createWorkflowRunTable } from './10_create_workflow_run_table_sql';
import { createCronJobRunDetailsTable } from './11_create_hyrex_cron_job_run_details_table_sql';
import { createTaskRunTable } from './12_create_hyrex_task_run_table_sql';
import { createTaskRunTableIndexes } from './13_create_hyrex_task_run_table_indexes_sql';
import { createResultsTable } from './14_create_results_table_sql';
import { createConditionallyRetryTaskFunc } from './create_conditionally_retry_task_func_sql';
import { createExecuteQueuedCronJobFunction } from './create_execute_queued_cron_job_func_sql';
import { createScheduleCronJobRunsFunc } from './create_schedule_cron_job_runs_func_sql';
import { createTaskRun, createTaskRunFunction } from './create_task_run_sql';
import { createTransitionTaskRunStateFunc } from './create_transition_task_run_state_func_sql';
import { createUuid7Function } from './create_uuid7_func_sql';
import { createWorkflowTrigger } from './create_workflow_trigger_func_sql';

export async function createEnums(client: DatabaseClient): Promise<void> {
  await createCronJobStatusEnum(client);
  await createExecutorStatusEnum(client);
  await createJobSourceTypeEnum(client);
  await createTaskRunStatusEnum(client);
  await createWorkflowRunStatusEnum(client);
}

export async function createTables(client: DatabaseClient): Promise<void> {
  await createExecutorTable(client);
  await createAppTable(client);
  await createCronJobTable(client);
  await createSchedulerLockTable(client);
  await createStatsTaskStatusCountsTable(client);
  await createStatsTaskStatusCountsTableIndexes(client);
  await createTaskDefTable(client);
  await createWorkflowTable(client);
  await createSystemLogTable(client);
  await createWorkflowRunTable(client);
  await createCronJobRunDetailsTable(client);
  await createTaskRunTable(client);
  await createTaskRunTableIndexes(client);
  await createResultsTable(client);
}

export async function createFunctions(client: DatabaseClient): Promise<void> {
  await createConditionallyRetryTaskFunc(client);
  await createExecuteQueuedCronJobFunction(client);
  await createScheduleCronJobRunsFunc(client);
  await createTaskRunFunction(client);
  await createTransitionTaskRunStateFunc(client);
  await createUuid7Function(client);
  await createWorkflowTrigger(client);
}

