import * as vscode from 'vscode';
import { AgentDetector } from './agentDetector';
import { StateManager, AppState } from './stateManager';
import { ProblemProvider } from './problemProvider';
import { WebviewProvider } from './webviewProvider';
import { PythonRunner } from './pythonRunner';

let agentDetector: AgentDetector;
let stateManager: StateManager;
let problemProvider: ProblemProvider;
let webviewProvider: WebviewProvider;
let pythonRunner: PythonRunner;
let currentProblemId: string | undefined;

export function activate(context: vscode.ExtensionContext) {
    console.log('LeetClaude: Extension activated');

    // Initialize components
    stateManager = new StateManager();
    agentDetector = new AgentDetector();
    problemProvider = new ProblemProvider(context);
    webviewProvider = new WebviewProvider(context.extensionUri);
    pythonRunner = new PythonRunner();

    // Handle state changes
    stateManager.onStateChange((newState: AppState) => {
        if (newState === AppState.AgentActive) {
            showProblem();
            stateManager.transition(AppState.ProblemShown);
        } else if (newState === AppState.Idle) {
            webviewProvider.close();
        } else if (newState === AppState.ProblemCompleted) {
            console.log('LeetClaude: Problem completed! Clearing state.');
            currentProblemId = undefined;
            problemProvider.markCompleted();
            stateManager.transition(AppState.Idle);
        }
    });

    // Handle WebView events
    webviewProvider.onCodeChange((code) => {
        problemProvider.saveUserCode(code);
    });

    webviewProvider.onRunClick(async () => {
        console.log('LeetClaude: Run clicked');
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
        console.log('LeetClaude: Agent started');
        stateManager.transition(AppState.AgentActive);
    });

    agentDetector.onAgentEnd(() => {
        console.log('LeetClaude: Agent ended');
        stateManager.transition(AppState.Idle);
    });

    // Register manual trigger command (for testing)
    const showCommand = vscode.commands.registerCommand('leetclaude.showProblem', () => {
        console.log('LeetClaude: Manual trigger');
        stateManager.transition(AppState.AgentActive);
    });

    // Register stop command
    const stopCommand = vscode.commands.registerCommand('leetclaude.stopProblem', () => {
        console.log('LeetClaude: Manual stop');
        stateManager.transition(AppState.Idle);
    });

    // Start monitoring
    agentDetector.startMonitoring(context);

    context.subscriptions.push(showCommand, stopCommand, agentDetector, webviewProvider);
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
    console.log('LeetClaude: Extension deactivated');
}
