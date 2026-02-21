import * as vscode from 'vscode';

export class AgentDetector implements vscode.Disposable {
    private disposables: vscode.Disposable[] = [];
    private isAgentActive = false;

    private onAgentStartEmitter = new vscode.EventEmitter<void>();
    private onAgentEndEmitter = new vscode.EventEmitter<void>();

    public onAgentStart = this.onAgentStartEmitter.event;
    public onAgentEnd = this.onAgentEndEmitter.event;

    public get isActive(): boolean {
        return this.isAgentActive;
    }

    handleStatusChange(status: string): void {
        const wasActive = this.isAgentActive;
        // Consider both 'coding' and 'thinking' as active states
        const isActive = status === 'coding' || status === 'thinking';

        if (isActive) {
            this.isAgentActive = true;
            // Always fire start event to ensure UI is shown/refreshed
            this.onAgentStartEmitter.fire();
        } else if (!isActive && wasActive) {
            this.isAgentActive = false;
            this.onAgentEndEmitter.fire();
        }
    }

    dispose(): void {
        this.disposables.forEach(d => d.dispose());
        this.onAgentStartEmitter.dispose();
        this.onAgentEndEmitter.dispose();
    }
}
