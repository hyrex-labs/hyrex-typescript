import { hyrexLogger } from "./logging/FrameworkLogger";

class EnvVariables {
    getDatabaseUrl() {
        return process.env.HYREX_DATABASE_URL
    }

    getS3LogBucket() {
        return process.env.HYREX_S3_LOG_BUCKET_NAME
    }

    getApiKey() {
        return process.env.HYREX_API_KEY
    }
}

export const envVariables = new EnvVariables()

if (envVariables.getDatabaseUrl()) {
    hyrexLogger.info("init", "Found HYREX_DATABASE_URL.", "blue")
}

if (envVariables.getApiKey()) {
    hyrexLogger.info("init", "Found HYREX_API_KEY.", "blue")
}

if (envVariables.getS3LogBucket()) {
    hyrexLogger.info("init", "Found HYREX_S3_LOG_BUCKET_NAME.", "blue")
}
