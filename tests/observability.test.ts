import { StructuredLogger } from '../src/server/observability/structured-logger';
import { TelemetryService } from '../src/server/observability/telemetry-service';

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(`[FAIL] ${msg}`);
  console.log(`  [PASS] ${msg}`);
}

console.log("==================================================================");
console.log(">>> RUNNING PHASE 9.3: STRUCTURED LOGGING & TELEMETRY SUITE <<<");
console.log("==================================================================\n");

StructuredLogger.clearLogsForTesting();
const logEvt = StructuredLogger.log({
  severity: 'INFO',
  component: 'DECISION_STORE',
  operation: 'RECORD_DECISION',
  tenantId: 'TENANT-DEFAULT',
  workspaceId: 'WS-DEFAULT',
  correlationId: 'CORR-REQ-001',
  result: 'SUCCESS',
  details: { findingId: 'FIND-001' }
});

assert(logEvt.eventId.startsWith('EVT-'), "Structured log assigned unique eventId");
assert(logEvt.correlationId === 'CORR-REQ-001', "Correlation ID preserved");

const metrics = TelemetryService.getMetrics();
assert(metrics.requestCount > 0, "Operational request count tracked");
assert(metrics.ledgerHeight === 6, "Cryptographic ledger height tracked");

console.log("\n>>> STRUCTURED LOGGING & TELEMETRY SUITE: ALL TESTS PASSED <<<\n");
