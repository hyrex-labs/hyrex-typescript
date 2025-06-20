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
        return this.dispatcher.kvSetValue(key, value);
    }
}
