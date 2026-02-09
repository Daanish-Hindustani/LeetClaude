import * as vscode from 'vscode';

export enum AppState {
    Idle = 'IDLE',
    AgentActive = 'AGENT_ACTIVE',
    ProblemShown = 'PROBLEM_SHOWN',
    ProblemCompleted = 'PROBLEM_COMPLETED'
}

export class StateManager {
    private currentState: AppState = AppState.Idle;
    private onStateChangeEmitter = new vscode.EventEmitter<AppState>();

    public onStateChange = this.onStateChangeEmitter.event;

    getState(): AppState {
        return this.currentState;
    }

    transition(newState: AppState): void {
        const oldState = this.currentState;

        // Validate transitions
        if (!this.isValidTransition(oldState, newState)) {
            console.log(`LeetClaude: Invalid transition ${oldState} -> ${newState}`);
            return;
        }

        this.currentState = newState;
        console.log(`LeetClaude: State ${oldState} -> ${newState}`);
        this.onStateChangeEmitter.fire(newState);
    }

    private isValidTransition(from: AppState, to: AppState): boolean {
        const validTransitions: Record<AppState, AppState[]> = {
            [AppState.Idle]: [AppState.AgentActive],
            [AppState.AgentActive]: [AppState.ProblemShown, AppState.Idle],
            [AppState.ProblemShown]: [AppState.ProblemCompleted, AppState.Idle],
            [AppState.ProblemCompleted]: [AppState.Idle]
        };

        return validTransitions[from]?.includes(to) ?? false;
    }

    dispose(): void {
        this.onStateChangeEmitter.dispose();
    }
}
