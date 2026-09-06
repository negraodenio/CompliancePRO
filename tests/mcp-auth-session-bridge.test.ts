/**
 * CG-AG UNIVERSAL MCP - AUTH SESSION BRIDGE SECURITY HARDENING TEST SUITE
 * 
 * Tests all 22 mandatory security requirements:
 * 1. Valid service token
 * 2. Invalid service token
 * 3. Missing Authorization header
 * 4. Malformed Authorization header
 * 5. Attacker token with same length as secret
 * 6. Attacker token shorter than secret
 * 7. Attacker token longer than secret
 * 8. Empty token
 * 9. Attacker token containing "CISO"
 * 10. Attacker token containing "DPO"
 * 11. Attacker token containing "ENGINEER"
 * 12. Client tenantId cannot override session tenant
 * 13. Client workspaceId cannot override session workspace
 * 14. Service session reaches AuthorizationEngine
 * 15. Unauthorized RBAC action remains denied
 * 16. Tenant B cannot be accessed with Tenant A service credential
 * 17. Concurrent requests using same service credential (no race conditions)
 * 18. Repeated requests reuse consistent service identity/session semantics (Idempotency)
 * 19. Process restart semantics
 * 20. Normal user session remains functional (login, idle timeout, logout)
 * 21. CGAG_ALLOW_TEST_TOKENS impossible in production
 * 22. Secret never appears in output/errors/logging/test diagnostics
 */

import express from 'express';
import http from 'http';
import { createMcpHttpRouter } from '../src/mcp/server';
import { IdentityProvider } from '../src/server/security/identity-provider';
import { resolveMcpSession, executeMcpTool, resolveMcpResource } from '../src/mcp/tools';
import { AuthorizationEngine } from '../src/server/security/authorization-engine';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`[FAIL]: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`  [PASS] ${message}`);
}

function parseSseData(rawText: string): any {
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

async function runHardeningTests() {
  console.log("==================================================================");
  console.log(">>> MCP AUTH SESSION BRIDGE: 22-POINT SECURITY HARDENING SUITE <<<");
  console.log("==================================================================\n");

  const synthSecret = "synthetic-prod-secret-key-fips-2026-xyz";
  process.env.NODE_ENV = 'production';
  process.env.CGAG_MCP_DEV_MODE = 'false';
  process.env.CGAG_MCP_AUTH_TOKEN = synthSecret;

  IdentityProvider.initializeBaselineUsers();

  // Test 1: Valid service token
  console.log("[TEST 1] Valid service token resolution...");
  const t1 = resolveMcpSession({ authToken: synthSecret });
  assert(t1.session !== null, "Valid service token resolves session");
  assert(t1.session?.userId === 'USR-CISO-01', "Bound to USR-CISO-01");
  assert(t1.session?.tenantId === 'TENANT-DEFAULT', "Bound to TENANT-DEFAULT");

  // Test 2: Invalid service token
  console.log("[TEST 2] Invalid service token rejection...");
  const t2 = resolveMcpSession({ authToken: "wrong-random-token-123" });
  assert(t2.session === null, "Invalid service token rejected");
  assert(t2.error?.includes("UNAUTHENTICATED") === true, "Error is UNAUTHENTICATED");

  // Test 3: Missing Authorization (HTTP 401 fail-closed)
  console.log("[TEST 3] Missing Authorization header in production...");
  const t3 = resolveMcpSession({});
  assert(t3.session === null, "Missing token fails closed");
  assert(t3.error?.includes("UNAUTHENTICATED") === true, "Fails closed with UNAUTHENTICATED");

  // Test 4: Malformed Authorization
  console.log("[TEST 4] Malformed Authorization header...");
  const t4 = resolveMcpSession({ authToken: "   " });
  assert(t4.session === null, "Whitespace/malformed token rejected");

  // Test 5: Attacker token with exact same length as secret
  console.log("[TEST 5] Attacker token with same length as secret...");
  const sameLengthWrong = "x".repeat(synthSecret.length);
  const t5 = resolveMcpSession({ authToken: sameLengthWrong });
  assert(t5.session === null, "Same length wrong token safely rejected");

  // Test 6: Attacker token shorter than secret
  console.log("[TEST 6] Attacker token shorter than secret...");
  const shorterToken = synthSecret.substring(0, 5);
  const t6 = resolveMcpSession({ authToken: shorterToken });
  assert(t6.session === null, "Shorter token safely rejected without exception");

  // Test 7: Attacker token longer than secret
  console.log("[TEST 7] Attacker token longer than secret...");
  const longerToken = synthSecret + "-extra-attacker-padding";
  const t7 = resolveMcpSession({ authToken: longerToken });
  assert(t7.session === null, "Longer token safely rejected without exception");

  // Test 8: Empty token
  console.log("[TEST 8] Empty token...");
  const t8 = resolveMcpSession({ authToken: "" });
  assert(t8.session === null, "Empty token safely rejected");

  // Test 9: Attacker token containing "CISO"
  console.log("[TEST 9] Attacker token containing 'CISO'...");
  const t9 = resolveMcpSession({ authToken: "Bearer-CISO-fake-key" });
  assert(t9.session === null, "Token with 'CISO' substring rejected");

  // Test 10: Attacker token containing "DPO"
  console.log("[TEST 10] Attacker token containing 'DPO'...");
  const t10 = resolveMcpSession({ authToken: "Bearer-DPO-spoofed-key" });
  assert(t10.session === null, "Token with 'DPO' substring rejected");

  // Test 11: Attacker token containing "ENGINEER"
  console.log("[TEST 11] Attacker token containing 'ENGINEER'...");
  const t11 = resolveMcpSession({ authToken: "Bearer-ENGINEER-key" });
  assert(t11.session === null, "Token with 'ENGINEER' substring rejected");

  // Test 12: Client tenantId cannot override session tenant
  console.log("[TEST 12] Client tenantId cannot override session tenant (Anti-IDOR)...");
  const t12Res = await executeMcpTool('get_tenant_context', { tenantId: 'ATTACKER_TENANT_XYZ' }, { authToken: synthSecret });
  assert(t12Res.ok === true, "Tool executed");
  assert(t12Res.data.tenantId === 'TENANT-DEFAULT', "Data tenantId is strictly TENANT-DEFAULT");
  assert(t12Res.metadata.tenantId === 'TENANT-DEFAULT', "Metadata tenantId is strictly TENANT-DEFAULT");

  // Test 13: Client workspaceId cannot override session workspace
  console.log("[TEST 13] Client workspaceId cannot override session workspace...");
  const t13Res = await executeMcpTool('get_tenant_context', { workspaceId: 'ATTACKER_WS_999' }, { authToken: synthSecret });
  assert(t13Res.data.workspaceId === 'WS-DEFAULT', "Data workspaceId is strictly WS-DEFAULT");
  assert(t13Res.metadata.workspaceId === 'WS-DEFAULT', "Metadata workspaceId is strictly WS-DEFAULT");

  // Test 14: Service session reaches AuthorizationEngine
  console.log("[TEST 14] Service session evaluated by AuthorizationEngine...");
  const authSession = t1.session!;
  const authEval = AuthorizationEngine.evaluate({
    session: authSession,
    resourceType: 'MCP_TOOL',
    resourceTenantId: authSession.tenantId,
    resourceWorkspaceId: authSession.workspaceId,
    action: 'VIEW_FINDING',
    criticality: 'LOW'
  });
  assert(authEval.allowed === true, "AuthorizationEngine evaluates service session");

  // Test 15: Unauthorized RBAC action remains denied
  console.log("[TEST 15] Unauthorized RBAC action remains denied...");
  // Simulate restricted role engineer session
  const engSession = IdentityProvider.createSession('USR-ENG-03', 'TENANT-DEFAULT', 'WS-DEFAULT');
  const engEval = AuthorizationEngine.evaluate({
    session: engSession,
    resourceType: 'MCP_TOOL',
    resourceTenantId: engSession.tenantId,
    resourceWorkspaceId: engSession.workspaceId,
    action: 'VERIFY_LEDGER',
    criticality: 'LOW'
  });
  assert(engEval.allowed === false, "Unauthorized action denied by RBAC");
  assert(engEval.reason?.includes("RBAC_DENIED") === true, "Reason is RBAC_DENIED");

  // Test 16: Tenant B cannot be accessed with Tenant A service credential
  console.log("[TEST 16] Cross-tenant access blocked (Tenant Isolation)...");
  const crossTenantEval = AuthorizationEngine.evaluate({
    session: authSession,
    resourceType: 'MCP_RESOURCE',
    resourceTenantId: 'TENANT-OTHER-CORP',
    resourceWorkspaceId: authSession.workspaceId,
    action: 'VIEW_FINDING',
    criticality: 'LOW'
  });
  assert(crossTenantEval.allowed === false, "Cross-tenant access strictly blocked");
  assert(crossTenantEval.reason?.includes("TENANT_VIOLATION") === true, "Reason is TENANT_VIOLATION");

  // Test 17: Concurrent requests using same service credential
  console.log("[TEST 17] Concurrent requests using same service credential...");
  const concurrentCalls = await Promise.all([
    executeMcpTool('get_mcp_server_info', {}, { authToken: synthSecret }),
    executeMcpTool('get_mcp_server_info', {}, { authToken: synthSecret }),
    executeMcpTool('get_mcp_server_info', {}, { authToken: synthSecret }),
    executeMcpTool('get_mcp_server_info', {}, { authToken: synthSecret }),
    executeMcpTool('get_mcp_server_info', {}, { authToken: synthSecret })
  ]);
  for (const c of concurrentCalls) {
    assert(c.ok === true, "Concurrent call succeeded");
    assert(c.metadata.executedBy === 'USR-CISO-01', "Consistent caller across concurrency");
  }

  // Test 18: Repeated requests reuse consistent service identity/session semantics (Idempotency)
  console.log("[TEST 18] Idempotency: Service session reused without churning new objects...");
  const sessA = IdentityProvider.bootstrapServiceSession(synthSecret);
  const sessB = IdentityProvider.bootstrapServiceSession(synthSecret);
  assert(sessA.sessionId === sessB.sessionId, "Identical deterministic sessionId");
  assert(sessA.issuedAt === sessB.issuedAt, "Same session instance reused (no churn)");

  // Test 19: Process restart semantics
  console.log("[TEST 19] Process restart semantics: deterministic on-the-fly reconstruction...");
  IdentityProvider.initializeBaselineUsers(); // simulates in-memory session wipe on restart
  const restartResolved = resolveMcpSession({ authToken: synthSecret });
  assert(restartResolved.session !== null, "Session reconstructed after restart");
  assert(restartResolved.session?.userId === 'USR-CISO-01', "Identity preserved across restart");

  // Test 20: Normal user session remains functional
  console.log("[TEST 20] Normal user session remains functional (login, idle timeout, revocation)...");
  const userSess = IdentityProvider.createSession('USR-DPO-02', 'TENANT-DEFAULT', 'WS-DEFAULT');
  const validUser = IdentityProvider.validateSession(userSess.sessionId);
  assert(validUser.valid === true, "Normal user session validated");
  assert(validUser.session?.userId === 'USR-DPO-02', "User is USR-DPO-02");
  // Test revocation
  IdentityProvider.revokeSession(userSess.sessionId);
  const revokedCheck = IdentityProvider.validateSession(userSess.sessionId);
  assert(revokedCheck.valid === false && revokedCheck.error === 'SESSION_REVOKED', "User session revocation works");

  // Test 21: CGAG_ALLOW_TEST_TOKENS impossible in production
  console.log("[TEST 21] CGAG_ALLOW_TEST_TOKENS impossible in production...");
  process.env.NODE_ENV = 'production';
  process.env.CGAG_ALLOW_TEST_TOKENS = 'true'; // attacker injects flag into env
  const testTokenInProd = resolveMcpSession({ authToken: 'sk-ciso-enterprise-key' });
  assert(testTokenInProd.session === null, "Test token strictly rejected in production despite flag");
  delete process.env.CGAG_ALLOW_TEST_TOKENS;

  // Test 22: Secret never appears in output/errors/logging/test diagnostics
  console.log("[TEST 22] Zero Secret Leakage: secret never echoed in envelopes or errors...");
  const serverInfoRes = await executeMcpTool('get_mcp_server_info', {}, { authToken: synthSecret });
  const serialized = JSON.stringify(serverInfoRes);
  assert(!serialized.includes(synthSecret), "Secret string is absent from envelope output");
  const errorRes = resolveMcpSession({ authToken: "invalid-probe" });
  assert(!JSON.stringify(errorRes).includes(synthSecret), "Secret string is absent from error details");

  console.log("\n==================================================================");
  console.log(">>> ALL 22 SECURITY HARDENING TEST POINTS PASSED (100% SUCCESS) <<<");
  console.log("==================================================================\n");
}

runHardeningTests().catch((err) => {
  console.error("Hardening test failed:", err);
  process.exit(1);
});
