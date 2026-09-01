#!/usr/bin/env node
/**
 * CG-AG UNIVERSAL MCP SERVER
 * Professional, SaaS-wide Model Context Protocol Interface for AI Agents
 * 
 * Capabilities:
 * - 14 Semantic Tools (Discovery, Governance, Evidence, Operations)
 * - 7 Live Resources (Controls, Policies, Ledger, Evidence, Tenant)
 * - 4 Guided Prompts (Executive, CISO, DPO, Vendor Risk)
 * - Dual Transports (Stdio for local IDEs, Streamable HTTP/SSE for remote hosts)
 */

import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { z } from "zod";
import express from 'express';
import { executeMcpTool, resolveMcpResource, resolveMcpPrompt } from './tools';

export function createUniversalMcpServer(context?: { authToken?: string; isDevModeAllowed?: boolean }) {
  const server = new McpServer({
    name: "complypro-universal-mcp",
    version: "2.0.0"
  }, {
    capabilities: {
      tools: {},
      resources: {},
      prompts: {}
    }
  });

  // ============================================================
  // 1. TOOLS REGISTRATION (14 Canonical Tools)
  // ============================================================

  // 1.1 scan_repository
  server.tool(
    "scan_repository",
    "Runs complete AST compliance, risk and capability scan on a target repository path.",
    {
      targetDir: z.string().optional().describe("Directory or repo path to audit")
    },
    async (args) => {
      const res = await executeMcpTool('scan_repository', args, context);
      return { content: [{ type: "text", text: JSON.stringify(res, null, 2) }] };
    }
  );

  // 1.2 get_scan_summary
  server.tool(
    "get_scan_summary",
    "Returns summarized compliance score, risk level, agent counts and framework breakdown.",
    {
      targetDir: z.string().optional().describe("Target workspace path")
    },
    async (args) => {
      const res = await executeMcpTool('get_scan_summary', args, context);
      return { content: [{ type: "text", text: JSON.stringify(res, null, 2) }] };
    }
  );

  // 1.3 discover_agents
  server.tool(
    "discover_agents",
    "Discovers all AI agents, frameworks, and personas in the target codebase.",
    {
      targetDir: z.string().optional().describe("Target workspace path")
    },
    async (args) => {
      const res = await executeMcpTool('discover_agents', args, context);
      return { content: [{ type: "text", text: JSON.stringify(res, null, 2) }] };
    }
  );

  // 1.4 discover_capabilities
  server.tool(
    "discover_capabilities",
    "Discovers canonical capabilities (DB, Cloud, ERP, MCP, REST, LLM) with explicit 5-state model and 10 anomaly types.",
    {
      targetDir: z.string().optional().describe("Target workspace path")
    },
    async (args) => {
      const res = await executeMcpTool('discover_capabilities', args, context);
      return { content: [{ type: "text", text: JSON.stringify(res, null, 2) }] };
    }
  );

  // 1.5 detect_shadow_apis
  server.tool(
    "detect_shadow_apis",
    "Identifies unhomologated direct LLM calls and shadow AI endpoints in code.",
    {
      targetDir: z.string().optional().describe("Target directory to inspect")
    },
    async (args) => {
      const res = await executeMcpTool('detect_shadow_apis', args, context);
      return { content: [{ type: "text", text: JSON.stringify(res, null, 2) }] };
    }
  );

  // 1.6 get_agent_passport
  server.tool(
    "get_agent_passport",
    "Generates verifiable Agent Governance Passport with cryptographically signed risk and capability boundaries.",
    {
      targetDir: z.string().optional().describe("Target workspace path"),
      agentName: z.string().optional().describe("Specific agent name to generate passport for")
    },
    async (args) => {
      const res = await executeMcpTool('get_agent_passport', args, context);
      return { content: [{ type: "text", text: JSON.stringify(res, null, 2) }] };
    }
  );

  // 1.7 get_business_xray
  server.tool(
    "get_business_xray",
    "Generates SIPOC business process flow with per-stage DerivationConfidence scoring.",
    {
      targetDir: z.string().optional().describe("Target workspace path")
    },
    async (args) => {
      const res = await executeMcpTool('get_business_xray', args, context);
      return { content: [{ type: "text", text: JSON.stringify(res, null, 2) }] };
    }
  );

  // 1.8 get_governance_controls
  server.tool(
    "get_governance_controls",
    "Returns the 12 canonical CG-AG governance controls and active baseline policies.",
    {},
    async (args) => {
      const res = await executeMcpTool('get_governance_controls', args, context);
      return { content: [{ type: "text", text: JSON.stringify(res, null, 2) }] };
    }
  );

  // 1.9 get_governance_snapshot
  server.tool(
    "get_governance_snapshot",
    "Returns unified DISCOVER / GOVERN / OPERATE / ASSURE posture snapshot.",
    {},
    async (args) => {
      const res = await executeMcpTool('get_governance_snapshot', args, context);
      return { content: [{ type: "text", text: JSON.stringify(res, null, 2) }] };
    }
  );

  // 1.10 get_audit_ledger
  server.tool(
    "get_audit_ledger",
    "Retrieves cryptographically chained audit ledger blocks with FIPS 180-4 SHA-256 hashes.",
    {
      limit: z.number().optional().describe("Maximum number of latest blocks to retrieve (max 100)")
    },
    async (args) => {
      const res = await executeMcpTool('get_audit_ledger', args, context);
      return { content: [{ type: "text", text: JSON.stringify(res, null, 2) }] };
    }
  );

  // 1.11 verify_audit_ledger
  server.tool(
    "verify_audit_ledger",
    "Verifies full SHA-256 cryptographic chain integrity across all ledger blocks from genesis to head.",
    {},
    async (args) => {
      const res = await executeMcpTool('verify_audit_ledger', args, context);
      return { content: [{ type: "text", text: JSON.stringify(res, null, 2) }] };
    }
  );

  // 1.12 get_evidence_records
  server.tool(
    "get_evidence_records",
    "Returns protected evidence records with integrity digests and provenance tracking.",
    {
      limit: z.number().optional().describe("Maximum number of records to retrieve (max 100)")
    },
    async (args) => {
      const res = await executeMcpTool('get_evidence_records', args, context);
      return { content: [{ type: "text", text: JSON.stringify(res, null, 2) }] };
    }
  );

  // 1.13 get_tenant_context
  server.tool(
    "get_tenant_context",
    "Returns authenticated caller identity, tenant ID, active roles, and permissions.",
    {},
    async (args) => {
      const res = await executeMcpTool('get_tenant_context', args, context);
      return { content: [{ type: "text", text: JSON.stringify(res, null, 2) }] };
    }
  );

  // 1.14 get_mcp_server_info
  server.tool(
    "get_mcp_server_info",
    "Returns server self-description, capabilities, tool, resource and prompt inventories.",
    {},
    async (args) => {
      const res = await executeMcpTool('get_mcp_server_info', args, context);
      return { content: [{ type: "text", text: JSON.stringify(res, null, 2) }] };
    }
  );

  // ============================================================
  // 2. RESOURCES REGISTRATION (7 Canonical Resources)
  // ============================================================

  // 2.1 cgag://controls
  server.resource(
    "cgag-controls",
    "cgag://controls",
    async (uri) => {
      const { text, mimeType } = await resolveMcpResource(uri.href, context);
      return { contents: [{ uri: uri.href, text, mimeType }] };
    }
  );

  // 2.2 cgag://policies
  server.resource(
    "cgag-policies",
    "cgag://policies",
    async (uri) => {
      const { text, mimeType } = await resolveMcpResource(uri.href, context);
      return { contents: [{ uri: uri.href, text, mimeType }] };
    }
  );

  // 2.3 cgag://ledger
  server.resource(
    "cgag-ledger",
    "cgag://ledger",
    async (uri) => {
      const { text, mimeType } = await resolveMcpResource(uri.href, context);
      return { contents: [{ uri: uri.href, text, mimeType }] };
    }
  );

  // 2.4 cgag://ledger/{blockHeight}
  server.resource(
    "cgag-ledger-block",
    new ResourceTemplate("cgag://ledger/{blockHeight}", { list: undefined }),
    async (uri) => {
      const { text, mimeType } = await resolveMcpResource(uri.href, context);
      return { contents: [{ uri: uri.href, text, mimeType }] };
    }
  );

  // 2.5 cgag://evidence
  server.resource(
    "cgag-evidence",
    "cgag://evidence",
    async (uri) => {
      const { text, mimeType } = await resolveMcpResource(uri.href, context);
      return { contents: [{ uri: uri.href, text, mimeType }] };
    }
  );

  // 2.6 cgag://evidence/{id}
  server.resource(
    "cgag-evidence-record",
    new ResourceTemplate("cgag://evidence/{id}", { list: undefined }),
    async (uri) => {
      const { text, mimeType } = await resolveMcpResource(uri.href, context);
      return { contents: [{ uri: uri.href, text, mimeType }] };
    }
  );

  // 2.7 cgag://tenant
  server.resource(
    "cgag-tenant",
    "cgag://tenant",
    async (uri) => {
      const { text, mimeType } = await resolveMcpResource(uri.href, context);
      return { contents: [{ uri: uri.href, text, mimeType }] };
    }
  );

  // ============================================================
  // 3. PROMPTS REGISTRATION (4 Canonical Prompts)
  // ============================================================

  // 3.1 executive_governance_review
  server.prompt(
    "executive_governance_review",
    "Guides an AI agent to generate an executive-level AI governance memo.",
    {
      targetDir: z.string().optional().describe("Directory or repo to audit")
    },
    async (args) => {
      const messages = await resolveMcpPrompt("executive_governance_review", args);
      return { messages: messages as any };
    }
  );

  // 3.2 ciso_security_review
  server.prompt(
    "ciso_security_review",
    "Guides an AI agent to review shadow AI, excessive permissions, and destructive capabilities.",
    {
      targetDir: z.string().optional().describe("Directory or repo to audit")
    },
    async (args) => {
      const messages = await resolveMcpPrompt("ciso_security_review", args);
      return { messages: messages as any };
    }
  );

  // 3.3 dpo_privacy_review
  server.prompt(
    "dpo_privacy_review",
    "Guides an AI agent to inspect PII lineage, sensitive data access, and LGPD/EU AI Act compliance.",
    {
      targetDir: z.string().optional().describe("Directory or repo to audit")
    },
    async (args) => {
      const messages = await resolveMcpPrompt("dpo_privacy_review", args);
      return { messages: messages as any };
    }
  );

  // 3.4 vendor_risk_assessment
  server.prompt(
    "vendor_risk_assessment",
    "Guides an AI agent to audit a third-party AI system or vendor codebase.",
    {
      targetDir: z.string().optional().describe("Directory or repo to audit"),
      vendorName: z.string().optional().describe("Vendor name")
    },
    async (args) => {
      const messages = await resolveMcpPrompt("vendor_risk_assessment", args);
      return { messages: messages as any };
    }
  );

  return server;
}

export async function runStdio() {
  const isDev = process.env.CGAG_MCP_DEV_MODE === 'true';
  const server = createUniversalMcpServer({ isDevModeAllowed: isDev });
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`[ComplyPRO Universal MCP] Stdio Transport active and listening (Mode: ${isDev ? 'DEV_FALLBACK' : 'PRODUCTION_AUTHENTICATED'}).`);
}

export interface SseSessionEntry {
  sessionId: string;
  transport: SSEServerTransport;
  server: McpServer;
  createdAt: number;
}

export const sseSessions = new Map<string, SseSessionEntry>();

export function createSseApp() {
  const app = express();

  app.get('/sse', async (req, res) => {
    const authHeader = req.headers.authorization || (req.query.token as string);
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
    const isDev = process.env.CGAG_MCP_DEV_MODE === 'true';

    const sessionId = (req.query.sessionId as string) || (req.headers['x-session-id'] as string) || `sse-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const server = createUniversalMcpServer({ authToken: token, isDevModeAllowed: isDev });
    const transport = new SSEServerTransport(`/message?sessionId=${encodeURIComponent(sessionId)}`, res);

    const sessionEntry: SseSessionEntry = {
      sessionId,
      transport,
      server,
      createdAt: Date.now()
    };
    sseSessions.set(sessionId, sessionEntry);

    res.on('close', () => {
      sseSessions.delete(sessionId);
    });

    await server.connect(transport);
  });

  app.post('/message', express.json(), async (req, res) => {
    const sessionId = (req.query.sessionId as string) || (req.headers['x-session-id'] as string);
    if (!sessionId) {
      return res.status(400).json({
        ok: false,
        error: { code: 'INVALID_REQUEST', message: 'Parâmetro sessionId é obrigatório para envio de mensagens SSE.' }
      });
    }

    const sessionEntry = sseSessions.get(sessionId);
    if (!sessionEntry) {
      return res.status(404).json({
        ok: false,
        error: { code: 'RESOURCE_NOT_FOUND', message: `Sessão SSE '${sessionId}' não encontrada ou já encerrada.` }
      });
    }

    await sessionEntry.transport.handlePostMessage(req, res);
  });

  return app;
}

export async function runSse(port = 3001) {
  const app = createSseApp();
  app.listen(port, () => {
    console.error(`[ComplyPRO Universal MCP] Streamable HTTP/SSE listening on port ${port}`);
  });
}

// Execution entrypoint
const mode = (process.env.TRANSPORT_MODE || 'stdio').toLowerCase();
if (process.env.NODE_ENV !== 'test' && !process.env.VITEST) {
  if (mode === 'sse') {
    runSse();
  } else {
    runStdio();
  }
}
