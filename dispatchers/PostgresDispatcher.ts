import { HyrexDispatcher, SerializedTask } from "./HyrexDispatcher";
import { UUID } from "../utils";

type HyrexPostgresDispatcherConfig = {
    conn: string
}


export class PostgresDispatcher implements HyrexDispatcher {
    constructor(private config: HyrexPostgresDispatcherConfig) {

    }

    enqueue(serializedTask: SerializedTask): UUID {
        return ""
    }

    dequeue() {
        throw new Error("Not Implemented");
    }
}
