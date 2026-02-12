# Local Testing Guide for LeetClaude

Before publishing to the Marketplace, it is crucial to test the packaged extension (`.vsix`) locally to ensure it behaves exactly as it will for end users.

## 1. Package the Extension

First, create the installable package. This builds the project and ensures all necessary files are included (and excluded).

```bash
# Install dependencies if you haven't recently
npm install

# Package the extension
vsce package
```

**Success:** You should see a file named `leetclaude-0.0.1.vsix` (or similar version) in your project root.

## 2. Install Locally

You can install this VSIX file directly into VS Code.

1.  Open VS Code.
2.  Open the **Extensions view** (`Cmd+Shift+X` or `Ctrl+Shift+X`).
3.  Click the **... (Views and More Actions)** menu at the top right of the Extensions view.
4.  Select **"Install from VSIX..."**.
5.  Choose the `leetclaude-0.0.1.vsix` file you just created.
6.  **Reload VS Code** (or click "Reload Required" if prompted).

## 3. Verification Checklist

Perform these tests to verify functionality and security fixes.

### A. Core Functionality
1.  **Trigger Problem**:
    - Open the Command Palette (`Cmd+Shift+P`).
    - Run `LeetClaude: Show Problem`.
    - **Verify**: The LeetClaude panel opens with a problem description and code editor.
2.  **Run Code**:
    - In the editor panel, write a simple solution (or just `return` something valid).
    - Click **Run**.
    - **Verify**: The "Console" appears with test results (Passed/Failed).
3.  **Completion**:
    - If you can solve it (or cheat by copying the solution), verify the "Accepted" modal appears.

### B. Security Checks (Crucial)
1.  **IPC Binding (Localhost Only)**:
    - Open your terminal.
    - Run: `lsof -i :3456` (Mac/Linux) or `netstat -an | findstr 3456` (Windows).
    - **Verify**: The address is `127.0.0.1:3456` or `localhost:3456`.
    - **Fail**: If you see `*:3456` or `0.0.0.0:3456`.
2.  **Content Security Policy (CSP)**:
    - In the LeetClaude panel, open **Developer Tools** (`Help` > `Toggle Developer Tools`).
    - Check the **Console** tab.
    - **Verify**: There are **NO** red errors about "Content Security Policy" blocking resources.
    - *Note: If you see errors, the CSP in `webviewProvider.ts` might be too strict or malformed.*

### C. Agent Integration (Optional)
If you use an agent like Cursor or Claude Desktop:
1.  Ensure the agent is configured to use the MCP server path (which points to the *installed* extension path, usually `~/.vscode/extensions/leetclaude...`).
    - *easier test*: Just run the MCP server manually in a terminal: `node /path/to/project/out/mcp/server.js`.
2.  Trigger the agent to "write code".
3.  **Verify**: The LeetClaude panel opens automatically.

## 4. Uninstall/Cleanup

After testing:
1.  Go to **Extensions** view.
2.  Find **LeetClaude**.
3.  Click **Uninstall**.
4.  Reload VS Code to clear it from memory.
