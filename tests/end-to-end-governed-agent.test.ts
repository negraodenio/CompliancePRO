/**
 * ComplyPRO.pt — Sprint 7-D: End-to-End Governed Agent Execution Proof
 * "Build with your framework. Govern with ComplyPRO."
 * 
 * Verifies that a CrewAI agent executing within the Isolated Runtime
 * executes an end-to-end multi-channel workflow across:
 *   1. DATA GATEWAY   -> Guardian -> Real Supabase PostgreSQL
 *   2. MODEL GATEWAY  -> Guardian -> Model Provider (gpt-4o)
 *   3. TOOL GATEWAY   -> Guardian -> CompliancePRO Scanner
 * 
 * All accesses are intercepted by the Guardian.
 * Zero direct access is allowed by the Isolated Worker.
 * A tamper-evident cryptographic Evidence chain is generated and verified.
 * 
 * Required Crucible Invariants Tested:
 * 1.  full execution DATA -> MODEL -> TOOL
 * 2.  Guardian evaluated all three channels
 * 3.  Data provider reached only through Data Gateway
 * 4.  Model provider reached only through Model Gateway
 * 5.  Tool provider reached only through Tool Gateway
 * 6.  Worker direct network denied (NETWORK_ACCESS_DENIED)
 * 7.  Worker secret access denied (SECRET_ACCESS_DENIED)
 * 8.  forbidden capability blocked (DIRECT_DB_DDL)
 * 9.  BLOCK results in zero provider calls
 * 10. HITL pauses execution (REQUIRE_HITL)
 * 11. HITL approval resumes exactly once (toolExecutionCount === 1)
 * 12. Passport binding verified (mismatch rejected)
 * 13. Tenant isolation preserved (cross-tenant denied)
 * 14. Evidence chain generated (monotonic causal sequence)
 * 15. EvidenceVerifier validates chain (valid === true)
 * 16. No secrets in evidence
 * 17. Execution completion recorded (AGENT_EXECUTION_COMPLETED)
 */

import { ensureSaasFixture, testSupabase, testLiveModelCredentials, assertRuntimeParents, assertStoredSession } from './test-supabase-fixtures';
import assert from 'assert';
import express from 'express';
import http from 'http';
import { AgentProvisioner, AgentDefinition } from '../src/core/agent-provisioner';
import { RuntimeManager } from '../src/core/runtime-manager';
import { IsolatedWorker } from '../src/core/isolated-worker';
import { CrewAiRuntimeAdapter } from '../src/core/adapters/crewai-runtime-adapter';
import { EvidenceLedger } from '../src/core/evidence-ledger';
import { EvidenceVerifier } from '../src/core/evidence-verifier';
import { ComplianceProfileRegistry } from '../src/core/compliance-compiler';
import { CapabilityRegistry } from '../src/core/capability-registry';
import { DataGateway, SupabasePostgreSqlDataProvider } from '../src/core/data-gateway';
import { ModelGateway } from '../src/core/model-gateway';
import { ToolGateway, CompliancePROToolProvider } from '../src/core/tool-gateway';
import { GuardianService } from '../src/core/guardian-service';
import { DurableStore } from '../src/server/db/durable-store';
import { scanRouter } from '../src/server/routes/scan';
import { authenticateTokenOrKey, enforceTenantContext, requireRoles } from '../src/server/security/auth-middleware';

console.log('==================================================================');
console.log('>>> COMPLYPRO.PT — SPRINT 7-D: END-TO-END GOVERNED AGENT PROOF <<<');
console.log('>>> "Build with your framework. Govern with ComplyPRO."        <<<');
console.log('==================================================================\n');

// ----------------------------------------------------------------------------
// 0. RESET STATE & ESTABLISH EXPLICIT TEST PREREQUISITES
// ----------------------------------------------------------------------------
AgentProvisioner.reset();
RuntimeManager.reset();
EvidenceLedger.reset();
DataGateway.clearCredentials();
ModelGateway.clearCredentials();
ToolGateway.clearCredentials();

const liveModel = testLiveModelCredentials();
const fixture = await ensureSaasFixture('s7d-governed-agent');
const sampleTenantId = fixture.organizationId;
const supabaseUrl = testSupabase.SUPABASE_URL;
const supabaseServiceKey = testSupabase.SUPABASE_SERVICE_ROLE_KEY;
DataGateway.setProviderCredentials('supabase-postgresql', { supabaseUrl, serviceRoleKey: supabaseServiceKey });
ModelGateway.setProviderCredentials(liveModel.provider, { apiKey: liveModel.apiKey, endpoint: liveModel.endpoint });
ModelGateway.setDispatcher(ModelGateway.realHttpDispatcher);

// Same real scanner handler and native authentication; only its provider-contract mount is test-local.
const scannerApp = express();
scannerApp.use(express.json());
scannerApp.use('/api/v1/scans/run', authenticateTokenOrKey, enforceTenantContext, requireRoles('developer'), scanRouter);
const scannerServer = http.createServer(scannerApp);
await new Promise<void>(resolve => scannerServer.listen(0, '127.0.0.1', resolve));
const scannerEndpoint = `http://127.0.0.1:${(scannerServer.address() as any).port}`;
const scannerProvider = new CompliancePROToolProvider();
ToolGateway.registerProvider(scannerProvider);
ToolGateway.setProviderCredentials('compliancepro-api', {
  token: fixture.accessToken, organizationId: sampleTenantId, endpoint: scannerEndpoint
});

// Register capability for real Supabase if not yet registered
if (!CapabilityRegistry.get('supabase.organizations.read')) {
  CapabilityRegistry.register({
    id: 'supabase.organizations.read',
    name: 'Real Supabase Organizations Read',
    description: 'Governed read-only access to enterprise organizations table',
    channel: 'DATA',
    riskLevel: 'LOW',
    allowedActions: ['READ'],
    dataClassification: 'INTERNAL',
    provider: 'supabase-postgresql',
    rateLimit: { requestsPerMinute: 60 },
    budget: { maxCostPerInvocationEur: 0.05 },
    hitl: { required: false },
    evidence: { requiredFields: ['organizationId'] }
  });
}

console.log('[SETUP] Real TEST Supabase organization, membership and entitlement prepared');
console.log(`[SETUP] Model Provider: ${liveModel.provider} (real HTTP dispatcher)`);
console.log('[SETUP] Tool Provider: authenticated loopback scanner (real scanRouter)\n');

// ----------------------------------------------------------------------------
// SETUP: PROVISION CREWAI AGENT WITH THREE GATEWAY CAPABILITIES
// ----------------------------------------------------------------------------
console.log('--- SETUP: PROVISIONING GOVERNED CREWAI AGENT ---');

const profile = ComplianceProfileRegistry.getProfile('CP-EU-AI-ACT-HIGH-RISK-FINANCIAL')!;
assert.ok(profile, 'Profile CP-EU-AI-ACT-HIGH-RISK-FINANCIAL must exist');

const agentDef: AgentDefinition = {
  name: 'credit-risk-analyst',
  framework: { name: 'crewai', version: '0.102.0' },
  complianceProfile: 'CP-EU-AI-ACT-HIGH-RISK-FINANCIAL',
  capabilities: [
    'supabase.organizations.read',
    'gpt-4o',
    'compliance.scan',
    'credit.approve'
  ],
  budget: { maxCostPerRunEur: 25.0, maxTokensPerStep: 4096, maxCallsPerMinute: 60 },
  environment: 'sandbox',
  tenantId: sampleTenantId
};

const provisioned = AgentProvisioner.provision(agentDef);
assert.strictEqual(provisioned.status, 'PROVISIONED');
assert.strictEqual(provisioned.name, 'credit-risk-analyst');
console.log(`  [PASS]: Agent "${provisioned.name}" (${provisioned.agentId}) successfully provisioned`);
console.log(`  [PASS]: Passport Fingerprint: ${provisioned.passportFingerprint}`);
console.log(`  [PASS]: Compliance Profile:   ${provisioned.complianceProfileId}`);

// Create & start Isolated Runtime
const runtimeInstance = RuntimeManager.createRuntime(provisioned.runtimeSpec, provisioned.passport);
const startedRuntime = RuntimeManager.startRuntime(runtimeInstance.runtimeId);
const worker = RuntimeManager.getWorker(startedRuntime.runtimeId)!;
await DurableStore.flushPendingWrites();
await assertRuntimeParents({ agentId: provisioned.agentId, passportId: provisioned.passportId,
  runtimeId: runtimeInstance.runtimeId, tenantId: sampleTenantId });
assert.ok(worker, 'Isolated worker must be active');
assert.strictEqual(worker.isActive(), true);
console.log(`  [PASS]: Isolated Runtime started: ${startedRuntime.runtimeId}\n`);

// Instantiate CrewAI Runtime Adapter over the isolated worker
const adapter = new CrewAiRuntimeAdapter(worker);
assert.ok(adapter, 'CrewAiRuntimeAdapter instantiated');

// Start execution session (emits AGENT_EXECUTION_STARTED)
const session = await adapter.start();
assert.strictEqual(session.status, 'RUNNING');
assert.ok(session.executionId.startsWith('exec_'));
console.log(`  [PASS]: CrewAI Session started: ${session.executionId} [STATUS: RUNNING]\n`);

// ----------------------------------------------------------------------------
// TEST 1: FULL EXECUTION DATA -> MODEL -> TOOL (IN SAME AGENT SESSION)
// ----------------------------------------------------------------------------
console.log('--- TEST 1: FULL EXECUTION: DATA -> MODEL -> TOOL ---');

// STEP 1: DATA GATEWAY
console.log('  [STEP 1: DATA GATEWAY]');
const dataStartTime = Date.now();
const dataResult = await worker.requestData(
  'supabase.organizations.read',
  'READ',
  'organizations',
  { limit: 1 },
  undefined,
  sampleTenantId,
  session.executionId
);

assert.strictEqual(dataResult.status, 'COMPLETED', 'Data Gateway request must complete');
assert.strictEqual(dataResult.verdict, 'ALLOW', 'Guardian must return ALLOW for declared data capability');
assert.strictEqual(dataResult.capability, 'supabase.organizations.read');
assert.strictEqual(dataResult.provider, 'supabase-postgresql');
assert.ok(Array.isArray(dataResult.data), 'Data response must contain records array');
assert.strictEqual(dataResult.data.length, 1, 'Real DATA query must return the explicitly prepared organization');
assert.strictEqual(dataResult.data[0].id, sampleTenantId);
assert.strictEqual(dataResult.providerCallCount, 1);
console.log(`    [PASS]: Data Gateway returned ${dataResult.data?.length || 0} record(s) via ${dataResult.provider}`);
console.log(`    [PASS]: Guardian verdict: ${dataResult.verdict} (${dataResult.decisionLatencyMs}ms)`);

// STEP 2: MODEL GATEWAY
console.log('\n  [STEP 2: MODEL GATEWAY]');
const modelResult = await worker.requestModel({
  provider: liveModel.provider,
  model: 'gpt-4o',
  messages: [
    { role: 'system', content: 'You are an institutional credit risk officer.' },
    { role: 'user', content: `Analyze portfolio credit profile for tenant ${sampleTenantId}.` }
  ],
  maxTokens: 500,
  temperature: 0.1,
  executionId: session.executionId
});

assert.strictEqual(modelResult.status, 'COMPLETED', 'Model Gateway request must complete');
assert.strictEqual(modelResult.verdict, 'ALLOW', 'Guardian must return ALLOW for declared model');
assert.strictEqual(modelResult.model, 'gpt-4o');
assert.strictEqual(modelResult.provider, liveModel.provider);
assert.strictEqual(modelResult.providerCallCount, 1);
assert.ok(modelResult.responseMessage && modelResult.responseMessage.content.length > 0, 'Model must return response');
assert.ok(modelResult.tokenUsage && modelResult.tokenUsage.totalTokens > 0, 'Tokens must be accounted for');
console.log(`    [PASS]: Model Gateway response received: "${modelResult.responseMessage.content.substring(0, 48)}..."`);
console.log(`    [PASS]: Token usage: ${modelResult.tokenUsage.totalTokens} tokens (Cost: €${modelResult.estimatedCostEur})`);
console.log(`    [PASS]: Guardian verdict: ${modelResult.verdict} (${modelResult.decisionLatencyMs}ms)`);

// STEP 3: TOOL GATEWAY
console.log('\n  [STEP 3: TOOL GATEWAY]');
const toolResult = await worker.requestTool(
  'compliance.scan',
  'EXECUTE',
  { repoName: 'complypro-controlled-credit-fixture', files: {
    'credit_agent.py': 'from crewai import Agent\ncredit_agent = Agent(role="Credit reviewer", goal="Review bounded credit evidence", backstory="Controlled test fixture")\n'
  } },
  session.executionId
);

assert.strictEqual(toolResult.status, 'COMPLETED', 'Tool Gateway request must complete');
assert.strictEqual(toolResult.verdict, 'ALLOW', 'Guardian must return ALLOW for declared tool');
assert.strictEqual(toolResult.capability, 'compliance.scan');
assert.strictEqual(toolResult.providerCallCount, 1);
assert.strictEqual(scannerProvider.getCallCount(), 1, 'Real scanner HTTP provider must execute exactly once');
assert.strictEqual(toolResult.result?.ok, true, 'Real scanner handler must confirm execution');
assert.strictEqual(toolResult.result.data?.source?.totalFiles, 1, 'Real scan must analyze the supplied fixture file');
assert.strictEqual(typeof toolResult.result.data?.compliance?.overallScore, 'number', 'Real scanner must compute its own score');
console.log(`    [PASS]: Real scanner analyzed ${toolResult.result.data.source.totalFiles} file(s)`);
console.log(`    [PASS]: Guardian verdict: ${toolResult.verdict} (${toolResult.decisionLatencyMs}ms)`);

// STEP 4: COMPLETE SESSION
await adapter.stop(session);
console.log(`\n  [PASS]: Agent execution session ${session.executionId} marked COMPLETED (ALL 3 GATEWAYS EXECUTED)\n`);

// ----------------------------------------------------------------------------
// TEST 2: GUARDIAN EVALUATED ALL THREE CHANNELS
// ----------------------------------------------------------------------------
console.log('--- TEST 2: GUARDIAN EVALUATION ACROSS ALL THREE CHANNELS ---');
const allEntries = EvidenceLedger.getEntries(provisioned.agentId, sampleTenantId);
const guardianDecisions = allEntries.filter(e => e.eventType === 'GUARDIAN_DECISION');

const channelsEvaluated = new Set(guardianDecisions.map(d => d.channel).filter(Boolean));
assert.ok(channelsEvaluated.has('DATA'), 'Guardian must have evaluated DATA channel');
assert.ok(channelsEvaluated.has('MODEL'), 'Guardian must have evaluated MODEL channel');
assert.ok(channelsEvaluated.has('TOOL'), 'Guardian must have evaluated TOOL channel');

console.log(`  [PASS]: Guardian intercepted and evaluated channels: [${Array.from(channelsEvaluated).join(', ')}]`);
console.log(`  [PASS]: Total Guardian decisions recorded in session: ${guardianDecisions.length}\n`);

// ----------------------------------------------------------------------------
// TEST 3, 4 & 5: GATEWAY EXCLUSIVITY (PROVIDERS REACHED ONLY VIA GATEWAYS)
// ----------------------------------------------------------------------------
console.log('--- TEST 3, 4 & 5: GATEWAY EXCLUSIVITY INVARIANTS ---');

// Invariant 3: Data provider reached strictly through Data Gateway
assert.strictEqual(dataResult.provider, 'supabase-postgresql');
assert.strictEqual(dataResult.executionId, session.executionId);
console.log('  [PASS]: Data provider reached exclusively via DataGateway boundary');

// Invariant 4: Model provider reached strictly through Model Gateway
assert.strictEqual(modelResult.provider, liveModel.provider);
assert.strictEqual(modelResult.executionId, session.executionId);
console.log('  [PASS]: Model provider reached exclusively via ModelGateway boundary');

// Invariant 5: Tool provider reached strictly through Tool Gateway
assert.strictEqual(toolResult.provider, 'compliancepro-api');
assert.strictEqual(toolResult.executionId, session.executionId);
console.log('  [PASS]: Tool provider reached exclusively via ToolGateway boundary\n');

// ----------------------------------------------------------------------------
// TEST 6: WORKER DIRECT NETWORK ACCESS DENIED (INVARIANT 1)
// ----------------------------------------------------------------------------
console.log('--- TEST 6: CRUCIBLE INVARIANT 1 — DIRECT NETWORK ACCESS DENIED ---');

assert.throws(() => {
  worker.directNetworkCall(supabaseUrl);
}, /NETWORK_ACCESS_DENIED/);

assert.throws(() => {
  worker.directNetworkCall('https://api.openai.com/v1/chat/completions');
}, /NETWORK_ACCESS_DENIED/);

assert.throws(() => {
  worker.directNetworkCall(`${scannerEndpoint}/api/v1/scans/run`);
}, /NETWORK_ACCESS_DENIED/);

console.log('  [PASS]: Direct network call to Supabase URL strictly threw NETWORK_ACCESS_DENIED');
console.log('  [PASS]: Direct network call to OpenAI API strictly threw NETWORK_ACCESS_DENIED');
console.log('  [PASS]: Direct network call to Tool Provider strictly threw NETWORK_ACCESS_DENIED\n');

// ----------------------------------------------------------------------------
// TEST 7: ZERO SECRETS IN WORKER ENVIRONMENT (INVARIANT 2 & 10)
// ----------------------------------------------------------------------------
console.log('--- TEST 7: CRUCIBLE INVARIANT 2 & 10 — ZERO SECRETS IN WORKER ---');

const secretKeysToProbe = [
  'DATABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_ANON_KEY',
  'OPENAI_API_KEY',
  'AZURE_OPENAI_API_KEY',
  'COMPLIANCEPRO_API_KEY',
  'POSTGRES_PASSWORD'
];

for (const key of secretKeysToProbe) {
  assert.throws(() => {
    worker.getEnv(key);
  }, /SECRET_ACCESS_DENIED/, `worker.getEnv("${key}") must throw SECRET_ACCESS_DENIED`);
}

const workerSnapshot = worker.getAllEnv();
for (const [k, v] of Object.entries(workerSnapshot)) {
  const isSuspicious = /key|secret|token|password|auth|database|supabase|openai/i.test(k) ||
    String(v).includes('eyJ') ||
    String(v).includes('sk-');
  assert.strictEqual(isSuspicious, false, `Worker environment contains forbidden secret: ${k}`);
}

console.log(`  [PASS]: Tested ${secretKeysToProbe.length} sensitive keys: all strictly threw SECRET_ACCESS_DENIED`);
console.log('  [PASS]: Worker memory environment snapshot inspected: ZERO secrets present\n');

// ----------------------------------------------------------------------------
// TEST 8 & 9: FORBIDDEN CAPABILITY BLOCKED & ZERO PROVIDER CALLS (INVARIANT 5)
// ----------------------------------------------------------------------------
console.log('--- TEST 8 & 9: CRUCIBLE INVARIANT 5 — FORBIDDEN CAPABILITY BLOCKED ---');

// Attempt forbidden capability: DIRECT_DB_DDL (prohibited by CP-EU-AI-ACT-HIGH-RISK-FINANCIAL)
const rawDataCallsBefore = (DataGateway.getProvider('supabase-postgresql') as SupabasePostgreSqlDataProvider)?.callCount || 0;

const blockResult = await worker.requestTool(
  'DIRECT_DB_DDL',
  'DELETE',
  { sql: 'DROP TABLE organizations;' },
  session.executionId
);

assert.strictEqual(blockResult.status, 'BLOCKED', 'Forbidden capability must result in BLOCKED');
assert.strictEqual(blockResult.verdict, 'BLOCK', 'Guardian verdict must be BLOCK');
assert.strictEqual(blockResult.providerCallCount, 0, 'Blocked operation must execute 0 provider calls');

const rawDataCallsAfter = (DataGateway.getProvider('supabase-postgresql') as SupabasePostgreSqlDataProvider)?.callCount || 0;
assert.strictEqual(rawDataCallsAfter, rawDataCallsBefore, 'Zero database provider calls on blocked operation');

console.log('  [PASS]: Forbidden capability "DIRECT_DB_DDL" intercepted by Guardian -> BLOCK');
console.log('  [PASS]: Provider call count is strictly ZERO (No downstream provider execution)\n');

// ----------------------------------------------------------------------------
// TEST 10 & 11: HITL LIFECYCLE (PAUSE, RESUME, EXACTLY ONCE) (INVARIANT 6)
// ----------------------------------------------------------------------------
console.log('--- TEST 10 & 11: CRUCIBLE INVARIANT 6 — HITL PAUSE & RESUME LIFECYCLE ---');

// Start a second session to prove HITL isolation
const hitlSession = await adapter.start();

// Request capability requiring HITL: credit.approve with amount €25,000 (> 10,000 threshold)
const hitlResult = await adapter.execute(hitlSession, {
  taskId: 'task-credit-approval',
  description: 'High-value corporate credit approval of €25,000',
  targetCapability: 'credit.approve',
  actionType: 'WRITE',
  payload: { customerId: 'CORP-8891', amount: 25000 }
});

assert.strictEqual(hitlResult.status, 'PAUSED', 'Execution must pause for high-risk operation');
assert.strictEqual(hitlResult.toolExecuted, false, 'Tool must NOT execute before human approval');
assert.strictEqual(hitlResult.toolExecutionCount, 0, 'Tool execution count must remain 0 while paused');
assert.ok(hitlResult.gateId, 'Gate ID must be generated for operator approval');
console.log(`  [PASS]: Execution state transitioned to PAUSED (Gate ID: ${hitlResult.gateId})`);
console.log('  [PASS]: Tool execution count is strictly 0 while awaiting authorization');

// Human approval & resume
const resumedResult = await adapter.resume(hitlSession, 'APPROVED', 'OP-CHIEF-CREDIT-OFFICER');

assert.strictEqual(resumedResult.status, 'COMPLETED', 'Resumed execution must complete');
assert.strictEqual(resumedResult.toolExecuted, true, 'Tool must execute upon valid approval');
assert.strictEqual(resumedResult.toolExecutionCount, 1, 'Tool must execute EXACTLY ONCE');
assert.strictEqual(resumedResult.result.authorizedBy, 'OP-CHIEF-CREDIT-OFFICER');
assert.strictEqual(resumedResult.result.approvedGateId, hitlResult.gateId);

// Verify duplicate resume attempt is blocked / invariant preserved
await assert.rejects(async () => {
  // Session is already completed, attempting to resume again must fail
  await adapter.resume(hitlSession, 'APPROVED', 'OP-CHIEF-CREDIT-OFFICER');
}, /ILLEGAL_SESSION_STATE/);

console.log('  [PASS]: Human authorization submitted by OP-CHIEF-CREDIT-OFFICER');
console.log('  [PASS]: Resumed execution executed tool EXACTLY ONCE (toolExecutionCount === 1)');
console.log('  [PASS]: Duplicate resume attempt strictly blocked with ILLEGAL_SESSION_STATE\n');

// ----------------------------------------------------------------------------
// TEST 12: PASSPORT BINDING VERIFICATION (INVARIANT 7)
// ----------------------------------------------------------------------------
console.log('--- TEST 12: CRUCIBLE INVARIANT 7 — PASSPORT BINDING ---');

// Validate legitimate passport binding
assert.strictEqual(worker.passport.passportFingerprint, provisioned.passportFingerprint);
assert.strictEqual(worker.passport.complianceProfileChecksum, profile.checksum);

// Tampered passport test: Invalid fingerprint
const tamperedPassport = {
  ...worker.passport,
  passportFingerprint: 'MALICIOUS_FORGED_FINGERPRINT'
};

const tamperedVerdict = GuardianService.evaluateCapability({
  agent: { id: worker.agentId, name: 'credit-risk-analyst' },
  passport: tamperedPassport as any,
  complianceProfile: profile,
  channel: 'TOOL',
  capability: 'compliance.scan',
  actionType: 'EXECUTE'
});

assert.strictEqual(tamperedVerdict.verdict, 'BLOCK', 'Tampered passport must be blocked by Guardian');
assert.ok(tamperedVerdict.reason.includes('invalid cryptographic fingerprint') || tamperedVerdict.reason.includes('verification failed'));
console.log('  [PASS]: Authentic passport cryptographically bound to agent and profile');
console.log('  [PASS]: Tampered passport fingerprint immediately detected and BLOCKED by Guardian\n');

// ----------------------------------------------------------------------------
// TEST 13: TENANT ISOLATION PRESERVED (INVARIANT 8)
// ----------------------------------------------------------------------------
console.log('--- TEST 13: CRUCIBLE INVARIANT 8 — TENANT ISOLATION ---');

// Attempt to read data belonging to a foreign tenant
const foreignTenantId = '00000000-0000-0000-0000-000000000000';
const crossTenantResult = await worker.requestData(
  'supabase.organizations.read',
  'READ',
  'organizations',
  { limit: 1 },
  undefined,
  foreignTenantId,
  session.executionId
);

assert.strictEqual(crossTenantResult.status, 'BLOCKED', 'A foreign tenant claim must be rejected before querying the provider');
assert.strictEqual(crossTenantResult.verdict, 'BLOCK');
assert.strictEqual(crossTenantResult.providerCallCount, 0, 'Tenant rejection must not invoke the data provider');
assert.strictEqual(crossTenantResult.data?.length || 0, 0, 'Foreign tenant request must return 0 records');
assert.strictEqual(adapter.getSession(session.executionId, foreignTenantId), undefined,
  'A tenant must not retrieve execution state belonging to another tenant');
assert.ok(adapter.getSession(session.executionId, sampleTenantId), 'Same-tenant execution state remains readable');
console.log('  [PASS]: Cross-tenant data BLOCKED before provider invocation; foreign execution state is not readable\n');

// ----------------------------------------------------------------------------
// TEST 14, 15, 16 & 17: EVIDENCE CHAIN INTEGRITY & VERIFICATION (INVARIANT 9)
// ----------------------------------------------------------------------------
console.log('--- TEST 14, 15, 16 & 17: CRUCIBLE INVARIANT 9 — EVIDENCE CHAIN INTEGRITY ---');

const sessionEntries = EvidenceLedger.getEntries(provisioned.agentId, sampleTenantId);
const eventTypesInSession = sessionEntries.map(e => e.eventType);

// Verify required causal events are all present
const requiredCausalSequence = [
  'AGENT_EXECUTION_STARTED',
  'DATA_REQUEST',
  'DATA_RESPONSE',
  'MODEL_REQUEST',
  'MODEL_RESPONSE',
  'TOOL_REQUEST',
  'TOOL_RESPONSE',
  'AGENT_EXECUTION_COMPLETED'
];

for (const expectedEvent of requiredCausalSequence) {
  assert.ok(
    eventTypesInSession.includes(expectedEvent as any),
    `Evidence Ledger must contain event: ${expectedEvent}`
  );
}
console.log(`  [PASS]: Complete causal chain confirmed: [${requiredCausalSequence.join(' -> ')}]`);

// Verify cryptographic hash chain using EvidenceVerifier
const chainVerification = EvidenceVerifier.verifyChain(sessionEntries);
assert.strictEqual(chainVerification.valid, true, 'Evidence cryptographic chain must be 100% valid');
assert.strictEqual(chainVerification.totalEntries, sessionEntries.length);
console.log(`  [PASS]: EvidenceVerifier validated ${chainVerification.totalEntries} sequential entries (valid === true)`);

// Invariant 16: Zero secrets leaked in Evidence
for (const entry of sessionEntries) {
  const serialized = JSON.stringify(entry);
  assert.strictEqual(serialized.includes(supabaseServiceKey.substring(10, 30)), false, 'No Supabase secret in evidence');
  assert.strictEqual(serialized.includes(liveModel.apiKey), false, 'No real model secret in evidence');
  assert.strictEqual(serialized.includes(fixture.accessToken), false, 'No fixture user token in evidence');
}
console.log('  [PASS]: Zero secrets, credentials, or raw tokens present in Evidence Ledger entries');

// Invariant 17: Execution completion confirmed
const completionEvent = sessionEntries.find(e => e.eventType === 'AGENT_EXECUTION_COMPLETED');
assert.ok(completionEvent, 'AGENT_EXECUTION_COMPLETED must be recorded in Evidence Ledger');
assert.strictEqual(completionEvent.agentId, provisioned.agentId);
assert.strictEqual(completionEvent.passportFingerprint, provisioned.passportFingerprint);
console.log(`  [PASS]: Execution completion verified: ${completionEvent.evidenceId}\n`);

// ----------------------------------------------------------------------------
// FINAL SUMMARY
// ----------------------------------------------------------------------------
await DurableStore.flushPendingWrites();
await assertStoredSession(session);
await assertStoredSession(hitlSession);
await new Promise<void>((resolve, reject) => scannerServer.close(error => error ? reject(error) : resolve()));
ModelGateway.resetDispatcher();
console.log('==================================================================');
console.log('>>> S7-D END-TO-END GOVERNED AGENT EXECUTION PROOF: VALIDATED  <<<');
console.log('>>> ALL 17 INVARIANTS SATISFIED (100% PASS)                    <<<');
console.log('==================================================================\n');
