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
                        error: 'Timeout: Code took longer than 2 seconds'
                    });
                    return;
                }
                if (stderr) {
                    resolve({
                        passed: false,
                        output: stdout.trim(),
                        expected: JSON.stringify(testCase.expected),
                        error: this.cleanError(stderr)
                    });
                    return;
                }
                try {
                    const output = stdout.trim();
                    const result = JSON.parse(output);
                    const passed = JSON.stringify(result) === JSON.stringify(testCase.expected);
                    resolve({
                        passed,
                        output: JSON.stringify(result),
                        expected: JSON.stringify(testCase.expected),
                        error: passed ? undefined : 'Output does not match expected'
                    });
                }
                catch {
                    resolve({
                        passed: false,
                        output: stdout.trim(),
                        expected: JSON.stringify(testCase.expected),
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
    print(json.dumps(result))
except Exception as e:
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