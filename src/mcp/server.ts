#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { z } from "zod";
import express from 'express';
import { executeMcpTool } from './tools';

export function createMcpServerInstance() {
  const server = new McpServer({
    name: "complypro-agentic-governance",
    version: "1.1.0"
  }, {
    capabilities: {
      tools: {}
    }
  });

  // 1. agentic_light_assessment (10 Dimensions Rapid Assessment)
  server.tool(
    "agentic_light_assessment",
    "Executes rapid 10-dimension Agentic AI Governance Assessment producing the Agentic Governance Score",
    {
      filePath: z.string().optional().describe("Workspace or repo path to audit")
    },
    async (args) => {
      const res = await executeMcpTool('agentic_light_assessment', args);
      return { content: [{ type: "text", text: JSON.stringify(res, null, 2) }] };
    }
  );

  // 2. get_agent_passports
  server.tool(
    "get_agent_passports",
    "Generates formal Agent Governance Passports for all detected AI agents in the project",
    {
      filePath: z.string().optional().describe("Workspace or repo path")
    },
    async (args) => {
      const res = await executeMcpTool('get_agent_passports', args);
      return { content: [{ type: "text", text: JSON.stringify(res, null, 2) }] };
    }
  );

  // 3. codeguard_audit
  server.tool(
    "codeguard_audit",
    "Runs deep regulatory and risk audit on AI agent code (LGPD, EU AI Act, OWASP, NIST)",
    {
      filePath: z.string().optional().describe("Directory or file path to audit")
    },
    async (args) => {
      const res = await executeMcpTool('codeguard_audit', args);
      return { content: [{ type: "text", text: JSON.stringify(res, null, 2) }] };
    }
  );

  // 4. governance_graph / codeguard_graph
  server.tool(
    "governance_graph",
    "Generates in-memory GraphOS entity, dependency and data lineage graph",
    {
      filePath: z.string().optional().describe("Directory path to map")
    },
    async (args) => {
      const res = await executeMcpTool('governance_graph', args);
      return { content: [{ type: "text", text: JSON.stringify(res, null, 2) }] };
    }
  );

  // 5. detect_shadow_apis
  server.tool(
    "detect_shadow_apis",
    "Detects unhomologated direct LLM calls and shadow AI endpoints in code",
    {
      filePath: z.string().optional().describe("Directory path to inspect")
    },
    async (args) => {
      const res = await executeMcpTool('detect_shadow_apis', args);
      return { content: [{ type: "text", text: JSON.stringify(res, null, 2) }] };
    }
  );

  // 6. risk_register
  server.tool(
    "risk_register",
    "Lists categorized risk items and recommended remediations",
    {
      filePath: z.string().optional().describe("Target path")
    },
    async (args) => {
      const res = await executeMcpTool('risk_register', args);
      return { content: [{ type: "text", text: JSON.stringify(res, null, 2) }] };
    }
  );

  // 7. scanner_status
  server.tool(
    "scanner_status",
    "Returns engine operational diagnostic, versions and active regulatory capabilities",
    {},
    async (args) => {
      const res = await executeMcpTool('scanner_status', args);
      return { content: [{ type: "text", text: JSON.stringify(res, null, 2) }] };
    }
  );

  return server;
}

export async function runStdio() {
  const server = createMcpServerInstance();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[ComplyPRO MCP] Stdio Transport active and listening.");
}

export async function runSse(port = 3001) {
  const app = express();
  const server = createMcpServerInstance();
  let sseTransport: SSEServerTransport | null = null;

  app.get('/sse', async (req, res) => {
    sseTransport = new SSEServerTransport('/message', res);
    await server.connect(sseTransport);
  });

  app.post('/message', express.json(), async (req, res) => {
    if (sseTransport) {
      await sseTransport.handlePostMessage(req, res);
    } else {
      res.status(400).send('No active SSE connection');
    }
  });

  app.listen(port, () => {
    console.error(`[ComplyPRO MCP] SSE server listening on port ${port}`);
  });
}

// Execution entrypoint
const mode = (process.env.TRANSPORT_MODE || 'stdio').toLowerCase();
if (process.env.NODE_ENV !== 'test') {
  if (mode === 'sse') {
    runSse();
  } else {
    runStdio();
  }
}
