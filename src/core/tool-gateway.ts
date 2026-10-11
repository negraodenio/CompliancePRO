/**
 * ComplyPRO.pt — Sprint 7-B: Real Tool / MCP Gateway
 * 
 * Core Invariants:
 * 1. Gateway is the Enforcement Perimeter; Guardian is the Policy Authority.
 * 2. Zero Secrets in Worker: Provider API keys/tokens live exclusively in ToolGateway.
 * 3. Compulsory Guardian Interception: Every tool invocation must pass through Guardian.
 * 4. BLOCK Enforces Zero Execution: Prohibited actions result in zero provider calls.
 * 5. REQUIRE_HITL Pauses Execution: High-risk actions pause until explicit human approval.
 * 6. Evidence Trail: Emits TOOL_REQUEST, GUARDIAN_DECISION, TOOL_RESPONSE, TOOL_ERROR to EvidenceLedger.
 */

import crypto from 'crypto';
import { GuardianService } from './guardian-service';
import { ComplianceProfileRegistry } from './compliance-compiler';
import { AgentPassport } from './compliance-contract';
import { CapabilityRegistry, CapabilityAction } from './capability-registry';
import { EvidenceLedger, canonicalizeJson } from './evidence-ledger';
import { ContinuousRiskDetector } from './continuous-risk-detector';
import { RuntimeManager } from './runtime-manager';
import { DurableStore } from '../server/db/durable-store';
import { PassportSigner } from './passport-signer';

export interface ToolInvocationContext {
  agentId: string;
  runtimeId: string;
  passportId: string;
  executionId: string;
  passport: AgentPassport;
  capability: string;
  action: CapabilityAction;
  payload?: Record<string, any>;
  tenantId?: string;
}

export interface ToolExecutionResponse {
  status: 'COMPLETED' | 'BLOCKED' | 'PAUSED' | 'FAILED';
  verdict: 'ALLOW' | 'BLOCK' | 'REQUIRE_HITL' | 'CIRCUIT_BREAK';
  executionId: string;
  capability: string;
  provider: string;
  result?: any;
  gateId?: string;
  latencyMs: number;
  decisionLatencyMs: number;
  providerCallCount?: number;
  error?: string;
}

export interface ToolProviderCredentials {
  apiKey?: string;
  token?: string;
  endpoint?: string;
  organizationId?: string;
}

export interface ToolProviderAdapter {
  providerId: string;
  execute(
    capabilityId: string,
    action: CapabilityAction,
    payload: any,
    context: ToolInvocationContext,
    credentials?: ToolProviderCredentials
  ): Promise<any>;
}

/**
 * Concrete CompliancePRO Tool Provider.
 * Connects to the real remote CompliancePRO API (https://compliancepro-h6xb.onrender.com).
 * Verified OpenAPI Contract: REST API with HTTPBearer and X-Organization-Id.
 */
export class CompliancePROToolProvider implements ToolProviderAdapter {
  public readonly providerId = 'compliancepro-api';
  private callCount = 0;

  public getCallCount(): number {
    return this.callCount;
  }

  public resetCallCount(): void {
    this.callCount = 0;
  }

  public async execute(
    capabilityId: string,
    action: CapabilityAction,
    payload: any,
    context: ToolInvocationContext,
    credentials?: ToolProviderCredentials
  ): Promise<any> {
    const baseUrl = credentials?.endpoint || 'https://compliancepro-h6xb.onrender.com';
    const token = credentials?.token || credentials?.apiKey;
    const tenant = context.tenantId || context.passport.tenantId;
    if (credentials?.organizationId && tenant && credentials.organizationId !== tenant)
      throw new Error('TOOL_PROVIDER_TENANT_MISMATCH: Provider credentials do not belong to the invocation tenant.');
    const orgId = tenant || credentials?.organizationId || 'TENANT-DEFAULT';

    if (!token) throw new Error('TOOL_PROVIDER_CREDENTIALS_MISSING: Remote scanner token is required.');
    this.callCount++;
    const response = await fetch(`${baseUrl}/api/v1/scans/run`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'X-Organization-Id': orgId
          },
          body: JSON.stringify(payload || { targetRepo: 'github.com/complypro/demo' })
    });
    if (!response.ok) throw new Error(`TOOL_PROVIDER_HTTP_ERROR: HTTP ${response.status}`);
    return response.json();
  }
}

export class ToolGateway {
  // SEC-P1: Tool Gateway credential vault — private to server, NEVER accessible inside IsolatedWorker
  private static credentialVault: Map<string, ToolProviderCredentials> = new Map();
  private static providers: Map<string, ToolProviderAdapter> = new Map();
  private static activeSessions: Map<string, {
    context: ToolInvocationContext;
    gateId?: string;
    status: 'PAUSED' | 'APPROVED' | 'REJECTED' | 'COMPLETED' | 'CLAIMED_FOR_EXECUTION' | 'BLOCKED' | 'FAILED';
  }> = new Map();

  static {
    // Register standard CompliancePRO REST Provider
    const compProvider = new CompliancePROToolProvider();
    this.registerProvider(compProvider);

    // Load credentials from environment into Gateway boundary if present
    if (process.env.COMPLIANCEPRO_API_KEY) {
      this.setProviderCredentials('compliancepro-api', {
        apiKey: process.env.COMPLIANCEPRO_API_KEY,
        endpoint: process.env.COMPLIANCEPRO_ENDPOINT || 'https://compliancepro-h6xb.onrender.com'
      });
    }
  }

  public static registerProvider(adapter: ToolProviderAdapter): void {
    this.providers.set(adapter.providerId, adapter);
  }

  public static unregisterProvider(providerId: string): void {
    this.providers.delete(providerId);
  }

  public static setProviderCredentials(providerId: string, creds: ToolProviderCredentials): void {
    this.credentialVault.set(providerId, { ...creds });
  }

  public static clearCredentials(): void {
    this.credentialVault.clear();
  }

  public static getProvider(providerId: string): ToolProviderAdapter | undefined {
    return this.providers.get(providerId);
  }

  private static async finishResume(session: {context: ToolInvocationContext}, response: ToolExecutionResponse): Promise<ToolExecutionResponse> {
    const tenant = session.context.tenantId || session.context.passport.tenantId || 'TENANT-DEFAULT';
    await EvidenceLedger.flushPendingWrites(tenant);
    const saved = DurableStore.getExecutionSession(response.executionId,tenant);
    if (saved) {
      const terminal = {executionId:saved.execution_id,agentId:saved.agent_id,runtimeId:saved.runtime_id,
        passportId:saved.passport_id,status:response.status,tenantId:tenant,gateId:saved.gate_id,
        pendingCapability:saved.pending_capability,pendingContext:saved.pending_context,
        toolExecutionCount:saved.tool_execution_count + (response.status === 'COMPLETED' ? 1 : 0),
        createdAt:saved.created_at,updatedAt:new Date().toISOString()};
      if (process.env.NODE_ENV === 'production') await DurableStore.saveExecutionSessionAsync(terminal,tenant);
      else DurableStore.saveExecutionSession(terminal,tenant);
    } else if (process.env.NODE_ENV === 'production') throw new Error('DURABLE_EXECUTION_AUTHORITY_UNAVAILABLE');
    return response;
  }

  /**
   * Invokes a tool capability under strict ComplyPRO Gateway perimeter controls.
   */
  public static async invokeTool(context: ToolInvocationContext): Promise<ToolExecutionResponse> {
    const startTime = Date.now();
    const executionId = context.executionId || `exec_tool_${crypto.randomBytes(4).toString('hex')}`;
    context = {...context,executionId};
    const evidenceTenant = context.tenantId || context.passport?.tenantId || 'TENANT-DEFAULT';
    await EvidenceLedger.prepareTenant(evidenceTenant);

    // 1. Validation of Context
    if (!context.agentId || !context.passport || !context.capability || !context.action) {
      throw new Error('INVALID_TOOL_INVOCATION: agentId, passport, capability, and action are required');
    }

    // 2. Resolve matching Governed Capability from CapabilityRegistry
    const capability = CapabilityRegistry.get(context.capability);
    const providerId = capability?.provider || 'default-tool-provider';

    // 3. Resolve Matching Compliance Profile
    const profile = ComplianceProfileRegistry.getAllProfiles().find(
      p => p.checksum === context.passport.complianceProfileChecksum
    );
    const profileId = profile?.profileId || 'UNKNOWN_PROFILE';

    if (!capability || capability.channel !== 'TOOL' || !capability.allowedActions.includes(context.action)) {
      const error = !capability || capability.channel !== 'TOOL'
        ? `UNKNOWN_OR_INVALID_TOOL_CAPABILITY: Capability [${context.capability}] is not declared in the registered tool capabilities.`
        : `FORBIDDEN_ACTION: ${context.action} is not allowed for ${context.capability}`;
      EvidenceLedger.append({
        evidenceId: `ev_terr_${crypto.randomBytes(4).toString('hex')}`,
        timestamp: new Date().toISOString(), eventType: 'TOOL_ERROR', executionId, agentId: context.agentId,
        passportFingerprint: context.passport.passportFingerprint, complianceProfileId: profileId,
        complianceProfileChecksum: context.passport.complianceProfileChecksum,
        channel: 'TOOL', capability: context.capability, action: context.action,
        verdict: 'BLOCK', executionResult: 'BLOCKED',
        payloadDigest: crypto.createHash('sha256').update(error).digest('hex')
      }, context.tenantId || context.passport.tenantId);
      await EvidenceLedger.flushPendingWrites(evidenceTenant);
      return {
        status: 'BLOCKED', verdict: 'BLOCK', executionId, capability: context.capability,
        provider: providerId, latencyMs: Date.now() - startTime, decisionLatencyMs: 0,
        providerCallCount: 0, error
      };
    }

    // 4. Safe Payload Digest
    const requestDigest = crypto.createHash('sha256')
      .update(canonicalizeJson({
        capability: context.capability,
        action: context.action,
        payload: context.payload || {},
        provider: providerId
      }))
      .digest('hex');

    // 5. Emit TOOL_REQUEST in Evidence Ledger
    EvidenceLedger.append({
      evidenceId: `ev_treq_${crypto.randomBytes(4).toString('hex')}`,
      timestamp: new Date().toISOString(),
      eventType: 'TOOL_REQUEST',
      executionId,
      agentId: context.agentId,
      passportFingerprint: context.passport.passportFingerprint,
      complianceProfileId: profileId,
      complianceProfileChecksum: context.passport.complianceProfileChecksum,
      channel: 'TOOL',
      capability: context.capability,
      action: context.action,
      verdict: 'ALLOW',
      payloadDigest: requestDigest
    }, evidenceTenant);

    if (!profile) {
      const errorMsg = `UNRESOLVED_COMPLIANCE_PROFILE: Profile checksum "${context.passport.complianceProfileChecksum}" could not be matched`;
      EvidenceLedger.append({
        evidenceId: `ev_terr_${crypto.randomBytes(4).toString('hex')}`,
        timestamp: new Date().toISOString(),
        eventType: 'TOOL_ERROR',
        executionId,
        agentId: context.agentId,
        passportFingerprint: context.passport.passportFingerprint,
        complianceProfileId: profileId,
        complianceProfileChecksum: context.passport.complianceProfileChecksum,
        channel: 'TOOL',
        capability: context.capability,
        action: context.action,
        verdict: 'BLOCK',
        executionResult: 'FAILED',
        payloadDigest: crypto.createHash('sha256').update(errorMsg).digest('hex')
      }, evidenceTenant);
      await EvidenceLedger.flushPendingWrites(evidenceTenant);
      return {
        status: 'FAILED',
        verdict: 'BLOCK',
        executionId,
        capability: context.capability,
        provider: providerId,
        latencyMs: Date.now() - startTime,
        decisionLatencyMs: 0,
        providerCallCount: 0,
        error: errorMsg
      };
    }

    // 6. Guardian Policy Evaluation
    const guardianVerdict = GuardianService.evaluateToolExecution({
      agent: {
        id: context.agentId,
        name: context.passport.runtime?.framework ? `${context.passport.runtime.framework}-agent` : 'governed-agent',
        version: context.passport.runtime?.frameworkVersion
      },
      passport: {
        ...context.passport,
        tenantId: context.passport.tenantId || context.tenantId
      },
      complianceProfile: profile,
      toolName: context.capability,
      actionType: context.action,
      payload: context.payload,
      context: {
        tenantId: context.tenantId || context.passport.tenantId
      }
    });

    const decisionLatencyMs = guardianVerdict.decisionLatencyMs;

    // 7. Handle Guardian Decisions
    if (guardianVerdict.verdict === 'BLOCK' || guardianVerdict.verdict === 'CIRCUIT_BREAK') {
      EvidenceLedger.append({
        evidenceId: `ev_terr_${crypto.randomBytes(4).toString('hex')}`,
        timestamp: new Date().toISOString(),
        eventType: 'TOOL_ERROR',
        executionId,
        agentId: context.agentId,
        passportFingerprint: context.passport.passportFingerprint,
        complianceProfileId: profileId,
        complianceProfileChecksum: context.passport.complianceProfileChecksum,
        channel: 'TOOL',
        capability: context.capability,
        action: context.action,
        verdict: guardianVerdict.verdict,
        executionResult: 'BLOCKED',
        payloadDigest: crypto.createHash('sha256').update(guardianVerdict.reason).digest('hex')
      }, evidenceTenant);
      await EvidenceLedger.flushPendingWrites(evidenceTenant);
      return {
        status: 'BLOCKED',
        verdict: guardianVerdict.verdict,
        executionId,
        capability: context.capability,
        provider: providerId,
        latencyMs: Date.now() - startTime,
        decisionLatencyMs,
        providerCallCount: 0,
        error: guardianVerdict.reason
      };
    }

    if (guardianVerdict.verdict === 'REQUIRE_HITL') {
      this.activeSessions.set(executionId, {
        context,
        gateId: guardianVerdict.gateId,
        status: 'PAUSED'
      });

      const tenantId = context.tenantId || context.passport.tenantId || 'TENANT-DEFAULT';
      const pausedSession = {
          executionId,
          agentId: context.agentId,
          runtimeId: context.runtimeId || 'rt_unbound',
          passportId: context.passportId || context.passport.passportId,
          status: 'PAUSED' as const,
          toolExecutionCount: 0,
          gateId: guardianVerdict.gateId,
          pendingCapability: context.capability,
          pendingContext: context,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          tenantId
      };
      if (process.env.NODE_ENV === 'production') {
        await DurableStore.saveExecutionSessionAsync(pausedSession, tenantId);
        await DurableStore.saveHitlRequestAsync({ gateId: guardianVerdict.gateId!, executionId, tenantId,
          agentId: context.agentId, capability: context.capability, actionType: context.action, payload: context.payload });
      } else {
        DurableStore.saveExecutionSession(pausedSession, tenantId);
        DurableStore.saveHitlRequest({ gateId: guardianVerdict.gateId!, executionId, tenantId,
          agentId: context.agentId, capability: context.capability, actionType: context.action, payload: context.payload });
      }
      EvidenceLedger.append({ evidenceId: `ev_hitl_request_${crypto.randomUUID()}`, timestamp: new Date().toISOString(),
        eventType: 'HITL_REQUEST', executionId, agentId: context.agentId, passportFingerprint: context.passport.passportFingerprint,
        complianceProfileId: profileId, complianceProfileChecksum: context.passport.complianceProfileChecksum,
        capability: context.capability, action: context.action, verdict: 'REQUIRE_HITL' }, tenantId);
      await EvidenceLedger.flushPendingWrites(tenantId);

      return {
        status: 'PAUSED',
        verdict: 'REQUIRE_HITL',
        gateId: guardianVerdict.gateId,
        executionId,
        capability: context.capability,
        provider: providerId,
        latencyMs: Date.now() - startTime,
        decisionLatencyMs,
        providerCallCount: 0,
        error: guardianVerdict.reason
      };
    }

    // 8. ALLOW: Dispatch to Real Provider
    const adapter = this.providers.get(providerId);
    const creds = this.credentialVault.get(providerId);

    let executionResult: any;
    let providerCallCount = 0;
    try {
      await EvidenceLedger.flushPendingWrites(evidenceTenant);
      await DurableStore.requireExecutionAuthority(context);
      if (!adapter) throw new Error(`TOOL_PROVIDER_UNAVAILABLE: ${providerId}`);
      providerCallCount = 1;
      executionResult = await adapter.execute(context.capability, context.action, context.payload, context, creds);
      if (executionResult?.ok === false || executionResult?.status === 'FAILED' || executionResult?.executed === false)
        throw new Error('TOOL_PROVIDER_EXECUTION_FAILED: Provider did not confirm success.');
    } catch (toolErr: any) {
      const errorMsg = `TOOL_PROVIDER_ERROR: ${toolErr.message}`;
      const denied = toolErr.message?.startsWith('CURRENT_EXECUTION_AUTHORITY_DENIED');
      EvidenceLedger.append({
        evidenceId: `ev_terr_${crypto.randomBytes(4).toString('hex')}`,
        timestamp: new Date().toISOString(),
        eventType: 'TOOL_ERROR',
        executionId,
        agentId: context.agentId,
        passportFingerprint: context.passport.passportFingerprint,
        complianceProfileId: profileId,
        complianceProfileChecksum: context.passport.complianceProfileChecksum,
        channel: 'TOOL',
        capability: context.capability,
        action: context.action,
        verdict: 'BLOCK',
        executionResult: denied ? 'BLOCKED' : 'FAILED',
        payloadDigest: crypto.createHash('sha256').update(errorMsg).digest('hex')
      }, evidenceTenant);
      await EvidenceLedger.flushPendingWrites(evidenceTenant);

      return {
        status: denied ? 'BLOCKED' : 'FAILED',
        verdict: 'BLOCK',
        executionId,
        capability: context.capability,
        provider: providerId,
        latencyMs: Date.now() - startTime,
        decisionLatencyMs,
        providerCallCount,
        error: errorMsg
      };
    }

    // 9. Emit TOOL_RESPONSE in Evidence Ledger
    const resultDigest = crypto.createHash('sha256')
      .update(canonicalizeJson({
        capability: context.capability,
        provider: providerId,
        resultSummary: typeof executionResult === 'object' ? Object.keys(executionResult) : 'scalar'
      }))
      .digest('hex');

    EvidenceLedger.append({
      evidenceId: `ev_tres_${crypto.randomBytes(4).toString('hex')}`,
      timestamp: new Date().toISOString(),
      eventType: 'TOOL_RESPONSE',
      executionId,
      agentId: context.agentId,
      passportFingerprint: context.passport.passportFingerprint,
      complianceProfileId: profileId,
      complianceProfileChecksum: context.passport.complianceProfileChecksum,
      channel: 'TOOL',
      capability: context.capability,
      action: context.action,
      verdict: 'ALLOW',
      executionResult: 'SUCCESS',
      payloadDigest: resultDigest
    }, evidenceTenant);
    await EvidenceLedger.flushPendingWrites(evidenceTenant);

    return {
      status: 'COMPLETED',
      verdict: 'ALLOW',
      executionId,
      capability: context.capability,
      provider: providerId,
      result: executionResult,
      latencyMs: Date.now() - startTime,
      decisionLatencyMs,
      providerCallCount: 1
    };
  }

  /**
   * Resumes a paused execution following a Human-in-the-Loop decision.
   */
  public static async resumeExecution(
    executionId: string,
    decision: 'APPROVED' | 'REJECTED',
    operatorId: string
  ): Promise<ToolExecutionResponse> {
    let session = this.activeSessions.get(executionId);
    if (!session) {
      const saved = DurableStore.getExecutionSession(executionId);
      const raw = saved?.pending_context as ToolInvocationContext | undefined;
      const passport = raw?.passport || (saved && DurableStore.getPassport(saved.passport_id, saved.tenant_id)?.runtime_spec?.passportSnapshot);
      const context = raw && passport ? { ...raw, passport, tenantId: saved?.tenant_id } : undefined;
      if (saved?.status === 'PAUSED' && context?.passport && context.executionId === executionId &&
          context.passport.tenantId === saved.tenant_id) {
        session = { context, gateId: saved.gate_id, status: 'PAUSED' };
        this.activeSessions.set(executionId, session);
      }
    }
    if (!session) {
      throw new Error(`UNKNOWN_EXECUTION_SESSION: Execution session "${executionId}" not found in Tool Gateway`);
    }

    // 1. Process-local early guard
    if (session.status !== 'PAUSED') {
      throw new Error(`ILLEGAL_SESSION_STATE: Session "${executionId}" is not in PAUSED state`);
    }

    const tenantId = session.context.tenantId || session.context.passport.tenantId || 'TENANT-DEFAULT';
    await EvidenceLedger.prepareTenant(tenantId);

    // 2. Authoritative durable conditional claim (Multi-instance / Cluster atomic CAS)
    const claim = await DurableStore.claimExecutionSessionConditional(executionId, tenantId);
    if (!claim.success || claim.affectedRows === 0) {
      session.status = 'CLAIMED_FOR_EXECUTION';
      throw new Error(`ILLEGAL_SESSION_STATE: Session "${executionId}" could not be claimed for execution (already claimed or not in PAUSED state)`);
    }
    session.status = 'CLAIMED_FOR_EXECUTION';

    const timestamp = new Date().toISOString();
    const profile = ComplianceProfileRegistry.getAllProfiles().find(
      p => p.checksum === session.context.passport.complianceProfileChecksum
    );
    const profileId = profile?.profileId || 'UNKNOWN_PROFILE';

    // Mandatory Passport / Runtime Revocation Check
    let isRevoked = false;
    let revocationReason = '';

    const signature = profile && PassportSigner.verify(session.context.passport.passportFingerprint,
      PassportSigner.toSignInput(session.context.passport, session.context.agentId, profile.version));
    if (!signature?.valid) {
      isRevoked = true;
      revocationReason = signature?.reason || 'Unresolved compliance profile on HITL resume';
    }

    if ((session.context.passport.status as string) === 'REVOKED') {
      isRevoked = true;
      revocationReason = 'Passport status is REVOKED';
    }

    if (process.env.NODE_ENV === 'production') {
      const currentPassport = DurableStore.getPassport(session.context.passportId,tenantId);
      const currentRuntime = DurableStore.getRuntime(session.context.runtimeId,tenantId);
      if (!currentPassport || currentPassport.status !== session.context.passport.status ||
          currentPassport.passport_fingerprint !== session.context.passport.passportFingerprint ||
          !currentRuntime || currentRuntime.status !== 'RUNNING') {
        isRevoked = true;
        revocationReason = 'Current durable Passport/runtime no longer authorizes execution';
      }
    }

    if (!isRevoked && session.context.runtimeId) {
      try {
        const instance = RuntimeManager.getInstance(session.context.runtimeId);
        if (instance && (instance.status === 'REVOKED' || instance.status === 'STOPPED' || instance.status === 'FAILED')) {
          isRevoked = true;
          revocationReason = `Runtime [${session.context.runtimeId}] has been REVOKED: ${instance.error || 'Revoked during pause'}`;
        }
      } catch {
        // Fallback
      }
    }

    if (!isRevoked) {
      const riskProfile = ContinuousRiskDetector.getProfile(tenantId, session.context.agentId);
      if (riskProfile.isSuspended) {
        isRevoked = true;
        revocationReason = `Agent [${session.context.agentId}] is SUSPENDED by Continuous Guardian`;
      }
    }

    if (isRevoked) {
      session.status = 'BLOCKED';
      EvidenceLedger.append({
        evidenceId: `ev_blk_${crypto.randomBytes(4).toString('hex')}`,
        timestamp: new Date().toISOString(),
        eventType: 'AGENT_EXECUTION_BLOCKED',
        executionId,
        agentId: session.context.agentId,
        passportFingerprint: session.context.passport.passportFingerprint,
        complianceProfileId: profileId,
        complianceProfileChecksum: session.context.passport.complianceProfileChecksum,
        action: session.context.action,
        capability: session.context.capability,
        verdict: 'BLOCK',
        executionResult: 'BLOCKED',
        payloadDigest: crypto.createHash('sha256').update(revocationReason).digest('hex')
      }, tenantId);

      return this.finishResume(session, {
        status: 'BLOCKED',
        verdict: 'BLOCK',
        executionId,
        capability: session.context.capability,
        provider: 'governed-provider',
        latencyMs: 1,
        decisionLatencyMs: 1,
        providerCallCount: 0,
        error: `EXECUTION_ABORTED_REVOKED: ${revocationReason}`
      });
    }

    const latestAuthorization = GuardianService.evaluateToolExecution({
      agent: { id: session.context.agentId, name: session.context.agentId },
      passport: session.context.passport, complianceProfile: profile!,
      toolName: session.context.capability, actionType: session.context.action,
      payload: session.context.payload, context: { tenantId }
    });
    if (latestAuthorization.verdict === 'BLOCK' || latestAuthorization.verdict === 'CIRCUIT_BREAK') {
      session.status = 'BLOCKED';
      return this.finishResume(session, { status: 'BLOCKED', verdict: 'BLOCK', executionId, capability: session.context.capability,
        provider: 'governed-provider', latencyMs: 0, decisionLatencyMs: latestAuthorization.decisionLatencyMs,
        providerCallCount: 0, error: latestAuthorization.reason });
    }
    if (process.env.NODE_ENV === 'production') await DurableStore.saveHitlDecisionAsync({
      gateId: session.gateId!, executionId, tenantId, decidedBy: operatorId, decision
    });
    else DurableStore.saveHitlDecision({ gateId: session.gateId!, executionId, tenantId, decidedBy: operatorId, decision });

    // 1. Emit HITL_DECISION in Evidence Ledger
    EvidenceLedger.append({
      evidenceId: `ev_hitl_${crypto.randomBytes(4).toString('hex')}`,
      timestamp,
      eventType: 'HITL_DECISION',
      executionId,
      agentId: session.context.agentId,
      passportFingerprint: session.context.passport.passportFingerprint,
      complianceProfileId: profileId,
      complianceProfileChecksum: session.context.passport.complianceProfileChecksum,
      operatorId,
      operatorDecision: decision,
      payloadDigest: crypto.createHash('sha256').update(JSON.stringify({ gateId: session.gateId, decision })).digest('hex')
    }, tenantId);

    if (decision === 'REJECTED') {
      session.status = 'REJECTED';
      EvidenceLedger.append({
        evidenceId: `ev_blk_${crypto.randomBytes(4).toString('hex')}`,
        timestamp: new Date().toISOString(),
        eventType: 'AGENT_EXECUTION_BLOCKED',
        executionId,
        agentId: session.context.agentId,
        passportFingerprint: session.context.passport.passportFingerprint,
        complianceProfileId: profileId,
        complianceProfileChecksum: session.context.passport.complianceProfileChecksum,
        action: session.context.action,
        capability: session.context.capability,
        verdict: 'BLOCK',
        executionResult: 'BLOCKED',
        payloadDigest: crypto.createHash('sha256').update('EXECUTION_REJECTED_BY_OPERATOR').digest('hex')
      }, tenantId);

      return this.finishResume(session, {
        status: 'BLOCKED',
        verdict: 'BLOCK',
        executionId,
        capability: session.context.capability,
        provider: 'governed-provider',
        latencyMs: 1,
        decisionLatencyMs: 1,
        providerCallCount: 0,
        error: 'EXECUTION_REJECTED_BY_OPERATOR'
      });
    }

    // APPROVED: Execute tool now
    session.status = 'APPROVED';
    EvidenceLedger.append({evidenceId:`ev_resume_${crypto.randomUUID()}`,timestamp:new Date().toISOString(),
      eventType:'AGENT_EXECUTION_RESUMED',executionId,agentId:session.context.agentId,
      passportFingerprint:session.context.passport.passportFingerprint,complianceProfileId:profileId,
      complianceProfileChecksum:session.context.passport.complianceProfileChecksum,
      capability:session.context.capability,operatorId},tenantId);
    const capability = CapabilityRegistry.get(session.context.capability);
    const providerId = capability?.provider || 'default-tool-provider';
    const adapter = this.providers.get(providerId);
    const creds = this.credentialVault.get(providerId);

    let executionResult: any;
    let providerCallCount = 0;
    try {
      await EvidenceLedger.flushPendingWrites(tenantId);
      await DurableStore.requireExecutionAuthority(session.context);
      if (!adapter) throw new Error(`TOOL_PROVIDER_UNAVAILABLE: ${providerId}`);
      providerCallCount = 1;
      executionResult = await adapter.execute(session.context.capability, session.context.action, session.context.payload, session.context, creds);
      if (executionResult?.ok === false || executionResult?.status === 'FAILED' || executionResult?.executed === false)
        throw new Error('TOOL_PROVIDER_EXECUTION_FAILED');
    } catch (err: any) {
      session.status = 'FAILED';
      EvidenceLedger.append({ evidenceId: `ev_error_${crypto.randomUUID()}`, timestamp: new Date().toISOString(),
        eventType: 'TOOL_ERROR', executionId, agentId: session.context.agentId,
        passportFingerprint: session.context.passport.passportFingerprint, complianceProfileId: profileId,
        complianceProfileChecksum: session.context.passport.complianceProfileChecksum,
        capability: session.context.capability, verdict: 'BLOCK', executionResult: 'FAILED' }, tenantId);
      return this.finishResume(session, { status: 'FAILED', verdict: 'BLOCK', executionId, capability: session.context.capability,
        provider: providerId, latencyMs: 0, decisionLatencyMs: latestAuthorization.decisionLatencyMs,
        providerCallCount, error: err.message });
    }

    // Emit TOOL_RESPONSE
    EvidenceLedger.append({
      evidenceId: `ev_tres_${crypto.randomBytes(4).toString('hex')}`,
      timestamp: new Date().toISOString(),
      eventType: 'TOOL_RESPONSE',
      executionId,
      agentId: session.context.agentId,
      passportFingerprint: session.context.passport.passportFingerprint,
      complianceProfileId: profileId,
      complianceProfileChecksum: session.context.passport.complianceProfileChecksum,
      channel: 'TOOL',
      capability: session.context.capability,
      action: session.context.action,
      verdict: 'ALLOW',
      executionResult: 'SUCCESS',
      payloadDigest: crypto.createHash('sha256').update(JSON.stringify(executionResult)).digest('hex')
    }, tenantId);
    await EvidenceLedger.flushPendingWrites(tenantId);

    // Mark session completed to enforce execute exactly once invariant
    session.status = 'COMPLETED';

    return this.finishResume(session, {
      status: 'COMPLETED',
      verdict: 'ALLOW',
      executionId,
      capability: session.context.capability,
      provider: providerId,
      result: { ...executionResult, authorizedBy: operatorId, approvedGateId: session.gateId },
      latencyMs: 5,
      decisionLatencyMs: 1,
      providerCallCount: 1
    });
  }
}
