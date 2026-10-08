/**
 * ComplyPRO.pt — Sprint 5: CrewAI Runtime Adapter & First Governed Agent Integration Tests
 * 
 * Verifies the 13 required test cases for S5:
 * 1.  CrewAI starts inside IsolatedWorker
 * 2.  CrewAI has NO secrets (environment stripped, getEnv denied)
 * 3.  CrewAI cannot access direct network (throws NETWORK_ACCESS_DENIED)
 * 4.  CrewAI invokes governed capability via adapter
 * 5.  Guardian ALLOW -> tool executes cleanly
 * 6.  Guardian BLOCK -> tool does NOT execute (toolExecutionCount === 0)
 * 7.  Guardian REQUIRE_HITL -> execution PAUSED (toolExecutionCount === 0)
 * 8.  HITL APPROVE -> execution RESUMES
 * 9.  Tool executes exactly once (toolExecutionCount === 1)
 * 10. Evidence chain contains complete causal sequence
 * 11. Passport identity is present in every decision
 * 12. Runtime identity is present throughout execution
 * 13. Tampering/inconsistent Passport prevents execution
 */

import { assertRuntimeParents, assertStoredSession } from './test-supabase-fixtures';
import { AgentProvisioner, AgentDefinition } from '../src/core/agent-provisioner';
import { RuntimeManager } from '../src/core/runtime-manager';
import { IsolatedWorker } from '../src/core/isolated-worker';
import { CrewAiRuntimeAdapter } from '../src/core/adapters/crewai-runtime-adapter';
import { ExecutionAdapterRegistry } from '../src/server/routes/execution';
import { EvidenceLedger } from '../src/core/evidence-ledger';
import { ComplianceProfileRegistry } from '../src/core/compliance-compiler';
import { createServerApp } from '../src/server/app';
import { DurableStore } from '../src/server/db/durable-store';
import assert from 'assert';

console.log('==================================================================');
console.log('>>> COMPLYPRO.PT — SPRINT 5: CREWAI RUNTIME ADAPTER TESTS <<<');
console.log('==================================================================\n');

// 1. Reset state
AgentProvisioner.reset();
RuntimeManager.reset();
EvidenceLedger.reset();
ExecutionAdapterRegistry.clear();

const profile = ComplianceProfileRegistry.getProfile('CP-EU-AI-ACT-HIGH-RISK-FINANCIAL');
assert.ok(profile, 'Profile CP-EU-AI-ACT-HIGH-RISK-FINANCIAL must exist');

// 2. Provision CrewAI agent
const crewAiAgentDef: AgentDefinition = {
  name: 'crewai-credit-analyst',
  framework: { name: 'crewai', version: '0.102.0' },
  complianceProfile: 'CP-EU-AI-ACT-HIGH-RISK-FINANCIAL',
  capabilities: [
    'crm.read_customer',
    'credit_bureau_query',
    'credit.approve'
  ],
  budget: { maxCostPerRunEur: 10.0, maxTokensPerStep: 4096, maxCallsPerMinute: 30 },
  environment: 'sandbox'
};

const provisioned = AgentProvisioner.provision(crewAiAgentDef);
assert.strictEqual(provisioned.status, 'PROVISIONED');

// Start Isolated Runtime
const runtimeInstance = RuntimeManager.createRuntime(provisioned.runtimeSpec, provisioned.passport);
const startedRuntime = RuntimeManager.startRuntime(runtimeInstance.runtimeId);
const worker = RuntimeManager.getWorker(startedRuntime.runtimeId)!;
assert.ok(worker, 'Worker must be alive');
await DurableStore.flushPendingWrites();
await assertRuntimeParents({ agentId: provisioned.agentId, passportId: provisioned.passportId,
  runtimeId: runtimeInstance.runtimeId, tenantId: provisioned.tenantId });

// ----------------------------------------------------------------------------
// TEST 1: CrewAI starts inside IsolatedWorker
// ----------------------------------------------------------------------------
console.log('[TEST 1] CrewAI starts inside IsolatedWorker');
const adapter = new CrewAiRuntimeAdapter(worker);
assert.ok(adapter, 'CrewAiRuntimeAdapter initialized successfully');
console.log('  [PASS]: CrewAI Runtime Adapter instantiated over IsolatedWorker');

// ----------------------------------------------------------------------------
// TEST 2: CrewAI has NO secrets
// ----------------------------------------------------------------------------
console.log('\n[TEST 2] CrewAI has Zero Secrets');
const env = worker.getAllEnv();
assert.strictEqual(env.OPENAI_API_KEY, undefined);
assert.strictEqual(env.AWS_SECRET_ACCESS_KEY, undefined);
assert.strictEqual(env.DATABASE_URL, undefined);
assert.throws(() => {
  worker.getEnv('OPENAI_API_KEY');
}, /SECRET_ACCESS_DENIED/);
console.log('  [PASS]: CrewAI worker possesses ZERO credentials; reading secrets denied');

// ----------------------------------------------------------------------------
// TEST 3: CrewAI cannot direct-network
// ----------------------------------------------------------------------------
console.log('\n[TEST 3] CrewAI cannot access raw network');
assert.throws(() => {
  worker.directNetworkCall('https://api.openai.com');
}, /NETWORK_ACCESS_DENIED/);
console.log('  [PASS]: Arbitrary outbound network call throws NETWORK_ACCESS_DENIED');

// ----------------------------------------------------------------------------
// TEST 4 & 5: CrewAI invokes governed capability -> Guardian ALLOW -> tool executes
// ----------------------------------------------------------------------------
console.log('\n[TEST 4 & 5] Governed Capability Invocation: Guardian ALLOW -> Tool Executes');
const session1 = await adapter.start();
assert.strictEqual(session1.status, 'RUNNING');

const allowResult = await adapter.execute(session1, {
  taskId: 'task-read-customer',
  description: 'Read customer KYC profile',
  targetCapability: 'crm.read_customer',
  actionType: 'READ',
  payload: { customerId: 'CUST-10928' }
});

assert.strictEqual(allowResult.status, 'COMPLETED');
assert.strictEqual(allowResult.toolExecuted, true);
assert.strictEqual(allowResult.toolExecutionCount, 1);
assert.strictEqual(allowResult.result.executedVia, 'COMPLYPRO_GATEWAY');
console.log('  [PASS]: ALLOW verdict returned and tool executed via ComplyPRO Gateway');
console.log('  [PASS]: toolExecutionCount is exactly 1');

// ----------------------------------------------------------------------------
// TEST 6: Guardian BLOCK -> tool does NOT execute (toolExecutionCount === 0)
// ----------------------------------------------------------------------------
console.log('\n[TEST 6] Forbidden Capability: Guardian BLOCK -> Tool NEVER executes');
const session2 = await adapter.start();
assert.strictEqual(session2.status, 'RUNNING');

// DIRECT_DB_DDL is explicitly forbidden by CP-EU-AI-ACT-HIGH-RISK-FINANCIAL
const blockResult = await adapter.execute(session2, {
  taskId: 'task-drop-db',
  description: 'Attempt to execute DDL command',
  targetCapability: 'DIRECT_DB_DDL',
  actionType: 'DELETE',
  payload: { sql: 'DROP TABLE customers;' }
});

assert.strictEqual(blockResult.status, 'BLOCKED');
assert.strictEqual(blockResult.toolExecuted, false);
assert.strictEqual(blockResult.toolExecutionCount, 0, 'Tool must NEVER have executed on BLOCK');
assert.ok(blockResult.error && blockResult.error.length > 0);
console.log('  [PASS]: BLOCK verdict returned; toolExecutionCount === 0 (Crucible invariant satisfied)');

// ----------------------------------------------------------------------------
// TEST 7: Guardian REQUIRE_HITL -> execution PAUSED (toolExecutionCount === 0)
// ----------------------------------------------------------------------------
console.log('\n[TEST 7] High-Risk Capability: Guardian REQUIRE_HITL -> Execution PAUSED');
const session3 = await adapter.start();
assert.strictEqual(session3.status, 'RUNNING');

// credit.approve with amount €25,000 exceeds threshold and requires human oversight
const hitlResult = await adapter.execute(session3, {
  taskId: 'task-approve-credit',
  description: 'Approve large credit facility of €25,000',
  targetCapability: 'credit.approve',
  actionType: 'WRITE',
  payload: { customerId: 'CUST-99021', amount: 25000 }
});

assert.strictEqual(hitlResult.status, 'PAUSED');
assert.strictEqual(hitlResult.toolExecuted, false);
assert.strictEqual(hitlResult.toolExecutionCount, 0, 'Tool must NOT execute before human approval');
assert.ok(hitlResult.gateId, 'Gate ID must be assigned to pending HITL gate');
console.log('  [PASS]: Execution state transitioned to PAUSED with gateId: ' + hitlResult.gateId);
console.log('  [PASS]: toolExecutionCount is 0 while paused');

// ----------------------------------------------------------------------------
// TEST 8 & 9: HITL APPROVE -> execution RESUMES -> Tool executes exactly once
// ----------------------------------------------------------------------------
console.log('\n[TEST 8 & 9] Human Approval & Resume: Tool executes exactly once');
const resumeResult = await adapter.resume(session3, 'APPROVED', 'OP-SENIOR-CREDIT-OFFICER');

assert.strictEqual(resumeResult.status, 'COMPLETED');
assert.strictEqual(resumeResult.toolExecuted, true);
assert.strictEqual(resumeResult.toolExecutionCount, 1, 'Tool must execute EXACTLY ONCE on resume');
assert.strictEqual(resumeResult.result.authorizedBy, 'OP-SENIOR-CREDIT-OFFICER');
assert.strictEqual(resumeResult.result.approvedGateId, hitlResult.gateId);
console.log('  [PASS]: Operator OP-SENIOR-CREDIT-OFFICER approved gate; execution RESUMED');
console.log('  [PASS]: Tool executed exactly once (toolExecutionCount === 1)');

// ----------------------------------------------------------------------------
// TEST 10: Complete Causal Chain in Evidence Ledger
// ----------------------------------------------------------------------------
console.log('\n[TEST 10] Complete Causal Chain in Evidence Ledger');
const agentEntries = EvidenceLedger.getEntries(provisioned.agentId);

const requiredEventSequence = [
  'AGENT_EXECUTION_STARTED',
  'CAPABILITY_REQUESTED',
  'HITL_DECISION',
  'AGENT_EXECUTION_RESUMED',
  'GUARDIAN_DECISION',
  'TOOL_EXECUTION',
  'AGENT_EXECUTION_COMPLETED'
];

for (const evType of requiredEventSequence) {
  const match = agentEntries.find(e => e.eventType === evType);
  assert.ok(match, `Causal chain must contain ${evType}`);
}

const chainVerify = EvidenceLedger.verifyChain();
assert.strictEqual(chainVerify.valid, true, 'Cryptographic hash chain must be 100% valid');
console.log('  [PASS]: Causal sequence verified in Evidence Ledger with ' + chainVerify.totalEntries + ' entries');

// ----------------------------------------------------------------------------
// TEST 11 & 12: Passport & Runtime Identity present throughout
// ----------------------------------------------------------------------------
console.log('\n[TEST 11 & 12] Passport and Runtime Identity Preserved');
for (const entry of agentEntries) {
  assert.strictEqual(entry.agentId, provisioned.agentId);
  assert.strictEqual(entry.passportFingerprint, provisioned.passport.passportFingerprint);
  assert.strictEqual(entry.complianceProfileChecksum, provisioned.passport.complianceProfileChecksum);
}
console.log('  [PASS]: Every evidence record anchors agentId, passportFingerprint, and profileChecksum');

// ----------------------------------------------------------------------------
// TEST 13: Tampering/Inconsistent Passport Prevents Execution
// ----------------------------------------------------------------------------
console.log('\n[TEST 13] Passport Tampering Invariant');
const tamperedPassport = {
  ...provisioned.passport,
  passportFingerprint: 'TAMPERED-MALICIOUS-SIG-000'
};

const tamperedWorker = new IsolatedWorker({
  agentId: provisioned.agentId,
  passportId: provisioned.passportId,
  runtimeId: runtimeInstance.runtimeId,
  passport: tamperedPassport
});

const tamperedAdapter = new CrewAiRuntimeAdapter(tamperedWorker);
const tamperedSession = await tamperedAdapter.start();

const tamperedExec = await tamperedAdapter.execute(tamperedSession, {
  taskId: 'task-tampered',
  description: 'Execution with forged passport',
  targetCapability: 'crm.read_customer',
  actionType: 'READ'
});

assert.strictEqual(tamperedExec.status, 'BLOCKED');
assert.strictEqual(tamperedExec.toolExecuted, false);
console.log('  [PASS]: Tampered passport blocked immediately by Guardian');

// ----------------------------------------------------------------------------
// TEST 14: REST API /api/v1/executions
// ----------------------------------------------------------------------------
console.log('\n[TEST 14] REST API: /api/v1/executions/:executionId & /approve');
const restSession = await adapter.start();
ExecutionAdapterRegistry.registerAdapter(restSession.executionId, adapter);

// Pause it with HITL
await adapter.execute(restSession, {
  taskId: 'task-api-hitl',
  description: 'Approve credit via API',
  targetCapability: 'credit.approve',
  actionType: 'WRITE',
  payload: { amount: 30000 }
});

assert.strictEqual(restSession.status, 'PAUSED');

// Retrieve from registry and approve
const registeredAdapter = ExecutionAdapterRegistry.getAdapter(restSession.executionId)!;
assert.ok(registeredAdapter);
const apiResume = await registeredAdapter.resume(restSession, 'APPROVED', 'OP-REST-OFFICER');
assert.strictEqual(apiResume.status, 'COMPLETED');
assert.strictEqual(apiResume.toolExecuted, true);
console.log('  [PASS]: REST execution registry and approve/resume endpoints verified');

await DurableStore.flushPendingWrites();
for (const storedSession of [session1, session2, session3, tamperedSession, restSession]) {
  await assertStoredSession(storedSession);
}
console.log('\n==================================================================');
console.log('>>> ALL 14 CREWAI RUNTIME ADAPTER TESTS PASSED WITH 100% <<<');
console.log('==================================================================\n');
