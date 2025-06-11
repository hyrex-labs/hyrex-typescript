# Hyrex Typescript SDK

## Configuration

`HYREX_DATABASE_URL` - For postgres mode.
`HYREX_API_KEY` - For usage with Hyrex Cloud.

## Commands

```typescript
npm run worker app/hyrex-app.ts 2
```

```typescript
npm run init-db app/hyrex-app.ts
```

## gRPC Client Generation

Hyrex supports using a gRPC platform API via the PlatformDispatcher. To generate TypeScript clients from the proto files:

1. Install the required dependencies:
   ```bash
   npm install --save-dev @grpc/grpc-js @grpc/proto-loader grpc-tools ts-protoc-gen google-protobuf @types/google-protobuf
   ```

2. Run the generation script:
   ```bash
   ./generate_proto_ts.sh
   ```

This will generate TypeScript clients from the proto files located in `dispatchers/platform/proto/` and place them in the `dispatchers/platform/generated/` directory.

## Using the PlatformDispatcher

The PlatformDispatcher allows you to communicate with Hyrex Platform API. Authentication is done using an API key:

```typescript
// Method 1: Create directly with API key
const dispatcher = new PlatformDispatcher('your-api-key');

// Method 2: Create from environment variables (requires HYREX_API_KEY to be set)
const dispatcher = PlatformDispatcher.fromEnv();

// Usage example
await dispatcher.enqueue([/* tasks */]);
```

All requests to the platform automatically include the x-api-key header for authentication.

## Notes on Signals

Hyrex Worker listens to two channels in a Postgres database:

`TASK_HEARTBEAT`

`TASK_CANCEL`


## Task Config Options

`idempotencyKey` - Idempotency keys are set on a task execution. If you attempt to send a task that has the same 
idempotency key as an existing task, then the task execution will not be enqueued. Instead, an `IDEMPOTENCY_COLLISION` 
will be recorded in the System Log table. This effect will last as long as the `idempotencyKey` is present in the 
`task_execution`.

## Logging with AWS S3

If configured, Hyrex will automatically send task logs to S3. 
Simply set the env vars `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` for credentials.
Then set `HYREX_S3_LOG_BUCKET` for the log name.
