/**
 * CG-AG SECURITY REMEDIATION TEST SUITE
 * Comprehensive standalone verification for P1, P2, P3 security remediations.
 */

import { createSseApp, sseSessions } from '../src/mcp/server';
import { IdentityProvider } from '../src/server/security/identity-provider';
import { resolveMcpSession, resolveMcpResource, executeMcpTool } from '../src/mcp/tools';
import { EvidenceStore } from '../src/web/services/evidence-store';
import { AuditLedgerStore } from '../src/web/services/audit-ledger-store';
import { requireApiKey } from '../src/server/auth';
import { ZIP_LIMITS } from '../src/web/services/zip-reader';
import { ALLOWED_AI_MODELS } from '../src/server/routes/ai';
import { createServerApp } from '../src/server/app';

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string, detail?: string): void {
  if (condition) {
    console.log(`  [PASS] ${label}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${label}${detail ? ': ' + detail : ''}`);
    failed++;
  }
}

function section(title: string): void {
  console.log(`\n[TEST] ${title}`);
}

console.log("==================================================================");
console.log(">>> CG-AG SECURITY REMEDIATION: COMPREHENSIVE SECURITY SUITE <<<");
console.log("==================================================================");

// 1. SEC-P1-01: MCP SSE Session Isolation
section('SEC-P1-01: MCP SSE Session Isolation & Concurrency');
sseSessions.clear();
const sseApp = createSseApp();
assert(sseApp !== undefined, 'createSseApp returns Express application');
assert(sseSessions.size === 0, 'sseSessions initialized with 0 active sessions');

// 2. SEC-P1-02: AI Proxy Protection, Model Allowlist & Rate Limits
section('SEC-P1-02: AI Proxy Protection, Model Allowlist & Rate Limits');
assert(ALLOWED_AI_MODELS.has('deepseek-ai/DeepSeek-V3'), 'DeepSeek-V3 is in model allowlist');
assert(ALLOWED_AI_MODELS.has('Qwen/Qwen2.5-72B-Instruct'), 'Qwen2.5-72B is in model allowlist');
assert(!ALLOWED_AI_MODELS.has('untrusted/malicious-llm-model'), 'Arbitrary model rejected from allowlist');
assert(!ALLOWED_AI_MODELS.has('gpt-4o-arbitrary'), 'GPT-4o rejected from allowlist');

// 3. SEC-P1-03: MCP Test-Token Substring Bypass Removal
section('SEC-P1-03: MCP Test-Token Substring Bypass Removal');
IdentityProvider.initializeBaselineUsers();

const prevEnv = process.env.NODE_ENV;
const prevFlag = process.env.CGAG_ALLOW_TEST_TOKENS;

process.env.NODE_ENV = 'production';
delete process.env.CGAG_ALLOW_TEST_TOKENS;

const resCisoSubstring = resolveMcpSession({ authToken: 'fake-token-with-CISO-inside' });
assert(resCisoSubstring.session === null, 'Arbitrary CISO substring token returns null session');
assert(resCisoSubstring.error?.includes('UNAUTHENTICATED') === true, 'Arbitrary CISO substring rejected with UNAUTHENTICATED');

const resDpo = resolveMcpSession({ authToken: 'my-random-DPO-key' });
assert(resDpo.session === null, 'Arbitrary DPO substring token returns null session');

const resEng = resolveMcpSession({ authToken: 'ENGINEER-untrusted' });
assert(resEng.session === null, 'Arbitrary ENGINEER substring token returns null session');

// Allowed in test mode
process.env.NODE_ENV = 'test';
process.env.CGAG_ALLOW_TEST_TOKENS = 'true';

const resExactTestToken = resolveMcpSession({ authToken: 'sk-ciso-enterprise-key' });
assert(resExactTestToken.session !== null, 'Exact test token allowed in test environment');
assert(resExactTestToken.session?.roles.includes('CISO') === true, 'Test session retains CISO role');

process.env.NODE_ENV = prevEnv;
if (prevFlag) process.env.CGAG_ALLOW_TEST_TOKENS = prevFlag;

// 4. SEC-P1-04: Tenant Partitioning in Evidence & Ledger Stores
section('SEC-P1-04: Tenant Partitioning in Evidence & Ledger Stores');
EvidenceStore.resetToBaseline();
const allRecords = EvidenceStore.getEvidenceRecords('TENANT-ACME');
assert(Array.isArray(allRecords), 'Evidence records returned as array');

const record = EvidenceStore.getRecordById('EV-2026-0042', 'TENANT-ACME');
assert(record !== undefined, 'Baseline record accessible by tenant');
assert(record?.evidenceId === 'EV-2026-0042', 'Evidence ID matches query');

AuditLedgerStore.restoreCanonicalLedger();
const blocks = AuditLedgerStore.getBlocks('TENANT-DEFAULT');
assert(blocks.length > 0, 'Audit blocks partitioned for tenant');

const block = AuditLedgerStore.getBlockByHeight(1, 'TENANT-DEFAULT');
assert(block !== undefined, 'Block height 1 found for tenant');
assert(block?.blockHeight === 1, 'Block height matches');

const missingBlock = AuditLedgerStore.getBlockByHeight(99999, 'TENANT-DEFAULT');
assert(missingBlock === undefined, 'Non-existent block height returns undefined');

// 5. SEC-P2-01: Configurable CORS Policy
section('SEC-P2-01: Configurable CORS Policy');
const serverApp = createServerApp();
assert(serverApp !== undefined, 'createServerApp initializes cleanly with CORS policy');

// 6. SEC-P2-02: Server-Side Logout and Session Invalidation
section('SEC-P2-02: Server-Side Logout and Session Invalidation');
IdentityProvider.initializeBaselineUsers();
const newSession = IdentityProvider.createSession('USR-CISO-01', 'TENANT-DEFAULT', 'WS-DEFAULT');
assert(IdentityProvider.validateSession(newSession.sessionId).valid === true, 'Active session is valid before logout');

IdentityProvider.revokeSession(newSession.sessionId);
const validAfterLogout = IdentityProvider.validateSession(newSession.sessionId);
assert(validAfterLogout.valid === false, 'Session is invalid after revocation');
assert(validAfterLogout.error?.includes('REVOKED') === true, 'Error code is SESSION_REVOKED');

// 7. SEC-P2-03: Defensive Limits for ZIP Decompression
section('SEC-P2-03: Defensive Limits for ZIP Decompression');
assert(ZIP_LIMITS.MAX_TOTAL_UNCOMPRESSED_BYTES === 50 * 1024 * 1024, 'Max cumulative bytes is 50MB');
assert(ZIP_LIMITS.MAX_FILE_COUNT === 1000, 'Max file count is 1000');
assert(ZIP_LIMITS.MAX_SINGLE_FILE_BYTES === 10 * 1024 * 1024, 'Max single file size is 10MB');

// 8. SEC-P3-01: Production Auth Fail-Closed Enforcement
section('SEC-P3-01: Production Auth Fail-Closed Enforcement');
const savedEnv = process.env.NODE_ENV;
const savedKeys = process.env.CODEGUARD_API_KEYS;

process.env.NODE_ENV = 'production';
delete process.env.CODEGUARD_API_KEYS;

let statusCode = 0;
let jsonResponse: any = null;

const mockReq: any = { headers: {} };
const mockRes: any = {
  status: (code: number) => {
    statusCode = code;
    return {
      json: (data: any) => {
        jsonResponse = data;
      }
    };
  }
};
const mockNext = () => {
  statusCode = 200;
};

requireApiKey(mockReq, mockRes, mockNext);

assert(statusCode === 500, 'Fails with HTTP 500 when CODEGUARD_API_KEYS missing in production');
assert(jsonResponse.error === 'SERVER_CONFIGURATION_ERROR', 'Returns SERVER_CONFIGURATION_ERROR code');

process.env.NODE_ENV = 'development';
delete process.env.CODEGUARD_API_KEYS;

let nextCalled = false;
const devReq: any = { headers: {} };
const devRes: any = {};
const devNext = () => {
  nextCalled = true;
};

requireApiKey(devReq, devRes, devNext);
assert(nextCalled === true, 'Allows open development mode when in development environment');

process.env.NODE_ENV = 'test';
if (savedKeys) process.env.CODEGUARD_API_KEYS = savedKeys;

// 9. SEC-MCP-01: MCP Resource RBAC Parity for Audit Ledger
section('SEC-MCP-01: MCP Resource RBAC Parity for Audit Ledger');
const secLeadCtx = { isDevModeAllowed: true }; // role: SECURITY_LEAD (no VERIFY_LEDGER)
const cisoCtx = { authToken: 'sk-ciso-enterprise-key' }; // role: CISO (has VERIFY_LEDGER)

// 9.1 Unauthorized session (SECURITY_LEAD)
const unauthLedgerTool = await executeMcpTool('get_audit_ledger', {}, secLeadCtx);
assert(!unauthLedgerTool.ok && unauthLedgerTool.error?.code === 'FORBIDDEN', 'Tool get_audit_ledger rejected with FORBIDDEN for SECURITY_LEAD');

const unauthVerifyTool = await executeMcpTool('verify_audit_ledger', {}, secLeadCtx);
assert(!unauthVerifyTool.ok && unauthVerifyTool.error?.code === 'FORBIDDEN', 'Tool verify_audit_ledger rejected with FORBIDDEN for SECURITY_LEAD');

let resLedgerDenied = false;
try {
  await resolveMcpResource('cgag://ledger', secLeadCtx);
} catch (err: any) {
  resLedgerDenied = true;
  assert(err.code === 'AUTH_FORBIDDEN' || err.message.includes('permissão'), 'Resource cgag://ledger rejected with AUTH_FORBIDDEN for SECURITY_LEAD');
}
assert(resLedgerDenied, 'Resource cgag://ledger blocked unauthorized access');

let resBlockDenied = false;
try {
  await resolveMcpResource('cgag://ledger/0', secLeadCtx);
} catch (err: any) {
  resBlockDenied = true;
  assert(err.code === 'AUTH_FORBIDDEN' || err.message.includes('permissão'), 'Resource cgag://ledger/0 rejected with AUTH_FORBIDDEN for SECURITY_LEAD');
}
assert(resBlockDenied, 'Resource cgag://ledger/0 blocked unauthorized access');

// 9.2 Authorized session (CISO)
const authLedgerTool = await executeMcpTool('get_audit_ledger', {}, cisoCtx);
assert(authLedgerTool.ok === true && authLedgerTool.data?.blocks?.length > 0, 'Tool get_audit_ledger allowed for CISO');

const authVerifyTool = await executeMcpTool('verify_audit_ledger', {}, cisoCtx);
assert(authVerifyTool.ok === true && authVerifyTool.data?.isChainValid === true, 'Tool verify_audit_ledger allowed for CISO');

let authLedgerResPassed = false;
try {
  const r = await resolveMcpResource('cgag://ledger', cisoCtx);
  const data = JSON.parse(r.text);
  authLedgerResPassed = data.totalBlocks > 0;
} catch (err) {
  authLedgerResPassed = false;
}
assert(authLedgerResPassed, 'Resource cgag://ledger allowed for authorized CISO');

let authBlockResPassed = false;
try {
  const r = await resolveMcpResource('cgag://ledger/0', cisoCtx);
  const data = JSON.parse(r.text);
  authBlockResPassed = data.blockHeight === 0;
} catch (err) {
  authBlockResPassed = false;
}
assert(authBlockResPassed, 'Resource cgag://ledger/0 allowed for authorized CISO');

console.log("\n==================================================================");
console.log(`PASSED: ${passed}`);
console.log(`FAILED: ${failed}`);
console.log("==================================================================");

if (failed > 0) {
  process.exit(1);
} else {
  console.log(">>> ALL SECURITY REMEDIATION TESTS PASSED <<<");
  process.exit(0);
}
