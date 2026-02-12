import * as http from 'http';
import * as vscode from 'vscode';

export class IPCServer implements vscode.Disposable {
    private server: http.Server;
    private readonly PORT = 3456; // Fixed port for simplicity, or make configurable
    private _onStatusChange = new vscode.EventEmitter<{ status: string; message?: string }>();
    public readonly onStatusChange = this._onStatusChange.event;

    constructor() {
        this.server = http.createServer((req, res) => {
            if (req.method === 'POST' && req.url === '/status') {
                let body = '';
                req.on('data', chunk => {
                    body += chunk.toString();
                });
                req.on('end', () => {
                    try {
                        const data = JSON.parse(body);
                        this._onStatusChange.fire(data);
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ status: 'ok' }));
                    } catch (e) {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Invalid JSON' }));
                    }
                });
            } else {
                res.writeHead(404);
                res.end();
            }
        });
    }

    public start() {
        this.server.listen(this.PORT, '127.0.0.1', () => {
            console.log(`LeetClaude IPC Server listening on port ${this.PORT}`);
        });

        this.server.on('error', (err) => {
            console.error('LeetClaude IPC Server error:', err);
            vscode.window.showErrorMessage(`LeetClaude IPC Server error: ${err.message}`);
        });
    }

    public dispose() {
        this.server.close();
        this._onStatusChange.dispose();
    }
}
