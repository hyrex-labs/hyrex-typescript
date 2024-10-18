import { HyrexDispatcher, SerializedTask } from "./HyrexDispatcher";
import { UUID } from "../utils";

type HyrexPostgresDispatcherConfig = {
    conn: string
}


export class PostgresDispatcher implements HyrexDispatcher {
    constructor(private config: HyrexPostgresDispatcherConfig) {

    }

    async enqueue(serializedTasks: SerializedTask[]): Promise<UUID[]> {
        return [""]
    }

    dequeue() {
        throw new Error("Not Implemented");
    }
}
