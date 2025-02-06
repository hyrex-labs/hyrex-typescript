// Base class providing DAG functionality.
class DagNode {
    public name: string;
    protected children: DagNode[] = [];
    protected parents: DagNode[] = [];

    constructor(name: string) {
        this.name = name;
    }

    public getChildren(): DagNode[] {
        return this.children;
    }

    protected addChild(node: DagNode): void {
        // Prevent self-cycle.
        if (node === this) {
            throw new Error("Cannot add node as a child of itself (self-cycle).");
        }

        // Prevent duplicate relationship.
        if (this.children.includes(node)) {
            return;
        }

        // Check for cycle.
        if (node.wouldCreateCycle(this)) {
            throw new Error("Adding the child would create a cycle in the graph.");
        }

        this.children.push(node);
        if (!node.parents.includes(this)) {
            node.parents.push(this);
        }
    }

    private wouldCreateCycle(candidate: DagNode): boolean {
        return candidate.hasAsAncestor(this, new Set());
    }

    private hasAsAncestor(target: DagNode, visited: Set<DagNode>): boolean {
        for (const parent of this.parents) {
            if (parent === target) {
                return true;
            }
            if (!visited.has(parent)) {
                visited.add(parent);
                if (parent.hasAsAncestor(target, visited)) {
                    return true;
                }
            }
        }
        return false;
    }

    // (Optional) Validate the entire DAG.
    public validateDAG(): void {
        if (this.detectCycle(new Set(), new Set())) {
            throw new Error("Graph validation failed - cycle detected.");
        }
    }

    private detectCycle(visited: Set<DagNode>, recursionStack: Set<DagNode>): boolean {
        visited.add(this);
        recursionStack.add(this);

        for (const child of this.children) {
            if (!visited.has(child)) {
                if (child.detectCycle(visited, recursionStack)) {
                    return true;
                }
            } else if (recursionStack.has(child)) {
                return true;
            }
        }

        recursionStack.delete(this);
        return false;
    }
}

// Define the interface for workflow tasks.
export interface IWorkflowTask {
    /**
     * Chains one or more tasks after this task.
     * The input may be a single task or an array of tasks.
     * Returns an IWorkflowTask representing the resulting task(s)
     * so that chaining may continue.
     */
    next(nextTask: IWorkflowTask | IWorkflowTask[]): IWorkflowTask;
}

/**
 * A helper to “normalize” an IWorkflowTask input into an array of WorkflowTask nodes.
 * If the input is a WorkflowTaskGroup, we extract its underlying tasks.
 */
export function flattenTasks(input: IWorkflowTask | IWorkflowTask[]): WorkflowTask[] {
    const result: WorkflowTask[] = [];

    const add = (item: IWorkflowTask) => {
        if (item instanceof WorkflowTaskGroup) {
            result.push(...item.getTasks());
        } else if (item instanceof WorkflowTask) {
            result.push(item);
        } else {
            throw new Error("Invalid task type passed in.");
        }
    };

    if (Array.isArray(input)) {
        for (const item of input) {
            add(item);
        }
    } else {
        add(input);
    }

    return result;
}

/**
 * A single workflow task. Each instance is a DAG node.
 */
export class WorkflowTask extends DagNode implements IWorkflowTask {
    constructor(name: string) {
        super(name)
    }

    public next(nextInput: IWorkflowTask | IWorkflowTask[]): IWorkflowTask {
        // Normalize the input so that we always work with an array of WorkflowTask.
        const nextTasks = flattenTasks(nextInput);

        // For each underlying task, add an edge from this node.
        for (const child of nextTasks) {
            this.addChild(child);
        }

        // Return a group wrapping these tasks so that chaining continues.
        return new WorkflowTaskGroup(nextTasks);
    }

    public wait({ hours, minutes, seconds }: {
        days: number,
        hours: number,
        minutes: number,
        seconds: number
    }): IWorkflowTask {
        return this
    }
}

/**
 * A group of tasks. This class does not extend DAGNode; it’s merely a wrapper
 * that holds several WorkflowTask nodes. When chaining, it forwards the call to
 * all its underlying tasks.
 */
export class WorkflowTaskGroup implements IWorkflowTask {
    private tasks: WorkflowTask[];

    constructor(tasks: WorkflowTask[]) {
        this.tasks = tasks;
    }

    // Allow external code (like flattenTasks) to extract the underlying tasks.
    public getTasks(): WorkflowTask[] {
        return this.tasks;
    }

    public next(nextInput: IWorkflowTask | IWorkflowTask[]): IWorkflowTask {
        // For each underlying task, call its next() method.
        const aggregatedNextTasks: WorkflowTask[] = [];

        for (const task of this.tasks) {
            // Each task.next() returns an IWorkflowTask (which might be a group).
            const result = task.next(nextInput);
            // Flatten the result into WorkflowTask nodes.
            aggregatedNextTasks.push(...flattenTasks(result));
        }

        // Return a new group wrapping all the resulting next tasks.
        return new WorkflowTaskGroup(aggregatedNextTasks);
    }
}

export class HyrexWorkflowBuilder {
    public rootTasks: IWorkflowTask[]

    constructor() {
        this.rootTasks = []
    }

    start(tasks: IWorkflowTask | IWorkflowTask[]): IWorkflowTask {
        const normalized = flattenTasks(tasks);
        this.rootTasks.push(...normalized);
        return new WorkflowTaskGroup(normalized);
    }

    /**
     * Returns a JSON string representing the workflow DAG.
     * The JSON has the format:
     * {
     *   "nodes": [
     *     { "id": "A", "name": "TaskName1" },
     *     { "id": "B", "name": "TaskName2" },
     *     ...
     *   ],
     *   "edges": [
     *     { "from": "A", "to": "B" },
     *     { "from": "A", "to": "C" },
     *     ...
     *   ]
     * }
     */
    toJson(): string {
        // These will hold our final results.
        const nodes: { id: string; name: string }[] = [];
        const edges: { from: string; to: string }[] = [];

        // Map each visited node to a unique label.
        const nodeIds = new Map<DagNode, string>();
        let counter = 0;

        // Convert 0 -> "A", 1 -> "B", 2 -> "C", etc.
        function numberToLetter(n: number): string {
            let result = "";
            n++; // so that 0 becomes 1 etc.
            while (n > 0) {
                const remainder = (n - 1) % 26;
                result = String.fromCharCode(65 + remainder) + result;
                n = Math.floor((n - 1) / 26);
            }
            return result;
        }

        // We'll use this to avoid processing the same node twice.
        const visited = new Set<DagNode>();

        // The recursive DFS function.
        function traverse(node: DagNode): void {
            // If this node has not yet been assigned a label, do so.
            if (!nodeIds.has(node)) {
                const label = numberToLetter(counter++);
                nodeIds.set(node, label);
                nodes.push({ id: label, name: node.name });
            }
            // Access the children via the public getter.
            const children: DagNode[] = node.getChildren();
            for (const child of children) {
                // Label the child if it hasn’t been already.
                if (!nodeIds.has(child)) {
                    const label = numberToLetter(counter++);
                    nodeIds.set(child, label);
                    nodes.push({ id: label, name: child.name });
                }
                // Record the edge from the current node to the child.
                edges.push({
                    from: nodeIds.get(node)!,
                    to: nodeIds.get(child)!,
                });
                // Recurse if we haven’t seen this child before.
                if (!visited.has(child)) {
                    visited.add(child);
                    traverse(child);
                }
            }
        }

        // Start traversal from every root task.
        // The tasks stored in rootTasks are actually WorkflowTask instances,
        // which extend DAGNode.
        for (const task of this.rootTasks) {
            // Cast the IWorkflowTask to DAGNode.
            const node = task as unknown as DagNode;
            if (!visited.has(node)) {
                visited.add(node);
                traverse(node);
            }
        }

        // Return the final JSON string.
        return JSON.stringify({ nodes, edges }, null, 2);
    }
}
