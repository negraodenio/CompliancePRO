/**
 * R2-C — Data HITL Guardian Revalidation Regression Tests.
 *
 * Proves the complete Data HITL approval path revalidates through Guardian:
 * 1. A legitimate approval with a successful Guardian recheck follows the valid path
 *    (PAUSED -> APPROVE -> provider executed exactly once -> COMPLETED + ALLOW).
 * 2. Approval alone cannot bypass a denied Guardian check (passport tampered after
 *    pause -> real Guardian BLOCK -> DATA_APPROVAL_BLOCKED, zero provider calls,
 *    session BLOCKED, no new HITL_DECISION record).
 * 3. An unavailable Guardian / unexpected revalidation failure cannot authorize
 *    execution (revalidation throws -> approval rejects, zero provider calls,
 *    session never COMPLETED, no HITL_DECISION record written).
 *
 * Local only: TEST fixtures, no production infrastructure.
 * Run: NODE_ENV=test node --import tsx --import ./tests/bootstrap-provider-fixtures.ts tests/data-hitl-revalidation.test.ts
 */

import assert from 'assert';
import { AgentProvisioner } from '../src/core/agent-provisioner';
import { RuntimeManager } from '../src/core/runtime-manager';
import { EvidenceLedger } from '../src/core/evidence-ledger';
import { DataGateway, DataProviderAdapter } from '../src/core/data-gateway';
import { CapabilityRegistry } from '../src/core/capability-registry';
import { ComplianceProfileRegistry } from '../src/core/compliance-compiler';
import { GuardianService } from '../src/core/guardian-service';

console.log('==================================================================');
console.log('>>> COMPLYPRO.R2-C: DATA HITL GUARDIAN REVALIDATION TESTS <<<');
console.log('==================================================================\n');

assert.strictEqual(process.env.NODE_ENV, 'test', 'These tests require NODE_ENV=test');

// 1. Reset state
AgentProvisioner.reset();
RuntimeManager.reset();
EvidenceLedger.reset();

// 2. Counting data provider
class R2CountingDataProvider implements DataProviderAdapter {
  public readonly providerId = 'r2-hitl-data-provider';
  public callCount = 0;
  public async query(): Promise<any[]> {
    this.callCount++;
    return [{ record_id: 'REC-001', full_name: 'Ada Lovelace', tax_number: '1234567890' }];
  }
}
const provider = new R2CountingDataProvider();
DataGateway.registerProvider(provider);

// 3. Capability bound to passport with requiresHitl (Guardian STEP 6 trigger)
CapabilityRegistry.register({
  id: 'r2.hitl.data',
  name: 'R2 HITL Data Capability',
  description: 'R2 Data HITL guardian revalidation capability',
  channel: 'DATA',
  riskLevel: 'LOW',
  allowedActions: ['READ'],
  dataClassification: 'INTERNAL',
  provider: 'r2-hitl-data-provider'
});

console.log('[SETUP] Provisioning governed agent for R2-C audit...');
const profile = ComplianceProfileRegistry.getProfile('CP-EU-AI-ACT-HIGH-RISK-FINANCIAL');
assert.ok(profile, 'CP-EU-AI-ACT-HIGH-RISK-FINANCIAL profile must exist');

const provision = AgentProvisioner.provision({
  name: 'r2-data-hitl-revalidation-agent',
  framework: { name: 'crewai', version: '0.102.0' },
  complianceProfile: 'CP-EU-AI-ACT-HIGH-RISK-FINANCIAL',
  capabilities: ['crm.read_customer'],
  budget: { maxCostPerRunEur: 25.0, maxTokensPerStep: 4096, maxCallsPerMinute: 60 },
  environment: 'sandbox' as const,
  tenantId: 'TENANT-DEFAULT'
});

provision.passport.declaredTools = [...(provision.passport.declaredTools || []), 'r2.hitl.data'];
provision.passport.governedCapabilities = [
  ...(provision.passport.governedCapabilities || []),
  { capability: 'r2.hitl.data', channel: 'DATA', riskTier: 'LOW', requiresHitl: true }
];
AgentProvisioner.signPassport(provision.passport, provision.agentId);

const runtimeInstance = RuntimeManager.createRuntime(provision.runtimeSpec, provision.passport);
const runtimeId = runtimeInstance.runtimeId;

function pauseDataOp(executionId: string) {
  return DataGateway.invokeData({
    agentId: provision.agentId,
    passportId: provision.passportId,
    runtimeId,
    executionId,
    passport: provision.passport,
    capability: 'r2.hitl.data',
    action: 'READ',
    targetResource: 'records',
    parameters: { batchSize: 100 }
  });
}

function hitlDecisionCount(): number {
  return EvidenceLedger.getEntries(provision.agentId).filter(
    e => e.eventType === 'HITL_DECISION' && (e as any).operatorDecision === 'APPROVED'
  ).length;
}

let passed = 0;
function pass(description: string) {
  passed++;
  console.log(`  [PASS ${passed}]: ${description}`);
}

// ============================================================================
// TEST 1 — Legitimate approval with successful Guardian recheck -> valid path
// ============================================================================
console.log('\n[TEST 1] Legitimate approval follows the valid path with a Guardian recheck');

const t1Pause = await pauseDataOp('exec_r2c_t1');
assert.strictEqual(t1Pause.status, 'PAUSED');
assert.strictEqual(t1Pause.verdict, 'REQUIRE_HITL');
assert.ok(t1Pause.gateId && t1Pause.gateId.startsWith('GATE-'), 'PAUSED response must carry a GATE- gateId');
assert.strictEqual(provider.callCount, 0, 'Zero provider calls while paused');
pass('High-risk data op pauses with REQUIRE_HITL and zero provider calls');

const callsBeforeApprove = provider.callCount;
const decisionsBeforeApprove = hitlDecisionCount();

let rechecks = 0;
const originalEvaluate = GuardianService.evaluateActiveCapability;
(GuardianService as any).evaluateActiveCapability = function (...args: any[]) {
  rechecks++;
  return originalEvaluate.apply(GuardianService, args);
};

let t1Approve: any;
try {
  t1Approve = await DataGateway.approveExecution('exec_r2c_t1', 'OP-R2C-01');
} finally {
  (GuardianService as any).evaluateActiveCapability = originalEvaluate;
}

assert.ok(rechecks >= 1, 'Guardian revalidation must run during approval');
assert.strictEqual(t1Approve.status, 'COMPLETED');
assert.strictEqual(t1Approve.verdict, 'ALLOW');
assert.strictEqual(t1Approve.providerCallCount, 1);
assert.strictEqual(provider.callCount, callsBeforeApprove + 1, 'Provider executed exactly 1 time on legitimate approval');
assert.strictEqual(hitlDecisionCount(), decisionsBeforeApprove + 1, 'Exactly one HITL_DECISION APPROVED recorded');
pass('Legitimate approval revalidates through Guardian and executes exactly once (COMPLETED + ALLOW)');

// ============================================================================
// TEST 2 — Unavailable Guardian / unexpected revalidation failure cannot authorize
// ============================================================================
console.log('\n[TEST 2] Guardian revalidation failure cannot authorize execution');

const t2Pause = await pauseDataOp('exec_r2c_t2');
assert.strictEqual(t2Pause.status, 'PAUSED');
assert.strictEqual(t2Pause.verdict, 'REQUIRE_HITL');

const callsBeforeT2 = provider.callCount;
const decisionsBeforeT2 = hitlDecisionCount();

(GuardianService as any).evaluateActiveCapability = () => {
  throw new Error('GUARDIAN_UNAVAILABLE: revalidation service unreachable');
};
try {
  await assert.rejects(
    () => DataGateway.approveExecution('exec_r2c_t2', 'OP-R2C-02'),
    (err: any) => /GUARDIAN_UNAVAILABLE/.test(String(err?.message)),
    'Approval must reject when Guardian revalidation fails'
  );
} finally {
  (GuardianService as any).evaluateActiveCapability = originalEvaluate;
}

const t2Session = DataGateway.getSession('exec_r2c_t2');
assert.ok(t2Session, 'Session must still exist after failed approval');
assert.notStrictEqual(t2Session!.status, 'COMPLETED', 'Session must never reach COMPLETED when revalidation fails');
assert.strictEqual(provider.callCount, callsBeforeT2, 'Zero provider calls when Guardian revalidation fails');
assert.strictEqual(hitlDecisionCount(), decisionsBeforeT2, 'No HITL_DECISION record may be written when revalidation fails');
pass('Unavailable Guardian rejects the approval: zero provider calls, no COMPLETED state, no approval evidence');

// ============================================================================
// TEST 3 — Approval alone cannot bypass a denied Guardian check
// ============================================================================
console.log('\n[TEST 3] Denied Guardian check blocks an otherwise-issued approval');

const t3Pause = await pauseDataOp('exec_r2c_t3');
assert.strictEqual(t3Pause.status, 'PAUSED');
assert.strictEqual(t3Pause.verdict, 'REQUIRE_HITL');

// Tamper with the passport AFTER the pause (no re-signature) so the real
// Guardian cryptographic verification denies revalidation.
const t3Session = DataGateway.getSession('exec_r2c_t3');
assert.ok(t3Session, 'Paused session must exist before tampering');
const tamperedPassport = t3Session!.context.passport;
tamperedPassport.declaredTools = (tamperedPassport.declaredTools || []).filter(t => t !== 'r2.hitl.data');
tamperedPassport.governedCapabilities = (tamperedPassport.governedCapabilities || []).filter(
  g => g.capability !== 'r2.hitl.data'
);

// Prove the real Guardian denial first (authorization control independent of approval).
const directVerdict = GuardianService.evaluateActiveCapability({
  agent: { id: provision.agentId, name: provision.agentId },
  passport: tamperedPassport,
  complianceProfile: profile!,
  channel: 'DATA',
  capability: 'r2.hitl.data',
  actionType: 'READ',
  payload: { batchSize: 100 },
  context: { tenantId: 'TENANT-DEFAULT' }
});
assert.strictEqual(directVerdict.verdict, 'BLOCK', 'Tampered passport must be denied by Guardian');
pass('Real Guardian denies the tampered passport (cryptographic/scope verification)');

const callsBeforeT3 = provider.callCount;
const decisionsBeforeT3 = hitlDecisionCount();

await assert.rejects(
  () => DataGateway.approveExecution('exec_r2c_t3', 'OP-R2C-03'),
  (err: any) => /DATA_APPROVAL_BLOCKED/.test(String(err?.message)),
  'Approval must be rejected with DATA_APPROVAL_BLOCKED when Guardian denies'
);

assert.strictEqual(t3Session!.status, 'BLOCKED', 'Denied approval must leave the session BLOCKED');
assert.strictEqual(provider.callCount, callsBeforeT3, 'Denied Guardian check must cause zero provider calls');
assert.strictEqual(hitlDecisionCount(), decisionsBeforeT3, 'Denied approval must not append a HITL_DECISION record');
assert.notStrictEqual(DataGateway.getSession('exec_r2c_t3')!.status, 'COMPLETED');
pass('Approval alone cannot bypass the denied Guardian check: session BLOCKED, zero provider calls');

console.log('\n==================================================================');
console.log(`R2-C DATA HITL GUARDIAN REVALIDATION: ALL ${passed} CHECKS PASSED`);
console.log('==================================================================');
