#!/bin/bash

# Start PostgreSQL container for Hyrex development
docker run \
  --name hyrex_postgres_ts_testing \
  --env POSTGRES_USER=hyrex_user \
  --env POSTGRES_PASSWORD=hyrex_password \
  --env POSTGRES_DB=hyrex_db \
  --publish 5432:5432 \
  --health-cmd "pg_isready -U hyrex_user -d hyrex_db" \
  --health-interval 10s \
  --health-timeout 5s \
  --health-retries 5 \
  postgres:16-alpine

npm run init-db/hyrex-app.ts

echo "PostgreSQL container started. Use 'docker logs hyrex_postgres' to check status."
