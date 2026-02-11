# LeetClaude

**Practice LeetCode while AI agents code for you.**

LeetClaude is a VS Code extension that turns your idle time into productive practice. When it detects an AI agent (like Claude, Cursor, or GitHub Copilot) writing code in your editor, it automatically opens a LeetCode problem in a side panel for you to solve.

## Features

- **🤖 Automatic Agent Detection**: Intelligently monitors editor activity to detect when an AI is generating code (rapid, sustained edits).
- **⚡ Instant Challenges**: A LeetCode-style problem immediately appears when agent activity is detected.
- **📝 Embedded Code Editor**: Full-featured Monaco editor with Python support.
- **🏃 Local Test Runner**: Runs your solution against test cases locally using your system's Python installation.
- **📊 Real-time Feedback**: View pass/fail status, expected output, and stdout logs.
- **completion-confetti**: satisfying completion animations when you solve a problem.

## How It Works

1. **Install & Activate**: The extension starts monitoring automatically upon VS Code startup.
2. **Let AI Work**: Use an AI coding assistant (e.g., in a side chat or inline generation) to write code.
3. **Detection Trigger**: When the extension detects rapid document changes (simulating AI generation speed), the LeetClaude panel slides open.
4. **Solve & Run**: Read the problem description, write your Python solution, and click "Run" to test it.
5. **Resume Work**: Once the AI finishes or you close the panel, you can return to your main work.

## Requirements

- **Python**: You must have Python installed and available in your system PATH (accessable via `python` or `python3`).

## Extension Settings

This extension currently uses internal heuristics for detection:
- **Activity Threshold**: ~4 seconds of continuous rapid editing.
- **Edit Rate**: >3 edits per second.
- **Quiet Period**: ~2 seconds of inactivity closes the session (or you can manually close it).

## Known Issues

- Currently supports Python solutions only.
- Relies on edit frequency; extremely fast typists *might* trigger it (though unlikely to sustain the required rate/duration).

## Release Notes

### 0.0.1
- Initial release with basic agent detection and problem provider.
