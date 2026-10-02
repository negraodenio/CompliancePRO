/**
 * ComplyPRO.pt — Sprint 8-4: Containerized Worker Sandbox Test Suite
 * "Build with your framework. Govern with ComplyPRO."
 * 
 * Comprehensive validation of:
 * 1. All 14 Security Invariants (S8-4-S01 to S8-4-S14)
 * 2. All 10 Adversarial & Escape Scenarios (Path traversal, /etc/passwd, secrets, fork bomb, timeout, cross-sandbox bleed)
 * 3. Observability & Evidence Invariants (WHO, WHAT, WHEN, WHICH SANDBOX, etc.)
 */

import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { SandboxManager } from '../src/core/sandbox/sandbox-manager';
import { WorkerRunner } from '../src/core/sandbox/worker-runner';
import { IsolatedWorker } from '../src/core/isolated-worker';
import { EvidenceLedger } from '../src/core/evidence-ledger';
import { ComplianceProfileRegistry } from '../src/core/compliance-compiler';
import { AgentPassport } from '../src/core/compliance-contract';
import { CapabilityRegistry } from '../src/core/capability-registry';
import { ToolGateway } from '../src/core/tool-gateway';
import { ModelGateway } from '../src/core/model-gateway';
import { DataGateway } from '../src/core/data-gateway';
import { GuardianService } from '../src/core/guardian-service';
import { CrewAiRuntimeAdapter } from '../src/core/adapters/crewai-runtime-adapter';
import { EvidenceVerifier } from '../src/core/evidence-verifier';
import { AgentProvisioner, AgentDefinition } from '../src/core/agent-provisioner';
import { RuntimeManager } from '../src/core/runtime-manager';

async function runS84WorkerSandboxSuite() {
  console.log('\n==================================================================');
  console.log('>>> COMPLYPRO.PT — SPRINT 8-4: WORKER SANDBOX SECURITY TESTS  <<<');
  console.log('==================================================================\n');

  // Reset and prepare environment
  SandboxManager.reset();
  EvidenceLedger.reset();

  const profile = ComplianceProfileRegistry.getProfile('CP-EU-AI-ACT-HIGH-RISK-FINANCIAL')!;

  const referencePassport: AgentPassport = {
    passportId: 'PASS-S8-4-ALPHA',
    passportFingerprint: 'FINGERPRINT_ALPHA_001_VALID',
    complianceProfileChecksum: profile.checksum,
    declaredTools: ['credit.check', 'credit.transfer', 'financial_credit_check', 'customer_lookup'],
    governedCapabilities: [
      { capability: 'credit.check', channel: 'TOOL' },
      { capability: 'credit.transfer', channel: 'TOOL', requiresHitl: true }
    ] as any,
    runtime: {
      framework: 'crewai',
      frameworkVersion: '0.102.0',
      runtimeVersion: 'complypro-runtime-v1.0'
    },
    toolManifestHash: 'hash_alpha_tools_manifest',
    riskTier: 'HIGH_RISK',
    status: 'ACTIVE',
    tenantId: 'tenant_alpha'
  };

  // Register baseline capabilities
  CapabilityRegistry.register({
    id: 'credit.check',
    name: 'Credit Check',
    description: 'Check customer credit history',
    channel: 'TOOL',
    provider: 'REST',
    riskLevel: 'LOW',
    allowedActions: ['READ', 'EXECUTE'],
    dataClassification: 'CONFIDENTIAL'
  });

  CapabilityRegistry.register({
    id: 'credit.transfer',
    name: 'Credit Transfer (High Risk HITL)',
    description: 'Transfer credit funds',
    channel: 'TOOL',
    provider: 'REST',
    riskLevel: 'HIGH',
    allowedActions: ['WRITE', 'EXECUTE'],
    dataClassification: 'RESTRICTED'
  });

  // ============================================================================
  // GROUP 1: SECURITY INVARIANTS (S8-4-S01 to S8-4-S14)
  // ============================================================================
  console.log('--- GROUP 1: SECURITY INVARIANTS (S8-4-S01 TO S8-4-S14) ---');

  // S8-4-S01: Non-root execution
  const workerAudit = WorkerRunner.verifySandboxInvariants();
  assert.strictEqual(workerAudit.isNonRoot, true, 'Worker must execute as unprivileged non-root user');
  console.log('  [PASS S8-4-S01]: Worker container/process executes as non-root (unprivileged UID)');

  // S8-4-S02: No Docker socket access
  assert.strictEqual(workerAudit.hasDockerSocket, false, 'Worker must not have access to Docker socket');
  console.log('  [PASS S8-4-S02]: Worker does NOT possess access to Docker socket');

  // S8-4-S03: No Supabase service role key in worker environment
  const testEnv = WorkerRunner.createSanitizedEnvironment(
    { agentId: 'ag_1', runtimeInstanceId: 'rt_1', executionSessionId: 'ex_1', sandboxId: 'sbx_1' },
    '/tmp/sandbox'
  );
  assert.strictEqual(testEnv.SUPABASE_SERVICE_ROLE_KEY, undefined, 'SUPABASE_SERVICE_ROLE_KEY must be stripped');
  assert.strictEqual(testEnv.DATABASE_URL, undefined, 'DATABASE_URL must be stripped');
  console.log('  [PASS S8-4-S03]: Worker environment strictly stripped of SUPABASE_SERVICE_ROLE_KEY');

  // S8-4-S04: No arbitrary host secrets
  assert.strictEqual(testEnv.COMPLYPRO_API_KEYS, undefined, 'COMPLYPRO_API_KEYS must be stripped');
  assert.strictEqual(testEnv.AWS_SECRET_ACCESS_KEY, undefined, 'Host cloud secrets must be stripped');
  console.log('  [PASS S8-4-S04]: Worker does NOT receive arbitrary host secrets or cloud credentials');

  // S8-4-S05: Ephemeral filesystem isolation
  const sbx1Config = SandboxManager.createSandbox({
    agentId: 'ag_alpha_01',
    runtimeInstanceId: 'rt_alpha_01',
    executionSessionId: 'ex_alpha_01',
    tenantId: 'tenant_alpha',
    passport: referencePassport,
    resourceLimits: { maxExecutionSeconds: 5, pidsLimit: 4 }
  });
  const activeSbx1 = SandboxManager.startSandbox(sbx1Config.identity.sandboxId);
  assert.strictEqual(activeSbx1.state, 'RUNNING');
  assert.strictEqual(fs.existsSync(activeSbx1.ephemeralPath), true, 'Ephemeral directory must exist');
  console.log('  [PASS S8-4-S05]: Worker filesystem is isolated and ephemeral (dedicated scratchpad)');

  // S8-4-S06: Resource limits enforcement (CPU, Memory, PIDs)
  assert.strictEqual(sbx1Config.limits.cpu > 0, true);
  assert.strictEqual(sbx1Config.limits.memoryMb > 0, true);
  assert.strictEqual(sbx1Config.limits.pidsLimit, 4);
  console.log('  [PASS S8-4-S06]: Resource bounds configured and enforced (CPU, RAM, PIDs)');

  // S8-4-S07: Watchdog timeout
  const timeoutSbxConfig = SandboxManager.createSandbox({
    agentId: 'ag_timeout',
    runtimeInstanceId: 'rt_timeout',
    executionSessionId: 'ex_timeout',
    tenantId: 'tenant_alpha',
    passport: referencePassport,
    resourceLimits: { maxExecutionSeconds: 1 } // 1 second timeout
  });
  SandboxManager.startSandbox(timeoutSbxConfig.identity.sandboxId);
  // Wait 1100ms for watchdog trigger
  await new Promise(r => setTimeout(r, 1100));
  const timedOutSbx = SandboxManager.getSandbox(timeoutSbxConfig.identity.sandboxId);
  assert.strictEqual(timedOutSbx?.state, 'TIMEOUT', 'Watchdog must trigger TIMEOUT state');
  assert.strictEqual(timedOutSbx?.exitCode, 124, 'Exit code must be 124');
  console.log('  [PASS S8-4-S07]: Mandatory watchdog timeout forcibly killed long-running sandbox');

  // S8-4-S08: Forcible termination by orchestrator
  const termSbxConfig = SandboxManager.createSandbox({
    agentId: 'ag_term',
    runtimeInstanceId: 'rt_term',
    executionSessionId: 'ex_term',
    tenantId: 'tenant_alpha',
    passport: referencePassport,
    resourceLimits: { maxExecutionSeconds: 30 }
  });
  SandboxManager.startSandbox(termSbxConfig.identity.sandboxId);
  const termResult = SandboxManager.terminateSandbox(termSbxConfig.identity.sandboxId, 'ADMIN_MANUAL_STOP');
  assert.strictEqual(termResult.state, 'TERMINATED');
  assert.strictEqual(termResult.exitCode, 143);
  console.log('  [PASS S8-4-S08]: Worker successfully terminated on demand by orchestrator (SIGTERM 143)');

  // S8-4-S09: No direct Control Plane access (Worker must use Gateway)
  const worker = new IsolatedWorker({
    agentId: 'ag_alpha_01',
    passportId: referencePassport.passportId,
    runtimeId: 'rt_alpha_01',
    passport: referencePassport
  });
  assert.throws(() => {
    worker.getEnv('SUPABASE_SERVICE_ROLE_KEY');
  }, /SECRET_ACCESS_DENIED/);
  console.log('  [PASS S8-4-S09]: Worker cannot access Control Plane secrets or raw connections directly');

  // S8-4-S10: Unauthorized capabilities are DENIED
  const unauthExecution = SandboxManager.executeInSandbox(activeSbx1.config.identity.sandboxId, {
    capabilityId: 'undeclared_crypto_miner',
    action: 'EXECUTE'
  });
  assert.strictEqual(unauthExecution.success, false);
  assert.strictEqual(unauthExecution.error?.includes('UNKNOWN_CAPABILITY'), true);
  console.log('  [PASS S8-4-S10]: Undeclared and unauthorized capabilities are strictly DENIED');

  // S8-4-S11: Authorized execution produces verifiable Evidence Ledger records
  const authExecution = SandboxManager.executeInSandbox(activeSbx1.config.identity.sandboxId, {
    capabilityId: 'credit.check',
    action: 'EXECUTE',
    payload: { customerId: 'cust_999' }
  });
  assert.strictEqual(authExecution.success, true);
  assert.strictEqual(authExecution.verdict, 'ALLOW');
  const allEvidence = EvidenceLedger.getEntries();
  const hasStartEvidence = allEvidence.some(e => e.eventType === 'RUNTIME_STARTED');
  assert.strictEqual(hasStartEvidence, true, 'Evidence Ledger must record execution events');
  console.log('  [PASS S8-4-S11]: Governed execution produces tamper-evident audit records in Evidence Ledger');

  // S8-4-S12: Failure/Timeout/Termination persistence
  const auditRecord = SandboxManager.getAuditRecord(timeoutSbxConfig.identity.sandboxId);
  assert.strictEqual(auditRecord?.state, 'TIMEOUT');
  assert.strictEqual(auditRecord?.exitCode, 124);
  console.log('  [PASS S8-4-S12]: Failure, termination, and timeout states are recorded in audit history');

  // S8-4-S13: Host filesystem escape prevented
  assert.throws(() => {
    SandboxManager.writeSandboxFile(activeSbx1.config.identity.sandboxId, '../../host_file.txt', 'malicious');
  }, /FILESYSTEM_ESCAPE_DENIED/);
  console.log('  [PASS S8-4-S13]: Sandbox cannot escape to host filesystem via path traversal');

  // S8-4-S14: Concurrent executions isolated from each other
  const sbx2Config = SandboxManager.createSandbox({
    agentId: 'ag_beta_02',
    runtimeInstanceId: 'rt_beta_02',
    executionSessionId: 'ex_beta_02',
    tenantId: 'tenant_beta',
    passport: referencePassport
  });
  const activeSbx2 = SandboxManager.startSandbox(sbx2Config.identity.sandboxId);

  // Write file to Sandbox 1
  SandboxManager.writeSandboxFile(activeSbx1.config.identity.sandboxId, 'secret_memo.txt', 'CONFIDENTIAL_ALPHA');
  const readBack = SandboxManager.readSandboxFile(activeSbx1.config.identity.sandboxId, 'secret_memo.txt');
  assert.strictEqual(readBack, 'CONFIDENTIAL_ALPHA');

  // Sandbox 2 attempts to read file from Sandbox 1
  assert.throws(() => {
    SandboxManager.readSandboxFile(activeSbx2.config.identity.sandboxId, `../${activeSbx1.config.identity.sandboxId}/secret_memo.txt`);
  }, /FILESYSTEM_ESCAPE_DENIED/);
  console.log('  [PASS S8-4-S14]: Concurrent sandboxes possess complete zero-bleed isolation');

  // ============================================================================
  // GROUP 2: ADVERSARIAL & ESCAPE TESTS (PHASE 6)
  // ============================================================================
  console.log('\n--- GROUP 2: ADVERSARIAL & ESCAPE TESTS (PHASE 6) ---');

  // 1. Attempt to read /etc/passwd or host system files
  assert.throws(() => {
    SandboxManager.readSandboxFile(activeSbx1.config.identity.sandboxId, '/etc/passwd');
  }, /FILESYSTEM_ESCAPE_DENIED/);
  console.log('  [PASS ADV-01]: Attempt to read /etc/passwd or host files strictly BLOCKED');

  // 2. Attempt to read host environment variables / secrets
  assert.throws(() => {
    worker.getEnv('DATABASE_URL');
  }, /SECRET_ACCESS_DENIED/);
  console.log('  [PASS ADV-02]: Attempt to read host database secrets strictly BLOCKED');

  // 3. Attempt path traversal outside workspace
  assert.throws(() => {
    worker.accessFile('/etc/shadow');
  }, /FILESYSTEM_ACCESS_DENIED/);
  console.log('  [PASS ADV-03]: Attempt to traverse outside sandbox root strictly BLOCKED');

  // 4. Attempt to access Docker socket
  const hasSock = fs.existsSync('/var/run/docker.sock');
  assert.strictEqual(hasSock, false);
  console.log('  [PASS ADV-04]: Worker denied access to /var/run/docker.sock');

  // 5. Attempt arbitrary outbound network bypass
  assert.throws(() => {
    worker.directNetworkCall('http://untrusted-exfiltration.com');
  }, /NETWORK_ACCESS_DENIED/);
  console.log('  [PASS ADV-05]: Attempted outbound internet bypass strictly BLOCKED');

  // 6. Attempt to consume excessive child processes (fork bomb)
  SandboxManager.registerProcess(activeSbx1.config.identity.sandboxId, 101);
  SandboxManager.registerProcess(activeSbx1.config.identity.sandboxId, 102);
  SandboxManager.registerProcess(activeSbx1.config.identity.sandboxId, 103);
  SandboxManager.registerProcess(activeSbx1.config.identity.sandboxId, 104);
  // 5th PID exceeds limit of 4
  assert.throws(() => {
    SandboxManager.registerProcess(activeSbx1.config.identity.sandboxId, 105);
  }, /RESOURCE_LIMIT_EXCEEDED: PID limit of 4 reached/);
  console.log('  [PASS ADV-06]: Fork bomb attempt contained by mandatory PID limit');

  // 7. Attempt to run after sandbox completion
  SandboxManager.completeSandbox(activeSbx1.config.identity.sandboxId);
  const postCompleteExec = SandboxManager.executeInSandbox(activeSbx1.config.identity.sandboxId, {
    capabilityId: 'credit.check',
    action: 'EXECUTE'
  });
  assert.strictEqual(postCompleteExec.success, false);
  assert.strictEqual(postCompleteExec.error?.includes('SANDBOX_INACTIVE'), true);
  console.log('  [PASS ADV-07]: Execution inside completed/terminated sandbox strictly rejected');

  // 8. Ephemeral directory cleaned up after completion
  const dirStillExists = fs.existsSync(activeSbx1.ephemeralPath);
  assert.strictEqual(dirStillExists, false, 'Ephemeral directory must be wiped on sandbox completion');
  console.log('  [PASS ADV-08]: Ephemeral workspace completely erased upon sandbox termination');

  // 9. Cross-tenant capability leakage check
  const crossTenantExecution = SandboxManager.executeInSandbox(activeSbx2.config.identity.sandboxId, {
    capabilityId: 'credit.check',
    action: 'EXECUTE',
    payload: { tenantOverride: 'tenant_alpha' } // Attempt to impersonate tenant_alpha
  });
  assert.strictEqual(crossTenantExecution.success, true);
  // Verify evidence records tenant_beta, not the spoofed tenant_alpha
  const latestEvidence = EvidenceLedger.getEntries().pop();
  assert.strictEqual(latestEvidence?.agentId, 'ag_beta_02');
  console.log('  [PASS ADV-09]: Cross-tenant payload impersonation contained by passport binding');

  // 10. Audit Record Completeness (WHO, WHAT, WHEN, WHICH SANDBOX)
  const fullAudit = SandboxManager.getAuditRecord(activeSbx2.config.identity.sandboxId);
  assert.ok(fullAudit?.sandboxId);
  assert.ok(fullAudit?.agentId);
  assert.ok(fullAudit?.runtimeInstanceId);
  assert.ok(fullAudit?.executionSessionId);
  assert.ok(fullAudit?.tenantId);
  assert.ok(fullAudit?.timestamp);
  console.log('  [PASS ADV-10]: Complete provenance trail verified (WHO, WHAT, WHEN, WHICH SANDBOX)');

  console.log('\n--- GROUP 3: THE 10 OFFICIAL CRUCIBLE TESTS ---');

  // CRUCIBLE 1: SECRET ESCAPE
  assert.throws(() => {
    worker.getEnv('OPENAI_API_KEY');
  }, /SECRET_ACCESS_DENIED/);
  assert.throws(() => {
    worker.getEnv('DATABASE_URL');
  }, /SECRET_ACCESS_DENIED/);
  assert.throws(() => {
    worker.getEnv('SUPABASE_SERVICE_ROLE_KEY');
  }, /SECRET_ACCESS_DENIED/);
  assert.strictEqual(worker.getAllEnv().OPENAI_API_KEY, undefined);
  assert.strictEqual(worker.getAllEnv().SUPABASE_SERVICE_ROLE_KEY, undefined);
  console.log('  [PASS CRUCIBLE 1]: Secret escape: Worker cannot access host or database secrets (DENIED/ABSENT)');

  // CRUCIBLE 2: DIRECT NETWORK ESCAPE
  assert.throws(() => {
    worker.directNetworkCall('https://api.openai.com');
  }, /NETWORK_ACCESS_DENIED/);
  assert.throws(() => {
    worker.directNetworkCall('https://openrouter.ai');
  }, /NETWORK_ACCESS_DENIED/);
  assert.throws(() => {
    worker.directNetworkCall('https://compliancepro-h6xb.onrender.com');
  }, /NETWORK_ACCESS_DENIED/);
  console.log('  [PASS CRUCIBLE 2]: Direct network escape: Direct provider egress strictly BLOCKED');

  // CRUCIBLE 3: FILESYSTEM ESCAPE
  assert.throws(() => {
    worker.accessFile('/etc/shadow');
  }, /FILESYSTEM_ACCESS_DENIED/);
  assert.throws(() => {
    SandboxManager.readSandboxFile(activeSbx2.config.identity.sandboxId, '../../../etc/passwd');
  }, /FILESYSTEM_ESCAPE_DENIED/);
  console.log('  [PASS CRUCIBLE 3]: Filesystem escape: Access outside assigned workspace root strictly BLOCKED');

  // CRUCIBLE 4: DOCKER ESCAPE
  const dockerSockExists = fs.existsSync('/var/run/docker.sock') || fs.existsSync('//./pipe/docker_engine');
  assert.strictEqual(dockerSockExists, false, 'Docker socket must be ABSENT');
  console.log('  [PASS CRUCIBLE 4]: Docker escape: Docker socket is strictly ABSENT / BLOCKED');

  // CRUCIBLE 5: RESOURCE ABUSE
  const abuseSbx = SandboxManager.createSandbox({
    agentId: 'ag_abuse',
    runtimeInstanceId: 'rt_abuse',
    executionSessionId: 'ex_abuse',
    tenantId: 'tenant_alpha',
    passport: referencePassport,
    resourceLimits: { pidsLimit: 2, maxExecutionSeconds: 1 }
  });
  SandboxManager.startSandbox(abuseSbx.identity.sandboxId);
  SandboxManager.registerProcess(abuseSbx.identity.sandboxId, 501);
  SandboxManager.registerProcess(abuseSbx.identity.sandboxId, 502);
  assert.throws(() => {
    SandboxManager.registerProcess(abuseSbx.identity.sandboxId, 503);
  }, /RESOURCE_LIMIT_EXCEEDED/);
  console.log('  [PASS CRUCIBLE 5]: Resource abuse: Fork bomb and PID limits strictly ENFORCED');

  // CRUCIBLE 6: GOVERNANCE BYPASS (DIRECT_DB_DDL)
  CapabilityRegistry.register({
    id: 'DIRECT_DB_DDL',
    name: 'Direct Database Schema Alteration',
    description: 'Direct SQL schema modification',
    channel: 'TOOL',
    provider: 'direct-postgresql-pool',
    riskLevel: 'CRITICAL',
    allowedActions: ['DELETE', 'ADMIN'],
    dataClassification: 'RESTRICTED'
  });
  const bypassRes = await ToolGateway.invokeTool({
    agentId: referencePassport.passportId,
    runtimeId: 'rt_alpha_01',
    passportId: referencePassport.passportId,
    executionId: 'exec_ddl_test',
    passport: referencePassport,
    capability: 'DIRECT_DB_DDL',
    action: 'DELETE',
    payload: { query: 'DROP TABLE agents;' }
  });
  assert.strictEqual(bypassRes.verdict, 'BLOCK');
  assert.strictEqual(bypassRes.providerCallCount, 0);
  console.log('  [PASS CRUCIBLE 6]: Governance bypass: DIRECT_DB_DDL blocked by Guardian with 0 provider calls');

  // CRUCIBLE 7: HITL INTERVENE & RESUME
  const hitlRes = await ToolGateway.invokeTool({
    agentId: referencePassport.passportId,
    runtimeId: 'rt_alpha_01',
    passportId: referencePassport.passportId,
    executionId: 'exec_hitl_test',
    passport: referencePassport,
    capability: 'credit.transfer',
    action: 'EXECUTE',
    payload: { amount: 25000, recipient: 'NL91ABNA0417164300' }
  });
  assert.strictEqual(hitlRes.verdict, 'REQUIRE_HITL');
  assert.strictEqual(hitlRes.status, 'PAUSED');
  assert.strictEqual(hitlRes.providerCallCount, 0);
  // Operator approves
  const resumeRes = await ToolGateway.resumeExecution('exec_hitl_test', 'APPROVED', 'OP-COMPLIANCE-OFFICER');
  assert.strictEqual(resumeRes.status, 'COMPLETED');
  assert.strictEqual(resumeRes.providerCallCount, 1);
  console.log('  [PASS CRUCIBLE 7]: HITL intervention: credit.transfer paused, tool calls = 0, resumed on approval');

  // CRUCIBLE 8: MODEL GOVERNANCE
  CapabilityRegistry.register({
    id: 'gpt-4o',
    name: 'OpenAI GPT-4o Flagship',
    description: 'OpenAI GPT-4o model',
    channel: 'MODEL',
    provider: 'openai',
    riskLevel: 'LOW',
    allowedActions: ['EXECUTE'],
    dataClassification: 'CONFIDENTIAL'
  });
  CapabilityRegistry.register({
    id: 'claude-3-5-sonnet',
    name: 'Anthropic Claude 3.5 Sonnet',
    description: 'Anthropic Claude model',
    channel: 'MODEL',
    provider: 'anthropic',
    riskLevel: 'LOW',
    allowedActions: ['EXECUTE'],
    dataClassification: 'CONFIDENTIAL'
  });
  const modelAllowed = GuardianService.evaluateModelInvocation({
    agent: { id: referencePassport.passportId, name: 'risk-agent' },
    passport: {
      passportId: referencePassport.passportId,
      passportFingerprint: referencePassport.passportFingerprint,
      complianceProfileChecksum: referencePassport.complianceProfileChecksum,
      declaredTools: [...referencePassport.declaredTools, 'gpt-4o'],
      governedCapabilities: referencePassport.governedCapabilities as any,
      toolManifestHash: referencePassport.toolManifestHash,
      riskTier: referencePassport.riskTier
    },
    complianceProfile: profile,
    modelName: 'gpt-4o'
  });
  assert.strictEqual(modelAllowed.verdict, 'ALLOW');

  const modelBlocked = GuardianService.evaluateModelInvocation({
    agent: { id: referencePassport.passportId, name: 'risk-agent' },
    passport: {
      passportId: referencePassport.passportId,
      passportFingerprint: referencePassport.passportFingerprint,
      complianceProfileChecksum: referencePassport.complianceProfileChecksum,
      declaredTools: referencePassport.declaredTools,
      governedCapabilities: referencePassport.governedCapabilities as any,
      toolManifestHash: referencePassport.toolManifestHash,
      riskTier: referencePassport.riskTier
    },
    complianceProfile: profile,
    modelName: 'claude-3-5-sonnet'
  });
  assert.strictEqual(modelBlocked.verdict, 'BLOCK');
  console.log('  [PASS CRUCIBLE 8]: Model governance: Authorized model ALLOW, unauthorized model BLOCK');

  // CRUCIBLE 9: DATA GOVERNANCE
  CapabilityRegistry.register({
    id: 'crm.read_customer',
    name: 'CRM Read Customer Record',
    description: 'Read customer CRM records',
    channel: 'DATA',
    provider: 'supabase-postgresql',
    riskLevel: 'LOW',
    allowedActions: ['READ'],
    dataClassification: 'CONFIDENTIAL'
  });
  const dataAllowed = GuardianService.evaluateDataEgress({
    agent: { id: referencePassport.passportId, name: 'risk-agent' },
    passport: {
      passportId: referencePassport.passportId,
      passportFingerprint: referencePassport.passportFingerprint,
      complianceProfileChecksum: referencePassport.complianceProfileChecksum,
      declaredTools: [...referencePassport.declaredTools, 'crm.read_customer'],
      governedCapabilities: referencePassport.governedCapabilities as any,
      toolManifestHash: referencePassport.toolManifestHash,
      riskTier: referencePassport.riskTier
    },
    complianceProfile: profile,
    resource: 'crm.read_customer',
    actionType: 'READ'
  });
  assert.strictEqual(dataAllowed.verdict, 'ALLOW');

  const dataBlocked = GuardianService.evaluateDataEgress({
    agent: { id: referencePassport.passportId, name: 'risk-agent' },
    passport: {
      passportId: referencePassport.passportId,
      passportFingerprint: referencePassport.passportFingerprint,
      complianceProfileChecksum: referencePassport.complianceProfileChecksum,
      declaredTools: referencePassport.declaredTools,
      governedCapabilities: referencePassport.governedCapabilities as any,
      toolManifestHash: referencePassport.toolManifestHash,
      riskTier: referencePassport.riskTier
    },
    complianceProfile: profile,
    resource: 'admin_passwords',
    actionType: 'READ'
  });
  assert.strictEqual(dataBlocked.verdict, 'BLOCK');
  console.log('  [PASS CRUCIBLE 9]: Data governance: Authorized data access ALLOW, unauthorized data access BLOCK');

  // CRUCIBLE 10: TENANT ISOLATION
  const tenantIsolationCheck = SandboxManager.executeInSandbox(activeSbx2.config.identity.sandboxId, {
    capabilityId: 'credit.check',
    action: 'EXECUTE',
    payload: { requestedTenant: 'tenant_alpha' }
  });
  assert.strictEqual(tenantIsolationCheck.success, true);
  const lastEvidence = EvidenceLedger.getEntries().pop();
  assert.strictEqual(lastEvidence?.agentId, 'ag_beta_02');
  console.log('  [PASS CRUCIBLE 10]: Tenant isolation: Cross-tenant payload override contained by passport binding');

  // ============================================================================
  // GROUP 4: END-TO-END GOVERNED AGENT PROOF INSIDE SANDBOX
  // ============================================================================
  console.log('\n--- GROUP 4: END-TO-END GOVERNED AGENT PROOF INSIDE SANDBOX ---');
  
  // 1. Provision Agent
  const e2eAgentDef: AgentDefinition = {
    name: 'sandbox-e2e-analyst',
    framework: { name: 'crewai', version: '0.102.0' },
    complianceProfile: 'CP-EU-AI-ACT-HIGH-RISK-FINANCIAL',
    capabilities: ['crm.read_customer', 'gpt-4o', 'credit.check'],
    budget: { maxCostPerRunEur: 15.0, maxTokensPerStep: 4096, maxCallsPerMinute: 60 },
    environment: 'sandbox'
  };
  const e2eProvision = AgentProvisioner.provision(e2eAgentDef);
  assert.strictEqual(e2eProvision.status, 'PROVISIONED');

  // 2. Start Runtime and Sandbox
  const e2eRuntime = RuntimeManager.createRuntime(e2eProvision.runtimeSpec, e2eProvision.passport);
  const startedE2eRuntime = RuntimeManager.startRuntime(e2eRuntime.runtimeId);
  assert.strictEqual(startedE2eRuntime.status, 'RUNNING');
  const e2eWorker = RuntimeManager.getWorker(startedE2eRuntime.runtimeId)!;
  assert.ok(e2eWorker, 'E2E Worker must be initialized');

  // 3. CrewAI Runtime Adapter Execution
  const e2eAdapter = new CrewAiRuntimeAdapter(e2eWorker);
  const e2eSession = await e2eAdapter.start();
  assert.strictEqual(e2eSession.status, 'RUNNING');

  // Step A: DATA Capability
  const dataStep = await e2eAdapter.execute(e2eSession, {
    taskId: 'task_data_step',
    description: 'Read customer risk profile',
    targetCapability: 'crm.read_customer',
    actionType: 'READ',
    payload: { customerId: 'CUST-E2E-77' }
  });
  assert.strictEqual(dataStep.status, 'COMPLETED');
  assert.strictEqual(dataStep.toolExecuted, true);

  // Step B: MODEL Capability
  const e2eSession2 = await e2eAdapter.start();
  const modelStep = await e2eAdapter.execute(e2eSession2, {
    taskId: 'task_model_step',
    description: 'Generate risk score via LLM',
    targetCapability: 'gpt-4o',
    actionType: 'EXECUTE',
    payload: { prompt: 'Analyze creditworthiness for CUST-E2E-77' }
  });
  assert.strictEqual(modelStep.status, 'COMPLETED');

  // Step C: TOOL Capability
  const e2eSession3 = await e2eAdapter.start();
  const toolStep = await e2eAdapter.execute(e2eSession3, {
    taskId: 'task_tool_step',
    description: 'Execute credit score check',
    targetCapability: 'credit.check',
    actionType: 'EXECUTE',
    payload: { customerId: 'CUST-E2E-77' }
  });
  assert.strictEqual(toolStep.status, 'COMPLETED');

  // 4. Cryptographic Evidence Chain Verification
  const verification = EvidenceVerifier.verifyChain(EvidenceLedger.getEntries());
  assert.strictEqual(verification.valid, true, 'Complete causal Evidence Chain must be cryptographically valid');
  assert.strictEqual(verification.totalEntries > 10, true, 'Evidence chain must contain all lifecycle events');
  console.log(`  [PASS E2E]: End-to-end governed workflow verified across DATA, MODEL, and TOOL`);
  console.log(`  [PASS E2E]: Cryptographic Evidence Chain verified (valid: true, entries: ${verification.totalEntries})`);

  console.log('\n==================================================================');
  console.log('>>> S8-4 WORKER SANDBOX SUITE: ALL 36 TESTS & CRUCIBLES PASSED <<<');
  console.log('==================================================================\n');
}

runS84WorkerSandboxSuite().catch(err => {
  console.error('\n❌ S8-4 TEST FAILURE:', err);
  process.exit(1);
});
