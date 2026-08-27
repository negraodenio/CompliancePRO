import { AlertingService } from '../src/server/observability/alerting-service';

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(`[FAIL] ${msg}`);
  console.log(`  [PASS] ${msg}`);
}

console.log("==================================================================");
console.log(">>> RUNNING PHASE 9.3: OPERATIONAL ALERTING SUITE <<<");
console.log("==================================================================\n");

const alerts = AlertingService.getAllAlerts();
assert(alerts.length >= 1, "Alert rules registered");

const activeAlerts = AlertingService.getActiveAlerts();
assert(activeAlerts.some(a => a.severity === 'HIGH'), "Active high severity alerts surfaced");

console.log("\n>>> OPERATIONAL ALERTING SUITE: ALL TESTS PASSED <<<\n");
