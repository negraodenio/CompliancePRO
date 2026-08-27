import { SystemHealthMonitor } from '../src/server/observability/health-monitor';
import { TelemetryService } from '../src/server/observability/telemetry-service';

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(`[FAIL] ${msg}`);
  console.log(`  [PASS] ${msg}`);
}

console.log("==================================================================");
console.log(">>> RUNNING PHASE 9.5: PRODUCTION OBSERVABILITY SUITE <<<");
console.log("==================================================================\n");

const health = SystemHealthMonitor.evaluateHealth();
assert(health.liveness === 'HEALTHY', "Liveness probe is HEALTHY");
assert(health.readiness === 'HEALTHY', "Readiness probe is HEALTHY");

const metrics = TelemetryService.getMetrics();
assert(metrics.ledgerIntegrityValid === true, "Audit ledger continuity valid");

console.log("\n>>> PRODUCTION OBSERVABILITY SUITE: ALL TESTS PASSED <<<\n");
