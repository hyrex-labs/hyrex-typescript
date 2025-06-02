import { HyrexDispatcher } from "./dispatchers/HyrexDispatcher";
import { hyrexLogger } from "./logging/FrameworkLogger";

export class S3Logger {
    private dispatcher: HyrexDispatcher;
    private currentLogs: string[] = [];
    private originalStdout: typeof process.stdout.write | null = null;
    private originalStderr: typeof process.stderr.write | null = null;
    private taskId: string | null = null;

    constructor({ dispatcher }: { dispatcher: HyrexDispatcher }) {
        this.dispatcher = dispatcher
    }

    public startCapture(taskId: string) {
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
            // Log error but don't throw - this is a background operation
            hyrexLogger.error("remote-logging", `Failed to upload logs for task ${this.taskId}: ${error.message || error}`, 'yellow');
        });
    }

    public async uploadLogs() {
        if (!this.taskId) {
            throw new Error('No taskId provided.');
        }

        try {
            await this.dispatcher.writeS3Logs(this.taskId, this.currentLogs);
            hyrexLogger.info("remote-logging", `Logs successfully uploaded for task ${this.taskId}`, 'dim');
        } catch (error) {
            // Re-throw the error to be handled by uploadLogsInBackground
            throw error;
        }
    }
}
