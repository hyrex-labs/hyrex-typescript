import { randomUUID } from 'crypto';

interface WorkerContext {
    hostname: string;
    pid: number;
    user: string | undefined;
    pwd: string;
    nodeVersion: string | undefined;
    environment: string;
    region: string | undefined;
    zone: string | undefined;
    workerId: string;
}

/**
 * Generate a unique worker name using available environment information.
 * Guarantees uniqueness through UUID while maintaining readability.
 *
 * @param prefix - Prefix for the worker name
 * @returns A unique worker name combining available system information
 */
function generateWorkerName(prefix: string = 'hyrex'): string {
    const components: string[] = [];

    // Start with the prefix
    components.push(prefix);

    // Try to get pod name first (for Kubernetes environments)
    const podName = process.env.POD_NAME || process.env.HOSTNAME;
    if (podName) {
        components.push(podName);
    }

    // Add hostname if we haven't added pod_name
    if (!podName) {
        try {
            const os = require('os');
            const hostname = os.hostname();
            components.push(hostname);
        } catch {
            // Ignore hostname errors
        }
    }

    // Get cloud provider specific information
    const cloudInstanceId = (
        process.env.AWS_INSTANCE_ID ||
        process.env.GOOGLE_CLOUD_INSTANCE_ID ||
        process.env.AZURE_INSTANCE_ID
    );
    if (cloudInstanceId) {
        components.push(cloudInstanceId);
    }

    // Add process ID
    components.push(`p${process.pid}`);

    // Add unique identifier
    components.push(randomUUID().slice(0, 8));

    // Join all components with hyphens
    let workerName = components.filter(Boolean).join('-');

    // Ensure the name is valid for logging systems by replacing invalid chars
    workerName = workerName.replace(/[^a-zA-Z0-9\-_]/g, '-');

    return workerName;
}

/**
 * Get additional context about the worker's environment.
 * Useful for detailed logging and debugging.
 *
 * @returns Context information about the worker's environment
 */
function getWorkerContext(): WorkerContext {
    const os = require('os');
    const workerId = randomUUID();

    return {
        hostname: os.hostname(),
        pid: process.pid,
        user: process.env.USER,
        pwd: process.cwd(),
        nodeVersion: process.env.NODE_VERSION,
        environment: process.env.NODE_ENV || 'development',
        region: process.env.AWS_REGION || process.env.CLOUD_REGION,
        zone: process.env.CLOUD_ZONE,
        workerId
    };
}

export { generateWorkerName, getWorkerContext, WorkerContext };
