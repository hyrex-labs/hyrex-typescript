import { HyrexRegistry } from "../HyrexRegistry";
import { getHyrexContext } from "../HyrexContext";

export const systemTaskRegistry = new HyrexRegistry()

const waitTask = systemTaskRegistry.task({
    name: "SystemTaskWait",
    func: (seconds: number) => {
        const context = getHyrexContext()
    }
})
