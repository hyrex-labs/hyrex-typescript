import { HyrexQueuePatternArgsType, HyrexTaskConfigInput, HyrexTaskFunction, JsonType, range, sleep } from "../utils";
import { HyrexRegistry } from "../HyrexRegistry";
import 'dotenv/config';
import { HyrexTaskConfig } from "../utils";
import { HyrexQueue, HyrexQueuePattern } from "../HyrexQueue";
import { v4 as uuidv4 } from 'uuid';

import { getHyrexContext } from "../index";


export const hy = new HyrexRegistry()


const restartDatabase = async () => {
    const ctx = getHyrexContext()
    console.log(`Restart Database with context ${JSON.stringify(ctx)}`)
    await sleep(1000)
}

const restartDatabaseTask = hy.task(restartDatabase, {
    queue: new HyrexQueue({
        name: "serial-queue",
    }),
    timeoutSeconds: 10
})

// const submitFraudToPersona = async ({ email }: { email: string }) => {
//     const ctx = getHyrexContext()
//     console.log(`Submitted fraud info to persona for ${email} with ctx: ${JSON.stringify(ctx)}`)
//     await sleep(3000)
//     // Note it could take 48 hours for persona to get back
//
//     // Generate random number between 1 and 20
//     const numTasks = Math.floor(Math.random() * 20) + 1
//
//     for (let i = 0; i < numTasks; i++) {
//         restartDatabaseTask.send()
//     }
//     return { "numTaskQueued": numTasks }
// }

const levelThreeFunc = async () => {
    const ctx = getHyrexContext()
    console.log(`Level Three Task ${JSON.stringify(ctx)}`)
    // await sleep(3000)
}

const levelThreeTask = hy.task(levelThreeFunc, {
        queue: "level-three-queue",
        timeoutSeconds: 10
    }
)

const levelTwoFunc = async () => {
    const ctx = getHyrexContext()
    console.log(`Level Two Task... ${JSON.stringify(ctx)}`)
    const numTasks = 5 // Math.floor(Math.random() * 3) + 1

    for (let i = 0; i < numTasks; i++) {
        levelThreeTask.send()
    }

    // const randomSleepAmount = (Math.floor(Math.random() * 9) + 1) * 1000
    // console.log(`randomSleepAmount: ${randomSleepAmount}`)
    // await sleep(randomSleepAmount)

    return { numTasks }
}


const levelTwoTask = hy.task(levelTwoFunc, {
        queue: "level-two-queue",
        timeoutSeconds: 10
    }
)

const rootLevelFunc = async () => {
    const ctx = getHyrexContext()
    console.log(`Executing root level task... ${JSON.stringify(ctx)}`)
    // Generate random number between 1 and 20
    // const numTasks = Math.floor(Math.random() * 3000) + 1
    const numTasks = 1000

    for (let i = 0; i < numTasks; i++) {
        levelTwoTask.send()
    }

    // const randomSleepAmount = (Math.floor(Math.random() * 9) + 1) * 1000
    // console.log(`randomSleepAmount: ${randomSleepAmount}`)
    // await sleep(randomSleepAmount)

    return { numTasks }
}

const rootLevelTask = hy.task(rootLevelFunc, {
        cron: "* * * * *"
    }
)

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
    // const submitFraudToPersonaTask = hy.task(submitFraudToPersona, { cron: "* * * * *" })

    if (process.argv.includes('--submit')) {
        for (const i of range(5)) {
            console.log("Submitting tasks...");
            console.time("Submission time");

            for (const i of range(1)) {
                const [args, _]: sendTaskArgs = choices[Math.floor(Math.random() * choices.length)];

                const userId = uuidv4();
                rootLevelTask.send()
                // submitFraudToPersonaTask.withConfig({
                //     // {idempotencyKey: "apple" }
                // }).send(args)
                // await restartDatabaseTask.send()
            }
            console.timeEnd("Submission time");
            await sleep(2_000)

            // // Options bag
            // submitFraudToPersonaTask.withConfig({
            //     scheduledStart: new Date("2025-01-01")
            // }).send(args)
            //
            // // Builder pattern
            // submitFraudToPersonaTask.scheduledStart(new Date("2025-01-01")).send(args)
        }
    }
})()
