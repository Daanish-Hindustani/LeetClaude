import { spawn } from 'child_process';
import { TestCase } from './problemProvider';

export interface TestResult {
    passed: boolean;
    output: string;
    expected: string;
    error?: string;
}

export class PythonRunner {
    private readonly TIMEOUT_MS = 2000;

    /**
     * Run user code against all test cases
     */
    async runTests(userCode: string, functionName: string, testCases: TestCase[]): Promise<TestResult[]> {
        const results: TestResult[] = [];

        for (const testCase of testCases) {
            const result = await this.runSingleTest(userCode, functionName, testCase);
            results.push(result);
        }

        return results;
    }

    /**
     * Run a single test case
     */
    private async runSingleTest(userCode: string, functionName: string, testCase: TestCase): Promise<TestResult> {
        const testScript = this.generateTestScript(userCode, functionName, testCase);

        return new Promise((resolve) => {
            let stdout = '';
            let stderr = '';
            let killed = false;

            const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
            const proc = spawn(pythonCmd, ['-c', testScript], {
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
                } catch {
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
    private generateTestScript(userCode: string, functionName: string, testCase: TestCase): string {
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
    private cleanError(stderr: string): string {
        // Extract just the error message, not the full traceback
        const lines = stderr.trim().split('\n');
        const errorLine = lines.find(line => line.includes('Error:')) || lines[lines.length - 1];
        return errorLine.trim();
    }
}
