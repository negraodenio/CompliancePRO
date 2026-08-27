import { SystemHealthMonitor } from '../src/server/observability/health-monitor';
import { TelemetryService } from '../src/server/observability/telemetry-service';

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(`[FAIL] ${msg}`);
  console.log(`  [PASS] ${msg}`);
}

console.log("==================================================================");
console.log(">>> RUNNING PHASE 9.6: POST-GOLIVE OBSERVABILITY SUITE <<<");
console.log("==================================================================\n");

const health = SystemHealthMonitor.evaluateHealth();
assert(health.liveness === 'HEALTHY', "Control plane liveness is HEALTHY");
assert(health.readiness === 'HEALTHY', "Control plane readiness is HEALTHY");

const telemetry = TelemetryService.getMetrics();
assert(telemetry.ledgerIntegrityValid === true, "Telemetry confirms audit ledger integrity");

console.log("\n>>> POST-GOLIVE OBSERVABILITY SUITE: ALL TESTS PASSED <<<\n");
