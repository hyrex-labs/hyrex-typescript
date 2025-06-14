import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const createExecutorStatusEnumQuery = `-- name: CreateExecutorStatusEnum :exec
DO $$
BEGIN
    -- Create enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'executor_status') THEN
        CREATE TYPE executor_status AS ENUM ('SHUTDOWN', 'LOST', 'RUNNING', 'UNKNOWN');
    END IF;
END$$`;

export async function createExecutorStatusEnum(client: Client): Promise<void> {
    await client.query({
        text: createExecutorStatusEnumQuery,
        values: [],
        rowMode: "array"
    });
}

