/**
 * PHASE 9.1 STEP 3: MIGRATION RUNNER & CHECKSUM INTEGRITY TEST
 */

import { MigrationRunner } from '../src/server/db/migration-runner';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`[FAIL] ${msg}`);
    throw new Error(msg);
  }
  console.log(`  [PASS] ${msg}`);
}

console.log("==================================================================");
console.log(">>> RUNNING STEP 3: MIGRATION RUNNER & CHECKSUM TEST SUITE <<<");
console.log("==================================================================\n");

const migrations = MigrationRunner.getMigrationFiles();
assert(migrations.length >= 1, `Found ${migrations.length} migration file(s)`);

const initialSchema = migrations.find(m => m.filename === '001_initial_schema.sql');
assert(initialSchema !== undefined, "001_initial_schema.sql located");
assert(initialSchema!.checksum.length === 64, `Computed SHA-256 checksum: ${initialSchema!.checksum}`);

const runResult = await MigrationRunner.runMigrations({ dryRun: true });
assert(runResult.success === true, "Migration dry-run execution succeeded");
assert(runResult.appliedMigrations.length >= 1, "Recorded applied migration record");

const seedResult = await MigrationRunner.runBaselineSeed();
assert(seedResult.success === true, "Baseline seed verification passed");
assert(seedResult.checksum.length === 64, `Seed checksum: ${seedResult.checksum}`);

console.log("\n==================================================================");
console.log(">>> MIGRATION RUNNER SUITE: ALL TESTS PASSED <<<");
console.log("==================================================================\n");
