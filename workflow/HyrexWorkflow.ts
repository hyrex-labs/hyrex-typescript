import { string, z, ZodType } from "zod";
import {
    HyrexTaskConfig,
    HyrexTaskConfigInput,
    HyrexTaskConfigSchema,
    JsonSerializable,
    JsonType,
    UUID
} from "../utils";
import { HyrexWorkflowBuilder, WorkflowDagJson } from "./HyrexWorkflowBuilder";
import { getHyrexContext } from "../HyrexContext";
import { v7 as uuidv7 } from "uuid";
import { HyrexDispatcher, SerializedTask, SerializedTaskRequest } from "../dispatchers/HyrexDispatcher";

export type WorkflowRunStatus = 'success' | 'failed' | 'running' | 'queued' | 'waiting' | 'up_for_cancel' | 'lost' | 'canceled';

export type SerializedWorkflowRunRequest = {
    id: string;             // UUID as a string
    workflow_name: string;
    args: unknown;          // JSON field – adjust the type as needed
    queue: string;
    timeout_seconds: number | null;
    idempotency_key: string | null;
};

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
    public workflowDagJson: WorkflowDagJson;
    private dispatcher: HyrexDispatcher;

    constructor({ name, config, workflowArgSchema, workflowDagJson, dispatcher }: {
        name: string,
        config: HyrexTaskConfig,
        workflowArgSchema?: z.ZodType,
        workflowDagJson: WorkflowDagJson,
        dispatcher: HyrexDispatcher,
    }) {
        this.name = name;
        this.config = config;
        this.workflowArgSchema = workflowArgSchema;
        this.workflowDagJson = workflowDagJson;
        this.dispatcher = dispatcher;
    }

    /**
     * Creates a workflow run and enqueues all tasks for execution.
     *
     * @param workflowArgument Optional argument for the workflow run.
     * @returns The created workflow run ID.
     */
    async send(workflowArgument?: any) {
        if (workflowArgument && this.workflowArgSchema) {
            this.workflowArgSchema.parse(workflowArgument)
        }

        const serializedWorkflowRunRequest: SerializedWorkflowRunRequest = {
            id: uuidv7(),
            workflow_name: this.name,
            args: workflowArgument,
            queue: typeof this.config.queue === 'string' ? this.config.queue : this.config.queue.name,
            timeout_seconds: this.config.timeoutSeconds || null,
            idempotency_key: this.config.idempotencyKey || null
        }

        const workflowRunId = await this.dispatcher.sendWorkflowRun({ serializedWorkflowRunRequest })

        // Serialize the workflow's DAG into an array of task requests.
        // const serializedTaskRequests: SerializedTaskRequest[] =
        //     this.serializeWorkflowToTaskRequests(workflowRunId);
        //
        // await this.dispatcher.enqueue(serializedTaskRequests)
    }

    /**
     * Recursively serializes the workflow DAG (from rootTasks) into an array
     * of SerializedTaskRequest objects.
     *
     * @param workflowId The workflow run ID to assign to every task.
     */
    private serializeWorkflowToTaskRequests(workflowId: string | null): SerializedTaskRequest[] {
        // Map each node to its serialized task request.
        const nodeToRequest = new Map<any, SerializedTaskRequest>();
        // For each node, record the set of parent IDs (dependencies).
        const dependencyMap = new Map<any, Set<string>>();

        // Traverse each root task in the workflow builder.
        for (const task of HyrexWorkflowBuilder.fromJson(this.workflowDagJson).rootTasks) {
            this.traverse(task, nodeToRequest, dependencyMap, workflowId);
        }

        // After traversal, update each task with its collected dependencies.
        for (const [node, request] of nodeToRequest.entries()) {
            const deps = dependencyMap.get(node);
            if (deps && deps.size > 0) {
                request.workflow_dependencies = Array.from(deps);
            } else {
                request.status = 'queued'
            }
        }

        // Return the list of serialized task requests.
        return Array.from(nodeToRequest.values());
    }

    /**
     * Recursively traverses the workflow DAG starting from the specified node and serializes each node into a task request.
     *
     * For each node, a unique UUID is generated which is used as the task's `id`, `durable_id`, and `root_id`.
     * The workflow run ID is assigned to each task request, and for every child node, the parent's ID is added as a dependency.
     *
     * @param node - The current workflow node to process.
     * @param nodeToRequest - A map tracking nodes that have already been serialized along with their corresponding task requests.
     * @param dependencyMap - A map recording dependency edges, mapping each node to a set of parent task IDs (dependencies).
     * @param workflowId - The workflow run ID to assign to every task request.
     */
    private traverse(
        node: any,
        nodeToRequest: Map<any, SerializedTaskRequest>,
        dependencyMap: Map<any, Set<string>>,
        workflowId: string | null
    ): void {
        // Create a new task request if the node hasn't been processed.
        if (!nodeToRequest.has(node)) {
            // Generate a single UUID for the task.
            const taskId = uuidv7();

            // All three IDs are set to the same UUID.
            const request: SerializedTaskRequest = {
                id: taskId,
                durable_id: taskId,
                root_id: taskId,
                workflow_run_id: workflowId,
                workflow_dependencies: null, // Will be populated after traversal.
                parent_id: null, // Remains null by default; adjust if a primary parent is needed.
                status: 'waiting',
                task_name: node.name,
                args: {}, // Replace with node-specific arguments if available.
                queue: typeof this.config.queue === 'string' ? this.config.queue : this.config.queue.name,
                max_retries: this.config.maxRetries,
                priority: this.config.priority,
                timeout_seconds: this.config.timeoutSeconds ?? null,
                idempotency_key: this.config.idempotencyKey ?? null,
            };

            nodeToRequest.set(node, request);
        }

        const currentRequest = nodeToRequest.get(node)!;

        // Process each child of the current node.
        for (const child of node.getChildren()) {
            // Record the dependency: the current task's id (a.k.a. durable_id) is a prerequisite for the child.
            if (!dependencyMap.has(child)) {
                dependencyMap.set(child, new Set());
            }
            dependencyMap.get(child)!.add(currentRequest.id);

            // Recursively traverse the child node.
            this.traverse(child, nodeToRequest, dependencyMap, workflowId);
        }
    }


}
