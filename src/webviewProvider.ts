import * as vscode from 'vscode';
import { Problem } from './problemProvider';

export class WebviewProvider implements vscode.Disposable {
    private panel: vscode.WebviewPanel | undefined;
    private disposables: vscode.Disposable[] = [];

    private onCodeChangeEmitter = new vscode.EventEmitter<string>();
    private onRunClickEmitter = new vscode.EventEmitter<void>();
    private onProblemCompletedEmitter = new vscode.EventEmitter<void>();

    public onCodeChange = this.onCodeChangeEmitter.event;
    public onRunClick = this.onRunClickEmitter.event;
    public onProblemCompleted = this.onProblemCompletedEmitter.event;

    constructor(private extensionUri: vscode.Uri) { }

    show(problem: Problem, userCode: string): void {
        if (this.panel) {
            this.panel.reveal(vscode.ViewColumn.One);
            this.updateContent(problem, userCode);
            return;
        }

        this.panel = vscode.window.createWebviewPanel(
            'leetclaude',
            `LeetClaude: ${problem.title}`,
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        this.panel.webview.html = this.getHtml(problem, userCode);

        this.panel.webview.onDidReceiveMessage(
            (message) => {
                switch (message.type) {
                    case 'codeChange':
                        this.onCodeChangeEmitter.fire(message.code);
                        break;
                    case 'run':
                        this.onRunClickEmitter.fire();
                        break;
                    case 'problemCompleted':
                        this.onProblemCompletedEmitter.fire();
                        break;
                }
            },
            undefined,
            this.disposables
        );

        this.panel.onDidDispose(() => {
            this.panel = undefined;
        }, null, this.disposables);
    }

    close(): void {
        if (this.panel) {
            this.panel.dispose();
            this.panel = undefined;
        }
    }

    showResults(results: { passed: boolean; output: string; expected: string; error?: string }[]): void {
        if (this.panel) {
            this.panel.webview.postMessage({ type: 'results', results });
        }
    }

    getCurrentCode(): Promise<string> {
        return new Promise((resolve) => {
            if (!this.panel) {
                resolve('');
                return;
            }

            const listener = this.panel.webview.onDidReceiveMessage((message) => {
                if (message.type === 'currentCode') {
                    listener.dispose();
                    resolve(message.code);
                }
            });

            this.panel.webview.postMessage({ type: 'getCode' });

            setTimeout(() => {
                listener.dispose();
                resolve('');
            }, 1000);
        });
    }

    private updateContent(problem: Problem, userCode: string): void {
        if (this.panel) {
            this.panel.title = `LeetClaude: ${problem.title}`;
            this.panel.webview.html = this.getHtml(problem, userCode);
        }
    }

    private getHtml(problem: Problem, userCode: string): string {
        const escapedCode = userCode.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');
        const escapedDescription = problem.description
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            .replace(/\*\*(.+?)\*\*/g, '<strong class="section-header">$1</strong>')
            .replace(/^• (.+)$/gm, '<div class="constraint-item">• $1</div>')
            .replace(/^(Input:.+)$/gm, '<span class="io-line">$1</span>')
            .replace(/^(Output:.+)$/gm, '<span class="io-line io-output">$1</span>')
            .replace(/^(Explanation:.+)$/gm, '<span class="explanation">$1</span>')
            .replace(/\n/g, '<br>');

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${problem.title}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #1a1a1a;
            color: #eff1f6;
            height: 100vh;
            display: flex;
            flex-direction: column;
        }
        .container { display: flex; flex: 1; overflow: hidden; }
        .problem-panel {
            width: 40%;
            padding: 24px;
            overflow-y: auto;
            border-right: 1px solid #303030;
            background: #262626;
        }
        .editor-panel {
            width: 60%;
            display: flex;
            flex-direction: column;
            background: #1a1a1a;
        }
        h1 {
            color: #fff;
            font-size: 1.25rem;
            margin-bottom: 20px;
            font-weight: 600;
        }
        .difficulty {
            display: inline-block;
            padding: 2px 10px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 500;
            margin-left: 12px;
        }
        .difficulty.easy { background: #2cbb5d20; color: #2cbb5d; }
        .difficulty.medium { background: #ffc01e20; color: #ffc01e; }
        .difficulty.hard { background: #ef474320; color: #ef4743; }
        .description {
            line-height: 1.7;
            font-size: 14px;
            color: #eff1f6bf;
        }
        .description code {
            background: #ffffff12;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'Menlo', 'Monaco', monospace;
            color: #ffa657;
            font-size: 13px;
        }
        .section-header {
            color: #eff1f6;
            font-weight: 600;
            display: block;
            margin-top: 16px;
            margin-bottom: 4px;
        }
        .io-line {
            font-family: 'Menlo', 'Monaco', monospace;
            font-size: 13px;
            color: #eff1f6bf;
        }
        .io-output {
            color: #2cbb5d;
        }
        .explanation {
            color: #eff1f680;
            font-size: 13px;
            font-style: italic;
        }
        .constraint-item {
            font-size: 13px;
            color: #eff1f6bf;
            padding: 2px 0;
        }
        #editor-container { flex: 1; min-height: 0; }
        .toolbar {
            padding: 12px 16px;
            background: #262626;
            display: flex;
            gap: 10px;
            border-top: 1px solid #303030;
        }
        button {
            padding: 8px 16px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 13px;
            font-weight: 500;
            transition: all 0.2s;
        }
        .run-btn {
            background: #2cbb5d;
            color: #fff;
        }
        .run-btn:hover { background: #36d068; }
        .reset-btn {
            background: #ffffff12;
            color: #eff1f6;
        }
        .reset-btn:hover { background: #ffffff20; }
        
        /* LeetCode-style Console */
        .console {
            background: #262626;
            border-top: 1px solid #303030;
            max-height: 250px;
            overflow: hidden;
            display: flex;
            flex-direction: column;
        }
        .console-header {
            padding: 8px 16px;
            background: #303030;
            font-size: 12px;
            font-weight: 600;
            color: #eff1f6bf;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .console-header .status {
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 11px;
        }
        .console-header .status.accepted { background: #2cbb5d20; color: #2cbb5d; }
        .console-header .status.wrong { background: #ef474320; color: #ef4743; }
        .console-body {
            padding: 16px;
            overflow-y: auto;
            font-family: 'Menlo', 'Monaco', monospace;
            font-size: 13px;
        }
        .test-case {
            margin-bottom: 16px;
            padding: 12px;
            background: #1a1a1a;
            border-radius: 8px;
            border-left: 3px solid #303030;
        }
        .test-case.passed { border-left-color: #2cbb5d; }
        .test-case.failed { border-left-color: #ef4743; }
        .test-case-header {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 8px;
            font-weight: 600;
        }
        .test-case-header .icon { font-size: 14px; }
        .test-case-header .passed { color: #2cbb5d; }
        .test-case-header .failed { color: #ef4743; }
        .test-row {
            display: flex;
            margin-top: 8px;
        }
        .test-label {
            color: #eff1f6bf;
            width: 80px;
            flex-shrink: 0;
        }
        .test-value {
            color: #eff1f6;
        }
        .test-value.wrong { color: #ef4743; }
        .test-value.correct { color: #2cbb5d; }
        
        /* Success Modal */
        .success-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.85);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            animation: fadeIn 0.3s ease;
        }
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        .success-modal {
            background: #262626;
            border-radius: 16px;
            padding: 48px;
            text-align: center;
            animation: scaleIn 0.3s ease;
            border: 1px solid #303030;
        }
        @keyframes scaleIn {
            from { transform: scale(0.8); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
        }
        .success-icon {
            width: 80px;
            height: 80px;
            background: #2cbb5d20;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 24px;
            font-size: 40px;
        }
        .success-title {
            font-size: 28px;
            font-weight: 700;
            color: #2cbb5d;
            margin-bottom: 12px;
        }
        .success-subtitle {
            color: #eff1f6bf;
            font-size: 16px;
            margin-bottom: 32px;
        }
        .success-stats {
            display: flex;
            gap: 32px;
            justify-content: center;
            margin-bottom: 32px;
        }
        .stat {
            text-align: center;
        }
        .stat-value {
            font-size: 24px;
            font-weight: 700;
            color: #fff;
        }
        .stat-label {
            font-size: 12px;
            color: #eff1f6bf;
            margin-top: 4px;
        }
        .continue-btn {
            background: #2cbb5d;
            color: #fff;
            padding: 12px 32px;
            font-size: 16px;
            font-weight: 600;
            border-radius: 8px;
        }
        .continue-btn:hover { background: #36d068; }
    </style>
</head>
<body>
    <div class="container">
        <div class="problem-panel">
            <h1>${problem.title}<span class="difficulty easy">Easy</span></h1>
            <div class="description">${escapedDescription}</div>
        </div>
        <div class="editor-panel">
            <div id="editor-container"></div>
            <div class="toolbar">
                <button class="run-btn" onclick="runCode()">▶ Run</button>
                <button class="reset-btn" onclick="resetCode()">↺ Reset</button>
            </div>
            <div class="console" id="console" style="display: none;">
                <div class="console-header">
                    <span>Console</span>
                    <span class="status" id="console-status"></span>
                </div>
                <div class="console-body" id="console-body"></div>
            </div>
        </div>
    </div>
    <div id="success-overlay" style="display: none;"></div>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs/loader.min.js"></script>
    <script>
        const vscode = acquireVsCodeApi();
        let editor;
        let startTime = Date.now();
        const starterCode = \`${problem.starterCode.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`;
        const initialCode = \`${escapedCode}\`;

        require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs' } });
        
        require(['vs/editor/editor.main'], function () {
            editor = monaco.editor.create(document.getElementById('editor-container'), {
                value: initialCode,
                language: 'python',
                theme: 'vs-dark',
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                padding: { top: 16 }
            });

            editor.onDidChangeModelContent(() => {
                vscode.postMessage({ type: 'codeChange', code: editor.getValue() });
            });
        });

        function runCode() {
            document.getElementById('console').style.display = 'flex';
            document.getElementById('console-body').innerHTML = '<div style="color: #eff1f6bf;">Running...</div>';
            document.getElementById('console-status').textContent = '';
            document.getElementById('console-status').className = 'status';
            vscode.postMessage({ type: 'run' });
        }

        function resetCode() {
            if (editor) editor.setValue(starterCode);
        }

        window.addEventListener('message', (event) => {
            const message = event.data;
            if (message.type === 'results') {
                showResults(message.results);
            } else if (message.type === 'getCode') {
                vscode.postMessage({ type: 'currentCode', code: editor ? editor.getValue() : '' });
            }
        });

        function showResults(results) {
            const allPassed = results.every(r => r.passed);
            const consoleEl = document.getElementById('console');
            const statusEl = document.getElementById('console-status');
            const bodyEl = document.getElementById('console-body');
            
            consoleEl.style.display = 'flex';
            
            if (allPassed) {
                statusEl.textContent = 'Accepted';
                statusEl.className = 'status accepted';
                
                const runtime = Math.floor(Math.random() * 50 + 30);
                const percentile = Math.floor(Math.random() * 30 + 60);
                
                bodyEl.innerHTML = results.map((r, i) => \`
                    <div class="test-case passed">
                        <div class="test-case-header">
                            <span class="icon passed">✓</span>
                            <span>Test Case \${i + 1}</span>
                        </div>
                        \${r.stdout ? \`<div class="test-row"><span class="test-label">Stdout:</span><span class="test-value" style="color:#9da5b4">\${r.stdout}</span></div>\` : ''}
                        <div class="test-row">
                            <span class="test-label">Output:</span>
                            <span class="test-value correct">\${r.output}</span>
                        </div>
                        <div class="test-row">
                            <span class="test-label">Expected:</span>
                            <span class="test-value">\${r.expected}</span>
                        </div>
                    </div>
                \`).join('');
                
                // Show success modal after delay
                setTimeout(() => {
                    const elapsed = Math.floor((Date.now() - startTime) / 1000);
                    const mins = Math.floor(elapsed / 60);
                    const secs = elapsed % 60;
                    
                    document.getElementById('success-overlay').innerHTML = \`
                        <div class="success-overlay">
                            <div class="success-modal">
                                <div class="success-icon">🎉</div>
                                <div class="success-title">Accepted</div>
                                <div class="success-subtitle">Great job! You solved this problem.</div>
                                <div class="success-stats">
                                    <div class="stat">
                                        <div class="stat-value">\${runtime} ms</div>
                                        <div class="stat-label">Runtime</div>
                                    </div>
                                    <div class="stat">
                                        <div class="stat-value">\${mins}:\${secs.toString().padStart(2, '0')}</div>
                                        <div class="stat-label">Time Spent</div>
                                    </div>
                                    <div class="stat">
                                        <div class="stat-value">\${results.length}/\${results.length}</div>
                                        <div class="stat-label">Tests Passed</div>
                                    </div>
                                </div>
                                <button class="continue-btn" onclick="completeAndClose()">Continue</button>
                            </div>
                        </div>
                    \`;
                    document.getElementById('success-overlay').style.display = 'block';
                }, 500);
            } else {
                statusEl.textContent = 'Wrong Answer';
                statusEl.className = 'status wrong';
                
                bodyEl.innerHTML = results.map((r, i) => \`
                    <div class="test-case \${r.passed ? 'passed' : 'failed'}">
                        <div class="test-case-header">
                            <span class="icon \${r.passed ? 'passed' : 'failed'}">\${r.passed ? '✓' : '✗'}</span>
                            <span>Test Case \${i + 1}</span>
                        </div>
                        \${r.error ? \`<div class="test-row"><span class="test-label">Error:</span><span class="test-value wrong">\${r.error}</span></div>\` : ''}
                        \${r.stdout ? \`<div class="test-row"><span class="test-label">Stdout:</span><span class="test-value" style="color:#9da5b4">\${r.stdout}</span></div>\` : ''}
                        <div class="test-row">
                            <span class="test-label">Output:</span>
                            <span class="test-value \${r.passed ? 'correct' : 'wrong'}">\${r.output || 'None'}</span>
                        </div>
                        <div class="test-row">
                            <span class="test-label">Expected:</span>
                            <span class="test-value">\${r.expected}</span>
                        </div>
                    </div>
                \`).join('');
            }
        }

        function completeAndClose() {
            vscode.postMessage({ type: 'problemCompleted' });
        }
    </script>
</body>
</html>`;
    }

    dispose(): void {
        this.close();
        this.disposables.forEach(d => d.dispose());
        this.onCodeChangeEmitter.dispose();
        this.onRunClickEmitter.dispose();
        this.onProblemCompletedEmitter.dispose();
    }
}
