/**
 * CG-AG GOVERNANCE OS — POSTGRES PERSISTENCE ADAPTER TEST SUITE
 * Phase 9.1 Step 2: Data Access Layer & Relational Engine Validation
 */

import { PostgresPersistenceAdapter } from '../src/server/db/postgres-adapter';
import {
  PersistenceAdapter,
  PersistenceContext,
  DEFAULT_PERSISTENCE_CONTEXT
} from '../src/web/services/persistence-adapter';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`[FAIL]: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`  [PASS] ${message}`);
}

console.log("==================================================================");
console.log(">>> RUNNING PHASE 9.1 STEP 2: POSTGRES ADAPTER VALIDATION SUITE <<<");
console.log("==================================================================\n");

// -----------------------------------------------------------------------------
// TEST 1: ENVIRONMENT CONFIGURATION & SAFE MEMORY FALLBACK
// -----------------------------------------------------------------------------
console.log("[TEST 1] Environment Configuration & Safe Memory Fallback...");
const initResWithoutEnv = PostgresPersistenceAdapter.initialize({});
assert(initResWithoutEnv.ready === false, "Adapter safely stays uninitialized when DATABASE_URL is not provided");
assert(initResWithoutEnv.error !== undefined, "Informative error/fallback message returned");
assert(PostgresPersistenceAdapter.isReady() === false, "Postgres isReady() returns false without connection string");

// -----------------------------------------------------------------------------
// TEST 2: COLLECTION TO POSTGRES TABLE MAPPING
// -----------------------------------------------------------------------------
console.log("\n[TEST 2] Collection to PostgreSQL Table Mapping...");
assert(PostgresPersistenceAdapter.mapCollectionToTable('findings') === 'operational_findings', "findings -> operational_findings");
assert(PostgresPersistenceAdapter.mapCollectionToTable('hitl_gates') === 'hitl_approval_gates', "hitl_gates -> hitl_approval_gates");
assert(PostgresPersistenceAdapter.mapCollectionToTable('remediations') === 'remediation_actions', "remediations -> remediation_actions");
assert(PostgresPersistenceAdapter.mapCollectionToTable('incidents') === 'ai_incidents', "incidents -> ai_incidents");
assert(PostgresPersistenceAdapter.mapCollectionToTable('finops') === 'finops_entity_usage', "finops -> finops_entity_usage");
assert(PostgresPersistenceAdapter.mapCollectionToTable('evidence') === 'protected_evidence', "evidence -> protected_evidence");
assert(PostgresPersistenceAdapter.mapCollectionToTable('audit_ledger') === 'audit_ledger_blocks', "audit_ledger -> audit_ledger_blocks");
assert(PostgresPersistenceAdapter.mapCollectionToTable('dossiers') === 'regulatory_dossiers', "dossiers -> regulatory_dossiers");
assert(PostgresPersistenceAdapter.mapCollectionToTable('policies') === 'governance_policies', "policies -> governance_policies");
assert(PostgresPersistenceAdapter.mapCollectionToTable('entities') === 'ai_entities', "entities -> ai_entities");

// -----------------------------------------------------------------------------
// TEST 3: DUAL-MODE SELECTION & BACKWARD COMPATIBILITY
// -----------------------------------------------------------------------------
console.log("\n[TEST 3] Dual-Mode Adapter Switching & Backward Compatibility...");
PersistenceAdapter.resetAllForTesting();
const ctxAlpha: PersistenceContext = {
  tenantId: 'TENANT-ALPHA',
  workspaceId: 'WS-CORE',
  environment: 'production'
};
PersistenceAdapter.setContext(ctxAlpha);
assert(PersistenceAdapter.getContext().tenantId === 'TENANT-ALPHA', "PersistenceAdapter context set to TENANT-ALPHA");

// In memory mode (default), basic operations run seamlessly
const findingData = {
  id: 'FIND-PG-001',
  title: 'Postgres Dual-Mode Validation Finding',
  severity: 'HIGH',
  status: 'PENDING_DECISION'
};
const written = PersistenceAdapter.write('findings', findingData);
assert(written.id === 'FIND-PG-001', "Record written successfully through adapter");
assert(written.version === 1, "Initial record version is 1");
assert(written.tenantId === 'TENANT-ALPHA', "Tenant ID injected automatically from context");

// -----------------------------------------------------------------------------
// TEST 4: TENANT ISOLATION IN DATA ACCESS LAYER
// -----------------------------------------------------------------------------
console.log("\n[TEST 4] Multi-Tenant Boundary Isolation in Data Access Layer...");
const ctxBeta: PersistenceContext = {
  tenantId: 'TENANT-BETA',
  workspaceId: 'WS-CORE',
  environment: 'production'
};
PersistenceAdapter.setContext(ctxBeta);
const betaRead = PersistenceAdapter.read('findings');
assert(betaRead === null, "Tenant Beta cannot read Tenant Alpha data (Zero Cross-Tenant Leakage)");

// -----------------------------------------------------------------------------
// TEST 5: OPTIMISTIC CONCURRENCY CONTROL (OCC) ERROR DISPATCH
// -----------------------------------------------------------------------------
console.log("\n[TEST 5] Optimistic Concurrency Control (OCC) Stale Write Detection...");
PersistenceAdapter.setContext(ctxAlpha);
let occErrorCaught = false;
try {
  PersistenceAdapter.write('findings', { ...findingData, title: 'Updated' }, undefined, 999);
} catch (err: any) {
  if (err.code === 'CONCURRENT_MODIFICATION') {
    occErrorCaught = true;
  }
}
assert(occErrorCaught === true, "Adapter rejected stale write with CONCURRENT_MODIFICATION error");

// -----------------------------------------------------------------------------
// TEST 6: ATOMIC BATCH TRANSACTION & ROLLBACK INVARIANTS
// -----------------------------------------------------------------------------
console.log("\n[TEST 6] Atomic Batch Transaction & Rollback Invariants...");
PersistenceAdapter.write('ledger', { blockId: 'LEDGER-EXISTING', version: 1 });
let rollbackCaught = false;
try {
  PersistenceAdapter.atomicStoreBatchCommit('TEST_FAIL_BATCH', [
    { collection: 'findings', data: { id: 'FIND-TEMP' } },
    { collection: 'ledger', data: { blockId: 'LEDGER-TEMP' }, expectedVersion: 999 } // Stale version vs 1
  ]);
} catch (err: any) {
  if (err.code === 'TRANSACTION_ROLLED_BACK' || err.code === 'CONCURRENT_MODIFICATION') {
    rollbackCaught = true;
  }
}
assert(rollbackCaught === true, "Atomic batch threw rollback exception on intermediate step failure");

// -----------------------------------------------------------------------------
// TEST 7: ZERO SECRETS & CREDENTIAL SCAN
// -----------------------------------------------------------------------------
console.log("\n[TEST 7] Security Scan: Zero Hardcoded Credentials...");
const fs = await import('fs');
const path = await import('path');
const pgAdapterSource = fs.readFileSync(path.resolve(process.cwd(), 'src/server/db/postgres-adapter.ts'), 'utf-8');

assert(!pgAdapterSource.includes('postgres://admin:'), "No hardcoded postgres:// URI in source code");
assert(!pgAdapterSource.includes('password ='), "No hardcoded password assignment");
assert(pgAdapterSource.includes('process.env.DATABASE_URL'), "Database connection string read strictly from environment variable");

console.log("\n==================================================================");
console.log(">>> PHASE 9.1 STEP 2: ALL POSTGRES ADAPTER TESTS PASSED <<<");
console.log("==================================================================\n");
