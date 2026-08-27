/**
 * CG-AG Framework — Governance Control Plane Domain Model
 * 
 * Formal domain architecture for the CG-AG Governance OS.
 * Operates the 12 CG-AG Controls, Tamper-Evident Evidence, and Decision Pipelines.
 * 
 * Organizes Level 2 Control Plane into:
 * - DISCOVER: AI Registry, Agent Registry, Governance Assessment
 * - GOVERN: Governance Repository, CG-AG Control Engine, Risk Engine, Policy Engine
 * - OPERATE: Workflows & Approvals, Incident Management, Runtime Controls
 * - ASSURE: Evidence Repository, Audit Ledger, Compliance & Reporting
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
    stakeholderGroup: 'AI_OFFICE' | 'CISO' | 'DPO' | 'COMPLIANCE' | 'LEGAL' | 'RISK' | 'INTERNAL_AUDIT' | 'BOARD';
  };
  rationale: string;
  actionRequired: string;
  decidedAt: string;
}

export interface ProtectedEvidenceRecord {
  evidenceId: string;
  entityType: 'AI_SYSTEM' | 'AGENT' | 'CONTROL' | 'POLICY' | 'RISK' | 'ASSESSMENT' | 'DECISION' | 'ACTION' | 'INCIDENT' | 'AUDIT';
  entityId: string;
  controlId: string; // e.g. CG-AG-07
  eventType: 'DECISION_EXECUTION' | 'TOOL_INVOCATION' | 'HITL_APPROVAL' | 'CIRCUIT_BREAK' | 'POLICY_OVERRIDE' | 'INCIDENT_RECORDED';
  timestamp: string;
  tamperEvidentSignature: string; // Cryptographic SHA-256 hash
  payloadSummary: string;
  retentionDays: number;
}

export type ControlPlaneModule =
  | 'AI_AGENT_REGISTRY'
  | 'POLICY_ENGINE_ACCESS_TOOLS'
  | 'WORKFLOWS_APPROVALS_HITL'
  | 'RUNTIME_CONTROLS_INCIDENT'
  | 'POLICY_ENGINE_AI_SECURITY'
  | 'PRIVACY_DATA_CONTROLS'
  | 'AUDIT_LEDGER_EVIDENCE'
  | 'SECURITYGUARD_CREDENTIALS'
  | 'MONITORING_ASSESSMENT'
  | 'FINOPS_RUNTIME_COST'
  | 'RUNTIME_RESILIENCE'
  | 'THIRD_PARTY_GOVERNANCE';

export interface ControlEngineMapping {
  controlId: string;
  controlName: string;
  controlPlaneModule: ControlPlaneModule;
  controlPlaneGroup: 'DISCOVER' | 'GOVERN' | 'OPERATE' | 'ASSURE';
  auditReadiness: 'AUTOMATED_STATIC' | 'AUTOMATED_RUNTIME' | 'DOCUMENTED_EVIDENCE';
}

export class GovernanceControlPlane {
  /**
   * Returns the exact 12-control mapping to the Control Plane modules.
   */
  static getControlEngineMappings(): ControlEngineMapping[] {
    return [
      {
        controlId: 'CG-AG-01',
        controlName: 'Inventory & Registration',
        controlPlaneModule: 'AI_AGENT_REGISTRY',
        controlPlaneGroup: 'DISCOVER',
        auditReadiness: 'AUTOMATED_STATIC'
      },
      {
        controlId: 'CG-AG-02',
        controlName: 'Tool Scoping & Authorization',
        controlPlaneModule: 'POLICY_ENGINE_ACCESS_TOOLS',
        controlPlaneGroup: 'GOVERN',
        auditReadiness: 'AUTOMATED_STATIC'
      },
      {
        controlId: 'CG-AG-03',
        controlName: 'Human-in-the-Loop',
        controlPlaneModule: 'WORKFLOWS_APPROVALS_HITL',
        controlPlaneGroup: 'OPERATE',
        auditReadiness: 'AUTOMATED_RUNTIME'
      },
      {
        controlId: 'CG-AG-04',
        controlName: 'Circuit Breaker / Timeout / Anti-Loop',
        controlPlaneModule: 'RUNTIME_CONTROLS_INCIDENT',
        controlPlaneGroup: 'OPERATE',
        auditReadiness: 'AUTOMATED_RUNTIME'
      },
      {
        controlId: 'CG-AG-05',
        controlName: 'Prompt Security / Injection Protection',
        controlPlaneModule: 'POLICY_ENGINE_AI_SECURITY',
        controlPlaneGroup: 'GOVERN',
        auditReadiness: 'AUTOMATED_STATIC'
      },
      {
        controlId: 'CG-AG-06',
        controlName: 'PII Protection & De-identification',
        controlPlaneModule: 'PRIVACY_DATA_CONTROLS',
        controlPlaneGroup: 'GOVERN',
        auditReadiness: 'AUTOMATED_STATIC'
      },
      {
        controlId: 'CG-AG-07',
        controlName: 'Audit Trail & Decision Trace',
        controlPlaneModule: 'AUDIT_LEDGER_EVIDENCE',
        controlPlaneGroup: 'ASSURE',
        auditReadiness: 'AUTOMATED_RUNTIME'
      },
      {
        controlId: 'CG-AG-08',
        controlName: 'Secrets & Credentials Management',
        controlPlaneModule: 'SECURITYGUARD_CREDENTIALS',
        controlPlaneGroup: 'GOVERN',
        auditReadiness: 'AUTOMATED_STATIC'
      },
      {
        controlId: 'CG-AG-09',
        controlName: 'Drift / Hallucination / Bias Monitoring',
        controlPlaneModule: 'MONITORING_ASSESSMENT',
        controlPlaneGroup: 'ASSURE',
        auditReadiness: 'AUTOMATED_RUNTIME'
      },
      {
        controlId: 'CG-AG-10',
        controlName: 'FinOps / Token Budget / Rate Limiting',
        controlPlaneModule: 'FINOPS_RUNTIME_COST',
        controlPlaneGroup: 'OPERATE',
        auditReadiness: 'AUTOMATED_RUNTIME'
      },
      {
        controlId: 'CG-AG-11',
        controlName: 'Resilience / Fallback / Graceful Degradation',
        controlPlaneModule: 'RUNTIME_RESILIENCE',
        controlPlaneGroup: 'OPERATE',
        auditReadiness: 'AUTOMATED_RUNTIME'
      },
      {
        controlId: 'CG-AG-12',
        controlName: 'Third-Party AI / Supply Chain Governance',
        controlPlaneModule: 'THIRD_PARTY_GOVERNANCE',
        controlPlaneGroup: 'DISCOVER',
        auditReadiness: 'AUTOMATED_STATIC'
      }
    ];
  }

  /**
   * Resolves the causal Governance Pipeline:
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
      rationale: `Evaluated under CG-AG Governance Control Plane. Risk: ${riskSeverity}. Human accountability enforced.`,
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
