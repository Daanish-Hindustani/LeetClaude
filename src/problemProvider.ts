import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export interface TestCase {
    input: any[];
    expected: any;
}

export interface Problem {
    id: string;
    title: string;
    description: string;
    starterCode: string;
    testCases: TestCase[];
}

export interface ProblemState {
    problemId: string;
    userCode: string;
    completed: boolean;
}

const STATE_KEY = 'leetclaude.activeProblgem';

export class ProblemProvider {
    private problems: Problem[] = [];
    private context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.loadProblems();
    }

    private loadProblems(): void {
        try {
            const problemsPath = path.join(__dirname, 'problems.json');
            const data = fs.readFileSync(problemsPath, 'utf-8');
            const parsed = JSON.parse(data);
            this.problems = parsed.problems;
            console.log(`LeetClaude: Loaded ${this.problems.length} problems`);
        } catch (error) {
            console.error('LeetClaude: Failed to load problems', error);
            this.problems = [];
        }
    }

    /**
     * Get the current active problem, or select a new random one
     */
    getActiveProblem(): { problem: Problem; userCode: string } | null {
        const state = this.getState();

        if (state && !state.completed) {
            // Resume existing problem
            const problem = this.problems.find(p => p.id === state.problemId);
            if (problem) {
                console.log(`LeetClaude: Resuming problem "${problem.title}"`);
                return { problem, userCode: state.userCode };
            }
        }

        // Select new random problem
        if (this.problems.length === 0) {
            console.log('LeetClaude: No problems available');
            return null;
        }

        const randomIndex = Math.floor(Math.random() * this.problems.length);
        const problem = this.problems[randomIndex];

        // Save initial state
        this.saveState({
            problemId: problem.id,
            userCode: problem.starterCode,
            completed: false
        });

        console.log(`LeetClaude: Selected new problem "${problem.title}"`);
        return { problem, userCode: problem.starterCode };
    }

    /**
     * Update saved user code
     */
    saveUserCode(code: string): void {
        const state = this.getState();
        if (state) {
            state.userCode = code;
            this.saveState(state);
        }
    }

    /**
     * Mark current problem as completed and clear state
     */
    markCompleted(): void {
        console.log('LeetClaude: Problem completed, clearing state');
        this.context.globalState.update(STATE_KEY, undefined);
    }

    /**
     * Get current problem state from globalState
     */
    private getState(): ProblemState | undefined {
        return this.context.globalState.get<ProblemState>(STATE_KEY);
    }

    /**
     * Save problem state to globalState
     */
    private saveState(state: ProblemState): void {
        this.context.globalState.update(STATE_KEY, state);
    }

    /**
     * Get problem by ID (for test execution)
     */
    getProblemById(id: string): Problem | undefined {
        return this.problems.find(p => p.id === id);
    }
}
