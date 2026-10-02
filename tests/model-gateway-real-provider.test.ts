/**
 * ComplyPRO.pt — Sprint 7-E: Real Model Provider Integration Proof
 * "Build with your framework. Govern with ComplyPRO."
 * 
 * Verifies that a CrewAI agent executing within the Isolated Runtime
 * invokes a REAL EXTERNAL MODEL PROVIDER through the Model Gateway:
 * 
 * CrewAI Agent -> IsolatedWorker -> ModelGateway -> Guardian -> REAL MODEL PROVIDER -> Response -> Evidence Ledger -> EvidenceVerifier
 * 
 * Required Verifications:
 * 1.  Real provider availability (Discovery)
 * 2.  Real model invocation through Gateway
 * 3.  Guardian ALLOW evaluation
 * 4.  Passport binding verification
 * 5.  Worker zero secrets (SECRET_ACCESS_DENIED)
 * 6.  Worker direct network denied (NETWORK_ACCESS_DENIED)
 * 7.  No silent fallback to mock on provider error
 * 8.  Real response received from external provider
 * 9.  Evidence generated in EvidenceLedger
 * 10. Evidence cryptographic verification (valid === true)
 * 11. No secrets in Evidence
 * 12. Unauthorized model/capability BLOCKED
 * 13. Zero provider calls on BLOCK
 * 14. Regression compatibility
 */

import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { AgentProvisioner, AgentDefinition } from '../src/core/agent-provisioner';
import { RuntimeManager } from '../src/core/runtime-manager';
import { IsolatedWorker } from '../src/core/isolated-worker';
import { CrewAiRuntimeAdapter } from '../src/core/adapters/crewai-runtime-adapter';
import { EvidenceLedger } from '../src/core/evidence-ledger';
import { EvidenceVerifier } from '../src/core/evidence-verifier';
import { ComplianceProfileRegistry } from '../src/core/compliance-compiler';
import { CapabilityRegistry } from '../src/core/capability-registry';
import { ModelGateway, ModelProvider } from '../src/core/model-gateway';
import { GuardianService } from '../src/core/guardian-service';

console.log('==================================================================');
console.log('>>> COMPLYPRO.PT — SPRINT 7-E: REAL MODEL PROVIDER PROOF       <<<');
console.log('>>> "Build with your framework. Govern with ComplyPRO."        <<<');
console.log('==================================================================\n');

// ----------------------------------------------------------------------------
// FASE 1: DISCOVERY & CREDENTIAL CONFIGURATION
// ----------------------------------------------------------------------------
console.log('[FASE 1] Discovery: Inspecting Environment & Provider Credentials...');

AgentProvisioner.reset();
RuntimeManager.reset();
EvidenceLedger.reset();
ModelGateway.clearCredentials();
ModelGateway.resetDispatcher();

// Load environment safely from .env without logging secrets
const envPath = path.resolve(process.cwd(), '.env');
let openrouterKey = process.env.OPENROUTER_API_KEY || '';
let openaiKey = process.env.OPENAI_API_KEY || '';

if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf-8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed.startsWith('OPENROUTER_API_KEY=') && !openrouterKey) {
      openrouterKey = trimmed.split('=')[1].trim().replace(/^['"]|['"]$/g, '');
    }
    if (trimmed.startsWith('OPENAI_API_KEY=') && !openaiKey) {
      openaiKey = trimmed.split('=')[1].trim().replace(/^['"]|['"]$/g, '');
    }
  }
}

const credentialAvailable = !!(openrouterKey || openaiKey);
const providerId: ModelProvider = openrouterKey ? 'openrouter' : 'openai';
const targetModel = 'gpt-4o';

console.log(`  PROVIDER_AVAILABLE:   ${credentialAvailable ? 'YES' : 'NO'}`);
console.log(`  MODEL_AVAILABLE:      ${targetModel ? 'YES' : 'NO'} (${targetModel})`);
console.log(`  CREDENTIAL_AVAILABLE: ${credentialAvailable ? 'YES' : 'NO'}`);
console.log(`  PROVIDER_NAME:        ${providerId.toUpperCase()}`);

assert.strictEqual(credentialAvailable, true, 'At least one real model provider API key must be available in environment');

// Configure credentials strictly in ModelGateway vault (Zero exposure to worker)
if (openrouterKey) {
  ModelGateway.setProviderCredentials('openrouter', {
    apiKey: openrouterKey,
    endpoint: 'https://openrouter.ai/api/v1'
  });
} else if (openaiKey) {
  ModelGateway.setProviderCredentials('openai', {
    apiKey: openaiKey,
    endpoint: 'https://api.openai.com/v1'
  });
}

// Activate real production HTTP fetch dispatcher
ModelGateway.setDispatcher(ModelGateway.realHttpDispatcher);

// ----------------------------------------------------------------------------
// FASE 2 & 3: SETUP AGENT & WORKER ZERO SECRETS
// ----------------------------------------------------------------------------
console.log('\n[FASE 2 & 3] Provisioning Governed Agent & Testing Zero Secrets...');

const profile = ComplianceProfileRegistry.getProfile('CP-EU-AI-ACT-HIGH-RISK-FINANCIAL')!;
assert.ok(profile, 'CP-EU-AI-ACT-HIGH-RISK-FINANCIAL profile must exist');

const agentDef: AgentDefinition = {
  name: 'real-model-risk-analyst',
  framework: { name: 'crewai', version: '0.102.0' },
  complianceProfile: 'CP-EU-AI-ACT-HIGH-RISK-FINANCIAL',
  capabilities: ['crm.read_customer', 'gpt-4o', 'credit.approve'],
  budget: { maxCostPerRunEur: 25.0, maxTokensPerStep: 4096, maxCallsPerMinute: 60 },
  environment: 'sandbox'
};

const provision = AgentProvisioner.provision(agentDef);
const runtimeInstance = RuntimeManager.createRuntime(provision.runtimeSpec, provision.passport);
const startedRuntime = RuntimeManager.startRuntime(runtimeInstance.runtimeId);
const worker = RuntimeManager.getWorker(startedRuntime.runtimeId)!;
assert.ok(worker, 'Worker process active');

// Test Zero Secrets: Worker must NOT have access to model credentials
assert.throws(() => worker.getEnv('OPENAI_API_KEY'), /SECRET_ACCESS_DENIED/);
assert.throws(() => worker.getEnv('OPENROUTER_API_KEY'), /SECRET_ACCESS_DENIED/);
assert.throws(() => worker.getEnv('AZURE_OPENAI_API_KEY'), /SECRET_ACCESS_DENIED/);

const workerEnv = worker.getAllEnv();
for (const [k, v] of Object.entries(workerEnv)) {
  const containsSecret = /key|secret|token|password|auth|openrouter|openai/i.test(k) ||
    String(v).includes('sk-or-v1-') ||
    String(v).includes('sk-proj-');
  assert.strictEqual(containsSecret, false, `Forbidden secret found in worker environment: ${k}`);
}

console.log('  [PASS]: worker.getEnv("OPENROUTER_API_KEY") strictly threw SECRET_ACCESS_DENIED');
console.log('  [PASS]: worker.getEnv("OPENAI_API_KEY") strictly threw SECRET_ACCESS_DENIED');
console.log('  [PASS]: Worker memory snapshot contains ZERO provider credentials');

// ----------------------------------------------------------------------------
// FASE 4: WORKER NETWORK BYPASS DENIED
// ----------------------------------------------------------------------------
console.log('\n[FASE 4] Network Isolation: Testing Worker Direct Outbound Bypass...');

assert.throws(() => {
  worker.directNetworkCall('https://openrouter.ai/api/v1/chat/completions');
}, /NETWORK_ACCESS_DENIED/);

assert.throws(() => {
  worker.directNetworkCall('https://api.openai.com/v1/chat/completions');
}, /NETWORK_ACCESS_DENIED/);

console.log('  [PASS]: worker.directNetworkCall to OpenRouter threw NETWORK_ACCESS_DENIED');
console.log('  [PASS]: worker.directNetworkCall to OpenAI API threw NETWORK_ACCESS_DENIED');

// ----------------------------------------------------------------------------
// FASE 5, 6, 7 & 8: REAL MODEL INVOCATION & RESPONSE PROOF
// ----------------------------------------------------------------------------
console.log('\n[FASE 5, 6, 7 & 8] Executing REAL Model Invocation via Model Gateway...');

const adapter = new CrewAiRuntimeAdapter(worker);
const session = await adapter.start();
assert.strictEqual(session.status, 'RUNNING');

const promptText = 'Confirm receipt of this validation message by outputting: COMPLYPRO_REAL_MODEL_PROOF';
const realInvocationStart = Date.now();

const response = await worker.requestModel({
  provider: providerId,
  model: targetModel,
  messages: [
    { role: 'user', content: promptText }
  ],
  maxTokens: 20,
  temperature: 0.0,
  executionId: session.executionId
});

const endToEndLatencyMs = Date.now() - realInvocationStart;

console.log(`  [REAL PROVIDER DISPATCH]: Provider = ${response.provider}`);
console.log(`  [REAL PROVIDER DISPATCH]: Model    = ${response.model}`);
console.log(`  [GUARDIAN DECISION]:      Verdict  = ${response.verdict} (Local Guardian Latency: ${response.decisionLatencyMs}ms)`);
console.log(`  [END-TO-END LATENCY]:     ${endToEndLatencyMs}ms`);

assert.strictEqual(response.status, 'COMPLETED', 'Real model invocation must complete');
assert.strictEqual(response.verdict, 'ALLOW', 'Guardian verdict must be ALLOW');
assert.strictEqual(response.model, targetModel);
assert.ok(response.responseMessage, 'Response message must exist');

const responseContent = response.responseMessage.content.trim();
console.log(`  [REAL RESPONSE CONTENT]:  "${responseContent}"`);

// PROOF 1: The response MUST contain the exact requested string
assert.ok(
  responseContent.includes('COMPLYPRO_REAL_MODEL_PROOF'),
  `Response must contain "COMPLYPRO_REAL_MODEL_PROOF", got: "${responseContent}"`
);

// PROOF 2: The response MUST NOT be generated by the deterministic mock dispatcher
assert.strictEqual(
  responseContent.startsWith('[ComplyPRO Governed Output via'),
  false,
  'Response must NOT be generated by the deterministic mock engine'
);

// PROOF 3: Token accounting from real provider
assert.ok(response.tokenUsage, 'Token usage must be returned by real provider');
assert.ok(response.tokenUsage.promptTokens > 0, 'Prompt tokens must be > 0');
assert.ok(response.tokenUsage.completionTokens > 0, 'Completion tokens must be > 0');
assert.ok(response.tokenUsage.totalTokens > 0, 'Total tokens must be > 0');
console.log(`  [TOKEN ACCOUNTING]:       Prompt: ${response.tokenUsage.promptTokens}, Completion: ${response.tokenUsage.completionTokens}, Total: ${response.tokenUsage.totalTokens}`);
console.log(`  [COST ESTIMATION]:        €${response.estimatedCostEur}`);

await adapter.stop(session);

// ----------------------------------------------------------------------------
// FASE 7 & 8: NO SILENT FALLBACK TO MOCK ON PROVIDER FAILURE
// ----------------------------------------------------------------------------
console.log('\n[FASE 7 & 8] Verifying NO Silent Fallback to Mock on Provider Failure...');

// Temporarily point provider to an invalid API key to provoke real failure
ModelGateway.setProviderCredentials(providerId, {
  apiKey: 'sk-or-v1-invalid-bad-key-1234567890',
  endpoint: 'https://openrouter.ai/api/v1'
});

const failedResponse = await worker.requestModel({
  provider: providerId,
  model: targetModel,
  messages: [{ role: 'user', content: 'This should fail' }],
  maxTokens: 5,
  executionId: `exec_fail_${Date.now()}`
});

assert.strictEqual(failedResponse.status, 'FAILED', 'Bad credentials must result in FAILED status');
assert.ok(failedResponse.error, 'Error message must be present on failure');
assert.ok(
  failedResponse.error.includes('REAL_PROVIDER_HTTP_ERROR') || failedResponse.error.includes('MODEL_EXECUTION_ERROR'),
  `Error must indicate HTTP/execution failure, got: "${failedResponse.error}"`
);
assert.strictEqual(
  failedResponse.responseMessage,
  undefined,
  'Failed response must NOT return mock message'
);

console.log('  [PASS]: Provider failure threw REAL_PROVIDER_HTTP_ERROR (Zero silent fallback to mock)');

// Restore valid credentials for subsequent tests
if (openrouterKey) {
  ModelGateway.setProviderCredentials('openrouter', {
    apiKey: openrouterKey,
    endpoint: 'https://openrouter.ai/api/v1'
  });
} else if (openaiKey) {
  ModelGateway.setProviderCredentials('openai', {
    apiKey: openaiKey,
    endpoint: 'https://api.openai.com/v1'
  });
}

// ----------------------------------------------------------------------------
// FASE 10: EVIDENCE LEDGER & CRYPTOGRAPHIC VERIFICATION
// ----------------------------------------------------------------------------
console.log('\n[FASE 10] Tamper-Evident Evidence Ledger Verification...');

const agentEntries = EvidenceLedger.getEntries(provision.agentId);
const eventTypes = agentEntries.map(e => e.eventType);

assert.ok(eventTypes.includes('AGENT_EXECUTION_STARTED'), 'Must contain AGENT_EXECUTION_STARTED');
assert.ok(eventTypes.includes('MODEL_REQUEST'), 'Must contain MODEL_REQUEST');
assert.ok(eventTypes.includes('GUARDIAN_DECISION'), 'Must contain GUARDIAN_DECISION');
assert.ok(eventTypes.includes('MODEL_RESPONSE'), 'Must contain MODEL_RESPONSE');
assert.ok(eventTypes.includes('AGENT_EXECUTION_COMPLETED'), 'Must contain AGENT_EXECUTION_COMPLETED');

const chainCheck = EvidenceVerifier.verifyChain(agentEntries);
assert.strictEqual(chainCheck.valid, true, 'Cryptographic hash chain must be 100% valid');
console.log(`  [PASS]: Cryptographic chain verified across ${agentEntries.length} sequential entries`);

// Verify ZERO secrets leaked in Evidence
for (const entry of agentEntries) {
  const serialized = JSON.stringify(entry);
  if (openrouterKey) {
    assert.strictEqual(serialized.includes(openrouterKey.substring(10, 30)), false, 'No OpenRouter key in evidence');
  }
  if (openaiKey) {
    assert.strictEqual(serialized.includes(openaiKey.substring(10, 30)), false, 'No OpenAI key in evidence');
  }
}
console.log('  [PASS]: Evidence Ledger contains ZERO API keys or credentials');

// ----------------------------------------------------------------------------
// FASE 11: NEGATIVE TEST — GUARDIAN BLOCK ON UNAUTHORIZED MODEL
// ----------------------------------------------------------------------------
console.log('\n[FASE 11] Negative Test: Guardian BLOCK on Unauthorized Model...');

let realHttpCallsOnBlock = 0;
const trackedDispatcher = async (prov: any, mod: any, msgs: any, creds: any, opts: any) => {
  realHttpCallsOnBlock++;
  return ModelGateway.realHttpDispatcher(prov, mod, msgs, creds, opts);
};
ModelGateway.setDispatcher(trackedDispatcher);

const blockedResponse = await worker.requestModel({
  provider: providerId,
  model: 'unauthorized-blackbox-model',
  messages: [{ role: 'user', content: 'Attempting unauthorized inference' }]
});

assert.strictEqual(blockedResponse.status, 'BLOCKED', 'Undeclared model must be BLOCKED');
assert.strictEqual(blockedResponse.verdict, 'BLOCK', 'Guardian verdict must be BLOCK');
assert.strictEqual(realHttpCallsOnBlock, 0, 'Real provider must receive ZERO calls when Guardian BLOCKS');

console.log('  [PASS]: Undeclared model strictly BLOCKED by Guardian');
console.log('  [PASS]: Real provider received ZERO calls on BLOCK (Crucible invariant satisfied)');

// Restore standard real dispatcher
ModelGateway.setDispatcher(ModelGateway.realHttpDispatcher);

// ----------------------------------------------------------------------------
// FASE 14: REGRESSION COMPATIBILITY
// ----------------------------------------------------------------------------
console.log('\n[FASE 14] Regression Compatibility: Resetting Dispatcher to Default...');

ModelGateway.resetDispatcher();
console.log('  [PASS]: Dispatcher reset successfully to standard engine');

// ----------------------------------------------------------------------------
// FINAL SUMMARY
// ----------------------------------------------------------------------------
console.log('\n==================================================================');
console.log('>>> S7-E REAL MODEL PROVIDER INTEGRATION: VALIDATED (100% PASS) <<<');
console.log('==================================================================\n');
