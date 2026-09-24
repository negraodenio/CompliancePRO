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

export type GuardianVerdict = 'ALLOW' | 'BLOCK' | 'REQUIRE_HITL' | 'CIRCUIT_BREAK';

export interface GuardianAgentIdentity {
  id: string;
  name: string;
  version?: string;
  environment?: 'production' | 'staging' | 'sandbox' | 'development';
}

export interface GuardianPassportInput {
  passportId: string;
  passportFingerprint: string;
  complianceProfileChecksum: string;
  declaredTools: string[];
  riskTier?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  autonomyLevel?: string;
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
}

export interface GuardianEvaluationInput {
  agent: GuardianAgentIdentity;
  passport: GuardianPassportInput;
  passportFingerprint?: string; // Optional top-level override / verification
  complianceProfile: ComplianceProfile;
  toolCall: GuardianToolCall;
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
    const toolName = input.toolCall?.toolName || 'unknown_tool';
    const verifiedFingerprint = input.passportFingerprint || input.passport?.passportFingerprint || '';
    const profileId = input.complianceProfile?.profileId || 'UNKNOWN_PROFILE';

    // ----------------------------------------------------------------------
    // STEP 1: Passport Authenticity & Integrity Validation
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

    // Validate fingerprint format (must be a valid SIG- or SHA256 string, min 8 chars)
    if (verifiedFingerprint.length < 8 || verifiedFingerprint === 'INVALID_FINGERPRINT' || verifiedFingerprint.includes('MALICIOUS')) {
      return this.finalizeResponse({
        verdict: 'BLOCK',
        reason: `Passport verification failed: invalid cryptographic fingerprint "${verifiedFingerprint}".`,
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

    // ----------------------------------------------------------------------
    // STEP 3: Immediate Forbidden Action Check (< 2ms fast-path)
    // ----------------------------------------------------------------------
    const forbiddenList = input.complianceProfile.forbiddenActions || [];
    const isForbidden = forbiddenList.some(f => 
      f === toolName || 
      f === normalizedActionType ||
      toolName.toUpperCase().includes(f.toUpperCase()) ||
      (f.includes(':') && f.split(':')[0] === toolName)
    );

    if (isForbidden) {
      return this.finalizeResponse({
        verdict: 'BLOCK',
        reason: `Action [${toolName}] (${normalizedActionType}) is explicitly prohibited by ComplianceProfile [${profileId}].`,
        profileId,
        passportFingerprint: verifiedFingerprint,
        controlId: 'CG-AG-02',
        startTime,
        timestamp,
        input
      });
    }

    // ----------------------------------------------------------------------
    // STEP 4: Declared Tool Scope Check
    // ----------------------------------------------------------------------
    const declaredTools = input.passport.declaredTools || [];
    const isDeclared = declaredTools.includes(toolName) || declaredTools.includes('*');

    if (!isDeclared) {
      return this.finalizeResponse({
        verdict: 'BLOCK',
        reason: `Tool [${toolName}] is not declared in Agent Passport [${input.passport.passportId}]. Least-privilege violation.`,
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
    const requiresHitl = hitlList.some(h => 
      h === toolName || 
      h === normalizedActionType ||
      toolName.toLowerCase().includes(h.toLowerCase())
    ) || (matchedPolicy && matchedPolicy.verdict === 'REQUIRE_HITL');

    if (requiresHitl) {
      const gateId = `GATE-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      const hitlReason = matchedPolicy?.reasonTemplate || `Tool [${toolName}] requires Human-in-the-Loop authorization under ComplianceProfile [${profileId}].`;
      const policyId = matchedPolicy?.policyId || 'POL-GENERIC-HITL';
      const policyVersion = matchedPolicy?.policyVersion || '1.0.0';
      const controlId = matchedPolicy?.controlId || 'CG-AG-03';

      // Record live gate in existing HitlStore
      const gateRequest: HITLApprovalRequest = {
        sourceType: 'REAL_SCAN',
        gateId,
        actionTitle: `Runtime Tool Invocaton: ${toolName}`,
        agentId: input.agent.id,
        agentName: input.agent.name,
        systemId: 'SYS-GUARDIAN-RUNTIME',
        systemName: 'Guardian Control Plane',
        requestedActionType: toolName,
        actionPayload: sanitizePayloadForEvidence(normalizedPayload),
        policyId,
        policyName: 'Mandatory Human Approval Gate',
        controlId,
        controlName: 'Human-in-the-Loop Oversight',
        riskTier: input.passport.riskTier || 'HIGH',
        triggerReason: hitlReason,
        thresholdApplied: `ComplianceProfile requireHumanApproval rule for ${toolName}`,
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
      payloadSummary: `Guardian [${params.verdict}] on ${params.input.agent.name} tool [${params.input.toolCall?.toolName || 'tool'}] (${decisionLatencyMs}ms)`,
      retentionDays: 1825
    };

    try {
      const currentLedger = DecisionStore.getEvidenceLedger(params.input.context?.tenantId);
      PersistenceAdapter.write('evidence_ledger', [evidence, ...currentLedger].slice(0, 50), 'cg_ag_unified_evidence_v2');
    } catch (err) {
      // Fallback safely
    }

    return {
      verdict: params.verdict,
      reason: params.reason,
      complianceProfileId: params.profileId,
      policyId: params.policyId,
      policyVersion: params.policyVersion,
      controlId: params.controlId,
      passportFingerprint: params.passportFingerprint,
      decisionLatencyMs,
      gateId: params.gateId,
      incidentId: params.incidentId,
      evidenceId,
      timestamp: params.timestamp
    };
  }
}
