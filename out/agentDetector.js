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
exports.AgentDetector = void 0;
const vscode = __importStar(require("vscode"));
class AgentDetector {
    constructor() {
        this.disposables = [];
        this.isAgentActive = false;
        this.onAgentStartEmitter = new vscode.EventEmitter();
        this.onAgentEndEmitter = new vscode.EventEmitter();
        this.onAgentStart = this.onAgentStartEmitter.event;
        this.onAgentEnd = this.onAgentEndEmitter.event;
    }
    get isActive() {
        return this.isAgentActive;
    }
    handleStatusChange(status) {
        const wasActive = this.isAgentActive;
        // Consider both 'coding' and 'thinking' as active states
        const isActive = status === 'coding' || status === 'thinking';
        if (isActive) {
            this.isAgentActive = true;
            // Always fire start event to ensure UI is shown/refreshed
            this.onAgentStartEmitter.fire();
        }
        else if (!isActive && wasActive) {
            this.isAgentActive = false;
            this.onAgentEndEmitter.fire();
        }
    }
    dispose() {
        this.disposables.forEach(d => d.dispose());
        this.onAgentStartEmitter.dispose();
        this.onAgentEndEmitter.dispose();
    }
}
exports.AgentDetector = AgentDetector;
//# sourceMappingURL=agentDetector.js.map