import { HyrexQueuePatternArgsType, HyrexTaskConfigInput, HyrexTaskFunction, JsonType, range, sleep } from "../utils";
import { HyrexRegistry } from "../HyrexRegistry";
import 'dotenv/config';
import { HyrexTaskConfig } from "../utils";
import { HyrexQueuePattern } from "../HyrexQueue";
import { v4 as uuidv4 } from 'uuid';


const initPersonaConnection = async ({}) => {
    console.log(`INIT PERSONA CONNECTION`)
}


export const hy = new HyrexRegistry()

const userQueuePattern: HyrexQueuePatternArgsType = {
    pattern: "userId/*",
    concurrencyLimit: 8,
    // for: (email: string) => {
    //     return `userId/${email}`
    // }
}

const submitOrderQueuePattern = new HyrexQueuePattern({
    pattern: "*submitOrder/*",
    concurrencyLimit: 2,
})

// submitOrder/userId/0000-0000-0000

//
// hy.addQueuePattern(queuePattern)

const submitFraudToPersona = async ({ email }: { email: string }) => {
    console.log(`Submitted fraud info to persona for ${email}`)
    await sleep(2_000)
    // Note it could take 48 hours for persona to get back
    return { "result": true }
}

const restartDatabase = async () => {
    console.log(`Restart Database`)
    return { "status": "ok" }
}

const sayHello = async () => {
    console.log(`Hello!`)
}


// const submitFraudToPersonaTask = hy.task(submitFraudToPersona)
// const restartDatabaseTask = hy.task(restartDatabase)
const sayHelloTask = hy.task(sayHello)

// submitFraudToPersonaTask.withConfig({
//         queue: "low-priority",
//         maxRetries: 3
//     }).send({ email: "mark" });
//
// sayHello()

// TODO we should enforce the type on send
// sendSubmitFraud({name: "mark"}) // this is bad

type sendTaskArgs = [{ email: string }, HyrexTaskConfigInput]

const choices: sendTaskArgs[] = [
    [{ email: "mark@markdawson.io" }, { queue: "default" }],
    [{ email: "mark@example.com" }, { queue: "fast" }],
    [{ email: "mark@usekura.com" }, { queue: "low-priority" }],
    [{ email: "trevor@usekura.com" }, { queue: "trevor-queue" }],
];

(async () => {
    const submitFraudToPersonaTask = hy.task(submitFraudToPersona)
    const restartDatabaseTask = hy.task(restartDatabase)

    if (process.argv.includes('--submit')) {
        for (const i of range(2)) {
            console.log("Submitting tasks...");
            console.time("Submission time");

            for (const i of range(8)) {
                const [args, _]: sendTaskArgs = choices[Math.floor(Math.random() * choices.length)];

                const userId = uuidv4()
                const taskConfig: HyrexTaskConfigInput = {
                    queuePattern: {
                        pattern: `userId/${userId}`
                    }
                }
                submitFraudToPersonaTask.withConfig(taskConfig).send(args)
                restartDatabaseTask.send()
            }
            console.timeEnd("Submission time");
            await sleep(3_000)
        }
    }
})()
