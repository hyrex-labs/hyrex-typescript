import { string, z, ZodType } from "zod";
import {
    HyrexTaskConfig,
    HyrexTaskConfigInput,
    HyrexTaskConfigSchema,
    JsonSerializable,
    JsonType,
    UUID
} from "../utils";
import { HyrexWorkflowBuilder } from "./HyrexWorkflowBuilder";
import { getHyrexContext } from "../HyrexContext";
import { v7 as uuidv7 } from "uuid";
import { SerializedTaskRequest } from "../dispatchers/HyrexDispatcher";


export const HyrexWorkflowSchema = z.object({
    name: z.string(),
    config: HyrexTaskConfigSchema,
    workflowArgSchema: z.optional(
        // Using z.custom with a type guard to check for a Zod schema.
        z.custom<ZodType<any, any, any>>(
            (val): val is ZodType<any, any, any> => val instanceof ZodType,
            { message: "workflowArgSchema must be a valid Zod schema" }
        )
    ),
    body: z.function()
        // Since your function takes one argument, wrap the expected argument in a tuple.
        .args(z.tuple([z.instanceof(HyrexWorkflowBuilder)]))
        .returns(z.instanceof(HyrexWorkflowBuilder)),
});

export class HyrexWorkflow {
    public name: string;
    public config: HyrexTaskConfig;
    public workflowArgSchema?: z.ZodType;
    public workflowBuilder: HyrexWorkflowBuilder;

    constructor({ name, config, workflowArgSchema, workflowBuilder }: {
        name: string,
        config: HyrexTaskConfig,
        workflowArgSchema?: z.ZodType,
        workflowBuilder: HyrexWorkflowBuilder
    }) {
        this.name = name;
        this.config = config;
        this.workflowArgSchema = workflowArgSchema;
        this.workflowBuilder = workflowBuilder;
    }

    send(workflowArgument?: any) {
        if (workflowArgument && this.workflowArgSchema) {
            this.workflowArgSchema.parse(workflowArgument)
        }

        // const hyrexContext = getHyrexContext()

        const currentId = uuidv7()
        // const serializedTaskRequest: SerializedTaskRequest = {
        //     id: currentId,
        //     durable_id: currentId,
        //     root_id: hyrexContext ? hyrexContext.rootId : currentId,
        //     parent_id: hyrexContext ? hyrexContext.taskId : null,
        //     queue: typeof this.taskConfig.queue === 'string' ? this.taskConfig.queue : this.taskConfig.queue.name,
        //     task_name: this.taskName,
        //     args: context,
        //     max_retries: this.taskConfig.maxRetries,
        //     priority: this.taskConfig.priority,
        //     timeout_seconds: this.taskConfig.timeoutSeconds || null,
        //     idempotency_key: this.taskConfig.idempotencyKey || null
        // }



    }
    //     CREATE TABLE IF NOT EXISTS hyrex_workflow_run (
    //         id              UUID                        NOT NULL PRIMARY KEY,
    //         parent_id       UUID,
    //         workflow_name   VARCHAR                     NOT NULL,
    //         args            JSON                        NOT NULL,
    //         queue           VARCHAR                     NOT NULL,
    //         priority        SMALLINT                    NOT NULL,
    //         timeout_seconds INT                         DEFAULT NULL CHECK (timeout_seconds IS NULL OR timeout_seconds > 0),
    //     status          workflow_run_status             NOT NULL,
    //         scheduled_start TIMESTAMP WITH TIME ZONE,
    //         queued          TIMESTAMP WITH TIME ZONE,
    //         started         TIMESTAMP WITH TIME ZONE,
    //         finished        TIMESTAMP WITH TIME ZONE,
    //         last_heartbeat  TIMESTAMP WITH TIME ZONE,
    //         idempotency_key VARCHAR
    // );


}
