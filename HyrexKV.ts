import { HyrexDispatcher } from "./dispatchers/HyrexDispatcher";
import { getSharedDispatcher } from "./SharedDispatcher";

export class HyrexKV {
    private dispatcher: HyrexDispatcher;

    constructor() {
        this.dispatcher = getSharedDispatcher();
    }

    async get(key: string): Promise<string> {
        return this.dispatcher.kvGetValue(key);
    }

    async set(key: string, value: string): Promise<void> {
        // PostgreSQL text type can handle up to 1GB, but for practical purposes
        // we'll limit to 1MB to prevent performance issues
        const MAX_VALUE_SIZE = 1024 * 1024; // 1MB in bytes
        
        if (value.length > MAX_VALUE_SIZE) {
            throw new Error(`Value size exceeds maximum allowed size of ${MAX_VALUE_SIZE} bytes. Actual size: ${value.length} bytes`);
        }
        
        return this.dispatcher.kvSetValue(key, value);
    }
}
