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
