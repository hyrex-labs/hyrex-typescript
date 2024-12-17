# Hyrex Typescript SDK

## Configuration

`HYREX_DATABASE_URL` - For postgres mode.
`HYREX_API_KEY` - For usage with Hyrex Cloud.

## Commands

```typescript
npm run worker app/hyrexWorker.ts 2
```

```typescript
npm run init-db app/hyrexWorker.ts
```

## Notes on Signals

Hyrex Worker listens to two channels in a Postgres database:

`TASK_HEARTBEAT`

`TASK_CANCEL`


## Task Config Options

`idempotencyKey` - Idempotency keys are set on a task execution. If you attempt to send a task that has the same 
idempotency key as an existing task, then the task execution will not be enqueued. Instead, an `IDEMPOTENCY_COLLISION` 
will be recorded in the System Log table. This effect will last as long as the `idempotencyKey` is present in the 
`task_execution`.
