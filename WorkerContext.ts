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
 * @returns A unique worker name combining available system information
 */
function generateWorkerName(): string {
    const components: string[] = [];

    // Check for HYREX_PLATFORM environment variable
    if (process.env.HYREX_PLATFORM === '1') {
        components.push('hyrex-platform');

        // Add unique identifier
        components.push(randomUUID().slice(0, 8));
        // Join all components with hyphens
        let workerName = components.filter(Boolean).join('-');
        // Ensure the name is valid for logging systems by replacing invalid chars
        workerName = workerName.replace(/[^a-zA-Z0-9\-_]/g, '-');
        return workerName;
    }

    // Detect cloud provider and add identifier
    let cloudProvider: string | undefined;
    let instanceId: string | undefined;

    // AWS Detection
    if (process.env.AWS_EXECUTION_ENV || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.AWS_REGION || process.env.ECS_CONTAINER_METADATA_URI_V4) {
        cloudProvider = 'aws';
        // Try to get EC2 instance ID from metadata service or environment
        instanceId = process.env.EC2_INSTANCE_ID;
        // For ECS/Fargate, use task ARN
        if (process.env.ECS_CONTAINER_METADATA_URI_V4) {
            const taskArn = process.env.ECS_TASK_ARN;
            if (taskArn) {
                // Extract task ID from ARN (last part after /)
                const taskId = taskArn.split('/').pop();
                if (taskId) {
                    instanceId = `ecs-${taskId.slice(0, 8)}`;
                }
            }
        }
        // For Lambda
        if (process.env.AWS_LAMBDA_FUNCTION_NAME) {
            instanceId = `lambda-${process.env.AWS_LAMBDA_FUNCTION_NAME}`;
        }
    }
    // GCP Detection
    else if (process.env.GCP_PROJECT || process.env.GOOGLE_CLOUD_PROJECT || process.env.GAE_SERVICE || process.env.K_SERVICE || process.env.FUNCTION_NAME) {
        cloudProvider = 'gcp';
        // For GKE/Compute Engine
        instanceId = process.env.GCE_INSTANCE_NAME || process.env.GAE_INSTANCE;
        // For Cloud Run
        if (process.env.K_SERVICE && process.env.K_REVISION) {
            instanceId = `run-${process.env.K_REVISION.slice(0, 8)}`;
        }
        // For Cloud Functions
        if (process.env.FUNCTION_NAME) {
            instanceId = `func-${process.env.FUNCTION_NAME}`;
        }
    }
    // Azure Detection
    else if (process.env.WEBSITE_INSTANCE_ID || process.env.WEBSITE_SITE_NAME || process.env.AZURE_FUNCTIONS_ENVIRONMENT || process.env.WEBSITE_HOSTNAME) {
        cloudProvider = 'azure';
        // For App Service/Functions
        instanceId = process.env.WEBSITE_INSTANCE_ID?.slice(0, 8);
        // For Container Instances
        if (process.env.CONTAINER_APP_NAME) {
            instanceId = `aci-${process.env.CONTAINER_APP_REPLICA_NAME || process.env.HOSTNAME}`;
        }
        // For Azure Functions
        if (process.env.AZURE_FUNCTIONS_ENVIRONMENT) {
            instanceId = `func-${process.env.WEBSITE_SITE_NAME}`;
        }
    }

    // Add cloud provider if detected
    if (cloudProvider) {
        components.push(cloudProvider);
    }

    // Add instance ID if available
    if (instanceId) {
        components.push(instanceId);
    }

    // Try to get pod name for Kubernetes environments
    const podName = process.env.POD_NAME || process.env.HOSTNAME;
    if (podName && !instanceId) {
        components.push(podName);
    }

    // Add hostname if we haven't added pod_name or instance ID
    if (!podName && !instanceId) {
        try {
            const os = require('os');
            const hostname = os.hostname();
            components.push(hostname);
        } catch {
            // Ignore hostname errors
        }
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
