import { HyrexTaskFunction, JsonType, range, sleep } from "../utils";
import { HyrexRegistry } from "../HyrexRegistry";
import 'dotenv/config';
import { TaskConfig } from "../dispatchers/HyrexDispatcher";

const initPersonaConnection = async ({}) => {
    console.log(`INIT PERSONA CONNECTION`)
}


export const hy = new HyrexRegistry()

const submitFraudToPersona = async ({ email }: { email: string }) => {
    console.log(`Submitted fraud info to persona for ${email}`)
    await sleep(2_000)
    // Note it could take 48 hours for persona to get back
    return {"result": true}
}

const restartDatabase = async () => {
    console.log(`Restart Database`)
    return {"status": "ok"}
}

const sayHello = async () => {
    console.log(`Hello!`)
}


const sendSubmitFraud = hy.task(submitFraudToPersona)
const sendRestartDatabase = hy.task(restartDatabase)
const sendSayHello = hy.task(sayHello)

sendRestartDatabase()
sayHello()

// TODO we should enforce the type on send
// sendSubmitFraud({name: "mark"}) // this is bad

type sendTaskArgs = [{ email: string }, TaskConfig]

const choices: sendTaskArgs[] = [
    [{ email: "mark@markdawson.io" }, { queue: "default" }],
    [{ email: "mark@example.com" }, { queue: "fast" }],
    [{ email: "mark@usekura.com" }, { queue: "low-priority" }],
    [{ email: "trevor@usekura.com" }, { queue: "trevor-queue" }],
];

(async () => {
    const sendSubmitFraud = hy.task(submitFraudToPersona)

    if (process.argv.includes('--submit')) {
        for (const i of range(2)) {
            console.log("Submitting tasks...");
            console.time("Submission time");

            for (const i of range(8)) {
                const randomElement: sendTaskArgs = choices[Math.floor(Math.random() * choices.length)];
                sendSubmitFraud(...randomElement)
            }
            console.timeEnd("Submission time");
            await sleep(3_000)
        }
    }
})()
