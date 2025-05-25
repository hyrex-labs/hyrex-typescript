# Hyrex Studio

Hyrex Studio is a simple web server that allows you to execute SQL queries against your Hyrex database.

## Getting Started

1. Make sure you have a PostgreSQL database set up for Hyrex
2. Set your database connection string as an environment variable:
   ```
   export DATABASE_URL="postgresql://username:password@localhost:5432/hyrex"
   ```
3. Start the studio server:
   ```
   npm run studio
   ```
4. The server will start on port 1337 by default (or the port specified in STUDIO_PORT environment variable)

## API Endpoints

### Health Check
```
GET /health
```
Returns a simple status check to verify the server is running.

### Execute SQL Query
```
POST /api/query
Content-Type: application/json

{
  "query": "SELECT * FROM hyrex_task_execution LIMIT 10",
  "params": []  // Optional
}
```

This endpoint allows you to run any SQL query against the Hyrex database. 
The `params` array is optional and can be used for parameterized queries to prevent SQL injection.

## Example Queries

See the `tests/studio/query.http` file for example queries.

## Security Considerations

- This server exposes direct database access, so it should only be run in secure environments
- Consider using IP restrictions, authentication, or a VPN when exposing this service
- Never expose this server directly to the internet without proper security controls

## Environment Variables

- `DATABASE_URL`: Database connection string (required)
- `STUDIO_PORT`: Port to run the server on (default: 1337)