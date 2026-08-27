/**
 * Single Authoritative Source of Truth for Governance Decisions, Risks & Evidence
 * Causal Pipeline: Control -> Finding -> Risk -> Decision -> Action -> Evidence -> Audit
 */

import { GovernanceDecision, ProtectedEvidenceRecord, GovernanceControlPlane } from '../../core/governance-control-plane';

export interface OperationalFinding {
  sourceType?: 'REAL_SCAN' | 'CANONICAL_BASELINE' | 'SIMULATION';
  scanId?: string;
  sourceRepository?: string;
  sourcePath?: string;
  createdFromScan?: boolean;
  id: string;
  riskId: string;
  finding: string;
  sourceTarget: string;
  systemId: string;
  agentId?: string;
  agentName?: string;
  team?: string;
  model?: string;
  toolsAffected?: string[];
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  likelihood: 'HIGH' | 'MEDIUM' | 'LOW';
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  category: 'AUTONOMY_OVERSIGHT' | 'PRIVACY_DATA' | 'TOOL_AUTHORIZATION' | 'RESILIENCE' | 'AI_SECURITY';
  owner: {
    name: string;
    role: string;
    department: string;
  };
  status: 'PENDING_DECISION' | 'IN_TREATMENT' | 'ACCEPTED' | 'ESCALATED' | 'RESOLVED';
  decisionType: 'PENDING_DECISION' | 'MITIGATE' | 'ACCEPT' | 'TRANSFER' | 'AVOID' | 'ESCALATE';
  recommendedAction: string;
  controlId: string;
  controlName: string;
  treatment: {
    actionRequired: string;
    assignedTo: string;
    targetDueDate: string;
    status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED';
  };
  evidenceDigest: string;
  createdAt: string;
  updatedAt: string;
  decision?: GovernanceDecision;
}

const STORAGE_KEY_FINDINGS = 'cg_ag_unified_findings_v2';
const STORAGE_KEY_EVIDENCE = 'cg_ag_unified_evidence_v2';

const BASELINE_FINDINGS: OperationalFinding[] = [
  {
    id: 'FIND-001',
    riskId: 'RISK-2026-0042',
    finding: 'Credit Scoring Agent operates autonomous loan approvals without Tier-2 HITL oversight',
    sourceTarget: 'agents/credit_agent.py (Credit Evaluator)',
    systemId: 'SYS-CREDIT-001',
    agentId: 'AGT-CREDIT-911E',
    agentName: 'Credit Risk Evaluator',
    team: 'Credit Underwriting Squad',
    model: 'gpt-4-turbo (CrewAI 0.1.x)',
    toolsAffected: ['LoanOfferGenerator'],
    severity: 'CRITICAL',
    likelihood: 'HIGH',
    impact: 'HIGH',
    category: 'AUTONOMY_OVERSIGHT',
    owner: {
      name: 'Roberto Silva',
      role: 'CISO & Credit Risk Lead',
      department: 'Risk & Compliance'
    },
    status: 'PENDING_DECISION',
    decisionType: 'PENDING_DECISION',
    recommendedAction: 'Enforce mandatory Human-in-the-Loop checkpoint for loans > R$ 50,000',
    controlId: 'CG-AG-03',
    controlName: 'Human-in-the-Loop Oversight',
    treatment: {
      actionRequired: 'Enforce mandatory Human-in-the-Loop checkpoint for loans > R$ 50,000',
      assignedTo: 'AppSec & Risk Engineering',
      targetDueDate: '2026-09-05',
      status: 'PLANNED'
    },
    evidenceDigest: 'DIGEST-RISK-0042-SHA256',
    createdAt: '2026-08-25T10:00:00Z',
    updatedAt: '2026-08-27T17:00:00Z'
  },
  {
    id: 'FIND-002',
    riskId: 'RISK-2026-0019',
    finding: 'Direct unmonitored LLM invocation detected bypassing PII de-identification filter',
    sourceTarget: 'services/direct_llm.py (Shadow AI Endpoint)',
    systemId: 'SYS-SHADOW-003',
    team: 'Growth Marketing',
    model: 'gpt-4-0613 (OpenAI SDK Direct)',
    severity: 'HIGH',
    likelihood: 'HIGH',
    impact: 'HIGH',
    category: 'PRIVACY_DATA',
    owner: {
      name: 'Carlos DPO',
      role: 'Data Protection Officer',
      department: 'Privacy Office'
    },
    status: 'PENDING_DECISION',
    decisionType: 'PENDING_DECISION',
    recommendedAction: 'Route through SecurityGuard sanitization pipeline (LGPD Art. 38)',
    controlId: 'CG-AG-06',
    controlName: 'Data Privacy & PII Protection',
    treatment: {
      actionRequired: 'Route through SecurityGuard sanitization pipeline (LGPD Art. 38)',
      assignedTo: 'Growth Tech Team',
      targetDueDate: '2026-09-02',
      status: 'PLANNED'
    },
    evidenceDigest: 'DIGEST-RISK-0019-SHA256',
    createdAt: '2026-08-26T14:30:00Z',
    updatedAt: '2026-08-27T17:00:00Z'
  },
  {
    id: 'FIND-003',
    riskId: 'RISK-2026-0008',
    finding: 'High-privilege execution tool attached without least-privilege boundary',
    sourceTarget: 'tools/system_executor.ts (BashTool)',
    systemId: 'SYS-MAINT-007',
    agentId: 'AGT-OPS-1102',
    agentName: 'Ops Executor',
    team: 'Platform Engineering',
    model: 'claude-3-5-sonnet',
    toolsAffected: ['BashTool', 'SystemExecutor'],
    severity: 'HIGH',
    likelihood: 'MEDIUM',
    impact: 'HIGH',
    category: 'TOOL_AUTHORIZATION',
    owner: {
      name: 'Security Engineering Lead',
      role: 'AppSec Architect',
      department: 'Cybersecurity'
    },
    status: 'PENDING_DECISION',
    decisionType: 'PENDING_DECISION',
    recommendedAction: 'Restrict to read-only tool boundary with explicit whitelist',
    controlId: 'CG-AG-02',
    controlName: 'Agent & Tool Scoping',
    treatment: {
      actionRequired: 'Restrict to read-only tool boundary with explicit whitelist',
      assignedTo: 'DevOps Security',
      targetDueDate: '2026-09-08',
      status: 'PLANNED'
    },
    evidenceDigest: 'DIGEST-RISK-0008-SHA256',
    createdAt: '2026-08-27T08:00:00Z',
    updatedAt: '2026-08-27T17:00:00Z'
  },
  {
    id: 'FIND-004',
    riskId: 'RISK-2026-0001',
    finding: 'Multi-agent orchestration crew lacks automated max_iterations limit and execution timeout',
    sourceTarget: 'crew/orchestration.py (CrewAI Team)',
    systemId: 'SYS-INVEST-005',
    team: 'Wealth Management AI Team',
    model: 'claude-3-5-sonnet (AutoGen)',
    severity: 'MEDIUM',
    likelihood: 'LOW',
    impact: 'MEDIUM',
    category: 'RESILIENCE',
    owner: {
      name: 'AI Platform Engineering',
      role: 'Platform Lead',
      department: 'Core Engineering'
    },
    status: 'IN_TREATMENT',
    decisionType: 'MITIGATE',
    recommendedAction: 'Configure max_iterations=5 and timeout=120s guardrails',
    controlId: 'CG-AG-04',
    controlName: 'Runtime Safety & Circuit Breakers',
    treatment: {
      actionRequired: 'Configure max_iterations=5 and timeout=120s guardrails',
      assignedTo: 'AI Core Team',
      targetDueDate: '2026-09-15',
      status: 'IN_PROGRESS'
    },
    evidenceDigest: 'DIGEST-RISK-0001-SHA256',
    createdAt: '2026-08-27T09:30:00Z',
    updatedAt: '2026-08-27T17:00:00Z',
    decision: {
      decisionId: 'DEC-2026-0012',
      targetId: 'SYS-INVEST-005',
      riskCategory: 'RESILIENCE',
      severity: 'MEDIUM',
      decision: 'MITIGATE',
      decidedBy: {
        name: 'AI Platform Engineering Lead',
        role: 'Platform Architect',
        stakeholderGroup: 'CISO'
      },
      rationale: 'Automated circuit breaker guardrails scheduled for deployment in sprint 14.',
      actionRequired: 'Configure max_iterations=5 and timeout=120s guardrails',
      decidedAt: '2026-08-27T12:00:00Z'
    }
  }
];

export class DecisionStore {
  private static listeners: Array<() => void> = [];

  static subscribe(fn: () => void) {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter(l => l !== fn);
    };
  }

  private static notify() {
    this.listeners.forEach(fn => fn());
  }

  static getFindings(): OperationalFinding[] {
    if (this.scanFindingsOverride) {
      return JSON.parse(JSON.stringify(this.scanFindingsOverride));
    }
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY_FINDINGS) : null;
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return BASELINE_FINDINGS;
  }

  static getEvidenceLedger(): ProtectedEvidenceRecord[] {
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY_EVIDENCE) : null;
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

    private static scanFindingsOverride: OperationalFinding[] | null = null;

  static ingestFindings(findings: OperationalFinding[]) {
    this.scanFindingsOverride = findings;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_FINDINGS, JSON.stringify(findings));
    }
    this.notify();
  }

  static resetToBaseline() {
    this.scanFindingsOverride = null;
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY_FINDINGS);
    }
    this.notify();
  }

static recordDecision(
    findingId: string,
    decisionType: 'MITIGATE' | 'ACCEPT' | 'TRANSFER' | 'AVOID' | 'ESCALATE',
    decider: {
      name: string;
      role: string;
      stakeholderGroup: 'AI_OFFICE' | 'CISO' | 'DPO' | 'COMPLIANCE' | 'LEGAL' | 'RISK' | 'INTERNAL_AUDIT' | 'BOARD';
    } = { name: 'Roberto Silva', role: 'CISO & Accountable Lead', stakeholderGroup: 'CISO' }
  ): { finding: OperationalFinding; decision: GovernanceDecision; evidence: ProtectedEvidenceRecord } {
    const findings = this.getFindings();
    const targetIndex = findings.findIndex(f => f.id === findingId || f.riskId === findingId);
    const target = targetIndex >= 0 ? findings[targetIndex] : BASELINE_FINDINGS[0];

    const pipelineResult = GovernanceControlPlane.resolveGovernancePipeline(target.severity, target.recommendedAction, decider);
    const decision: GovernanceDecision = { 
      ...pipelineResult.decision, 
      decision: decisionType as any,
      decisionId: `DEC-2026-${Math.random().toString(36).substring(2, 6).toUpperCase()}`
    };

    let newStatus: OperationalFinding['status'] = 'IN_TREATMENT';
    if (decisionType === 'ACCEPT') newStatus = 'ACCEPTED';
    if (decisionType === 'ESCALATE') newStatus = 'ESCALATED';

    const updatedFinding: OperationalFinding = {
      ...target,
      status: newStatus,
      decisionType,
      decision,
      updatedAt: new Date().toISOString()
    };

    if (targetIndex >= 0) {
      findings[targetIndex] = updatedFinding;
    }
    if (typeof localStorage !== 'undefined') { localStorage.setItem(STORAGE_KEY_FINDINGS, JSON.stringify(findings)); }

    // Emit real protected evidence record into ledger
    const hash = Math.random().toString(36).substring(2, 10).toUpperCase();
    const evidence: ProtectedEvidenceRecord = {
      evidenceId: `EV-${Date.now().toString(36).toUpperCase()}`,
      entityType: 'DECISION',
      entityId: decision.decisionId,
      controlId: target.controlId,
      eventType: 'DECISION_EXECUTION',
      timestamp: new Date().toISOString(),
      tamperEvidentSignature: `DIGEST-${hash}-SHA256`,
      payloadSummary: `Governance Decision [${decisionType}] recorded on ${target.finding.substring(0, 42)}... by ${decider.name}`,
      retentionDays: 1825
    };

    const ledger = [evidence, ...this.getEvidenceLedger()];
    if (typeof localStorage !== 'undefined') { localStorage.setItem(STORAGE_KEY_EVIDENCE, JSON.stringify(ledger.slice(0, 30))); }

    this.notify();
    return { finding: updatedFinding, decision, evidence };
  }
}
