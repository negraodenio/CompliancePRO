import { DatabaseReconciler } from '../src/server/db/reconciliation';

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(`[FAIL] ${msg}`);
  console.log(`  [PASS] ${msg}`);
}

console.log("==================================================================");
console.log(">>> RUNNING PHASE 9.5: PRODUCTION DATA INTEGRITY SUITE <<<");
console.log("==================================================================\n");

const reconciliation = DatabaseReconciler.reconcileBaseline();
assert(reconciliation.integrity.isFullyReconciled === true, "All 11 collections 100% reconciled");
assert(reconciliation.integrity.orphans === 0, "0 orphan records in production plane");
assert(reconciliation.integrity.duplicates === 0, "0 duplicate keys");
assert(reconciliation.integrity.crossTenantLeaks === 0, "0 cross-tenant leaks");

console.log("\n>>> PRODUCTION DATA INTEGRITY SUITE: ALL TESTS PASSED <<<\n");
