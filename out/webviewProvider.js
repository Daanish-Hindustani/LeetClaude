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
exports.WebviewProvider = void 0;
const vscode = __importStar(require("vscode"));
class WebviewProvider {
    constructor(extensionUri) {
        this.extensionUri = extensionUri;
        this.disposables = [];
        this.onCodeChangeEmitter = new vscode.EventEmitter();
        this.onRunClickEmitter = new vscode.EventEmitter();
        this.onProblemCompletedEmitter = new vscode.EventEmitter();
        this.onCodeChange = this.onCodeChangeEmitter.event;
        this.onRunClick = this.onRunClickEmitter.event;
        this.onProblemCompleted = this.onProblemCompletedEmitter.event;
    }
    /**
     * Show the WebView panel with the given problem
     */
    show(problem, userCode) {
        if (this.panel) {
            this.panel.reveal(vscode.ViewColumn.One);
            this.updateContent(problem, userCode);
            return;
        }
        this.panel = vscode.window.createWebviewPanel('leetclaude', `LeetClaude: ${problem.title}`, vscode.ViewColumn.One, {
            enableScripts: true,
            retainContextWhenHidden: true
        });
        this.panel.webview.html = this.getHtml(problem, userCode);
        // Handle messages from WebView
        this.panel.webview.onDidReceiveMessage((message) => {
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
        }, undefined, this.disposables);
        this.panel.onDidDispose(() => {
            this.panel = undefined;
        }, null, this.disposables);
    }
    /**
     * Close the WebView panel
     */
    close() {
        if (this.panel) {
            this.panel.dispose();
            this.panel = undefined;
        }
    }
    /**
     * Update test results in the WebView
     */
    showResults(results) {
        if (this.panel) {
            this.panel.webview.postMessage({ type: 'results', results });
        }
    }
    /**
     * Get current code from WebView
     */
    getCurrentCode() {
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
    updateContent(problem, userCode) {
        if (this.panel) {
            this.panel.title = `LeetClaude: ${problem.title}`;
            this.panel.webview.html = this.getHtml(problem, userCode);
        }
    }
    getHtml(problem, userCode) {
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
    dispose() {
        this.close();
        this.disposables.forEach(d => d.dispose());
        this.onCodeChangeEmitter.dispose();
        this.onRunClickEmitter.dispose();
        this.onProblemCompletedEmitter.dispose();
    }
}
exports.WebviewProvider = WebviewProvider;
//# sourceMappingURL=webviewProvider.js.map