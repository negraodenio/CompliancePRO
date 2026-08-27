/**
 * PHASE 9.1 STEP 3: ADVERSARIAL TENANT & WORKSPACE ISOLATION TEST
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
console.log(">>> RUNNING STEP 3: ADVERSARIAL TENANT ISOLATION TEST SUITE <<<");
console.log("==================================================================\n");

PersistenceAdapter.resetAllForTesting();

// Tenant A Writes
PersistenceAdapter.setContext({
  tenantId: 'TENANT-A',
  workspaceId: 'WS-PRIMARY',
  environment: 'production'
});
PersistenceAdapter.write('policies', { id: 'POL-A-SECRET', title: 'Tenant A Confidential Policy' });

// Tenant B Attempts Read
PersistenceAdapter.setContext({
  tenantId: 'TENANT-B',
  workspaceId: 'WS-PRIMARY',
  environment: 'production'
});
const leakCheck = PersistenceAdapter.read('policies');
assert(leakCheck === null, "Tenant B cannot read Tenant A policies");

// Workspace Isolation Check within Tenant A
PersistenceAdapter.setContext({
  tenantId: 'TENANT-A',
  workspaceId: 'WS-SECONDARY',
  environment: 'production'
});
const wsLeakCheck = PersistenceAdapter.read('policies');
assert(wsLeakCheck === null, "Workspace Secondary cannot read Workspace Primary policies");

console.log("\n==================================================================");
console.log(">>> ADVERSARIAL TENANT ISOLATION SUITE: ALL TESTS PASSED <<<");
console.log("==================================================================\n");
