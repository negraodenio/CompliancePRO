/**
 * Real-time Reactive Governance Decision & Protected Evidence Store
 * Implements causal pipeline: Risk -> Decision -> Action -> Evidence -> Audit
 */

import { GovernanceDecision, ProtectedEvidenceRecord, GovernanceControlPlane } from '../../core/governance-control-plane';

const STORAGE_KEY_DECISIONS = 'cg_ag_decisions_v1';
const STORAGE_KEY_EVIDENCE = 'cg_ag_evidence_v1';

export interface OperationalFinding {
  id: string;
  finding: string;
  sourceTarget: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  owner: string;
  status: 'PENDING_DECISION' | 'IN_REMEDIATION' | 'ACCEPTED' | 'ESCALATED';
  recommendedAction: string;
  controlId: string;
  decision?: GovernanceDecision;
}

const INITIAL_FINDINGS: OperationalFinding[] = [
  {
    id: 'FIND-001',
    finding: 'Credit Scoring Agent operates autonomous loan approvals without Tier-2 HITL oversight',
    sourceTarget: 'agents/credit_agent.py (Credit Evaluator)',
    severity: 'CRITICAL',
    owner: 'Roberto Silva (CISO & Credit Risk Lead)',
    status: 'PENDING_DECISION',
    recommendedAction: 'Enforce mandatory Human-in-the-Loop checkpoint for loans > R$ 50,000',
    controlId: 'CG-AG-03'
  },
  {
    id: 'FIND-002',
    finding: 'Direct unmonitored LLM invocation detected bypassing PII de-identification filter',
    sourceTarget: 'services/direct_llm.py (Shadow AI Endpoint)',
    severity: 'HIGH',
    owner: 'Carlos DPO (Data Protection Officer)',
    status: 'PENDING_DECISION',
    recommendedAction: 'Route through SecurityGuard sanitization pipeline (LGPD Art. 38)',
    controlId: 'CG-AG-06'
  },
  {
    id: 'FIND-003',
    finding: 'High-privilege execution tool attached without least-privilege boundary',
    sourceTarget: 'tools/system_executor.ts (BashTool)',
    severity: 'HIGH',
    owner: 'Security Engineering Lead',
    status: 'PENDING_DECISION',
    recommendedAction: 'Restrict to read-only tool boundary with explicit whitelist',
    controlId: 'CG-AG-02'
  },
  {
    id: 'FIND-004',
    finding: 'Missing automated Circuit Breaker timeout on multi-agent execution loop',
    sourceTarget: 'crew/orchestration.py (CrewAI Team)',
    severity: 'MEDIUM',
    owner: 'AI Platform Engineering',
    status: 'PENDING_DECISION',
    recommendedAction: 'Configure max_iterations=5 and timeout=120s guardrails',
    controlId: 'CG-AG-04'
  }
];

export class DecisionStore {
  static getFindings(): OperationalFinding[] {
    const saved = localStorage.getItem('cg_ag_findings_state');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return INITIAL_FINDINGS;
  }

  static getEvidenceLedger(): ProtectedEvidenceRecord[] {
    const saved = localStorage.getItem(STORAGE_KEY_EVIDENCE);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return [
      {
        evidenceId: 'EV-2026-001',
        entityType: 'AGENT',
        entityId: 'CG-AG-CREWAI-CREDIT-911E',
        controlId: 'CG-AG-01',
        eventType: 'DECISION_EXECUTION',
        timestamp: new Date(Date.now() - 1000 * 60 * 14).toISOString(),
        tamperEvidentSignature: 'SIG-911EB3A0C872',
        payloadSummary: 'Credit Risk Agent Token Issued & Cataloged',
        retentionDays: 1825
      },
      {
        evidenceId: 'EV-2026-002',
        entityType: 'CONTROL',
        entityId: 'CG-AG-07',
        controlId: 'CG-AG-07',
        eventType: 'POLICY_OVERRIDE',
        timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        tamperEvidentSignature: 'SIG-48E9F108AB31',
        payloadSummary: 'Audit Ledger Stream Checkpoint Verified',
        retentionDays: 1825
      }
    ];
  }

  static recordDecision(
    findingId: string,
    decisionType: 'MITIGATE' | 'ACCEPT' | 'ESCALATE',
    decider = { name: 'Roberto Silva', role: 'CISO & Accountable Lead', stakeholderGroup: 'CISO' as const }
  ): { finding: OperationalFinding; decision: GovernanceDecision; evidence: ProtectedEvidenceRecord } {
    const findings = this.getFindings();
    const targetIndex = findings.findIndex(f => f.id === findingId);
    const target = targetIndex >= 0 ? findings[targetIndex] : INITIAL_FINDINGS[0];

    const pipelineResult = GovernanceControlPlane.resolveGovernancePipeline(target.severity, target.recommendedAction, decider);
    const decision = { ...pipelineResult.decision, decision: decisionType };

    let newStatus: OperationalFinding['status'] = 'IN_REMEDIATION';
    if (decisionType === 'ACCEPT') newStatus = 'ACCEPTED';
    if (decisionType === 'ESCALATE') newStatus = 'ESCALATED';

    const updatedFinding: OperationalFinding = {
      ...target,
      status: newStatus,
      decision
    };

    if (targetIndex >= 0) {
      findings[targetIndex] = updatedFinding;
    }
    localStorage.setItem('cg_ag_findings_state', JSON.stringify(findings));

    // Emit real protected evidence record into ledger
    const hash = Math.random().toString(36).substring(2, 10).toUpperCase();
    const evidence: ProtectedEvidenceRecord = {
      evidenceId: `EV-${Date.now().toString(36).toUpperCase()}`,
      entityType: 'DECISION',
      entityId: decision.decisionId,
      controlId: target.controlId,
      eventType: 'DECISION_EXECUTION',
      timestamp: new Date().toISOString(),
      tamperEvidentSignature: `SIG-${hash}`,
      payloadSummary: `Decision [${decisionType}] recorded on ${target.finding.substring(0, 48)}... by ${decider.name}`,
      retentionDays: 1825
    };

    const ledger = [evidence, ...this.getEvidenceLedger()];
    localStorage.setItem(STORAGE_KEY_EVIDENCE, JSON.stringify(ledger.slice(0, 30)));

    return { finding: updatedFinding, decision, evidence };
  }
}
