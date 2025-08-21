import { createServer, IncomingMessage, ServerResponse } from 'http';
import { Server } from 'net';

const RESPONSE_HEADERS = {
    'Content-Type': 'text/plain',
    'Cache-Control': 'no-cache'
};

const OK_RESPONSE = 'OK\n';
const OK_BUFFER = Buffer.from(OK_RESPONSE);

export function createHealthServer(
    port: number,
    getStats?: () => { executors: number; tasks: number; }
): Server {
    const server = createServer((req: IncomingMessage, res: ServerResponse) => {
        if (req.method !== 'GET') {
            res.writeHead(405, RESPONSE_HEADERS);
            res.end('Method Not Allowed\n');
            return;
        }

        const url = req.url;
        
        if (url === '/' || url === '/healthz' || url === '/health') {
            res.writeHead(200, RESPONSE_HEADERS);
            
            if (getStats) {
                const stats = getStats();
                res.end(`OK\nExecutors: ${stats.executors}\nTasks: ${stats.tasks}\n`);
            } else {
                res.end(OK_BUFFER);
            }
            return;
        }

        res.writeHead(404, RESPONSE_HEADERS);
        res.end('Not Found\n');
    });

    server.listen(port);
    
    server.on('error', (err: Error) => {
        if ((err as any).code === 'EADDRINUSE') {
            console.error(`Health check server port ${port} is already in use`);
        } else {
            console.error('Health check server error:', err);
        }
    });

    return server;
}