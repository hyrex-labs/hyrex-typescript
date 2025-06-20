import { HyrexDispatcher } from "./dispatchers/HyrexDispatcher";
import { PostgresDispatcher } from "./dispatchers/postgres/PostgresDispatcher";
import { PlatformDispatcher } from "./dispatchers/platform/PlatformDispatcher";
import { envVariables } from "./EnvironmentVariables";
import { hyrexLogger } from "./logging/FrameworkLogger";

let sharedDispatcher: HyrexDispatcher | null = null;

export function getSharedDispatcher(): HyrexDispatcher {
    if (!sharedDispatcher) {
        const databaseUrl = envVariables.getDatabaseUrl()
        const apiKey = envVariables.getApiKey()
        if (apiKey) {
            hyrexLogger.info("platform", `Created Shared PlatformDispatcher. pid=${process.pid}`, 'brown')
            sharedDispatcher = new PlatformDispatcher({ apiKey })
        } else if (databaseUrl) {
            hyrexLogger.info("postgres", `Created Shared PostgresDispatcher. pid=${process.pid}`, 'magenta')
            sharedDispatcher = new PostgresDispatcher({ conn: databaseUrl })
        } else {
            throw new Error("Both HYREX_DATABASE_URL and HYREX_API_KEY are missing.")
        }
    }
    return sharedDispatcher
}