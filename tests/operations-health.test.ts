import { SystemHealthMonitor } from '../src/server/observability/health-monitor';

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(`[FAIL] ${msg}`);
  console.log(`  [PASS] ${msg}`);
}

console.log("==================================================================");
console.log(">>> RUNNING PHASE 9.3: OPERATIONS HEALTH TEST SUITE <<<");
console.log("==================================================================\n");

const health = SystemHealthMonitor.evaluateHealth();
assert(health.liveness === 'HEALTHY', "Liveness probe is HEALTHY");
assert(health.readiness === 'HEALTHY', "Readiness probe is HEALTHY");
assert(health.components.length >= 5, "Monitors all core governance components");

console.log("\n>>> OPERATIONS HEALTH SUITE: ALL TESTS PASSED <<<\n");
