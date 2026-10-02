/**
 * ComplyPRO.pt — Sprint 1: Governed Capability Gateway Tests
 * 
 * Verifies the Active Gateway Architecture:
 * - Channel TOOL: evaluateToolExecution()
 * - Channel MODEL: evaluateModelInvocation()
 * - Channel DATA: evaluateDataEgress()
 * - Unified entrypoint: evaluateCapability()
 * 
 * Invariants:
 * 1. Zero framework leakage (agnostic to CrewAI, LangGraph, etc.)
 * 2. Strict capability scoping (least-privilege)
 * 3. Enforces compiled ComplianceProfile deterministically in sub-10ms
 * 4. Generates immutable evidence across all channels
 */

import { GuardianService, GovernedCapabilityRequest } from '../src/core/guardian-service';
import { ComplianceProfileRegistry } from '../src/core/compliance-compiler';
import { AgentPassport } from '../src/core/compliance-contract';
import assert from 'assert';

console.log('==================================================================');
console.log('>>> COMPLYPRO.PT — SPRINT 1: GOVERNED CAPABILITY GATEWAY TESTS <<<');
console.log('==================================================================\n');

// 1. Setup Test Profile from Registry
const profile = ComplianceProfileRegistry.getProfile('CP-EU-AI-ACT-HIGH-RISK-FINANCIAL')!;
assert.ok(profile, 'Profile CP-EU-AI-ACT-HIGH-RISK-FINANCIAL must exist');

// 2. Setup Governed Passport with Capabilities & Runtime metadata
const passport: AgentPassport = {
  passportId: 'PASS-GOV-CREDIT-001',
  passportFingerprint: 'SIG-SHA256-A899FE104B8C11E4988',
  complianceProfileChecksum: profile.checksum,
  declaredTools: ['credit_bureau_query', 'crm.read_customer'],
  governedCapabilities: [
    { capability: 'credit_bureau_query', channel: 'TOOL', riskTier: 'LOW' },
    { capability: 'crm.read_customer', channel: 'TOOL', riskTier: 'LOW' },
    { capability: 'approve_credit_limit', channel: 'TOOL', riskTier: 'HIGH', requiresHitl: true },
    { capability: 'transfer_funds', channel: 'TOOL', riskTier: 'HIGH', requiresHitl: true },
    { capability: 'gpt-4o', channel: 'MODEL', riskTier: 'MEDIUM' },
    { capability: 'storage.customer_dossier', channel: 'DATA', riskTier: 'LOW' },
    { capability: 'EXPORT_RAW_FINANCIAL_RECORDS', channel: 'DATA', riskTier: 'HIGH' }
  ],
  runtime: {
    framework: 'crewai',
    frameworkVersion: '0.102.0',
    runtimeVersion: 'complypro-runtime-v1.0'
  },
  toolManifestHash: 'HASH-TOOL-MANIFEST-781A9',
  riskTier: 'HIGH',
  status: 'GOVERNED'
};

const agent = {
  id: 'agt_credit_analyst_01',
  name: 'Credit Risk Analysis Agent',
  version: '1.0.0',
  environment: 'production' as const
};

// ----------------------------------------------------------------------------
// TEST 1: Tool Gateway — Permitted Declared Tool
// ----------------------------------------------------------------------------
console.log('[TEST 1] Tool Gateway: Allows declared low-risk tool');
const toolRes = GuardianService.evaluateToolExecution({
  agent,
  passport,
  complianceProfile: profile,
  toolName: 'credit_bureau_query',
  actionType: 'READ',
  payload: { customerId: 'CUST-1002' }
});

assert.strictEqual(toolRes.verdict, 'ALLOW');
assert.strictEqual(toolRes.channel, 'TOOL');
assert.strictEqual(toolRes.capability, 'credit_bureau_query');
assert.ok(toolRes.decisionLatencyMs < 10, 'Sub-10ms latency');
console.log('  [PASS]: Verdict ALLOW on tool execution');
console.log(`  [PASS]: Latency ${toolRes.decisionLatencyMs}ms`);

// ----------------------------------------------------------------------------
// TEST 2: Tool Gateway — Blocks Prohibited Tool/Action
// ----------------------------------------------------------------------------
console.log('\n[TEST 2] Tool Gateway: Blocks explicitly prohibited action');
const forbiddenRes = GuardianService.evaluateToolExecution({
  agent,
  passport,
  complianceProfile: profile,
  toolName: 'DIRECT_DB_DDL',
  actionType: 'DELETE',
  payload: { table: 'customers' }
});

assert.strictEqual(forbiddenRes.verdict, 'BLOCK');
assert.strictEqual(forbiddenRes.controlId, 'CG-AG-02');
console.log('  [PASS]: Verdict BLOCK on DIRECT_DB_DDL');
console.log(`  [PASS]: Reason: ${forbiddenRes.reason}`);

// ----------------------------------------------------------------------------
// TEST 3: Tool Gateway — Enforces HITL on High-Impact Capability
// ----------------------------------------------------------------------------
console.log('\n[TEST 3] Tool Gateway: Enforces HITL on high-risk capability');
const hitlRes = GuardianService.evaluateToolExecution({
  agent,
  passport,
  complianceProfile: profile,
  toolName: 'approve_credit_limit',
  actionType: 'WRITE',
  payload: { customerId: 'CUST-1002', newLimit: 50000 }
});

assert.strictEqual(hitlRes.verdict, 'REQUIRE_HITL');
assert.ok(hitlRes.gateId && hitlRes.gateId.startsWith('GATE-'));
assert.strictEqual(hitlRes.controlId, 'CG-AG-03');
console.log('  [PASS]: Verdict REQUIRE_HITL');
console.log(`  [PASS]: Gate ID generated: ${hitlRes.gateId}`);

// ----------------------------------------------------------------------------
// TEST 4: Model Gateway — Permits Approved Model Invocations
// ----------------------------------------------------------------------------
console.log('\n[TEST 4] Model Gateway: Permits approved model invocation');
const modelRes = GuardianService.evaluateModelInvocation({
  agent,
  passport,
  complianceProfile: profile,
  modelName: 'gpt-4o',
  promptTokens: 1200,
  context: { sessionTokens: 5000, maxTokensPerMinute: 50000 }
});

assert.strictEqual(modelRes.verdict, 'ALLOW');
assert.strictEqual(modelRes.channel, 'MODEL');
assert.strictEqual(modelRes.capability, 'gpt-4o');
console.log('  [PASS]: Model Gateway ALLOW for gpt-4o');

// ----------------------------------------------------------------------------
// TEST 5: Model Gateway — Blocks Undeclared / Unapproved Model (Least Privilege)
// ----------------------------------------------------------------------------
console.log('\n[TEST 5] Model Gateway: Blocks undeclared model (Least Privilege)');
const forbiddenModelRes = GuardianService.evaluateModelInvocation({
  agent,
  passport,
  complianceProfile: profile,
  modelName: 'unapproved_external_llm_alpha',
  promptTokens: 800
});

assert.strictEqual(forbiddenModelRes.verdict, 'BLOCK');
assert.strictEqual(forbiddenModelRes.controlId, 'CG-AG-02');
console.log('  [PASS]: Model Gateway BLOCK for unapproved model');

// ----------------------------------------------------------------------------
// TEST 6: Model Gateway — Trips Circuit Breaker on Token Explosion
// ----------------------------------------------------------------------------
console.log('\n[TEST 6] Model Gateway: Circuit Breaker on token explosion');
const tokenExplosionRes = GuardianService.evaluateModelInvocation({
  agent,
  passport,
  complianceProfile: profile,
  modelName: 'gpt-4o',
  promptTokens: 150000,
  context: { sessionTokens: 150000, maxTokensPerMinute: 100000 }
});

assert.strictEqual(tokenExplosionRes.verdict, 'CIRCUIT_BREAK');
assert.ok(tokenExplosionRes.incidentId && tokenExplosionRes.incidentId.startsWith('INC-CB-'));
console.log('  [PASS]: Model Gateway CIRCUIT_BREAK on token explosion');
console.log(`  [PASS]: Incident ID: ${tokenExplosionRes.incidentId}`);

// ----------------------------------------------------------------------------
// TEST 7: Data Gateway — Permits Standard Internal Data Access
// ----------------------------------------------------------------------------
console.log('\n[TEST 7] Data Gateway: Permits standard internal data access');
const dataRes = GuardianService.evaluateDataEgress({
  agent,
  passport,
  complianceProfile: profile,
  resource: 'storage.customer_dossier',
  actionType: 'READ',
  dataClassification: 'INTERNAL',
  payload: { documentId: 'DOC-889' }
});

assert.strictEqual(dataRes.verdict, 'ALLOW');
assert.strictEqual(dataRes.channel, 'DATA');
assert.strictEqual(dataRes.capability, 'storage.customer_dossier');
console.log('  [PASS]: Data Gateway ALLOW for internal read');

// ----------------------------------------------------------------------------
// TEST 8: Data Gateway — Blocks Explicitly Prohibited Data Egress (EU AI Act & DORA)
// ----------------------------------------------------------------------------
console.log('\n[TEST 8] Data Gateway: Blocks prohibited data exfiltration');
const dataBlockRes = GuardianService.evaluateDataEgress({
  agent,
  passport,
  complianceProfile: profile,
  resource: 'EXPORT_RAW_FINANCIAL_RECORDS',
  actionType: 'WRITE',
  dataClassification: 'RESTRICTED',
  payload: { format: 'csv_raw', unmasked: true }
});

assert.strictEqual(dataBlockRes.verdict, 'BLOCK');
assert.strictEqual(dataBlockRes.controlId, 'CG-AG-02');
console.log('  [PASS]: Data Gateway BLOCK on EXPORT_RAW_FINANCIAL_RECORDS');
console.log(`  [PASS]: Reason: ${dataBlockRes.reason}`);

// ----------------------------------------------------------------------------
// TEST 9: Unified Gateway Endpoint — evaluateCapability()
// ----------------------------------------------------------------------------
console.log('\n[TEST 9] Unified Gateway: evaluateCapability across any channel');
const unifiedReq: GovernedCapabilityRequest = {
  agent,
  passport,
  complianceProfile: profile,
  channel: 'TOOL',
  capability: 'credit_bureau_query',
  actionType: 'READ',
  payload: { query: 'credit_score' }
};

const unifiedRes = GuardianService.evaluateCapability(unifiedReq);
assert.strictEqual(unifiedRes.verdict, 'ALLOW');
assert.strictEqual(unifiedRes.channel, 'TOOL');
assert.strictEqual(unifiedRes.capability, 'credit_bureau_query');
console.log('  [PASS]: Unified evaluateCapability executed successfully');

console.log('\n==================================================================');
console.log('>>> ALL 9 GOVERNED CAPABILITY GATEWAY TESTS PASSED WITH 100% <<<');
console.log('==================================================================\n');
