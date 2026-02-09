"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PythonRunner = void 0;
const child_process_1 = require("child_process");
class PythonRunner {
    constructor() {
        this.TIMEOUT_MS = 2000;
    }
    /**
     * Run user code against all test cases
     */
    async runTests(userCode, functionName, testCases) {
        const results = [];
        for (const testCase of testCases) {
            const result = await this.runSingleTest(userCode, functionName, testCase);
            results.push(result);
        }
        return results;
    }
    /**
     * Run a single test case
     */
    async runSingleTest(userCode, functionName, testCase) {
        const testScript = this.generateTestScript(userCode, functionName, testCase);
        return new Promise((resolve) => {
            let stdout = '';
            let stderr = '';
            let killed = false;
            const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
            const proc = (0, child_process_1.spawn)(pythonCmd, ['-c', testScript], {
                timeout: this.TIMEOUT_MS
            });
            const timer = setTimeout(() => {
                killed = true;
                proc.kill('SIGKILL');
            }, this.TIMEOUT_MS);
            proc.stdout.on('data', (data) => {
                stdout += data.toString();
            });
            proc.stderr.on('data', (data) => {
                stderr += data.toString();
            });
            proc.on('close', (code) => {
                clearTimeout(timer);
                if (killed) {
                    resolve({
                        passed: false,
                        output: '',
                        expected: JSON.stringify(testCase.expected),
                        stdout: '',
                        error: 'Timeout: Code took longer than 2 seconds'
                    });
                    return;
                }
                if (stderr) {
                    const MARKER = '===LEETCLAUDE_RESULT===';
                    const markerParts = stdout.split(MARKER);
                    const userPrints = markerParts.length > 1 ? markerParts[0].trim() : '';
                    resolve({
                        passed: false,
                        output: '',
                        expected: JSON.stringify(testCase.expected),
                        stdout: userPrints,
                        error: this.cleanError(stderr)
                    });
                    return;
                }
                try {
                    // Split by marker to separate user prints from test result
                    const MARKER = '===LEETCLAUDE_RESULT===';
                    const parts = stdout.split(MARKER);
                    const userPrints = parts.length > 1 ? parts[0].trim() : '';
                    const resultStr = (parts.length > 1 ? parts[1] : parts[0]).trim();
                    const result = JSON.parse(resultStr);
                    const passed = JSON.stringify(result) === JSON.stringify(testCase.expected);
                    resolve({
                        passed,
                        output: JSON.stringify(result),
                        expected: JSON.stringify(testCase.expected),
                        stdout: userPrints,
                        error: passed ? undefined : 'Output does not match expected'
                    });
                }
                catch {
                    resolve({
                        passed: false,
                        output: stdout.trim(),
                        expected: JSON.stringify(testCase.expected),
                        stdout: '',
                        error: 'Failed to parse output'
                    });
                }
            });
            proc.on('error', (err) => {
                clearTimeout(timer);
                resolve({
                    passed: false,
                    output: '',
                    expected: JSON.stringify(testCase.expected),
                    stdout: '',
                    error: `Failed to run Python: ${err.message}`
                });
            });
        });
    }
    /**
     * Generate Python test script with harness
     */
    generateTestScript(userCode, functionName, testCase) {
        const argsStr = testCase.input.map(arg => JSON.stringify(arg)).join(', ');
        return `
import json
import sys

# User code
${userCode}

# Test harness
try:
    result = ${functionName}(${argsStr})
    print("===LEETCLAUDE_RESULT===")
    print(json.dumps(result))
except Exception as e:
    print("===LEETCLAUDE_RESULT===")
    print(f"Error: {e}", file=sys.stderr)
    sys.exit(1)
`;
    }
    /**
     * Clean up Python error messages for display
     */
    cleanError(stderr) {
        // Extract just the error message, not the full traceback
        const lines = stderr.trim().split('\n');
        const errorLine = lines.find(line => line.includes('Error:')) || lines[lines.length - 1];
        return errorLine.trim();
    }
}
exports.PythonRunner = PythonRunner;
//# sourceMappingURL=pythonRunner.js.map