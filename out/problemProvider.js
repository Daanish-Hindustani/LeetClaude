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
exports.ProblemProvider = void 0;
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const STATE_KEY = 'leetclaude.activeProblgem';
class ProblemProvider {
    constructor(context) {
        this.problems = [];
        this.context = context;
        this.loadProblems();
    }
    loadProblems() {
        try {
            const problemsPath = path.join(__dirname, 'problems.json');
            const data = fs.readFileSync(problemsPath, 'utf-8');
            const parsed = JSON.parse(data);
            this.problems = parsed.problems;
            console.log(`LeetClaude: Loaded ${this.problems.length} problems`);
        }
        catch (error) {
            console.error('LeetClaude: Failed to load problems', error);
            this.problems = [];
        }
    }
    /**
     * Get the current active problem, or select a new random one
     */
    getActiveProblem() {
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
    saveUserCode(code) {
        const state = this.getState();
        if (state) {
            state.userCode = code;
            this.saveState(state);
        }
    }
    /**
     * Mark current problem as completed and clear state
     */
    markCompleted() {
        console.log('LeetClaude: Problem completed, clearing state');
        this.context.globalState.update(STATE_KEY, undefined);
    }
    /**
     * Get current problem state from globalState
     */
    getState() {
        return this.context.globalState.get(STATE_KEY);
    }
    /**
     * Save problem state to globalState
     */
    saveState(state) {
        this.context.globalState.update(STATE_KEY, state);
    }
    /**
     * Get problem by ID (for test execution)
     */
    getProblemById(id) {
        return this.problems.find(p => p.id === id);
    }
}
exports.ProblemProvider = ProblemProvider;
//# sourceMappingURL=problemProvider.js.map