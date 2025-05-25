import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { envVariables } from "./EnvironmentVariables";
import { HyrexDispatcher } from "./dispatchers/HyrexDispatcher";
import { hyrexLogger } from "./logging/FrameworkLogger";

export class S3Logger {
    private dispatcher: HyrexDispatcher;
    private currentLogs: string[] = [];
    private originalStdout: typeof process.stdout.write | null = null;
    private originalStderr: typeof process.stderr.write | null = null;
    private s3Client: S3Client | null = null;
    private bucket: string | null = null;
    private taskId: string | null = null;

    constructor({ dispatcher }: { dispatcher: HyrexDispatcher }) {
        this.dispatcher = dispatcher

        const s3LogBucket = envVariables.getS3LogBucket()
        if (s3LogBucket) {
            this.bucket = s3LogBucket

        } else {
            this.handleMissingBucketError()
            return
        }

        try {
            this.s3Client = new S3Client({});
        } catch (err) {
            this.handleCredentialsError(err);
        }
    }

    private handleMissingBucketError() {
        this.s3Client = null;
    }

    private handleCredentialsError(err: any) {
        // console.error('AWS Credentials not found or invalid. Logs will only be written to console:', err);
        this.s3Client = null;
    }

    public startCapture(taskId: string) {
        if (!this.s3Client) {
            return
        }

        this.taskId = taskId;

        this.originalStdout = process.stdout.write.bind(process.stdout);
        this.originalStderr = process.stderr.write.bind(process.stderr);
        this.currentLogs = [];

        const newWrite = (
            chunk: any,
            encoding?: BufferEncoding,
            callback?: (error?: Error | null) => void
        ): boolean => {
            this.currentLogs.push(chunk.toString());
            return this.originalStdout!(chunk, encoding, callback);
        };

        process.stdout.write = newWrite as typeof process.stdout.write;
        process.stderr.write = newWrite as typeof process.stdout.write;
    }

    public async endCapture() {
        if (this.originalStdout && this.originalStderr) {
            // Restore original stdout/stderr
            process.stdout.write = this.originalStdout;
            process.stderr.write = this.originalStderr;
        }
    }

    public uploadLogsInBackground(): void {
        // Non-blocking upload with inline error handling
        this.uploadLogs().catch((error: any) => {
            // Handle S3 errors gracefully
            if (error.Code === 'AccessDenied' || error.name === 'AccessDenied') {
                hyrexLogger.error("remote-logging", `S3 Access Denied: Unable to upload logs for task ${this.taskId}. Please check S3 bucket permissions.`, 'yellow');
            } else if (error.$metadata?.httpStatusCode === 403) {
                hyrexLogger.error("remote-logging", `S3 Permission Error (403): Unable to upload logs for task ${this.taskId}. Please verify IAM permissions for bucket: ${this.bucket}`, 'yellow');
            } else {
                hyrexLogger.error("remote-logging", `Failed to upload logs to S3 for task ${this.taskId}: ${error.message || error}`, 'yellow');
            }
        });
    }

    public async uploadLogs() {
        if (!this.bucket || !this.s3Client) {
            return;
        }

        if (!this.taskId) {
            throw new Error('No taskId provided.');
        }

        const objectKey = `hyrex-logs/${this.taskId}.log`;
        const putObjectCommand: PutObjectCommand = new PutObjectCommand({
            Bucket: this.bucket,
            Key: objectKey,
            Body: this.currentLogs.join(''),
            ContentType: 'text/plain',
        })

        const sendToS3Promise = this.s3Client.send(putObjectCommand);

        // Construct the S3 link
        const logLink = `s3://${this.bucket}/${objectKey}`;
        const setLogLinkPromise = this.dispatcher.setLogLink({ taskId: this.taskId, logLink });

        await Promise.all([sendToS3Promise, setLogLinkPromise])
        hyrexLogger.info("remote-logging", `Logs successfully uploaded to S3. logLink=${logLink}`, 'dim');
    }
}
