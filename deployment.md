# LeetClaude Deployment Guide

This guide covers how to package and publish the LeetClaude extension to the VS Code Marketplace.

## 1. Prerequisites

- [Node.js](https://nodejs.org/) installed.
- [vsce](https://github.com/microsoft/vscode-vsce) installed globally:
  ```bash
  npm install -g @vscode/vsce
  ```
- A Publisher account on the [VS Code Marketplace](https://marketplace.visualstudio.com/).

## 2. Configuration Checklist (CRITICAL)

Before publishing, you **MUST** update `package.json` with your real details. I have added placeholders.

1.  **Publisher ID**: Change `"publisher": "your-publisher-id"` to your actual Marketplace ID.
2.  **Repository**: Change `"url": "https://github.com/username/leetclaude"` to your actual repo URL.
3.  **Icon**:
    - The project uses `logo.jpeg` as the icon (already configured in `package.json`).
    - Ensure `logo.jpeg` exists in the project root.
4.  **License**: A `LICENSE` file (MIT) has been created. Ensure this fits your needs.
5.  **Excludes**: A `.vscodeignore` file has been created to prevent `node_modules` and source files from bloating the package.

## 3. Packaging

To create a `.vsix` file for manual testing or local installation:

```bash
vsce package
```

This creates `leetclaude-0.0.1.vsix`.

## 4. Publishing

### Step A: Login

You need a Personal Access Token (PAT) from Azure DevOps with **Marketplace (Manage)** permissions.

```bash
vsce login <your-publisher-id>
```

### Step B: Publish

To publish the extension:

```bash
vsce publish
```

To automatically bump the version:
- **Patch** (0.0.1 -> 0.0.2): `vsce publish patch`
- **Minor** (0.0.1 -> 0.1.0): `vsce publish minor`
- **Major** (0.0.1 -> 1.0.0): `vsce publish major`

## Troubleshooting

- **"Missing publisher name"**: You forgot to update `"publisher"` in `package.json`.
- **"Make sure you include a README.md"**: Ensure `README.md` is in the root (it is).
- **"Cwd is not a directory"**: Run commands from the project root (`/Users/daanishhindustano/Documents/projects/LeetClaude`).
