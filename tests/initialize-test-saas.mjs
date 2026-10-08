// Test-only initialization manifest/verifier. DDL is applied in the positively selected TEST SQL Editor.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { readTestEnvironment, requireTestSaasSchema, TEST_PROJECT_REF } from './test-supabase-environment.mjs';

const source = fs.readFileSync('course/schema_supabase.sql', 'utf8').replace(/\r\n/g, '\n');
const subset = fs.readFileSync('tests/test-saas-prerequisites.sql', 'utf8').replace(/\r\n/g, '\n');
const patterns = [
  /CREATE EXTENSION IF NOT EXISTS "uuid-ossp";/,
  /CREATE TABLE IF NOT EXISTS public\.organizations \([\s\S]*?\n\);/,
  /CREATE TABLE IF NOT EXISTS public\.organization_members \([\s\S]*?\n\);/,
  /CREATE TABLE IF NOT EXISTS public\.entitlements \([\s\S]*?\n\);/,
  /ALTER TABLE public\.organizations ENABLE ROW LEVEL SECURITY;/,
  /ALTER TABLE public\.organization_members ENABLE ROW LEVEL SECURITY;/,
  /ALTER TABLE public\.entitlements ENABLE ROW LEVEL SECURITY;/,
  /DROP POLICY IF EXISTS "Users can view their organization data"[\s\S]*?\n    \)\);/,
  /DROP POLICY IF EXISTS "Users can view their organization members"[\s\S]*?\n    \)\);/,
  /CREATE OR REPLACE FUNCTION public\.handle_new_user_signup\(\)[\s\S]*?\$\$ LANGUAGE plpgsql SECURITY DEFINER;/,
  /DROP TRIGGER IF EXISTS on_auth_user_created ON auth\.users;[\s\S]*?FOR EACH ROW EXECUTE FUNCTION public\.handle_new_user_signup\(\);/
];
const normalize = text => text.replace(/^--.*(?:\n|$)/gm, '').trim();
let remainder = subset;
for (const pattern of patterns) {
  const match = source.match(pattern);
  assert(match, 'Existing SaaS prerequisite statement must be found in the authoritative source');
  assert(subset.includes(match[0]), `Test prerequisite statement must match its authoritative source verbatim: ${match[0].split('\n')[0]}`);
  remainder = remainder.replace(match[0], '');
}
assert.equal(normalize(remainder), '', 'Only source statements and header comments may appear in the test subset');
assert(!/\bDROP\s+(?:TABLE|SCHEMA|DATABASE)\b|\bTRUNCATE\b|\bDELETE\s+FROM\b/i.test(subset), 'No destructive data cleanup');
console.log(JSON.stringify({ check: 'SaaS prerequisite source fidelity', status: 'PASS', source: 'course/schema_supabase.sql',
  sourceBlocks: patterns.length, targetProject: TEST_PROJECT_REF, sqlExecuted: false }));

if (process.argv.includes('--source-check')) process.exit(0);
try {
  const config = readTestEnvironment();
  const schema = await requireTestSaasSchema(config);
  assert(schema.paths?.['/execution_sessions'] && schema.definitions?.agents?.properties?.metadata &&
    schema.paths?.['/rpc/append_runtime_evidence'], 'Existing runtime migrations must remain available');
  console.log(JSON.stringify({ check: 'TEST SaaS + runtime schema', status: 'PASS', targetProject: TEST_PROJECT_REF,
    productionTouched: 'NO', sqlExecuted: false }));
} catch (error) {
  console.error(error.message);
  console.error(`TEST SQL EDITOR ACTION REQUIRED: tests/test-saas-prerequisites.sql → ${TEST_PROJECT_REF}`);
  process.exitCode = 1;
}
