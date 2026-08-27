import { RollbackController } from '../src/server/deployment/rollback-controller';

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(`[FAIL] ${msg}`);
  console.log(`  [PASS] ${msg}`);
}

console.log("==================================================================");
console.log(">>> RUNNING PHASE 9.4: ROLLBACK CONTROLLER TEST SUITE <<<");
console.log("==================================================================\n");

const rbRes = RollbackController.executeRollback({
  reason: 'Simulated post-cutover health check degradation',
  failedStep: 'HEALTH_VALIDATION',
  timestamp: new Date().toISOString()
});

assert(rbRes.success === true, "Rollback executed cleanly");
assert(rbRes.status === 'ROLLED_BACK', "State marked as ROLLED_BACK");
assert(rbRes.restoredStateValid === true, "Restored state verified with zero orphan records");

console.log("\n>>> ROLLBACK CONTROLLER SUITE: ALL TESTS PASSED <<<\n");
