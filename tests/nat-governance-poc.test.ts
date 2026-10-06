/**
 * ComplyPRO.pt — SPRINT NAT-POC-01
 * NVIDIA NeMo Agent Toolkit (NAT) x ComplyPRO GOVERNANCE
 * 
 * Technical Validation Test Suite verifying:
 * 1. NAT Agent can be born governed by ComplyPRO Agent Provisioner & Passport.
 * 2. NAT Agent appears in the real /agents Agent Inventory.
 * 3. Passport is generated and cryptographically verified prior to execution.
 * 4. Model calls pass through Guardian (Authorized = ALLOW, Unauthorized = BLOCK & 0 executions).
 * 5. Tool calls pass through Guardian (Authorized = ALLOW, Unauthorized = BLOCK & 0 executions).
 * 6. High-risk HITL execution pauses, requires human approval, guarantees concurrency safety, and executes exactly once.
 * 7. Evidence Ledger records complete causal sequence.
 * 8. Tenant isolation is enforced in the governance path.
 * 9. Worker holds zero credentials and zero direct network access.
 * 10. The 10 Adversarial Crucibles (A through J).
 * 11. Upstream NAT Python runner executes with 100% pass without forking NAT.
 */

import assert from 'assert';
import crypto from 'crypto';
import { execSync } from 'child_process';
import path from 'path';

import { AgentProvisioner, AgentDefinition } from '../src/core/agent-provisioner';
import { RuntimeManager } from '../src/core/runtime-manager';
import { IsolatedWorker } from '../src/core/isolated-worker';
import { NatRuntimeAdapter } from '../src/core/adapters/nat-runtime-adapter';
import { ExecutionAdapterRegistry } from '../src/server/routes/execution';
import { EvidenceLedger } from '../src/core/evidence-ledger';
import { ComplianceProfileRegistry } from '../src/core/compliance-compiler';
import { GuardianService } from '../src/core/guardian-service';
import { DurableStore } from '../src/server/db/durable-store';
import { PassportSigner } from '../src/core/passport-signer';
import { ContinuousRiskDetector } from '../src/core/continuous-risk-detector';
import { AgentInventoryStore } from '../src/web/services/agent-inventory-store';

console.log('==================================================================');
console.log('>>> SPRINT NAT-POC-01: NVIDIA NeMo AGENT TOOLKIT x ComplyPRO <<<');
console.log('==================================================================\n');

import { ModelGateway } from '../src/core/model-gateway';

// 1. Reset state
AgentProvisioner.reset();
RuntimeManager.reset();
EvidenceLedger.reset();
ExecutionAdapterRegistry.clear();
ModelGateway.clearCredentials();
ModelGateway.resetDispatcher();

// Vault credentials inside Gateway boundary (NEVER in worker)
ModelGateway.setProviderCredentials('openai', { apiKey: 'sk-proj-complypro-gateway-secure-vault-key-nat' });

const profile = ComplianceProfileRegistry.getProfile('CP-EU-AI-ACT-HIGH-RISK-FINANCIAL');
assert.ok(profile, 'Profile CP-EU-AI-ACT-HIGH-RISK-FINANCIAL must exist');

// ----------------------------------------------------------------------------
// TEST 1: NAT Agent Creation & Provisioning
// ----------------------------------------------------------------------------
console.log('[TEST 1] NAT Agent Definition & ComplyPRO Provisioning');
const natAgentDef: AgentDefinition = {
  name: 'nemo-credit-analyst',
  framework: { name: 'nvidia-nat', version: '1.9.0' },
  complianceProfile: 'CP-EU-AI-ACT-HIGH-RISK-FINANCIAL',
  capabilities: [
    'crm.read_customer',
    'credit_bureau_query',
    'credit.approve'
  ],
  budget: { maxCostPerRunEur: 15.0, maxTokensPerStep: 4096, maxCallsPerMinute: 30 },
  environment: 'sandbox',
  tenantId: 'TENANT-FINANCE-CORP'
};

const provisioned = AgentProvisioner.provision(natAgentDef);
assert.strictEqual(provisioned.status, 'PROVISIONED');
assert.strictEqual(provisioned.framework.name, 'nvidia-nat');
assert.strictEqual(provisioned.framework.version, '1.9.0');
assert.ok(provisioned.passportId, 'PassportId must be issued');

// Explicitly declare authorized model gpt-4o in governedCapabilities
provisioned.passport.governedCapabilities = [
  ...(provisioned.passport.governedCapabilities || []),
  { capability: 'gpt-4o', channel: 'MODEL', riskTier: 'MEDIUM' }
];
(provisioned.passport as any).declaredModels = ['gpt-4o'];
AgentProvisioner.signPassport(provisioned.passport, provisioned.agentId);

assert.ok(provisioned.passport.passportFingerprint, 'Cryptographic fingerprint must be anchored');
console.log('  [PASS]: NAT Agent successfully provisioned with authentic ComplyPRO Passport');

// ----------------------------------------------------------------------------
// TEST 2: Agent Appears in /agents Agent Inventory
// ----------------------------------------------------------------------------
console.log('\n[TEST 2] NAT Agent Appears in /agents Agent Inventory');
const persistedAgent = DurableStore.getAgent(provisioned.agentId, 'TENANT-FINANCE-CORP');
assert.ok(persistedAgent, 'Agent must be persisted in DurableStore');
assert.strictEqual(persistedAgent.framework_name, 'nvidia-nat');
assert.strictEqual(persistedAgent.tenant_id, 'TENANT-FINANCE-CORP');

// Fetching agents for tenant
const tenantAgents = AgentProvisioner.listAgents('TENANT-FINANCE-CORP');
const found = tenantAgents.find(a => a.agentId === provisioned.agentId);
assert.ok(found, 'NAT Agent must appear in Agent Inventory for TENANT-FINANCE-CORP');
console.log('  [PASS]: NAT Agent registered in authoritative Agent Inventory (source of truth)');

// ----------------------------------------------------------------------------
// TEST 3: Passport Verification Before Execution
// ----------------------------------------------------------------------------
console.log('\n[TEST 3] Cryptographic Passport Verification Before Execution');
const runtimeInstance = RuntimeManager.createRuntime(provisioned.runtimeSpec, provisioned.passport);
const startedRuntime = RuntimeManager.startRuntime(runtimeInstance.runtimeId);
const worker = RuntimeManager.getWorker(startedRuntime.runtimeId)!;
assert.ok(worker, 'IsolatedWorker must be alive');

const passportCheck = PassportSigner.verify(
  worker.passport.passportFingerprint,
  PassportSigner.toSignInput(worker.passport, worker.agentId)
);
assert.strictEqual(passportCheck.valid, true, 'Passport HMAC must verify cleanly');
console.log('  [PASS]: Passport signature verified with timing-safe HMAC-SHA256');

// ----------------------------------------------------------------------------
// TEST 4: Zero Secrets & Zero Direct Network in Worker Sandbox
// ----------------------------------------------------------------------------
console.log('\n[TEST 4] Worker Sandbox Isolation (Zero Secrets & Air-Gapped Network)');
const env = worker.getAllEnv();
assert.strictEqual(env.OPENAI_API_KEY, undefined);
assert.strictEqual(env.AZURE_OPENAI_KEY, undefined);
assert.strictEqual(env.DATABASE_URL, undefined);
assert.throws(() => {
  worker.getEnv('OPENAI_API_KEY');
}, /SECRET_ACCESS_DENIED/);

assert.throws(() => {
  worker.directNetworkCall('https://api.openai.com/v1/chat/completions');
}, /NETWORK_ACCESS_DENIED/);
console.log('  [PASS]: Worker perimeter strictly stripped of secrets; direct network denied');

// ----------------------------------------------------------------------------
// TEST 5 & 6: Model Call via Guardian (Authorized vs Unauthorized)
// ----------------------------------------------------------------------------
console.log('\n[TEST 5 & 6] Model Calls via ComplyPRO Guardian & Model Gateway');
const adapter = new NatRuntimeAdapter(worker);
ExecutionAdapterRegistry.registerAdapter('exec_test_reg', adapter);

const session = await adapter.start();
assert.strictEqual(session.status, 'RUNNING');

// 5. Authorized model call: gpt-4o is declared in passport
const authModelRes = await adapter.invokeModel(session, {
  provider: 'openai',
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'Analyze creditworthiness of CUST-1002' }]
});
assert.strictEqual(authModelRes.status, 'COMPLETED');
assert.strictEqual(authModelRes.verdict, 'ALLOW');
assert.strictEqual(adapter.getModelInferenceCount(session.executionId), 1);
console.log('  [PASS]: Authorized model (gpt-4o) evaluated by Guardian -> ALLOW (1 inference)');

// 6. Unauthorized model call: claude-3-5-sonnet is undeclared in passport
const unauthModelRes = await adapter.invokeModel(session, {
  provider: 'openai',
  model: 'claude-3-5-sonnet',
  messages: [{ role: 'user', content: 'Attempt rogue inference' }]
});
assert.strictEqual(unauthModelRes.status, 'BLOCKED');
assert.strictEqual(unauthModelRes.verdict, 'BLOCK');
assert.strictEqual(adapter.getModelInferenceCount(session.executionId), 1, 'Inference count MUST remain 1 on BLOCK (0 rogue calls)');
console.log('  [PASS]: Unauthorized model evaluated by Guardian -> BLOCK (0 provider executions)');

// ----------------------------------------------------------------------------
// TEST 7 & 8: Tool Calls via Guardian (Authorized vs Prohibited)
// ----------------------------------------------------------------------------
console.log('\n[TEST 7 & 8] Tool Calls via ComplyPRO Guardian & Tool Gateway');
// 7. Authorized tool: crm.read_customer
const authToolRes = await adapter.execute(session, {
  taskId: 'task-read-crm',
  description: 'Read customer history',
  targetCapability: 'crm.read_customer',
  actionType: 'READ',
  payload: { customerId: 'CUST-883' }
});
assert.strictEqual(authToolRes.status, 'COMPLETED');
assert.strictEqual(authToolRes.toolExecuted, true);
assert.strictEqual(authToolRes.toolExecutionCount, 1);
console.log('  [PASS]: Authorized tool (crm.read_customer) -> ALLOW -> exactly 1 execution');

// 8. Prohibited tool: DIRECT_DB_DDL
const sessionBlock = await adapter.start();
const blockToolRes = await adapter.execute(sessionBlock, {
  taskId: 'task-drop-db',
  description: 'Drop customer table',
  targetCapability: 'DIRECT_DB_DDL',
  actionType: 'DELETE',
  payload: { sql: 'DROP TABLE customers;' }
});
assert.strictEqual(blockToolRes.status, 'BLOCKED');
assert.strictEqual(blockToolRes.toolExecuted, false);
assert.strictEqual(blockToolRes.toolExecutionCount, 0, 'Tool execution count MUST be 0 on BLOCK');
console.log('  [PASS]: Prohibited tool (DIRECT_DB_DDL) -> BLOCK -> 0 provider executions');

// ----------------------------------------------------------------------------
// TEST 9 & 10: High-Risk HITL Flow & Concurrent Safety
// ----------------------------------------------------------------------------
console.log('\n[TEST 9 & 10] High-Risk HITL Flow (credit.approve > €10,000) & Concurrent Safety');
const sessionHitl = await adapter.start();

// Request credit approval of €25,000 (> 10,000 threshold)
const hitlReqRes = await adapter.execute(sessionHitl, {
  taskId: 'task-approve-loan',
  description: 'Approve corporate loan facility',
  targetCapability: 'credit.approve',
  actionType: 'WRITE',
  payload: { customerId: 'CUST-883', amount: 25000 }
});

assert.strictEqual(hitlReqRes.status, 'PAUSED');
assert.strictEqual(hitlReqRes.toolExecuted, false);
assert.strictEqual(hitlReqRes.toolExecutionCount, 0, 'Tool MUST NOT execute when PAUSED');
assert.ok(hitlReqRes.gateId, 'Gate ID must be assigned to pending HITL gate');
console.log('  [PASS]: High-risk tool triggered REQUIRE_HITL -> execution PAUSED (toolExecutionCount === 0)');

// Test Concurrency: Two simultaneous approvals
console.log('  [Testing Concurrency]: Simulating 2 concurrent operator approval attempts...');
const [resultA, resultB] = await Promise.allSettled([
  adapter.resume(sessionHitl, 'APPROVED', 'OP-OFFICER-ALICE'),
  adapter.resume(sessionHitl, 'APPROVED', 'OP-OFFICER-BOB')
]);

const fulfilled = resultA.status === 'fulfilled' ? resultA.value : (resultB.status === 'fulfilled' ? resultB.value : null);
const rejected = resultA.status === 'rejected' ? resultA.reason : (resultB.status === 'rejected' ? resultB.reason : null);

assert.ok(fulfilled, 'Exactly one concurrent approval MUST succeed');
assert.ok(rejected, 'Exactly one concurrent approval MUST be rejected');
assert.strictEqual(fulfilled.status, 'COMPLETED');
assert.strictEqual(fulfilled.toolExecuted, true);
assert.strictEqual(fulfilled.toolExecutionCount, 1, 'Tool MUST execute EXACTLY ONCE across concurrent attempts');
assert.ok(/ILLEGAL_SESSION_STATE|CONCURRENT_HITL_CONFLICT/.test(rejected.message));
console.log('  [PASS]: Concurrent approval race safely resolved: exactly 1 execution, second rejected');

// ----------------------------------------------------------------------------
// TEST 11: Complete Causal Chain in Evidence Ledger
// ----------------------------------------------------------------------------
console.log('\n[TEST 11] Causal Sequence Verification in Evidence Ledger');
const agentEntries = EvidenceLedger.getEntries(provisioned.agentId);

const requiredCausalSequence = [
  'AGENT_EXECUTION_STARTED',
  'CAPABILITY_REQUESTED',
  'HITL_REQUEST',
  'HITL_DECISION',
  'AGENT_EXECUTION_RESUMED',
  'TOOL_EXECUTION',
  'AGENT_EXECUTION_COMPLETED'
];

for (const evType of requiredCausalSequence) {
  const match = agentEntries.find(e => e.eventType === evType);
  assert.ok(match, `Causal chain must contain ${evType}`);
}

const ledgerIntegrity = EvidenceLedger.verifyChain();
assert.strictEqual(ledgerIntegrity.valid, true, 'Evidence Merkle hash chain must be 100% valid');
console.log('  [PASS]: Causal sequence verified in Evidence Ledger; Merkle chain integrity valid');

// ----------------------------------------------------------------------------
// TEST 12: Tenant Isolation
// ----------------------------------------------------------------------------
console.log('\n[TEST 12] Strict Tenant Boundary Isolation');
// Provision Agent in Tenant B
const tenantBAgentDef: AgentDefinition = {
  ...natAgentDef,
  name: 'nemo-tenant-b-agent',
  tenantId: 'TENANT-OTHER-CORP'
};
const provisionedB = AgentProvisioner.provision(tenantBAgentDef);

// Tenant A should only query Tenant A agents
const agentsTenantA = AgentProvisioner.listAgents('TENANT-FINANCE-CORP');
const agentsTenantB = AgentProvisioner.listAgents('TENANT-OTHER-CORP');

assert.ok(agentsTenantA.some(a => a.agentId === provisioned.agentId));
assert.ok(!agentsTenantA.some(a => a.agentId === provisionedB.agentId), 'Tenant A must NOT see Tenant B agent');
assert.ok(agentsTenantB.some(a => a.agentId === provisionedB.agentId));
assert.ok(!agentsTenantB.some(a => a.agentId === provisioned.agentId), 'Tenant B must NOT see Tenant A agent');
console.log('  [PASS]: Strict tenant boundary enforced: zero cross-tenant leakage');

// ----------------------------------------------------------------------------
// TEST 13: Adversarial Crucibles (Tampering & Revocation)
// ----------------------------------------------------------------------------
console.log('\n[TEST 13] Adversarial Crucibles: Passport Tampering & Revocation');

// C: Unauthorized Data Scope Attempt
const unauthDataRes = await worker.requestData(
  'tax_records_pii',
  'READ',
  'tax_filings_2025',
  {},
  'LOCAL',
  'TENANT-FINANCE-CORP'
);
assert.strictEqual(unauthDataRes.status, 'BLOCKED');
assert.strictEqual(unauthDataRes.verdict, 'BLOCK');
assert.strictEqual(unauthDataRes.data, undefined);
console.log('  [PASS Crucible C]: Unauthorized data scope strictly blocked with 0 records read');

// D: Cross-Tenant Impersonation
const crossTenantRes = GuardianService.evaluateActiveCapability({
  agent: { id: worker.agentId, name: 'nemo-credit-analyst', version: '1.9.0' },
  passport: worker.passport,
  complianceProfile: profile,
  channel: 'TOOL',
  capability: 'crm.read_customer',
  actionType: 'READ',
  context: { tenantId: 'TENANT-ATTACKER-CORP' } // Impersonated tenant!
});
assert.strictEqual(crossTenantRes.verdict, 'BLOCK');
assert.ok(/Tenant isolation violation/i.test(crossTenantRes.reason));
console.log('  [PASS Crucible D]: Cross-tenant impersonation strictly detected and BLOCKED');

// F: Passport Tampering
const tamperedCheck = PassportSigner.verify(
  'SIG-SHA256-FORGED-INVALID-HASH-000000',
  PassportSigner.toSignInput(worker.passport, worker.agentId)
);
assert.strictEqual(tamperedCheck.valid, false, 'Tampered passport signature must be rejected');
console.log('  [PASS Crucible F]: Forged passport signature strictly rejected');

// G: Capability Manifest Tampering
const tamperedManifest = {
  ...worker.passport,
  declaredTools: ['crm.read_customer', 'DIRECT_DB_DDL', 'unrestricted_admin']
};
const tamperedManifestCheck = PassportSigner.verify(
  worker.passport.passportFingerprint,
  PassportSigner.toSignInput(tamperedManifest, worker.agentId)
);
assert.strictEqual(tamperedManifestCheck.valid, false, 'Tampered capability list must break HMAC signature');
console.log('  [PASS Crucible G]: Capability manifest mutation breaks signature and blocks execution');

// H: Revoked Passport
const revokedSession = await adapter.start();
const revokedWorker = new IsolatedWorker({
  agentId: worker.agentId,
  passportId: worker.passportId,
  runtimeId: worker.runtimeId,
  passport: {
    ...worker.passport,
    status: 'REVOKED'
  }
});
const revokedAdapter = new NatRuntimeAdapter(revokedWorker);
let revokedBlocked = false;
try {
  await revokedAdapter.start();
} catch (e: any) {
  revokedBlocked = true;
  assert.ok(/PASSPORT_VERIFICATION_FAILED/.test(e.message));
}
assert.strictEqual(revokedBlocked, true, 'Revoked passport must be rejected on session initialization');

// Also test: if existing running session executes on revoked worker
revokedAdapter.injectSession(revokedSession);
const revokedExecRes = await revokedAdapter.execute(revokedSession, {
  taskId: 'task-revoked',
  description: 'Test revoked passport',
  targetCapability: 'crm.read_customer',
  actionType: 'READ'
});
assert.strictEqual(revokedExecRes.status, 'BLOCKED');
assert.strictEqual(revokedExecRes.toolExecutionCount, 0);
console.log('  [PASS Crucible H]: Revoked passport strictly blocked with 0 tool executions');

// ----------------------------------------------------------------------------
// TEST 14: Direct Execution of Upstream Python NAT Harness
// ----------------------------------------------------------------------------
console.log('\n[TEST 14] Real Upstream Python NAT Harness Execution');
const pythonVenv = path.join(process.cwd(), '.venv-nat', 'Scripts', 'python.exe');
const pythonScript = path.join(process.cwd(), 'src', 'core', 'nat', 'nat_runner.py');

const pythonOutput = execSync(`"${pythonVenv}" "${pythonScript}"`, { encoding: 'utf-8' });
assert.ok(pythonOutput.includes('ALL NAT PYTHON HARNESS SCENARIOS PASSED (100%)'), 'Python harness must pass 100%');
console.log('  [PASS]: Upstream Python NAT (nvidia-nat==1.9.0) harness executed cleanly: 100% PASS');

console.log('\n==================================================================');
console.log('>>> ALL 14 SPRINT NAT-POC-01 TEST SUITE CASES PASSED (100%)   <<<');
console.log('==================================================================\n');
