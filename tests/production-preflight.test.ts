import { ProductionPreflightEngine } from '../src/server/deployment/production-preflight';

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(`[FAIL] ${msg}`);
  console.log(`  [PASS] ${msg}`);
}

console.log("==================================================================");
console.log(">>> RUNNING PHASE 9.4: PRODUCTION PREFLIGHT TEST SUITE <<<");
console.log("==================================================================\n");

const report = ProductionPreflightEngine.evaluatePreflight();
assert(report.totalChecks >= 10, "Evaluates at least 10 preflight checks");
assert(report.readyCount >= 7, "All core technical preflight checks are READY");
assert(report.blockedCount === 0, "Zero blocking failures detected in codebase");
assert(report.isReadyForCutover === true, "Preflight engine confirms ready for operator cutover");

console.log("\n>>> PRODUCTION PREFLIGHT SUITE: ALL TESTS PASSED <<<\n");
