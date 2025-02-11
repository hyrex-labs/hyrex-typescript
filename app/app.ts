import { HyrexQueuePatternArgsType, HyrexTaskConfigInput, HyrexTaskFunction, JsonType, range, sleep } from "../utils";
import { HyrexRegistry } from "../HyrexRegistry";
import 'dotenv/config';
import { HyrexTaskConfig } from "../utils";
import { v4 as uuidv4 } from 'uuid';

import { getHyrexContext } from "../index";
import { HyrexWorkflowBuilder } from "../workflow/HyrexWorkflowBuilder";
import { z } from "zod";


export const hy = new HyrexRegistry()

////////////////////////
//// BUILD WORKFLOW ////
////////////////////////

const sleepTaskFunc = async () => {
    const ctx = getHyrexContext()
    await sleep(5_000)
    console.log(`My id is ${ctx.taskId}`)
    if (ctx.attemptNumber === 0 || true) {
        throw new Error("We fail on first attempt.")
    }


    // await sleep(5_000);
}

const initiateOnboard = hy.task({
    name: "initiateOnboard",
    func: sleepTaskFunc
})

const validatePayment = hy.task({
    name: "validatePayment",
    func: sleepTaskFunc
})

const validateIdentity = hy.task({
    name: "validateIdentity",
    func: sleepTaskFunc
})

const validateOrg = hy.task({
    name: "validateOrg",
    func: sleepTaskFunc
})

const approveUser = hy.task({
    name: "approveUser",
    func: sleepTaskFunc
})

const checkCreditFunc = () => {}

const checkCredit = hy.task({
    name: "checkCredit",
    func: sleepTaskFunc
})

const checkCredit2 = hy.task({
    name: "checkCredit2",
    func: checkCreditFunc
})

const trainCreditMachineLearningModel = hy.task({
    name: "trainCreditMachineLearningModel",
    func: sleepTaskFunc
})

function OnboardUserBody(workflowBuilder: HyrexWorkflowBuilder) {
    workflowBuilder
        .start(initiateOnboard)
        .next([validatePayment, validateIdentity, validateOrg])
        .next(approveUser)

    validateIdentity.next(checkCredit).next(trainCreditMachineLearningModel)

    // withGroup([validatePayment, validateIdentity, validateOrg]).next(checkCredit)

    // validatePayment.next(checkCredit.createStep("CheckCreditAfterPayment"))
    // validateIdentity.next(checkCredit.createStep("CheckCreditAfterIdentityValidation"))
    // validateOrg.next(checkCredit.createStep("CheckCreditAfterOrgValidation"))


    return workflowBuilder
}


const onboardUser = hy.workflow({
    name: "onboardUser",
    config: { queue: "onboard-user" },
    workflowArgSchema: z.object({
        "userEmail": z.string(),
        "signUpTier": z.enum(["FREE", "PRO", "ENTERPRISE"])
    }),
    body: (workflowBuilder: HyrexWorkflowBuilder) => {
        workflowBuilder
            .start(initiateOnboard)
            .next([validatePayment, validateIdentity, validateOrg])
            .next(approveUser)

        validateIdentity
            .next(checkCredit)
            .next(trainCreditMachineLearningModel)



        return workflowBuilder
    }
})

// onboardUser.send({ "userEmail": "mark@hyrex.io", "signUpTier": "PRO" })

// onboardUser.send({ "userEmail": "mark@hyrex.io", "signUpTier": "PRO" })

if (process.argv.includes('--submit')) {
    onboardUser.send({ "userEmail": "mark@hyrex.io", "signUpTier": "PRO" })
    console.log("submitted onboard user!")
}

////////////////////////
// END BUILD WORKFLOW //
////////////////////////

hy.listener({
    name: "BlockchainListener",
    func: async () => {
        while (true) {
            console.log("Listening to stuff")
            await sleep(10_000)
        }
    }
})

const levelThreeTask = hy.task({
        name: "levelThreeFunc",
        config: {
            queue: "level-three-queue",
            timeoutSeconds: 10,
        },
        func: async () => {
            const ctx = getHyrexContext()
            console.log(`Level Three Task ${JSON.stringify(ctx)}`)
            await sleep(100)
        },
    }
)


const levelTwoTask = hy.task({
        name: "levelTwoFunc",
        config: {
            queue: "level-two-queue",
            timeoutSeconds: 10
        },
        func: async () => {
            const ctx = getHyrexContext()
            console.log(`Level Two Task... ${JSON.stringify(ctx)}`)
            const numTasks = 2  // Math.floor(Math.random() * 3) + 1
            await sleep(100)
            for (let i = 0; i < numTasks; i++) {
                levelThreeTask.send()
            }

            // const randomSleepAmount = (Math.floor(Math.random() * 9) + 1) * 1000
            // console.log(`randomSleepAmount: ${randomSleepAmount}`)
            // await sleep(randomSleepAmount)

            return { numTasks }
        }
    }
)

const rootLevelTask = hy.task({
        name: "rootLevelFunc",
        config: {
            // cron: "* * * * *"
        },
        func: async () => {
            const ctx = getHyrexContext()
            console.log(`Executing root level task... ${JSON.stringify(ctx)}`)
            // Generate random number between 1 and 20
            // const numTasks = Math.floor(Math.random() * 3000) + 1
            const numTasks = 10
            await sleep(100)

            for (let i = 0; i < numTasks; i++) {
                levelTwoTask.send()
            }

            // const randomSleepAmount = (Math.floor(Math.random() * 9) + 1) * 1000
            // console.log(`randomSleepAmount: ${randomSleepAmount}`)
            // await sleep(randomSleepAmount)

            return { numTasks }
        }
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

// (async () => {
//     // const submitFraudToPersonaTask = hy.task(submitFraudToPersona, { cron: "* * * * *" })
//
//     if (process.argv.includes('--submit')) {
//         for (const i of range(5)) {
//             console.log("Submitting tasks...");
//             console.time("Submission time");
//
//             for (const i of range(1)) {
//                 const [args, _]: sendTaskArgs = choices[Math.floor(Math.random() * choices.length)];
//
//                 const userId = uuidv4();
//                 rootLevelTask.send()
//                 // submitFraudToPersonaTask.withConfig({
//                 //     // {idempotencyKey: "apple" }
//                 // }).send(args)
//                 // await restartDatabaseTask.send()
//             }
//             console.timeEnd("Submission time");
//             await sleep(2_000)
//
//             // // Options bag
//             // submitFraudToPersonaTask.withConfig({
//             //     scheduledStart: new Date("2025-01-01")
//             // }).send(args)
//             //
//             // // Builder pattern
//             // submitFraudToPersonaTask.scheduledStart(new Date("2025-01-01")).send(args)
//         }
//     }
// })()
