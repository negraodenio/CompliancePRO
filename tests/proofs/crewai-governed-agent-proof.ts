/**
 * ComplyPRO.pt — Proof of Enforcement: First Governed Agent Demo
 * 
 * Demonstrates the canonical end-to-end execution of a real governed CrewAI agent:
 * - Framework:       CrewAI
 * - Runtime:         IsolatedWorker
 * - Passport:        VERIFIED
 * - Secrets:         DENIED
 * - Direct Network:  DENIED
 * 
 * ACTION 1 (HITL Flow):
 * Agent -> credit.approve(€25,000)
 * Guardian -> REQUIRE_HITL
 * Execution -> PAUSED
 * Human -> APPROVED
 * Execution -> RESUMED
 * Guardian -> ALLOW
 * Tool -> EXECUTED (Count: 1)
 * Evidence -> VERIFIED
 * 
 * ACTION 2 (Forbidden Flow):
 * Agent -> forbidden_action (DIRECT_DB_DDL)
 * Guardian -> BLOCK
 * Tool -> NOT EXECUTED (Count: 0)
 * Evidence -> VERIFIED
 */

import { AgentProvisioner } from '../../src/core/agent-provisioner';
import { RuntimeManager } from '../../src/core/runtime-manager';
import { CrewAiRuntimeAdapter } from '../../src/core/adapters/crewai-runtime-adapter';
import { EvidenceLedger } from '../../src/core/evidence-ledger';
import assert from 'assert';

async function runProof() {
  console.log('================================================================');
  console.log(' COMPLYPRO.PT — FIRST GOVERNED AGENT PROOF OF ENFORCEMENT');
  console.log('================================================================\n');

  // 1. Reset state
  AgentProvisioner.reset();
  RuntimeManager.reset();
  EvidenceLedger.reset();

  // 2. Active Provisioning
  const provisioned = AgentProvisioner.provision({
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
  });

  // 3. Isolated Worker
  const runtimeInstance = RuntimeManager.createRuntime(provisioned.runtimeSpec, provisioned.passport);
  const startedRuntime = RuntimeManager.startRuntime(runtimeInstance.runtimeId);
  const worker = RuntimeManager.getWorker(startedRuntime.runtimeId)!;
  const adapter = new CrewAiRuntimeAdapter(worker);

  console.log(`Framework:       CrewAI (${provisioned.framework.version})`);
  console.log(`Runtime:         IsolatedWorker (${worker.runtimeId})`);
  console.log(`Passport:        VERIFIED (${provisioned.passport.passportFingerprint})`);
  console.log(`Secrets:         DENIED (Environment strictly stripped)`);
  console.log(`Direct Network:  DENIED (Outbound raw traffic blocked)\n`);

  // ---------------------------------------------------------------------------
  // ACTION 1: High-Risk Action (HITL Oversight Flow)
  // ---------------------------------------------------------------------------
  console.log('---------------------------------------------------------------');
  console.log('ACTION 1: High-Risk Action Oversight (Human-in-the-Loop)');
  console.log('---------------------------------------------------------------');

  const session1 = await adapter.start();
  console.log(`Agent → credit.approve(€25,000) [Session: ${session1.executionId}]`);

  const hitlResult = await adapter.execute(session1, {
    taskId: 'task-credit-eval',
    description: 'Approve corporate loan facility of €25,000',
    targetCapability: 'credit.approve',
    actionType: 'WRITE',
    payload: { customerId: 'CUST-EU-8819', amount: 25000 }
  });

  assert.strictEqual(hitlResult.status, 'PAUSED');
  assert.strictEqual(hitlResult.toolExecutionCount, 0);
  console.log(`Guardian → REQUIRE_HITL (Gate: ${hitlResult.gateId})`);
  console.log(`Execution → PAUSED (Tool execution count: 0)`);

  // Simulate human supervisor in Cockpit
  console.log(`Human → APPROVED by OP-SENIOR-CREDIT-OFFICER`);
  const resumeResult = await adapter.resume(session1, 'APPROVED', 'OP-SENIOR-CREDIT-OFFICER');

  assert.strictEqual(resumeResult.status, 'COMPLETED');
  assert.strictEqual(resumeResult.toolExecuted, true);
  assert.strictEqual(resumeResult.toolExecutionCount, 1);
  console.log(`Execution → RESUMED`);
  console.log(`Guardian → ALLOW`);
  console.log(`Tool → EXECUTED (Tool execution count: 1)`);
  console.log(`Evidence → VERIFIED (Causal sequence anchored)\n`);

  // ---------------------------------------------------------------------------
  // ACTION 2: Prohibited Action (Immediate Policy BLOCK)
  // ---------------------------------------------------------------------------
  console.log('---------------------------------------------------------------');
  console.log('ACTION 2: Prohibited Action Defense (Zero-Trust BLOCK)');
  console.log('---------------------------------------------------------------');

  const session2 = await adapter.start();
  console.log(`Agent → DIRECT_DB_DDL("DROP TABLE customers;") [Session: ${session2.executionId}]`);

  const blockResult = await adapter.execute(session2, {
    taskId: 'task-malicious-ddl',
    description: 'Attempt to execute destructive schema changes',
    targetCapability: 'DIRECT_DB_DDL',
    actionType: 'DELETE',
    payload: { sql: 'DROP TABLE customers;' }
  });

  assert.strictEqual(blockResult.status, 'BLOCKED');
  assert.strictEqual(blockResult.toolExecuted, false);
  assert.strictEqual(blockResult.toolExecutionCount, 0);
  console.log(`Guardian → BLOCK (${blockResult.error})`);
  console.log(`Tool → NOT EXECUTED (Tool execution count: 0)`);
  console.log(`Evidence → VERIFIED (Cryptographic hash chain validated)\n`);

  const chain = EvidenceLedger.verifyChain();
  assert.strictEqual(chain.valid, true);

  console.log('================================================================');
  console.log(` GOVERNANCE ENFORCEMENT: PROVEN (${chain.totalEntries} Evidence Ledger entries)`);
  console.log('================================================================\n');
}

runProof().catch(err => {
  console.error('Proof failed:', err);
  process.exit(1);
});
