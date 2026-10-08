import { spawnSync } from 'node:child_process';
import { loadTestEnvironment, TEST_PROJECT_REF } from './test-supabase-environment.mjs';
const testConfig = loadTestEnvironment();
const suites = ['compliance-compiler','guardian-evaluation','governed-capability-gateway','evidence-ledger',
  'agent-provisioning','isolated-runtime','crewai-runtime-adapter','agent-studio-api','governance-cockpit',
  'model-gateway','tool-gateway','data-gateway','end-to-end-governed-agent','model-gateway-real-provider',
  's8-1-security','s8-2-persistence','s8-2-real-restart','s8-2b-rls-real','s8-3-container-audit',
  's8-4-worker-sandbox','s8-5-active-governance','s8-remediation-security','real-agent-inventory','nat-governance-poc'];
const requested = process.argv.slice(2).map(name => name.replace(/^tests[\\/]/, '').replace(/\.test\.ts$/, ''));
if (requested.some(name => !suites.includes(name))) throw new Error('UNKNOWN_GOVERNANCE_SUITE');
const selected = requested.length ? requested : suites;
console.log(`Verified TEST Supabase project: ${TEST_PROJECT_REF}`);
let failures = 0;
for (const suite of selected) {
  const result = spawnSync(process.execPath, ['--import','tsx','--import','./tests/bootstrap-provider-fixtures.ts',`tests/${suite}.test.ts`],
    { stdio: 'inherit', env: { ...process.env, ...testConfig, NODE_ENV: 'test', DATABASE_URL: '' } });
  console.log(`${suite}: exit ${result.status}`);
  if (result.status === 86) { process.exit(86); }
  if (result.status !== 0) failures++;
}
console.log(`Governance suite summary: ${selected.length - failures} PASS / ${failures} FAIL`);
process.exitCode = failures ? 1 : 0;
