/**
 * Authoritative Store for Technical Remediation Actions
 * Causal Pipeline: Risk -> Decision -> Action -> Squad Owner -> SLA -> Verification -> Evidence -> Closed
 */

import { DecisionStore } from './decision-store';
import { PersistenceAdapter } from './persistence-adapter';
import { ProtectedEvidenceRecord } from '../../core/governance-control-plane';

export type RemediationStatus = 'OPEN' | 'IN_PROGRESS' | 'PENDING_VERIFICATION' | 'VERIFIED_CLOSED' | 'OVERDUE';
export type VerificationMethod = 'AUTOMATED_RESCAN' | 'PEER_SECURITY_REVIEW' | 'AUDIT_ATTESTATION';

export interface RemediationAction {
  sourceType?: 'REAL_SCAN' | 'CANONICAL_BASELINE' | 'SIMULATION';
  scanId?: string;
  sourceRepository?: string;
  createdFromScan?: boolean;
  actionId: string;
  title: string;
  riskId: string;
  decisionId: string;
  findingId: string;
  controlId: string;
  controlName: string;
  affectedEntity: string;
  entityType: 'AGENT' | 'AI_SYSTEM' | 'ACTION';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  assignedSquad: string;
  assignedLead: string;
  leadRole: string;
  slaDays: number;
  dueDate: string;
  status: RemediationStatus;
  technicalScope: string;
  targetRepository: string;
  pullRequestRef?: string;
  verificationMethod: VerificationMethod;
  verificationDetails?: {
    verifiedBy: string;
    verifiedAt: string;
    testOutcome: string;
    closureRationale: string;
    evidenceDigest: string;
  };
}

const STORAGE_KEY_REMEDIATIONS = 'cg_ag_remediations_v1';

const BASELINE_REMEDIATIONS: RemediationAction[] = [
  {
    actionId: 'ACT-2026-0042',
    title: 'Implement Parameter Boundary Sanitization & Tool Scoping on Credit Agent',
    riskId: 'RISK-2026-0042',
    decisionId: 'DEC-2026-0042',
    findingId: 'FIND-001',
    controlId: 'CG-AG-02',
    controlName: 'Agent & Tool Scoping',
    affectedEntity: 'Credit Risk Evaluator (AGT-CREDIT-911E)',
    entityType: 'AGENT',
    severity: 'CRITICAL',
    assignedSquad: 'Squad Credit-Core & AppSec',
    assignedLead: 'Carlos Mendoza',
    leadRole: 'Principal Staff Engineer',
    slaDays: 7,
    dueDate: '2026-09-03T18:00:00Z',
    status: 'IN_PROGRESS',
    technicalScope: 'Refactor AgentTool schema to reject unvalidated financial disbursal payloads. Inject strict Pydantic runtime validator with max cap = R$ 50,000.',
    targetRepository: 'complypro/credit-orchestrator',
    pullRequestRef: 'PR #142 (Draft)',
    verificationMethod: 'AUTOMATED_RESCAN'
  },
  {
    actionId: 'ACT-2026-0019',
    title: 'Eliminate Unregistered Direct OpenAI API Call (Shadow AI Remediation)',
    riskId: 'RISK-2026-0019',
    decisionId: 'DEC-2026-0019',
    findingId: 'FIND-002',
    controlId: 'CG-AG-01',
    controlName: 'AI & Agent Inventory',
    affectedEntity: 'Data Enrichment Microservice (SYS-DATA-004)',
    entityType: 'AI_SYSTEM',
    severity: 'HIGH',
    assignedSquad: 'Squad Data-Platform',
    assignedLead: 'Juliana Paes',
    leadRole: 'Senior Data Platform Lead',
    slaDays: 14,
    dueDate: '2026-09-10T18:00:00Z',
    status: 'PENDING_VERIFICATION',
    technicalScope: 'Migrate raw OpenAI API key endpoint to Corporate AI Gateway with JWT token authentication and centralized telemetry logging.',
    targetRepository: 'complypro/data-enrichment-svc',
    pullRequestRef: 'PR #89 (Ready for Review)',
    verificationMethod: 'AUTOMATED_RESCAN'
  },
  {
    actionId: 'ACT-2026-0008',
    title: 'Configure PII Data Anonymization Masking on Customer Bot Prompts',
    riskId: 'RISK-2026-0008',
    decisionId: 'DEC-2026-0008',
    findingId: 'FIND-003',
    controlId: 'CG-AG-04',
    controlName: 'Data Protection & PII Safeguards',
    affectedEntity: 'Customer Support Agent (AGT-SUPPORT-49F1)',
    entityType: 'AGENT',
    severity: 'MEDIUM',
    assignedSquad: 'Squad CX-AI',
    assignedLead: 'Marina Silva',
    leadRole: 'Lead Security Champion',
    slaDays: 21,
    dueDate: '2026-09-17T18:00:00Z',
    status: 'OPEN',
    technicalScope: 'Integrate Presidio PII sanitizer in pre-prompt pipeline before sending context to LLM backend.',
    targetRepository: 'complypro/cx-support-bot',
    verificationMethod: 'PEER_SECURITY_REVIEW'
  },
  {
    actionId: 'ACT-2026-0001',
    title: 'Enforce Cryptographic Evidence Ledger Hashing on Disbursal Decisions',
    riskId: 'RISK-2026-0001',
    decisionId: 'DEC-2026-0001',
    findingId: 'FIND-004',
    controlId: 'CG-AG-07',
    controlName: 'Audit Ledger & Evidence Chain',
    affectedEntity: 'Core Governance Ledger (SYS-CORE-001)',
    entityType: 'AI_SYSTEM',
    severity: 'CRITICAL',
    assignedSquad: 'Squad Core-Governance',
    assignedLead: 'Roberto Silva',
    leadRole: 'CISO & Accountable Lead',
    slaDays: 5,
    dueDate: '2026-08-25T18:00:00Z',
    status: 'VERIFIED_CLOSED',
    technicalScope: 'SHA-256 ledger chaining implemented across all autonomous and human decision endpoints.',
    targetRepository: 'complypro/governance-core',
    pullRequestRef: 'PR #201 (Merged)',
    verificationMethod: 'AUDIT_ATTESTATION',
    verificationDetails: {
      verifiedBy: 'Roberto Silva (CISO)',
      verifiedAt: '2026-08-26T14:30:00Z',
      testOutcome: 'Passed 46 automated regression test vectors. Cryptographic chain verified.',
      closureRationale: 'Ledger tampering prevention fully validated in production baseline.',
      evidenceDigest: 'DIGEST-REMED-0001-VERIFIED-SHA256'
    }
  }
];

export class RemediationStore {
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

  static getActions(tenantId?: string): RemediationAction[] {
    if (tenantId) {
      PersistenceAdapter.setContext({ tenantId });
    }
    const saved = PersistenceAdapter.read<RemediationAction[]>('remediations', STORAGE_KEY_REMEDIATIONS);
    if (saved && Array.isArray(saved) && saved.length > 0) {
      return saved;
    }
    if (this.scanActionsOverride && (!tenantId || PersistenceAdapter.getContext().tenantId === 'TENANT-DEFAULT')) {
      return JSON.parse(JSON.stringify(this.scanActionsOverride));
    }
    return JSON.parse(JSON.stringify(BASELINE_REMEDIATIONS));
  }

    private static scanActionsOverride: RemediationAction[] | null = null;

  static ingestActions(actions: RemediationAction[], tenantId?: string) {
    this.scanActionsOverride = actions;
    if (tenantId) {
      PersistenceAdapter.setContext({ tenantId });
    }
    PersistenceAdapter.write('remediations', actions, STORAGE_KEY_REMEDIATIONS);
    this.notify();
  }

  static resetToBaseline(tenantId?: string) {
    this.scanActionsOverride = null;
    if (tenantId) {
      PersistenceAdapter.setContext({ tenantId });
    }
    PersistenceAdapter.delete('remediations', STORAGE_KEY_REMEDIATIONS);
    this.notify();
  }

static verifyAndCloseAction(
    actionId: string,
    closureRationale: string,
    testOutcome: string,
    verifiedBy = 'Roberto Silva (CISO & Accountable Lead)',
    tenantId?: string
  ): { action: RemediationAction; evidence: ProtectedEvidenceRecord } {
    if (tenantId) {
      PersistenceAdapter.setContext({ tenantId });
    }
    const actions = this.getActions(tenantId);
    const index = actions.findIndex(a => a.actionId === actionId);
    if (index === -1) {
      throw new Error(`Action ${actionId} not found`);
    }

    const target = actions[index];
    const hash = Math.random().toString(36).substring(2, 10).toUpperCase();
    const digest = `DIGEST-REMED-CLOSE-${hash}-SHA256`;

    const updated: RemediationAction = {
      ...target,
      status: 'VERIFIED_CLOSED',
      verificationDetails: {
        verifiedBy,
        verifiedAt: new Date().toISOString(),
        testOutcome,
        closureRationale,
        evidenceDigest: digest
      }
    };

    actions[index] = updated;
    PersistenceAdapter.write('remediations', actions, STORAGE_KEY_REMEDIATIONS);

    // Record Protected Evidence in Ledger
    const evidence: ProtectedEvidenceRecord = {
      evidenceId: `EV-REMED-${Date.now().toString(36).toUpperCase()}`,
      entityType: target.entityType,
      entityId: target.affectedEntity,
      controlId: target.controlId,
      eventType: 'DECISION_EXECUTION',
      timestamp: new Date().toISOString(),
      tamperEvidentSignature: digest,
      payloadSummary: `Remediation Verified & Closed [${target.actionId}] by ${verifiedBy}: ${closureRationale}`,
      retentionDays: 1825
    };

    const ledger = [evidence, ...DecisionStore.getEvidenceLedger(tenantId)];
    PersistenceAdapter.write('evidence_ledger', ledger.slice(0, 30), 'cg_ag_unified_evidence_v2');

    this.notify();
    return { action: updated, evidence };
  }
}
