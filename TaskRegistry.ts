import { Callable, InternalTaskRegistry } from "./utils";

export class TaskRegistry {
    public internalTaskRegistry: InternalTaskRegistry

    constructor() {
        this.internalTaskRegistry = {}
    }

    addFunction(key: string, value: Callable) {
        if (this.internalTaskRegistry[key]) {
            throw new Error(`Function with key "${key}" is already in the registry.`);
        }
        this.internalTaskRegistry[key] = value
    }

    getFunction(key: string): Callable {
        const func = this.internalTaskRegistry[key]
        if (!func) {
            throw new Error(`Function with key "${key}" is not in the registry.`);
        }
        return func
    }
}
