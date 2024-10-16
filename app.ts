import { Hyrex } from "./index";

const hyrex = new Hyrex({appId: "My first app"})

const submitFraudToPersona = (email: string) => {
    console.log(`Submitted fraud info to persona for ${email}`)
    // Note it could take 48 hours for persona to get back
    return true
}

const sendSubmitFraud = hyrex.task(submitFraudToPersona)

sendSubmitFraud("mark@markdawson.io")
