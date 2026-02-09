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

    /**
     * Show the WebView panel with the given problem
     */
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

        // Handle messages from WebView
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

    /**
     * Close the WebView panel
     */
    close(): void {
        if (this.panel) {
            this.panel.dispose();
            this.panel = undefined;
        }
    }

    /**
     * Update test results in the WebView
     */
    showResults(results: { passed: boolean; output: string; error?: string }[]): void {
        if (this.panel) {
            this.panel.webview.postMessage({ type: 'results', results });
        }
    }

    /**
     * Get current code from WebView
     */
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

            // Timeout fallback
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
        const escapedDescription = problem.description.replace(/\n/g, '<br>').replace(/`([^`]+)`/g, '<code>$1</code>');

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${problem.title}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #1e1e1e;
            color: #d4d4d4;
            height: 100vh;
            display: flex;
            flex-direction: column;
        }
        .container {
            display: flex;
            flex: 1;
            overflow: hidden;
        }
        .problem-panel {
            width: 40%;
            padding: 20px;
            overflow-y: auto;
            border-right: 1px solid #333;
        }
        .editor-panel {
            width: 60%;
            display: flex;
            flex-direction: column;
        }
        h1 {
            color: #4ec9b0;
            font-size: 1.5rem;
            margin-bottom: 16px;
        }
        .description {
            line-height: 1.6;
            font-size: 14px;
        }
        .description code {
            background: #333;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Consolas', 'Monaco', monospace;
            color: #ce9178;
        }
        #editor-container {
            flex: 1;
            min-height: 0;
        }
        .toolbar {
            padding: 10px;
            background: #252526;
            display: flex;
            gap: 10px;
        }
        button {
            padding: 8px 20px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
        }
        .run-btn {
            background: #0e639c;
            color: white;
        }
        .run-btn:hover {
            background: #1177bb;
        }
        .reset-btn {
            background: #333;
            color: #d4d4d4;
        }
        .reset-btn:hover {
            background: #444;
        }
        .results {
            padding: 15px;
            background: #252526;
            max-height: 200px;
            overflow-y: auto;
            border-top: 1px solid #333;
        }
        .result-item {
            padding: 8px 12px;
            margin-bottom: 8px;
            border-radius: 4px;
            font-family: 'Consolas', monospace;
            font-size: 13px;
        }
        .result-pass {
            background: #1e3a1e;
            border-left: 3px solid #4caf50;
        }
        .result-fail {
            background: #3a1e1e;
            border-left: 3px solid #f44336;
        }
        .all-passed {
            text-align: center;
            padding: 20px;
            background: #1e3a1e;
            color: #4caf50;
            font-size: 18px;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="problem-panel">
            <h1>${problem.title}</h1>
            <div class="description">${escapedDescription}</div>
        </div>
        <div class="editor-panel">
            <div id="editor-container"></div>
            <div class="toolbar">
                <button class="run-btn" onclick="runCode()">▶ Run</button>
                <button class="reset-btn" onclick="resetCode()">↺ Reset</button>
            </div>
            <div class="results" id="results"></div>
        </div>
    </div>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs/loader.min.js"></script>
    <script>
        const vscode = acquireVsCodeApi();
        let editor;
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
                automaticLayout: true
            });

            editor.onDidChangeModelContent(() => {
                vscode.postMessage({ type: 'codeChange', code: editor.getValue() });
            });
        });

        function runCode() {
            vscode.postMessage({ type: 'run' });
        }

        function resetCode() {
            if (editor) {
                editor.setValue(starterCode);
            }
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
            const container = document.getElementById('results');
            const allPassed = results.every(r => r.passed);
            
            if (allPassed) {
                container.innerHTML = '<div class="all-passed">🎉 All Tests Passed!</div>';
                vscode.postMessage({ type: 'problemCompleted' });
            } else {
                container.innerHTML = results.map((r, i) => 
                    \`<div class="result-item \${r.passed ? 'result-pass' : 'result-fail'}">
                        Test \${i + 1}: \${r.passed ? '✓ Passed' : '✗ Failed'}
                        \${r.error ? '<br>Error: ' + r.error : ''}
                        \${!r.passed && r.output ? '<br>Output: ' + r.output : ''}
                    </div>\`
                ).join('');
            }
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
