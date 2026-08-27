/**
 * PHASE 9.1 STEP 3: OCC CONCURRENCY & STALE WRITE REJECTION TEST
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
console.log(">>> RUNNING STEP 3: OCC CONCURRENCY REJECTION TEST SUITE <<<");
console.log("==================================================================\n");

PersistenceAdapter.resetAllForTesting();
PersistenceAdapter.setContext({
  tenantId: 'TENANT-CONCURRENCY-01',
  workspaceId: 'WS-DEFAULT',
  environment: 'production'
});

// Initial Write: Version 1
const v1 = PersistenceAdapter.write('findings', { id: 'FIND-OCC-001', status: 'PENDING_DECISION' });
assert(v1.version === 1, "Initial record created at version 1");

// Transaction A: Updates to Version 2
const v2 = PersistenceAdapter.write('findings', { id: 'FIND-OCC-001', status: 'IN_TREATMENT' }, undefined, 1);
assert(v2.version === 2, "Transaction A successfully advanced version to 2");

// Transaction B: Stale Update using Version 1
let occConflictBlocked = false;
try {
  PersistenceAdapter.write('findings', { id: 'FIND-OCC-001', status: 'REJECTED' }, undefined, 1);
} catch (err: any) {
  if (err.code === 'CONCURRENT_MODIFICATION') {
    occConflictBlocked = true;
  }
}
assert(occConflictBlocked === true, "Transaction B blocked by Optimistic Concurrency Control (0 Silent Overwrite)");

console.log("\n==================================================================");
console.log(">>> OCC CONCURRENCY SUITE: ALL TESTS PASSED <<<");
console.log("==================================================================\n");
