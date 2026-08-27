import { ProductionGoLiveController } from '../src/server/deployment/go-live-controller';

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(`[FAIL] ${msg}`);
  console.log(`  [PASS] ${msg}`);
}

console.log("==================================================================");
console.log(">>> RUNNING PHASE 9.5: PRODUCTION SMOKE TEST SUITE <<<");
console.log("==================================================================\n");

const smoke = ProductionGoLiveController.executeSmokeTests();
assert(smoke.created === true, "Test record created");
assert(smoke.read === true, "Test record read back accurately");
assert(smoke.updatedVersion >= 1, "Test record updated with version");
assert(smoke.deleted === true, "Test record deleted post-validation");
assert(smoke.verifiedClean === true, "Zero test artifacts leaked into production store");

console.log("\n>>> PRODUCTION SMOKE SUITE: ALL TESTS PASSED <<<\n");
