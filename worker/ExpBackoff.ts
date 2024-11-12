import { sleep } from "../utils";

export class ExpBackoff {
    private counter: number
    private waitMsIncrements: number

    constructor() {
        this.counter = 1
        this.waitMsIncrements = 1_500 // 500
    }

    async wait() {
        const timeToWait = Math.min(15_000, this.waitMsIncrements * this.counter++)
        await sleep(timeToWait)
    }

    clear() {
        this.counter = 1
    }
}
