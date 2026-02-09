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
        this.editCount = 0;
        this.activityStartTime = null;
        this.isAgentActive = false;
        this.quietTimer = null;
        this.ACTIVITY_THRESHOLD_MS = 4000; // 4 seconds of activity to trigger
        this.QUIET_THRESHOLD_MS = 2000; // 2 seconds of quiet to end
        this.EDITS_PER_SECOND = 3; // Minimum edits/second to count as "rapid"
        this.onAgentStartEmitter = new vscode.EventEmitter();
        this.onAgentEndEmitter = new vscode.EventEmitter();
        this.onAgentStart = this.onAgentStartEmitter.event;
        this.onAgentEnd = this.onAgentEndEmitter.event;
    }
    startMonitoring(context) {
        // Monitor document changes for rapid editing (agent activity)
        const docChangeListener = vscode.workspace.onDidChangeTextDocument((e) => {
            if (e.contentChanges.length === 0)
                return;
            this.editCount++;
            this.resetQuietTimer();
            // Start tracking activity if we see rapid edits
            if (!this.activityStartTime && this.editCount >= this.EDITS_PER_SECOND) {
                this.activityStartTime = Date.now();
                console.log('LeetClaude: Rapid editing detected, tracking...');
            }
            // Check if we've hit the threshold
            if (this.activityStartTime && !this.isAgentActive) {
                const elapsed = Date.now() - this.activityStartTime;
                if (elapsed >= this.ACTIVITY_THRESHOLD_MS) {
                    this.isAgentActive = true;
                    console.log('LeetClaude: Agent activity threshold reached');
                    this.onAgentStartEmitter.fire();
                }
            }
        });
        // Decay edit count over time
        const decayInterval = setInterval(() => {
            this.editCount = Math.max(0, this.editCount - 2);
            if (this.editCount === 0 && !this.isAgentActive) {
                this.activityStartTime = null;
            }
        }, 1000);
        this.disposables.push(docChangeListener);
        this.disposables.push({ dispose: () => clearInterval(decayInterval) });
    }
    resetQuietTimer() {
        if (this.quietTimer) {
            clearTimeout(this.quietTimer);
        }
        this.quietTimer = setTimeout(() => {
            if (this.isAgentActive) {
                console.log('LeetClaude: Quiet period detected, ending agent activity');
                this.isAgentActive = false;
                this.activityStartTime = null;
                this.editCount = 0;
                this.onAgentEndEmitter.fire();
            }
        }, this.QUIET_THRESHOLD_MS);
    }
    dispose() {
        if (this.quietTimer) {
            clearTimeout(this.quietTimer);
        }
        this.disposables.forEach(d => d.dispose());
        this.onAgentStartEmitter.dispose();
        this.onAgentEndEmitter.dispose();
    }
}
exports.AgentDetector = AgentDetector;
//# sourceMappingURL=agentDetector.js.map