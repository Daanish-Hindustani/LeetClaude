#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

const EXTENSION_IPC_URL = 'http://localhost:3456/status';

const server = new Server(
    {
        name: "leetclaude-mcp",
        version: "0.1.0",
    },
    {
        capabilities: {
            tools: {},
        },
    }
);

// Define the tool
const REPORT_STATUS_TOOL = {
    name: "leetclaude_report_status",
    description: "Report the agent's current status (thinking, coding, etc.) to the LeetClaude extension. Use this when your activity changes significantly.",
    inputSchema: {
        type: "object",
        properties: {
            status: {
                type: "string",
                description: "The current status of the agent (e.g., 'thinking', 'coding', 'idle').",
                enum: ["thinking", "coding", "idle"]
            },
            message: {
                type: "string",
                description: "Optional message describing the current activity."
            }
        },
        required: ["status"]
    }
};

server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [REPORT_STATUS_TOOL],
    };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name !== "leetclaude_report_status") {
        throw new Error("Unknown tool");
    }

    const { status, message } = request.params.arguments as { status: string; message?: string };

    try {
        // Send status to VS Code extension
        await fetch(EXTENSION_IPC_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status, message })
        });

        return {
            content: [{
                type: "text",
                text: `Status '${status}' reported successfully.`
            }]
        };
    } catch (error) {
        return {
            content: [{
                type: "text",
                text: `Failed to report status: ${error instanceof Error ? error.message : String(error)}`
            }],
            isError: true
        };
    }
});

async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("LeetClaude MCP Server running on stdio");
}

main().catch((error) => {
    console.error("Server error:", error);
    process.exit(1);
});
