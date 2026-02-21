import * as vscode from 'vscode';
import { AgentDetector } from './agentDetector';
import { StateManager, AppState } from './stateManager';
import { ProblemProvider } from './problemProvider';
import { WebviewProvider } from './webviewProvider';
import { PythonRunner } from './pythonRunner';
import { IPCServer } from './server/ipcServer';

let agentDetector: AgentDetector;
let stateManager: StateManager;
let problemProvider: ProblemProvider;
let webviewProvider: WebviewProvider;
let pythonRunner: PythonRunner;
let ipcServer: IPCServer;
let currentProblemId: string | undefined;

export function activate(context: vscode.ExtensionContext) {


    // Initialize components
    stateManager = new StateManager();
    agentDetector = new AgentDetector();
    problemProvider = new ProblemProvider(context);
    webviewProvider = new WebviewProvider(context.extensionUri);
    pythonRunner = new PythonRunner();
    ipcServer = new IPCServer();

    // Start IPC Server
    ipcServer.start();

    // Handle IPC events
    ipcServer.onStatusChange((data) => {
        agentDetector.handleStatusChange(data.status);
    });

    // Handle state changes
    stateManager.onStateChange((newState: AppState) => {
        if (newState === AppState.AgentActive) {
            showProblem();
            stateManager.transition(AppState.ProblemShown);
        } else if (newState === AppState.Idle) {
            webviewProvider.close();
        } else if (newState === AppState.ProblemCompleted) {
            currentProblemId = undefined;
            problemProvider.markCompleted();

            // If the agent is still active, immediately show another problem
            if (agentDetector.isActive) {
                console.log('LeetClaude: Agent still active, loading next problem...');
                showProblem();
                stateManager.transition(AppState.ProblemShown);
            } else {
                stateManager.transition(AppState.Idle);
            }
        }
    });

    // Handle WebView events
    webviewProvider.onCodeChange((code) => {
        problemProvider.saveUserCode(code);
    });

    webviewProvider.onRunClick(async () => {

        if (!currentProblemId) return;

        const problem = problemProvider.getProblemById(currentProblemId);
        if (!problem) return;

        const code = await webviewProvider.getCurrentCode();
        const functionName = extractFunctionName(problem.starterCode);
        const results = await pythonRunner.runTests(code, functionName, problem.testCases);
        webviewProvider.showResults(results);
    });

    webviewProvider.onProblemCompleted(() => {
        stateManager.transition(AppState.ProblemCompleted);
    });

    // Listen for agent activity
    agentDetector.onAgentStart(() => {

        stateManager.transition(AppState.AgentActive);
    });

    agentDetector.onAgentEnd(() => {

        stateManager.transition(AppState.Idle);
    });

    // Register manual trigger command (for testing)
    const showCommand = vscode.commands.registerCommand('leetclaude.showProblem', () => {

        stateManager.transition(AppState.AgentActive);
    });

    // Register stop command
    const stopCommand = vscode.commands.registerCommand('leetclaude.stopProblem', () => {
        stateManager.transition(AppState.Idle);
    });

    // Register copy config command
    const copyConfigCommand = vscode.commands.registerCommand('leetclaude.copyMcpConfig', async () => {
        const extensionPath = context.extensionUri.fsPath;
        const serverPath = vscode.Uri.joinPath(context.extensionUri, 'out', 'mcp', 'server.js').fsPath;

        const config = {
            mcpServers: {
                leetclaude: {
                    command: "node",
                    args: [serverPath]
                }
            }
        };

        const configStr = JSON.stringify(config, null, 2);
        await vscode.env.clipboard.writeText(configStr);
        vscode.window.showInformationMessage('MCP Configuration copied to clipboard! You can now paste it into your agent settings.');
    });



    context.subscriptions.push(showCommand, stopCommand, copyConfigCommand, agentDetector, webviewProvider, ipcServer);
}

function showProblem(): void {
    const active = problemProvider.getActiveProblem();
    if (active) {
        currentProblemId = active.problem.id;
        webviewProvider.show(active.problem, active.userCode);
    }
}

/**
 * Extract function name from Python starter code
 */
function extractFunctionName(starterCode: string): string {
    const match = starterCode.match(/def\s+(\w+)\s*\(/);
    return match ? match[1] : 'solution';
}

export function deactivate() {

}
