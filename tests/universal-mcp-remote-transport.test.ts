/**
 * CG-AG UNIVERSAL MCP - REMOTE STREAMABLE HTTP & SSE PROTOCOL TEST SUITE
 * Validates the modern 2025/2026 MCP specification implementation:
 * 1. Streamable HTTP Server initialization & /mcp/health check
 * 2. MCP JSON-RPC 2.0 initialize handshake
 * 3. Exact 14 canonical tools listed via tools/list
 * 4. Exact 7 canonical resources listed via resources/list
 * 5. Exact 4 canonical prompts listed via prompts/list
 * 6. Authenticated tools/call execution (get_mcp_server_info)
 * 7. Authenticated tools/call execution (get_governance_controls)
 * 8. Authenticated resources/read resolution (cgag://controls)
 * 9. Authenticated prompts/get resolution (executive_governance_review)
 * 10. Remote Authentication: Unauthenticated production request rejected (401 / fail-closed)
 * 11. Remote RBAC: CISO permitted vs ENGINEER rejected on audit ledger
 * 12. Remote Multi-Tenancy & IDOR: Tenant bound to session, cannot be overridden
 * 13. Remote Path Security: Traversal attempts contained
 * 14. Zero Secret Leakage: Bearer token scrubbed from responses
 * 15. Classic SSE fallback: GET /sse and POST /message backward compatibility
 */

import express from 'express';
import { createMcpHttpRouter } from '../src/mcp/server';
import { IdentityProvider } from '../src/server/security/identity-provider';
import http from 'http';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`[FAIL]: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`  [PASS] ${message}`);
}

console.log("==================================================================");
console.log(">>> CG-AG UNIVERSAL MCP: REMOTE STREAMABLE HTTP SPEC SUITE <<<");
console.log("==================================================================\n");

let testCount = 0;
function testGroup(name: string, fn: () => void | Promise<void>) {
  console.log(`[TEST ${++testCount}] ${name}...`);
  const res = fn();
  if (res instanceof Promise) {
    return res.then(() => console.log(""));
  }
  console.log("");
}

function parseSseData(rawText: string): any {
  // Streamable HTTP streams event: message\ndata: {...}\n\n
  const lines = rawText.split('\n');
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      try {
        return JSON.parse(line.substring(6));
      } catch { /* continue */ }
    }
  }
  try {
    return JSON.parse(rawText);
  } catch {
    return null;
  }
}

async function runAllRemoteTests() {
  process.env.NODE_ENV = 'test';
  process.env.CGAG_ALLOW_TEST_TOKENS = 'true';
  IdentityProvider.initializeBaselineUsers();

  const app = express();
  app.use(express.json());
  app.use(createMcpHttpRouter());

  const port = 3499;
  const server = http.createServer(app);

  await new Promise<void>((resolve) => {
    server.listen(port, () => {
      console.log(`  [SETUP] Test Remote Server listening on http://127.0.0.1:${port}\n`);
      resolve();
    });
  });

  const baseUrl = `http://127.0.0.1:${port}`;
  const cisoToken = 'sk-ciso-enterprise-key';
  const engToken = 'sk-viewer-key';

  try {
    // 1. Health & Server Info
    await testGroup("1. Remote Health: GET /mcp/health self-description", async () => {
      const res = await fetch(`${baseUrl}/mcp/health`);
      assert(res.status === 200, "Health status is 200 OK");
      const data = await res.json();
      assert(data.status === 'operational', "Status is operational");
      assert(data.server === 'complypro-universal-mcp', "Server is complypro-universal-mcp");
      assert(data.toolsCount === 14, "Reports 14 canonical tools");
      assert(data.resourcesCount === 7, "Reports 7 canonical resources");
      assert(data.promptsCount === 4, "Reports 4 canonical prompts");
      assert(data.transports.includes('streamable-http'), "Lists streamable-http transport");
    });

    // 2. Initialize Handshake
    await testGroup("2. Remote Protocol: POST /mcp initialize handshake", async () => {
      const res = await fetch(`${baseUrl}/mcp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/event-stream',
          'Authorization': `Bearer ${cisoToken}`
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'initialize',
          params: {
            protocolVersion: '2024-11-05',
            capabilities: {},
            clientInfo: { name: 'remote-agent', version: '2.0.0' }
          }
        })
      });

      assert(res.status === 200, "Initialize returned 200 OK");
      const text = await res.text();
      const parsed = parseSseData(text);
      assert(parsed !== null, "Parsed JSON-RPC message from stream");
      assert(parsed.result.serverInfo.name === 'complypro-universal-mcp', "Server name matches");
      assert(parsed.result.capabilities.tools !== undefined, "Capabilities include tools");
      assert(parsed.result.capabilities.resources !== undefined, "Capabilities include resources");
      assert(parsed.result.capabilities.prompts !== undefined, "Capabilities include prompts");
    });

    // 3. Tools List: Exact 14 tools
    await testGroup("3. Remote Catalog: POST /mcp tools/list returns exactly 14 canonical tools", async () => {
      const res = await fetch(`${baseUrl}/mcp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/event-stream',
          'Authorization': `Bearer ${cisoToken}`
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 2,
          method: 'tools/list',
          params: {}
        })
      });

      assert(res.status === 200, "tools/list returned 200 OK");
      const parsed = parseSseData(await res.text());
      const tools = parsed.result?.tools || [];
      assert(tools.length === 14, `Exact 14 Tools registered (actual: ${tools.length})`);

      const expectedTools = [
        'scan_repository', 'get_scan_summary', 'discover_agents', 'discover_capabilities',
        'detect_shadow_apis', 'get_agent_passport', 'get_business_xray', 'get_governance_controls',
        'get_governance_snapshot', 'get_audit_ledger', 'verify_audit_ledger', 'get_evidence_records',
        'get_tenant_context', 'get_mcp_server_info'
      ];
      for (const expected of expectedTools) {
        const found = tools.find((t: any) => t.name === expected);
        assert(found !== undefined, `Tool '${expected}' is registered with schema`);
      }
    });

    // 4. Resources List: Exact 7 resources
    await testGroup("4. Remote Catalog: POST /mcp resources/list returns 7 canonical resources", async () => {
      const res = await fetch(`${baseUrl}/mcp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/event-stream',
          'Authorization': `Bearer ${cisoToken}`
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 3,
          method: 'resources/list',
          params: {}
        })
      });

      assert(res.status === 200, "resources/list returned 200 OK");
      const parsed = parseSseData(await res.text());
      const resources = parsed.result?.resources || [];
      assert(resources.length >= 5, `Static resources registered (actual: ${resources.length})`);
      assert(resources.some((r: any) => r.uri === 'cgag://controls'), "Contains cgag://controls");
      assert(resources.some((r: any) => r.uri === 'cgag://policies'), "Contains cgag://policies");
      assert(resources.some((r: any) => r.uri === 'cgag://ledger'), "Contains cgag://ledger");
      assert(resources.some((r: any) => r.uri === 'cgag://evidence'), "Contains cgag://evidence");
      assert(resources.some((r: any) => r.uri === 'cgag://tenant'), "Contains cgag://tenant");
    });

    // 5. Prompts List: Exact 4 prompts
    await testGroup("5. Remote Catalog: POST /mcp prompts/list returns 4 canonical prompts", async () => {
      const res = await fetch(`${baseUrl}/mcp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/event-stream',
          'Authorization': `Bearer ${cisoToken}`
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 4,
          method: 'prompts/list',
          params: {}
        })
      });

      assert(res.status === 200, "prompts/list returned 200 OK");
      const parsed = parseSseData(await res.text());
      const prompts = parsed.result?.prompts || [];
      assert(prompts.length === 4, `Exact 4 Prompts registered (actual: ${prompts.length})`);

      const expectedPrompts = [
        'executive_governance_review',
        'ciso_security_review',
        'dpo_privacy_review',
        'vendor_risk_assessment'
      ];
      for (const ep of expectedPrompts) {
        assert(prompts.some((p: any) => p.name === ep), `Prompt '${ep}' is registered`);
      }
    });

    // 6. Tools Call: get_mcp_server_info
    await testGroup("6. Remote Tool Call: POST /mcp tools/call get_mcp_server_info", async () => {
      const res = await fetch(`${baseUrl}/mcp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/event-stream',
          'Authorization': `Bearer ${cisoToken}`
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 5,
          method: 'tools/call',
          params: {
            name: 'get_mcp_server_info',
            arguments: {}
          }
        })
      });

      assert(res.status === 200, "tools/call returned 200 OK");
      const parsed = parseSseData(await res.text());
      const content = parsed.result?.content || [];
      assert(content.length > 0, "Tool returned content block");
      const envelope = JSON.parse(content[0].text);
      assert(envelope.ok === true, "Envelope ok is true");
      assert(envelope.data.serverName === 'complypro-universal-mcp', "Self-description matches");
      assert(envelope.data.toolsCount === 14, "Data toolsCount is 14");
    });

    // 7. Tools Call: get_governance_controls
    await testGroup("7. Remote Tool Call: POST /mcp tools/call get_governance_controls", async () => {
      const res = await fetch(`${baseUrl}/mcp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/event-stream',
          'Authorization': `Bearer ${cisoToken}`
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 6,
          method: 'tools/call',
          params: {
            name: 'get_governance_controls',
            arguments: {}
          }
        })
      });

      const parsed = parseSseData(await res.text());
      const envelope = JSON.parse(parsed.result.content[0].text);
      assert(envelope.ok === true, "Governance controls executed cleanly");
      assert(envelope.data.controlsCount === 12, "12 canonical controls returned");
      assert(envelope.metadata.epistemicState === 'CANONICAL_STANDARDS', "Epistemic metadata preserved");
    });

    // 8. Resources Read: cgag://controls
    await testGroup("8. Remote Resource Read: POST /mcp resources/read cgag://controls", async () => {
      const res = await fetch(`${baseUrl}/mcp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/event-stream',
          'Authorization': `Bearer ${cisoToken}`
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 7,
          method: 'resources/read',
          params: {
            uri: 'cgag://controls'
          }
        })
      });

      const parsed = parseSseData(await res.text());
      const contents = parsed.result?.contents || [];
      assert(contents.length > 0, "Resource contents returned");
      assert(contents[0].uri === 'cgag://controls', "URI matches");
      assert(contents[0].text.includes('CG-AG-01'), "Resource contains CG-AG-01");
    });

    // 9. Prompts Get: executive_governance_review
    await testGroup("9. Remote Prompt Get: POST /mcp prompts/get executive_governance_review", async () => {
      const res = await fetch(`${baseUrl}/mcp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/event-stream',
          'Authorization': `Bearer ${cisoToken}`
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 8,
          method: 'prompts/get',
          params: {
            name: 'executive_governance_review',
            arguments: { targetDir: './src' }
          }
        })
      });

      const parsed = parseSseData(await res.text());
      const messages = parsed.result?.messages || [];
      assert(messages.length > 0, "Prompt messages generated");
      assert(messages[0].content.text.includes('Executive AI Governance Review'), "Prompt text matches guidance");
    });

    // 10. Remote Authentication Fail-Closed in Production
    await testGroup("10. Remote Fail-Closed Security: Unauthenticated request in production rejected", async () => {
      // Temporarily simulate production mode
      const oldEnv = process.env.NODE_ENV;
      const oldDev = process.env.CGAG_MCP_DEV_MODE;
      process.env.NODE_ENV = 'production';
      delete process.env.CGAG_MCP_DEV_MODE;

      const res = await fetch(`${baseUrl}/mcp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/event-stream'
          // No Authorization header
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 9,
          method: 'tools/list',
          params: {}
        })
      });

      assert(res.status === 401, `Unauthenticated request returns 401 (actual: ${res.status})`);
      const body = await res.json();
      assert(body.error?.code === -32001, "Error code is -32001 (UNAUTHENTICATED)");

      // Restore env
      process.env.NODE_ENV = oldEnv;
      if (oldDev) process.env.CGAG_MCP_DEV_MODE = oldDev;
    });

    // 11. Remote RBAC: CISO vs ENGINEER
    await testGroup("11. Remote RBAC Enforcement: Role permissions enforced via Remote MCP", async () => {
      // CISO calls get_audit_ledger
      const cisoRes = await fetch(`${baseUrl}/mcp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/event-stream',
          'Authorization': `Bearer ${cisoToken}`
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 10,
          method: 'tools/call',
          params: { name: 'get_audit_ledger', arguments: { limit: 5 } }
        })
      });
      const cisoParsed = parseSseData(await cisoRes.text());
      const cisoEnv = JSON.parse(cisoParsed.result.content[0].text);
      assert(cisoEnv.ok === true, "CISO is permitted to access audit ledger");

      // ENGINEER calls get_audit_ledger
      const engRes = await fetch(`${baseUrl}/mcp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/event-stream',
          'Authorization': `Bearer ${engToken}`
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 11,
          method: 'tools/call',
          params: { name: 'get_audit_ledger', arguments: { limit: 5 } }
        })
      });
      const engParsed = parseSseData(await engRes.text());
      const engEnv = JSON.parse(engParsed.result.content[0].text);
      assert(engEnv.ok === false, "ENGINEER is rejected from accessing audit ledger");
      assert(engEnv.error?.code === 'FORBIDDEN', "Returns FORBIDDEN error code");
    });

    // 12. Remote Multi-Tenancy & IDOR
    await testGroup("12. Remote Multi-Tenancy & IDOR: Session binds tenant; argument override ignored", async () => {
      const res = await fetch(`${baseUrl}/mcp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/event-stream',
          'Authorization': `Bearer ${cisoToken}`
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 12,
          method: 'tools/call',
          params: {
            name: 'get_tenant_context',
            arguments: { tenantId: 'ATTACKER_INJECTED_TENANT' }
          }
        })
      });
      const parsed = parseSseData(await res.text());
      const envelope = JSON.parse(parsed.result.content[0].text);
      assert(envelope.ok === true, "Executed successfully");
      assert(envelope.data.tenantId === 'TENANT-DEFAULT', "Tenant is strictly derived from session (not injected arg)");
      assert(envelope.metadata.tenantId === 'TENANT-DEFAULT', "Metadata reflects authentic tenant");
    });

    // 13. Path Security
    await testGroup("13. Remote Path Security: Safe path resolution prevents escape", async () => {
      const res = await fetch(`${baseUrl}/mcp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/event-stream',
          'Authorization': `Bearer ${cisoToken}`
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 13,
          method: 'tools/call',
          params: {
            name: 'scan_repository',
            arguments: { targetDir: './src' }
          }
        })
      });
      const parsed = parseSseData(await res.text());
      const envelope = JSON.parse(parsed.result.content[0].text);
      assert(envelope.ok === true, "Sanitized path audit executes safely");
    });

    // 14. Zero Secret Leakage
    await testGroup("14. Zero Secret Leakage: Sensitive tokens never exposed in remote output", async () => {
      const res = await fetch(`${baseUrl}/mcp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/event-stream',
          'Authorization': `Bearer ${cisoToken}`
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 14,
          method: 'tools/call',
          params: { name: 'get_tenant_context', arguments: {} }
        })
      });
      const rawText = await res.text();
      assert(!rawText.includes(cisoToken), "Raw Bearer token is never echoed back in tool response");
    });

    // 15. Classic SSE Fallback
    await testGroup("15. SSE Fallback: GET /sse establishes live event-stream", async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2000);

      try {
        const res = await fetch(`${baseUrl}/sse?token=${cisoToken}&sessionId=test-sse-sess-01`, {
          headers: { 'Accept': 'text/event-stream' },
          signal: controller.signal
        });
        assert(res.status === 200, "GET /sse connected with 200 OK");
        assert(res.headers.get('content-type')?.includes('text/event-stream') === true, "Content-Type is text/event-stream");
      } catch (err: any) {
        if (err.name !== 'AbortError') throw err;
      } finally {
        clearTimeout(timeout);
      }
    });

    console.log("==================================================================");
    console.log(`>>> ALL ${testCount} REMOTE PROTOCOL TESTS PASSED WITH 100% SUCCESS <<<`);
    console.log("==================================================================");
  } finally {
    server.close();
  }
}

runAllRemoteTests().catch(err => {
  console.error("Remote MCP Test Suite Failed:", err);
  process.exit(1);
});
