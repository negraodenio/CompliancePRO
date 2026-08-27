import { BackupRestoreManager } from '../src/server/db/backup-restore-manager';

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(`[FAIL] ${msg}`);
  console.log(`  [PASS] ${msg}`);
}

console.log("==================================================================");
console.log(">>> RUNNING PHASE 9.3: BACKUP & DR READINESS SUITE <<<");
console.log("==================================================================\n");

const snapshot = BackupRestoreManager.createSnapshot('TENANT-DEFAULT', 'WS-DEFAULT');
assert(snapshot.snapshotId.startsWith('BKP-'), "Snapshot ID generated");
assert(snapshot.snapshotDigest.startsWith('SHA256:'), "Snapshot digest generated");

console.log("\n>>> BACKUP & DR READINESS SUITE: ALL TESTS PASSED <<<\n");
