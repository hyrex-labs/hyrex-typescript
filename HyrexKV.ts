import { HyrexDispatcher } from "./dispatchers/HyrexDispatcher";
import { getSharedDispatcher } from "./SharedDispatcher";

export class HyrexKV {
    private static instance: HyrexKV | null = null;
    private dispatcher: HyrexDispatcher;

    private constructor() {
        this.dispatcher = getSharedDispatcher();
    }

    private static getInstance(): HyrexKV {
        if (!HyrexKV.instance) {
            HyrexKV.instance = new HyrexKV();
        }
        return HyrexKV.instance;
    }

    static async get(key: string): Promise<string> {
        const instance = HyrexKV.getInstance();
        return instance.dispatcher.kvGetValue(key);
    }

    static async set(key: string, value: string): Promise<void> {
        const instance = HyrexKV.getInstance();
        // PostgreSQL text type can handle up to 1GB, but for practical purposes
        // we'll limit to 1MB to prevent performance issues
        const MAX_VALUE_SIZE = 1024 * 1024; // 1MB in bytes
        
        if (value.length > MAX_VALUE_SIZE) {
            throw new Error(`Value size exceeds maximum allowed size of ${MAX_VALUE_SIZE} bytes. Actual size: ${value.length} bytes`);
        }
        
        return instance.dispatcher.kvSetValue(key, value);
    }
}
