import { ProductionGoLiveController } from '../src/server/deployment/go-live-controller';

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(`[FAIL] ${msg}`);
  console.log(`  [PASS] ${msg}`);
}

console.log("==================================================================");
console.log(">>> RUNNING PHASE 9.5: PRODUCTION GO-LIVE TEST SUITE <<<");
console.log("==================================================================\n");

const res = ProductionGoLiveController.executeGoLive({
  operatorId: 'USR-CISO-01',
  operatorRole: 'CISO & Governance Lead',
  changeRequestId: 'CR-2026-GOLIVE-01',
  reason: 'Production Enterprise Go-Live'
});

assert(res.status === 'GO_LIVE_COMPLETED', "Go-live status is GO_LIVE_COMPLETED");
assert(res.preflightPassed === true, "Preflight passed");
assert(res.backupVerified === true, "Backup verified");
assert(res.smokeTestsPassed === true, "Smoke tests passed");
assert(res.evidenceDigest.startsWith('SHA256:'), "Cryptographic evidence digest generated");

console.log("\n>>> PRODUCTION GO-LIVE SUITE: ALL TESTS PASSED <<<\n");
