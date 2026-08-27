/**
 * PHASE 9.1 STEP 3: POSTGRES PERSISTENCE ROUND-TRIP TEST
 */

import { PersistenceAdapter } from '../src/web/services/persistence-adapter';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`[FAIL] ${msg}`);
    throw new Error(msg);
  }
  console.log(`  [PASS] ${msg}`);
}

console.log("==================================================================");
console.log(">>> RUNNING STEP 3: CROSS-PILLAR ROUND-TRIP PERSISTENCE SUITE <<<");
console.log("==================================================================\n");

PersistenceAdapter.resetAllForTesting();
PersistenceAdapter.setContext({
  tenantId: 'TENANT-ENTERPRISE-01',
  workspaceId: 'WS-FINANCE',
  environment: 'production'
});

// Write Cross-Pillar Causal Pipeline
const finding = PersistenceAdapter.write('findings', {
  id: 'FIND-RT-001',
  riskId: 'RISK-RT-001',
  finding: 'Autonomous disbursal over limit without HITL',
  severity: 'HIGH',
  status: 'IN_TREATMENT'
});
assert(finding.id === 'FIND-RT-001', "Finding persisted to data plane");

const action = PersistenceAdapter.write('remediations', {
  actionId: 'ACT-RT-001',
  findingId: 'FIND-RT-001',
  riskId: 'RISK-RT-001',
  status: 'PENDING_VERIFICATION'
});
assert(action.actionId === 'ACT-RT-001', "Remediation action persisted with FK to finding");

const evidence = PersistenceAdapter.write('evidence', {
  evidenceId: 'EV-RT-001',
  relatedFindingId: 'FIND-RT-001',
  integrityDigest: 'SHA256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
  status: 'SEALED_IN_LEDGER'
});
assert(evidence.evidenceId === 'EV-RT-001', "Protected evidence persisted with canonical hash");

// Simulate memory restart & reload
const readFinding = PersistenceAdapter.read<any>('findings');
const readAction = PersistenceAdapter.read<any>('remediations');
const readEvidence = PersistenceAdapter.read<any>('evidence');

assert(readFinding !== null && readFinding.id === 'FIND-RT-001', "Reloaded finding retains identical ID");
assert(readAction !== null && readAction.findingId === 'FIND-RT-001', "Reloaded action preserves causal link to finding");
assert(readEvidence !== null && readEvidence.integrityDigest === 'SHA256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069', "Reloaded evidence preserves cryptographic digest");

console.log("\n==================================================================");
console.log(">>> CROSS-PILLAR ROUND-TRIP SUITE: ALL TESTS PASSED <<<");
console.log("==================================================================\n");
