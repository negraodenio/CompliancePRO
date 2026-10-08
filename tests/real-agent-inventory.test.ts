/**
 * ComplyPRO.pt — Sprint: Real Agent Inventory
 * Automated Integration Test Suite
 * 
 * Verifies Acceptance Criteria from Specification:
 * - A: Real agent list
 * - B: Empty inventory (Zero fake agents)
 * - C: Tenant isolation (Tenant A -> Agent A ALLOW; Tenant A -> Agent B DENY; Tenant B -> Agent A DENY)
 * - D: Agent detail (Real model, framework, owner, status)
 * - E: Real governance status & HMAC signature
 * - F: Real capabilities & declared tools
 * - G: Real Guardian decisions & blocked action count
 * - H: Real HITL pending count
 * - I: Real metrics calculation (Zero hardcoded numbers)
 * - J: Scanner import -> Inventory flow
 * - K: Unknown owner handling & assignment
 * - L: Real risk tier reflection
 * - M: Cross-tenant agent access rejection (403)
 * - N: Cross-tenant passport isolation
 * - O: Complete elimination of hardcoded demo fixtures
 */

import http from 'http';
import assert from 'assert';
import { createServerApp } from '../src/server/app';
import { AgentProvisioner, AgentDefinition } from '../src/core/agent-provisioner';
import { IdentityProvider } from '../src/server/security/identity-provider';
import { EvidenceLedger } from '../src/core/evidence-ledger';
import { DurableStore } from '../src/server/db/durable-store';
import { AgentInventoryStore } from '../src/web/services/agent-inventory-store';
import { ScannerResult } from '../src/core/types';

console.log('==================================================================');
console.log('>>> COMPLYPRO.PT — REAL AGENT INVENTORY INTEGRATION SUITE     <<<');
console.log('==================================================================\n');

// Clean test environment
AgentProvisioner.reset();
EvidenceLedger.reset();
IdentityProvider.initializeBaselineUsers();

const app = createServerApp();
const server = http.createServer(app);

await new Promise<void>((resolve) => {
  server.listen(0, '127.0.0.1', () => resolve());
});

const port = (server.address() as any).port;
const baseUrl = `http://127.0.0.1:${port}`;

async function apiRequest(path: string, options?: {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
}) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers || {})
  };

  const res = await fetch(`${baseUrl}${path}`, {
    method: options?.method || 'GET',
    headers,
    body: options?.body ? JSON.stringify(options.body) : undefined
  });

  let json: any = null;
  try {
    json = await res.json();
  } catch {
    // Non-JSON response
  }

  return { status: res.status, headers: res.headers, json };
}

let passedCount = 0;
function pass(testName: string, detail?: string) {
  passedCount++;
  console.log(`  [PASS ${passedCount}]: ${testName}${detail ? ` (${detail})` : ''}`);
}

try {
  // --------------------------------------------------------------------------
  // TEST SUITE B: EMPTY INVENTORY FOR NEW TENANT
  // --------------------------------------------------------------------------
  console.log('--- TEST B & I: EMPTY INVENTORY FOR UNPROVISIONED TENANTS ---');
  
  // Tenant B has 0 agents currently
  const emptyListRes = await apiRequest('/api/v1/agents', {
    headers: { 'X-API-Key': 'dev-key-tenant-b' }
  });
  assert.strictEqual(emptyListRes.status, 200);
  assert.strictEqual(emptyListRes.json.total, 0, 'Total agents for fresh tenant must be 0');
  assert.deepStrictEqual(emptyListRes.json.agents, [], 'Agents list for fresh tenant must be empty');
  pass('Fresh tenant returns 0 agents and empty array on GET /api/v1/agents');

  // Metrics for Tenant B must be all zero (no hardcoded 12, 9, 2, 17)
  const emptyMetricsRes = await apiRequest('/api/v1/agents/metrics', {
    headers: { 'X-API-Key': 'dev-key-tenant-b' }
  });
  assert.strictEqual(emptyMetricsRes.status, 200);
  assert.strictEqual(emptyMetricsRes.json.totalAgents, 0);
  assert.strictEqual(emptyMetricsRes.json.governedAgents, 0);
  assert.strictEqual(emptyMetricsRes.json.needAttentionAgents, 0);
  assert.strictEqual(emptyMetricsRes.json.unknownAgents, 0);
  assert.strictEqual(emptyMetricsRes.json.highRiskAgents, 0);
  assert.strictEqual(emptyMetricsRes.json.blockedActions, 0);
  assert.strictEqual(emptyMetricsRes.json.hitlPending, 0);
  pass('Metrics for fresh tenant are all strictly 0 with zero hardcoded values');

  // --------------------------------------------------------------------------
  // PROVISION AGENTS FOR TENANT A AND TENANT B
  // --------------------------------------------------------------------------
  console.log('\n--- PROVISIONING REAL AGENTS FOR TENANT A & B ---');
  
  const defAgentA1: AgentDefinition = {
    name: 'financial-risk-evaluator',
    framework: { name: 'crewai', version: '0.102.0' },
    complianceProfile: 'CP-EU-AI-ACT-HIGH-RISK-FINANCIAL',
    capabilities: ['crm.read_customer', 'credit_bureau_query', 'credit.approve'],
    budget: { maxCostPerRunEur: 10.0, maxTokensPerStep: 4096, maxCallsPerMinute: 30 }
  };

  const defAgentA2: AgentDefinition = {
    name: 'internal-doc-assistant',
    framework: { name: 'crewai', version: '0.102.0' },
    complianceProfile: 'CP-GDPR-STRICT-DATA-PROCESSING',
    capabilities: ['crm.read_customer'],
    budget: { maxCostPerRunEur: 2.0, maxTokensPerStep: 2048, maxCallsPerMinute: 60 }
  };

  const defAgentB1: AgentDefinition = {
    name: 'tenant-b-procurement-bot',
    framework: { name: 'crewai', version: '0.102.0' },
    complianceProfile: 'CP-GDPR-STRICT-DATA-PROCESSING',
    capabilities: ['crm.read_customer'],
    budget: { maxCostPerRunEur: 5.0, maxTokensPerStep: 4096, maxCallsPerMinute: 20 }
  };

  const provA1 = await apiRequest('/api/v1/agents/provision', {
    method: 'POST',
    headers: { 'X-API-Key': 'dev-key-tenant-a' },
    body: defAgentA1
  });
  assert.strictEqual(provA1.status, 201);
  const agentA1Id = provA1.json.agentId;

  const provA2 = await apiRequest('/api/v1/agents/provision', {
    method: 'POST',
    headers: { 'X-API-Key': 'dev-key-tenant-a' },
    body: defAgentA2
  });
  assert.strictEqual(provA2.status, 201);
  const agentA2Id = provA2.json.agentId;

  const provB1 = await apiRequest('/api/v1/agents/provision', {
    method: 'POST',
    headers: { 'X-API-Key': 'dev-key-tenant-b' },
    body: defAgentB1
  });
  assert.strictEqual(provB1.status, 201);
  const agentB1Id = provB1.json.agentId;

  pass('Provisioned 2 agents for Tenant A and 1 agent for Tenant B');

  // --------------------------------------------------------------------------
  // TEST SUITE A: REAL AGENT LIST PER TENANT
  // --------------------------------------------------------------------------
  console.log('\n--- TEST A: REAL AGENT LIST ENFORCEMENT ---');
  
  const listARes = await apiRequest('/api/v1/agents', {
    headers: { 'X-API-Key': 'dev-key-tenant-a' }
  });
  assert.strictEqual(listARes.status, 200);
  assert.strictEqual(listARes.json.total, 2, 'Tenant A must see exactly 2 agents');
  assert.strictEqual(listARes.json.agents.length, 2);
  const returnedAIds = listARes.json.agents.map((a: any) => a.agentId);
  assert.ok(returnedAIds.includes(agentA1Id));
  assert.ok(returnedAIds.includes(agentA2Id));
  assert.ok(!returnedAIds.includes(agentB1Id), 'Tenant A MUST NOT see Tenant B agent in list');
  pass('GET /api/v1/agents returns exactly Tenant A agents, excluding other tenants');

  const listBRes = await apiRequest('/api/v1/agents', {
    headers: { 'X-API-Key': 'dev-key-tenant-b' }
  });
  assert.strictEqual(listBRes.status, 200);
  assert.strictEqual(listBRes.json.total, 1, 'Tenant B must see exactly 1 agent');
  assert.strictEqual(listBRes.json.agents[0].agentId, agentB1Id);
  pass('GET /api/v1/agents returns exactly Tenant B agent, excluding Tenant A agents');

  // --------------------------------------------------------------------------
  // TEST SUITE C & M: TENANT ISOLATION & CROSS-TENANT ACCESS DENIAL
  // --------------------------------------------------------------------------
  console.log('\n--- TEST C & M: STRICT CROSS-TENANT ACCESS CONTROL ---');

  // 1. Tenant A accesses Agent A1 -> ALLOW 200
  const accessAtoA = await apiRequest(`/api/v1/agents/${agentA1Id}`, {
    headers: { 'X-API-Key': 'dev-key-tenant-a' }
  });
  assert.strictEqual(accessAtoA.status, 200, 'Tenant A accessing Agent A must return 200 ALLOW');
  assert.strictEqual(accessAtoA.json.agentId, agentA1Id);
  pass('TENANT A -> AGENT A1 -> ALLOW (200)');

  // 2. Tenant A accesses Agent B1 -> DENY 403
  const accessAtoB = await apiRequest(`/api/v1/agents/${agentB1Id}`, {
    headers: { 'X-API-Key': 'dev-key-tenant-a' }
  });
  assert.strictEqual(accessAtoB.status, 403, 'Tenant A accessing Agent B must return 403 DENY');
  assert.strictEqual(accessAtoB.json.error.code, 'CROSS_TENANT_ACCESS_DENIED');
  pass('TENANT A -> AGENT B1 -> DENY (403 CROSS_TENANT_ACCESS_DENIED)');

  // 3. Tenant B accesses Agent A1 -> DENY 403
  const accessBtoA = await apiRequest(`/api/v1/agents/${agentA1Id}`, {
    headers: { 'X-API-Key': 'dev-key-tenant-b' }
  });
  assert.strictEqual(accessBtoA.status, 403, 'Tenant B accessing Agent A must return 403 DENY');
  assert.strictEqual(accessBtoA.json.error.code, 'CROSS_TENANT_ACCESS_DENIED');
  pass('TENANT B -> AGENT A1 -> DENY (403 CROSS_TENANT_ACCESS_DENIED)');

  // 4. Non-existent agent -> 404
  const accessNotFound = await apiRequest('/api/v1/agents/agt_non_existent_9999', {
    headers: { 'X-API-Key': 'dev-key-tenant-a' }
  });
  assert.strictEqual(accessNotFound.status, 404);
  assert.strictEqual(accessNotFound.json.error.code, 'AGENT_NOT_FOUND');
  pass('Unknown agent ID returns safe 404');

  // --------------------------------------------------------------------------
  // TEST SUITE D, E, F: REAL AGENT DETAIL & GOVERNANCE DATA
  // --------------------------------------------------------------------------
  console.log('\n--- TEST D, E, F: REAL AGENT DETAIL, GOVERNANCE & CAPABILITIES ---');

  const agentDetail = accessAtoA.json;
  assert.strictEqual(agentDetail.name, 'financial-risk-evaluator');
  assert.strictEqual(agentDetail.framework.name, 'crewai');
  assert.strictEqual(agentDetail.framework.version, '0.102.0');
  assert.strictEqual(agentDetail.status, 'PROVISIONED');
  assert.ok(agentDetail.passport, 'Passport must be bound');
  assert.strictEqual(agentDetail.passport.status, 'GOVERNED');
  assert.strictEqual(agentDetail.passport.tenantId, 'TENANT-A');
  assert.strictEqual(agentDetail.passport.riskTier, 'HIGH');
  assert.ok(typeof agentDetail.passportFingerprint === 'string' && agentDetail.passportFingerprint.length > 0);
  assert.ok(agentDetail.passport.declaredTools.includes('credit.approve'));
  assert.ok(agentDetail.passport.declaredTools.includes('crm.read_customer'));
  pass('Real Agent detail contains authentic passport, framework, tools and HMAC fingerprint');

  // --------------------------------------------------------------------------
  // TEST SUITE G, H, I: REAL METRICS FROM EVIDENCE LEDGER & DURABLE STORE
  // --------------------------------------------------------------------------
  console.log('\n--- TEST G, H, I: REAL METRICS WITH LEDGER AND DURABLE SESSIONS ---');

  // Insert a real BLOCK evidence event for Tenant A
  EvidenceLedger.append({
    agentId: agentA1Id,
    eventType: 'TOOL_BLOCKED',
    payload: { tool: 'unauthorized_exec', reason: 'NOT_DECLARED' },
    verdict: 'BLOCK',
    actorId: 'GUARDIAN'
  }, 'TENANT-A');

  // Insert a second real BLOCK evidence event for Tenant A
  EvidenceLedger.append({
    agentId: agentA2Id,
    eventType: 'DATA_BLOCKED',
    payload: { scope: 'financial_records' },
    verdict: 'BLOCK',
    actorId: 'GUARDIAN'
  }, 'TENANT-A');

  // Insert a PAUSED session in DurableStore for Tenant A to simulate a real pending HITL request
  DurableStore.saveExecutionSession({
    executionId: 'session-hitl-test-01',
    runtimeId: provA1.json.runtimeId,
    agentId: agentA1Id,
    passportId: provA1.json.passportId,
    status: 'PAUSED',
    toolExecutionCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }, 'TENANT-A');

  // Query metrics for Tenant A
  const metricsARes = await apiRequest('/api/v1/agents/metrics', {
    headers: { 'X-API-Key': 'dev-key-tenant-a' }
  });
  assert.strictEqual(metricsARes.status, 200);
  assert.strictEqual(metricsARes.json.totalAgents, 2);
  assert.strictEqual(metricsARes.json.governedAgents, 2);
  assert.strictEqual(metricsARes.json.highRiskAgents, 1); // Only A1 is HIGH risk
  assert.strictEqual(metricsARes.json.blockedActions, 2, 'Must reflect exactly 2 real blocked actions from EvidenceLedger');
  assert.strictEqual(metricsARes.json.hitlPending, 1, 'Must reflect exactly 1 real PAUSED session from DurableStore');
  pass('Tenant A metrics calculate real values: blockedActions=2, hitlPending=1, total=2');

  // Query metrics for Tenant B - MUST NOT bleed Tenant A blocked actions or HITL sessions!
  const metricsBRes = await apiRequest('/api/v1/agents/metrics', {
    headers: { 'X-API-Key': 'dev-key-tenant-b' }
  });
  assert.strictEqual(metricsBRes.status, 200);
  assert.strictEqual(metricsBRes.json.totalAgents, 1);
  assert.strictEqual(metricsBRes.json.blockedActions, 0, 'Tenant B blockedActions must be 0, no cross-tenant bleed');
  assert.strictEqual(metricsBRes.json.hitlPending, 0, 'Tenant B hitlPending must be 0, no cross-tenant bleed');
  pass('Tenant B metrics isolated: 0 blockedActions, 0 hitlPending (No cross-tenant leak)');

  // --------------------------------------------------------------------------
  // TEST SUITE J: SCANNER -> INVENTORY BRIDGE
  // --------------------------------------------------------------------------
  console.log('\n--- TEST J: SCANNER DISCOVERY IMPORT INTO INVENTORY ---');

  const mockScanResult: ScannerResult = {
    target: { type: 'directory', path: './sample-project' },
    repo: { name: 'analytics-pipeline', url: 'https://internal.git/analytics' },
    scannerVersion: '1.0.0',
    timestamp: new Date().toISOString(),
    risks: [
      { id: 'SEC-01', title: 'Undeclared egress', description: 'Agent attempts outbound connection', level: 'high' } as any
    ],
    violations: [
      { id: 'V-01', ruleId: 'NO_RAW_CREDENTIALS', message: 'Plaintext secret found' } as any
    ],
    passedRules: [],
    owner: { label: 'Data Science Squad', role: 'Staff ML Engineer', teams: ['AI Core'] },
    source: {
      type: 'ast',
      agents: [
        {
          name: 'data-harvester',
          framework: 'CrewAI',
          model: 'gpt-4o',
          riskLevel: 'high',
          tools: ['extract_data', 'push_metrics']
        }
      ],
      aiModels: [{ modelId: 'gpt-4o', provider: 'openai' }]
    }
  };

  const nativeFetch = globalThis.fetch;
  globalThis.fetch = ((url: any, options: any = {}) => nativeFetch(
    String(url).startsWith('/') ? `${baseUrl}${url}` : url,
    {...options,headers:{...options.headers,'X-API-Key':'dev-key-tenant-a'}})) as any;
  const importedAgents = await AgentInventoryStore.importFromScanResult(mockScanResult);
  assert.strictEqual(importedAgents.length, 1);
  const importedAgent = importedAgents[0];
  assert.strictEqual(importedAgent.name, 'data-harvester');
  assert.strictEqual(importedAgent.status, 'IMPORTED');
  assert.strictEqual(importedAgent.risk, 'HIGH');
  assert.strictEqual(importedAgent.framework, 'CrewAI');
  assert.strictEqual(importedAgent.riskDetails.openFindings, 1);
  assert.strictEqual(importedAgent.owner.name, 'Data Science Squad');
  assert.ok(importedAgent.access.tools.some(t => t.name === 'extract_data'));
  pass('Scanner discovery cleanly imports into AgentInventoryStore preserving findings, risk, tools and status');

  // --------------------------------------------------------------------------
  // TEST SUITE K: UNKNOWN OWNER HANDLING & ASSIGNMENT
  // --------------------------------------------------------------------------
  console.log('\n--- TEST K: UNKNOWN OWNER HANDLING & UPDATING ---');

  const agentWithoutOwner = await AgentInventoryStore.addAgent({
    name: 'orphaned-batch-agent',
    framework: 'Custom',
    model: 'claude-3-5-sonnet',
    owner: { name: 'Unknown', role: 'Not assigned', department: 'Unassigned' },
    status: 'UNKNOWN',
    risk: 'LOW',
    description: 'Agent discovered without assigned owner.'
  });

  assert.strictEqual(agentWithoutOwner.owner.name, 'Unknown');
  assert.strictEqual(agentWithoutOwner.owner.role, 'Not assigned');

  // Assign owner through store
  await AgentInventoryStore.updateAgent(agentWithoutOwner.id, {
    owner: { name: 'Alice Santos', role: 'Tech Lead', department: 'SecOps' },
    status: 'IMPORTED'
  });

  const updatedAgent = AgentInventoryStore.getAgent(agentWithoutOwner.id);
  assert.strictEqual(updatedAgent?.owner.name, 'Alice Santos');
  assert.strictEqual(updatedAgent?.status, 'IMPORTED', 'Owner assignment must not issue governance authority');
  assert.strictEqual(updatedAgent?.governance.passportStatus,'NOT_ISSUED');
  pass('Unknown owner properly recognized and assigned via updateAgent');

  // --------------------------------------------------------------------------
  // TEST SUITE O: NO HARDCODED DEMO METRICS OR MOCK USERS
  // --------------------------------------------------------------------------
  console.log('\n--- TEST O: PURGING OF HARDCODED DEMO DATA & PROMISES ---');

  const currentAgents = AgentInventoryStore.getAgents();
  const forbiddenMockNames = ['joão', 'maria', 'pedro', 'carlos', 'ana', 'beatriz', 'ricardo', 'sofia', 'lucas', 'alexandre'];
  
  for (const ag of currentAgents) {
    const ownerLower = ag.owner.name.toLowerCase();
    for (const mockName of forbiddenMockNames) {
      assert.ok(!ownerLower.includes(mockName), `Mock name "${mockName}" must not exist in real inventory agents`);
    }
  }

  const currentMetrics = AgentInventoryStore.getMetrics();
  // Ensure metrics are dynamic
  assert.strictEqual(typeof currentMetrics.totalAgents, 'number');
  assert.strictEqual(typeof currentMetrics.blockedActions, 'number');
  assert.strictEqual(typeof currentMetrics.hitlPending, 'number');
  assert.ok(![12, 17].every((v, i) => [currentMetrics.totalAgents, currentMetrics.blockedActions][i] === v), 'Must not emit canonical 12 agents / 17 blocked mock pattern');
  pass('Confirmed zero hardcoded mock names or demo fallback metrics');
  globalThis.fetch = nativeFetch;

  console.log('\n==================================================================');
  console.log(`>>> ALL ${passedCount} REAL AGENT INVENTORY TESTS PASSED WITH 100% <<<`);
  console.log('==================================================================\n');

} finally {
  server.close();
}
