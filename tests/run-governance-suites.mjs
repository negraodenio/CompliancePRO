import { spawnSync } from 'node:child_process';
import { loadTestEnvironment, TEST_PROJECT_REF } from './test-supabase-environment.mjs';
const testConfig = loadTestEnvironment();

// Tier 1: ISOLATED suites - no live external service is required beyond the
// validated local test configuration (fixtures, local HTTP authorities, files).
const isolatedSuites = ['compliance-compiler','guardian-evaluation','governed-capability-gateway','evidence-ledger',
  'agent-provisioning','isolated-runtime','crewai-runtime-adapter','agent-studio-api','governance-cockpit',
  'model-gateway','tool-gateway','data-gateway','gateway-failure-closed','data-hitl-revalidation',
  'r3-evidence-honesty','r4-digest-integrity','hardening-integrity','scan-governance-bridge',
  'governance-simulator','security-remediation','academy-module',
  'model-gateway-real-provider',
  's8-1-security','s8-2-persistence','s8-2-real-restart','s8-3-container-audit',
  's8-4-worker-sandbox','s8-5-active-governance','s8-remediation-security','real-agent-inventory','nat-governance-poc'];

// Tier 2: DB suites - require the dedicated TEST Supabase project and perform
// real PostgREST/database calls. Kept separate so they remain distinguishable
// from isolated unit/regression suites.
const dbSuites = ['s8-2b-rls-real','end-to-end-governed-agent'];

const suites = [...isolatedSuites, ...dbSuites];
const requested = process.argv.slice(2).map(name => name.replace(/^tests[\\/]/, '').replace(/\.test\.ts$/, ''));
if (requested.some(name => !suites.includes(name))) throw new Error('UNKNOWN_GOVERNANCE_SUITE');
const selected = requested.length ? requested : suites;
console.log(`Verified TEST Supabase project: ${TEST_PROJECT_REF}`);
console.log(`Suites: ${selected.length} total (${isolatedSuites.length} isolated + ${dbSuites.length} DB-backed)`);
let failures = 0;
for (const suite of selected) {
  const tier = dbSuites.includes(suite) ? ' [DB]' : '';
  const result = spawnSync(process.execPath, ['--import','tsx','--import', './tests/bootstrap-provider-fixtures.ts', `tests/${suite}.test.ts`],
    { stdio: 'inherit', env: { ...process.env, ...testConfig, NODE_ENV: 'test', DATABASE_URL: '' } });
  console.log(`${suite}${tier}: exit ${result.status}`);
  if (result.status === 86) { process.exit(86); }
  if (result.status !== 0) failures++;
}
console.log(`Governance suite summary: ${selected.length - failures} PASS / ${failures} FAIL`);
process.exitCode = failures ? 1 : 0;
