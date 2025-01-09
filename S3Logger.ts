import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { envVariables } from "./EnvironmentVariables";

export class S3Logger {
    private currentLogs: string[] = [];
    private originalStdout: typeof process.stdout.write | null = null;
    private originalStderr: typeof process.stderr.write | null = null;
    private s3Client: S3Client | null = null;
    private bucket: string | null = null;
    private taskId: string | null = null;

    constructor() {
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

    public async uploadLogs() {
        if ( !this.bucket || !this.s3Client) {
            return;
        }

        await this.s3Client.send(new PutObjectCommand({
            Bucket: this.bucket,
            Key: `hyrex-logs/${this.taskId}.log`,
            Body: this.currentLogs.join(''),
            ContentType: 'text/plain',
        }));
    }
}
