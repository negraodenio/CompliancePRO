/**
 * Final forensic audit: adversarial regression probes, not a demo data seed.
 * Providers and HTTP transports are deliberately instrumented test doubles.
 * No production database writes, migrations, or deployments are performed.
 * Run independently with: npx tsx tests/final-forensic-audit.test.ts
 */
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';

const localConfig = dotenv.parse(fs.readFileSync('.env', 'utf8'));
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = '';
process.env.SUPABASE_URL = '';
process.env.SUPABASE_SERVICE_ROLE_KEY = '';
process.env.SUPABASE_ANON_KEY = '';
process.env.COMPLYPRO_PASSPORT_SECRET = crypto.randomBytes(32).toString('hex');
process.env.CODEGUARD_API_KEYS = '';

const { AgentProvisioner } = await import('../src/core/agent-provisioner');
const { PassportSigner } = await import('../src/core/passport-signer');
const { RuntimeManager } = await import('../src/core/runtime-manager');
const { ToolGateway } = await import('../src/core/tool-gateway');
const { ModelGateway } = await import('../src/core/model-gateway');
const { DataGateway, PostgreSqlDataProvider, SupabasePostgreSqlDataProvider } = await import('../src/core/data-gateway');
const { DurableStore } = await import('../src/server/db/durable-store');
const { PostgresPersistenceAdapter } = await import('../src/server/db/postgres-adapter');
const { EvidenceLedger } = await import('../src/core/evidence-ledger');
const { PersistenceAdapter } = await import('../src/web/services/persistence-adapter');
const { EvidenceStore } = await import('../src/web/services/evidence-store');
const { AgentInventoryStore } = await import('../src/web/services/agent-inventory-store');
const { ApiKeyRegistry } = await import('../src/server/security/auth-middleware');
const { createServerApp } = await import('../src/server/app');
const { CrewAiRuntimeAdapter } = await import('../src/core/adapters/crewai-runtime-adapter');
const { NatRuntimeAdapter } = await import('../src/core/adapters/nat-runtime-adapter');
const { ComplianceProfileRegistry } = await import('../src/core/compliance-compiler');
const { AuditLedgerStore, computeDeterministicHash } = await import('../src/web/services/audit-ledger-store');
const { fetchGitHubRepo } = await import('../src/web/services/github-fetcher');
const { SandboxManager } = await import('../src/core/sandbox/sandbox-manager');

let passed = 0;
let failed = 0;
async function probe(name: string, fn: () => unknown | Promise<unknown>) {
  try {
    await fn();
    passed++;
    console.log(`[AUDIT PASS] ${name}`);
  } catch (err: any) {
    failed++;
    console.log(`[AUDIT FAIL] ${name}: ${String(err.message).slice(0, 250)}`);
  } finally {
    process.env.NODE_ENV = 'test';
    PersistenceAdapter.setFailureInjectionHook(undefined);
  }
}

function provision(capabilities: string[], framework = 'crewai', tenantId = 'TENANT-AUDIT-A') {
  return AgentProvisioner.provision({
    name: `forensic-${crypto.randomBytes(4).toString('hex')}`,
    framework: { name: framework, version: framework === 'crewai' ? '0.102.0' : '1.9.0' },
    complianceProfile: 'CP-EU-AI-ACT-HIGH-RISK-FINANCIAL',
    capabilities,
    budget: { maxCostPerRunEur: 1 },
    tenantId
  });
}

async function withServer(fn: (url: string) => Promise<void>) {
  const server = http.createServer(createServerApp());
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${(server.address() as any).port}`;
  try { await fn(url); }
  finally { await new Promise<void>((resolve, reject) => server.close(err => err ? reject(err) : resolve())); }
}

async function withAuthenticatedInventory(fn: () => Promise<void>) {
  await withServer(async url => {
    const originalFetch = globalThis.fetch;
    const originalContext = PersistenceAdapter.getContext();
    PersistenceAdapter.setContext({tenantId:'TENANT-A'});
    globalThis.fetch = ((input:any,init:any={}) => originalFetch(
      String(input).startsWith('/') ? `${url}${input}` : input,
      {...init,headers:{...init.headers,'X-API-Key':'dev-key-tenant-a'}})) as any;
    try { await fn(); }
    finally { globalThis.fetch=originalFetch;PersistenceAdapter.setContext(originalContext); }
  });
}

await probe('Production rejects documented development API keys', async () => {
  process.env.NODE_ENV = 'production';
  ApiKeyRegistry.clear();
  await withServer(async url => {
    const response = await fetch(`${url}/api/v1/agents`, { headers: { 'X-API-Key': 'dev-key-tenant-a' } });
    assert.equal(response.status, 401);
  });
  ApiKeyRegistry.clear();
});

await probe('Production passport secret absent fails closed', () => {
  const secret = process.env.COMPLYPRO_PASSPORT_SECRET;
  const legacy = [process.env.CODEGUARD_PASSPORT_SECRET, process.env.COMPLIANCE_SERVER_SECRET];
  process.env.NODE_ENV = 'production';
  process.env.COMPLYPRO_PASSPORT_SECRET = '';
  process.env.CODEGUARD_PASSPORT_SECRET = '';
  process.env.COMPLIANCE_SERVER_SECRET = '';
  try { assert.throws(() => PassportSigner.getSecret(), /PRODUCTION_CONFIGURATION_ERROR/); }
  finally {
    process.env.COMPLYPRO_PASSPORT_SECRET = secret;
    process.env.CODEGUARD_PASSPORT_SECRET = legacy[0] || '';
    process.env.COMPLIANCE_SERVER_SECRET = legacy[1] || '';
  }
});

await probe('Passport binds identity, tenant, framework, profile, manifest and authorization', () => {
  const agent = provision(['crm.read_customer']);
  agent.passport.declaredModels = ['gpt-4o'];
  agent.passport.declaredDataScopes = ['customers'];
  AgentProvisioner.signPassport(agent.passport, agent.agentId);
  const original = PassportSigner.toSignInput(agent.passport, agent.agentId);
  assert.equal(PassportSigner.verify(agent.passport.passportFingerprint, original).valid, true);
  for (const changed of [
    { agentId: 'different-agent' }, { tenantId: 'TENANT-AUDIT-B' }, { framework: 'different-framework' },
    { frameworkVersion: '999' }, { complianceProfileChecksum: '0'.repeat(64) },
    { toolManifestHash: '1'.repeat(64) }, { declaredTools: ['dangerous.tool'] },
    { declaredModels: ['unauthorized-model'] }, { declaredDataScopes: ['private-table'] },
    { riskTier: 'LOW' }, { capabilities: [{ capability: 'crm.read_customer', requiresHitl: true }] }
  ]) assert.equal(PassportSigner.verify(agent.passport.passportFingerprint, { ...original, ...changed }).valid, false);
});

await probe('Runtime startup rejects forged passport before starting worker', () => {
  const agent = provision(['crm.read_customer']);
  const invalid = structuredClone(agent.passport);
  invalid.passportFingerprint = `SIG-SHA256-${'0'.repeat(32)}`;
  const runtime = RuntimeManager.createRuntime(agent.runtimeSpec, invalid, agent.tenantId);
  assert.throws(() => RuntimeManager.startRuntime(runtime.runtimeId, agent.tenantId), /RUNTIME_START_DENIED/);
});

await probe('READ-only tool capability cannot dispatch DELETE', async () => {
  const agent = provision(['crm.read_customer']);
  const previous = ToolGateway.getProvider('salesforce-mcp-server');
  let calls = 0;
  ToolGateway.registerProvider({ providerId: 'salesforce-mcp-server', execute: async () => { calls++; return {}; } });
  try {
    const result = await ToolGateway.invokeTool({
      agentId: agent.agentId, runtimeId: agent.runtimeId, passportId: agent.passportId,
      executionId: 'audit-tool-forbidden-action', passport: agent.passport,
      capability: 'crm.read_customer', action: 'DELETE', tenantId: agent.tenantId
    });
    assert.equal(result.verdict, 'BLOCK');
    assert.equal(calls, 0);
  } finally {
    if (previous) ToolGateway.registerProvider(previous); else ToolGateway.unregisterProvider('salesforce-mcp-server');
  }
});

await probe('Tool HITL revalidates cryptographic authorization on resume', async () => {
  const agent = provision(['credit.approve']);
  const previous = ToolGateway.getProvider('core-banking-system');
  let calls = 0;
  ToolGateway.registerProvider({ providerId: 'core-banking-system', execute: async () => { calls++; return {}; } });
  try {
    const paused = await ToolGateway.invokeTool({
      agentId: agent.agentId, runtimeId: agent.runtimeId, passportId: agent.passportId,
      executionId: 'audit-tool-tamper-resume', passport: agent.passport,
      capability: 'credit.approve', action: 'WRITE', payload: { amount: 25000 }, tenantId: agent.tenantId
    });
    assert.equal(paused.status, 'PAUSED');
    agent.passport.declaredTools = ['different.tool'];
    const resumed = await ToolGateway.resumeExecution(paused.executionId, 'APPROVED', 'audit-officer');
    assert.equal(resumed.status, 'BLOCKED');
    assert.equal(calls, 0);
  } finally {
    if (previous) ToolGateway.registerProvider(previous); else ToolGateway.unregisterProvider('core-banking-system');
  }
});

await probe('Data caller tenant mismatch dispatches zero provider queries', async () => {
  const agent = provision(['customer.read']);
  const previous = DataGateway.getProvider('postgresql');
  let calls = 0;
  DataGateway.registerProvider({ providerId: 'postgresql', query: async () => { calls++; return []; } });
  try {
    const result = await DataGateway.invokeData({
      agentId: agent.agentId, runtimeId: agent.runtimeId, passportId: agent.passportId,
      executionId: 'audit-cross-tenant-data', passport: agent.passport,
      capability: 'customer.read', action: 'READ', targetResource: 'customers', tenantId: 'TENANT-AUDIT-B'
    });
    assert.equal(result.verdict, 'BLOCK');
    assert.equal(calls, 0);
  } finally { if (previous) DataGateway.registerProvider(previous); }
});

await probe('Concurrent DATA HITL approvals invoke provider exactly once', async () => {
  const agent = provision(['customer.export']);
  const previous = DataGateway.getProvider('postgresql');
  let calls = 0;
  DataGateway.registerProvider({ providerId: 'postgresql', query: async () => {
    calls++; await new Promise(resolve => setTimeout(resolve, 20)); return [];
  } });
  try {
    const paused = await DataGateway.invokeData({
      agentId: agent.agentId, runtimeId: agent.runtimeId, passportId: agent.passportId,
      executionId: 'audit-data-atomic-approval', passport: agent.passport,
      capability: 'customer.export', action: 'READ', targetResource: 'customers', tenantId: agent.tenantId
    });
    assert.equal(paused.status, 'PAUSED');
    const results = await Promise.allSettled([
      DataGateway.approveExecution(paused.executionId, 'audit-officer-a'),
      DataGateway.approveExecution(paused.executionId, 'audit-officer-b')
    ]);
    assert.equal(calls, 1);
    assert.equal(results.filter(r => r.status === 'fulfilled').length, 1);
  } finally { if (previous) DataGateway.registerProvider(previous); }
});

await probe('Supabase provider scopes default tenant instead of service-role unfiltered read', async () => {
  const originalFetch = globalThis.fetch;
  let requestedUrl = '';
  globalThis.fetch = (async (url: any) => { requestedUrl = String(url); return new Response('[]', { status: 200 }); }) as any;
  try {
    await new SupabasePostgreSqlDataProvider().query('organizations', 'READ', undefined, { tenantId: 'TENANT-DEFAULT' } as any,
      { supabaseUrl: 'https://audit.invalid', serviceRoleKey: 'audit-test-key' });
    assert.equal(new URL(requestedUrl).searchParams.get('id'), 'eq.TENANT-DEFAULT');
  } finally { globalThis.fetch = originalFetch; }
});

await probe('PostgreSQL table identifier injection is rejected before SQL dispatch', async () => {
  const adapter = PostgresPersistenceAdapter as any;
  const previousReady = adapter.isReady;
  const previousPool = adapter.getPool;
  let sqlCalls = 0;
  adapter.isReady = () => true;
  adapter.getPool = () => ({ query: async () => { sqlCalls++; return { rows: [] }; } });
  try {
    await assert.rejects(new PostgreSqlDataProvider().query('customers WHERE tenant_id = $1 OR true --', 'READ', undefined,
      { tenantId: 'TENANT-AUDIT-A' } as any), /INVALID.*RESOURCE|INVALID.*IDENTIFIER/);
    assert.equal(sqlCalls, 0);
  } finally { adapter.isReady = previousReady; adapter.getPool = previousPool; }
});

await probe('Durable HITL claim respects caller tenant', async () => {
  const agent = provision(['credit.approve']);
  DurableStore.saveExecutionSession({
    executionId: 'audit-claim-tenant', agentId: agent.agentId, runtimeId: agent.runtimeId,
    passportId: agent.passportId, status: 'PAUSED', toolExecutionCount: 0,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), tenantId: agent.tenantId
  }, agent.tenantId!);
  await DurableStore.flushPendingWrites();
  const claim = await DurableStore.claimExecutionSessionConditional('audit-claim-tenant', 'TENANT-AUDIT-B');
  assert.equal(claim.success, false);
  assert.equal(claim.affectedRows, 0);
});

await probe('Production durable HITL claim fails closed without database', async () => {
  const agent = provision(['credit.approve']);
  DurableStore.saveExecutionSession({
    executionId: 'audit-claim-no-database', agentId: agent.agentId, runtimeId: agent.runtimeId,
    passportId: agent.passportId, status: 'PAUSED', toolExecutionCount: 0,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), tenantId: agent.tenantId
  }, agent.tenantId!);
  process.env.NODE_ENV = 'production';
  await assert.rejects(DurableStore.claimExecutionSessionConditional('audit-claim-no-database', agent.tenantId), /DURABLE_PERSISTENCE_UNAVAILABLE/);
});

await probe('Evidence endpoint reads only authenticated caller chain, including unknown agent IDs', async () => {
  ApiKeyRegistry.clear();
  EvidenceLedger.append({
    evidenceId: 'audit-private-b-event', timestamp: new Date().toISOString(), eventType: 'TOOL_RESPONSE',
    agentId: 'audit-unregistered-private-b-agent', passportFingerprint: 'audit-fingerprint',
    complianceProfileId: 'audit-profile', complianceProfileChecksum: '0'.repeat(64)
  }, 'TENANT-B');
  await withServer(async url => {
    const response = await fetch(`${url}/api/v1/evidence/audit-unregistered-private-b-agent`,
      { headers: { 'X-API-Key': 'auditor-key-tenant-a' } });
    const data = await response.json();
    assert.equal(data.entries?.length || 0, 0);
  });
});

await probe('Production model default dispatch really reaches HTTP transport', async () => {
  const agent = provision(['gpt-4o']);
  await DurableStore.flushPendingWrites();
  const originalFetch = globalThis.fetch;
  const originalLoad = DurableStore.loadRuntimeEvidence;
  const originalAppend = DurableStore.appendRuntimeEvidence;
  const originalAuthority = DurableStore.requireExecutionAuthority;
  const persisted: any[] = [];
  DurableStore.loadRuntimeEvidence=async()=>structuredClone(persisted);
  DurableStore.appendRuntimeEvidence=async(_tenant,entry)=>{persisted.push(structuredClone(entry));};
  // HTTP dispatch unit probe; the unmodified DB authority contract is exercised separately.
  DurableStore.requireExecutionAuthority=async context=>{assert.equal(context.agentId,agent.agentId);};
  let providerCalls = 0;
  ModelGateway.setProviderCredentials('openai', { apiKey: 'audit-test-key', endpoint: 'https://audit.invalid/v1' });
  ModelGateway.resetDispatcher();
  process.env.NODE_ENV = 'production';
  globalThis.fetch = (async () => {
    providerCalls++;
    return new Response(JSON.stringify({ choices: [{ message: { content: 'AUDIT_REAL_DISPATCH' } }],
      usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 } }), { status: 200 });
  }) as any;
  try {
    const result = await ModelGateway.invokeModel({
      agentId: agent.agentId, passportId: agent.passportId, runtimeId: agent.runtimeId,
      passport: agent.passport, provider: 'openai', model: 'gpt-4o', messages: [{ role: 'user', content: 'audit' }], tenantId: agent.tenantId
    });
    assert.equal(providerCalls, 1);
    assert.equal(result.responseMessage?.content, 'AUDIT_REAL_DISPATCH');
    assert.ok(persisted.some(entry=>entry.eventType==='MODEL_RESPONSE' && entry.executionResult==='SUCCESS'));
  } finally {
    globalThis.fetch = originalFetch; ModelGateway.clearCredentials();
    DurableStore.loadRuntimeEvidence=originalLoad;DurableStore.appendRuntimeEvidence=originalAppend;
    DurableStore.requireExecutionAuthority=originalAuthority;
  }
});

await probe('Evidence catalog never seeds fictitious records for a fresh tenant', () => {
  PersistenceAdapter.setContext({ tenantId: 'TENANT-AUDIT-EMPTY', workspaceId: 'audit', environment: 'production' });
  EvidenceStore.resetToBaseline('TENANT-AUDIT-EMPTY');
  assert.equal(EvidenceStore.getEvidenceRecords('TENANT-AUDIT-EMPTY').length, 0);
});

await probe('Evidence verification detects payload tampering', () => {
  const payload = { request: 'audit', amount: 1 };
  const digest = `SHA256:${crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex')}`;
  const record: any = { evidenceId: 'audit-evidence-tamper', tenantId: 'TENANT-AUDIT-EMPTY',
    integrityDigest: digest, payloadData: payload, sourceType: 'REAL_SCAN' };
  EvidenceStore.ingestEvidence([record], 'TENANT-AUDIT-EMPTY');
  assert.equal(EvidenceStore.verifyRecordIntegrity(record.evidenceId).verified, true);
  record.payloadData.amount = 2;
  assert.equal(EvidenceStore.verifyRecordIntegrity(record.evidenceId).verified, false);
});

await probe('Rescanning/importing does not promote unprovisioned agent to GOVERNED', async () => {
  const result: any = { source: { agents: [{ name: 'forensic-scan-agent', framework: 'CrewAI', tools: [] }] }, risks: [], violations: [] };
  await withAuthenticatedInventory(async()=>{
    const [imported] = await AgentInventoryStore.importFromScanResult(result);
    assert.equal(imported.status, 'IMPORTED');
    const [replay] = await AgentInventoryStore.importFromScanResult(result);
    assert.equal(replay.id,imported.id,'Reimport must use the authoritative identity');
    assert.equal(replay.status, 'IMPORTED');
    assert.notEqual(replay.governance.passportStatus, 'VERIFIED');
  });
});

await probe('Guardian RPC rejects nested foreign tenant before writing evidence', async () => {
  const agent = provision(['crm.read_customer'], 'crewai', 'TENANT-B');
  const profile = ComplianceProfileRegistry.getProfile(agent.complianceProfileId)!;
  const before = EvidenceLedger.getEntries(undefined, 'TENANT-B').length;
  await withServer(async url => {
    const response = await fetch(`${url}/api/v1/guardian/evaluate`, {
      method: 'POST', headers: { 'X-API-Key': 'dev-key-tenant-a', 'Content-Type': 'application/json' },
      body: JSON.stringify({ agent: { id: agent.agentId, name: agent.name }, passport: agent.passport,
        complianceProfile: profile, toolCall: { toolName: 'crm.read_customer', actionType: 'READ' },
        context: { tenantId: 'TENANT-B' } })
    });
    assert.equal(response.status, 403);
    assert.equal(EvidenceLedger.getEntries(undefined, 'TENANT-B').length, before);
  });
});

await probe('Guardian RPC uses server-registered policy, not caller policy fields', async () => {
  const agent = provision(['crm.read_customer'], 'crewai', 'TENANT-A');
  const profile = ComplianceProfileRegistry.getProfile(agent.complianceProfileId)!;
  await withServer(async url => {
    const response = await fetch(`${url}/api/v1/guardian/evaluate`, {
      method: 'POST', headers: { 'X-API-Key': 'dev-key-tenant-a', 'Content-Type': 'application/json' },
      body: JSON.stringify({ agent: { id: agent.agentId, name: agent.name }, passport: agent.passport,
        complianceProfile: { ...profile, profileId: 'forged-profile-label', forbiddenActions: ['crm.read_customer'] },
        toolCall: { toolName: 'crm.read_customer', actionType: 'READ' }, context: { tenantId: 'TENANT-A' } })
    });
    const data = await response.json();
    assert.equal(data.complianceProfileId, profile.profileId);
    assert.equal(data.verdict, 'ALLOW');
  });
});

for (const [framework, Adapter] of [['crewai', CrewAiRuntimeAdapter], ['nvidia-nat', NatRuntimeAdapter]] as const) {
  await probe(`${framework} cannot report success for an unknown capability`, async () => {
    const agent = provision(['crm.read_customer'], framework);
    RuntimeManager.createRuntime(agent.runtimeSpec, agent.passport, agent.tenantId);
    RuntimeManager.startRuntime(agent.runtimeId, agent.tenantId);
    const adapter = new Adapter(RuntimeManager.getWorker(agent.runtimeId)!);
    const session = await adapter.start();
    const result = await adapter.execute(session, { taskId: 'unknown-capability-probe', description: 'Audit denial',
      targetCapability: 'forensic.unregistered-capability', actionType: 'READ' });
    assert.notEqual(result.status, 'COMPLETED');
    assert.equal(result.toolExecutionCount, 0);
  });
}

await probe('Local SHA-256 correctly hashes UTF-8 payloads and detects altered blocks', () => {
  const message = 'Governança — João ☑';
  assert.equal(computeDeterministicHash(message), `SHA256:${crypto.createHash('sha256').update(message).digest('hex')}`);
  const tenant = 'TENANT-AUDIT-LOCAL-CHAIN';
  AuditLedgerStore.resetToBaseline(tenant);
  const block = AuditLedgerStore.appendScanBlock('audit-local-block', { message }, 'audit', 'DECISION_RECORDED', 'CG-AG-07', tenant);
  assert.equal(AuditLedgerStore.verifyEntireLedger(tenant).isChainValid, true);
  const blocks = AuditLedgerStore.getBlocks(tenant);
  blocks[0].payloadData.message = 'Altered';
  PersistenceAdapter.write('audit_ledger', blocks, 'cg_ag_audit_ledger_v1');
  assert.equal(AuditLedgerStore.verifyEntireLedger(tenant).isChainValid, false);
});

await probe('GitHub private-repository content requests retain supplied authentication', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (url: any, init: any) => {
    if (String(url).includes('/git/trees/')) return new Response(JSON.stringify({ tree: [{ type: 'blob', path: 'agent.py' }] }));
    if (String(url).startsWith('https://raw.githubusercontent.com/')) {
      return init?.headers?.Authorization === 'token audit-github-fixture'
        ? new Response('from crewai import Agent\nagent = Agent(role="Audit Analyst")')
        : new Response('Not found', { status: 404 });
    }
    return new Response(JSON.stringify({ default_branch: 'main' }));
  }) as any;
  try {
    const result = await fetchGitHubRepo('https://github.com/audit-fixture/private-repo', undefined, 'audit-github-fixture');
    assert.equal(result.files.size, 1);
  } finally { globalThis.fetch = originalFetch; }
});

await probe('Sandbox filesystem rejects sibling paths sharing its directory prefix', () => {
  const agent = provision(['crm.read_customer']);
  const sandbox = SandboxManager.createSandbox({ agentId: agent.agentId, runtimeInstanceId: agent.runtimeId,
    executionSessionId: 'audit-fs-prefix', tenantId: agent.tenantId!, passport: agent.passport });
  SandboxManager.startSandbox(sandbox.identity.sandboxId);
  const originalWrite = fs.writeFileSync;
  const originalExists = fs.existsSync;
  // Observe the boundary without performing the attempted out-of-sandbox write.
  (fs as any).writeFileSync = () => {};
  (fs as any).existsSync = () => true;
  try {
    assert.throws(() => SandboxManager.writeSandboxFile(sandbox.identity.sandboxId,
      `../${sandbox.identity.sandboxId}-outside/probe.txt`, 'audit'), /FILESYSTEM_ESCAPE_DENIED/);
  } finally { fs.writeFileSync = originalWrite; fs.existsSync = originalExists; }
});

await probe('Agent detail does not fabricate actions, approvals or cryptographic receipts', async () => {
  const React = await import('react');
  const { renderToStaticMarkup } = await import('react-dom/server');
  const { AgentDetailView } = await import('../src/web/views/AgentDetailView');
  await withAuthenticatedInventory(async()=>{
    const agent = await AgentInventoryStore.addAgent({ name: 'forensic-ordinary-agent', risk: 'HIGH', activity: [],
      access: { models: [], data: [], tools: [], network: { directInternet: false, description: 'Unverified' },
        secrets: { directAccess: false, description: 'Unverified' } } });
    const html = renderToStaticMarkup(React.createElement(AgentDetailView, { agentId: agent.id, onBack: () => {} }));
    assert.ok(!/ev_9281|OP-SUPERVISOR|Credit Approval \(€25,000\)|Customer Records/.test(html));
    assert.equal(agent.governance.passportStatus, 'NOT_ISSUED');
  });
});

// These are observations of additional blockers, not passed security assertions.
const observations: Record<string, unknown> = {};
{
  const agent = provision(['crm.read_customer', 'credit.approve']);
  RuntimeManager.createRuntime(agent.runtimeSpec, agent.passport, agent.tenantId);
  RuntimeManager.startRuntime(agent.runtimeId, agent.tenantId);
  const worker = RuntimeManager.getWorker(agent.runtimeId)!;
  let calls = 0;
  ToolGateway.registerProvider({ providerId: 'salesforce-mcp-server', execute: async () => { calls++; return {}; } });
  const crew = new CrewAiRuntimeAdapter(worker);
  const session = await crew.start();
  const result = await crew.execute(session, { taskId: 'audit-adapter-task', description: 'Probe execution receipts',
    targetCapability: 'crm.read_customer', actionType: 'READ' });
  observations.crewai_reported_count = result.toolExecutionCount;
  observations.crewai_observed_provider_calls = calls;
}
{
  const agent = provision(['credit.approve'], 'nvidia-nat');
  RuntimeManager.createRuntime(agent.runtimeSpec, agent.passport, agent.tenantId);
  RuntimeManager.startRuntime(agent.runtimeId, agent.tenantId);
  const adapter = new NatRuntimeAdapter(RuntimeManager.getWorker(agent.runtimeId)!);
  const session = await adapter.start();
  let calls = 0;
  ToolGateway.registerProvider({ providerId: 'core-banking-system', execute: async () => { calls++; return {}; } });
  await adapter.execute(session, { taskId: 'audit-nat-hitl', description: 'Probe actual provider call',
    targetCapability: 'credit.approve', actionType: 'WRITE', payload: { amount: 25000 } });
  const resumed = await adapter.resume(session, 'APPROVED', 'audit-officer');
  observations.nat_hitl_reported_count = resumed.toolExecutionCount;
  observations.nat_hitl_observed_provider_calls = calls;
}
{
  const agent = provision(['crm.read_customer']);
  agent.passport.declaredModels = ['gpt-4o'];
  agent.passport.declaredDataScopes = ['customers'];
  AgentProvisioner.signPassport(agent.passport, agent.agentId);
  DurableStore.savePassport(agent.passport, agent.agentId, agent.tenantId!, agent.runtimeSpec);
  await DurableStore.flushPendingWrites();
  await DurableStore.rehydrateOperationalState();
  const recovered = AgentProvisioner.getAgent(agent.agentId)!;
  observations.passport_recovered_models = recovered.passport.declaredModels || null;
  observations.passport_recovered_data_scopes = recovered.passport.declaredDataScopes || null;
  observations.passport_recovered_signature_valid = PassportSigner.verify(recovered.passport.passportFingerprint,
    PassportSigner.toSignInput(recovered.passport, recovered.agentId)).valid;
  await probe('Restart restoration preserves signed model/data declarations', () => {
    assert.deepEqual(recovered.passport.declaredModels, ['gpt-4o']);
    assert.deepEqual(recovered.passport.declaredDataScopes, ['customers']);
    assert.equal(observations.passport_recovered_signature_valid, true);
  });
}

const assets = fs.readdirSync('dist/assets').filter(name => name.endsWith('.js'));
const clientBundle = assets.map(name => fs.readFileSync(path.join('dist/assets', name), 'utf8')).join('\n');
const secretNames = ['SUPABASE_SERVICE_ROLE_KEY', 'COMPLYPRO_PASSPORT_SECRET', 'CODEGUARD_PASSPORT_SECRET',
  'COMPLIANCE_SERVER_SECRET', 'OPENAI_API_KEY', 'OPENROUTER_API_KEY', 'SILICONFLOW_API_KEY', 'GITHUB_TOKEN'];
observations.client_secret_value_matches = secretNames.filter(key => localConfig[key]?.length > 16 && clientBundle.includes(localConfig[key]));
await probe('Frontend bundle contains no configured server secret values', () => {
  assert.deepEqual(observations.client_secret_value_matches, []);
});
const secretSources: Array<{ key: string; file: string; line: number }> = [];
function inspectSecretSources(directory: string) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) inspectSecretSources(filename);
    else if (/\.(ts|tsx|js|json)$/.test(filename)) {
      const lines = fs.readFileSync(filename, 'utf8').split(/\r?\n/);
      for (const key of secretNames) {
        if (!localConfig[key] || localConfig[key].length <= 16) continue;
        lines.forEach((line, index) => {
          if (line.includes(localConfig[key])) secretSources.push({ key, file: filename, line: index + 1 });
        });
      }
    }
  }
}
inspectSecretSources('src');
observations.secret_source_matches = secretSources;
observations.configured_openrouter_value_shape = {
  length: localConfig.OPENROUTER_API_KEY?.length || 0,
  credentialLike: /^sk-or-v1-[a-f0-9]{60,}$/i.test(localConfig.OPENROUTER_API_KEY || ''),
  placeholderLike: /placeholder|your_|example|test|xxx/i.test(localConfig.OPENROUTER_API_KEY || '')
};
observations.frontend_env_keys = fs.existsSync('.env.local')
  ? Object.keys(dotenv.parse(fs.readFileSync('.env.local', 'utf8'))).filter(key => key.startsWith('VITE_')) : [];
observations.runtime_evidence_storage = {test:'Memory fixture',production:'DurableStore / audit_ledger_blocks; deployment requires independent validation'};
console.log('[AUDIT OBSERVATIONS]', JSON.stringify(observations, null, 2));
RuntimeManager.reset();
await DurableStore.flushPendingWrites();
console.log(`[AUDIT SUMMARY] ${passed} passed, ${failed} failed`);
process.exitCode = failed ? 1 : 0;
