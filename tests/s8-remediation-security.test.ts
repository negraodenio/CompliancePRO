/**
 * ComplyPRO.pt — Surgical Security Remediation Verification Suite
 * 
 * Verifies all 5 forensic remediations:
 * FIX #1: Continuous Guardian Live Execution Wiring
 * FIX #2: Real Cryptographic Passport HMAC-SHA256 Signature
 * FIX #3: Tenant-Partitioned In-Memory Evidence Ledger
 * FIX #4: Atomic HITL Resumption + Revocation Checks
 * FIX #5: DataGateway Fail-Closed on Unknown Compliance Profile Checksum
 */

import assert from 'assert';
import crypto from 'crypto';
import { AgentProvisioner } from '../src/core/agent-provisioner';
import { RuntimeManager } from '../src/core/runtime-manager';
import { EvidenceLedger, EvidenceLedgerEntry } from '../src/core/evidence-ledger';
import { EvidenceVerifier } from '../src/core/evidence-verifier';
import { ComplianceProfileRegistry } from '../src/core/compliance-compiler';
import { CapabilityRegistry } from '../src/core/capability-registry';
import { ToolGateway, ToolExecutionProvider } from '../src/core/tool-gateway';
import { ModelGateway } from '../src/core/model-gateway';
import { DataGateway, DataProviderAdapter } from '../src/core/data-gateway';
import { ContinuousRiskDetector } from '../src/core/continuous-risk-detector';
import { ActiveGovernanceBus } from '../src/core/active-governance-bus';
import { PassportSigner } from '../src/core/passport-signer';
import { GuardianService } from '../src/core/guardian-service';
import { AgentPassport } from '../src/core/compliance-contract';
import { WorkerRunner } from '../src/core/sandbox/worker-runner';
import { DurableStore } from '../src/server/db/durable-store';

console.log('==================================================================');
console.log('>>> COMPLYPRO.PT — SURGICAL SECURITY REMEDIATION SUITE <<<');
console.log('==================================================================\n');

async function runRemediationSuite() {
  // Reset all stores
  AgentProvisioner.reset();
  RuntimeManager.reset();
  EvidenceLedger.reset();
  ToolGateway.clearCredentials();
  ModelGateway.clearCredentials();
  DataGateway.clearCredentials();
  ContinuousRiskDetector.reset();

  const profile = ComplianceProfileRegistry.getProfile('CP-EU-AI-ACT-HIGH-RISK-FINANCIAL')!;
  assert.ok(profile, 'Compliance Profile must exist');

  // Register baseline capabilities for testing
  CapabilityRegistry.register({
    id: 'remed.tool.standard',
    name: 'Standard Tool',
    description: 'A standard tool for testing',
    category: 'system',
    riskLevel: 'LOW',
    channel: 'TOOL',
    allowedActions: ['EXECUTE'],
    provider: 'remed-tool-provider'
  });

  CapabilityRegistry.register({
    id: 'remed.tool.hitl',
    name: 'High Risk HITL Tool',
    description: 'Requires human approval',
    category: 'financial',
    riskLevel: 'HIGH',
    channel: 'TOOL',
    allowedActions: ['EXECUTE'],
    hitl: { required: true, minimumRole: 'compliance_officer' },
    provider: 'remed-tool-provider'
  });

  CapabilityRegistry.register({
    id: 'remed.data.read',
    name: 'Remediation Data Query',
    description: 'Data read test',
    category: 'database',
    riskLevel: 'LOW',
    channel: 'DATA',
    allowedActions: ['READ'],
    provider: 'remed-data-provider'
  });

  // Track provider call counts
  let toolProviderCalls = 0;
  const mockToolProvider = {
    providerId: 'remed-tool-provider',
    name: 'Remediation Tool Provider',
    execute: async () => {
      toolProviderCalls++;
      return { success: true, count: toolProviderCalls };
    }
  };
  ToolGateway.registerProvider(mockToolProvider);

  let dataProviderCalls = 0;
  const mockDataProvider: DataProviderAdapter = {
    providerId: 'remed-data-provider',
    async query() {
      dataProviderCalls++;
      return [{ id: 1, test: 'ok' }];
    }
  };
  DataGateway.registerProvider(mockDataProvider);

  // Setup test agent
  const provision = AgentProvisioner.provision({
    name: 'remed-agent',
    framework: { name: 'crewai', version: '0.102.0' },
    complianceProfile: 'CP-EU-AI-ACT-HIGH-RISK-FINANCIAL',
    capabilities: ['remed.tool.standard', 'remed.tool.hitl', 'remed.data.read'],
    budget: { maxCostPerRunEur: 100.0, maxTokensPerStep: 4096, maxCallsPerMinute: 60 },
    environment: 'sandbox',
    tenantId: 'TENANT-REMED-ALPHA'
  });

  // Ensure model capability is also declared
  provision.passport.governedCapabilities = [
    ...(provision.passport.governedCapabilities || []),
    { capability: 'gpt-4o', channel: 'MODEL', riskTier: 'MEDIUM' }
  ];
  AgentProvisioner.signPassport(provision.passport, provision.agentId);

  const runtimeInstance = RuntimeManager.createRuntime(provision.runtimeSpec, provision.passport);
  const startedRuntime = RuntimeManager.startRuntime(runtimeInstance.runtimeId);
  const worker = RuntimeManager.getWorker(startedRuntime.runtimeId)!;
  assert.ok(worker, 'Worker process must be active');

  // ==========================================================================
  // FIX #1: CONTINUOUS GUARDIAN LIVE EXECUTION WIRING
  // ==========================================================================
  console.log('--- FIX #1: CONTINUOUS GUARDIAN LIVE EXECUTION WIRING ---');

  // Spy on evaluateActiveCapability
  let activeCapabilityCalls = 0;
  const originalEvaluateActive = GuardianService.evaluateActiveCapability.bind(GuardianService);
  GuardianService.evaluateActiveCapability = (req) => {
    activeCapabilityCalls++;
    return originalEvaluateActive(req);
  };

  // TEST A: ToolGateway -> live request -> evaluateActiveCapability reached -> ALLOW -> provider executes exactly once
  toolProviderCalls = 0;
  const initialActiveCalls = activeCapabilityCalls;
  const liveToolRes = await worker.requestTool('remed.tool.standard', 'EXECUTE');
  assert.strictEqual(liveToolRes.status, 'COMPLETED');
  assert.strictEqual(liveToolRes.verdict, 'ALLOW');
  assert.strictEqual(toolProviderCalls, 1, 'Provider must execute exactly once on ALLOW');
  assert.ok(activeCapabilityCalls > initialActiveCalls, 'evaluateActiveCapability MUST be reached from live ToolGateway');
  console.log('  [PASS TEST A]: Live ToolGateway reached evaluateActiveCapability -> ALLOW -> exactly 1 provider execution');

  // TEST B: ContinuousRiskDetector suspension -> live ToolGateway request -> BLOCK -> provider execution count = 0
  ContinuousRiskDetector.triggerSuspension('TENANT-REMED-ALPHA', provision.agentId, 'Simulated anomaly ceiling exceeded');
  assert.strictEqual(ContinuousRiskDetector.isAgentSuspended('TENANT-REMED-ALPHA', provision.agentId), true);

  const callsBeforeSuspensionTest = toolProviderCalls;
  const suspendedToolRes = await worker.requestTool('remed.tool.standard', 'EXECUTE');
  assert.strictEqual(suspendedToolRes.status, 'BLOCKED');
  assert.strictEqual(suspendedToolRes.verdict, 'BLOCK');
  assert.ok(suspendedToolRes.error && suspendedToolRes.error.includes('SUSPENDED'));
  assert.strictEqual(toolProviderCalls, callsBeforeSuspensionTest, 'Provider MUST NOT execute when dynamically suspended');
  console.log('  [PASS TEST B]: Dynamic suspension enforced on live ToolGateway -> BLOCK -> 0 provider executions');

  // Reinstate agent for subsequent tests
  ContinuousRiskDetector.reinstateAgent('TENANT-REMED-ALPHA', provision.agentId);
  assert.strictEqual(ContinuousRiskDetector.isAgentSuspended('TENANT-REMED-ALPHA', provision.agentId), false);

  // TEST C: ModelGateway -> active governance reached
  const activeBeforeModel = activeCapabilityCalls;
  ModelGateway.setProviderCredentials('openai', { apiKey: 'mock-key-for-remed' });
  const modelRes = await worker.requestModel({
    provider: 'openai',
    model: 'gpt-4o',
    messages: [{ role: 'user', content: 'test message' }]
  });
  assert.strictEqual(modelRes.status, 'COMPLETED');
  assert.strictEqual(modelRes.verdict, 'ALLOW');
  assert.ok(activeCapabilityCalls > activeBeforeModel, 'evaluateActiveCapability MUST be reached from live ModelGateway');
  console.log('  [PASS TEST C]: Live ModelGateway reached evaluateActiveCapability -> ALLOW');

  // TEST D: DataGateway -> active governance reached
  const activeBeforeData = activeCapabilityCalls;
  dataProviderCalls = 0;
  const dataRes = await worker.requestData('remed.data.read', 'READ', 'remed_records');
  assert.strictEqual(dataRes.status, 'COMPLETED');
  assert.strictEqual(dataRes.verdict, 'ALLOW');
  assert.strictEqual(dataProviderCalls, 1, 'Data provider executed exactly once on ALLOW');
  assert.ok(activeCapabilityCalls > activeBeforeData, 'evaluateActiveCapability MUST be reached from live DataGateway');
  console.log('  [PASS TEST D]: Live DataGateway reached evaluateActiveCapability -> ALLOW -> exactly 1 provider execution');

  // TEST E: REQUIRE_HITL -> PAUSED -> count = 0 -> APPROVE -> execution exactly once
  const callsBeforeHitl = toolProviderCalls;
  const hitlRes = await worker.requestTool('remed.tool.hitl', 'EXECUTE');
  assert.strictEqual(hitlRes.status, 'PAUSED');
  assert.strictEqual(hitlRes.verdict, 'REQUIRE_HITL');
  assert.strictEqual(toolProviderCalls, callsBeforeHitl, 'Provider must not execute while paused');

  const resumeRes = await ToolGateway.resumeExecution(hitlRes.executionId!, 'APPROVED', 'officer-alpha');
  assert.strictEqual(resumeRes.status, 'COMPLETED');
  assert.strictEqual(resumeRes.verdict, 'ALLOW');
  assert.strictEqual(toolProviderCalls, callsBeforeHitl + 1, 'Provider must execute exactly once on APPROVE');
  console.log('  [PASS TEST E]: REQUIRE_HITL -> PAUSED (count=0) -> APPROVE -> exactly 1 provider execution');

  // Restore evaluateActiveCapability
  GuardianService.evaluateActiveCapability = originalEvaluateActive;

  // ==========================================================================
  // FIX #2: REAL CRYPTOGRAPHIC PASSPORT HMAC-SHA256 SIGNATURE
  // ==========================================================================
  console.log('\n--- FIX #2: REAL CRYPTOGRAPHIC PASSPORT SIGNATURE ---');

  // 1. Valid Passport -> signature verified -> ALLOW
  const validCheck = GuardianService.evaluate({
    agent: { id: provision.agentId, name: provision.name },
    passport: provision.passport,
    complianceProfile: profile,
    toolName: 'remed.tool.standard',
    context: { tenantId: 'TENANT-REMED-ALPHA' }
  });
  if (validCheck.verdict !== 'ALLOW') console.log('VALID CHECK FAILED REASON:', validCheck.reason);
  assert.strictEqual(validCheck.verdict, 'ALLOW', 'Valid passport signature must be verified and ALLOWed');
  console.log('  [PASS 2.1]: Valid Passport signature verified -> ALLOW path continues');

  // 2. Modified agentId -> signature mismatch -> BLOCK
  const modifiedAgentCheck = GuardianService.evaluate({
    agent: { id: 'agt_malicious_override', name: provision.name },
    passport: provision.passport,
    complianceProfile: profile,
    toolName: 'remed.tool.standard',
    context: { tenantId: 'TENANT-REMED-ALPHA' }
  });
  assert.strictEqual(modifiedAgentCheck.verdict, 'BLOCK');
  assert.ok(modifiedAgentCheck.reason.includes('signature mismatch') || modifiedAgentCheck.reason.includes('verification failed'));
  console.log('  [PASS 2.2]: Modified agentId -> HMAC signature mismatch -> BLOCK');

  // 3. Modified tenantId -> signature mismatch -> BLOCK
  const modifiedTenantCheck = GuardianService.evaluate({
    agent: { id: provision.agentId, name: provision.name },
    passport: provision.passport,
    complianceProfile: profile,
    toolName: 'remed.tool.standard',
    context: { tenantId: 'TENANT-DIFFERENT-UNAUTHORIZED' }
  });
  assert.strictEqual(modifiedTenantCheck.verdict, 'BLOCK');
  console.log('  [PASS 2.3]: Modified tenantId -> HMAC signature mismatch / tenant mismatch -> BLOCK');

  // 4. Modified toolManifestHash -> BLOCK
  const tamperedManifestPassport: AgentPassport = {
    ...provision.passport,
    toolManifestHash: 'forged_tool_manifest_hash_00000000000000'
  };
  const tamperedManifestCheck = GuardianService.evaluate({
    agent: { id: provision.agentId, name: provision.name },
    passport: tamperedManifestPassport,
    complianceProfile: profile,
    toolName: 'remed.tool.standard',
    context: { tenantId: 'TENANT-REMED-ALPHA' }
  });
  assert.strictEqual(tamperedManifestCheck.verdict, 'BLOCK');
  assert.ok(tamperedManifestCheck.reason.includes('signature mismatch') || tamperedManifestCheck.reason.includes('verification failed'));
  console.log('  [PASS 2.4]: Modified toolManifestHash -> HMAC verification fails -> BLOCK');

  // 5. Modified complianceProfileChecksum -> BLOCK
  const tamperedChecksumPassport: AgentPassport = {
    ...provision.passport,
    complianceProfileChecksum: '1111222233334444555566667777888899990000111122223333444455556666'
  };
  const tamperedChecksumCheck = GuardianService.evaluate({
    agent: { id: provision.agentId, name: provision.name },
    passport: tamperedChecksumPassport,
    complianceProfile: profile,
    toolName: 'remed.tool.standard',
    context: { tenantId: 'TENANT-REMED-ALPHA' }
  });
  assert.strictEqual(tamperedChecksumCheck.verdict, 'BLOCK');
  console.log('  [PASS 2.5]: Modified complianceProfileChecksum -> BLOCK');

  // 6. Forged prefix: SIG-SHA256-ANYTHING123 -> BLOCK
  const forgedPassport: AgentPassport = {
    ...provision.passport,
    passportFingerprint: 'SIG-SHA256-ANYTHING1234567890ABCDEF'
  };
  const forgedCheck = GuardianService.evaluate({
    agent: { id: provision.agentId, name: provision.name },
    passport: forgedPassport,
    complianceProfile: profile,
    toolName: 'remed.tool.standard',
    context: { tenantId: 'TENANT-REMED-ALPHA' }
  });
  assert.strictEqual(forgedCheck.verdict, 'BLOCK');
  assert.ok(forgedCheck.reason.includes('signature mismatch') || forgedCheck.reason.includes('verification failed'));
  console.log('  [PASS 2.6]: Forged arbitrary SIG-SHA256-ANYTHING string strictly BLOCKED');

  // 7. Wrong HMAC secret -> BLOCK
  const foreignSecretSignature = PassportSigner.sign({
    passportId: provision.passport.passportId,
    agentId: provision.agentId,
    tenantId: provision.passport.tenantId,
    framework: provision.passport.runtime?.framework,
    frameworkVersion: provision.passport.runtime?.frameworkVersion,
    runtimeVersion: provision.passport.runtime?.runtimeVersion,
    toolManifestHash: provision.passport.toolManifestHash,
    complianceProfileChecksum: provision.passport.complianceProfileChecksum,
    policyVersion: profile.version,
    capabilities: provision.passport.governedCapabilities,
    riskTier: provision.passport.riskTier,
    status: provision.passport.status
  }, 'wrong_attacker_secret_key_123');

  const wrongSecretPassport: AgentPassport = {
    ...provision.passport,
    passportFingerprint: foreignSecretSignature
  };
  const wrongSecretCheck = GuardianService.evaluate({
    agent: { id: provision.agentId, name: provision.name },
    passport: wrongSecretPassport,
    complianceProfile: profile,
    toolName: 'remed.tool.standard',
    context: { tenantId: 'TENANT-REMED-ALPHA' }
  });
  assert.strictEqual(wrongSecretCheck.verdict, 'BLOCK');
  assert.ok(wrongSecretCheck.reason.includes('signature mismatch') || wrongSecretCheck.reason.includes('verification failed'));
  console.log('  [PASS 2.7]: Passport signed with wrong HMAC secret strictly BLOCKED');

  // 8. Formatting bypass rejection
  assert.strictEqual(PassportSigner.verify('', {} as any).valid, false);
  assert.strictEqual(PassportSigner.verify('SIG-SHA256-', {} as any).valid, false);
  assert.strictEqual(PassportSigner.verify('INVALID_FORMAT_STRING', {} as any).valid, false);
  console.log('  [PASS 2.8]: Cryptographic verification cannot be bypassed by formatting');

  // ==========================================================================
  // FIX #3: TENANT-PARTITIONED IN-MEMORY EVIDENCE
  // ==========================================================================
  console.log('\n--- FIX #3: TENANT-PARTITIONED IN-MEMORY EVIDENCE ---');

  EvidenceLedger.reset();

  const tenantA = 'TENANT-CORP-A';
  const tenantB = 'TENANT-CORP-B';

  // Interleave events:
  // Tenant A: event A1
  const evA1 = EvidenceLedger.append({
    evidenceId: 'ev_a1',
    timestamp: '2026-10-03T18:00:00Z',
    eventType: 'TOOL_REQUEST',
    agentId: 'agt_a',
    passportFingerprint: 'SIG-SHA256-AAAA',
    complianceProfileId: 'CP-EU-AI-ACT-HIGH-RISK-FINANCIAL',
    complianceProfileChecksum: profile.checksum,
    channel: 'TOOL',
    capability: 'tool_a1',
    action: 'EXECUTE'
  }, tenantA);

  // Tenant B: event B1
  const evB1 = EvidenceLedger.append({
    evidenceId: 'ev_b1',
    timestamp: '2026-10-03T18:00:01Z',
    eventType: 'TOOL_REQUEST',
    agentId: 'agt_b',
    passportFingerprint: 'SIG-SHA256-BBBB',
    complianceProfileId: 'CP-EU-AI-ACT-HIGH-RISK-FINANCIAL',
    complianceProfileChecksum: profile.checksum,
    channel: 'TOOL',
    capability: 'tool_b1',
    action: 'EXECUTE'
  }, tenantB);

  // Tenant A: event A2
  const evA2 = EvidenceLedger.append({
    evidenceId: 'ev_a2',
    timestamp: '2026-10-03T18:00:02Z',
    eventType: 'TOOL_RESPONSE',
    agentId: 'agt_a',
    passportFingerprint: 'SIG-SHA256-AAAA',
    complianceProfileId: 'CP-EU-AI-ACT-HIGH-RISK-FINANCIAL',
    complianceProfileChecksum: profile.checksum,
    channel: 'TOOL',
    capability: 'tool_a1',
    action: 'EXECUTE',
    verdict: 'ALLOW'
  }, tenantA);

  const chainA = EvidenceLedger.getChain(tenantA);
  const chainB = EvidenceLedger.getChain(tenantB);

  // Verify sequences
  assert.strictEqual(chainA.length, 2, 'Tenant A chain must have exactly 2 entries');
  assert.strictEqual(chainB.length, 1, 'Tenant B chain must have exactly 1 entry');

  // Verify Tenant A chain: A1 -> A2
  assert.strictEqual(chainA[0].evidenceId, 'ev_a1');
  assert.strictEqual(chainA[0].sequence, 1);
  assert.strictEqual(chainA[1].evidenceId, 'ev_a2');
  assert.strictEqual(chainA[1].sequence, 2);
  assert.strictEqual(chainA[1].previousHash, chainA[0].eventHash, 'A2 must chain to A1');

  // Verify Tenant B chain: B1 sequence 1, previousHash is genesis (not A1)
  assert.strictEqual(chainB[0].evidenceId, 'ev_b1');
  assert.strictEqual(chainB[0].sequence, 1);
  assert.strictEqual(chainB[0].previousHash, '0'.repeat(64), 'Tenant B genesis must not link to Tenant A');
  assert.notStrictEqual(chainB[0].previousHash, chainA[0].eventHash, 'Tenant B previousHash MUST NOT reference A1');

  // Verify Tenant A chain does NOT include B1
  assert.strictEqual(chainA.some(e => e.evidenceId === 'ev_b1'), false, 'Tenant A chain MUST NOT include B1');

  // Verify AuditPack isolation
  const auditPackA = EvidenceLedger.buildAuditPack(evA2.evidenceId, tenantA);
  const auditPackB = EvidenceLedger.buildAuditPack(evB1.evidenceId, tenantB);

  assert.strictEqual(auditPackA.correlatedChain.length, 2);
  assert.strictEqual(auditPackA.correlatedChain.every(e => (e as any).tenantId === tenantA || e.agentId === 'agt_a'), true);
  assert.strictEqual(auditPackB.correlatedChain.length, 1);
  assert.strictEqual(auditPackB.correlatedChain.every(e => (e as any).tenantId === tenantB || e.agentId === 'agt_b'), true);

  const verReportA = EvidenceVerifier.verifyAuditPack(auditPackA);
  const verReportB = EvidenceVerifier.verifyAuditPack(auditPackB);
  assert.strictEqual(verReportA.valid, true);
  assert.strictEqual(verReportB.valid, true);

  // Merkle roots independently verifiable
  const merkleRootA = auditPackA.merkleRoot;
  const merkleRootB = auditPackB.merkleRoot;
  assert.ok(merkleRootA.length === 64);
  assert.ok(merkleRootB.length === 64);
  assert.notStrictEqual(merkleRootA, merkleRootB, 'Merkle roots must be independent across tenants');

  const verifyA = EvidenceLedger.verifyChain(tenantA);
  const verifyB = EvidenceLedger.verifyChain(tenantB);
  assert.strictEqual(verifyA.valid, true, 'Tenant A chain must be cryptographically valid');
  assert.strictEqual(verifyB.valid, true, 'Tenant B chain must be cryptographically valid');
  console.log('  [PASS FIX #3]: Multi-tenant evidence strictly partitioned (Independent sequence, hashes & Merkle roots)');

  // ==========================================================================
  // FIX #4: ATOMIC HITL RESUME + REVOCATION CHECK
  // ==========================================================================
  console.log('\n--- FIX #4: ATOMIC HITL RESUME + REVOCATION CHECK ---');

  // 1. Setup a paused execution session
  toolProviderCalls = 0;
  const hitlTestInv = await ToolGateway.invokeTool({
    agentId: provision.agentId,
    runtimeId: startedRuntime.runtimeId,
    passportId: provision.passportId,
    executionId: `exec_hitl_atomic_${Date.now()}`,
    passport: provision.passport,
    capability: 'remed.tool.hitl',
    action: 'EXECUTE',
    tenantId: 'TENANT-REMED-ALPHA'
  });
  assert.strictEqual(hitlTestInv.status, 'PAUSED');
  assert.strictEqual(toolProviderCalls, 0);

  // 2. Sequential approval executes exactly once
  const firstSeqResume = await ToolGateway.resumeExecution(hitlTestInv.executionId!, 'APPROVED', 'officer-1');
  assert.strictEqual(firstSeqResume.status, 'COMPLETED');
  assert.strictEqual(toolProviderCalls, 1, 'Sequential approval must execute exactly once');
  console.log('  [PASS 4.1]: Sequential approval executes provider exactly once');

  // 3. Second approval on completed session -> strictly rejected with ILLEGAL_SESSION_STATE
  let secondApprovalFailed = false;
  try {
    await ToolGateway.resumeExecution(hitlTestInv.executionId!, 'APPROVED', 'officer-2');
  } catch (err: any) {
    secondApprovalFailed = true;
    assert.ok(err.message.includes('ILLEGAL_SESSION_STATE'));
  }
  assert.strictEqual(secondApprovalFailed, true, 'Second approval on finished session must be rejected with ILLEGAL_SESSION_STATE');
  assert.strictEqual(toolProviderCalls, 1, 'Provider call count must remain 1 after second approval rejection');
  console.log('  [PASS 4.3]: Second sequential approval rejected with ILLEGAL_SESSION_STATE');

  // 4. Concurrent approvals -> exactly ONE claims execution, other is rejected
  const concurrentInv = await ToolGateway.invokeTool({
    agentId: provision.agentId,
    runtimeId: startedRuntime.runtimeId,
    passportId: provision.passportId,
    executionId: `exec_hitl_concurrent_${Date.now()}`,
    passport: provision.passport,
    capability: 'remed.tool.hitl',
    action: 'EXECUTE',
    tenantId: 'TENANT-REMED-ALPHA'
  });
  assert.strictEqual(concurrentInv.status, 'PAUSED');

  const callsBeforeConcurrent = toolProviderCalls;
  const results = await Promise.allSettled([
    ToolGateway.resumeExecution(concurrentInv.executionId!, 'APPROVED', 'officer-concurrent-1'),
    ToolGateway.resumeExecution(concurrentInv.executionId!, 'APPROVED', 'officer-concurrent-2')
  ]);

  const fulfilled = results.filter(r => r.status === 'fulfilled');
  const rejected = results.filter(r => r.status === 'rejected');

  assert.strictEqual(fulfilled.length, 1, 'Exactly ONE concurrent approval must succeed');
  assert.strictEqual(rejected.length, 1, 'The other concurrent approval MUST be rejected');
  assert.strictEqual(toolProviderCalls, callsBeforeConcurrent + 1, 'Provider must execute exactly ONCE under concurrent resume attempts');
  console.log('  [PASS 4.2]: Two concurrent approvals: exactly 1 provider execution, second rejected atomically');

  // 5. Passport revoked while PAUSED -> approval does not execute
  const pausedRevokeInv = await ToolGateway.invokeTool({
    agentId: provision.agentId,
    runtimeId: startedRuntime.runtimeId,
    passportId: provision.passportId,
    executionId: `exec_hitl_revoke_${Date.now()}`,
    passport: provision.passport,
    capability: 'remed.tool.hitl',
    action: 'EXECUTE',
    tenantId: 'TENANT-REMED-ALPHA'
  });
  assert.strictEqual(pausedRevokeInv.status, 'PAUSED');

  // Revoke passport while paused
  (provision.passport as any).status = 'REVOKED';

  const callsBeforeRevokeResume = toolProviderCalls;
  const revokedResumeRes = await ToolGateway.resumeExecution(pausedRevokeInv.executionId!, 'APPROVED', 'officer-revoke-test');
  assert.strictEqual(revokedResumeRes.status, 'BLOCKED');
  assert.strictEqual(revokedResumeRes.verdict, 'BLOCK');
  assert.strictEqual(toolProviderCalls, callsBeforeRevokeResume, 'Provider MUST NOT execute if passport was revoked while paused');
  console.log('  [PASS 4.4]: Passport revoked while PAUSED -> approval aborted with BLOCK and 0 provider executions');

  // Restore passport status
  provision.passport.status = 'GOVERNED';

  // 6. Runtime revoked/suspended while PAUSED -> approval does not execute
  const pausedRuntimeRevokeInv = await ToolGateway.invokeTool({
    agentId: provision.agentId,
    runtimeId: startedRuntime.runtimeId,
    passportId: provision.passportId,
    executionId: `exec_hitl_rt_revoke_${Date.now()}`,
    passport: provision.passport,
    capability: 'remed.tool.hitl',
    action: 'EXECUTE',
    tenantId: 'TENANT-REMED-ALPHA'
  });
  assert.strictEqual(pausedRuntimeRevokeInv.status, 'PAUSED');

  // Trigger continuous risk detector dynamic suspension while paused
  ContinuousRiskDetector.triggerSuspension('TENANT-REMED-ALPHA', provision.agentId, 'Emergency suspension while task paused');

  const callsBeforeRtRevoke = toolProviderCalls;
  const rtRevokedResume = await ToolGateway.resumeExecution(pausedRuntimeRevokeInv.executionId!, 'APPROVED', 'officer-rt-revoke-test');
  assert.strictEqual(rtRevokedResume.status, 'BLOCKED');
  assert.strictEqual(rtRevokedResume.verdict, 'BLOCK');
  assert.strictEqual(toolProviderCalls, callsBeforeRtRevoke, 'Provider MUST NOT execute if runtime was suspended/revoked while paused');
  console.log('  [PASS 4.5]: Runtime suspended while PAUSED -> approval aborted with BLOCK and 0 provider executions');

  ContinuousRiskDetector.reinstateAgent('TENANT-REMED-ALPHA', provision.agentId);

  // ==========================================================================
  // FIX #5: DATAGATEWAY MUST FAIL CLOSED ON UNKNOWN PROFILE
  // ==========================================================================
  console.log('\n--- FIX #5: DATAGATEWAY MUST FAIL CLOSED ON UNKNOWN PROFILE ---');

  // 1. Valid registered profile -> normal execution
  dataProviderCalls = 0;
  const validDataRes = await DataGateway.invokeData({
    agentId: provision.agentId,
    passportId: provision.passportId,
    runtimeId: startedRuntime.runtimeId,
    executionId: 'exec_data_valid',
    passport: provision.passport,
    capability: 'remed.data.read',
    action: 'READ',
    targetResource: 'records',
    tenantId: 'TENANT-REMED-ALPHA'
  });
  assert.strictEqual(validDataRes.status, 'COMPLETED');
  assert.strictEqual(validDataRes.verdict, 'ALLOW');
  assert.strictEqual(dataProviderCalls, 1, 'Provider executed on valid profile');
  console.log('  [PASS 5.1]: Valid registered profile -> normal execution (1 call)');

  // 2. Unknown checksum -> BLOCK (Fail Closed)
  const unknownChecksumPassport: AgentPassport = {
    ...provision.passport,
    complianceProfileChecksum: 'unknown-unregistered-checksum-ffffffffffffffffffffffffffffffff'
  };
  AgentProvisioner.signPassport(unknownChecksumPassport, provision.agentId);

  const callsBeforeUnknown = dataProviderCalls;
  const unknownDataRes = await DataGateway.invokeData({
    agentId: provision.agentId,
    passportId: unknownChecksumPassport.passportId,
    runtimeId: startedRuntime.runtimeId,
    executionId: 'exec_data_unknown',
    passport: unknownChecksumPassport,
    capability: 'remed.data.read',
    action: 'READ',
    targetResource: 'records',
    tenantId: 'TENANT-REMED-ALPHA'
  });
  assert.strictEqual(unknownDataRes.status, 'FAILED');
  assert.strictEqual(unknownDataRes.verdict, 'BLOCK');
  assert.strictEqual(unknownDataRes.providerCallCount, 0);
  assert.strictEqual(dataProviderCalls, callsBeforeUnknown, 'Provider call count MUST be 0 on unknown checksum');
  assert.ok(unknownDataRes.error && unknownDataRes.error.includes('UNRESOLVED_COMPLIANCE_PROFILE'));
  console.log('  [PASS 5.2]: Unknown profile checksum -> status FAILED, verdict BLOCK, 0 provider calls');

  // 3. Malformed checksum -> BLOCK (Fail Closed)
  const malformedChecksumPassport: AgentPassport = {
    ...provision.passport,
    complianceProfileChecksum: 'MALFORMED-CHECKSUM-XYZ'
  };
  AgentProvisioner.signPassport(malformedChecksumPassport, provision.agentId);

  const callsBeforeMalformed = dataProviderCalls;
  const malformedDataRes = await DataGateway.invokeData({
    agentId: provision.agentId,
    passportId: malformedChecksumPassport.passportId,
    runtimeId: startedRuntime.runtimeId,
    executionId: 'exec_data_malformed',
    passport: malformedChecksumPassport,
    capability: 'remed.data.read',
    action: 'READ',
    targetResource: 'records',
    tenantId: 'TENANT-REMED-ALPHA'
  });
  assert.strictEqual(malformedDataRes.status, 'FAILED');
  assert.strictEqual(malformedDataRes.verdict, 'BLOCK');
  assert.strictEqual(malformedDataRes.providerCallCount, 0);
  assert.strictEqual(dataProviderCalls, callsBeforeMalformed, 'Provider call count MUST be 0 on malformed checksum');
  console.log('  [PASS 5.3]: Malformed checksum -> status FAILED, verdict BLOCK, 0 provider calls');

  // ==========================================================================
  // HARDENING FIX 1: REMOVE PRODUCTION DEFAULT PASSPORT SECRET
  // ==========================================================================
  console.log('\n--- HARDENING FIX 1: REMOVE PRODUCTION DEFAULT PASSPORT SECRET ---');

  const originalNodeEnv = process.env.NODE_ENV;
  const originalSecret = process.env.COMPLYPRO_PASSPORT_SECRET;
  const originalCodeguardSecret = process.env.CODEGUARD_PASSPORT_SECRET;
  const originalServerSecret = process.env.COMPLIANCE_SERVER_SECRET;

  try {
    // 1. Production + Secret Present -> Valid HMAC Operation
    process.env.NODE_ENV = 'production';
    process.env.COMPLYPRO_PASSPORT_SECRET = 'super_secret_production_entropy_key_2026_test';
    delete process.env.CODEGUARD_PASSPORT_SECRET;
    delete process.env.COMPLIANCE_SERVER_SECRET;

    const prodSigned = PassportSigner.sign({
      passportId: 'pass_prod_01',
      agentId: 'agt_prod_01',
      complianceProfileChecksum: profile.checksum
    });
    assert.ok(prodSigned.startsWith('SIG-SHA256-'));
    const verifyProd = PassportSigner.verify(prodSigned, {
      passportId: 'pass_prod_01',
      agentId: 'agt_prod_01',
      complianceProfileChecksum: profile.checksum
    });
    assert.strictEqual(verifyProd.valid, true);
    console.log('  [PASS H1.1]: Production + secret present -> valid HMAC operation');

    // 2. Production + Secret Missing -> Fail Closed
    delete process.env.COMPLYPRO_PASSPORT_SECRET;
    let prodSecretThrew = false;
    try {
      PassportSigner.getSecret();
    } catch (e: any) {
      prodSecretThrew = true;
      assert.ok(e.message.includes('PRODUCTION_CONFIGURATION_ERROR'));
    }
    assert.strictEqual(prodSecretThrew, true, 'getSecret MUST throw in production without secret');

    let prodStartupThrew = false;
    try {
      PassportSigner.validateProductionConfig();
    } catch (e: any) {
      prodStartupThrew = true;
      assert.ok(e.message.includes('FATAL_CONFIG_ERROR'));
    }
    assert.strictEqual(prodStartupThrew, true, 'validateProductionConfig MUST throw in production without secret');

    const verifyProdMissing = PassportSigner.verify(prodSigned, {
      passportId: 'pass_prod_01',
      agentId: 'agt_prod_01',
      complianceProfileChecksum: profile.checksum
    });
    assert.strictEqual(verifyProdMissing.valid, false, 'verify MUST fail closed in production without secret');
    console.log('  [PASS H1.2]: Production + secret missing -> fail closed (Throws / Invalid)');

    // 3. Development/Test + Fallback behavior remains only if required by tests
    process.env.NODE_ENV = 'test';
    delete process.env.COMPLYPRO_PASSPORT_SECRET;
    const testSecret = PassportSigner.getSecret();
    assert.strictEqual(testSecret, 'complypro_server_passport_hmac_key_2026');
    console.log('  [PASS H1.3]: Development/test + fallback behavior preserved for test suite');

    // 4. Worker Sanitized Environment does NOT contain the secret
    const sanitizedEnv = WorkerRunner.createSanitizedEnvironment({
      agentId: 'agt_worker_sec_test',
      runtimeInstanceId: 'rt_sec_test',
      executionSessionId: 'exec_sec_test',
      sandboxId: 'sbx_sec_test'
    }, '/tmp/sandbox');
    assert.strictEqual((sanitizedEnv as any).COMPLYPRO_PASSPORT_SECRET, undefined);
    assert.strictEqual((sanitizedEnv as any).CODEGUARD_PASSPORT_SECRET, undefined);
    assert.strictEqual((sanitizedEnv as any).COMPLIANCE_SERVER_SECRET, undefined);
    console.log('  [PASS H1.4]: Worker sanitized environment does NOT contain the passport secret');
  } finally {
    process.env.NODE_ENV = originalNodeEnv;
    if (originalSecret !== undefined) process.env.COMPLYPRO_PASSPORT_SECRET = originalSecret;
    else delete process.env.COMPLYPRO_PASSPORT_SECRET;
    if (originalCodeguardSecret !== undefined) process.env.CODEGUARD_PASSPORT_SECRET = originalCodeguardSecret;
    else delete process.env.CODEGUARD_PASSPORT_SECRET;
    if (originalServerSecret !== undefined) process.env.COMPLIANCE_SERVER_SECRET = originalServerSecret;
    else delete process.env.COMPLIANCE_SERVER_SECRET;
  }

  // ==========================================================================
  // HARDENING FIX 2: DISTRIBUTED / MULTI-INSTANCE HITL CONDITIONAL CLAIM
  // ==========================================================================
  console.log('\n--- HARDENING FIX 2: DISTRIBUTED / MULTI-INSTANCE HITL CLAIM ---');

  const distSessionId = `exec_dist_${Date.now()}`;
  await DurableStore.saveExecutionSessionAsync({
    executionId: distSessionId,
    agentId: provision.agentId,
    runtimeId: startedRuntime.runtimeId,
    passportId: provision.passport.passportId,
    status: 'PAUSED',
    toolExecutionCount: 0,
    gateId: 'GATE-DIST-01',
    pendingCapability: 'remed.tool.hitl',
    pendingContext: { action: 'EXECUTE' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tenantId: 'TENANT-REMED-ALPHA'
  }, 'TENANT-REMED-ALPHA');

  // Instance 1 claims:
  const firstClaim = await DurableStore.claimExecutionSessionConditional(distSessionId, 'TENANT-REMED-ALPHA');
  assert.strictEqual(firstClaim.success, true);
  assert.strictEqual(firstClaim.affectedRows, 1);
  console.log('  [PASS H2.1]: First instance claim succeeds with affectedRows = 1');

  // Instance 2 attempts concurrent claim on same executionId:
  const secondClaim = await DurableStore.claimExecutionSessionConditional(distSessionId, 'TENANT-REMED-ALPHA');
  assert.strictEqual(secondClaim.success, false);
  assert.strictEqual(secondClaim.affectedRows, 0);
  console.log('  [PASS H2.2]: Second instance claim rejected with affectedRows = 0');

  // ==========================================================================
  // HARDENING FIX 3: SEAL ALL SECURITY-RELEVANT PASSPORT AUTHORIZATION FIELDS
  // ==========================================================================
  console.log('\n--- HARDENING FIX 3: SEAL ALL SECURITY-RELEVANT AUTHORIZATION FIELDS ---');

  // 1. Mutate declaredTools -> signature mismatch -> BLOCK
  const tamperedToolsPassport: AgentPassport = {
    ...provision.passport,
    declaredTools: ['*']
  };
  const tamperedToolsCheck = GuardianService.evaluate({
    agent: { id: provision.agentId, name: provision.name },
    passport: tamperedToolsPassport,
    complianceProfile: profile,
    toolName: 'remed.tool.standard',
    context: { tenantId: 'TENANT-REMED-ALPHA' }
  });
  assert.strictEqual(tamperedToolsCheck.verdict, 'BLOCK');
  assert.ok(tamperedToolsCheck.reason.includes('signature mismatch') || tamperedToolsCheck.reason.includes('verification failed'));
  console.log('  [PASS H3.1]: Mutate declaredTools -> signature mismatch -> BLOCK');

  // 2. Mutate declaredModels -> signature mismatch -> BLOCK
  const tamperedModelsPassport: AgentPassport = {
    ...provision.passport,
    declaredModels: ['unauthorized-gpt-5']
  };
  const tamperedModelsCheck = GuardianService.evaluate({
    agent: { id: provision.agentId, name: provision.name },
    passport: tamperedModelsPassport,
    complianceProfile: profile,
    toolName: 'remed.tool.standard',
    context: { tenantId: 'TENANT-REMED-ALPHA' }
  });
  assert.strictEqual(tamperedModelsCheck.verdict, 'BLOCK');
  assert.ok(tamperedModelsCheck.reason.includes('signature mismatch') || tamperedModelsCheck.reason.includes('verification failed'));
  console.log('  [PASS H3.2]: Mutate declaredModels -> signature mismatch -> BLOCK');

  // 3. Mutate declaredDataScopes -> signature mismatch -> BLOCK
  const tamperedDataScopesPassport: AgentPassport = {
    ...provision.passport,
    declaredDataScopes: ['db.unauthorized_pii_table']
  };
  const tamperedDataScopesCheck = GuardianService.evaluate({
    agent: { id: provision.agentId, name: provision.name },
    passport: tamperedDataScopesPassport,
    complianceProfile: profile,
    toolName: 'remed.tool.standard',
    context: { tenantId: 'TENANT-REMED-ALPHA' }
  });
  assert.strictEqual(tamperedDataScopesCheck.verdict, 'BLOCK');
  assert.ok(tamperedDataScopesCheck.reason.includes('signature mismatch') || tamperedDataScopesCheck.reason.includes('verification failed'));
  console.log('  [PASS H3.3]: Mutate declaredDataScopes -> signature mismatch -> BLOCK');

  // 4. Mutate governedCapabilities -> signature mismatch -> BLOCK
  const tamperedGovCapsPassport: AgentPassport = {
    ...provision.passport,
    governedCapabilities: [
      ...(provision.passport.governedCapabilities || []),
      { capability: 'unauthorized.admin.wipe', channel: 'TOOL', riskTier: 'CRITICAL', requiresHitl: false }
    ]
  };
  const tamperedGovCapsCheck = GuardianService.evaluate({
    agent: { id: provision.agentId, name: provision.name },
    passport: tamperedGovCapsPassport,
    complianceProfile: profile,
    toolName: 'remed.tool.standard',
    context: { tenantId: 'TENANT-REMED-ALPHA' }
  });
  assert.strictEqual(tamperedGovCapsCheck.verdict, 'BLOCK');
  assert.ok(tamperedGovCapsCheck.reason.includes('signature mismatch') || tamperedGovCapsCheck.reason.includes('verification failed'));
  console.log('  [PASS H3.4]: Mutate governedCapabilities -> signature mismatch -> BLOCK');

  // 5. Mutate riskTier -> signature mismatch -> BLOCK
  const tamperedRiskPassport: AgentPassport = {
    ...provision.passport,
    riskTier: 'LOW'
  };
  const tamperedRiskCheck = GuardianService.evaluate({
    agent: { id: provision.agentId, name: provision.name },
    passport: tamperedRiskPassport,
    complianceProfile: profile,
    toolName: 'remed.tool.standard',
    context: { tenantId: 'TENANT-REMED-ALPHA' }
  });
  assert.strictEqual(tamperedRiskCheck.verdict, 'BLOCK');
  assert.ok(tamperedRiskCheck.reason.includes('signature mismatch') || tamperedRiskCheck.reason.includes('verification failed'));
  console.log('  [PASS H3.5]: Mutate riskTier -> signature mismatch -> BLOCK');

  // 6. Mutate requiresHitl on capability -> signature mismatch -> BLOCK
  const tamperedHitlPassport: AgentPassport = {
    ...provision.passport,
    governedCapabilities: (provision.passport.governedCapabilities || []).map(c => ({
      ...c,
      requiresHitl: false
    }))
  };
  const tamperedHitlCheck = GuardianService.evaluate({
    agent: { id: provision.agentId, name: provision.name },
    passport: tamperedHitlPassport,
    complianceProfile: profile,
    toolName: 'remed.tool.standard',
    context: { tenantId: 'TENANT-REMED-ALPHA' }
  });
  assert.strictEqual(tamperedHitlCheck.verdict, 'BLOCK');
  assert.ok(tamperedHitlCheck.reason.includes('signature mismatch') || tamperedHitlCheck.reason.includes('verification failed'));
  console.log('  [PASS H3.6]: Mutate requiresHitl -> signature mismatch -> BLOCK');

  // 7. Mutate tenantId -> signature mismatch -> BLOCK
  const tamperedTenantPassport: AgentPassport = {
    ...provision.passport,
    tenantId: 'TENANT-EVIL-INTRUDER'
  };
  const tamperedTenantCheck = GuardianService.evaluate({
    agent: { id: provision.agentId, name: provision.name },
    passport: tamperedTenantPassport,
    complianceProfile: profile,
    toolName: 'remed.tool.standard',
    context: { tenantId: 'TENANT-EVIL-INTRUDER' }
  });
  assert.strictEqual(tamperedTenantCheck.verdict, 'BLOCK');
  assert.ok(tamperedTenantCheck.reason.includes('signature mismatch') || tamperedTenantCheck.reason.includes('verification failed'));
  console.log('  [PASS H3.7]: Mutate tenantId -> signature mismatch -> BLOCK');

  console.log('\n==================================================================');
  console.log('>>> ALL SURGICAL SECURITY REMEDIATION TESTS PASSED (100%) <<<');
  console.log('==================================================================\n');
}

runRemediationSuite().catch(err => {
  console.error('\n❌ REMEDIATION TEST FAILED:', err);
  process.exit(1);
});
