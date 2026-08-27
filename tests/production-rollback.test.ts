import { RollbackController } from '../src/server/deployment/rollback-controller';

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(`[FAIL] ${msg}`);
  console.log(`  [PASS] ${msg}`);
}

console.log("==================================================================");
console.log(">>> RUNNING PHASE 9.5: PRODUCTION ROLLBACK SUITE <<<");
console.log("==================================================================\n");

const rb = RollbackController.executeRollback({
  reason: 'Production verification test of rollback circuit',
  failedStep: 'SIMULATED_TEST',
  timestamp: new Date().toISOString()
});

assert(rb.success === true, "Rollback executed cleanly");
assert(rb.status === 'ROLLED_BACK', "Status marked as ROLLED_BACK");
assert(rb.restoredStateValid === true, "Restored state verified as clean");

console.log("\n>>> PRODUCTION ROLLBACK SUITE: ALL TESTS PASSED <<<\n");
