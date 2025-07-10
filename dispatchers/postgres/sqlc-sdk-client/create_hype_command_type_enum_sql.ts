import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const createHypeCommandTypeEnumQuery = `-- name: CreateHypeCommandTypeEnum :exec
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'hype_command_type') THEN
        CREATE TYPE hype_command_type AS ENUM ('TASK', 'WORKFLOW');
    END IF;
END
$$`;

export async function createHypeCommandTypeEnum(client: Client): Promise<void> {
    await client.query({
        text: createHypeCommandTypeEnumQuery,
        values: [],
        rowMode: "array"
    });
}

