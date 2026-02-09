import * as vscode from 'vscode';

export class AgentDetector implements vscode.Disposable {
    private disposables: vscode.Disposable[] = [];
    private editCount = 0;
    private activityStartTime: number | null = null;
    private isAgentActive = false;
    private quietTimer: NodeJS.Timeout | null = null;

    private readonly ACTIVITY_THRESHOLD_MS = 4000; // 4 seconds of activity to trigger
    private readonly QUIET_THRESHOLD_MS = 2000;    // 2 seconds of quiet to end
    private readonly EDITS_PER_SECOND = 3;         // Minimum edits/second to count as "rapid"

    private onAgentStartEmitter = new vscode.EventEmitter<void>();
    private onAgentEndEmitter = new vscode.EventEmitter<void>();

    public onAgentStart = this.onAgentStartEmitter.event;
    public onAgentEnd = this.onAgentEndEmitter.event;

    startMonitoring(context: vscode.ExtensionContext): void {
        // Monitor document changes for rapid editing (agent activity)
        const docChangeListener = vscode.workspace.onDidChangeTextDocument((e) => {
            if (e.contentChanges.length === 0) return;

            this.editCount++;
            this.resetQuietTimer();

            // Start tracking activity if we see rapid edits
            if (!this.activityStartTime && this.editCount >= this.EDITS_PER_SECOND) {
                this.activityStartTime = Date.now();
                console.log('LeetClaude: Rapid editing detected, tracking...');
            }

            // Check if we've hit the threshold
            if (this.activityStartTime && !this.isAgentActive) {
                const elapsed = Date.now() - this.activityStartTime;
                if (elapsed >= this.ACTIVITY_THRESHOLD_MS) {
                    this.isAgentActive = true;
                    console.log('LeetClaude: Agent activity threshold reached');
                    this.onAgentStartEmitter.fire();
                }
            }
        });

        // Decay edit count over time
        const decayInterval = setInterval(() => {
            this.editCount = Math.max(0, this.editCount - 2);
            if (this.editCount === 0 && !this.isAgentActive) {
                this.activityStartTime = null;
            }
        }, 1000);

        this.disposables.push(docChangeListener);
        this.disposables.push({ dispose: () => clearInterval(decayInterval) });
    }

    private resetQuietTimer(): void {
        if (this.quietTimer) {
            clearTimeout(this.quietTimer);
        }

        this.quietTimer = setTimeout(() => {
            if (this.isAgentActive) {
                console.log('LeetClaude: Quiet period detected, ending agent activity');
                this.isAgentActive = false;
                this.activityStartTime = null;
                this.editCount = 0;
                this.onAgentEndEmitter.fire();
            }
        }, this.QUIET_THRESHOLD_MS);
    }

    dispose(): void {
        if (this.quietTimer) {
            clearTimeout(this.quietTimer);
        }
        this.disposables.forEach(d => d.dispose());
        this.onAgentStartEmitter.dispose();
        this.onAgentEndEmitter.dispose();
    }
}
