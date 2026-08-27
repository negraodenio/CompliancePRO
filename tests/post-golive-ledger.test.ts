import { AuditLedgerStore } from '../src/web/services/audit-ledger-store';

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(`[FAIL] ${msg}`);
  console.log(`  [PASS] ${msg}`);
}

console.log("==================================================================");
console.log(">>> RUNNING PHASE 9.6: POST-GOLIVE AUDIT LEDGER SUITE <<<");
console.log("==================================================================\n");

const verification = AuditLedgerStore.verifyEntireLedger();
assert(verification.isChainValid === true, "Audit ledger chain from Genesis to Head #6 is 100% valid");
assert(verification.brokenLinks === 0, "0 broken links in production audit ledger");

console.log("\n>>> POST-GOLIVE AUDIT LEDGER SUITE: ALL TESTS PASSED <<<\n");
