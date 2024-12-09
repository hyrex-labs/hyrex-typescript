import { QueueType, QueueSchema, HyrexQueuePatternArgsType, HyrexQueuePatternArgsSchema } from "./utils";

export class HyrexQueue {
    public name: string;
    public concurrencyLimit: number | undefined = undefined;

    constructor(queueInput: QueueType) {
        QueueSchema.parse(queueInput)
        if (typeof queueInput === "string") {
            this.name = queueInput
        } else {
            this.name = queueInput.name

            if (queueInput.concurrencyLimit) {
                this.concurrencyLimit = queueInput.concurrencyLimit
            }
        }
    }

    equals(otherQueue: HyrexQueue): boolean {
        const concurrencyLimitIsUndefined = (this.concurrencyLimit === undefined || otherQueue.concurrencyLimit === undefined)
        return (
            this.name === otherQueue.name &&
            concurrencyLimitIsUndefined || this.concurrencyLimit === otherQueue.concurrencyLimit
        )
    }
}

export class HyrexQueuePattern {
    public pattern: string;
    public concurrencyLimit: number | undefined = undefined;

    constructor(args: HyrexQueuePatternArgsType) {
        const { pattern, concurrencyLimit } = HyrexQueuePatternArgsSchema.parse(args)
        this.pattern = pattern
        this.concurrencyLimit = concurrencyLimit
    }

    hasGlobPattern(): boolean {
        // Common glob special characters
        const GLOB_CHARS = new Set(['*', '?', '[', ']', '{', '}']);

        // Handle escaped characters
        let isEscaped = false;

        for (let i = 0; i < this.pattern.length; i++) {
            const char = this.pattern[i];

            if (char === '\\') {
                isEscaped = !isEscaped;
                continue;
            }

            if (!isEscaped && GLOB_CHARS.has(char)) {
                return true;
            }

            isEscaped = false;
        }

        return false;
    }

}
