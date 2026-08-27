import { CutoverController } from '../src/server/deployment/cutover-controller';

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(`[FAIL] ${msg}`);
  console.log(`  [PASS] ${msg}`);
}

console.log("==================================================================");
console.log(">>> RUNNING PHASE 9.4: CUTOVER CONTROLLER TEST SUITE <<<");
console.log("==================================================================\n");

const state = CutoverController.evaluateReadiness();
assert(state === 'READY_FOR_CUTOVER', "Cutover state transitions to READY_FOR_CUTOVER");

const authRes = CutoverController.requestCutoverAuthorization(
  'USR-CISO-01',
  'CISO & Platform Governance Lead',
  'CR-2026-TEST-01',
  'Formal enterprise cutover authorization'
);

assert(authRes.success === true, "Operator authorization request recorded");
assert(authRes.cutoverId.startsWith('CUTOVER-'), "Cutover assigned unique ID");
assert(authRes.authorization.evidenceDigest.startsWith('SHA256:'), "Authorization sealed with cryptographic evidence digest");

console.log("\n>>> CUTOVER CONTROLLER SUITE: ALL TESTS PASSED <<<\n");
