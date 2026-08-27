/**
 * PHASE 9.1 STEP 3: TRANSACTION ROLLBACK & ZERO ORPHANS TEST
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
console.log(">>> RUNNING STEP 3: TRANSACTION ROLLBACK & ZERO ORPHANS SUITE <<<");
console.log("==================================================================\n");

PersistenceAdapter.resetAllForTesting();
PersistenceAdapter.setContext({
  tenantId: 'TENANT-ROLLBACK-01',
  workspaceId: 'WS-DEFAULT',
  environment: 'production'
});

// Setup existing state
PersistenceAdapter.write('findings', { id: 'FIND-INITIAL', status: 'PENDING' });
PersistenceAdapter.write('ledger', { blockId: 'LEDGER-INITIAL', version: 1 });

let rollbackCaught = false;
try {
  PersistenceAdapter.atomicStoreBatchCommit('TX_MULTI_STEP_CRASH', [
    { collection: 'findings', data: { id: 'FIND-NEW-STAGE' } },
    { collection: 'evidence', data: { id: 'EV-NEW-STAGE' } },
    { collection: 'ledger', data: { blockId: 'LEDGER-NEW-STAGE' }, expectedVersion: 999 } // Injected OCC mismatch
  ]);
} catch (err: any) {
  if (err.code === 'TRANSACTION_ROLLED_BACK' || err.code === 'CONCURRENT_MODIFICATION') {
    rollbackCaught = true;
  }
}

assert(rollbackCaught === true, "Multi-step atomic commit threw rollback error");

// Verify that all intermediate collections were rolled back
const currentFinding = PersistenceAdapter.read<any>('findings');
const currentEvidence = PersistenceAdapter.read<any>('evidence');

assert(currentFinding.id === 'FIND-INITIAL', "Findings rolled back to initial state");
assert(currentEvidence === null, "Failed evidence record completely absent (0 Partial Orphans)");

console.log("\n==================================================================");
console.log(">>> TRANSACTION ROLLBACK SUITE: ALL TESTS PASSED <<<");
console.log("==================================================================\n");
