# LeetClaude

**Practice LeetCode while you vibe code.**

LeetClaude is a VS Code extension that allows you to practice LeetCode while you vibe code. When it detects an AI agent (like Claude, Cursor, or GitHub Copilot) writing code in your editor or thinking, it automatically opens a LeetCode problem in a side panel for you to solve. When the agent finishes its task, the panel closes and you can return to your vibe coding session.

## Features

- **🤖 Automatic Agent Detection**: Monitors editor activity through an MCP to detect when an AI is generating code or thinking.
- **⚡ Instant Challenges**: A LeetCode-style problem immediately appears when agent activity is detected.
- **📝 Embedded Code Editor**: Full-featured Monaco editor with Python support.
- **🏃 Local Test Runner**: Runs your solution against test cases locally using your system's Python installation.
- **📊 Real-time Feedback**: View pass/fail status, expected output, and stdout logs.
- **completion-confetti**: satisfying completion animations when you solve a problem.

## How It Works

1. Once the extension is installed, MCP is configured, and the system prompt is added to the agent, the system monitors the coding agent.
2. When the agent is generating code or thinking, a LeetCode problem opens in a side panel for you to solve.
3. When the agent finishes its task, the panel closes and you can return to vibe coding.

## Requirements

- **Python**: You must have Python installed and available in your system PATH (accessable via `python` or `python3`).

## Installation
**After installing the extension, you need to configure the MCP**
    - Note you may need to restart vscode for the extension to work
    
### MCP Integration (Model Context Protocol)
**For best experience please configure the MCP**
LeetClaude supports MCP, allowing AI agents (like Claude Desktop, Cursor, etc.) to control the extension.

### Configuration

Add the following to your agent's MCP configuration (e.g., `claude_desktop_config.json` or Cursor Settings):

```json
{
  "mcpServers": {
    "leetclaude": {
        "command": "node",
        "args": [
            "/ABSOLUTE/PATH/TO/LeetClaude/out/mcp/server.js"
        ]
    }
  }
}
```

> **Note for Users**: After adding the server, please ensure you enable **"Always Allow"** or **"Auto-run"** in the MCP settings. Otherwise, the agent will ask for permission every time it tries to report its status. (pls reffer to docs for your agent)

### System Prompt

Add this to your agent's system prompt or rules to enable automatic usage:

```markdown
# LeetClaude Integration
You have access to a tool called `leetclaude_report_status`.
- Call this tool with `status: "coding"` whenever you are about to write code or solve a problem.
- Call this tool with `status: "idle"` when you have finished a task.
```

## Known Issues
- Currently supports Python solutions only.

## Release Notes

### 0.0.1
- Initial release with basic agent detection and problem provider.


