/**
 * R1 — Gateway Failure Authorization Audit: fail-closed regression tests.
 *
 * Verifies that:
 * 1. Genuine success paths still return status COMPLETED + verdict ALLOW (provider executed).
 * 2. Gateway failures (timeout, provider unavailable, malformed response, missing credentials,
 *    dispatch exceptions) NEVER authorize: status FAILED + verdict BLOCK, never COMPLETED+ALLOW.
 * 3. Evidence records failure events with verdict BLOCK (TOOL_ERROR / DATA_ERROR / MODEL_ERROR).
 * 4. Existing controls remain enforced: HITL pause + human approve, undeclared capability BLOCK,
 *    REST auth (401), cross-tenant denial (403).
 * 5. The HITL resume failure path (formerly hardcoded verdict ALLOW) records FAILED + BLOCK.
 * 6. REST invoke endpoints return HTTP 500 ok:false for FAILED executions — never HTTP 200.
 *
 * Local only: 127.0.0.1 HTTP fixture, test fixture credentials, no production infrastructure.
 * Run: NODE_ENV=test node --import tsx --import ./tests/bootstrap-provider-fixtures.ts tests/gateway-failure-closed.test.ts
 */

import http from 'http';
import assert from 'assert';
import { AgentProvisioner } from '../src/core/agent-provisioner';
import { RuntimeManager } from '../src/core/runtime-manager';
import { EvidenceLedger } from '../src/core/evidence-ledger';
import { ToolGateway, ToolProviderAdapter, ToolInvocationContext } from '../src/core/tool-gateway';
import { DataGateway, DataProviderAdapter } from '../src/core/data-gateway';
import { ModelGateway } from '../src/core/model-gateway';
import { CapabilityRegistry } from '../src/core/capability-registry';
import { ComplianceProfileRegistry } from '../src/core/compliance-compiler';
import { createServerApp } from '../src/server/app';

console.log('==================================================================');
console.log('>>> COMPLYPRO.R1: GATEWAY FAILURE CLOSURE REGRESSION TESTS <<<');
console.log('==================================================================\n');

assert.strictEqual(process.env.NODE_ENV, 'test', 'These tests require NODE_ENV=test');

// 1. Reset state
AgentProvisioner.reset();
RuntimeManager.reset();
EvidenceLedger.reset();
ToolGateway.clearCredentials();
ModelGateway.clearCredentials();
ModelGateway.resetDispatcher();

// 2. Providers: one genuine, three failure modes
class R1SuccessProvider implements ToolProviderAdapter {
  public readonly providerId = 'r1-success-provider';
  public async execute(capability: string, action: string): Promise<any> {
    return { executed: true, capability, action, r1: true };
  }
}
class R1TimeoutProvider implements ToolProviderAdapter {
  public readonly providerId = 'r1-timeout-provider';
  public async execute(): Promise<never> {
    throw new Error('PROVIDER_TIMEOUT: upstream did not respond in 2000ms');
  }
}
class R1MalformedProvider implements ToolProviderAdapter {
  public readonly providerId = 'r1-malformed-provider';
  public async execute(): Promise<any> {
    return { ok: false, status: 'FAILED' };
  }
}
class R1FailingDataProvider implements DataProviderAdapter {
  public readonly providerId = 'r1-failing-data';
  public async query(): Promise<never> {
    throw new Error('POSTGRES_CONNECTION_TIMEOUT: 5432 Connection reset by peer');
  }
}

ToolGateway.registerProvider(new R1SuccessProvider());
ToolGateway.registerProvider(new R1TimeoutProvider());
ToolGateway.registerProvider(new R1MalformedProvider());
DataGateway.registerProvider(new R1FailingDataProvider());

// 3. Capabilities (r1-ghost-provider is intentionally never registered)
const toolCaps: Array<{ id: string; provider: string }> = [
  { id: 'r1.ok.tool', provider: 'r1-success-provider' },
  { id: 'r1.fail.tool', provider: 'r1-timeout-provider' },
  { id: 'r1.malformed.tool', provider: 'r1-malformed-provider' },
  { id: 'r1.missing.tool', provider: 'r1-ghost-provider' },
  { id: 'r1.hlt.fail.tool', provider: 'r1-timeout-provider' }
];
for (const cap of toolCaps) {
  CapabilityRegistry.register({
    id: cap.id,
    name: `R1 Capability ${cap.id}`,
    description: 'R1 gateway failure-closure test capability',
    channel: 'TOOL',
    riskLevel: 'LOW',
    allowedActions: ['EXECUTE', 'READ', 'WRITE'],
    dataClassification: 'INTERNAL',
    provider: cap.provider
  });
}
CapabilityRegistry.register({
  id: 'r1.fail.data',
  name: 'R1 Failing Data Capability',
  description: 'R1 gateway failure-closure data capability',
  channel: 'DATA',
  riskLevel: 'LOW',
  allowedActions: ['READ'],
  dataClassification: 'INTERNAL',
  provider: 'r1-failing-data'
});

// 4. Provision governed agent (TENANT-DEFAULT) with test capabilities bound to passport
console.log('[SETUP] Provisioning governed agent for R1 audit...');
const profile = ComplianceProfileRegistry.getProfile('CP-EU-AI-ACT-HIGH-RISK-FINANCIAL');
assert.ok(profile, 'CP-EU-AI-ACT-HIGH-RISK-FINANCIAL profile must exist');

const provision = AgentProvisioner.provision({
  name: 'r1-gateway-failure-audit-agent',
  framework: { name: 'crewai', version: '0.102.0' },
  complianceProfile: 'CP-EU-AI-ACT-HIGH-RISK-FINANCIAL',
  capabilities: ['crm.read_customer', 'credit.approve', 'compliance.scan'],
  budget: { maxCostPerRunEur: 25.0, maxTokensPerStep: 4096, maxCallsPerMinute: 60 },
  environment: 'sandbox' as const,
  tenantId: 'TENANT-DEFAULT'
});

provision.passport.declaredTools = [
  ...(provision.passport.declaredTools || []),
  'r1.ok.tool', 'r1.fail.tool', 'r1.malformed.tool', 'r1.missing.tool', 'r1.hlt.fail.tool', 'r1.fail.data'
];
provision.passport.governedCapabilities = [
  ...(provision.passport.governedCapabilities || []),
  { capability: 'r1.ok.tool', channel: 'TOOL', riskTier: 'LOW' },
  { capability: 'r1.fail.tool', channel: 'TOOL', riskTier: 'LOW' },
  { capability: 'r1.malformed.tool', channel: 'TOOL', riskTier: 'LOW' },
  { capability: 'r1.missing.tool', channel: 'TOOL', riskTier: 'LOW' },
  { capability: 'r1.hlt.fail.tool', channel: 'TOOL', riskTier: 'LOW', requiresHitl: true },
  { capability: 'r1.fail.data', channel: 'DATA', riskTier: 'LOW' },
  { capability: 'gpt-4o', channel: 'MODEL', riskTier: 'MEDIUM' }
];
AgentProvisioner.signPassport(provision.passport, provision.agentId);

const runtimeInstance = RuntimeManager.createRuntime(provision.runtimeSpec, provision.passport);
const runtimeId = runtimeInstance.runtimeId;

function toolCtx(capability: string, action: 'EXECUTE' | 'READ' | 'WRITE', executionId: string, payload: any = {}): ToolInvocationContext {
  return {
    agentId: provision.agentId,
    passportId: provision.passportId,
    runtimeId,
    executionId,
    passport: provision.passport,
    capability,
    action,
    payload
  };
}

function assertNeverAuthorized(res: any, label: string) {
  assert.notStrictEqual(res.status, 'COMPLETED', `${label}: failure must not return status COMPLETED`);
  assert.notStrictEqual(res.verdict, 'ALLOW', `${label}: failure must not carry verdict ALLOW`);
}

let passed = 0;
function pass(description: string) {
  passed++;
  console.log(`  [PASS ${passed}]: ${description}`);
}

// ============================================================================
// GROUP A — Gateway failures are fail-closed (FAILED + BLOCK, never ALLOW)
// ============================================================================
console.log('\n[GROUP A] Gateway failure verdicts are fail-closed');

// A1: genuine success path preserved
const okRes = await ToolGateway.invokeTool(toolCtx('r1.ok.tool', 'EXECUTE', 'exec_r1_ok'));
assert.strictEqual(okRes.status, 'COMPLETED');
assert.strictEqual(okRes.verdict, 'ALLOW');
assert.strictEqual(okRes.providerCallCount, 1);
pass('Genuine success still returns COMPLETED + ALLOW with exactly 1 provider call');

// A2: provider timeout
const timeoutRes = await ToolGateway.invokeTool(toolCtx('r1.fail.tool', 'EXECUTE', 'exec_r1_timeout'));
assert.strictEqual(timeoutRes.status, 'FAILED');
assert.strictEqual(timeoutRes.verdict, 'BLOCK');
assert.ok(timeoutRes.error?.includes('PROVIDER_TIMEOUT'), `error must carry PROVIDER_TIMEOUT, got: ${timeoutRes.error}`);
assertNeverAuthorized(timeoutRes, 'provider timeout');
pass('Provider timeout returns FAILED + BLOCK (formerly FAILED + ALLOW)');

// A3: provider unavailable (never registered)
const missingRes = await ToolGateway.invokeTool(toolCtx('r1.missing.tool', 'EXECUTE', 'exec_r1_missing'));
assert.strictEqual(missingRes.status, 'FAILED');
assert.strictEqual(missingRes.verdict, 'BLOCK');
assert.strictEqual(missingRes.providerCallCount, 0);
assert.ok(missingRes.error?.includes('TOOL_PROVIDER_UNAVAILABLE'), `error must carry TOOL_PROVIDER_UNAVAILABLE, got: ${missingRes.error}`);
assertNeverAuthorized(missingRes, 'provider unavailable');
pass('Missing provider returns FAILED + BLOCK with zero provider calls');

// A4: malformed provider response
const malformedRes = await ToolGateway.invokeTool(toolCtx('r1.malformed.tool', 'EXECUTE', 'exec_r1_malformed'));
assert.strictEqual(malformedRes.status, 'FAILED');
assert.strictEqual(malformedRes.verdict, 'BLOCK');
assert.ok(malformedRes.error?.includes('TOOL_PROVIDER_EXECUTION_FAILED'), `error must carry TOOL_PROVIDER_EXECUTION_FAILED, got: ${malformedRes.error}`);
assertNeverAuthorized(malformedRes, 'malformed response');
pass('Malformed provider response returns FAILED + BLOCK');

// A5: data gateway provider failure
const dataFailRes = await DataGateway.invokeData({
  agentId: provision.agentId,
  passportId: provision.passportId,
  runtimeId,
  executionId: 'exec_r1_data_fail',
  passport: provision.passport,
  capability: 'r1.fail.data',
  action: 'READ',
  targetResource: 'records'
});
assert.strictEqual(dataFailRes.status, 'FAILED');
assert.strictEqual(dataFailRes.verdict, 'BLOCK');
assert.ok(dataFailRes.error?.includes('POSTGRES_CONNECTION_TIMEOUT'), `error must carry POSTGRES_CONNECTION_TIMEOUT, got: ${dataFailRes.error}`);
assertNeverAuthorized(dataFailRes, 'data provider failure');
pass('Data gateway provider failure returns FAILED + BLOCK');

// A6: model gateway missing credentials (pre-dispatch failure)
const credsFailRes = await ModelGateway.invokeModel({
  agentId: provision.agentId,
  passportId: provision.passportId,
  runtimeId,
  passport: provision.passport,
  provider: 'openai',
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'R1 audit probe' }]
});
assert.strictEqual(credsFailRes.status, 'FAILED');
assert.strictEqual(credsFailRes.verdict, 'BLOCK');
assert.ok(credsFailRes.error?.includes('PROVIDER_CREDENTIALS_MISSING'), `error must carry PROVIDER_CREDENTIALS_MISSING, got: ${credsFailRes.error}`);
assertNeverAuthorized(credsFailRes, 'missing model credentials');
pass('Model gateway missing credentials returns FAILED + BLOCK');

// A7: model dispatch exception
ModelGateway.setDispatcher(async () => {
  throw new Error('MODEL_UPSTREAM_TIMEOUT: provider did not respond');
});
const modelThrowRes = await ModelGateway.invokeModel({
  agentId: provision.agentId,
  passportId: provision.passportId,
  runtimeId,
  passport: provision.passport,
  provider: 'openai',
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'R1 audit probe throw' }]
});
assert.strictEqual(modelThrowRes.status, 'FAILED');
assert.strictEqual(modelThrowRes.verdict, 'BLOCK');
assert.ok(modelThrowRes.error?.includes('MODEL_EXECUTION_ERROR'), `error must carry MODEL_EXECUTION_ERROR, got: ${modelThrowRes.error}`);
assertNeverAuthorized(modelThrowRes, 'model dispatch exception');
pass('Model dispatch exception returns FAILED + BLOCK');

// A8: model genuine success preserved
ModelGateway.setDispatcher(async () => ({
  content: 'R1 governed output',
  usage: { promptTokens: 3, completionTokens: 5, totalTokens: 8 }
}));
const modelOkRes = await ModelGateway.invokeModel({
  agentId: provision.agentId,
  passportId: provision.passportId,
  runtimeId,
  passport: provision.passport,
  provider: 'openai',
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'R1 audit probe success' }]
});
assert.strictEqual(modelOkRes.status, 'COMPLETED');
assert.strictEqual(modelOkRes.verdict, 'ALLOW');
pass('Genuine model success still returns COMPLETED + ALLOW');
ModelGateway.resetDispatcher();

// A9: evidence records failure events with verdict BLOCK
const entries = EvidenceLedger.getEntries(provision.agentId);
const toolError = entries.find(e => e.eventType === 'TOOL_ERROR' && (e as any).capability === 'r1.fail.tool');
assert.ok(toolError, 'TOOL_ERROR evidence must exist for r1.fail.tool');
assert.strictEqual(toolError!.verdict, 'BLOCK', 'TOOL_ERROR evidence must carry verdict BLOCK');
const dataError = entries.find(e => e.eventType === 'DATA_ERROR' && (e as any).capability === 'r1.fail.data');
assert.ok(dataError, 'DATA_ERROR evidence must exist for r1.fail.data');
assert.strictEqual(dataError!.verdict, 'BLOCK', 'DATA_ERROR evidence must carry verdict BLOCK');
const modelError = entries.find(e => e.eventType === 'MODEL_ERROR');
assert.ok(modelError, 'MODEL_ERROR evidence must exist');
assert.strictEqual(modelError!.verdict, 'BLOCK', 'MODEL_ERROR evidence must carry verdict BLOCK');
const toolResponse = entries.find(e => e.eventType === 'TOOL_RESPONSE');
assert.ok(toolResponse, 'TOOL_RESPONSE evidence must exist for genuine success');
assert.strictEqual(toolResponse!.verdict, 'ALLOW', 'Genuine success evidence still carries verdict ALLOW');
pass('Evidence: all failure events recorded with verdict BLOCK, success evidence retains ALLOW');

// ============================================================================
// GROUP B — Existing authorization controls remain enforced
// ============================================================================
console.log('\n[GROUP B] Authentication, HITL, and least-privilege controls preserved');

// B1: HITL pause with zero provider calls
const hitlRes = await ToolGateway.invokeTool(toolCtx('credit.approve', 'WRITE', 'exec_r1_hitl', { amount: 25000 }));
assert.strictEqual(hitlRes.status, 'PAUSED');
assert.strictEqual(hitlRes.verdict, 'REQUIRE_HITL');
assert.ok(hitlRes.gateId && hitlRes.gateId.startsWith('GATE-'), 'PAUSED response must carry a GATE- gateId');
assert.strictEqual(hitlRes.providerCallCount, 0);
pass('High-risk write still pauses with REQUIRE_HITL and zero provider calls');

// B2: human APPROVE still executes exactly once (genuine success preserved)
const approveRes = await ToolGateway.resumeExecution('exec_r1_hitl', 'APPROVED', 'OP-R1-01');
assert.strictEqual(approveRes.status, 'COMPLETED');
assert.strictEqual(approveRes.verdict, 'ALLOW');
assert.strictEqual(approveRes.providerCallCount, 1);
pass('Human APPROVE still resumes to COMPLETED + ALLOW with exactly 1 provider call');

// B3: undeclared capability still blocked by guardian
const undeclaredRes = await ToolGateway.invokeTool(toolCtx('unauthorized.tool.drain', 'EXECUTE', 'exec_r1_undeclared'));
assert.strictEqual(undeclaredRes.status, 'BLOCKED');
assert.strictEqual(undeclaredRes.verdict, 'BLOCK');
assert.strictEqual(undeclaredRes.providerCallCount, 0);
assert.ok(undeclaredRes.error?.includes('not declared'), `error must carry "not declared", got: ${undeclaredRes.error}`);
pass('Undeclared capability still BLOCKED with zero provider calls');

// B4: HITL resume failure is fail-closed (formerly hardcoded verdict ALLOW)
const resumePauseRes = await ToolGateway.invokeTool(toolCtx('r1.hlt.fail.tool', 'EXECUTE', 'exec_r1_resume_fail'));
assert.strictEqual(resumePauseRes.status, 'PAUSED');
assert.strictEqual(resumePauseRes.verdict, 'REQUIRE_HITL');
const resumeFailRes = await ToolGateway.resumeExecution('exec_r1_resume_fail', 'APPROVED', 'OP-R1-01');
assert.strictEqual(resumeFailRes.status, 'FAILED');
assert.strictEqual(resumeFailRes.verdict, 'BLOCK');
assert.ok(resumeFailRes.error?.includes('PROVIDER_TIMEOUT'), `error must carry PROVIDER_TIMEOUT, got: ${resumeFailRes.error}`);
assertNeverAuthorized(resumeFailRes, 'HITL resume failure');
pass('HITL resume provider failure returns FAILED + BLOCK (formerly hardcoded ALLOW)');

// ============================================================================
// GROUP C — REST boundary: FAILED executions never return HTTP 200 ok:true
// ============================================================================
console.log('\n[GROUP C] REST invoke endpoints fail closed on FAILED executions');

const app = createServerApp();
const server = http.createServer(app);
await new Promise<void>(resolve => server.listen(0, '127.0.0.1', () => resolve()));
const port = (server.address() as any).port;
const baseUrl = `http://127.0.0.1:${port}`;
console.log(`[SETUP]: R1 test server listening on ${baseUrl}`);

async function api(path: string, options: { headers?: Record<string, string>; body?: any } = {}) {
  const res = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    body: JSON.stringify(options.body)
  });
  let json: any = null;
  try { json = await res.json(); } catch { /* non-JSON */ }
  return { status: res.status, json };
}

const developerKey = { 'X-API-Key': 'dev-key-tenant-default' };

try {
  // C1: FAILED tool execution -> HTTP 500 ok:false (formerly HTTP 200 ok:true verdict ALLOW)
  const failInvoke = await api('/api/v1/tools/invoke', {
    headers: developerKey,
    body: toolCtx('r1.fail.tool', 'EXECUTE', 'exec_r1_route_fail')
  });
  assert.strictEqual(failInvoke.status, 500, 'FAILED tool execution must return HTTP 500');
  assert.strictEqual(failInvoke.json.ok, false, 'FAILED tool execution must return ok:false');
  assert.strictEqual(failInvoke.json.status, 'FAILED');
  assert.strictEqual(failInvoke.json.verdict, 'BLOCK');
  assert.ok(String(failInvoke.json.error || '').includes('TOOL_PROVIDER_ERROR'), `body must carry TOOL_PROVIDER_ERROR, got: ${failInvoke.json.error}`);
  pass('POST /api/v1/tools/invoke returns HTTP 500 ok:false verdict BLOCK on FAILED execution');

  // C2: genuine success still HTTP 200 ok:true
  const okInvoke = await api('/api/v1/tools/invoke', {
    headers: developerKey,
    body: toolCtx('r1.ok.tool', 'EXECUTE', 'exec_r1_route_ok')
  });
  assert.strictEqual(okInvoke.status, 200, 'Genuine success must still return HTTP 200');
  assert.strictEqual(okInvoke.json.ok, true);
  assert.strictEqual(okInvoke.json.status, 'COMPLETED');
  assert.strictEqual(okInvoke.json.verdict, 'ALLOW');
  pass('POST /api/v1/tools/invoke still returns HTTP 200 ok:true for genuine success');

  // C3: missing credentials -> 401
  const noAuth = await api('/api/v1/tools/invoke', {
    body: toolCtx('r1.ok.tool', 'EXECUTE', 'exec_r1_route_401')
  });
  assert.strictEqual(noAuth.status, 401, 'Missing API key must return HTTP 401');
  pass('Unauthenticated invoke still returns HTTP 401');

  // C4: cross-tenant passport -> 403 (passport TENANT-DEFAULT vs caller TENANT-A)
  const crossTenant = await api('/api/v1/tools/invoke', {
    headers: { 'X-API-Key': 'dev-key-tenant-a' },
    body: toolCtx('r1.ok.tool', 'EXECUTE', 'exec_r1_route_403')
  });
  assert.strictEqual(crossTenant.status, 403, 'Cross-tenant passport must return HTTP 403');
  assert.ok(String(crossTenant.json?.error || '').includes('CROSS_TENANT_ACCESS_DENIED'));
  pass('Cross-tenant passport invoke still returns HTTP 403');

  // C5: FAILED model execution -> HTTP 500 ok:false (missing credentials path)
  const modelInvoke = await api('/api/v1/models/invoke', {
    headers: developerKey,
    body: {
      agentId: provision.agentId,
      passportId: provision.passportId,
      runtimeId,
      passport: provision.passport,
      provider: 'openai',
      model: 'gpt-4o',
      messages: [{ role: 'user', content: 'R1 route probe' }]
    }
  });
  assert.strictEqual(modelInvoke.status, 500, 'FAILED model execution must return HTTP 500');
  assert.strictEqual(modelInvoke.json.ok, false);
  assert.ok(String(modelInvoke.json.error || '').includes('PROVIDER_CREDENTIALS_MISSING'), `body must carry PROVIDER_CREDENTIALS_MISSING, got: ${modelInvoke.json.error}`);
  pass('POST /api/v1/models/invoke returns HTTP 500 ok:false on FAILED execution');

  // C6: FAILED data query -> HTTP 500 ok:false
  const dataInvoke = await api('/api/v1/data/query', {
    headers: developerKey,
    body: {
      agentId: provision.agentId,
      passportId: provision.passportId,
      runtimeId,
      executionId: 'exec_r1_route_data_fail',
      passport: provision.passport,
      capability: 'r1.fail.data',
      action: 'READ',
      targetResource: 'records'
    }
  });
  assert.strictEqual(dataInvoke.status, 500, 'FAILED data query must return HTTP 500');
  assert.strictEqual(dataInvoke.json.ok, false);
  assert.ok(String(dataInvoke.json.error || '').includes('DATA_PROVIDER_ERROR'), `body must carry DATA_PROVIDER_ERROR, got: ${dataInvoke.json.error}`);
  pass('POST /api/v1/data/query returns HTTP 500 ok:false on FAILED execution');
} finally {
  await new Promise<void>(resolve => server.close(() => resolve()));
}

console.log('\n==================================================================');
console.log(`R1 GATEWAY FAILURE CLOSURE: ALL ${passed} CHECKS PASSED`);
console.log('==================================================================');
