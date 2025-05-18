#!/bin/bash

# Path to the sql-runner.json file
SQL_RUNNER_JSON="${1:-./sql-runner.json}"
OUTPUT_FILE="${2:-./HyrexSqlRunner.ts}"

if [ ! -f "$SQL_RUNNER_JSON" ]; then
  echo "Error: $SQL_RUNNER_JSON file not found"
  exit 1
fi

# Parse the SQL runner json file using jq
if ! which jq > /dev/null; then
  echo "Error: jq is required but not installed. Please install jq."
  exit 1
fi

# Extract the name and commands from the JSON file
RUNNER_NAME=$(jq -r '.name' "$SQL_RUNNER_JSON")
COMMANDS=$(jq -c '.commands[]' "$SQL_RUNNER_JSON")

# Create arrays to store commands by category
SCHEMA_COMMANDS=()
APP_COMMANDS=()
TASK_RUN_COMMANDS=()
TASK_COMMANDS=()
EXECUTOR_COMMANDS=()
SCHEDULER_COMMANDS=()
CRON_JOB_COMMANDS=()
LISTENER_COMMANDS=()
WORKFLOW_COMMANDS=()
WORKFLOW_RUN_COMMANDS=()
DURABILITY_COMMANDS=()
STATS_COMMANDS=()
OTHER_COMMANDS=()

# Process each command and categorize them
while IFS= read -r command; do
  NAME=$(echo "$command" | jq -r '.name')
  QUERY=$(echo "$command" | jq -r '.query')
  PARAMS=$(echo "$command" | jq -r '.params[]' 2>/dev/null | tr '\n' ' ' | xargs)

  # Categorize based on name or path
  if [[ "$NAME" == Create* ]]; then
    SCHEMA_COMMANDS+=("$command")
  elif [[ "$QUERY" == app/* ]]; then
    APP_COMMANDS+=("$command")
  elif [[ "$QUERY" == task_run/* ]]; then
    TASK_RUN_COMMANDS+=("$command")
  elif [[ "$QUERY" == task/* ]]; then
    TASK_COMMANDS+=("$command")
  elif [[ "$QUERY" == executor/* ]]; then
    EXECUTOR_COMMANDS+=("$command")
  elif [[ "$QUERY" == scheduler/* ]]; then
    SCHEDULER_COMMANDS+=("$command")
  elif [[ "$QUERY" == cron_job/* ]]; then
    CRON_JOB_COMMANDS+=("$command")
  elif [[ "$QUERY" == listener/* ]]; then
    LISTENER_COMMANDS+=("$command")
  elif [[ "$QUERY" == workflow/* && "$QUERY" != workflow_run/* ]]; then
    WORKFLOW_COMMANDS+=("$command")
  elif [[ "$QUERY" == workflow_run/* ]]; then
    WORKFLOW_RUN_COMMANDS+=("$command")
  elif [[ "$QUERY" == durability/* ]]; then
    DURABILITY_COMMANDS+=("$command")
  elif [[ "$QUERY" == stats/* ]]; then
    STATS_COMMANDS+=("$command")
  else
    OTHER_COMMANDS+=("$command")
  fi
done <<< "$COMMANDS"

# Function to generate method signature from params
generate_method_signature() {
  local name=$1
  local params=$2
  
  # Convert to camelCase
  local method_name=${name,}
  
  if [ -z "$params" ]; then
    echo "  ${method_name}(): Promise<any[]>;"
  else
    # Build parameter list
    local param_list=""
    for param in $params; do
      param_type="any"
      case "$param" in
        *Id|*Name|*Link|*Pattern) param_type="string" ;;
        task*|workflow*|*jobName) param_type="string" ;;
        *Ids) param_type="string[]" ;;
        queues) param_type="string[]" ;;
        concurrencyLimit|*Number|*Seconds|jobId|appId) param_type="number" ;;
        should*) param_type="boolean" ;;
        *Args|*Info|*Structure|stats|*Result) param_type="any" ;;
      esac
      
      # Special case for params with name "id" to be string type
      if [ "$param" = "id" ]; then
        param_type="string"
      fi
      
      # Add optional marker for certain types
      optional=""
      if [[ "$param_type" == "string" && "$param" == *Key ]]; then
        optional=" | null"
      fi
      if [[ "$param" == *workflowRunId || "$param" == *workflowDependencies || "$param" == *parentId || "$param" == timeoutSeconds ]]; then
        optional=" | null"
      fi
      
      if [ -z "$param_list" ]; then
        param_list="${param}: ${param_type}${optional}"
      else
        param_list="${param_list}, ${param}: ${param_type}${optional}"
      fi
    done
    
    echo "  ${method_name}(${param_list}): Promise<any[]>;"
  fi
}

# Function to generate method implementation from params
generate_method_implementation() {
  local name=$1
  local params=$2
  
  # Convert to camelCase
  local method_name=${name,}
  
  if [ -z "$params" ]; then
    echo "  typedRunner.${method_name} = () => runner.run('${name}');"
  else
    # Build parameter list and params object
    local param_list=""
    local param_obj=""
    for param in $params; do
      if [ -z "$param_list" ]; then
        param_list="${param}"
      else
        param_list="${param_list}, ${param}"
      fi
      
      if [ -z "$param_obj" ]; then
        param_obj="${param}"
      else
        param_obj="${param_obj}, ${param}"
      fi
    done
    
    if [ $(echo "$params" | wc -w) -eq 1 ]; then
      # Single parameter case
      echo "  typedRunner.${method_name} = (${param_list}) => runner.run('${name}', { ${param_obj} });"
    elif [ $(echo "$params" | wc -w) -gt 5 ]; then
      # Complex object parameter case (for methods with many params)
      echo "  typedRunner.${method_name} = (params) => runner.run('${name}', {"
      for param in $params; do
        echo "    ${param}: params.${param},"
      done
      echo "  });"
    else
      # Multiple parameters case
      echo "  typedRunner.${method_name} = (${param_list}) => "
      echo "    runner.run('${name}', { ${param_obj} });"
    fi
  fi
}

# Generate the SQL Runner class
cat > "$OUTPUT_FILE" << EOF
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
        console.error(\`Failed to load SQL file for command \${command.name} at \${queryPath}:\`, error);
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
            console.warn(\`Connection pool exhausted, attempt \${attempt + 1}/\${maxRetries}\`);
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
    throw new Error(\`Failed after \${maxRetries} attempts: \${errorMessage}\`);
  }

  /**
   * Get a command by name
   */
  private getCommand(commandName: string): QueryCommand {
    const command = this.config.commands.find(cmd => cmd.name === commandName);
    if (!command) {
      throw new Error(\`Command not found: \${commandName}\`);
    }
    return command;
  }

  /**
   * Get the SQL query for a command
   */
  private getSql(commandName: string): string {
    const sql = this.sqlQueries.get(commandName);
    if (!sql) {
      throw new Error(\`SQL not loaded for command: \${commandName}\`);
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
        throw new Error(\`Required parameter "\${paramName}" missing for command "\${command.name}"\`);
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

// Define the interface for SqlRunnerCommands with all methods
export type SqlRunnerCommands = {
  // Schema Creation Commands
EOF

# Add method signatures for each category
for command in "${SCHEMA_COMMANDS[@]}"; do
  NAME=$(echo "$command" | jq -r '.name')
  PARAMS=$(echo "$command" | jq -r '.params[]' 2>/dev/null | tr '\n' ' ' | xargs)
  
  # Convert CreateXXX to createXXX
  METHOD_NAME="$(echo ${NAME:0:1} | tr '[:upper:]' '[:lower:]')${NAME:1}"
  
  echo "$(generate_method_signature "$NAME" "$PARAMS")" >> "$OUTPUT_FILE"
done

# App Commands
if [ ${#APP_COMMANDS[@]} -gt 0 ]; then
  echo "" >> "$OUTPUT_FILE"
  echo "  // App Queries" >> "$OUTPUT_FILE"
  
  for command in "${APP_COMMANDS[@]}"; do
    NAME=$(echo "$command" | jq -r '.name')
    PARAMS=$(echo "$command" | jq -r '.params[]' 2>/dev/null | tr '\n' ' ' | xargs)
    echo "$(generate_method_signature "$NAME" "$PARAMS")" >> "$OUTPUT_FILE"
  done
fi

# Task Run Commands
if [ ${#TASK_RUN_COMMANDS[@]} -gt 0 ]; then
  echo "" >> "$OUTPUT_FILE"
  echo "  // Task Run Queries" >> "$OUTPUT_FILE"
  
  for command in "${TASK_RUN_COMMANDS[@]}"; do
    NAME=$(echo "$command" | jq -r '.name')
    PARAMS=$(echo "$command" | jq -r '.params[]' 2>/dev/null | tr '\n' ' ' | xargs)
    
    # Special case for complex params
    if [ "$NAME" = "EnqueueTask" ]; then
      cat >> "$OUTPUT_FILE" << EOF
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
EOF
    else
      echo "$(generate_method_signature "$NAME" "$PARAMS")" >> "$OUTPUT_FILE"
    fi
  done
fi

# Task Commands
if [ ${#TASK_COMMANDS[@]} -gt 0 ]; then
  echo "" >> "$OUTPUT_FILE"
  echo "  // Task Definition Queries" >> "$OUTPUT_FILE"
  
  for command in "${TASK_COMMANDS[@]}"; do
    NAME=$(echo "$command" | jq -r '.name')
    PARAMS=$(echo "$command" | jq -r '.params[]' 2>/dev/null | tr '\n' ' ' | xargs)
    echo "$(generate_method_signature "$NAME" "$PARAMS")" >> "$OUTPUT_FILE"
  done
fi

# Executor Commands
if [ ${#EXECUTOR_COMMANDS[@]} -gt 0 ]; then
  echo "" >> "$OUTPUT_FILE"
  echo "  // Executor Queries" >> "$OUTPUT_FILE"
  
  for command in "${EXECUTOR_COMMANDS[@]}"; do
    NAME=$(echo "$command" | jq -r '.name')
    PARAMS=$(echo "$command" | jq -r '.params[]' 2>/dev/null | tr '\n' ' ' | xargs)
    
    # Special case for RegisterExecutor
    if [ "$NAME" = "RegisterExecutor" ]; then
      cat >> "$OUTPUT_FILE" << EOF
  registerExecutor(
    executorId: string,
    executorName: string,
    queuePattern: string,
    queues: string[],
    workerName: string
  ): Promise<any[]>;
EOF
    else
      echo "$(generate_method_signature "$NAME" "$PARAMS")" >> "$OUTPUT_FILE"
    fi
  done
fi

# Scheduler Commands
if [ ${#SCHEDULER_COMMANDS[@]} -gt 0 ]; then
  echo "" >> "$OUTPUT_FILE"
  echo "  // Scheduler Queries" >> "$OUTPUT_FILE"
  
  for command in "${SCHEDULER_COMMANDS[@]}"; do
    NAME=$(echo "$command" | jq -r '.name')
    PARAMS=$(echo "$command" | jq -r '.params[]' 2>/dev/null | tr '\n' ' ' | xargs)
    echo "$(generate_method_signature "$NAME" "$PARAMS")" >> "$OUTPUT_FILE"
  done
fi

# Cron Job Commands
if [ ${#CRON_JOB_COMMANDS[@]} -gt 0 ]; then
  echo "" >> "$OUTPUT_FILE"
  echo "  // Cron Job Queries" >> "$OUTPUT_FILE"
  
  for command in "${CRON_JOB_COMMANDS[@]}"; do
    NAME=$(echo "$command" | jq -r '.name')
    PARAMS=$(echo "$command" | jq -r '.params[]' 2>/dev/null | tr '\n' ' ' | xargs)
    echo "$(generate_method_signature "$NAME" "$PARAMS")" >> "$OUTPUT_FILE"
  done
fi

# Listener Commands
if [ ${#LISTENER_COMMANDS[@]} -gt 0 ]; then
  echo "" >> "$OUTPUT_FILE"
  echo "  // Listener Queries" >> "$OUTPUT_FILE"
  
  for command in "${LISTENER_COMMANDS[@]}"; do
    NAME=$(echo "$command" | jq -r '.name')
    PARAMS=$(echo "$command" | jq -r '.params[]' 2>/dev/null | tr '\n' ' ' | xargs)
    echo "$(generate_method_signature "$NAME" "$PARAMS")" >> "$OUTPUT_FILE"
  done
fi

# Workflow Commands
if [ ${#WORKFLOW_COMMANDS[@]} -gt 0 ]; then
  echo "" >> "$OUTPUT_FILE"
  echo "  // Workflow Queries" >> "$OUTPUT_FILE"
  
  for command in "${WORKFLOW_COMMANDS[@]}"; do
    NAME=$(echo "$command" | jq -r '.name')
    PARAMS=$(echo "$command" | jq -r '.params[]' 2>/dev/null | tr '\n' ' ' | xargs)
    
    # Special case for UpsertWorkflow
    if [ "$NAME" = "UpsertWorkflow" ]; then
      cat >> "$OUTPUT_FILE" << EOF
  upsertWorkflow(
    workflowName: string,
    cronExpr: string | null,
    sourceCode: string,
    dagStructure: any
  ): Promise<any[]>;
EOF
    else
      echo "$(generate_method_signature "$NAME" "$PARAMS")" >> "$OUTPUT_FILE"
    fi
  done
fi

# Workflow Run Commands
if [ ${#WORKFLOW_RUN_COMMANDS[@]} -gt 0 ]; then
  echo "" >> "$OUTPUT_FILE"
  echo "  // Workflow Run Queries" >> "$OUTPUT_FILE"
  
  for command in "${WORKFLOW_RUN_COMMANDS[@]}"; do
    NAME=$(echo "$command" | jq -r '.name')
    PARAMS=$(echo "$command" | jq -r '.params[]' 2>/dev/null | tr '\n' ' ' | xargs)
    
    # Special case for InsertWorkflowRun
    if [ "$NAME" = "InsertWorkflowRun" ]; then
      cat >> "$OUTPUT_FILE" << EOF
  insertWorkflowRun(
    workflowRunId: string,
    workflowName: string,
    args: any,
    queue: string,
    timeoutSeconds: number | null,
    idempotencyKey: string | null
  ): Promise<any[]>;
EOF
    else
      echo "$(generate_method_signature "$NAME" "$PARAMS")" >> "$OUTPUT_FILE"
    fi
  done
fi

# Durability Commands
if [ ${#DURABILITY_COMMANDS[@]} -gt 0 ]; then
  echo "" >> "$OUTPUT_FILE"
  echo "  // Durability Queries" >> "$OUTPUT_FILE"
  
  for command in "${DURABILITY_COMMANDS[@]}"; do
    NAME=$(echo "$command" | jq -r '.name')
    PARAMS=$(echo "$command" | jq -r '.params[]' 2>/dev/null | tr '\n' ' ' | xargs)
    echo "$(generate_method_signature "$NAME" "$PARAMS")" >> "$OUTPUT_FILE"
  done
fi

# Stats Commands
if [ ${#STATS_COMMANDS[@]} -gt 0 ]; then
  echo "" >> "$OUTPUT_FILE"
  echo "  // Stats Queries" >> "$OUTPUT_FILE"
  
  for command in "${STATS_COMMANDS[@]}"; do
    NAME=$(echo "$command" | jq -r '.name')
    PARAMS=$(echo "$command" | jq -r '.params[]' 2>/dev/null | tr '\n' ' ' | xargs)
    echo "$(generate_method_signature "$NAME" "$PARAMS")" >> "$OUTPUT_FILE"
  done
fi

# Other Commands
if [ ${#OTHER_COMMANDS[@]} -gt 0 ]; then
  echo "" >> "$OUTPUT_FILE"
  echo "  // Other Queries" >> "$OUTPUT_FILE"
  
  for command in "${OTHER_COMMANDS[@]}"; do
    NAME=$(echo "$command" | jq -r '.name')
    PARAMS=$(echo "$command" | jq -r '.params[]' 2>/dev/null | tr '\n' ' ' | xargs)
    echo "$(generate_method_signature "$NAME" "$PARAMS")" >> "$OUTPUT_FILE"
  done
fi

# Add the createTypedSqlRunner function
cat >> "$OUTPUT_FILE" << EOF
};

/**
 * Create a typed SqlRunner with methods for each command
 */
export function createTypedSqlRunner(connectionString: string, configPath?: string): HyrexSqlRunner & SqlRunnerCommands {
  const runner = new HyrexSqlRunner(connectionString, configPath);
  const typedRunner = runner as HyrexSqlRunner & SqlRunnerCommands;

  // Schema Creation Commands
EOF

# Add method implementations for each category
for command in "${SCHEMA_COMMANDS[@]}"; do
  NAME=$(echo "$command" | jq -r '.name')
  PARAMS=$(echo "$command" | jq -r '.params[]' 2>/dev/null | tr '\n' ' ' | xargs)
  echo "$(generate_method_implementation "$NAME" "$PARAMS")" >> "$OUTPUT_FILE"
done

# App Commands
if [ ${#APP_COMMANDS[@]} -gt 0 ]; then
  echo "" >> "$OUTPUT_FILE"
  echo "  // App Queries" >> "$OUTPUT_FILE"
  
  for command in "${APP_COMMANDS[@]}"; do
    NAME=$(echo "$command" | jq -r '.name')
    PARAMS=$(echo "$command" | jq -r '.params[]' 2>/dev/null | tr '\n' ' ' | xargs)
    echo "$(generate_method_implementation "$NAME" "$PARAMS")" >> "$OUTPUT_FILE"
  done
fi

# Task Run Commands
if [ ${#TASK_RUN_COMMANDS[@]} -gt 0 ]; then
  echo "" >> "$OUTPUT_FILE"
  echo "  // Task Run Queries" >> "$OUTPUT_FILE"
  
  for command in "${TASK_RUN_COMMANDS[@]}"; do
    NAME=$(echo "$command" | jq -r '.name')
    PARAMS=$(echo "$command" | jq -r '.params[]' 2>/dev/null | tr '\n' ' ' | xargs)
    
    # Special case for complex params
    if [ "$NAME" = "EnqueueTask" ]; then
      cat >> "$OUTPUT_FILE" << EOF
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
EOF
    else
      echo "$(generate_method_implementation "$NAME" "$PARAMS")" >> "$OUTPUT_FILE"
    fi
  done
fi

# Task Commands
if [ ${#TASK_COMMANDS[@]} -gt 0 ]; then
  echo "" >> "$OUTPUT_FILE"
  echo "  // Task Definition Queries" >> "$OUTPUT_FILE"
  
  for command in "${TASK_COMMANDS[@]}"; do
    NAME=$(echo "$command" | jq -r '.name')
    PARAMS=$(echo "$command" | jq -r '.params[]' 2>/dev/null | tr '\n' ' ' | xargs)
    echo "$(generate_method_implementation "$NAME" "$PARAMS")" >> "$OUTPUT_FILE"
  done
fi

# Executor Commands
if [ ${#EXECUTOR_COMMANDS[@]} -gt 0 ]; then
  echo "" >> "$OUTPUT_FILE"
  echo "  // Executor Queries" >> "$OUTPUT_FILE"
  
  for command in "${EXECUTOR_COMMANDS[@]}"; do
    NAME=$(echo "$command" | jq -r '.name')
    PARAMS=$(echo "$command" | jq -r '.params[]' 2>/dev/null | tr '\n' ' ' | xargs)
    
    # Special case for RegisterExecutor
    if [ "$NAME" = "RegisterExecutor" ]; then
      cat >> "$OUTPUT_FILE" << EOF
  typedRunner.registerExecutor = (executorId, executorName, queuePattern, queues, workerName) => 
    runner.run('RegisterExecutor', { executorId, executorName, queuePattern, queues, workerName });
EOF
    else
      echo "$(generate_method_implementation "$NAME" "$PARAMS")" >> "$OUTPUT_FILE"
    fi
  done
fi

# Scheduler Commands
if [ ${#SCHEDULER_COMMANDS[@]} -gt 0 ]; then
  echo "" >> "$OUTPUT_FILE"
  echo "  // Scheduler Queries" >> "$OUTPUT_FILE"
  
  for command in "${SCHEDULER_COMMANDS[@]}"; do
    NAME=$(echo "$command" | jq -r '.name')
    PARAMS=$(echo "$command" | jq -r '.params[]' 2>/dev/null | tr '\n' ' ' | xargs)
    echo "$(generate_method_implementation "$NAME" "$PARAMS")" >> "$OUTPUT_FILE"
  done
fi

# Cron Job Commands
if [ ${#CRON_JOB_COMMANDS[@]} -gt 0 ]; then
  echo "" >> "$OUTPUT_FILE"
  echo "  // Cron Job Queries" >> "$OUTPUT_FILE"
  
  for command in "${CRON_JOB_COMMANDS[@]}"; do
    NAME=$(echo "$command" | jq -r '.name')
    PARAMS=$(echo "$command" | jq -r '.params[]' 2>/dev/null | tr '\n' ' ' | xargs)
    echo "$(generate_method_implementation "$NAME" "$PARAMS")" >> "$OUTPUT_FILE"
  done
fi

# Listener Commands
if [ ${#LISTENER_COMMANDS[@]} -gt 0 ]; then
  echo "" >> "$OUTPUT_FILE"
  echo "  // Listener Queries" >> "$OUTPUT_FILE"
  
  for command in "${LISTENER_COMMANDS[@]}"; do
    NAME=$(echo "$command" | jq -r '.name')
    PARAMS=$(echo "$command" | jq -r '.params[]' 2>/dev/null | tr '\n' ' ' | xargs)
    echo "$(generate_method_implementation "$NAME" "$PARAMS")" >> "$OUTPUT_FILE"
  done
fi

# Workflow Commands
if [ ${#WORKFLOW_COMMANDS[@]} -gt 0 ]; then
  echo "" >> "$OUTPUT_FILE"
  echo "  // Workflow Queries" >> "$OUTPUT_FILE"
  
  for command in "${WORKFLOW_COMMANDS[@]}"; do
    NAME=$(echo "$command" | jq -r '.name')
    PARAMS=$(echo "$command" | jq -r '.params[]' 2>/dev/null | tr '\n' ' ' | xargs)
    
    # Special case for UpsertWorkflow
    if [ "$NAME" = "UpsertWorkflow" ]; then
      cat >> "$OUTPUT_FILE" << EOF
  typedRunner.upsertWorkflow = (workflowName, cronExpr, sourceCode, dagStructure) => 
    runner.run('UpsertWorkflow', { workflowName, cronExpr, sourceCode, dagStructure });
EOF
    else
      echo "$(generate_method_implementation "$NAME" "$PARAMS")" >> "$OUTPUT_FILE"
    fi
  done
fi

# Workflow Run Commands
if [ ${#WORKFLOW_RUN_COMMANDS[@]} -gt 0 ]; then
  echo "" >> "$OUTPUT_FILE"
  echo "  // Workflow Run Queries" >> "$OUTPUT_FILE"
  
  for command in "${WORKFLOW_RUN_COMMANDS[@]}"; do
    NAME=$(echo "$command" | jq -r '.name')
    PARAMS=$(echo "$command" | jq -r '.params[]' 2>/dev/null | tr '\n' ' ' | xargs)
    
    # Special case for InsertWorkflowRun
    if [ "$NAME" = "InsertWorkflowRun" ]; then
      cat >> "$OUTPUT_FILE" << EOF
  typedRunner.insertWorkflowRun = (workflowRunId, workflowName, args, queue, timeoutSeconds, idempotencyKey) => 
    runner.run('InsertWorkflowRun', { workflowRunId, workflowName, args, queue, timeoutSeconds, idempotencyKey });
EOF
    else
      echo "$(generate_method_implementation "$NAME" "$PARAMS")" >> "$OUTPUT_FILE"
    fi
  done
fi

# Durability Commands
if [ ${#DURABILITY_COMMANDS[@]} -gt 0 ]; then
  echo "" >> "$OUTPUT_FILE"
  echo "  // Durability Queries" >> "$OUTPUT_FILE"
  
  for command in "${DURABILITY_COMMANDS[@]}"; do
    NAME=$(echo "$command" | jq -r '.name')
    PARAMS=$(echo "$command" | jq -r '.params[]' 2>/dev/null | tr '\n' ' ' | xargs)
    echo "$(generate_method_implementation "$NAME" "$PARAMS")" >> "$OUTPUT_FILE"
  done
fi

# Stats Commands
if [ ${#STATS_COMMANDS[@]} -gt 0 ]; then
  echo "" >> "$OUTPUT_FILE"
  echo "  // Stats Queries" >> "$OUTPUT_FILE"
  
  for command in "${STATS_COMMANDS[@]}"; do
    NAME=$(echo "$command" | jq -r '.name')
    PARAMS=$(echo "$command" | jq -r '.params[]' 2>/dev/null | tr '\n' ' ' | xargs)
    echo "$(generate_method_implementation "$NAME" "$PARAMS")" >> "$OUTPUT_FILE"
  done
fi

# Other Commands
if [ ${#OTHER_COMMANDS[@]} -gt 0 ]; then
  echo "" >> "$OUTPUT_FILE"
  echo "  // Other Queries" >> "$OUTPUT_FILE"
  
  for command in "${OTHER_COMMANDS[@]}"; do
    NAME=$(echo "$command" | jq -r '.name')
    PARAMS=$(echo "$command" | jq -r '.params[]' 2>/dev/null | tr '\n' ' ' | xargs)
    echo "$(generate_method_implementation "$NAME" "$PARAMS")" >> "$OUTPUT_FILE"
  done
fi

# Add the closing of the function
cat >> "$OUTPUT_FILE" << EOF

  return typedRunner;
}

// Usage example:
// const sqlRunner = createTypedSqlRunner('postgresql://user:password@localhost:5432/mydb');
// await sqlRunner.initDb();
// const tasks = await sqlRunner.fetchTask('default', 'executor-123', ['task1', 'task2']);
EOF

chmod +x "$OUTPUT_FILE"

echo "Generated TypeScript file at: $OUTPUT_FILE"