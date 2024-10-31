import { JsonSerializable, JsonSerializableObject, UUID } from "./utils";
import { HyrexDispatcher, SerializedTaskRequest, TaskConfig } from "./dispatchers/HyrexDispatcher";
import { randomUUID } from "node:crypto";

export class TaskWrapper<U extends JsonSerializableObject> {
    constructor(private dispatcher: HyrexDispatcher, private taskFunction: (arg: U) => any) {
    }

    async call(context: U, config: TaskConfig = {}): Promise<UUID> {

        JsonSerializable.parse(context)

        const serializedTaskRequest: SerializedTaskRequest = {
            id: randomUUID(),
            queue: "default",
            task_name: this.taskFunction.name,
            args: context,
            max_retries: 3,
            priority: 3
        }

        return (await this.dispatcher.enqueue([serializedTaskRequest]))[0]
    }
}
