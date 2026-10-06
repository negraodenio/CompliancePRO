/**
 * ComplyPRO.pt — Sprint 8-5: Continuous Risk Detector
 * "Build with your framework. Govern with ComplyPRO."
 * 
 * Provides continuous runtime anomaly detection and risk scoring:
 * - Observes policy denials, unauthorized capability attempts, and tenant violations
 * - Computes dynamic agent risk posture based on empirical runtime signals
 * - Escalates to CIRCUIT_BREAK, ALERT, or SUSPEND upon exceeding safety thresholds
 * - Records risk events immutably to IncidentStore and ActiveGovernanceBus
 */

import { IncidentStore, AIIncident } from '../web/services/incident-store';
import { ActiveGovernanceBus, ActiveRuntimeEvent } from './active-governance-bus';

export type ActiveRiskResponse = 'ALLOW' | 'BLOCK' | 'REQUIRE_HITL' | 'ALERT' | 'CIRCUIT_BREAK' | 'SUSPEND';

export interface AgentRiskProfile {
  agentId: string;
  tenantId: string;
  riskTier: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  anomalyScore: number;
  violationCount: number;
  unauthorizedToolAttempts: number;
  unauthorizedModelAttempts: number;
  unauthorizedDataAttempts: number;
  passportViolations: number;
  tenantViolations: number;
  hitlRequests: number;
  isSuspended: boolean;
  suspensionReason?: string;
  lastAssessedAt: string;
}

export interface RiskThresholdConfig {
  maxViolationsBeforeAlert: number;
  maxViolationsBeforeCircuitBreak: number;
  maxViolationsBeforeSuspension: number;
  passportViolationWeight: number;
  tenantViolationWeight: number;
}

export const DEFAULT_RISK_THRESHOLDS: RiskThresholdConfig = {
  maxViolationsBeforeAlert: 2,
  maxViolationsBeforeCircuitBreak: 3,
  maxViolationsBeforeSuspension: 5,
  passportViolationWeight: 25,
  tenantViolationWeight: 40
};

export class ContinuousRiskDetector {
  private static profiles: Map<string, AgentRiskProfile> = new Map(); // key = `${tenantId}:${agentId}`
  private static thresholds: RiskThresholdConfig = { ...DEFAULT_RISK_THRESHOLDS };

  /**
   * Resets all risk profiles (for tests).
   */
  public static reset(): void {
    this.profiles.clear();
    this.thresholds = { ...DEFAULT_RISK_THRESHOLDS };
  }

  /**
   * Sets custom risk thresholds.
   */
  public static setThresholds(config: Partial<RiskThresholdConfig>): void {
    this.thresholds = { ...this.thresholds, ...config };
  }

  /**
   * Directly triggers dynamic suspension on an agent profile.
   */
  public static triggerSuspension(tenantId: string, agentId: string, reason: string): void {
    const profile = this.getProfile(tenantId, agentId);
    profile.isSuspended = true;
    profile.suspensionReason = reason;
  }

  /**
   * Checks whether an agent is dynamically suspended.
   */
  public static isAgentSuspended(tenantId: string, agentId: string): boolean {
    return this.getProfile(tenantId, agentId).isSuspended;
  }

  /**
   * Reinstates an agent, resetting suspension and anomaly counters.
   */
  public static reinstateAgent(tenantId: string, agentId: string): void {
    const profile = this.getProfile(tenantId, agentId);
    profile.isSuspended = false;
    profile.suspensionReason = undefined;
    profile.anomalyScore = 0;
    profile.violationCount = 0;
    profile.riskTier = 'LOW';
  }

  /**
   * Gets or initializes the risk profile for an agent.
   */
  public static getProfile(tenantId: string, agentId: string): AgentRiskProfile {
    const key = `${tenantId}:${agentId}`;
    if (!this.profiles.has(key)) {
      this.profiles.set(key, {
        agentId,
        tenantId,
        riskTier: 'LOW',
        anomalyScore: 0,
        violationCount: 0,
        unauthorizedToolAttempts: 0,
        unauthorizedModelAttempts: 0,
        unauthorizedDataAttempts: 0,
        passportViolations: 0,
        tenantViolations: 0,
        hitlRequests: 0,
        isSuspended: false,
        lastAssessedAt: new Date().toISOString()
      });
    }
    return this.profiles.get(key)!;
  }

  /**
   * Records a security / policy event and evaluates dynamic risk escalation.
   */
  public static recordEvent(event: ActiveRuntimeEvent): {
    profile: AgentRiskProfile;
    recommendedResponse: ActiveRiskResponse;
    riskEscalated: boolean;
  } {
    const profile = this.getProfile(event.tenantId, event.agentId);
    let riskEscalated = false;

    // Track specific violation types
    switch (event.eventType) {
      case 'TOOL_BLOCKED':
        profile.violationCount++;
        profile.unauthorizedToolAttempts++;
        profile.anomalyScore += 15;
        break;

      case 'MODEL_BLOCKED':
        profile.violationCount++;
        profile.unauthorizedModelAttempts++;
        profile.anomalyScore += 15;
        break;

      case 'DATA_BLOCKED':
        profile.violationCount++;
        profile.unauthorizedDataAttempts++;
        profile.anomalyScore += 20;
        break;

      case 'CAPABILITY_DENIED':
        profile.violationCount++;
        profile.anomalyScore += 15;
        break;

      case 'PASSPORT_VIOLATION':
        profile.violationCount++;
        profile.passportViolations++;
        profile.anomalyScore += this.thresholds.passportViolationWeight;
        break;

      case 'TENANT_VIOLATION':
        profile.violationCount++;
        profile.tenantViolations++;
        profile.anomalyScore += this.thresholds.tenantViolationWeight;
        break;

      case 'HITL_REQUIRED':
        profile.hitlRequests++;
        profile.anomalyScore += 5;
        break;
    }

    profile.lastAssessedAt = new Date().toISOString();

    // Recompute risk tier
    const previousTier = profile.riskTier;
    if (profile.anomalyScore >= 80 || profile.violationCount >= this.thresholds.maxViolationsBeforeSuspension) {
      profile.riskTier = 'CRITICAL';
    } else if (profile.anomalyScore >= 50 || profile.violationCount >= this.thresholds.maxViolationsBeforeCircuitBreak) {
      profile.riskTier = 'HIGH';
    } else if (profile.anomalyScore >= 20 || profile.violationCount >= this.thresholds.maxViolationsBeforeAlert) {
      profile.riskTier = 'MEDIUM';
    } else {
      profile.riskTier = 'LOW';
    }

    if (profile.riskTier !== previousTier) {
      riskEscalated = true;
    }

    // Determine active response
    let recommendedResponse: ActiveRiskResponse = 'ALLOW';
    if (profile.violationCount >= this.thresholds.maxViolationsBeforeSuspension || profile.tenantViolations > 0) {
      recommendedResponse = 'SUSPEND';
      profile.isSuspended = true;
      profile.suspensionReason = `Safety ceiling exceeded: ${profile.violationCount} violations or tenant breach detected.`;
    } else if (profile.violationCount >= this.thresholds.maxViolationsBeforeCircuitBreak) {
      recommendedResponse = 'CIRCUIT_BREAK';
    } else if (profile.violationCount >= this.thresholds.maxViolationsBeforeAlert) {
      recommendedResponse = 'ALERT';
    } else if (event.verdict === 'BLOCK') {
      recommendedResponse = 'BLOCK';
    } else if (event.verdict === 'REQUIRE_HITL') {
      recommendedResponse = 'REQUIRE_HITL';
    }

    // If risk escalated to high or critical, log incident and broadcast RISK_DETECTED
    if (riskEscalated && (profile.riskTier === 'HIGH' || profile.riskTier === 'CRITICAL')) {
      this.emitRiskIncident(profile, event, recommendedResponse);
    }

    return {
      profile,
      recommendedResponse,
      riskEscalated
    };
  }

  /**
   * Logs a high/critical risk incident in IncidentStore and publishes RISK_DETECTED event.
   */
  private static emitRiskIncident(
    profile: AgentRiskProfile,
    triggerEvent: ActiveRuntimeEvent,
    response: ActiveRiskResponse
  ): void {
    const incidentId = `INC-RISK-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const incident: AIIncident = {
      incidentId,
      title: `Continuous Risk Escalation: ${profile.agentId} reached ${profile.riskTier}`,
      timestamp: new Date().toISOString(),
      affectedEntity: `Agent ${profile.agentId}`,
      entityId: profile.agentId,
      systemId: 'SYS-CONTINUOUS-GUARDIAN',
      systemName: 'Continuous Risk Detector',
      incidentType: profile.tenantViolations > 0 ? 'UNAUTHORIZED_ESCALATION' : 'RECURRING_POLICY_BREACH',
      severity: profile.riskTier === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
      triggerSignal: `Triggered by ${triggerEvent.eventType}: Anomaly score = ${profile.anomalyScore}, Violations = ${profile.violationCount}`,
      observedMetric: `Score ${profile.anomalyScore}, Response: ${response}`,
      thresholdBreached: `Exceeded threshold ${this.thresholds.maxViolationsBeforeCircuitBreak}`,
      controlId: 'CG-AG-04',
      controlName: 'Continuous Risk Management System',
      circuitBreaker: {
        ruleName: 'CRD-ESCALATION-RULE',
        actionTaken: response === 'SUSPEND' ? 'HARD_KILL' : 'RATE_LIMIT_ISOLATION',
        triggeredAt: new Date().toISOString(),
        fallbackRoute: response
      },
      containmentStatus: 'CONTAINED'
    };

    try {
      const existing = IncidentStore.getIncidents(profile.tenantId);
      const { PersistenceAdapter } = require('../web/services/persistence-adapter');
      PersistenceAdapter.write('incidents', [incident, ...existing], 'cg_ag_incidents_v1');
    } catch {
      // Memory safe fallback
    }

    // Broadcast RISK_DETECTED
    ActiveGovernanceBus.publish({
      eventType: 'RISK_DETECTED',
      tenantId: profile.tenantId,
      agentId: profile.agentId,
      verdict: response === 'SUSPEND' ? 'BLOCK' : 'CIRCUIT_BREAK',
      reason: `Continuous Risk Detector escalated agent ${profile.agentId} to ${profile.riskTier} (Score: ${profile.anomalyScore})`,
      payload: {
        riskTier: profile.riskTier,
        anomalyScore: profile.anomalyScore,
        violationCount: profile.violationCount,
        recommendedResponse: response
      }
    });
  }
}
