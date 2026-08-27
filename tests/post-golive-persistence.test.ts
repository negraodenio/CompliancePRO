import { PersistenceAdapter } from '../src/web/services/persistence-adapter';

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(`[FAIL] ${msg}`);
  console.log(`  [PASS] ${msg}`);
}

console.log("==================================================================");
console.log(">>> RUNNING PHASE 9.6: POST-GOLIVE PERSISTENCE SUITE <<<");
console.log("==================================================================\n");

const recovery = PersistenceAdapter.recoverPendingTransactions();
assert(recovery.clean === true, "Transactional persistence recovery journal is clean");

console.log("\n>>> POST-GOLIVE PERSISTENCE SUITE: ALL TESTS PASSED <<<\n");
