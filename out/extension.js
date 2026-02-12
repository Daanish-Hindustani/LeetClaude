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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const agentDetector_1 = require("./agentDetector");
const stateManager_1 = require("./stateManager");
const problemProvider_1 = require("./problemProvider");
const webviewProvider_1 = require("./webviewProvider");
const pythonRunner_1 = require("./pythonRunner");
const ipcServer_1 = require("./server/ipcServer");
let agentDetector;
let stateManager;
let problemProvider;
let webviewProvider;
let pythonRunner;
let ipcServer;
let currentProblemId;
function activate(context) {
    // Initialize components
    stateManager = new stateManager_1.StateManager();
    agentDetector = new agentDetector_1.AgentDetector();
    problemProvider = new problemProvider_1.ProblemProvider(context);
    webviewProvider = new webviewProvider_1.WebviewProvider(context.extensionUri);
    pythonRunner = new pythonRunner_1.PythonRunner();
    ipcServer = new ipcServer_1.IPCServer();
    // Start IPC Server
    ipcServer.start();
    // Handle IPC events
    ipcServer.onStatusChange((data) => {
        if (data.status === 'coding' || data.status === 'thinking') {
            stateManager.transition(stateManager_1.AppState.AgentActive);
        }
        else if (data.status === 'idle') {
            stateManager.transition(stateManager_1.AppState.Idle);
        }
    });
    // Handle state changes
    stateManager.onStateChange((newState) => {
        if (newState === stateManager_1.AppState.AgentActive) {
            showProblem();
            stateManager.transition(stateManager_1.AppState.ProblemShown);
        }
        else if (newState === stateManager_1.AppState.Idle) {
            webviewProvider.close();
        }
        else if (newState === stateManager_1.AppState.ProblemCompleted) {
            currentProblemId = undefined;
            problemProvider.markCompleted();
            // If the agent is still active, immediately show another problem
            if (agentDetector.isActive) {
                console.log('LeetClaude: Agent still active, loading next problem...');
                showProblem();
                stateManager.transition(stateManager_1.AppState.ProblemShown);
            }
            else {
                stateManager.transition(stateManager_1.AppState.Idle);
            }
        }
    });
    // Handle WebView events
    webviewProvider.onCodeChange((code) => {
        problemProvider.saveUserCode(code);
    });
    webviewProvider.onRunClick(async () => {
        if (!currentProblemId)
            return;
        const problem = problemProvider.getProblemById(currentProblemId);
        if (!problem)
            return;
        const code = await webviewProvider.getCurrentCode();
        const functionName = extractFunctionName(problem.starterCode);
        const results = await pythonRunner.runTests(code, functionName, problem.testCases);
        webviewProvider.showResults(results);
    });
    webviewProvider.onProblemCompleted(() => {
        stateManager.transition(stateManager_1.AppState.ProblemCompleted);
    });
    // Listen for agent activity
    agentDetector.onAgentStart(() => {
        stateManager.transition(stateManager_1.AppState.AgentActive);
    });
    agentDetector.onAgentEnd(() => {
        stateManager.transition(stateManager_1.AppState.Idle);
    });
    // Register manual trigger command (for testing)
    const showCommand = vscode.commands.registerCommand('leetclaude.showProblem', () => {
        stateManager.transition(stateManager_1.AppState.AgentActive);
    });
    // Register stop command
    const stopCommand = vscode.commands.registerCommand('leetclaude.stopProblem', () => {
        stateManager.transition(stateManager_1.AppState.Idle);
    });
    // Start monitoring
    agentDetector.startMonitoring(context);
    context.subscriptions.push(showCommand, stopCommand, agentDetector, webviewProvider, ipcServer);
}
function showProblem() {
    const active = problemProvider.getActiveProblem();
    if (active) {
        currentProblemId = active.problem.id;
        webviewProvider.show(active.problem, active.userCode);
    }
}
/**
 * Extract function name from Python starter code
 */
function extractFunctionName(starterCode) {
    const match = starterCode.match(/def\s+(\w+)\s*\(/);
    return match ? match[1] : 'solution';
}
function deactivate() {
}
//# sourceMappingURL=extension.js.map