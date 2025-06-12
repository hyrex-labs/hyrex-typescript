import { QueryArrayConfig, QueryArrayResult } from "pg";

interface Client {
    query: (config: QueryArrayConfig) => Promise<QueryArrayResult>;
}

export const conditionallyRetryTaskQuery = `-- name: ConditionallyRetryTask :exec
WITH existing_task AS (SELECT durable_id,
                              root_id,
                              parent_id,
                              workflow_run_id,
                              workflow_dependencies,
                              task_name,
                              args,
                              queue,
                              attempt_number,
                              max_retries,
                              priority
                       FROM hyrex_task_run
                       WHERE hyrex_task_run.id = $2
                         AND hyrex_task_run.attempt_number < hyrex_task_run.max_retries)
INSERT
INTO hyrex_task_run (id,
                     durable_id,
                     root_id,
                     parent_id,
                     workflow_run_id,
                     workflow_dependencies,
                     queued,
                     status,
                     task_name,
                     args,
                     queue,
                     attempt_number,
                     max_retries,
                     priority)
SELECT $1 AS id,
       durable_id,
       root_id,
       parent_id,
       workflow_run_id,
       workflow_dependencies,
       CURRENT_TIMESTAMP  as queued,
       'queued'          AS status,
       task_name,
       args,
       queue,
       attempt_number + 1 AS attempt_number,
       max_retries,
       priority
FROM existing_task`;

export interface ConditionallyRetryTaskArgs {
    newTaskId: string;
    existingTaskId: string;
}

export async function conditionallyRetryTask(client: Client, args: ConditionallyRetryTaskArgs): Promise<void> {
    await client.query({
        text: conditionallyRetryTaskQuery,
        values: [args.newTaskId, args.existingTaskId],
        rowMode: "array"
    });
}

