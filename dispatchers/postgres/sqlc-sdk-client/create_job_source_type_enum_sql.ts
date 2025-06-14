import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const createJobSourceTypeEnumQuery = `-- name: CreateJobSourceTypeEnum :exec
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'job_source_type') THEN
        CREATE TYPE job_source_type AS ENUM ('SYSTEM', 'TASK', 'APPLICATION');
    END IF;
END
$$`;

export async function createJobSourceTypeEnum(client: Client): Promise<void> {
    await client.query({
        text: createJobSourceTypeEnumQuery,
        values: [],
        rowMode: "array"
    });
}

