# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Build and Development
```bash
# Build TypeScript to JavaScript (outputs to dist/)
npm run build

# Run a worker with TypeScript directly
npm run worker <script> [count]

# Run a compiled worker
npm run workerjs <script> [count]

# Initialize PostgreSQL database schema
npm run init-db <script>

# Run Hyrex Studio server (development UI)
npm run studio

# Release commands
npm run release        # Private NPM package
npm run release-public # Public NPM package
```

### CLI Usage
```bash
# Run worker processes
hyrex run-worker <script> [count] [options]
  --lifespan, -l      # Worker lifespan in seconds
  --exit-on-sleep     # Exit when no tasks available
  --queue, -q         # Queue pattern (supports glob: "queue-*")

# Initialize database
hyrex init-db <script>
```

## Architecture Overview

Hyrex is a distributed task execution framework with the following core components:

1. **HyrexApp**: Main orchestrator that manages all components
   - Coordinates dispatcher, workers, admin, and scheduler
   - Entry point for application lifecycle

2. **HyrexRegistry**: Task and workflow definition container
   - Register tasks with configurations (queue, timeout, cron, etc.)
   - Define workflows as DAGs of tasks
   - Manage queue definitions and listeners

3. **HyrexDispatcher**: Abstraction layer for task storage/retrieval
   - **PostgresDispatcher**: Direct PostgreSQL implementation (primary)
   - **PlatformDispatcher**: gRPC-based cloud API implementation

4. **HyrexExecutor**: Worker process that executes tasks
   - Polls queues for tasks
   - Executes task functions with retry logic
   - Maintains heartbeat to prevent task loss

5. **HyrexAdmin**: Administrative daemon
   - Monitors executor health via heartbeats
   - Handles task cancellation and orphan detection
   - Manages system-wide task state

6. **HyrexCronScheduler**: Cron job scheduling
   - Polls for active cron expressions
   - Enqueues tasks based on schedule

## Key Development Patterns

### Task Definition
```typescript
const hy = new HyrexRegistry()

const myTask = hy.task({
    name: "myTask",
    config: {
        queue: "default",
        timeoutSeconds: 30,
        cron: "0 * * * *",  // Optional cron schedule
        idempotencyKey: true,  // Prevent duplicate runs
        concurrencyLimit: 5   // Queue-level concurrency
    },
    func: async (input: TaskInput) => {
        // Task implementation
        return result
    }
})
```

### Application Setup
```typescript
const app = new HyrexApp({ 
    name: "MyApp",
    database_url: process.env.HYREX_DATABASE_URL
})
app.addRegistry(hy)
await app.init()
```

## Important Environment Variables
- `HYREX_DATABASE_URL`: PostgreSQL connection string
- `HYREX_API_KEY`: Platform API key (for cloud mode)
- `HYREX_S3_LOG_BUCKET_NAME`: S3 bucket for log storage
- AWS credentials for S3 logging

## SQL Runner Pattern
The PostgreSQL dispatcher uses a code-generated SQL runner pattern:
- SQL queries are in `dispatchers/postgres/sql-runner/` directories
- Run `./dispatchers/postgres/sql-runner/generate-sql-runner.sh` to regenerate after SQL changes
- All database operations go through the generated `HyrexSqlRunner` class
