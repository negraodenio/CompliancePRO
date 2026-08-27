/**
 * CG-AG Framework — Governance Control Plane Domain Model
 * 
 * Formal domain architecture for the CG-AG Governance OS.
 * Grounded on the 12 CG-AG Controls, Tamper-Evident Evidence, and Decision Pipelines.
 */

import { CG_AG_CONTROLS, CGAGControl } from './cg-ag-controls';

export type GovernanceDecisionType = 'ACCEPT' | 'MITIGATE' | 'TRANSFER' | 'AVOID' | 'ESCALATE';

export interface GovernanceDecision {
  decisionId: string;
  targetId: string; // Agent ID or System ID
  riskCategory: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  decision: GovernanceDecisionType;
  decidedBy: {
    name: string;
    role: string;
    stakeholderGroup: 'AI_OFFICE' | 'CISO' | 'DPO' | 'COMPLIANCE' | 'LEGAL' | 'RISK' | 'BOARD';
  };
  rationale: string;
  actionRequired: string;
  decidedAt: string;
}

export interface ProtectedEvidenceRecord {
  evidenceId: string;
  entityId: string;
  controlId: string; // e.g. CG-AG-07
  eventType: 'DECISION_EXECUTION' | 'TOOL_INVOCATION' | 'HITL_APPROVAL' | 'CIRCUIT_BREAK' | 'POLICY_OVERRIDE';
  timestamp: string;
  tamperEvidentSignature: string; // SHA-256 hash chaining
  payloadSummary: string;
  retentionDays: number;
}

export interface ControlEngineMapping {
  control: CGAGControl;
  controlPlaneModule: 
    | 'AI_AGENT_REGISTRY'
    | 'POLICY_ENGINE'
    | 'WORKFLOWS_APPROVALS'
    | 'RUNTIME_CONTROLS'
    | 'PRIVACY_DATA_CONTROLS'
    | 'AUDIT_LEDGER_EVIDENCE'
    | 'SECURITYGUARD_VAULT'
    | 'MONITORING_ASSESSMENT'
    | 'FINOPS_ENGINE'
    | 'THIRD_PARTY_GOVERNANCE';
  auditReadiness: 'AUTOMATED_STATIC' | 'AUTOMATED_RUNTIME' | 'DOCUMENTED_EVIDENCE';
}

export class GovernanceControlPlane {
  /**
   * Returns the formal mapping of all 12 CG-AG controls to the Control Plane modules.
   */
  static getControlEngineMappings(): ControlEngineMapping[] {
    const mappings: Record<string, ControlEngineMapping['controlPlaneModule']> = {
      'CG-AG-001': 'AI_AGENT_REGISTRY',
      'CG-AG-002': 'POLICY_ENGINE',
      'CG-AG-003': 'WORKFLOWS_APPROVALS',
      'CG-AG-004': 'RUNTIME_CONTROLS',
      'CG-AG-005': 'POLICY_ENGINE',
      'CG-AG-006': 'THIRD_PARTY_GOVERNANCE',
      'CG-AG-007': 'WORKFLOWS_APPROVALS',
      'CG-AG-008': 'AUDIT_LEDGER_EVIDENCE',
      'CG-AG-009': 'PRIVACY_DATA_CONTROLS',
      'CG-AG-010': 'MONITORING_ASSESSMENT',
      'CG-AG-011': 'AI_AGENT_REGISTRY',
      'CG-AG-012': 'RUNTIME_CONTROLS',
    };

    return Object.values(CG_AG_CONTROLS).map(c => ({
      control: c,
      controlPlaneModule: mappings[c.id] || 'POLICY_ENGINE',
      auditReadiness: 'AUTOMATED_STATIC'
    }));
  }

  /**
   * Formal causal pipeline execution helper.
   * Policy -> Responsibility -> Control -> Risk -> Decision -> Action -> Evidence -> Measurement -> Audit -> Improvement
   */
  static resolveGovernancePipeline(
    riskSeverity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
    proposedAction: string,
    decider: GovernanceDecision['decidedBy']
  ): {
    decision: GovernanceDecision;
    nextStep: 'EXECUTE_ACTION' | 'ESCALATE_TO_BOARD' | 'ARCHIVE_ACCEPTANCE';
    evidenceRequired: boolean;
  } {
    let decisionType: GovernanceDecisionType = 'MITIGATE';
    let nextStep: 'EXECUTE_ACTION' | 'ESCALATE_TO_BOARD' | 'ARCHIVE_ACCEPTANCE' = 'EXECUTE_ACTION';

    if (riskSeverity === 'CRITICAL') {
      decisionType = 'ESCALATE';
      nextStep = 'ESCALATE_TO_BOARD';
    } else if (riskSeverity === 'LOW') {
      decisionType = 'ACCEPT';
      nextStep = 'ARCHIVE_ACCEPTANCE';
    }

    const decision: GovernanceDecision = {
      decisionId: `DEC-${Date.now().toString(36).toUpperCase()}`,
      targetId: 'TARGET-AI-PIPELINE',
      riskCategory: 'Regulatory Compliance & Operational Safety',
      severity: riskSeverity,
      decision: decisionType,
      decidedBy: decider,
      rationale: `Evaluated under CG-AG Governance Control Plane. Risk: ${riskSeverity}.`,
      actionRequired: proposedAction,
      decidedAt: new Date().toISOString()
    };

    return {
      decision,
      nextStep,
      evidenceRequired: true
    };
  }
}
