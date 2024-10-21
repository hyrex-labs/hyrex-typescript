import { Hyrex } from "./HyrexApp";
import { range } from "./utils";

const hyrex = new Hyrex({ appId: "My first app" })

// const submitFraudToPersona = ({ email }: { email: string }) => {
//     console.log(`Submitted fraud info to persona for ${email}`)
//     // Note it could take 48 hours for persona to get back
//     return true
// }

const submitFraudToPersona = ({email}: {email: string }) => {
    console.log(`Submitted fraud info to persona for ${email}`)
    // Note it could take 48 hours for persona to get back
    return true
}

const sendSubmitFraud = hyrex.task(submitFraudToPersona)

// for (const i of range(20)) {
//     sendSubmitFraud({email: "mark@markdawson.io"}, {retries: true})
// }

hyrex.runWorker()
