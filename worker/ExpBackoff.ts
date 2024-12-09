import { sleep } from "../utils";

const OFFSET_LIMIT = 5

export class ExpBackoff {
    private offset: number // Allow wait to be called a few times before triggering the counter
    private counter: number
    private waitMsIncrements: number

    constructor() {
        this.counter = 1
        this.offset = 0
        this.waitMsIncrements = 1_500 // 500
    }

    async wait() {
        if (this.offset < OFFSET_LIMIT) {
            this.offset++
            return
        }

        const timeToWait = Math.min(15_000, this.waitMsIncrements * this.counter++)
        await sleep(timeToWait)
    }

    clear() {
        this.offset = 0
        this.counter = 1
    }
}
