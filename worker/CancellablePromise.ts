function CancellableTask(signal: AbortSignal): Promise<string> {
    return new Promise((resolve, reject) => {
        if (signal.aborted) {
            return reject(new Error("Task was cancelled before starting"));
        }

        signal.addEventListener("abort", () => {
            reject(new Error("Task was cancelled"));
        });

        // Simulate a long-running task
        setTimeout(() => {
            if (!signal.aborted) {
                resolve("Task completed successfully");
            }
        }, 3000);
    });
}

const controller = new AbortController();
const { signal } = controller;

CancellableTask(signal)
    .then((result) => console.log(result))
    .catch((error) => console.error(error.message));

// Cancel the task after 1 second
setTimeout(() => controller.abort(), 1000);
