import { createTypedSqlRunner } from '../HyrexSqlRunner';
import { v7 as uuidv7 } from 'uuid';

async function main() {
  // Create a SQL runner with your PostgreSQL connection string
  const sqlRunner = createTypedSqlRunner('postgresql://username:password@localhost:5432/hyrex_db');
  
  try {
    // Initialize the database schema (creates all tables)
    await sqlRunner.initDb();
    console.log('Database schema initialized successfully');
    
    // Example: Register an app
    await sqlRunner.registerAppInfo(1, {
      appName: 'MyHyrexApp',
      version: '1.0.0',
      startedAt: new Date().toISOString()
    });
    
    // Example: Create and schedule a task
    const taskName = 'ExampleTask';
    await sqlRunner.upsertTask(
      taskName, 
      '*/15 * * * *',  // Run every 15 minutes
      `console.log('This is an example task');`
    );
    
    // Example: Enqueue a task for immediate execution
    const taskId = uuidv7();
    await sqlRunner.enqueueTask({
      taskId,
      durableId: taskId,
      rootId: taskId,
      workflowRunId: null,
      workflowDependencies: null,
      parentId: null,
      status: 'queued',
      taskName,
      taskArgs: { param1: 'value1', param2: 42 },
      queue: 'default',
      maxRetries: 3,
      priority: 5,
      timeoutSeconds: 60,
      idempotencyKey: null
    });
    
    // Example: Create a cron job for a SQL query
    await sqlRunner.createCronJobForSqlQuery(
      '*/5 * * * *',  // Run every 5 minutes
      'SELECT NOW();',
      'ExampleCronJob',
      false
    );
    
    // Example: Register a worker executor
    const executorId = uuidv7();
    await sqlRunner.registerExecutor(
      executorId,
      'ExampleExecutor',
      'default.*',
      ['default', 'default.highpriority', 'default.lowpriority'],
      'worker-1'
    );
    
    // Example: Fetch tasks for processing
    const tasks = await sqlRunner.fetchTask('default', executorId, [taskName]);
    
    if (tasks.length > 0) {
      console.log('Found task to process:', tasks[0]);
      
      // Example: Mark task as successful after processing
      await sqlRunner.markTaskSuccess(tasks[0].id);
      
      // Example: Save task result
      await sqlRunner.saveResult(tasks[0].id, {
        status: 'completed',
        output: 'Task executed successfully',
        processedAt: new Date().toISOString()
      });
    }
    
    // Example: Create and run a workflow
    const workflowName = 'ExampleWorkflow';
    await sqlRunner.upsertWorkflow(
      workflowName,
      null, // No cron expression
      'function runWorkflow() { console.log("Running workflow"); }',
      {
        name: workflowName,
        tasks: [
          {
            id: 'task1',
            name: 'Step1',
            dependencies: []
          },
          {
            id: 'task2',
            name: 'Step2',
            dependencies: ['task1']
          }
        ]
      }
    );
    
    const workflowRunId = uuidv7();
    await sqlRunner.insertWorkflowRun(
      workflowRunId,
      workflowName,
      { param1: 'value1' },
      'default',
      120,
      null
    );
    
    // Example: Advance the workflow run
    await sqlRunner.advanceWorkflowRun(workflowRunId);
    
    console.log('Example operations completed successfully');
  } catch (error) {
    console.error('Error running examples:', error);
  } finally {
    // Close the connection pool
    await sqlRunner.close();
  }
}

// Run the examples if this script is executed directly
if (require.main === module) {
  main().catch(console.error);
}