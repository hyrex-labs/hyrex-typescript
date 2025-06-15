# SQLC Migration Map for PostgresDispatcher

This document maps legacy SQL operations in PostgresDispatcher to their SQLC-generated equivalents.

## Core Task Operations

### 1. Enqueue Tasks
- **Legacy**: `sql.ENQUEUE_TASKS`
- **SQLC**: `createTaskRun()` from `create_task_run_sql.ts`
- **Key Differences**:
  - SQLC uses a PL/pgSQL function that returns the task ID
  - Legacy directly inserts with conflict handling
  - SQLC has better type safety with `CreateTaskRunArgs` interface

### 2. Dequeue Tasks (Fetch Task)
- **Legacy**: `sql.FETCH_TASK` and `sql.FETCH_TASK_WITH_CONCURRENCY_LIMIT`
- **SQLC**: 
  - `fetchTask()` from `fetch_task_sql.ts`
  - `fetchTaskWithConcurrencyLimit()` from `fetch_task_with_concurrency_limit_sql.ts`
- **Key Differences**:
  - SQLC functions return typed `FetchTaskRow` interface
  - Same underlying logic but with better type safety

### 3. Mark Task Status
- **Legacy**: 
  - `sql.MARK_TASK_FAILED`
  - `sql.MARK_TASK_SUCCESS`
  - `sql.MARK_TASK_CANCELED`
  - `sql.MARK_TASK_LOST`
- **SQLC**: `transitionTaskState()` from `transition_task_state_sql.ts`
- **Key Differences**:
  - SQLC uses a single function with state parameter
  - Returns the full task row after transition
  - More flexible for adding new states

### 4. Save/Fetch Results
- **Legacy**: 
  - `sql.SAVE_RESULT`
  - `sql.FETCH_RESULT`
- **SQLC**: 
  - `saveResult()` from `save_result_sql.ts`
  - `fetchResult()` from `fetch_result_sql.ts`

## Executor Management

### 5. Register Executor
- **Legacy**: `sql.REGISTER_EXECUTOR`
- **SQLC**: `registerExecutor()` from `register_executor_sql.ts`
- **Already migrated** in PostgresDispatcher (line 39)

### 6. Update Executor
- **Legacy**: 
  - `sql.UPDATE_QUEUES_ON_EXECUTOR`
  - `sql.DISCONNECT_EXECUTOR`
  - `sql.UPDATE_EXECUTOR_STATS`
  - `sql.BATCH_UPDATE_HEARTBEAT_ON_EXECUTORS`
- **SQLC**: 
  - `updateQueuesOnExecutor()` from `update_queues_on_executor_sql.ts`
  - `disconnectExecutor()` from `disconnect_executor_sql.ts`
  - `updateExecutorStats()` from `update_executor_stats_sql.ts`
  - `batchUpdateHeartbeatOnExecutors()` from `batch_update_heartbeat_on_executors_sql.ts`

## Queue Operations

### 7. Fetch Active Queue Names
- **Legacy**: `sql.FETCH_ACTIVE_QUEUE_NAMES`
- **SQLC**: `fetchActiveQueueNames()` from `fetch_active_queue_names_sql.ts`
- **Already migrated** in PostgresDispatcher (line 36-39)

## Cron Operations

### 8. Cron Job Management
- **Legacy**: 
  - `cronSQL.createInsertTaskCronExpression`
  - `cronSQL.TURN_OFF_CRON_FOR_TASK`
  - `cronSQL.PULL_ACTIVE_CRON_EXPRESSIONS`
  - `cronSQL.UPDATE_CRON_JOB_CONFIRMATION_TS`
- **SQLC**: 
  - `createCronJobForTask()` from `create_cron_job_for_task_sql.ts`
  - `turnOffCronForTask()` from `turn_off_cron_for_task_sql.ts`
  - `pullActiveCronExpressions()` from `pull_active_cron_expressions_sql.ts`
  - `updateCronJobConfirmationTs()` from `update_cron_job_confirmation_ts_sql.ts`

## Workflow Operations

### 9. Workflow Management
- **Legacy**: 
  - `workflowSQL.UPSERT_WORKFLOW`
  - `workflowSQL.TRIGGER_WORKFLOW`
  - Various other workflow SQL
- **SQLC**: 
  - `upsertWorkflow()` from `upsert_workflow_sql.ts`
  - `triggerWorkflow()` from `trigger_workflow_sql.ts`
  - `advanceWorkflowRun()` from `advance_workflow_run_sql.ts`
  - `setWorkflowRunStatusBasedOnTaskRuns()` from `set_workflow_run_status_based_on_task_runs_sql.ts`

## App Registration

### 10. Register App Info
- **Legacy**: `sql.REGISTER_APP_INFO_SQL`
- **SQLC**: `registerAppInfo()` from `register_app_info_sql.ts`

## Task Definition

### 11. Register Task Definition
- **Legacy**: `REGISTER_TASK_DEF` (not shown in current code)
- **SQLC**: `registerTaskDef()` from `register_task_def_sql.ts`

## Durability Operations

### 12. Handle Lost Tasks/Executors
- **Legacy**: 
  - `durabilitySQL.SET_ORPHANED_TASK_EXECUTION_TO_LOST_AND_RETRY`
  - `durabilitySQL.SET_EXECUTOR_TO_LOST_IF_NO_HEARTBEAT`
- **SQLC**: 
  - `setOrphanedTaskExecutionToLostAndRetry()` from `set_orphaned_task_execution_to_lost_and_retry_sql.ts`
  - `setExecutorToLostIfNoHeartbeat()` from `set_executor_to_lost_if_no_heartbeat_sql.ts`

## Stats Operations

### 13. Historical Stats
- **Legacy**: `statsSQL.FILL_HISTORICAL_TASK_STATUS_COUNTS_TABLE`
- **SQLC**: `fillHistoricalTaskStatusCountsTable()` from `fill_historical_task_status_counts_table_sql.ts`

## Additional SQLC Functions

### 14. Retry Logic
- `conditionallyRetryTask()` from `conditionally_retry_task_sql.ts`

### 15. Log Management
- `setLogLink()` from `set_log_link_sql.ts`
- `batchUpdateHeartbeatLog()` from `batch_update_heartbeat_log_sql.ts`

## Migration Strategy

1. **Phase 1**: Replace simple operations (already started)
   - ✅ `fetchActiveQueueNames`
   - ✅ `registerExecutor`

2. **Phase 2**: Replace task lifecycle operations
   - [ ] `enqueue` → `createTaskRun`
   - [ ] `dequeue` → `fetchTask` / `fetchTaskWithConcurrencyLimit`
   - [ ] `markTask*` → `transitionTaskState`
   - [ ] `saveResult` / `fetchResult`

3. **Phase 3**: Replace executor operations
   - [ ] Executor updates and heartbeats

4. **Phase 4**: Replace cron and workflow operations
   - [ ] Cron job management
   - [ ] Workflow operations

5. **Phase 5**: Replace remaining operations
   - [ ] App registration
   - [ ] Task definition
   - [ ] Durability operations
   - [ ] Stats operations

## Notes

- SQLC functions provide better type safety with generated TypeScript interfaces
- Most SQLC functions use the same underlying SQL logic but wrapped in typed functions
- The `transitionTaskState` function is more flexible than individual mark functions
- All SQLC functions follow a consistent pattern with `Args` and `Row` interfaces