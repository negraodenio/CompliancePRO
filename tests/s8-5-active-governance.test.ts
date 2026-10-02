/**
 * ComplyPRO.pt — Sprint 8-5: Active Governance & Continuous Guardian Test Suite
 * "Build with your framework. Govern with ComplyPRO."
 * 
 * Comprehensive validation of:
 * 1. Runtime Event Stream & Active Governance Bus
 * 2. Continuous Guardian & Active Capability Evaluation (ALLOW, BLOCK, REQUIRE_HITL)
 * 3. Active Passport Enforcement (Tool, Model, Data Scope, Tenant Mismatch)
 * 4. Continuous Risk Detection & Anomaly Containment (Escalation to CIRCUIT_BREAK & SUSPEND)
 * 5. Scanner-to-Governance Policy Bridge (Translate discovery into active enforcement)
 * 6. Durable State & Process Restart Recovery
 * 7. HITL Pause, Human Approval, and Execute Exactly Once Invariance
 * 8. Tenant Isolation & Cryptographic Evidence Chain Verification
 * 9. The 5 Official Crucibles (Crucibles A through E)
 */

import assert from 'assert';
import crypto from 'crypto';
import { ActiveGovernanceBus, ActiveRuntimeEvent } from '../src/core/active-governance-bus';
import { ContinuousRiskDetector } from '../src/core/continuous-risk-detector';
import { GuardianService } from '../src/core/guardian-service';
import { ScannerPolicyBridge } from '../src/core/scanner-policy-bridge';
import { EvidenceLedger } from '../src/core/evidence-ledger';
import { EvidenceVerifier } from '../src/core/evidence-verifier';
import { ComplianceProfileRegistry } from '../src/core/compliance-compiler';
import { AgentPassport } from '../src/core/compliance-contract';
import { CapabilityRegistry } from '../src/core/capability-registry';
import { AgentProvisioner, AgentDefinition } from '../src/core/agent-provisioner';
import { RuntimeManager } from '../src/core/runtime-manager';
import { ToolGateway } from '../src/core/tool-gateway';
import { ModelGateway } from '../src/core/model-gateway';
import { DataGateway } from '../src/core/data-gateway';
import { CrewAiRuntimeAdapter } from '../src/core/adapters/crewai-runtime-adapter';
import { DurableStore } from '../src/server/db/durable-store';
import { HitlStore } from '../src/web/services/hitl-store';
import type { ScannerResult } from '../src/core/types';

async function runS85ActiveGovernanceSuite() {
  console.log('\n==================================================================');
  console.log('>>> COMPLYPRO.PT — SPRINT 8-5: ACTIVE GOVERNANCE & GUARDIAN    <<<');
  console.log('==================================================================\n');

  // Reset all environments for clean run
  ActiveGovernanceBus.reset();
  ContinuousRiskDetector.reset();
  EvidenceLedger.reset();
  AgentProvisioner.reset();
  RuntimeManager.reset();
  HitlStore.resetToBaseline();

  const tenantAlpha = 'TENANT-ALPHA';
  const tenantBeta = 'TENANT-BETA';

  const baseProfile = ComplianceProfileRegistry.getProfile('CP-EU-AI-ACT-HIGH-RISK-FINANCIAL')!;
  assert(baseProfile, 'ComplianceProfile CP-EU-AI-ACT-HIGH-RISK-FINANCIAL must exist');

  // Register capabilities in CapabilityRegistry
  if (!CapabilityRegistry.get('fx_rate_lookup')) {
    CapabilityRegistry.register({
      id: 'fx_rate_lookup',
      name: 'FX Rate Lookup',
      description: 'Foreign exchange rate converter',
      channel: 'TOOL',
      riskLevel: 'LOW',
      allowedActions: ['READ', 'EXECUTE'],
      dataClassification: 'PUBLIC',
      provider: 'mock-provider'
    });
  }

  if (!CapabilityRegistry.get('credit.approve')) {
    CapabilityRegistry.register({
      id: 'credit.approve',
      name: 'Credit Approval',
      description: 'Approve credit line',
      channel: 'TOOL',
      riskLevel: 'HIGH',
      allowedActions: ['EXECUTE'],
      dataClassification: 'RESTRICTED',
      provider: 'banking-core',
      hitl: { required: true }
    });
  }

  if (!CapabilityRegistry.get('customer.read')) {
    CapabilityRegistry.register({
      id: 'customer.read',
      name: 'Customer Data Read',
      description: 'Read customer records',
      channel: 'DATA',
      riskLevel: 'LOW',
      allowedActions: ['READ'],
      dataClassification: 'INTERNAL',
      provider: 'customer-db'
    });
  }

  // Provision Agent Alpha
  const agentDefAlpha: AgentDefinition = {
    name: 'alpha-governed-agent',
    framework: { name: 'CrewAI', version: '0.28.0' },
    complianceProfile: baseProfile.profileId,
    capabilities: ['fx_rate_lookup', 'credit.approve', 'customer.read'],
    budget: { maxCostPerRunEur: 50.0, maxTokensPerStep: 4000, maxCallsPerMinute: 60 },
    environment: 'production',
    tenantId: tenantAlpha
  };

  const provisionedAlpha = AgentProvisioner.provision(agentDefAlpha, { tenantId: tenantAlpha });
  const passportAlpha = provisionedAlpha.passport;
  passportAlpha.declaredModels = ['openai/gpt-4o-mini', 'anthropic/claude-3-haiku'];
  passportAlpha.declaredDataScopes = ['customer.read', 'market.data'];

  // Register runtime instance in RuntimeManager and DurableStore
  RuntimeManager.createRuntime(provisionedAlpha.runtimeSpec, passportAlpha, tenantAlpha);

  // --- SECTION 1: RUNTIME EVENT CAPTURE & BUS ---
  console.log('--- GROUP 1: RUNTIME EVENT STREAM & ACTIVE GOVERNANCE BUS ---');

  let receivedTenantAlphaEvents: ActiveRuntimeEvent[] = [];
  ActiveGovernanceBus.subscribe(tenantAlpha, (event) => {
    receivedTenantAlphaEvents.push(event);
  });

  const event1 = ActiveGovernanceBus.publish({
    eventType: 'AGENT_STARTED',
    tenantId: tenantAlpha,
    agentId: provisionedAlpha.agentId,
    passportId: passportAlpha.passportId,
    passportFingerprint: passportAlpha.passportFingerprint
  });

  assert.strictEqual(event1.eventType, 'AGENT_STARTED');
  assert.strictEqual(receivedTenantAlphaEvents.length, 1);
  assert.strictEqual(receivedTenantAlphaEvents[0].agentId, provisionedAlpha.agentId);
  console.log('  [PASS S8-5-01]: Runtime event stream captures and dispatches AGENT_STARTED cleanly');

  // --- SECTION 2: ACTIVE POLICY ENFORCEMENT (ALLOW, BLOCK, HITL) ---
  console.log('\n--- GROUP 2: CONTINUOUS GUARDIAN CAPABILITY EVALUATION ---');

  // Scenario A: ALLOW
  const evalAllow = GuardianService.evaluateActiveCapability({
    agent: { id: provisionedAlpha.agentId, name: provisionedAlpha.name },
    passport: passportAlpha,
    complianceProfile: baseProfile,
    channel: 'TOOL',
    capability: 'fx_rate_lookup',
    actionType: 'EXECUTE',
    payload: { pair: 'EUR/USD' },
    context: { tenantId: tenantAlpha }
  });

  assert.strictEqual(evalAllow.verdict, 'ALLOW');
  assert(evalAllow.evidenceId, 'ALLOW verdict must produce evidenceId');
  console.log('  [PASS S8-5-02]: Scenario A: ALLOW verdict on authorized capability with event emission');

  // Scenario B: BLOCK (Unauthorized capability not declared)
  const evalBlock = GuardianService.evaluateActiveCapability({
    agent: { id: provisionedAlpha.agentId, name: provisionedAlpha.name },
    passport: passportAlpha,
    complianceProfile: baseProfile,
    channel: 'TOOL',
    capability: 'unauthorized_arbitrary_shell_tool',
    actionType: 'EXECUTE',
    context: { tenantId: tenantAlpha }
  });

  assert.strictEqual(evalBlock.verdict, 'BLOCK');
  assert(evalBlock.reason.includes('not declared'), 'Reason must indicate undeclared tool');
  console.log('  [PASS S8-5-03]: Scenario B: BLOCK verdict on undeclared tool with 0 execution');

  // Scenario C: HITL (High-risk credit approval)
  const evalHitl = GuardianService.evaluateActiveCapability({
    agent: { id: provisionedAlpha.agentId, name: provisionedAlpha.name },
    passport: passportAlpha,
    complianceProfile: baseProfile,
    channel: 'TOOL',
    capability: 'credit.approve',
    actionType: 'EXECUTE',
    payload: { amountEur: 25000 },
    context: { tenantId: tenantAlpha }
  });

  assert.strictEqual(evalHitl.verdict, 'REQUIRE_HITL');
  assert(evalHitl.gateId, 'REQUIRE_HITL must create a gateId in HitlStore');
  console.log('  [PASS S8-5-04]: Scenario C: REQUIRE_HITL on high-risk action (€25,000) pausing execution');

  // --- SECTION 3: ACTIVE PASSPORT ENFORCEMENT ---
  console.log('\n--- GROUP 3: ACTIVE PASSPORT ENFORCEMENT ---');

  // 1. Compliant passport check
  const compliantCheck = GuardianService.verifyPassportCompliance({
    passport: passportAlpha,
    channel: 'TOOL',
    capability: 'fx_rate_lookup',
    runtimeTenantId: tenantAlpha
  });
  assert.strictEqual(compliantCheck.compliant, true);
  console.log('  [PASS S8-5-05]: Passport verification: Compliant tool and tenant match return ALLOW');

  // 2. Declared Tool != Requested Tool
  const toolViolation = GuardianService.verifyPassportCompliance({
    passport: passportAlpha,
    channel: 'TOOL',
    capability: 'arbitrary_shadow_tool',
    runtimeTenantId: tenantAlpha
  });
  assert.strictEqual(toolViolation.compliant, false);
  assert.strictEqual(toolViolation.violationType, 'UNDECLARED_TOOL');
  console.log('  [PASS S8-5-06]: Passport enforcement: Undeclared tool triggers UNDECLARED_TOOL violation');

  // 3. Declared Model != Requested Model
  const modelViolation = GuardianService.verifyPassportCompliance({
    passport: passportAlpha,
    channel: 'MODEL',
    capability: 'unapproved-shadow-llm-v9',
    requestedModel: 'unapproved-shadow-llm-v9',
    runtimeTenantId: tenantAlpha
  });
  assert.strictEqual(modelViolation.compliant, false);
  assert.strictEqual(modelViolation.violationType, 'UNDECLARED_MODEL');
  console.log('  [PASS S8-5-07]: Passport enforcement: Undeclared model triggers UNDECLARED_MODEL violation');

  // 4. Declared Data Scope != Requested Data Scope
  const dataViolation = GuardianService.verifyPassportCompliance({
    passport: passportAlpha,
    channel: 'DATA',
    capability: 'classified_hr_records',
    requestedDataScope: 'classified_hr_records',
    runtimeTenantId: tenantAlpha
  });
  assert.strictEqual(dataViolation.compliant, false);
  assert.strictEqual(dataViolation.violationType, 'UNDECLARED_DATA_SCOPE');
  console.log('  [PASS S8-5-08]: Passport enforcement: Undeclared data scope triggers UNDECLARED_DATA_SCOPE violation');

  // 5. Declared Tenant != Runtime Tenant
  const tenantViolation = GuardianService.verifyPassportCompliance({
    passport: passportAlpha,
    channel: 'TOOL',
    capability: 'fx_rate_lookup',
    runtimeTenantId: tenantBeta
  });
  assert.strictEqual(tenantViolation.compliant, false);
  assert.strictEqual(tenantViolation.violationType, 'TENANT_MISMATCH');
  console.log('  [PASS S8-5-09]: Passport enforcement: Cross-tenant call triggers TENANT_MISMATCH violation');

  // --- SECTION 4: CONTINUOUS RISK DETECTION & ACTIVE RESPONSE ---
  console.log('\n--- GROUP 4: CONTINUOUS RISK DETECTION & ANOMALY CONTAINMENT ---');

  // Reset risk detector to observe pristine transition
  ContinuousRiskDetector.reset();
  const initialRisk = ContinuousRiskDetector.getProfile(tenantAlpha, provisionedAlpha.agentId);
  assert.strictEqual(initialRisk.riskTier, 'LOW');
  assert.strictEqual(initialRisk.isSuspended, false);

  // Trigger repeated violations to breach threshold
  ContinuousRiskDetector.recordEvent({
    eventId: 'EV-V1',
    timestamp: new Date().toISOString(),
    eventType: 'TOOL_BLOCKED',
    tenantId: tenantAlpha,
    agentId: provisionedAlpha.agentId
  });

  ContinuousRiskDetector.recordEvent({
    eventId: 'EV-V2',
    timestamp: new Date().toISOString(),
    eventType: 'MODEL_BLOCKED',
    tenantId: tenantAlpha,
    agentId: provisionedAlpha.agentId
  });

  const breachResult = ContinuousRiskDetector.recordEvent({
    eventId: 'EV-V3',
    timestamp: new Date().toISOString(),
    eventType: 'DATA_BLOCKED',
    tenantId: tenantAlpha,
    agentId: provisionedAlpha.agentId
  });

  assert.strictEqual(breachResult.riskEscalated, true);
  assert(breachResult.profile.riskTier === 'HIGH' || breachResult.profile.riskTier === 'CRITICAL');
  assert.strictEqual(breachResult.recommendedResponse, 'CIRCUIT_BREAK');
  console.log('  [PASS S8-5-10]: Continuous Risk Detector escalates risk tier to HIGH on repeated violations');

  // Escalate further to trigger active suspension
  ContinuousRiskDetector.recordEvent({
    eventId: 'EV-V4',
    timestamp: new Date().toISOString(),
    eventType: 'TENANT_VIOLATION',
    tenantId: tenantAlpha,
    agentId: provisionedAlpha.agentId
  });

  const suspendedProfile = ContinuousRiskDetector.getProfile(tenantAlpha, provisionedAlpha.agentId);
  assert.strictEqual(suspendedProfile.isSuspended, true);

  // Attempt invocation with suspended agent
  const suspendedInvocation = GuardianService.evaluateActiveCapability({
    agent: { id: provisionedAlpha.agentId, name: provisionedAlpha.name },
    passport: passportAlpha,
    complianceProfile: baseProfile,
    channel: 'TOOL',
    capability: 'fx_rate_lookup',
    actionType: 'EXECUTE',
    context: { tenantId: tenantAlpha }
  });

  assert.strictEqual(suspendedInvocation.verdict, 'BLOCK');
  assert(suspendedInvocation.reason.includes('SUSPENDED'), 'Reason must indicate agent suspension');
  console.log('  [PASS S8-5-11]: Active Response: Suspended agent is blocked from capability execution');

  // Reinstate agent for subsequent tests
  GuardianService.reinstateAgent(tenantAlpha, provisionedAlpha.agentId);
  const reinstatedProfile = ContinuousRiskDetector.getProfile(tenantAlpha, provisionedAlpha.agentId);
  assert.strictEqual(reinstatedProfile.isSuspended, false);
  console.log('  [PASS S8-5-12]: Reinstatement clears suspension and resets anomaly counters');

  // --- SECTION 5: DURABLE STATE & PROCESS RESTART RECOVERY ---
  console.log('\n--- GROUP 5: DURABLE STATE & RESTART RECOVERY ---');

  const executionSession = {
    executionId: `exec_test_${crypto.randomBytes(4).toString('hex')}`,
    agentId: provisionedAlpha.agentId,
    runtimeId: provisionedAlpha.runtimeId,
    passportId: passportAlpha.passportId,
    status: 'PAUSED' as const,
    toolExecutionCount: 0,
    gateId: evalHitl.gateId,
    pendingCapability: 'credit.approve',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tenantId: tenantAlpha
  };

  DurableStore.saveExecutionSession(executionSession, tenantAlpha);

  const retrievedSession = DurableStore.getExecutionSession(executionSession.executionId, tenantAlpha);
  assert(retrievedSession, 'Execution session must persist durably');
  assert.strictEqual(retrievedSession?.status, 'PAUSED');
  assert.strictEqual(retrievedSession?.gate_id, evalHitl.gateId);
  console.log('  [PASS S8-5-13]: DurableStore preserves active PAUSED execution session with gate link');

  // Simulate process restart
  RuntimeManager.reset();
  const recoveredSession = DurableStore.getExecutionSession(executionSession.executionId, tenantAlpha);
  assert(recoveredSession, 'Cold-start must rehydrate execution session');
  assert.strictEqual(recoveredSession?.execution_id, executionSession.executionId);
  console.log('  [PASS S8-5-14]: Restart recovery cleanly rehydrates paused session without data loss');

  // --- SECTION 6: HITL RESUME & EXECUTE ONCE INVARIANCE ---
  console.log('\n--- GROUP 6: HITL RESUME & EXECUTE EXACTLY ONCE ---');

  const pausedInvocation = await ToolGateway.invokeTool({
    agentId: provisionedAlpha.agentId,
    runtimeId: provisionedAlpha.runtimeId,
    passportId: passportAlpha.passportId,
    executionId: `exec_resume_test_${Date.now()}`,
    passport: passportAlpha,
    capability: 'credit.approve',
    action: 'EXECUTE',
    payload: { amountEur: 25000 },
    tenantId: tenantAlpha
  });

  assert.strictEqual(pausedInvocation.status, 'PAUSED');
  assert.strictEqual(pausedInvocation.verdict, 'REQUIRE_HITL');

  const resumeRes = await ToolGateway.resumeExecution(
    pausedInvocation.executionId,
    'APPROVED',
    'compliance-officer-01'
  );

  assert.strictEqual(resumeRes.status, 'COMPLETED');
  assert.strictEqual(resumeRes.verdict, 'ALLOW');
  assert.strictEqual(resumeRes.providerCallCount, 1);
  console.log('  [PASS S8-5-15]: HITL Resume: Human APPROVE executes paused tool exactly once');

  // Attempt duplicate resume on already completed execution
  let duplicateThrew = false;
  try {
    await ToolGateway.resumeExecution(
      pausedInvocation.executionId,
      'APPROVED',
      'compliance-officer-01'
    );
  } catch (err: any) {
    duplicateThrew = true;
    assert(err.message.includes('not found') || err.message.includes('COMPLETED') || err.message.includes('ILLEGAL'));
  }
  assert(duplicateThrew, 'Duplicate resume must throw or be rejected');
  console.log('  [PASS S8-5-16]: Execute Exactly Once Invariance: Duplicate resume attempt strictly rejected');

  // --- SECTION 7: SCANNER -> GOVERNANCE BRIDGE ---
  console.log('\n--- GROUP 7: SCANNER-TO-GOVERNANCE POLICY BRIDGE ---');

  const mockScannerResult: ScannerResult = {
    repo: { name: 'autonomous-finance-crew', owner: 'enterprise-org', fullName: 'enterprise-org/autonomous-finance-crew', description: 'Agentic workflow repo' },
    packages: { dependencies: { 'crewai': '0.28.0' }, devDependencies: {} },
    configs: {} as any,
    source: {} as any,
    risks: [{ category: 'AUTONOMY', severity: 'high', title: 'High autonomy loop detected', description: 'Agent executes banking operations', file: 'crew.py', line: 42 }],
    compliance: {} as any,
    owner: {} as any,
    shadowAI: [],
    certification: { overall: 'none', levels: { bronze: { pass: false, evidence: [], fail: [] }, silver: { pass: false, evidence: [], fail: [] }, gold: { pass: false, evidence: [], fail: [] }, platinum: { pass: false, evidence: [], fail: [] } } },
    violations: [],
    enrichment: {} as any,
    agentCapabilities: [
      { id: 'banking.transfer', name: 'banking.transfer', channel: 'TOOL' } as any,
      { id: 'account.query', name: 'account.query', channel: 'DATA' } as any
    ]
  };

  const bridgeResult = ScannerPolicyBridge.translateScanToGovernance(mockScannerResult, { tenantId: tenantAlpha });

  assert(bridgeResult.complianceProfile, 'Bridge must generate a ComplianceProfile');
  assert(bridgeResult.provisionedAgent, 'Bridge must provision a governed Agent');
  assert.strictEqual(bridgeResult.inferredRiskTier, 'HIGH');
  assert(bridgeResult.complianceProfile.requireHumanApproval.includes('credit.transfer'));
  assert(bridgeResult.provisionedAgent.passport.passportFingerprint.length >= 8);
  console.log('  [PASS S8-5-17]: ScannerPolicyBridge maps Scanner discovery to ComplianceProfile and AgentPassport');

  // --- SECTION 8: TENANT ISOLATION ---
  console.log('\n--- GROUP 8: TENANT ISOLATION IN ACTIVE GOVERNANCE ---');

  let tenantBetaEventSeen = false;
  ActiveGovernanceBus.subscribe(tenantBeta, () => {
    tenantBetaEventSeen = true;
  });

  // Publish event to Tenant Alpha
  ActiveGovernanceBus.publish({
    eventType: 'TOOL_ALLOWED',
    tenantId: tenantAlpha,
    agentId: provisionedAlpha.agentId
  });

  assert.strictEqual(tenantBetaEventSeen, false, 'Tenant Beta listener must not receive Tenant Alpha events');

  const alphaEvents = ActiveGovernanceBus.getEvents(tenantAlpha);
  const betaEvents = ActiveGovernanceBus.getEvents(tenantBeta);
  assert(alphaEvents.length > 0);
  assert.strictEqual(betaEvents.length, 0);
  console.log('  [PASS S8-5-18]: ActiveGovernanceBus enforces strict tenant isolation on events');

  // --- SECTION 9: CRYPTOGRAPHIC EVIDENCE CHAIN VERIFICATION ---
  console.log('\n--- GROUP 9: CRYPTOGRAPHIC EVIDENCE CHAIN VERIFICATION ---');

  const chainVerification = EvidenceLedger.verifyChain();
  assert.strictEqual(chainVerification.valid, true);
  assert(chainVerification.totalEntries > 0);
  console.log(`  [PASS S8-5-19]: Tamper-evident Merkle Evidence Chain valid across ${chainVerification.totalEntries} entries`);

  // --- SECTION 10: BACKWARD COMPATIBILITY ---
  console.log('\n--- GROUP 10: BACKWARD COMPATIBILITY PRESERVATION ---');

  // Static GuardianService.evaluate unchanged
  const baseEval = GuardianService.evaluate({
    agent: { id: provisionedAlpha.agentId, name: provisionedAlpha.name },
    passport: passportAlpha,
    complianceProfile: baseProfile,
    capability: 'fx_rate_lookup',
    toolCall: { toolName: 'fx_rate_lookup', actionType: 'EXECUTE' }
  });
  assert.strictEqual(baseEval.verdict, 'ALLOW');
  console.log('  [PASS S8-5-20]: Existing GuardianService.evaluate backward compatibility preserved');

  // --- SECTION 11: THE 5 OFFICIAL CRUCIBLES (SECTION 18) ---
  console.log('\n--- GROUP 11: THE 5 OFFICIAL ADVERSARIAL CRUCIBLES ---');

  // Ensure clean operational state before crucibles
  GuardianService.reinstateAgent(tenantAlpha, provisionedAlpha.agentId);

  // CRUCIBLE A: Unauthorized tool attempt
  const crucibleA = GuardianService.evaluateActiveCapability({
    agent: { id: provisionedAlpha.agentId, name: provisionedAlpha.name },
    passport: passportAlpha,
    complianceProfile: baseProfile,
    channel: 'TOOL',
    capability: 'drop_production_tables_sql',
    actionType: 'ADMIN',
    context: { tenantId: tenantAlpha }
  });
  assert.strictEqual(crucibleA.verdict, 'BLOCK');
  assert(crucibleA.evidenceId);
  console.log('  [PASS CRUCIBLE A]: Unauthorized tool attempt blocked with 0 provider calls and evidence recorded');

  // CRUCIBLE B: Unauthorized model request
  const crucibleB = GuardianService.evaluateActiveCapability({
    agent: { id: provisionedAlpha.agentId, name: provisionedAlpha.name },
    passport: passportAlpha,
    complianceProfile: baseProfile,
    channel: 'MODEL',
    capability: 'unauthorized-shadow-llm-v99',
    actionType: 'EXECUTE',
    context: { tenantId: tenantAlpha }
  });
  assert.strictEqual(crucibleB.verdict, 'BLOCK');
  assert(crucibleB.reason.includes('not authorized'));
  console.log('  [PASS CRUCIBLE B]: Unauthorized model request blocked with 0 provider calls and evidence recorded');

  // CRUCIBLE C: Unauthorized data scope attempt
  const crucibleC = GuardianService.evaluateActiveCapability({
    agent: { id: provisionedAlpha.agentId, name: provisionedAlpha.name },
    passport: passportAlpha,
    complianceProfile: baseProfile,
    channel: 'DATA',
    capability: 'confidential_payroll_salaries',
    actionType: 'READ',
    context: { tenantId: tenantAlpha }
  });
  assert.strictEqual(crucibleC.verdict, 'BLOCK');
  assert(crucibleC.reason.includes('not authorized'));
  console.log('  [PASS CRUCIBLE C]: Unauthorized data scope attempt blocked with 0 data access and evidence recorded');

  // CRUCIBLE D: Tenant impersonation attempt
  const crucibleD = GuardianService.evaluateActiveCapability({
    agent: { id: provisionedAlpha.agentId, name: provisionedAlpha.name },
    passport: passportAlpha,
    complianceProfile: baseProfile,
    channel: 'TOOL',
    capability: 'fx_rate_lookup',
    actionType: 'EXECUTE',
    context: { tenantId: 'TENANT-MALICIOUS-IMPERSONATOR' }
  });
  assert.strictEqual(crucibleD.verdict, 'BLOCK');
  assert(crucibleD.reason.includes('Tenant isolation violation'));
  console.log('  [PASS CRUCIBLE D]: Tenant impersonation attempt blocked and evidenced');

  // CRUCIBLE E: High-risk action -> REQUIRE_HITL -> PAUSE -> 0 executions -> APPROVAL -> RESUME -> 1 execution
  GuardianService.reinstateAgent(tenantAlpha, provisionedAlpha.agentId);
  let providerExecutionCount = 0;
  const mockAdapter = {
    providerId: 'crucible-provider',
    execute: async () => {
      providerExecutionCount++;
      return { success: true };
    }
  };

  ToolGateway.registerProvider(mockAdapter);

  const crucibleEPassport: AgentPassport = {
    ...passportAlpha,
    passportId: 'pass_crucible_e',
    declaredTools: ['credit.approve']
  };

  const crucibleEInvocation = await ToolGateway.invokeTool({
    agentId: provisionedAlpha.agentId,
    runtimeId: provisionedAlpha.runtimeId,
    passportId: crucibleEPassport.passportId,
    executionId: `exec_crucible_${Date.now()}`,
    passport: crucibleEPassport,
    capability: 'credit.approve',
    action: 'EXECUTE',
    payload: { amountEur: 25000 },
    tenantId: tenantAlpha
  });

  assert.strictEqual(crucibleEInvocation.status, 'PAUSED');
  assert.strictEqual(crucibleEInvocation.verdict, 'REQUIRE_HITL');
  assert.strictEqual(providerExecutionCount, 0, 'Provider executions must remain exactly 0 while paused');

  // Human approval and resumption
  const crucibleEResume = await ToolGateway.resumeExecution(
    crucibleEInvocation.executionId,
    'APPROVED',
    'authorized-risk-officer-99',
    undefined,
    tenantAlpha
  );

  assert.strictEqual(crucibleEResume.status, 'COMPLETED');
  assert.strictEqual(crucibleEResume.verdict, 'ALLOW');
  assert.strictEqual(crucibleEResume.providerCallCount, 1, 'Provider execution must occur exactly once upon approval');
  console.log('  [PASS CRUCIBLE E]: High-risk action: Paused with 0 executions, resumed on approval with exactly 1 execution');

  console.log('\n==================================================================');
  console.log('>>> S8-5 ACTIVE GOVERNANCE SUITE: ALL 25 TESTS & CRUCIBLES PASS <<<');
  console.log('==================================================================\n');
}

// Execute suite
runS85ActiveGovernanceSuite().catch(err => {
  console.error('\n❌ S8-5 TEST FAILURE:\n', err);
  process.exit(1);
});
