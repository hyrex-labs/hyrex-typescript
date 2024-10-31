import { range, sleep } from "../utils";
import { HyrexRegistry } from "../HyrexRegistry";
import 'dotenv/config';


export const hy = new HyrexRegistry()

const submitFraudToPersona = async ({ email }: { email: string }) => {
    console.log(`Submitted fraud info to persona for ${email}`)
    // await sleep(3_000)
    // Note it could take 48 hours for persona to get back
    return true
}

(async () => {
    const sendSubmitFraud= hy.task(submitFraudToPersona)

    if (process.argv.includes('--submit')) {
        console.log("Submitting tasks...");
        console.time("Submission time");
        for (const i of range(100)) {
            sendSubmitFraud({ email: "mark@markdawson.io" }, { retries: true })
        }
        console.timeEnd("Submission time");
    }
})()
