/**
 * Authoritative Store for Runtime Human-in-the-Loop (HITL) Gate Approvals
 * Causal Pipeline: Policy Trigger -> Requested Action -> Runtime Gate -> Human Sign-off -> Authorization Recorded -> Evidence
 */

import { DecisionStore } from './decision-store';
import { ProtectedEvidenceRecord } from '../../core/governance-control-plane';

export type GateStatus = 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'EXPIRED_BLOCKED';

export interface HITLApprovalRequest {
  sourceType?: 'REAL_SCAN' | 'CANONICAL_BASELINE' | 'SIMULATION';
  scanId?: string;
  sourceRepository?: string;
  createdFromScan?: boolean;
  gateId: string;
  actionTitle: string;
  agentId: string;
  agentName: string;
  systemId: string;
  systemName: string;
  requestedActionType: string;
  actionPayload: Record<string, any>;
  policyId: string;
  policyName: string;
  controlId: string;
  controlName: string;
  riskTier: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  triggerReason: string;
  thresholdApplied: string;
  requestedAt: string;
  slaDeadline: string;
  status: GateStatus;
  approvalOutcome?: {
    decidedBy: string;
    role: string;
    decidedAt: string;
    decision: 'APPROVE' | 'REJECT';
    rationale: string;
    executionState: 'AUTHORIZATION_GRANTED' | 'EXECUTION_BLOCKED';
    evidenceDigest: string;
  };
}

const STORAGE_KEY_HITL = 'cg_ag_hitl_gates_v2';

const BASELINE_GATES: HITLApprovalRequest[] = [
  {
    gateId: 'GATE-2026-8801',
    actionTitle: 'Corporate Working Capital Loan Disbursal (R$ 120,000)',
    agentId: 'AGT-CREDIT-911E',
    agentName: 'Credit Risk Evaluator',
    systemId: 'SYS-CREDIT-001',
    systemName: 'Credit Risk Scoring Orchestrator',
    requestedActionType: 'LoanOfferGenerator.executeDisbursement',
    actionPayload: {
      borrowerCnpj: '12.345.678/0001-90',
      borrowerName: 'Acme Logistics SA',
      creditScore: 842,
      requestedAmountBRL: 120000,
      interestRateAnnual: 0.145,
      collateralType: 'RECEIVABLES_ESCROW'
    },
    policyId: 'POL-CG-AG-03-01',
    policyName: 'Tier-2 High-Risk Autonomous Action Human Sign-Off Policy',
    controlId: 'CG-AG-03',
    controlName: 'Human-in-the-Loop Oversight',
    riskTier: 'CRITICAL',
    triggerReason: 'Transaction amount exceeds autonomous approval boundary (> R$ 50,000)',
    thresholdApplied: 'Max Autonomous Limit = R$ 50,000.00',
    requestedAt: '2026-08-27T18:45:00Z',
    slaDeadline: '2026-08-27T20:00:00Z',
    status: 'PENDING_REVIEW'
  },
  {
    gateId: 'GATE-2026-8802',
    actionTitle: 'Bulk Customer Outreach Campaign Trigger (15,000 Accounts)',
    agentId: 'AGT-SUPPORT-49F1',
    agentName: 'Customer Campaign Bot',
    systemId: 'SYS-MKTG-002',
    systemName: 'Automated CRM Campaign Dispatcher',
    requestedActionType: 'SendgridWebhook.dispatchBatchEmail',
    actionPayload: {
      campaignId: 'PROMO-2026-Q3-RECOVERY',
      audienceCount: 15000,
      templateId: 'tpl_credit_recovery_v3',
      unmaskedPiiIncluded: false
    },
    policyId: 'POL-CG-AG-03-01',
    policyName: 'Tier-2 High-Risk Autonomous Action Human Sign-Off Policy',
    controlId: 'CG-AG-03',
    controlName: 'Human-in-the-Loop Oversight',
    riskTier: 'HIGH',
    triggerReason: 'Outreach volume exceeds automated broadcast threshold (> 5,000 accounts)',
    thresholdApplied: 'Max Batch Volume = 5,000 recipients',
    requestedAt: '2026-08-27T19:10:00Z',
    slaDeadline: '2026-08-27T21:00:00Z',
    status: 'PENDING_REVIEW'
  },
  {
    gateId: 'GATE-2026-8799',
    actionTitle: 'Automated Production Database Index Rebuild',
    agentId: 'AGT-OPS-1102',
    agentName: 'Ops Executor',
    systemId: 'SYS-MAINT-007',
    systemName: 'System Maintenance Bot',
    requestedActionType: 'PostgresTool.reindexTable',
    actionPayload: {
      targetDatabase: 'prod_transaction_db',
      tableName: 'ledger_entries',
      estimatedLockSeconds: 45
    },
    policyId: 'POL-CG-AG-02-01',
    policyName: 'Agent Least-Privilege Tool Authorization & Scoping Policy',
    controlId: 'CG-AG-02',
    controlName: 'Agent & Tool Scoping',
    riskTier: 'HIGH',
    triggerReason: 'High-privilege DDL write operation on production core banking database',
    thresholdApplied: 'Zero Unattended DDL on Prod DB',
    requestedAt: '2026-08-27T14:00:00Z',
    slaDeadline: '2026-08-27T14:30:00Z',
    status: 'REJECTED',
    approvalOutcome: {
      decidedBy: 'Roberto Silva',
      role: 'CISO & Accountable Lead',
      decidedAt: '2026-08-27T14:15:00Z',
      decision: 'REJECT',
      rationale: 'Unscheduled table reindex on production database blocked. Must be performed during designated maintenance window.',
      executionState: 'EXECUTION_BLOCKED',
      evidenceDigest: 'DIGEST-GATE-8799-REJECT-SHA256'
    }
  }
];

export class HitlStore {
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

  static getGates(): HITLApprovalRequest[] {
    if (this.scanGatesOverride) {
      return JSON.parse(JSON.stringify(this.scanGatesOverride));
    }
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY_HITL);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          // fallback
        }
      }
    }
    return BASELINE_GATES;
  }

    private static scanGatesOverride: HITLApprovalRequest[] | null = null;

  static ingestGates(gates: HITLApprovalRequest[]) {
    this.scanGatesOverride = gates;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_HITL, JSON.stringify(gates));
    }
    this.notify();
  }

  static resetToBaseline() {
    this.scanGatesOverride = null;
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY_HITL);
    }
    this.notify();
  }

static executeHumanApproval(
    gateId: string,
    decision: 'APPROVE' | 'REJECT',
    rationale: string,
    decidedBy = 'Roberto Silva',
    role = 'CISO & Accountable Lead'
  ): { gate: HITLApprovalRequest; evidence: ProtectedEvidenceRecord } {
    const gates = this.getGates();
    const index = gates.findIndex(g => g.gateId === gateId);
    if (index === -1) {
      throw new Error(`Gate ${gateId} not found`);
    }

    const targetGate = gates[index];
    const hash = Math.random().toString(36).substring(2, 10).toUpperCase();
    const digest = `DIGEST-HITL-${decision}-${hash}-SHA256`;

    const updatedGate: HITLApprovalRequest = {
      ...targetGate,
      status: decision === 'APPROVE' ? 'APPROVED' : 'REJECTED',
      approvalOutcome: {
        decidedBy,
        role,
        decidedAt: new Date().toISOString(),
        decision,
        rationale,
        executionState: decision === 'APPROVE' ? 'AUTHORIZATION_GRANTED' : 'EXECUTION_BLOCKED',
        evidenceDigest: digest
      }
    };

    gates[index] = updatedGate;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_HITL, JSON.stringify(gates));
    }

    // Record Protected Evidence in Ledger
    const evidence: ProtectedEvidenceRecord = {
      evidenceId: `EV-HITL-${Date.now().toString(36).toUpperCase()}`,
      entityType: 'AGENT',
      entityId: targetGate.agentId,
      controlId: targetGate.controlId,
      eventType: 'DECISION_EXECUTION',
      timestamp: new Date().toISOString(),
      tamperEvidentSignature: digest,
      payloadSummary: `Runtime Human Gate [${decision}] on ${targetGate.actionTitle} by ${decidedBy}`,
      retentionDays: 1825
    };

    if (typeof localStorage !== 'undefined') {
      const ledger = [evidence, ...DecisionStore.getEvidenceLedger()];
      localStorage.setItem('cg_ag_unified_evidence_v2', JSON.stringify(ledger.slice(0, 30)));
    }

    this.notify();
    return { gate: updatedGate, evidence };
  }
}
