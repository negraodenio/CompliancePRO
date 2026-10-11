/**
 * Authoritative Store for Runtime Human-in-the-Loop (HITL) Gate Approvals
 * Causal Pipeline: Policy Trigger -> Requested Action -> Runtime Gate -> Human Sign-off -> Authorization Recorded -> Evidence
 */

import { DecisionStore } from './decision-store';
import { PersistenceAdapter } from './persistence-adapter';
import { computeDeterministicHash } from './audit-ledger-store';
import { ProtectedEvidenceRecord } from '../../core/governance-control-plane';

export type GateStatus = 'PENDING_REVIEW' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'EXPIRED_BLOCKED';

export interface HITLApprovalRequest {
  sourceType?: 'REAL_SCAN' | 'CANONICAL_BASELINE' | 'SIMULATION';
  scanId?: string;
  sourceRepository?: string;
  createdFromScan?: boolean;
  id?: string;
  gateId: string;
  title?: string;
  actionTitle: string;
  agentId: string;
  agentName: string;
  systemId: string;
  systemName: string;
  actionType?: string;
  requestedActionType: string;
  actionPayload: Record<string, any>;
  policyId: string;
  policyName: string;
  controlId: string;
  controlName: string;
  riskLevel?: string;
  riskTier: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  reason?: string;
  triggerReason: string;
  thresholdApplied: string;
  requestedBy?: string;
  requestedAt: string;
  slaDeadline: string;
  status: GateStatus;
  findingId?: string;
  escalationTimeoutMinutes?: number;
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

/** Explicit sentinel: no valid digest exists for this decision (never a fabricated hash). */
export const HITL_DIGEST_UNAVAILABLE = 'UNAVAILABLE';

const HITL_DIGEST_PATTERN = /^SHA256:[0-9a-f]{64}$/;

export function isComputedHitlDigest(digest: string | undefined): boolean {
  return !!digest && HITL_DIGEST_PATTERN.test(digest);
}

/**
 * Genuine SHA-256 digest over the canonical HITL decision payload, using the
 * established audit-ledger implementation (computeDeterministicHash).
 * Returns HITL_DIGEST_UNAVAILABLE when calculation fails — never a fake digest.
 */
export function buildHitlDecisionDigest(decisionData: {
  gateId: string;
  agentId: string;
  controlId: string;
  actionTitle: string;
  decision: 'APPROVE' | 'REJECT';
  rationale: string;
  decidedBy: string;
  role: string;
  decidedAt: string;
  executionState: 'AUTHORIZATION_GRANTED' | 'EXECUTION_BLOCKED';
}): string {
  try {
    const canonical = JSON.stringify(decisionData);
    const digest = computeDeterministicHash(canonical);
    return HITL_DIGEST_PATTERN.test(digest) ? digest : HITL_DIGEST_UNAVAILABLE;
  } catch {
    return HITL_DIGEST_UNAVAILABLE;
  }
}

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
      evidenceDigest: buildHitlDecisionDigest({
        gateId: 'GATE-2026-8799',
        agentId: 'AGT-OPS-1102',
        controlId: 'CG-AG-02',
        actionTitle: 'Automated Production Database Index Rebuild',
        decision: 'REJECT',
        rationale: 'Unscheduled table reindex on production database blocked. Must be performed during designated maintenance window.',
        decidedBy: 'Roberto Silva',
        role: 'CISO & Accountable Lead',
        decidedAt: '2026-08-27T14:15:00Z',
        executionState: 'EXECUTION_BLOCKED'
      })
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

  static getGates(tenantId?: string): HITLApprovalRequest[] {
    if (tenantId) {
      PersistenceAdapter.setContext({ tenantId });
    }
    const saved = PersistenceAdapter.read<HITLApprovalRequest[]>('hitl_gates', STORAGE_KEY_HITL);
    const rawList: HITLApprovalRequest[] = (saved && Array.isArray(saved) && saved.length > 0)
      ? saved
      : (this.scanGatesOverride && (!tenantId || PersistenceAdapter.getContext().tenantId === 'TENANT-DEFAULT')
          ? JSON.parse(JSON.stringify(this.scanGatesOverride))
          : JSON.parse(JSON.stringify(BASELINE_GATES)));

    return rawList.map(g => {
      const gateId = g.gateId || (g as any).id || 'GATE-UNKNOWN';
      const actionTitle = g.actionTitle || (g as any).title || 'Human Authorization Gate';
      const agentId = g.agentId || 'SYSTEM_AGENT';
      const agentName = g.agentName || agentId;
      const systemId = g.systemId || 'SYS-DEFAULT';
      const systemName = g.systemName || systemId;
      const requestedActionType = g.requestedActionType || (g as any).actionType || 'executeAction';
      const riskTier = g.riskTier || (g as any).riskLevel || 'HIGH';
      const triggerReason = g.triggerReason || (g as any).reason || 'Action requires human approval';
      const thresholdApplied = g.thresholdApplied || 'Mandatory HITL Verification';
      const slaDeadline = g.slaDeadline || new Date(Date.now() + 3600000).toISOString();
      const status = (g.status as string) === 'PENDING_APPROVAL' ? 'PENDING_APPROVAL' : (g.status || 'PENDING_REVIEW');

      return {
        ...g,
        id: (g as any).id || gateId,
        gateId,
        title: (g as any).title || actionTitle,
        actionTitle,
        agentId,
        agentName,
        systemId,
        systemName,
        actionType: (g as any).actionType || requestedActionType,
        requestedActionType,
        riskLevel: (g as any).riskLevel || riskTier,
        riskTier,
        reason: (g as any).reason || triggerReason,
        triggerReason,
        thresholdApplied,
        policyId: g.policyId || 'POL-CG-AG-03-01',
        policyName: g.policyName || 'Human-in-the-Loop Oversight Policy',
        controlId: g.controlId || 'CG-AG-03',
        controlName: g.controlName || 'Human-in-the-Loop Oversight',
        slaDeadline,
        status: status as any
      };
    });
  }

  private static scanGatesOverride: HITLApprovalRequest[] | null = null;

  static ingestGates(gates: HITLApprovalRequest[], tenantId?: string) {
    this.scanGatesOverride = gates;
    if (tenantId) {
      PersistenceAdapter.setContext({ tenantId });
    }
    PersistenceAdapter.write('hitl_gates', gates, STORAGE_KEY_HITL);
    this.notify();
  }

  static resetToBaseline(tenantId?: string) {
    this.scanGatesOverride = null;
    if (tenantId) {
      PersistenceAdapter.setContext({ tenantId });
    }
    PersistenceAdapter.delete('hitl_gates', STORAGE_KEY_HITL);
    this.notify();
  }

  static executeHumanApproval(
    gateId: string,
    decision: 'APPROVE' | 'REJECT',
    rationale: string,
    decidedBy = 'Roberto Silva',
    role = 'CISO & Accountable Lead',
    tenantId?: string
  ): { gate: HITLApprovalRequest; evidence: ProtectedEvidenceRecord } {
    if (tenantId) {
      PersistenceAdapter.setContext({ tenantId });
    }
    const gates = this.getGates(tenantId);
    const index = gates.findIndex(g => g.gateId === gateId || (g as any).id === gateId);
    if (index === -1) {
      throw new Error(`Gate ${gateId} not found`);
    }

    const targetGate = gates[index];
    const executionState = decision === 'APPROVE' ? 'AUTHORIZATION_GRANTED' : 'EXECUTION_BLOCKED';
    const decidedAt = new Date().toISOString();
    const digest = buildHitlDecisionDigest({
      gateId: targetGate.gateId,
      agentId: targetGate.agentId,
      controlId: targetGate.controlId,
      actionTitle: targetGate.actionTitle,
      decision,
      rationale,
      decidedBy,
      role,
      decidedAt,
      executionState
    });

    const updatedGate: HITLApprovalRequest = {
      ...targetGate,
      status: decision === 'APPROVE' ? 'APPROVED' : 'REJECTED',
      approvalOutcome: {
        decidedBy,
        role,
        decidedAt,
        decision,
        rationale,
        executionState,
        evidenceDigest: digest
      }
    };

    gates[index] = updatedGate;
    PersistenceAdapter.write('hitl_gates', gates, STORAGE_KEY_HITL);

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

    const ledger = [evidence, ...DecisionStore.getEvidenceLedger(tenantId)];
    PersistenceAdapter.write('evidence_ledger', ledger.slice(0, 30), 'cg_ag_unified_evidence_v2');

    this.notify();
    return { gate: updatedGate, evidence };
  }
}
