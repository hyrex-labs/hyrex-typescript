import { Pool, PoolClient } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

type QueryCommand = {
  name: string;
  query: string;
  params?: string[];
};

type SqlRunnerConfig = {
  name: string;
  commands: QueryCommand[];
};

/**
 * HyrexSqlRunner - A class to run SQL queries defined in sql-runner.json
 * 
 * This class loads SQL queries from files specified in sql-runner.json,
 * and provides methods to execute them with appropriate parameters.
 */
export class HyrexSqlRunner {
  private pool: Pool;
  private config: SqlRunnerConfig;
  private sqlQueries: Map<string, string> = new Map();
  private basePath: string;

  /**
   * Create a new HyrexSqlRunner
   * 
   * @param connectionString - PostgreSQL connection string
   * @param configPath - Path to sql-runner.json (default: relative to current file)
   */
  constructor(connectionString: string, configPath?: string) {
    this.pool = new Pool({ connectionString });
    
    // Default config path is relative to this file
    this.basePath = path.dirname(configPath || __filename);
    
    // Load sql-runner.json
    const configFile = configPath || path.join(this.basePath, 'sql-runner.json');
    this.config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
    
    // Load all SQL files defined in the config
    this.loadSqlFiles();
  }

  /**
   * Load all SQL files specified in the config
   */
  private loadSqlFiles(): void {
    for (const command of this.config.commands) {
      const queryPath = path.join(this.basePath, command.query);
      try {
        const sqlContent = fs.readFileSync(queryPath, 'utf8');
        this.sqlQueries.set(command.name, sqlContent);
      } catch (error) {
        console.error(`Failed to load SQL file for command ${command.name} at ${queryPath}:`, error);
      }
    }
  }

  /**
   * Execute a query with retry logic
   */
  private async queryWithRetry<T>(
    queryFn: (client: PoolClient) => Promise<T>,
    options: {
      maxRetries: number;
      retryOnlyOnTooManyClients: boolean;
    } = {
      maxRetries: 5,
      retryOnlyOnTooManyClients: true,
    }
  ): Promise<T> {
    const { maxRetries } = options;
    let lastError: unknown;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      let client = null;
      try {
        if (attempt > 0) {
          const backoffMs = Math.min(1000 * Math.pow(2, attempt), 10000);
          await new Promise(resolve => setTimeout(resolve, backoffMs));
        }

        client = await this.pool.connect();
        return await queryFn(client);
      } catch (error: unknown) {
        lastError = error;
        if (error && typeof error === 'object' && 'message' in error) {
          if (typeof error.message === 'string' && error.message.includes('too many clients')) {
            console.warn(`Connection pool exhausted, attempt ${attempt + 1}/${maxRetries}`);
            continue;
          }
          if (options.retryOnlyOnTooManyClients) {
            throw error;
          }
        }
        continue;
      } finally {
        if (client) {
          client.release();
        }
      }
    }

    const errorMessage = lastError && typeof lastError === 'object' && 'message' in lastError
      ? lastError.message
      : 'Unknown error';
    throw new Error(`Failed after ${maxRetries} attempts: ${errorMessage}`);
  }

  /**
   * Get a command by name
   */
  private getCommand(commandName: string): QueryCommand {
    const command = this.config.commands.find(cmd => cmd.name === commandName);
    if (!command) {
      throw new Error(`Command not found: ${commandName}`);
    }
    return command;
  }

  /**
   * Get the SQL query for a command
   */
  private getSql(commandName: string): string {
    const sql = this.sqlQueries.get(commandName);
    if (!sql) {
      throw new Error(`SQL not loaded for command: ${commandName}`);
    }
    return sql;
  }

  /**
   * Prepare parameters for a SQL query, replacing named parameters with values
   */
  private prepareParams(command: QueryCommand, params: Record<string, any>): any[] {
    if (!command.params) {
      return [];
    }

    return command.params.map(paramName => {
      if (!(paramName in params)) {
        throw new Error(`Required parameter "${paramName}" missing for command "${command.name}"`);
      }
      return params[paramName];
    });
  }

  /**
   * Run a command by name with parameters
   */
  async run<T = any>(commandName: string, params: Record<string, any> = {}): Promise<T[]> {
    const command = this.getCommand(commandName);
    const sql = this.getSql(commandName);
    const sqlParams = this.prepareParams(command, params);

    return this.queryWithRetry(async (client) => {
      const result = await client.query<T>(sql, sqlParams);
      return result.rows;
    });
  }

  /**
   * Run a command as part of a transaction
   */
  async runInTransaction<T = any>(
    client: PoolClient,
    commandName: string,
    params: Record<string, any> = {}
  ): Promise<T[]> {
    const command = this.getCommand(commandName);
    const sql = this.getSql(commandName);
    const sqlParams = this.prepareParams(command, params);

    const result = await client.query<T>(sql, sqlParams);
    return result.rows;
  }

  /**
   * Run multiple commands in a transaction
   */
  async runBatch(commands: Array<{ name: string; params?: Record<string, any> }>): Promise<any[]> {
    return this.queryWithRetry(async (client) => {
      await client.query('BEGIN');
      try {
        const results = [];
        for (const { name, params = {} } of commands) {
          const result = await this.runInTransaction(client, name, params);
          results.push(result);
        }
        await client.query('COMMIT');
        return results;
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    });
  }

  /**
   * Initialize the database by running all 'Create*' commands
   */
  async initDb(): Promise<void> {
    const schemaCommands = this.config.commands
      .filter(cmd => cmd.name.startsWith('Create'))
      .map(cmd => ({ name: cmd.name }));

    await this.runBatch(schemaCommands);
    console.log('Database schema initialized successfully');
  }

  /**
   * Close the connection pool
   */
  async close(): Promise<void> {
    await this.pool.end();
  }
}

// Now generate individual methods for all commands
export type SqlRunnerCommands = {
  // Schema Creation Commands
  createHyrexTaskExecutionTable(): Promise<any[]>;
  createHyrexTaskTable(): Promise<any[]>;
  createHyrexCronJobTable(): Promise<any[]>;
  createHyrexCronJobRunDetailsTable(): Promise<any[]>;
  createHyrexSchedulerLockTable(): Promise<any[]>;
  createExecuteQueuedCommandFunction(): Promise<any[]>;
  createHyrexListenerTable(): Promise<any[]>;
  createSystemLogTable(): Promise<any[]>;
  createHyrexAppTable(): Promise<any[]>;
  createExecutorTable(): Promise<any[]>;
  createResultsTable(): Promise<any[]>;
  createHistoricalTaskStatusCounts(): Promise<any[]>;
  createWorkflowTable(): Promise<any[]>;
  createWorkflowRunTable(): Promise<any[]>;
  createMaterializedViewQueuedStats(): Promise<any[]>;
  createGetFreshQueuedStatsFunction(): Promise<any[]>;

  // App Queries
  registerAppInfo(appId: number, appInfo: any): Promise<any[]>;

  // Task Run Queries
  enqueueTask(params: {
    taskId: string;
    durableId: string;
    rootId: string;
    workflowRunId: string | null;
    workflowDependencies: string[] | null;
    parentId: string | null;
    status: string;
    taskName: string;
    taskArgs: any;
    queue: string;
    maxRetries: number;
    priority: number;
    timeoutSeconds: number | null;
    idempotencyKey: string | null;
  }): Promise<any[]>;
  fetchTask(taskQueue: string, executorId: string, taskNames: string[]): Promise<any[]>;
  fetchTaskWithConcurrencyLimit(
    taskQueue: string,
    concurrencyLimit: number,
    taskNames: string[], 
    executorId: string
  ): Promise<any[]>;
  markTaskFailed(taskId: string): Promise<any[]>;
  markTaskSuccess(taskId: string): Promise<any[]>;
  markTaskCanceled(taskId: string): Promise<any[]>;
  markTaskLost(taskId: string): Promise<any[]>;
  saveResult(taskId: string, result: any): Promise<any[]>;
  fetchResult(taskId: string): Promise<any[]>;
  fetchActiveQueueNames(queuePattern: string): Promise<any[]>;
  conditionallyRetryTask(originalTaskId: string, newTaskId: string): Promise<any[]>;
  setLogLink(taskId: string, logLink: string): Promise<any[]>;

  // Task Definition Queries
  upsertTask(taskName: string, cronExpr: string | null, sourceCode: string | null): Promise<any[]>;

  // Executor Queries
  registerExecutor(
    executorId: string,
    executorName: string,
    queuePattern: string,
    queues: string[],
    workerName: string
  ): Promise<any[]>;
  updateQueuesOnExecutor(executorId: string, queues: string[]): Promise<any[]>;
  disconnectExecutor(executorId: string, stats: any): Promise<any[]>;
  updateExecutorStats(executorId: string, stats: any): Promise<any[]>;
  batchUpdateHeartbeatOnExecutors(executorIds: string[]): Promise<any[]>;
  batchUpdateHeartbeatLog(logId: string, executorIds: string[]): Promise<any[]>;

  // Scheduler Queries
  acquireSchedulerLock(workerName: string, releaseDuration: string): Promise<any[]>;
  releaseSchedulerLock(workerName: string): Promise<any[]>;

  // Cron Job Queries
  pullActiveCronExpressions(): Promise<any[]>;
  updateCronJobConfirmationTs(jobId: number): Promise<any[]>;
  createCronJobForTask(schedule: string, command: string, jobName: string): Promise<any[]>;
  turnOffCronForTask(jobName: string): Promise<any[]>;
  createCronJobForSqlQuery(
    schedule: string,
    command: string,
    jobName: string,
    shouldBackfill: boolean
  ): Promise<any[]>;

  // Listener Queries
  registerHyrexListener(listenerName: string, sourceCode: string): Promise<any[]>;

  // Workflow Queries
  upsertWorkflow(
    workflowName: string,
    cronExpr: string | null,
    sourceCode: string,
    dagStructure: any
  ): Promise<any[]>;

  // Workflow Run Queries
  insertWorkflowRun(
    workflowRunId: string,
    workflowName: string,
    args: any,
    queue: string,
    timeoutSeconds: number | null,
    idempotencyKey: string | null
  ): Promise<any[]>;
  setWorkflowRunStatusBasedOnTaskRuns(workflowRunId: string): Promise<any[]>;
  advanceWorkflowRun(workflowRunId: string): Promise<any[]>;
  skipWaitingTaskForWorkflowRunId(workflowRunId: string): Promise<any[]>;

  // Durability Queries
  setOrphanedTaskExecutionToLostAndRetry(): Promise<any[]>;
  setExecutorToLostIfNoHeartbeat(): Promise<any[]>;

  // Stats Queries
  fillHistoricalTaskStatusCountsTable(): Promise<any[]>;
};

/**
 * Create a typed SqlRunner with methods for each command
 */
export function createTypedSqlRunner(connectionString: string, configPath?: string): HyrexSqlRunner & SqlRunnerCommands {
  const runner = new HyrexSqlRunner(connectionString, configPath);
  const typedRunner = runner as HyrexSqlRunner & SqlRunnerCommands;

  // Schema Creation Commands
  typedRunner.createHyrexTaskExecutionTable = () => runner.run('CreateHyrexTaskExecutionTable');
  typedRunner.createHyrexTaskTable = () => runner.run('CreateHyrexTaskTable');
  typedRunner.createHyrexCronJobTable = () => runner.run('CreateHyrexCronJobTable');
  typedRunner.createHyrexCronJobRunDetailsTable = () => runner.run('CreateHyrexCronJobRunDetailsTable');
  typedRunner.createHyrexSchedulerLockTable = () => runner.run('CreateHyrexSchedulerLockTable');
  typedRunner.createExecuteQueuedCommandFunction = () => runner.run('CreateExecuteQueuedCommandFunction');
  typedRunner.createHyrexListenerTable = () => runner.run('CreateHyrexListenerTable');
  typedRunner.createSystemLogTable = () => runner.run('CreateSystemLogTable');
  typedRunner.createHyrexAppTable = () => runner.run('CreateHyrexAppTable');
  typedRunner.createExecutorTable = () => runner.run('CreateExecutorTable');
  typedRunner.createResultsTable = () => runner.run('CreateResultsTable');
  typedRunner.createHistoricalTaskStatusCounts = () => runner.run('CreateHistoricalTaskStatusCounts');
  typedRunner.createWorkflowTable = () => runner.run('CreateWorkflowTable');
  typedRunner.createWorkflowRunTable = () => runner.run('CreateWorkflowRunTable');
  typedRunner.createMaterializedViewQueuedStats = () => runner.run('CreateMaterializedViewQueuedStats');
  typedRunner.createGetFreshQueuedStatsFunction = () => runner.run('CreateGetFreshQueuedStatsFunction');

  // App Queries
  typedRunner.registerAppInfo = (appId, appInfo) => runner.run('RegisterAppInfo', { appId, appInfo });

  // Task Run Queries
  typedRunner.enqueueTask = (params) => runner.run('EnqueueTask', {
    taskId: params.taskId,
    durableId: params.durableId,
    rootId: params.rootId,
    workflowRunId: params.workflowRunId,
    workflowDependencies: params.workflowDependencies,
    parentId: params.parentId,
    status: params.status,
    taskName: params.taskName,
    taskArgs: params.taskArgs,
    queue: params.queue,
    maxRetries: params.maxRetries,
    priority: params.priority,
    timeoutSeconds: params.timeoutSeconds,
    idempotencyKey: params.idempotencyKey
  });
  
  typedRunner.fetchTask = (taskQueue, executorId, taskNames) => 
    runner.run('FetchTask', { taskQueue, executorId, taskNames });
  
  typedRunner.fetchTaskWithConcurrencyLimit = (taskQueue, concurrencyLimit, taskNames, executorId) => 
    runner.run('FetchTaskWithConcurrencyLimit', { taskQueue, concurrencyLimit, taskNames, executorId });
  
  typedRunner.markTaskFailed = (taskId) => runner.run('MarkTaskFailed', { taskId });
  typedRunner.markTaskSuccess = (taskId) => runner.run('MarkTaskSuccess', { taskId });
  typedRunner.markTaskCanceled = (taskId) => runner.run('MarkTaskCanceled', { taskId });
  typedRunner.markTaskLost = (taskId) => runner.run('MarkTaskLost', { taskId });
  typedRunner.saveResult = (taskId, result) => runner.run('SaveResult', { taskId, result });
  typedRunner.fetchResult = (taskId) => runner.run('FetchResult', { taskId });
  typedRunner.fetchActiveQueueNames = (queuePattern) => runner.run('FetchActiveQueueNames', { queuePattern });
  typedRunner.conditionallyRetryTask = (originalTaskId, newTaskId) => 
    runner.run('ConditionallyRetryTask', { originalTaskId, newTaskId });
  typedRunner.setLogLink = (taskId, logLink) => runner.run('SetLogLink', { taskId, logLink });

  // Task Definition Queries
  typedRunner.upsertTask = (taskName, cronExpr, sourceCode) => 
    runner.run('UpsertTask', { taskName, cronExpr, sourceCode });

  // Executor Queries
  typedRunner.registerExecutor = (executorId, executorName, queuePattern, queues, workerName) => 
    runner.run('RegisterExecutor', { executorId, executorName, queuePattern, queues, workerName });
  
  typedRunner.updateQueuesOnExecutor = (executorId, queues) => 
    runner.run('UpdateQueuesOnExecutor', { executorId, queues });
  
  typedRunner.disconnectExecutor = (executorId, stats) => 
    runner.run('DisconnectExecutor', { executorId, stats });
  
  typedRunner.updateExecutorStats = (executorId, stats) => 
    runner.run('UpdateExecutorStats', { executorId, stats });
  
  typedRunner.batchUpdateHeartbeatOnExecutors = (executorIds) => 
    runner.run('BatchUpdateHeartbeatOnExecutors', { executorIds });
  
  typedRunner.batchUpdateHeartbeatLog = (logId, executorIds) => 
    runner.run('BatchUpdateHeartbeatLog', { logId, executorIds });

  // Scheduler Queries
  typedRunner.acquireSchedulerLock = (workerName, releaseDuration) => 
    runner.run('AcquireSchedulerLock', { workerName, releaseDuration });
  
  typedRunner.releaseSchedulerLock = (workerName) => 
    runner.run('ReleaseSchedulerLock', { workerName });

  // Cron Job Queries
  typedRunner.pullActiveCronExpressions = () => runner.run('PullActiveCronExpressions');
  typedRunner.updateCronJobConfirmationTs = (jobId) => 
    runner.run('UpdateCronJobConfirmationTs', { jobId });
  
  typedRunner.createCronJobForTask = (schedule, command, jobName) => 
    runner.run('CreateCronJobForTask', { schedule, command, jobName });
  
  typedRunner.turnOffCronForTask = (jobName) => 
    runner.run('TurnOffCronForTask', { jobName });
  
  typedRunner.createCronJobForSqlQuery = (schedule, command, jobName, shouldBackfill) => 
    runner.run('CreateCronJobForSqlQuery', { schedule, command, jobName, shouldBackfill });

  // Listener Queries
  typedRunner.registerHyrexListener = (listenerName, sourceCode) => 
    runner.run('RegisterHyrexListener', { listenerName, sourceCode });

  // Workflow Queries
  typedRunner.upsertWorkflow = (workflowName, cronExpr, sourceCode, dagStructure) => 
    runner.run('UpsertWorkflow', { workflowName, cronExpr, sourceCode, dagStructure });

  // Workflow Run Queries
  typedRunner.insertWorkflowRun = (workflowRunId, workflowName, args, queue, timeoutSeconds, idempotencyKey) => 
    runner.run('InsertWorkflowRun', { workflowRunId, workflowName, args, queue, timeoutSeconds, idempotencyKey });
  
  typedRunner.setWorkflowRunStatusBasedOnTaskRuns = (workflowRunId) => 
    runner.run('SetWorkflowRunStatusBasedOnTaskRuns', { workflowRunId });
  
  typedRunner.advanceWorkflowRun = (workflowRunId) => 
    runner.run('AdvanceWorkflowRun', { workflowRunId });
  
  typedRunner.skipWaitingTaskForWorkflowRunId = (workflowRunId) => 
    runner.run('SkipWaitingTaskForWorkflowRunId', { workflowRunId });

  // Durability Queries
  typedRunner.setOrphanedTaskExecutionToLostAndRetry = () => 
    runner.run('SetOrphanedTaskExecutionToLostAndRetry');
  
  typedRunner.setExecutorToLostIfNoHeartbeat = () => 
    runner.run('SetExecutorToLostIfNoHeartbeat');

  // Stats Queries
  typedRunner.fillHistoricalTaskStatusCountsTable = () => 
    runner.run('FillHistoricalTaskStatusCountsTable');

  return typedRunner;
}

// Usage example:
// const sqlRunner = createTypedSqlRunner('postgresql://user:password@localhost:5432/mydb');
// await sqlRunner.initDb();
// const tasks = await sqlRunner.fetchTask('default', 'executor-123', ['task1', 'task2']);