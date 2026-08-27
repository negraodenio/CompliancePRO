/**
 * FASE 8.3: REAL-TIME GOVERNANCE SIMULATOR & ADVERSARIAL STRESS TEST SUITE
 * Tests:
 * 1. 10 Adversarial Attack & Abuse Scenarios
 * 2. High-Throughput Stress Burst (50 to 100 ev/s)
 * 3. Strict Simulation Namespace Isolation (Zero Baseline Pollution)
 * 4. Runtime Invariants: Detect -> Decide -> Block -> Contain -> Evidence -> Recover
 */

import { GovernanceSimulator, ADVERSARIAL_SCENARIOS } from '../src/web/services/governance-simulator';
import { DecisionStore } from '../src/web/services/decision-store';
import { AuditLedgerStore } from '../src/web/services/audit-ledger-store';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`[FAIL]: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`  [PASS] ${message}`);
}

console.log("==================================================================");
console.log(">>> RUNNING PHASE 8.3: REAL-TIME GOVERNANCE SIMULATOR SUITE <<<");
console.log("==================================================================\n");

let testCount = 0;
function testGroup(name: string, fn: () => void) {
  console.log(`[TEST ${++testCount}] ${name}...`);
  fn();
  console.log("");
}

// 1. SCENARIO 01 TO 05 (GATES, CIRCUIT BREAKERS & FINOPS)
testGroup("Adversarial Scenarios 01-05: Runtime Gates & Circuit Breakers", () => {
  // SCENARIO-01: High-Value Disbursal Interception
  const run1 = GovernanceSimulator.executeScenario('SCENARIO-01');
  assert(run1.status === 'COMPLETED', "Scenario 01 executed successfully");
  assert(run1.eventsBlocked === 1, "High-value autonomous transaction intercepted");
  assert(run1.events[0].governanceAction === 'HITL_INTERCEPTED', "Action mapped to HITL_INTERCEPTED");
  assert(run1.evidenceGenerated === 1, "Evidence digest generated for HITL Gate");

  // SCENARIO-02: Mass Bulk Modification
  const run2 = GovernanceSimulator.executeScenario('SCENARIO-02');
  assert(run2.status === 'COMPLETED', "Scenario 02 executed successfully");
  assert(run2.events[0].policyEvaluated === 'POL-CG-AG-05-01', "Policy POL-CG-AG-05-01 evaluated for bulk burst");

  // SCENARIO-03: Production DDL Attack
  const run3 = GovernanceSimulator.executeScenario('SCENARIO-03');
  assert(run3.status === 'COMPLETED', "Scenario 03 executed successfully");
  assert(run3.events[0].governanceAction === 'BLOCKED', "Direct DDL query strictly blocked");

  // SCENARIO-04: Tool Loop Circuit Breaker
  const run4 = GovernanceSimulator.executeScenario('SCENARIO-04');
  assert(run4.status === 'COMPLETED', "Scenario 04 executed successfully");
  assert(run4.eventsProcessed === 16, "16 loop iterations processed");
  assert(run4.eventsContained === 1, "Circuit Breaker HARD_KILL contained runaway loop");
  assert(run4.containmentLatencyMs > 0, `Containment latency measured: ${run4.containmentLatencyMs}ms`);

  // SCENARIO-05: FinOps Token Spike Anomaly
  const run5 = GovernanceSimulator.executeScenario('SCENARIO-05');
  assert(run5.status === 'COMPLETED', "Scenario 05 executed successfully");
  assert(run5.events[0].payload.actionTaken === 'SAFE_FALLBACK', "FinOps anomaly triggered SAFE_FALLBACK model tier");
});

// 2. SCENARIO 06 TO 10 (SHADOW AI, PII, BYPASS & TAMPER)
testGroup("Adversarial Scenarios 06-10: Shadow AI, PII, Bypass & Ledger Tamper", () => {
  // SCENARIO-06: Shadow AI Egress
  const run6 = GovernanceSimulator.executeScenario('SCENARIO-06');
  assert(run6.events[0].governanceAction === 'BLOCKED', "Direct unauthenticated external egress blocked");

  // SCENARIO-07: PII Data Protection
  const run7 = GovernanceSimulator.executeScenario('SCENARIO-07');
  assert(run7.events[0].payload.sanitizerAction === 'AUTO_MASKED', "Presidio sanitizer automatically masked sensitive tokens");

  // SCENARIO-08: Sub-threshold Policy Bypass
  const run8 = GovernanceSimulator.executeScenario('SCENARIO-08');
  assert(run8.eventsProcessed === 5, "5 fragmented sub-threshold requests processed");
  assert(run8.eventsBlocked >= 1, "Sliding window velocity aggregator caught fragmentation pattern (BYPASS_DETECTED)");

  // SCENARIO-09: Concurrency Write Collision (OCC)
  const run9 = GovernanceSimulator.executeScenario('SCENARIO-09');
  assert(run9.events[0].payload.conflictCaught === 'CONCURRENT_MODIFICATION', "Optimistic Concurrency Control caught conflicting write");

  // SCENARIO-10: Audit Ledger Tamper Detection & Restore
  const run10 = GovernanceSimulator.executeScenario('SCENARIO-10');
  assert(run10.events[0].payload.chainCompromised === true, "Ledger integrity verification flagged tampered hash");
  assert(run10.events[0].payload.canonicalRestored === true, "Canonical ledger restored after tamper test");
});

// 3. HIGH-THROUGHPUT STRESS BURST (50 ev/s)
testGroup("High-Throughput Stress Burst Testing", () => {
  const stressRun = GovernanceSimulator.runStressTest(50, 2); // 100 events in 2 seconds
  assert(stressRun.status === 'COMPLETED', "Stress burst completed without timeout");
  assert(stressRun.eventsProcessed === 100, "100 events processed in simulated burst");
  assert(stressRun.eventsBlocked > 0 && stressRun.eventsAllowed > 0, "Correctly filtered adverse vs legitimate tool traffic");
  assert(stressRun.detectionLatencyMs < 10, `Observed low detection latency: ${stressRun.detectionLatencyMs}ms`);
});

// 4. ZERO BASELINE POLLUTION VERIFICATION
testGroup("Zero Baseline Pollution & Namespace Isolation", () => {
  const baselineFindings = DecisionStore.getFindings();
  const baselineBlocks = AuditLedgerStore.getBlocks();

  assert(baselineFindings.length === 4, `Baseline findings count remained intact (4 findings)`);
  assert(baselineBlocks.length === 7, `Baseline ledger height remained intact (7 blocks)`);

  const ledgerVerif = AuditLedgerStore.verifyEntireLedger();
  assert(ledgerVerif.isChainValid === true, "Audit Ledger remains 100% Cryptographically Valid after all adversarial simulations");
  assert(ledgerVerif.brokenLinks === 0, "0 Broken Links after simulations");
});

console.log("==================================================================");
console.log(`>>> REAL-TIME GOVERNANCE SIMULATOR RESULTS: ALL ${testCount} TEST GROUPS PASSED <<<`);
console.log("==================================================================\n");
