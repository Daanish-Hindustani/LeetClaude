"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.IPCServer = void 0;
const http = __importStar(require("http"));
const vscode = __importStar(require("vscode"));
class IPCServer {
    constructor() {
        this.PORT = 3456; // Fixed port for simplicity, or make configurable
        this._onStatusChange = new vscode.EventEmitter();
        this.onStatusChange = this._onStatusChange.event;
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
                    }
                    catch (e) {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Invalid JSON' }));
                    }
                });
            }
            else {
                res.writeHead(404);
                res.end();
            }
        });
    }
    start() {
        this.server.listen(this.PORT, '127.0.0.1', () => {
            console.log(`LeetClaude IPC Server listening on port ${this.PORT}`);
        });
        this.server.on('error', (err) => {
            console.error('LeetClaude IPC Server error:', err);
            vscode.window.showErrorMessage(`LeetClaude IPC Server error: ${err.message}`);
        });
    }
    dispose() {
        this.server.close();
        this._onStatusChange.dispose();
    }
}
exports.IPCServer = IPCServer;
//# sourceMappingURL=ipcServer.js.map