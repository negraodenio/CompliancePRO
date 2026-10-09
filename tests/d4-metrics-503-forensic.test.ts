/**
 * D4 — GET /api/v1/agents/metrics forensic regression suite.
 *
 * Root cause under test: the metrics handler queries the durable authority
 * (DurableStore.hydrateTenantCache + EvidenceLedger.reloadTenant) and must
 * fail closed truthfully when that authority is missing or the database query
 * fails, while returning exact real counts for an authorized tenant.
 *
 * 1. Authorized tenant receives real metrics.
 * 2. Metrics are scoped to the authenticated tenant.
 * 3. Cross-tenant access is denied.
 * 4. Missing authority/configuration returns a truthful fail-closed error.
 * 5. Database/query failure does not produce fabricated metrics.
 * 6. Anonymous access remains unauthorized.
 *
 * Local authority fixture only. installTestNetworkGuard blocks every production host.
 * No migrations, no production access, no fabricated metrics.
 */
import assert from 'node:assert/strict';
import http from 'node:http';
import crypto from 'node:crypto';

process.env.NODE_ENV = 'test';
process.env.CODEGUARD_API_KEYS = 'd4-metrics-fixture-key';
process.env.COMPLYPRO_PASSPORT_SECRET = crypto.randomBytes(32).toString('hex');
process.env.DATABASE_URL = '';

const { installTestNetworkGuard } = await import('./test-supabase-environment.mjs');
installTestNetworkGuard();

function agentRow(agentId: string, tenantId: string, name: string, risk: string) {
  return {
    agent_id: agentId, tenant_id: tenantId, name,
    framework_name: 'CrewAI', framework_version: '0.102.0',
    compliance_profile: 'UNASSIGNED', capabilities: [], budget: { maxCostPerRunEur: 0 },
    status: 'IMPORTED', created_at: '2026-01-01T00:00:00.000Z', updated_at: '2026-01-01T00:00:00.000Z',
    version: 1, metadata: { discovery: { name, risk, owner: { name: 'Fixture Owner', role: 'Engineer' } } }
  };
}

const tables = new Map<string, any[]>();
tables.set('organization_members', [
  { user_id: 'USER-A', organization_id: 'ORG-A', role: 'member:ENGINEER' },
  { user_id: 'USER-B', organization_id: 'ORG-B', role: 'member:ENGINEER' }
]);
tables.set('agents', [
  agentRow('agt_a1', 'ORG-A', 'Agent A1', 'HIGH'),
  agentRow('agt_a2', 'ORG-A', 'Agent A2', 'MEDIUM'),
  agentRow('agt_b1', 'ORG-B', 'Agent B1', 'HIGH')
]);
tables.set('execution_sessions', [
  { execution_id: 'exec_a_paused', tenant_id: 'ORG-A', status: 'PAUSED', agent_id: 'agt_a1' },
  { execution_id: 'exec_b_done', tenant_id: 'ORG-B', status: 'COMPLETED', agent_id: 'agt_b1' }
]);
tables.set('agent_passports', []);
tables.set('runtime_instances', []);
tables.set('hitl_requests', []);
tables.set('audit_ledger_blocks', []);

let dbDown = false;
const authority = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', 'http://fixture.invalid');
    const reply = (status: number, body: any) => {
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(body));
    };
    if (url.pathname === '/auth/v1/user') {
      const users: Record<string, string> = { 'Bearer jwt.a.fixture': 'USER-A', 'Bearer jwt.b.fixture': 'USER-B' };
      const id = users[String(req.headers.authorization || '')];
      return reply(id ? 200 : 401, id ? { id } : { error: 'invalid token' });
    }
    if (dbDown) return reply(503, { error: 'fixture database unavailable' });
    const table = url.pathname.replace('/rest/v1/', '');
    const rows = tables.get(table) || [];
    const matches = (row: any) => [...url.searchParams].every(([k, v]) => !v.startsWith('eq.') || row[k] === v.slice(3));
    if (req.method === 'GET') return reply(200, rows.filter(matches));
    return reply(404, { error: 'unknown fixture route' });
  } catch (error: any) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: error.message }));
  }
});
await new Promise<void>((resolve) => authority.listen(0, '127.0.0.1', () => resolve()));
const authorityUrl = `http://127.0.0.1:${(authority.address() as any).port}`;

process.env.SUPABASE_URL = authorityUrl;
process.env.SUPABASE_ANON_KEY = 'anon-fixture';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-fixture';

const { createServerApp } = await import('../src/server/app');
const { ApiKeyRegistry } = await import('../src/server/security/auth-middleware');

process.env.NODE_ENV = 'production';
ApiKeyRegistry.clear();

const app = createServerApp();
const server = http.createServer(app);
await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
const baseUrl = `http://127.0.0.1:${(server.address() as any).port}`;

const METRIC_FIELDS = [
  'totalAgents', 'governedAgents', 'needAttentionAgents', 'unknownAgents',
  'highRiskAgents', 'blockedActions', 'hitlPending'
];

async function metrics(headers: Record<string, string> = {}) {
  const res = await fetch(`${baseUrl}/api/v1/agents/metrics`, { headers });
  const body: any = await res.json().catch(() => null);
  return { status: res.status, body };
}
const jwt = (token: string, org: string, extra: Record<string, string> = {}) =>
  ({ Authorization: `Bearer ${token}`, 'X-Organization-Id': org, ...extra });

let passed = 0;
async function check(name: string, run: () => Promise<void>) {
  await run();
  passed++;
  console.log(`  [D4-METRICS PASS ${passed}]: ${name}`);
}

console.log('==================================================================');
console.log('>>> D4 — METRICS 503 FORENSIC REGRESSION SUITE                  <<<');
console.log('==================================================================\n');

try {
  await check('1. Authorized tenant receives real metrics', async () => {
    const { status, body } = await metrics(jwt('jwt.a.fixture', 'ORG-A'));
    assert.equal(status, 200);
    for (const field of METRIC_FIELDS) assert.equal(typeof body[field], 'number', `${field} must be a number`);
    assert.equal(body.totalAgents, 2, 'exactly the two seeded ORG-A agents');
    assert.equal(body.governedAgents, 0);
    assert.equal(body.needAttentionAgents, 2);
    assert.equal(body.unknownAgents, 2, 'imported rows without passport count as unknown');
    assert.equal(body.highRiskAgents, 1, 'only the HIGH-risk ORG-A agent');
    assert.equal(body.blockedActions, 0, 'empty evidence chain yields zero, not a hardcoded value');
    assert.equal(body.hitlPending, 1, 'exactly the one seeded PAUSED session');
  });

  await check('2. Metrics are scoped to the authenticated tenant', async () => {
    const orgA = (await metrics(jwt('jwt.a.fixture', 'ORG-A'))).body;
    const orgB = (await metrics(jwt('jwt.b.fixture', 'ORG-B'))).body;
    assert.equal(orgB.totalAgents, 1, 'ORG-B sees only its own agent');
    assert.equal(orgB.highRiskAgents, 1);
    assert.equal(orgB.blockedActions, 0, 'no bleed from ORG-A');
    assert.equal(orgB.hitlPending, 0, 'ORG-A paused session must not bleed into ORG-B');
    assert.equal(orgA.totalAgents, 2, 'ORG-A counts unchanged after ORG-B read');
    assert.equal(orgA.hitlPending, 1);
  });

  await check('3. Cross-tenant access is denied', async () => {
    const foreignOrg = await metrics(jwt('jwt.a.fixture', 'ORG-B'));
    assert.equal(foreignOrg.status, 403);
    assert.equal(foreignOrg.body.error, 'CROSS_TENANT_ACCESS_DENIED');
    const spoofedHeader = await metrics(jwt('jwt.a.fixture', 'ORG-A', { 'X-Tenant-Id': 'ORG-B' }));
    assert.equal(spoofedHeader.status, 403);
    assert.equal(spoofedHeader.body.error, 'TENANT_IMPERSONATION_DETECTED');
  });

  await check('6. Anonymous access remains unauthorized', async () => {
    const { status, body } = await metrics();
    assert.equal(status, 401);
    assert.equal(body.error, 'UNAUTHORIZED');
  });

  await check('4. Missing authority/configuration returns a truthful fail-closed error', async () => {
    const savedUrl = process.env.SUPABASE_URL;
    process.env.SUPABASE_URL = '';
    try {
      const { status, body } = await metrics({ 'X-API-Key': 'd4-metrics-fixture-key' });
      assert.equal(status, 503, 'fail-closed, never 200');
      assert.equal(body.ok, false);
      assert.equal(body.error, 'SERVER_AUTHORITY_UNAVAILABLE', 'truthful authority error, not a fabricated success');
      for (const field of METRIC_FIELDS) assert.ok(!(field in body), `${field} must be absent on failure`);
    } finally {
      process.env.SUPABASE_URL = savedUrl;
    }
  });

  await check('5. Database/query failure does not produce fabricated metrics', async () => {
    dbDown = true;
    try {
      const { status, body } = await metrics({ 'X-API-Key': 'd4-metrics-fixture-key' });
      assert.equal(status, 503, 'query failure must fail closed');
      assert.equal(body.ok, false);
      assert.equal(body.error, 'SERVER_AUTHORITY_UNAVAILABLE');
      assert.deepEqual(Object.keys(body).sort(), ['error', 'ok'], 'no fabricated metric fields in the failure body');
    } finally {
      dbDown = false;
    }
    const recovered = await metrics(jwt('jwt.a.fixture', 'ORG-A'));
    assert.equal(recovered.status, 200, 'authority recovery restores real metrics with no sticky failure');
    assert.equal(recovered.body.totalAgents, 2);
  });
} finally {
  server.close();
  authority.close();
}

console.log('\n==================================================================');
console.log(`>>> D4 METRICS FORENSIC: ALL ${passed} SCENARIOS PASSED       <<<`);
console.log('==================================================================');
