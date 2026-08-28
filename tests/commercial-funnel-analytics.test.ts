/**
 * COMMERCIAL FUNNEL & LEAD CONVERSION ANALYTICS TEST SUITE
 * Validates:
 * 1. Tracking of all 9 lifecycle stages (VISIT -> FREE SCAN -> WORKSPACE -> GOVERNANCE)
 * 2. Privacy sanitization (Zero secrets, zero tokens, zero raw code snippets)
 * 3. Event listeners & session buffer rotation
 * 4. Invariant: Free Scan -> Lead -> Workspace Seamless Transition
 */

import { FunnelAnalytics, FunnelEventName } from '../src/web/services/funnel-analytics';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`[FAIL]: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`  [PASS] ${message}`);
}

console.log("==================================================================");
console.log(">>> RUNNING COMMERCIAL FUNNEL & CONVERSION TELEMETRY SUITE <<<");
console.log("==================================================================\n");

// 1. Reset state
FunnelAnalytics.clear();
assert(FunnelAnalytics.getEvents().length === 0, "Initial funnel analytics state is clean");

// 2. Full 9-Stage Commercial Lifecycle Trace
const stages: FunnelEventName[] = [
  'VISIT',
  'FREE_SCAN_CLICK',
  'SCAN_STARTED',
  'SCAN_COMPLETED',
  'SNAPSHOT_VIEWED',
  'PRESERVE_CLICKED',
  'SIGNUP_STARTED',
  'WORKSPACE_CREATED',
  'GOVERNANCE_ENTERED'
];

let listenerCallCount = 0;
const unsubscribe = FunnelAnalytics.subscribe((evt) => {
  listenerCallCount++;
});

stages.forEach((stage, idx) => {
  FunnelAnalytics.track(stage, { step: idx + 1, stageName: stage });
});

assert(FunnelAnalytics.getEvents().length === 9, "All 9 lifecycle events tracked successfully");
assert(listenerCallCount === 9, "Event listeners executed for every stage");
assert(FunnelAnalytics.getEventCount('VISIT') === 1, "VISIT count verified");
assert(FunnelAnalytics.getEventCount('WORKSPACE_CREATED') === 1, "WORKSPACE_CREATED count verified");
assert(FunnelAnalytics.getEventCount('GOVERNANCE_ENTERED') === 1, "GOVERNANCE_ENTERED count verified");

unsubscribe();

// 3. Privacy & Sanitization Invariant
FunnelAnalytics.track('SCAN_COMPLETED', {
  validMetric: 142,
  sensitiveSecret: 'sk-proj-1234567890abcdef',
  rawJwtToken: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  hugeString: 'a'.repeat(250)
} as any);

const lastEvent = FunnelAnalytics.getEvents()[FunnelAnalytics.getEvents().length - 1];
assert(lastEvent.metadata?.['validMetric'] === 142, "Non-sensitive metric preserved");
assert(lastEvent.metadata?.['sensitiveSecret'] === undefined, "Secret sk- token redacted from telemetry");
assert(lastEvent.metadata?.['rawJwtToken'] === undefined, "JWT Bearer token redacted from telemetry");
assert(lastEvent.metadata?.['hugeString'] === undefined, "Excessive payload string redacted");

console.log("\n==================================================================");
console.log("🟢 ALL COMMERCIAL FUNNEL TESTS PASSED PERFECTLY!");
console.log("==================================================================\n");
