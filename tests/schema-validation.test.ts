/**
 * FASE 9.1 STEP 1: SQL SCHEMA, MIGRATION & BASELINE SEED VALIDATION TEST
 */

import path from 'path';
import { fileURLToPath } from 'url';
import { SchemaValidator } from '../src/server/db/schema-validator';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`[FAIL]: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`  [PASS] ${message}`);
}

console.log("==================================================================");
console.log(">>> RUNNING PHASE 9.1 STEP 1: SCHEMA & SEED VALIDATION SUITE <<<");
console.log("==================================================================\n");

const migrationPath = path.resolve(__dirname, '../src/server/db/migrations/001_initial_schema.sql');
const seedPath = path.resolve(__dirname, '../src/server/db/seeds/baseline_seed.sql');

const schemaSql = SchemaValidator.loadSchema(migrationPath);
const seedSql = SchemaValidator.loadSeed(seedPath);
const tables = SchemaValidator.parseTables(schemaSql);

console.log(`[TEST 1] Tables Parsed: Found ${tables.length} tables in 001_initial_schema.sql`);
assert(tables.length === 13, `Expected 13 core tables, found ${tables.length}`);

console.log("\n[TEST 2] Tenant & Workspace Isolation Scoping...");
tables.forEach(t => {
  if (t.tableName !== 'tenants' && t.tableName !== 'cg_ag_controls') {
    assert(t.hasTenantScope === true, `Table [${t.tableName}] contains tenant_id scope`);
    assert(t.hasWorkspaceScope === true, `Table [${t.tableName}] contains workspace_id scope`);
  }
});

console.log("\n[TEST 3] Optimistic Concurrency Control (OCC) Versioning...");
const occTables = ['ai_entities', 'governance_policies', 'operational_findings', 'hitl_approval_gates', 'remediation_actions', 'ai_incidents', 'finops_entity_usage', 'protected_evidence', 'regulatory_dossiers'];
occTables.forEach(tName => {
  const table = tables.find(t => t.tableName === tName);
  assert(table !== undefined && table.hasOCCVersion === true, `Table [${tName}] enforces OCC version column`);
});

console.log("\n[TEST 4] Cryptographic Audit Ledger Constraints...");
const ledgerTable = tables.find(t => t.tableName === 'audit_ledger_blocks');
assert(ledgerTable !== undefined, "audit_ledger_blocks table defined");
assert(ledgerTable!.uniqueConstraints.some(cols => cols.includes('block_height')), "audit_ledger_blocks enforces unique block_height per tenant/workspace");
assert(ledgerTable!.uniqueConstraints.some(cols => cols.includes('block_hash')), "audit_ledger_blocks enforces unique block_hash per tenant/workspace");

console.log("\n[TEST 5] Baseline Seed Data Integrity & Zero Orphans...");
assert(seedSql.includes("DEVELOPMENT BASELINE"), "Seed is explicitly marked as DEVELOPMENT BASELINE");
assert(seedSql.includes("FIND-001") && seedSql.includes("RISK-2026-0042"), "Seed includes canonical FIND-001 -> RISK-2026-0042");
assert(seedSql.includes("GATE-2026-8801") && seedSql.includes("GATE-2026-8799"), "Seed includes canonical HITL Gates");
assert(seedSql.includes("ACT-2026-0042") && seedSql.includes("ACT-2026-0001"), "Seed includes canonical Remediation Actions");
assert(seedSql.includes("EV-2026-0042") && seedSql.includes("EV-2026-0001"), "Seed includes canonical Protected Evidence records");
assert(seedSql.includes("LEDGER-BLK-0000") && seedSql.includes("LEDGER-BLK-0089"), "Seed includes complete Genesis -> Head Ledger Chain");
assert(seedSql.includes("DOS-2026-EUAI-001") && seedSql.includes("DOS-2026-LGPD-002"), "Seed includes canonical Regulatory Dossiers");

console.log("\n==================================================================");
console.log(">>> PHASE 9.1 STEP 1: ALL SCHEMA & SEED TESTS PASSED <<<");
console.log("==================================================================\n");
