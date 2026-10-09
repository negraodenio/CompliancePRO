/** D2 runtime timeout remediation: durable evidence failure, bounded recovery and execution safety.
 * Local HTTP authority fixture only; never a live database or production infrastructure.
 * NODE_ENV=production exists solely inside this harness to exercise production-only code paths.
 */
import assert from 'node:assert/strict';
import http from 'node:http';
import crypto from 'node:crypto';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = '';
process.env.SUPABASE_URL = '';
process.env.SUPABASE_SERVICE_ROLE_KEY = '';
process.env.SUPABASE_ANON_KEY = '';
process.env.CODEGUARD_API_KEYS = '';
process.env.COMPLYPRO_PASSPORT_SECRET = crypto.randomBytes(32).toString('hex');

const { GENESIS_PREVIOUS_HASH } = await import('../src/core/evidence-ledger');
const { RuntimeManager } = await import('../src/core/runtime-manager');
const { ToolGateway, CompliancePROToolProvider } = await import('../src/core/tool-gateway');
const { ApiKeyRegistry } = await import('../src/server/security/auth-middleware');
const { createServerApp } = await import('../src/server/app');

const tables = new Map<string, any[]>();
tables.set('organization_members', [
  { user_id: 'USER-A', organization_id: 'ORG-A', role: 'member:ENGINEER' },
  { user_id: 'USER-B', organization_id: 'ORG-B', role: 'member:ENGINEER' }
]);
const keys: Record<string, string> = {
  agents: 'agent_id', agent_passports: 'passport_id', runtime_instances: 'runtime_id',
  execution_sessions: 'execution_id', hitl_requests: 'gate_id', hitl_decisions: 'decision_id'
};
let evidenceWritesFailing = false;
let evidenceWrites = 0;
let toolCalls = 0;
let userChecks = 0;

const authority = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', 'http://fixture.invalid');
    const reply = (status: number, body: any) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(body)); };
    if (url.pathname === '/auth/v1/user') {
      userChecks++;
      const users: Record<string, string> = { 'Bearer jwt.a.fixture': 'USER-A', 'Bearer jwt.b.fixture': 'USER-B' };
      const id = users[req.headers.authorization || ''];
      return reply(id ? 200 : 401, id ? { id } : { error: 'invalid token' });
    }
    if (url.pathname === '/api/v1/scans/run') {
      assert.equal(req.headers.authorization, 'Bearer scanner-fixture-credential');
      toolCalls++;
      return reply(200, { scanId: 'HTTP_SCAN_CONFIRMED', status: 'COMPLETED' });
    }
    assert.equal(req.headers.apikey, 'service-fixture');
    if (url.pathname === '/rest/v1/') return reply(200, { paths: { '/rpc/append_runtime_evidence': {} } });
    let body: any = {};
    if (req.method !== 'GET') {
      const chunks: Buffer[] = [];
      for await (const chunk of req) chunks.push(Buffer.from(chunk));
      body = JSON.parse(Buffer.concat(chunks).toString() || '{}');
    }
    if (url.pathname === '/rest/v1/rpc/append_runtime_evidence') {
      if (evidenceWritesFailing) return reply(503, { error: 'fixture evidence write unavailable' });
      const tenant = body.p_tenant_id, entry = body.p_entry;
      const rows = tables.get('audit_ledger_blocks') || [];
      const chain = rows.filter(row => row.tenant_id === tenant && row.workspace_id === 'WS-RUNTIME');
      const prior = chain.find(row => row.block_id === entry.evidenceId);
      if (prior) return reply(JSON.stringify(prior.payload_data) === JSON.stringify(entry) ? 200 : 409, {});
      const head = chain[chain.length - 1];
      if (entry.sequence !== chain.length + 1 || entry.previousHash !== (head?.block_hash || GENESIS_PREVIOUS_HASH)) return reply(409, { error: 'chain conflict' });
      rows.push({ block_id: entry.evidenceId, tenant_id: tenant, workspace_id: 'WS-RUNTIME', block_height: entry.sequence,
        block_hash: entry.eventHash, previous_hash: entry.previousHash, payload_data: structuredClone(entry) });
      tables.set('audit_ledger_blocks', rows);
      evidenceWrites++;
      return reply(200, null);
    }
    const table = url.pathname.replace('/rest/v1/', '');
    const rows = tables.get(table) || [];
    const matches = (row: any) => [...url.searchParams].every(([key, value]) => !value.startsWith('eq.') || row[key] === value.slice(3));
    if (req.method === 'GET') {
      const offset = Number(url.searchParams.get('offset') || 0), limit = Number(url.searchParams.get('limit') || 1000);
      return reply(200, rows.filter(matches).slice(offset, offset + limit));
    }
    if (req.method === 'POST') {
      const key = keys[table];
      assert.ok(key, `Unexpected table ${table}`);
      const index = rows.findIndex(row => row[key] === body[key]);
      const stored = structuredClone(index >= 0 ? { ...rows[index], ...body } : body);
      if (index >= 0) rows[index] = stored; else rows.push(stored);
      tables.set(table, rows);
      return reply(201, [stored]);
    }
    if (req.method === 'PATCH') {
      const updated = rows.filter(matches);
      updated.forEach(row => Object.assign(row, structuredClone(body)));
      return reply(200, updated);
    }
    return reply(404, { error: 'unknown fixture route' });
  } catch (error: any) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: error.message }));
  }
});
await new Promise<void>(resolve => authority.listen(0, '127.0.0.1', resolve));
const authorityUrl = `http://127.0.0.1:${(authority.address() as any).port}`;
process.env.SUPABASE_URL = authorityUrl;
process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-fixture';
process.env.SUPABASE_ANON_KEY = 'anon-fixture';
process.env.NODE_ENV = 'production';
ApiKeyRegistry.clear();

ToolGateway.registerProvider(new CompliancePROToolProvider());
ToolGateway.setProviderCredentials('compliancepro-api', { token: 'scanner-fixture-credential', endpoint: authorityUrl });

const application = createServerApp();
const appServer = http.createServer(application);
await new Promise<void>(resolve => appServer.listen(0, '127.0.0.1', resolve));
const appUrl = `http://127.0.0.1:${(appServer.address() as any).port}`;

let checks = 0;
async function check(name: string, run: () => Promise<void>) { await run(); checks++; console.log(`[D2 REMEDIATION PASS] ${name}`); }
const headers = (token = 'jwt.a.fixture', org = 'ORG-A') => ({ Authorization: `Bearer ${token}`, 'X-Organization-Id': org, 'Content-Type': 'application/json' });
async function request(path: string, init: any = {}) {
  return fetch(appUrl + path, { ...init, headers: { ...headers(), ...init.headers }, signal: AbortSignal.timeout(10000) });
}

let governed: any;
const invokeBody = (capability: string, payload: any, passport: any = governed.passport, action = 'EXECUTE') => JSON.stringify({
  agentId: governed.agentId, passportId: governed.passportId, runtimeId: governed.runtimeId,
  passport, tenantId: 'ORG-A', capability, action, payload
});

try {
  await check('A — healthy provision, evidence baseline and runtime start reaches RUNNING', async () => {
    const provision = await request('/api/v1/agents/provision', { method: 'POST', body: JSON.stringify({
      name: 'D2 timeout remediation probe',
      framework: { name: 'crewai', version: '0.102.0' },
      complianceProfile: 'CP-EU-AI-ACT-HIGH-RISK-FINANCIAL',
      capabilities: ['gpt-4o', 'compliance.scan', 'credit.approve'],
      declaredDataScopes: ['customers'],
      budget: { maxCostPerRunEur: 1 }
    }) });
    assert.equal(provision.status, 201);
    governed = await provision.json();
    assert.equal(governed.passport.tenantId, 'ORG-A');
    assert.ok(tables.get('agent_passports')?.some(row => row.passport_id === governed.passportId));
    assert.ok(tables.get('runtime_instances')?.some(row => row.runtime_id === governed.runtimeId));
    assert.ok(tables.get('audit_ledger_blocks')?.some(row => row.payload_data.agentId === governed.agentId));
    const baseline = await request(`/api/v1/evidence/${governed.agentId}`);
    assert.equal(baseline.status, 200);
    assert.equal((await baseline.json()).chainValid, true);
    const started = await request('/api/v1/runtimes/start', { method: 'POST', body: JSON.stringify({ runtimeId: governed.runtimeId }) });
    assert.equal(started.status, 200);
    assert.equal((await started.json()).runtime.status, 'RUNNING');
    const inspected = await request(`/api/v1/runtimes/${governed.runtimeId}`);
    assert.equal(inspected.status, 200);
    assert.equal((await inspected.json()).status, 'RUNNING');
    assert.equal(tables.get('runtime_instances')?.find(row => row.runtime_id === governed.runtimeId)?.status, 'RUNNING');
    assert.ok(userChecks > 0);
  });

  const phaseBStart = Date.now();
  const auditRowsBeforeFailure = (tables.get('audit_ledger_blocks') || []).length;
  await check('B — injected evidence-write failure yields bounded truthful errors and zero dispatch', async () => {
    evidenceWritesFailing = true;

    const failedStart = await request('/api/v1/runtimes/start', { method: 'POST', body: JSON.stringify({ runtimeId: governed.runtimeId }) });
    assert.equal(failedStart.status, 500);
    const failedStartBody = await failedStart.json();
    assert.equal(failedStartBody.ok, false);
    assert.match(failedStartBody.error.message, /DURABLE_EVIDENCE_WRITE_FAILED/);

    const failedAgain = await request('/api/v1/runtimes/start', { method: 'POST', body: JSON.stringify({ runtimeId: governed.runtimeId }) });
    assert.equal(failedAgain.status, 500);
    const failedAgainBody = await failedAgain.json();
    assert.equal(failedAgainBody.ok, false);
    assert.match(failedAgainBody.error.message, /DURABLE_EVIDENCE_WRITE_FAILED/);

    const inspected = await request(`/api/v1/runtimes/${governed.runtimeId}`);
    assert.equal(inspected.status, 200);
    const instance = await inspected.json();
    assert.equal(instance.status, 'FAILED');
    assert.match(instance.error, /DURABLE_EVIDENCE_WRITE_FAILED/);

    const stopped = await request('/api/v1/runtimes/stop', { method: 'POST', body: JSON.stringify({ runtimeId: governed.runtimeId }) });
    assert.equal(stopped.status, 500);
    const stoppedBody = await stopped.json();
    assert.equal(stoppedBody.ok, false);
    assert.match(stoppedBody.error.message, /DURABLE_EVIDENCE_WRITE_FAILED/);

    const failedInvoke = await request('/api/v1/tools/invoke', { method: 'POST', body: invokeBody('compliance.scan', { targetRepo: 'fixture/repo' }) });
    assert.equal(failedInvoke.status, 500);
    const failedInvokeBody = await failedInvoke.json();
    assert.equal(failedInvokeBody.ok, false);
    assert.match(failedInvokeBody.error, /DURABLE_EVIDENCE_WRITE_FAILED/);
    assert.equal(toolCalls, 0, 'failed evidence writes must fail closed before any provider dispatch');

    const failedEvidence = await request(`/api/v1/evidence/${governed.agentId}`);
    assert.equal(failedEvidence.status, 500);
    const failedEvidenceBody = await failedEvidence.json();
    assert.equal(failedEvidenceBody.ok, false);
    assert.match(failedEvidenceBody.error, /DURABLE_EVIDENCE_WRITE_FAILED/);

    assert.equal((tables.get('audit_ledger_blocks') || []).length, auditRowsBeforeFailure, 'failed durable writes must not mutate the chain');
    assert.equal(toolCalls, 0);
    assert.ok(userChecks > 0);
    assert.ok(Date.now() - phaseBStart < 15000, 'every failing operation must return within the bounded window');
  });

  await check('C — same tenant recovers without recycle, pending evidence persists in order, verification passes', async () => {
    const writesBeforeRecovery = evidenceWrites;
    evidenceWritesFailing = false;

    const started = await request('/api/v1/runtimes/start', { method: 'POST', body: JSON.stringify({ runtimeId: governed.runtimeId }) });
    assert.equal(started.status, 200);
    assert.equal((await started.json()).runtime.status, 'RUNNING');
    assert.equal(tables.get('runtime_instances')?.find(row => row.runtime_id === governed.runtimeId)?.status, 'RUNNING');
    assert.ok(evidenceWrites > writesBeforeRecovery, 'recovery must physically persist the pending evidence');

    const evidence = await request(`/api/v1/evidence/${governed.agentId}`);
    assert.equal(evidence.status, 200);
    const evidenceBody = await evidence.json();
    assert.equal(evidenceBody.chainValid, true);
    const allStarts = evidenceBody.entries.filter((entry: any) => entry.eventType === 'RUNTIME_STARTED');
    const starts = allStarts.filter((entry: any) => String(entry.evidenceId).startsWith('EV-RT-START-'));
    const sandboxStarts = allStarts.filter((entry: any) => String(entry.evidenceId).startsWith('EV-SBX-START-'));
    assert.equal(allStarts.length, 6, 'each start emits one sandbox and one runtime start event');
    assert.equal(starts.length, 3, 'healthy start, failed-but-pending start and recovered start must all be durable');
    assert.equal(sandboxStarts.length, 3, 'sandbox lifecycle events of every start must be durable');
    for (let i = 0; i + 1 < starts.length; i++) {
      assert.ok(starts[i].sequence < starts[i + 1].sequence, 'RUNTIME_STARTED sequences must be strictly increasing');
      assert.ok(starts[i].timestamp <= starts[i + 1].timestamp, 'recovered pending evidence must keep its original append order');
    }
    for (let i = 0; i + 1 < sandboxStarts.length; i++) {
      assert.ok(sandboxStarts[i].sequence < sandboxStarts[i + 1].sequence, 'sandbox start sequences must be strictly increasing');
    }
    evidenceBody.entries.forEach((entry: any, index: number) => {
      if (index > 0) assert.equal(entry.sequence, evidenceBody.entries[index - 1].sequence + 1, 'evidence chain must remain contiguous');
    });

    const verified = await request('/api/v1/evidence/verify', { method: 'POST', body: JSON.stringify({ agentId: governed.agentId }) });
    assert.equal(verified.status, 200);
    const verifiedBody = await verified.json();
    assert.equal(verifiedBody.chain.valid, true);
    assert.ok(verifiedBody.auditPack);
    assert.ok(verifiedBody.auditPack.merkleRoot);
  });

  await check('D — execution safety: stale failure never executed, exact-once dispatch, HITL, isolation, prohibition', async () => {
    assert.equal(toolCalls, 0, 'the failed prior invocation must not have executed the tool');
    const preDispatch = await request(`/api/v1/evidence/${governed.agentId}`);
    const preEntries = (await preDispatch.json()).entries;
    assert.equal(preEntries.filter((entry: any) => entry.eventType === 'TOOL_RESPONSE').length, 0, 'no TOOL_RESPONSE may exist before recovery dispatch');

    const scan = await request('/api/v1/tools/invoke', { method: 'POST', body: invokeBody('compliance.scan', { targetRepo: 'fixture/repo' }) });
    assert.equal(scan.status, 200);
    const scanBody = await scan.json();
    assert.equal(scanBody.status, 'COMPLETED');
    assert.equal(scanBody.providerCallCount, 1);
    assert.equal(scanBody.result?.scanId, 'HTTP_SCAN_CONFIRMED');
    assert.equal(toolCalls, 1, 'authorized capability must dispatch exactly once over real HTTP');

    const approval = await request('/api/v1/tools/invoke', { method: 'POST', body: invokeBody('credit.approve', { amount: 50000, customerId: 'C-1', approvedLimit: 50000 }) });
    assert.equal(approval.status, 202);
    const approvalBody = await approval.json();
    assert.equal(approvalBody.status, 'PAUSED');
    assert.equal(approvalBody.verdict, 'REQUIRE_HITL');
    assert.ok(approvalBody.gateId);
    assert.equal(toolCalls, 1, 'high-risk approval must dispatch zero times before human decision');

    const postDispatch = await request(`/api/v1/evidence/${governed.agentId}`);
    const postEntries = (await postDispatch.json()).entries;
    assert.equal(postEntries.filter((entry: any) => entry.eventType === 'TOOL_RESPONSE' && entry.capability === 'compliance.scan').length, 1);
    assert.equal(postEntries.filter((entry: any) => entry.eventType === 'TOOL_RESPONSE' && entry.capability === 'credit.approve').length, 0, 'paused approval must leave no provider execution evidence');
    assert.ok(postEntries.some((entry: any) => entry.eventType === 'HITL_REQUEST' && entry.capability === 'credit.approve'));

    const foreign = await request('/api/v1/tools/invoke', { method: 'POST', body: invokeBody('compliance.scan', { targetRepo: 'fixture/repo' }, { ...governed.passport, tenantId: 'ORG-B' }) });
    assert.equal(foreign.status, 403);
    assert.match((await foreign.json()).error, /CROSS_TENANT_ACCESS_DENIED/);
    assert.equal(toolCalls, 1, 'cross-tenant denial must dispatch nothing');

    const ddlExecute = await request('/api/v1/tools/invoke', { method: 'POST', body: invokeBody('DIRECT_DB_DDL', { sqlQuery: 'DROP TABLE customers' }) });
    assert.equal(ddlExecute.status, 403);
    assert.equal((await ddlExecute.json()).status, 'BLOCKED');
    assert.equal(toolCalls, 1);

    const ddlDelete = await request('/api/v1/tools/invoke', { method: 'POST', body: invokeBody('DIRECT_DB_DDL', { sqlQuery: 'DROP TABLE customers' }, governed.passport, 'DELETE') });
    assert.equal(ddlDelete.status, 403);
    assert.equal((await ddlDelete.json()).status, 'BLOCKED');
    assert.equal(toolCalls, 1, 'prohibited DDL must dispatch zero times');
  });

  await check('E — recovered runtime stops and remains durably verifiable', async () => {
    const stopped = await request('/api/v1/runtimes/stop', { method: 'POST', body: JSON.stringify({ runtimeId: governed.runtimeId }) });
    assert.equal(stopped.status, 200);
    assert.equal((await stopped.json()).runtime.status, 'STOPPED');
    const inspected = await request(`/api/v1/runtimes/${governed.runtimeId}`);
    assert.equal(inspected.status, 200);
    assert.equal((await inspected.json()).status, 'STOPPED');
    assert.equal(tables.get('runtime_instances')?.find(row => row.runtime_id === governed.runtimeId)?.status, 'STOPPED');
    const evidence = await request(`/api/v1/evidence/${governed.agentId}`);
    assert.equal(evidence.status, 200);
    const evidenceBody = await evidence.json();
    assert.equal(evidenceBody.chainValid, true);
    assert.ok(evidenceBody.entries.filter((entry: any) => entry.eventType === 'RUNTIME_STOPPED').length >= 1);
    assert.equal(toolCalls, 1);
  });
} finally {
  process.env.NODE_ENV = 'test';
  RuntimeManager.reset();
  await Promise.all([appServer, authority].map(server => new Promise<void>(resolve => server.close(() => resolve()))));
}
console.log(`D2 runtime timeout remediation: ${checks} checks PASS (local HTTP authority fixture; no live DB writes)`);
