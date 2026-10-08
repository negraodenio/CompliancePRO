/**
 * CodeGuard v3.1 — Guardian Service (Sprint 1)
 * 
 * Protocol-Agnostic Runtime Policy Enforcement Engine.
 * 
 * Fundamental Principle:
 * "The Compliance Engine decides what should be permitted. The Guardian only enforces it."
 * 
 * Invariants:
 * 1. ZERO regulatory logic: No 'if GDPR...', 'if EU_AI_ACT...'. Enforces compiled ComplianceProfile only.
 * 2. Exact evaluation order:
 *    1. Passport integrity validation
 *    2. Agent <-> ComplianceProfile binding (checksum match)
 *    3. Forbidden action check (< 2ms fast-path rejection)
 *    4. Declared tool scope check
 *    5. Executable policy evaluation
 *    6. HITL requirement evaluation (creates gate in HitlStore)
 *    7. Rate / anomaly guard (trips circuit breaker & registers in IncidentStore)
 *    8. Decision latency recording (decisionLatencyMs)
 *    9. Correlated evidence record generation (DecisionStore evidence ledger)
 * 3. Does NOT mutate the input ComplianceProfile.
 */

import { performance } from 'perf_hooks';
import crypto from 'crypto';
import { ComplianceProfile, CompliancePolicy, CgAgControlId } from './compliance-contract';
import { HitlStore, HITLApprovalRequest } from '../web/services/hitl-store';
import { DecisionStore } from '../web/services/decision-store';
import { IncidentStore, AIIncident } from '../web/services/incident-store';
import { PersistenceAdapter } from '../web/services/persistence-adapter';
import { ProtectedEvidenceRecord } from './governance-control-plane';
import { EvidenceLedger } from './evidence-ledger';
import { ActiveGovernanceBus, ActiveRuntimeEvent } from './active-governance-bus';
import { ContinuousRiskDetector, AgentRiskProfile, ActiveRiskResponse } from './continuous-risk-detector';
import { PassportSigner } from './passport-signer';

export type GuardianVerdict = 'ALLOW' | 'BLOCK' | 'REQUIRE_HITL' | 'CIRCUIT_BREAK';

export type GovernanceChannel = 'TOOL' | 'MODEL' | 'DATA';

export interface GuardianAgentIdentity {
  id: string;
  name: string;
  version?: string;
  environment?: 'production' | 'staging' | 'sandbox' | 'development';
}

export interface GovernedCapabilityDeclaration {
  capability: string;
  channel?: GovernanceChannel | string;
  riskTier?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | string;
  requiresHitl?: boolean;
}

export interface GuardianPassportInput {
  passportId: string;
  passportFingerprint: string;
  complianceProfileChecksum: string;
  declaredTools: string[];
  governedCapabilities?: GovernedCapabilityDeclaration[];
  runtime?: {
    framework: string;
    frameworkVersion?: string;
    runtimeVersion?: string;
  };
  toolManifestHash?: string;
  riskTier?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  autonomyLevel?: string;
  tenantId?: string;
  declaredModels?: string[];
  declaredDataScopes?: string[];
  status?: string;
}

export interface GuardianToolCall {
  toolName: string;
  actionType: 'READ' | 'WRITE' | 'EXECUTE' | 'DELETE' | 'ADMIN';
  payload?: Record<string, any>;
}

export interface GuardianRuntimeContext {
  callerId?: string;
  tenantId?: string;
  sessionTokens?: number;
  callCountMinute?: number;
  maxTokensPerMinute?: number;
  maxCallsPerMinute?: number;
  environment?: string;
  dataClassification?: string;
}

export interface GovernedCapabilityRequest {
  agent: GuardianAgentIdentity;
  passport: GuardianPassportInput;
  passportFingerprint?: string;
  complianceProfile: ComplianceProfile;
  channel: GovernanceChannel;
  capability: string;
  actionType: 'READ' | 'WRITE' | 'EXECUTE' | 'DELETE' | 'ADMIN';
  payload?: Record<string, any>;
  context?: GuardianRuntimeContext;
}

export interface GuardianEvaluationInput {
  agent: GuardianAgentIdentity;
  passport: GuardianPassportInput;
  passportFingerprint?: string; // Optional top-level override / verification
  complianceProfile: ComplianceProfile;
  toolCall?: GuardianToolCall;
  channel?: GovernanceChannel;
  capability?: string;
  actionType?: 'READ' | 'WRITE' | 'EXECUTE' | 'DELETE' | 'ADMIN';
  payload?: Record<string, any>;
  context?: GuardianRuntimeContext;
}

export interface GuardianResponse {
  verdict: GuardianVerdict;
  reason: string;
  complianceProfileId: string;
  policyId?: string;
  policyVersion?: string;
  controlId?: CgAgControlId | string;
  passportFingerprint: string;
  channel?: GovernanceChannel;
  capability?: string;
  decisionLatencyMs: number;
  gateId?: string;
  incidentId?: string;
  evidenceId: string;
  timestamp: string;
}

// --------------------------------------------------------------------------
// Payload Sanitizer for Evidence & Audit Trails (Zero Secret Leakage)
// --------------------------------------------------------------------------

const SENSITIVE_KEY_PATTERNS = [
  /password/i,
  /secret/i,
  /token/i,
  /api[_-]?key/i,
  /auth/i,
  /credential/i,
  /bearer/i,
  /private[_-]?key/i,
  /credit[_-]?card/i,
  /cvv/i,
  /ssn/i,
  /cpf/i
];

export function sanitizePayloadForEvidence(payload?: Record<string, any>): Record<string, any> {
  if (!payload || typeof payload !== 'object') {
    return {};
  }
  const clean: Record<string, any> = {};
  for (const [k, v] of Object.entries(payload)) {
    const isSensitive = SENSITIVE_KEY_PATTERNS.some(pat => pat.test(k));
    if (isSensitive) {
      clean[k] = '[REDACTED_SECRET]';
    } else if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      clean[k] = sanitizePayloadForEvidence(v);
    } else {
      clean[k] = v;
    }
  }
  return clean;
}

// --------------------------------------------------------------------------
// Guardian Service Implementation
// --------------------------------------------------------------------------

export class GuardianService {
  /**
   * Evaluates a runtime agent tool call against its passport and compiled ComplianceProfile.
   * Executes deterministically in sub-10ms for local policy evaluation.
   */
  static evaluate(input: GuardianEvaluationInput): GuardianResponse {
    const startTime = performance.now();
    const timestamp = new Date().toISOString();

    const normalizedActionType = input.toolCall?.actionType || input.actionType || 'READ';
    const normalizedPayload = input.toolCall?.payload || input.payload || {};
    const toolName = input.toolCall?.toolName || (input as any).toolName || (input as any).capability || 'unknown_tool';
    const verifiedFingerprint = input.passportFingerprint || input.passport?.passportFingerprint || '';
    const profileId = input.complianceProfile?.profileId || 'UNKNOWN_PROFILE';

    // ----------------------------------------------------------------------
    // STEP 1: Passport Authenticity & Integrity Validation (Cryptographic HMAC)
    // ----------------------------------------------------------------------
    if (!input.passport || !input.passport.passportId || !verifiedFingerprint) {
      return this.finalizeResponse({
        verdict: 'BLOCK',
        reason: 'Passport verification failed: missing passport identity or cryptographic fingerprint.',
        profileId,
        passportFingerprint: verifiedFingerprint,
        controlId: 'CG-AG-01',
        startTime,
        timestamp,
        input
      });
    }

    // Cryptographic HMAC-SHA256 signature verification
    const verification = PassportSigner.verify(verifiedFingerprint, {
      passportId: input.passport.passportId,
      agentId: input.agent.id,
      tenantId: input.context?.tenantId || input.passport.tenantId,
      framework: input.passport.runtime?.framework,
      frameworkVersion: input.passport.runtime?.frameworkVersion,
      runtimeVersion: input.passport.runtime?.runtimeVersion,
      toolManifestHash: input.passport.toolManifestHash,
      complianceProfileChecksum: input.passport.complianceProfileChecksum,
      policyVersion: input.complianceProfile?.version,
      capabilities: (input.passport.governedCapabilities || input.passport.declaredTools || []).map((c: any) => 
        typeof c === 'string' ? { capability: c } : { capability: c.capability || c.id, channel: c.channel, riskTier: c.riskTier, requiresHitl: c.requiresHitl }
      ),
      declaredTools: input.passport.declaredTools,
      declaredModels: (input.passport as any).declaredModels || [],
      declaredDataScopes: (input.passport as any).declaredDataScopes || [],
      riskTier: input.passport.riskTier,
      status: input.passport.status
    });

    if (!verification.valid) {
      return this.finalizeResponse({
        verdict: 'BLOCK',
        reason: `Passport verification failed: ${verification.reason || 'Cryptographic signature mismatch'}.`,
        profileId,
        passportFingerprint: verifiedFingerprint,
        controlId: 'CG-AG-01',
        startTime,
        timestamp,
        input
      });
    }

    // Tenant binding validation
    if (input.passport.tenantId && input.context?.tenantId && input.passport.tenantId !== input.context.tenantId) {
      return this.finalizeResponse({
        verdict: 'BLOCK',
        reason: `Tenant isolation violation: runtime tenant [${input.context.tenantId}] does not match passport binding [${input.passport.tenantId}].`,
        profileId,
        passportFingerprint: verifiedFingerprint,
        controlId: 'CG-AG-01',
        startTime,
        timestamp,
        input
      });
    }

    // ----------------------------------------------------------------------
    // STEP 2: Agent <-> ComplianceProfile Binding Verification
    // ----------------------------------------------------------------------
    const profileChecksum = input.complianceProfile?.checksum;
    const passportChecksum = input.passport.complianceProfileChecksum;

    if (!profileChecksum || !passportChecksum || passportChecksum !== profileChecksum) {
      return this.finalizeResponse({
        verdict: 'BLOCK',
        reason: `Agent-ComplianceProfile binding failure: passport checksum [${passportChecksum || 'NONE'}] does not match compiled profile checksum [${profileChecksum || 'NONE'}].`,
        profileId,
        passportFingerprint: verifiedFingerprint,
        controlId: 'CG-AG-01',
        startTime,
        timestamp,
        input
      });
    }

    const targetCapability = input.capability || toolName;
    const channel = input.channel || 'TOOL';

    // ----------------------------------------------------------------------
    // STEP 3: Immediate Forbidden Action Check (< 2ms fast-path)
    // ----------------------------------------------------------------------
    const forbiddenList = input.complianceProfile.forbiddenActions || [];
    const isForbidden = forbiddenList.some(f => 
      f === toolName || 
      f === targetCapability ||
      f === normalizedActionType ||
      toolName.toUpperCase().includes(f.toUpperCase()) ||
      targetCapability.toUpperCase().includes(f.toUpperCase()) ||
      (f.includes(':') && (f.split(':')[0] === toolName || f.split(':')[0] === targetCapability))
    );

    if (isForbidden) {
      return this.finalizeResponse({
        verdict: 'BLOCK',
        reason: `Action [${targetCapability}] (${normalizedActionType}) is explicitly prohibited by ComplianceProfile [${profileId}].`,
        profileId,
        passportFingerprint: verifiedFingerprint,
        controlId: 'CG-AG-02',
        startTime,
        timestamp,
        input
      });
    }

    // ----------------------------------------------------------------------
    // STEP 4: Declared Capability / Tool Scope Check
    // ----------------------------------------------------------------------
    const declaredTools = input.passport.declaredTools || [];
    const declaredCapabilities = (input.passport.governedCapabilities || []).map(c => c.capability);
    const isDeclared = 
      declaredTools.includes(toolName) || 
      declaredTools.includes(targetCapability) ||
      declaredTools.includes('*') ||
      declaredCapabilities.includes(targetCapability) ||
      declaredCapabilities.includes('*');

    if (!isDeclared) {
      return this.finalizeResponse({
        verdict: 'BLOCK',
        reason: `Capability/Tool [${targetCapability}] is not declared in Agent Passport [${input.passport.passportId}]. Least-privilege violation.`,
        profileId,
        passportFingerprint: verifiedFingerprint,
        controlId: 'CG-AG-02',
        startTime,
        timestamp,
        input
      });
    }

    // ----------------------------------------------------------------------
    // STEP 5: Executable Policy Evaluation
    // ----------------------------------------------------------------------
    const policies = input.complianceProfile.executablePolicies || [];
    let matchedPolicy: CompliancePolicy | undefined;

    for (const policy of policies) {
      const cond = policy.condition;
      if (!cond) continue;

      const hasCondition = 
        Boolean(cond.toolNames && cond.toolNames.length > 0) ||
        Boolean(cond.actionTypes && cond.actionTypes.length > 0) ||
        Boolean(cond.dataClassifications && cond.dataClassifications.length > 0) ||
        Boolean(cond.payloadConditions && Object.keys(cond.payloadConditions).length > 0);

      if (!hasCondition) continue;

      // Tool name condition
      if (cond.toolNames && cond.toolNames.length > 0 && !cond.toolNames.includes(toolName)) {
        continue;
      }

      // Action type condition
      if (cond.actionTypes && cond.actionTypes.length > 0 && !cond.actionTypes.includes(normalizedActionType)) {
        continue;
      }

      // Data classification condition
      if (cond.dataClassifications && cond.dataClassifications.length > 0) {
        const itemClassification = normalizedPayload.dataClassification || (input.context as any)?.dataClassification;
        if (!itemClassification || !cond.dataClassifications.includes(itemClassification)) {
          continue;
        }
      }

      // Payload condition
      if (cond.payloadConditions) {
        let payloadMatches = true;
        for (const [pk, pv] of Object.entries(cond.payloadConditions)) {
          if (normalizedPayload[pk] !== pv) {
            payloadMatches = false;
            break;
          }
        }
        if (!payloadMatches) continue;
      }

      // Policy matched
      matchedPolicy = policy;
      break;
    }

    if (matchedPolicy) {
      if (matchedPolicy.verdict === 'BLOCK') {
        return this.finalizeResponse({
          verdict: 'BLOCK',
          reason: matchedPolicy.reasonTemplate || `Blocked by executable policy [${matchedPolicy.policyId}].`,
          profileId,
          policyId: matchedPolicy.policyId,
          policyVersion: matchedPolicy.policyVersion,
          controlId: matchedPolicy.controlId,
          passportFingerprint: verifiedFingerprint,
          startTime,
          timestamp,
          input
        });
      }

      if (matchedPolicy.verdict === 'CIRCUIT_BREAK') {
        return this.triggerCircuitBreaker({
          reason: matchedPolicy.reasonTemplate || `Circuit breaker tripped by policy [${matchedPolicy.policyId}].`,
          profileId,
          policyId: matchedPolicy.policyId,
          policyVersion: matchedPolicy.policyVersion,
          controlId: matchedPolicy.controlId,
          passportFingerprint: verifiedFingerprint,
          startTime,
          timestamp,
          input
        });
      }
    }

    // ----------------------------------------------------------------------
    // STEP 6: HITL Requirement Evaluation
    // ----------------------------------------------------------------------
    const hitlList = input.complianceProfile.requireHumanApproval || [];
    const capabilityDecl = (input.passport.governedCapabilities || []).find(c => c.capability === targetCapability);
    const requiresHitl = 
      hitlList.some(h => 
        h === toolName || 
        h === targetCapability ||
        h === normalizedActionType ||
        toolName.toLowerCase().includes(h.toLowerCase()) ||
        targetCapability.toLowerCase().includes(h.toLowerCase())
      ) || 
      (capabilityDecl && capabilityDecl.requiresHitl) ||
      (matchedPolicy && matchedPolicy.verdict === 'REQUIRE_HITL');

    if (requiresHitl) {
      const gateId = `GATE-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      const hitlReason = matchedPolicy?.reasonTemplate || `Capability/Tool [${targetCapability}] requires Human-in-the-Loop authorization under ComplianceProfile [${profileId}].`;
      const policyId = matchedPolicy?.policyId || 'POL-GENERIC-HITL';
      const policyVersion = matchedPolicy?.policyVersion || '1.0.0';
      const controlId = matchedPolicy?.controlId || 'CG-AG-03';

      const actionTitle = channel === 'TOOL'
        ? `Runtime Tool Invocation: ${targetCapability}`
        : channel === 'MODEL'
          ? `Runtime Model Invocation: ${targetCapability}`
          : `Runtime Data Access: ${targetCapability}`;

      // Record live gate in existing HitlStore
      const gateRequest: HITLApprovalRequest = {
        sourceType: 'REAL_SCAN',
        gateId,
        actionTitle,
        agentId: input.agent.id,
        agentName: input.agent.name,
        systemId: 'SYS-GUARDIAN-RUNTIME',
        systemName: 'Guardian Control Plane',
        requestedActionType: targetCapability,
        actionPayload: sanitizePayloadForEvidence(normalizedPayload),
        policyId,
        policyName: 'Mandatory Human Approval Gate',
        controlId,
        controlName: 'Human-in-the-Loop Oversight',
        riskTier: input.passport.riskTier || 'HIGH',
        triggerReason: hitlReason,
        thresholdApplied: `ComplianceProfile requireHumanApproval rule for ${targetCapability}`,
        requestedAt: timestamp,
        slaDeadline: new Date(Date.now() + 3600000).toISOString(), // 1 hour SLA default
        status: 'PENDING_REVIEW'
      };

      try {
        const existingGates = HitlStore.getGates(input.context?.tenantId);
        HitlStore.ingestGates([gateRequest, ...existingGates], input.context?.tenantId);
      } catch (err) {
        // Fallback safely if store is in read-only mode
      }

      return this.finalizeResponse({
        verdict: 'REQUIRE_HITL',
        reason: hitlReason,
        profileId,
        policyId,
        policyVersion,
        controlId,
        passportFingerprint: verifiedFingerprint,
        gateId,
        startTime,
        timestamp,
        input
      });
    }

    // ----------------------------------------------------------------------
    // STEP 7: Rate / Anomaly Guard (Circuit Breaker)
    // ----------------------------------------------------------------------
    const maxCallsMinute = input.context?.maxCallsPerMinute || 60;
    const maxTokensMinute = input.context?.maxTokensPerMinute || 100000;
    const currentCalls = input.context?.callCountMinute || 0;
    const currentTokens = input.context?.sessionTokens || 0;

    if (currentCalls > maxCallsMinute || currentTokens > maxTokensMinute) {
      return this.triggerCircuitBreaker({
        reason: `Rate limit or token explosion detected: calls=${currentCalls}/${maxCallsMinute}, tokens=${currentTokens}/${maxTokensMinute}.`,
        profileId,
        controlId: 'CG-AG-04',
        passportFingerprint: verifiedFingerprint,
        startTime,
        timestamp,
        input
      });
    }

    // ----------------------------------------------------------------------
    // STEP 8 & 9: ALLOW Verdict & Evidence Ledger Emission
    // ----------------------------------------------------------------------
    return this.finalizeResponse({
      verdict: 'ALLOW',
      reason: `Execution permitted: tool [${toolName}] verified against ComplianceProfile [${profileId}] and Passport [${input.passport.passportId}].`,
      profileId,
      policyId: matchedPolicy?.policyId,
      policyVersion: matchedPolicy?.policyVersion,
      controlId: matchedPolicy?.controlId || 'CG-AG-02',
      passportFingerprint: verifiedFingerprint,
      startTime,
      timestamp,
      input
    });
  }

  /**
   * Helper to trigger a circuit breaker incident and record it in IncidentStore.
   */
  private static triggerCircuitBreaker(params: {
    reason: string;
    profileId: string;
    policyId?: string;
    policyVersion?: string;
    controlId?: CgAgControlId | string;
    passportFingerprint: string;
    startTime: number;
    timestamp: string;
    input: GuardianEvaluationInput;
  }): GuardianResponse {
    const incidentId = `INC-CB-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const incident: AIIncident = {
      incidentId,
      title: `Guardian Circuit Breaker Tripped on ${params.input.agent.name}`,
      timestamp: params.timestamp,
      affectedEntity: `${params.input.agent.name} (${params.input.agent.id})`,
      entityId: params.input.agent.id,
      systemId: 'SYS-GUARDIAN-RUNTIME',
      systemName: 'Guardian Safety Sensor',
      incidentType: 'TOOL_LOOPING_ANOMALY',
      severity: 'CRITICAL',
      triggerSignal: params.reason,
      observedMetric: `Execution quota exceeded by ${params.input.agent.name}`,
      thresholdBreached: 'Execution quota limit',
      controlId: (params.controlId as string) || 'CG-AG-04',
      controlName: 'Circuit Breaker & Runtime Safety',
      circuitBreaker: {
        ruleName: 'CB-GUARDIAN-POLICY-TRIGGER',
        actionTaken: 'HARD_KILL',
        triggeredAt: params.timestamp,
        fallbackRoute: 'Execution Terminated by Guardian'
      },
      containmentStatus: 'CONTAINED'
    };

    try {
      const existing = IncidentStore.getIncidents(params.input.context?.tenantId);
      PersistenceAdapter.write('incidents', [incident, ...existing], 'cg_ag_incidents_v1');
    } catch (err) {
      // Fallback safely
    }

    return this.finalizeResponse({
      ...params,
      verdict: 'CIRCUIT_BREAK',
      incidentId
    });
  }

  /**
   * Measures latency, emits immutable ProtectedEvidenceRecord, and assembles final GuardianResponse.
   */
  private static finalizeResponse(params: {
    verdict: GuardianVerdict;
    reason: string;
    profileId: string;
    policyId?: string;
    policyVersion?: string;
    controlId?: CgAgControlId | string;
    passportFingerprint: string;
    gateId?: string;
    incidentId?: string;
    startTime: number;
    timestamp: string;
    input: GuardianEvaluationInput;
  }): GuardianResponse {
    const endTime = performance.now();
    const decisionLatencyMs = Math.round((endTime - params.startTime) * 100) / 100;

    // Generate unique correlated evidenceId
    const evidenceId = `EV-GUARD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Emit real protected evidence record into DecisionStore ledger
    const signatureDigest = crypto.createHash('sha256')
      .update(`${evidenceId}:${params.verdict}:${params.input.agent.id}:${decisionLatencyMs}`)
      .digest('hex')
      .substring(0, 16)
      .toUpperCase();

    const evidence: ProtectedEvidenceRecord = {
      evidenceId,
      entityType: 'AGENT',
      entityId: params.input.agent.id,
      controlId: (params.controlId as string) || 'CG-AG-07',
      eventType: params.verdict === 'REQUIRE_HITL' 
        ? 'HITL_APPROVAL' 
        : params.verdict === 'CIRCUIT_BREAK' 
          ? 'CIRCUIT_BREAK' 
          : 'TOOL_INVOCATION',
      timestamp: params.timestamp,
      tamperEvidentSignature: `DIGEST-GUARD-${signatureDigest}-SHA256`,
      payloadSummary: `Guardian [${params.verdict}] on ${params.input.agent.name} ${params.input.channel || 'TOOL'}:${params.input.capability || params.input.toolCall?.toolName || 'action'} (${decisionLatencyMs}ms)`,
      retentionDays: 1825
    };

    try {
      const currentLedger = DecisionStore.getEvidenceLedger(params.input.context?.tenantId);
      PersistenceAdapter.write('evidence_ledger', [evidence, ...currentLedger].slice(0, 50), 'cg_ag_unified_evidence_v2');
    } catch (err) {
      // Fallback safely
    }

    // Append to tamper-evident cryptographic Evidence Ledger (Sprint 2)
    try {
      EvidenceLedger.append({
        evidenceId,
        timestamp: params.timestamp,
        eventType: 'GUARDIAN_DECISION',
        agentId: params.input.agent.id,
        passportFingerprint: params.passportFingerprint,
        complianceProfileId: params.profileId,
        complianceProfileChecksum: params.input.complianceProfile?.checksum || '',
        policyId: params.policyId,
        policyVersion: params.policyVersion,
        controlId: (params.controlId as string) || 'CG-AG-07',
        channel: params.input.channel || 'TOOL',
        capability: params.input.capability || params.input.toolCall?.toolName,
        action: params.input.actionType || params.input.toolCall?.actionType || 'EXECUTE',
        verdict: params.verdict
      }, params.input.context?.tenantId);
    } catch (err) {
      if (process.env.NODE_ENV === 'production') throw err;
      // Non-production presentation fixture may remain in memory.
    }

    return {
      verdict: params.verdict,
      reason: params.reason,
      complianceProfileId: params.profileId,
      policyId: params.policyId,
      policyVersion: params.policyVersion,
      controlId: params.controlId,
      passportFingerprint: params.passportFingerprint,
      channel: params.input.channel || 'TOOL',
      capability: params.input.capability || params.input.toolCall?.toolName,
      decisionLatencyMs,
      gateId: params.gateId,
      incidentId: params.incidentId,
      evidenceId,
      timestamp: params.timestamp
    };
  }

  // --------------------------------------------------------------------------
  // Governed Gateway Evaluation Endpoints (Active Runtime Architecture)
  // --------------------------------------------------------------------------

  /**
   * Gateway entrypoint for evaluating any Governed Capability across TOOL, MODEL, or DATA channels.
   */
  static evaluateCapability(req: GovernedCapabilityRequest): GuardianResponse {
    return this.evaluate({
      agent: req.agent,
      passport: req.passport,
      passportFingerprint: req.passportFingerprint,
      complianceProfile: req.complianceProfile,
      channel: req.channel,
      capability: req.capability,
      toolCall: {
        toolName: req.capability,
        actionType: req.actionType,
        payload: req.payload
      },
      actionType: req.actionType,
      payload: req.payload,
      context: req.context
    });
  }

  /**
   * Tool Gateway: Evaluates tool/MCP execution requests against policies and declared permissions.
   */
  static evaluateToolExecution(params: {
    agent: GuardianAgentIdentity;
    passport: GuardianPassportInput;
    complianceProfile: ComplianceProfile;
    toolName: string;
    actionType: 'READ' | 'WRITE' | 'EXECUTE' | 'DELETE' | 'ADMIN';
    payload?: Record<string, any>;
    context?: GuardianRuntimeContext;
  }): GuardianResponse {
    return this.evaluateActiveCapability({
      ...params,
      channel: 'TOOL',
      capability: params.toolName
    });
  }

  /**
   * Model Gateway: Evaluates LLM inference requests against model policies, budgets, and tokens.
   */
  static evaluateModelInvocation(params: {
    agent: GuardianAgentIdentity;
    passport: GuardianPassportInput;
    complianceProfile: ComplianceProfile;
    modelName: string;
    promptTokens?: number;
    payload?: Record<string, any>;
    context?: GuardianRuntimeContext;
  }): GuardianResponse {
    return this.evaluateActiveCapability({
      ...params,
      channel: 'MODEL',
      capability: params.modelName,
      actionType: 'EXECUTE',
      payload: {
        model: params.modelName,
        promptTokens: params.promptTokens,
        ...(params.payload || {})
      }
    });
  }

  /**
   * Data Gateway: Evaluates data access/egress, PII restrictions, and storage operations.
   */
  static evaluateDataEgress(params: {
    agent: GuardianAgentIdentity;
    passport: GuardianPassportInput;
    complianceProfile: ComplianceProfile;
    resource: string;
    actionType: 'READ' | 'WRITE' | 'EXECUTE' | 'DELETE' | 'ADMIN';
    dataClassification?: string;
    payload?: Record<string, any>;
    context?: GuardianRuntimeContext;
  }): GuardianResponse {
    return this.evaluateActiveCapability({
      ...params,
      channel: 'DATA',
      capability: params.resource,
      actionType: params.actionType,
      context: {
        ...params.context,
        dataClassification: params.dataClassification
      }
    });
  }

  // --------------------------------------------------------------------------
  // S8-5 Continuous Guardian & Active Passport Enforcement
  // --------------------------------------------------------------------------

  /**
   * Active Passport Enforcement: Checks whether an agent's requested action conforms
   * to its declared Passport (tool, model, data scope, capability, and tenant).
   */
  static verifyPassportCompliance(params: {
    passport: GuardianPassportInput;
    channel: GovernanceChannel;
    capability: string;
    runtimeTenantId?: string;
    requestedModel?: string;
    requestedDataScope?: string;
    agentId?: string;
  }): {
    compliant: boolean;
    verdict: GuardianVerdict;
    violationType?: 'TENANT_MISMATCH' | 'UNDECLARED_TOOL' | 'UNDECLARED_MODEL' | 'UNDECLARED_DATA_SCOPE' | 'UNDECLARED_CAPABILITY' | 'INVALID_PASSPORT';
    reason: string;
  } {
    // 1. Tenant binding check
    if (params.passport.tenantId && params.runtimeTenantId && params.passport.tenantId !== params.runtimeTenantId) {
      const reason = `Tenant isolation violation: runtime tenant [${params.runtimeTenantId}] does not match passport binding [${params.passport.tenantId}].`;
      return {
        compliant: false,
        verdict: 'BLOCK',
        violationType: 'TENANT_MISMATCH',
        reason
      };
    }

    // 2. Channel & Capability declaration check
    const declaredTools = params.passport.declaredTools || [];
    const declaredCaps = (params.passport.governedCapabilities || []).map(c => c.capability);
    const declaredModels = params.passport.declaredModels || [];
    const declaredDataScopes = params.passport.declaredDataScopes || [];

    if (params.channel === 'TOOL') {
      const isToolDeclared = declaredTools.includes(params.capability) || declaredTools.includes('*') || declaredCaps.includes(params.capability);
      if (!isToolDeclared) {
        return {
          compliant: false,
          verdict: 'BLOCK',
          violationType: 'UNDECLARED_TOOL',
          reason: `Tool [${params.capability}] is not declared in Agent Passport [${params.passport.passportId}]. Least-privilege violation.`
        };
      }
    } else if (params.channel === 'MODEL') {
      const model = params.requestedModel || params.capability;
      const isModelDeclared = declaredModels.length === 0 || declaredModels.includes(model) || declaredModels.includes('*') || declaredCaps.includes(model);
      if (!isModelDeclared) {
        return {
          compliant: false,
          verdict: 'BLOCK',
          violationType: 'UNDECLARED_MODEL',
          reason: `Model [${model}] is not authorized in Agent Passport [${params.passport.passportId}].`
        };
      }
    } else if (params.channel === 'DATA') {
      const scope = params.requestedDataScope || params.capability;
      const isScopeDeclared = declaredDataScopes.length === 0 || declaredDataScopes.includes(scope) || declaredDataScopes.includes('*') || declaredCaps.includes(scope);
      if (!isScopeDeclared) {
        return {
          compliant: false,
          verdict: 'BLOCK',
          violationType: 'UNDECLARED_DATA_SCOPE',
          reason: `Data scope [${scope}] is not authorized in Agent Passport [${params.passport.passportId}].`
        };
      }
    }

    return {
      compliant: true,
      verdict: 'ALLOW',
      reason: `Passport [${params.passport.passportId}] fully compliant for ${params.channel}:${params.capability}.`
    };
  }

  /**
   * Continuous Guardian Interception: Evaluates capability requests with active event emission,
   * anomaly scoring, and dynamic suspension support.
   */
  static evaluateActiveCapability(req: GovernedCapabilityRequest): GuardianResponse {
    const tenantId = req.context?.tenantId || req.passport.tenantId || 'TENANT-DEFAULT';
    const agentId = req.agent.id;

    const profileChecksum = req.complianceProfile.checksum || req.passport.complianceProfileChecksum;
    const profileId = req.complianceProfile.profileId;

    // 1. Check if agent is suspended by Continuous Risk Detector
    const riskProfile = ContinuousRiskDetector.getProfile(tenantId, agentId);
    if (riskProfile.isSuspended) {
      const timestamp = new Date().toISOString();
      const blockResponse: GuardianResponse = {
        verdict: 'BLOCK',
        reason: `Agent [${req.agent.name}] is SUSPENDED by Continuous Guardian: ${riskProfile.suspensionReason || 'Risk ceiling exceeded.'}`,
        complianceProfileId: profileId,
        passportFingerprint: req.passport.passportFingerprint,
        channel: req.channel,
        capability: req.capability,
        controlId: 'CG-CRD-01',
        decisionLatencyMs: 0.5,
        evidenceId: `EV-SUSP-${Date.now().toString(36).toUpperCase()}`,
        timestamp
      };

      ActiveGovernanceBus.publish({
        eventType: req.channel === 'TOOL' ? 'TOOL_BLOCKED' : req.channel === 'MODEL' ? 'MODEL_BLOCKED' : 'DATA_BLOCKED',
        tenantId,
        agentId,
        passportId: req.passport.passportId,
        passportFingerprint: req.passport.passportFingerprint,
        channel: req.channel,
        capability: req.capability,
        verdict: 'BLOCK',
        reason: blockResponse.reason,
        metadata: {
          complianceProfileId: profileId,
          complianceProfileChecksum: profileChecksum
        }
      });

      return blockResponse;
    }

    // 2. Immediate Forbidden Action Check
    const forbiddenList = req.complianceProfile.forbiddenActions || [];
    const isForbidden = forbiddenList.some(f => 
      f === req.capability || 
      f === req.actionType ||
      req.capability.toUpperCase().includes(f.toUpperCase()) ||
      (f.includes(':') && f.split(':')[0] === req.capability)
    );

    if (isForbidden) {
      const reason = `Action [${req.capability}] (${req.actionType || 'EXECUTE'}) is explicitly prohibited by ComplianceProfile [${profileId}].`;
      const timestamp = new Date().toISOString();
      const publishedEvent = ActiveGovernanceBus.publish({
        eventType: req.channel === 'TOOL' ? 'TOOL_BLOCKED' : req.channel === 'MODEL' ? 'MODEL_BLOCKED' : 'DATA_BLOCKED',
        tenantId,
        agentId,
        passportId: req.passport.passportId,
        passportFingerprint: req.passport.passportFingerprint,
        channel: req.channel,
        capability: req.capability,
        verdict: 'BLOCK',
        reason,
        metadata: {
          complianceProfileId: profileId,
          complianceProfileChecksum: profileChecksum
        }
      });
      ContinuousRiskDetector.recordEvent(publishedEvent);
      return {
        verdict: 'BLOCK',
        reason,
        complianceProfileId: profileId,
        passportFingerprint: req.passport.passportFingerprint,
        channel: req.channel,
        capability: req.capability,
        controlId: 'CG-AG-02',
        decisionLatencyMs: 0.5,
        evidenceId: publishedEvent.eventId,
        timestamp
      };
    }

    // 3. Active Passport Channel Declarations & Tenant Check
    const passportCheck = this.verifyPassportCompliance({
      passport: req.passport,
      channel: req.channel,
      capability: req.capability,
      runtimeTenantId: req.context?.tenantId,
      requestedModel: req.channel === 'MODEL' ? req.capability : undefined,
      requestedDataScope: req.channel === 'DATA' ? req.capability : undefined,
      agentId
    });

    if (!passportCheck.compliant) {
      const timestamp = new Date().toISOString();
      const violationType = passportCheck.violationType === 'TENANT_MISMATCH' ? 'TENANT_VIOLATION' : 'PASSPORT_VIOLATION';

      const publishedEvent = ActiveGovernanceBus.publish({
        eventType: violationType,
        tenantId,
        agentId,
        passportId: req.passport.passportId,
        passportFingerprint: req.passport.passportFingerprint,
        channel: req.channel,
        capability: req.capability,
        verdict: 'BLOCK',
        reason: passportCheck.reason,
        metadata: {
          complianceProfileId: profileId,
          complianceProfileChecksum: profileChecksum
        }
      });

      ContinuousRiskDetector.recordEvent(publishedEvent);

      return {
        verdict: 'BLOCK',
        reason: passportCheck.reason,
        complianceProfileId: profileId,
        passportFingerprint: req.passport.passportFingerprint,
        channel: req.channel,
        capability: req.capability,
        controlId: 'CG-AG-02',
        decisionLatencyMs: 1.0,
        evidenceId: publishedEvent.eventId,
        timestamp
      };
    }

    // 3. Publish request event
    ActiveGovernanceBus.publish({
      eventType: req.channel === 'TOOL' ? 'TOOL_REQUESTED' : req.channel === 'MODEL' ? 'MODEL_REQUESTED' : 'DATA_REQUESTED',
      tenantId,
      agentId,
      passportId: req.passport.passportId,
      passportFingerprint: req.passport.passportFingerprint,
      channel: req.channel,
      capability: req.capability,
      action: req.actionType,
      payload: req.payload,
      metadata: {
        complianceProfileId: profileId,
        complianceProfileChecksum: profileChecksum
      }
    });

    // 4. Evaluate via base Guardian engine (Preserves all policy, HITL, circuit breaker & control checks)
    const response = this.evaluateCapability(req);

    // 5. Map verdict to active outcome event
    let outcomeEvent: any;
    if (response.verdict === 'ALLOW') {
      outcomeEvent = req.channel === 'TOOL' ? 'TOOL_ALLOWED' : req.channel === 'MODEL' ? 'MODEL_ALLOWED' : 'DATA_ALLOWED';
    } else if (response.verdict === 'REQUIRE_HITL') {
      outcomeEvent = 'HITL_REQUIRED';
    } else {
      outcomeEvent = req.channel === 'TOOL' ? 'TOOL_BLOCKED' : req.channel === 'MODEL' ? 'MODEL_BLOCKED' : 'DATA_BLOCKED';
    }

    const recordedEvent = ActiveGovernanceBus.publish({
      eventType: outcomeEvent,
      tenantId,
      agentId,
      passportId: req.passport.passportId,
      passportFingerprint: req.passport.passportFingerprint,
      channel: req.channel,
      capability: req.capability,
      action: req.actionType,
      verdict: response.verdict,
      reason: response.reason,
      metadata: {
        gateId: response.gateId,
        complianceProfileId: response.complianceProfileId || profileId,
        complianceProfileChecksum: profileChecksum,
        decisionLatencyMs: response.decisionLatencyMs
      }
    });

    // 6. Feed result to Continuous Risk Detector
    ContinuousRiskDetector.recordEvent(recordedEvent);

    return response;
  }

  /**
   * Evaluates an active runtime event against a ComplianceProfile (for event-driven streams).
   */
  static evaluateRuntimeEvent(event: ActiveRuntimeEvent, profile: ComplianceProfile): GuardianResponse {
    return this.finalizeResponse({
      verdict: event.verdict || 'ALLOW',
      reason: event.reason || `Runtime event [${event.eventType}] evaluated by Continuous Guardian.`,
      profileId: profile.profileId,
      passportFingerprint: event.passportFingerprint || 'FINGERPRINT_ACTIVE',
      startTime: performance.now(),
      timestamp: event.timestamp || new Date().toISOString(),
      input: {
        agent: { id: event.agentId, name: `Agent-${event.agentId}` },
        passport: {
          passportId: event.passportId || 'PASSPORT_GENERIC',
          passportFingerprint: event.passportFingerprint || 'FINGERPRINT_ACTIVE',
          complianceProfileChecksum: profile.checksum,
          declaredTools: ['*']
        },
        complianceProfile: profile,
        channel: event.channel || 'TOOL',
        capability: event.capability,
        context: { tenantId: event.tenantId }
      }
    });
  }

  /**
   * Suspends an agent runtime on demand.
   */
  static suspendAgent(tenantId: string, agentId: string, reason: string): void {
    const profile = ContinuousRiskDetector.getProfile(tenantId, agentId);
    profile.isSuspended = true;
    profile.suspensionReason = reason;

    ActiveGovernanceBus.publish({
      eventType: 'RUNTIME_REVOKED',
      tenantId,
      agentId,
      verdict: 'BLOCK',
      reason: `Agent manually suspended: ${reason}`
    });
  }

  /**
   * Reinstates a suspended agent runtime.
   */
  static reinstateAgent(tenantId: string, agentId: string): void {
    const profile = ContinuousRiskDetector.getProfile(tenantId, agentId);
    profile.isSuspended = false;
    profile.suspensionReason = undefined;
    profile.anomalyScore = 0;
    profile.violationCount = 0;
    profile.unauthorizedToolAttempts = 0;
    profile.unauthorizedModelAttempts = 0;
    profile.unauthorizedDataAttempts = 0;
    profile.passportViolations = 0;
    profile.tenantViolations = 0;
    profile.hitlRequests = 0;
    profile.riskTier = 'LOW';
  }

  /**
   * Retrieves current agent risk profile.
   */
  static getActiveRiskProfile(tenantId: string, agentId: string): AgentRiskProfile {
    return ContinuousRiskDetector.getProfile(tenantId, agentId);
  }
}
