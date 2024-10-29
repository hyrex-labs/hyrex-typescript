import { Hyrex } from "./HyrexApp";
import { range, sleep } from "./utils";

const hyrex = new Hyrex({ appId: "My first app" })



const submitFraudToPersona = async ({email}: {email: string }) => {
    console.log(`Submitted fraud info to persona for ${email}`)
    await sleep(1000)
    // Note it could take 48 hours for persona to get back
    return true
}

const sendSubmitFraud = hyrex.task(submitFraudToPersona)

if (process.argv.includes('--submit')) {
    console.log("Submitting tasks...");
    for (const i of range(200)) {
        sendSubmitFraud({email: "mark@markdawson.io"}, {retries: true})
    }
}

if (process.argv.includes('--worker')) {
    console.log("Running worker...");
    hyrex.runWorker();
} else {
    console.log("Worker flag not provided. Skipping hyrex.runWorker().");
}

