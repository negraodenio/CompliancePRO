import { ProductionPreflightEngine } from '../src/server/deployment/production-preflight';

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(`[FAIL] ${msg}`);
  console.log(`  [PASS] ${msg}`);
}

console.log("==================================================================");
console.log(">>> RUNNING PHASE 9.4: PRODUCTION SAFETY INVARIANTS SUITE <<<");
console.log("==================================================================\n");

const report = ProductionPreflightEngine.evaluatePreflight();
const dbGate = report.items.find(i => i.item.includes('PostgreSQL Cloud Instance'));
assert(dbGate !== undefined && dbGate.status === 'CONFIGURATION_REQUIRED', "External DB correctly marked as CONFIGURATION_REQUIRED (Zero fake active)");

const secretGate = report.items.find(i => i.item.includes('Secret Manager'));
assert(secretGate !== undefined && secretGate.status === 'CONFIGURATION_REQUIRED', "Secret Manager correctly marked as CONFIGURATION_REQUIRED");

console.log("\n>>> PRODUCTION SAFETY INVARIANTS SUITE: ALL TESTS PASSED <<<\n");
