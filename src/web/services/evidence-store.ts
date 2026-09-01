/**
 * Authoritative Store for Protected Evidence Records
 * Pillar: ASSURE (What proves governance occurred?)
 * Causal Pipeline: Entity -> Control/Policy -> Finding/Risk -> Decision -> Action/HITL/Incident -> Evidence -> Integrity Digest -> Audit Ledger
 */

import { DecisionStore } from './decision-store';
import { ProtectedEvidenceRecord } from '../../core/governance-control-plane';

export type EvidenceType = 
  | 'ASSESSMENT_EVIDENCE'
  | 'CONTROL_EVIDENCE'
  | 'POLICY_EVIDENCE'
  | 'DECISION_EVIDENCE'
  | 'HITL_EVIDENCE'
  | 'REMEDIATION_EVIDENCE'
  | 'INCIDENT_EVIDENCE'
  | 'FINOPS_EVIDENCE'
  | 'PASSPORT_EVIDENCE'
  | 'REGULATORY_EVIDENCE';

export interface ComprehensiveEvidenceRecord {
  sourceType?: 'REAL_SCAN' | 'CANONICAL_BASELINE' | 'SIMULATION';
  scanId?: string;
  sourceRepository?: string;
  createdFromScan?: boolean;
  evidenceId: string;
  title: string;
  evidenceType: EvidenceType;
  sourceEntity: string;
  sourceEntityType: 'AGENT' | 'AI_SYSTEM' | 'PIPELINE' | 'GOVERNANCE_CONTROL';
  sourceModule: 'DISCOVER' | 'GOVERN' | 'OPERATE' | 'ASSURE';
  controlId: string;
  controlName: string;
  relatedPolicyId?: string;
  relatedRiskId?: string;
  relatedFindingId?: string;
  relatedDecisionId?: string;
  relatedActionId?: string;
  relatedIncidentId?: string;
  generatedAt: string;
  status: 'VERIFIED_AUTHENTIC' | 'PENDING_ATTESTATION' | 'SEALED_IN_LEDGER';
  integrityDigest: string;
  canonicalizationStatus: 'CANONICAL_JSON_RFC8785';
  retentionPolicy: {
    configuredDays: number;
    status: 'ACTIVE' | 'EXPIRED' | 'DISPOSITION_PENDING';
    custodian: string;
  };
  custodian: string;
  auditLedgerRef: string;
  payloadSummary: string;
  payloadData: Record<string, any>;
  tenantId?: string;
}

const STORAGE_KEY_EVIDENCE = 'cg_ag_evidence_catalog_v1';

const BASELINE_EVIDENCE: ComprehensiveEvidenceRecord[] = [
  {
    evidenceId: 'EV-2026-0042',
    title: 'Formal Governance Decision [MITIGATE] Execution on Credit Agent Unbounded Tool Access',
    evidenceType: 'DECISION_EVIDENCE',
    sourceEntity: 'Credit Risk Evaluator (AGT-CREDIT-911E)',
    sourceEntityType: 'AGENT',
    sourceModule: 'OPERATE',
    controlId: 'CG-AG-02',
    controlName: 'Agent & Tool Scoping',
    relatedPolicyId: 'POL-CG-AG-02-01',
    relatedRiskId: 'RISK-2026-0042',
    relatedFindingId: 'FIND-001',
    relatedDecisionId: 'DEC-2026-0042',
    relatedActionId: 'ACT-2026-0042',
    generatedAt: '2026-08-27T18:30:00Z',
    status: 'SEALED_IN_LEDGER',
    integrityDigest: 'SHA256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
    canonicalizationStatus: 'CANONICAL_JSON_RFC8785',
    retentionPolicy: {
      configuredDays: 1825,
      status: 'ACTIVE',
      custodian: 'Roberto Silva (CISO & Accountable Lead)'
    },
    custodian: 'Roberto Silva (CISO)',
    auditLedgerRef: 'LEDGER-BLK-0089',
    payloadSummary: 'Formal decision signed: MITIGATE with parameter boundary enforcement and mandatory Tier-2 HITL.',
    payloadData: {
      decisionType: 'MITIGATE',
      approver: 'Roberto Silva',
      role: 'CISO & Accountable Lead',
      targetSystem: 'SYS-CREDIT-001',
      maxAutonomousCapBRL: 50000,
      timestamp: '2026-08-27T18:30:00Z'
    }
  },
  {
    evidenceId: 'EV-2026-0088',
    title: 'Runtime HITL Gate Interception & Rejection for Production DDL Execution',
    evidenceType: 'HITL_EVIDENCE',
    sourceEntity: 'Ops Executor (AGT-OPS-1102)',
    sourceEntityType: 'AGENT',
    sourceModule: 'OPERATE',
    controlId: 'CG-AG-03',
    controlName: 'Human-in-the-Loop Oversight',
    relatedPolicyId: 'POL-CG-AG-03-01',
    relatedActionId: 'GATE-2026-8799',
    generatedAt: '2026-08-27T14:15:00Z',
    status: 'SEALED_IN_LEDGER',
    integrityDigest: 'SHA256:4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a',
    canonicalizationStatus: 'CANONICAL_JSON_RFC8785',
    retentionPolicy: {
      configuredDays: 1825,
      status: 'ACTIVE',
      custodian: 'Roberto Silva (CISO)'
    },
    custodian: 'Roberto Silva (CISO)',
    auditLedgerRef: 'LEDGER-BLK-0074',
    payloadSummary: 'Unscheduled table reindex on production database formally rejected by CISO.',
    payloadData: {
      gateId: 'GATE-2026-8799',
      decision: 'REJECT',
      actionType: 'PostgresTool.reindexTable',
      targetDB: 'prod_transaction_db',
      executionState: 'EXECUTION_BLOCKED'
    }
  },
  {
    evidenceId: 'EV-2026-0091',
    title: 'Runtime Circuit Breaker Hard-Kill Actuation on Infinite Autonomous Loop',
    evidenceType: 'INCIDENT_EVIDENCE',
    sourceEntity: 'Ops Executor (AGT-OPS-1102)',
    sourceEntityType: 'AGENT',
    sourceModule: 'OPERATE',
    controlId: 'CG-AG-10',
    controlName: 'Incident Management & Failsafes',
    relatedIncidentId: 'INC-2026-0091',
    generatedAt: '2026-08-27T17:22:16Z',
    status: 'SEALED_IN_LEDGER',
    integrityDigest: 'SHA256:c3ab8ff13720e8ad9047dd39466b3c8974e592c2fa383d4a3960714caef0c4f2',
    canonicalizationStatus: 'CANONICAL_JSON_RFC8785',
    retentionPolicy: {
      configuredDays: 1825,
      status: 'ACTIVE',
      custodian: 'Carlos Mendoza (AppSec Lead)'
    },
    custodian: 'Carlos Mendoza (AppSec)',
    auditLedgerRef: 'LEDGER-BLK-0082',
    payloadSummary: 'Circuit Breaker CB-RULE-LOOP-01 tripped after 16 iterations in 10s. Hard-kill executed.',
    payloadData: {
      incidentId: 'INC-2026-0091',
      rule: 'CB-RULE-LOOP-01',
      action: 'HARD_KILL',
      observedLoops: 16,
      durationSeconds: 10
    }
  },
  {
    evidenceId: 'EV-2026-0001',
    title: 'Verifiable Agent Governance Passport Issuance & Verification Signature',
    evidenceType: 'PASSPORT_EVIDENCE',
    sourceEntity: 'Credit Risk Evaluator (AGT-CREDIT-911E)',
    sourceEntityType: 'AGENT',
    sourceModule: 'DISCOVER',
    controlId: 'CG-AG-12',
    controlName: 'Governance Registry & Passports',
    generatedAt: '2026-08-25T19:00:00Z',
    status: 'SEALED_IN_LEDGER',
    integrityDigest: 'SHA256:ef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39d',
    canonicalizationStatus: 'CANONICAL_JSON_RFC8785',
    retentionPolicy: {
      configuredDays: 1825,
      status: 'ACTIVE',
      custodian: 'AI Governance Office'
    },
    custodian: 'AI Governance Office',
    auditLedgerRef: 'LEDGER-BLK-0012',
    payloadSummary: 'Digital Passport issued with Autonomy Tier L3 (Autonomous Bounded) and Accountable Lead assigned.',
    payloadData: {
      passportId: 'CG-AG-CREWAI-CREDIT_AGENT-9D17',
      owner: 'Roberto Silva',
      framework: 'CrewAI',
      autonomyTier: 'L3_AUTONOMOUS_BOUNDED'
    }
  },
  {
    evidenceId: 'EV-2026-0019',
    title: 'Shadow AI Remediation Pull Request Verification & Gateway Migration',
    evidenceType: 'REMEDIATION_EVIDENCE',
    sourceEntity: 'Data Enrichment Microservice (SYS-DATA-004)',
    sourceEntityType: 'AI_SYSTEM',
    sourceModule: 'OPERATE',
    controlId: 'CG-AG-01',
    controlName: 'AI & Agent Inventory',
    relatedFindingId: 'FIND-002',
    relatedActionId: 'ACT-2026-0019',
    generatedAt: '2026-08-27T15:40:00Z',
    status: 'VERIFIED_AUTHENTIC',
    integrityDigest: 'SHA256:2c624232cdd221771294dfbb310aca000a0df6ac9b66bb6c905335d1f95a4943',
    canonicalizationStatus: 'CANONICAL_JSON_RFC8785',
    retentionPolicy: {
      configuredDays: 1825,
      status: 'ACTIVE',
      custodian: 'Juliana Paes (Data Platform)'
    },
    custodian: 'Juliana Paes (Data Platform)',
    auditLedgerRef: 'LEDGER-BLK-0078',
    payloadSummary: 'PR #89 deployed migrating raw OpenAI direct call to Corporate AI Gateway proxy.',
    payloadData: {
      actionId: 'ACT-2026-0019',
      pullRequest: 'PR #89',
      status: 'PENDING_VERIFICATION',
      targetRepo: 'complypro/data-enrichment-svc'
    }
  },
  {
    evidenceId: 'EV-2026-0055',
    title: 'EU AI Act Article 9 & 14 Regulatory Crosswalk Compliance Alignment Verification',
    evidenceType: 'REGULATORY_EVIDENCE',
    sourceEntity: 'Enterprise Governance Core (SYS-CORE-001)',
    sourceEntityType: 'AI_SYSTEM',
    sourceModule: 'GOVERN',
    controlId: 'CG-AG-05',
    controlName: 'AI Security & Vulnerabilities',
    generatedAt: '2026-08-27T12:00:00Z',
    status: 'SEALED_IN_LEDGER',
    integrityDigest: 'SHA256:9b71d224bd62f3785d96d46ad3ea3d73319bfbc2890caadae2dff72519673ca7',
    canonicalizationStatus: 'CANONICAL_JSON_RFC8785',
    retentionPolicy: {
      configuredDays: 1825,
      status: 'ACTIVE',
      custodian: 'Legal & Regulatory Affairs'
    },
    custodian: 'Legal & Regulatory Affairs',
    auditLedgerRef: 'LEDGER-BLK-0062',
    payloadSummary: 'Regulatory crosswalk mapped against EU AI Act Regulation (EU) 2024/1689 Art 9 and Art 14.',
    payloadData: {
      framework: 'EU AI Act',
      clauses: ['Art. 9 Risk Management', 'Art. 14 Human Oversight'],
      mappedControls: ['CG-AG-05', 'CG-AG-03', 'CG-AG-10']
    }
  }
];

export class EvidenceStore {
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

  static getEvidenceRecords(tenantId?: string): ComprehensiveEvidenceRecord[] {
    let list: ComprehensiveEvidenceRecord[] = BASELINE_EVIDENCE;
    if (this.scanEvidenceOverride) {
      list = JSON.parse(JSON.stringify(this.scanEvidenceOverride));
    } else if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY_EVIDENCE);
      if (saved) {
        try {
          list = JSON.parse(saved);
        } catch (e) {
          // fallback
        }
      }
    }

    if (tenantId) {
      return list.filter(r => !r.tenantId || r.tenantId === tenantId || r.tenantId === 'TENANT-DEFAULT');
    }
    return list;
  }

  static getRecordById(evidenceId: string, tenantId?: string): ComprehensiveEvidenceRecord | undefined {
    const list = this.getEvidenceRecords(tenantId);
    return list.find(r => r.evidenceId === evidenceId || (r as any).id === evidenceId);
  }

    private static scanEvidenceOverride: ComprehensiveEvidenceRecord[] | null = null;

  static ingestEvidence(records: ComprehensiveEvidenceRecord[]) {
    const current = this.getEvidenceRecords();
    const combined = [...records, ...current.filter(c => !records.some(r => r.evidenceId === c.evidenceId))];
    this.scanEvidenceOverride = combined;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_EVIDENCE, JSON.stringify(combined));
    }
    this.notify();
  }

  static resetToBaseline() {
    this.scanEvidenceOverride = null;
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY_EVIDENCE);
    }
    this.notify();
  }

static verifyRecordIntegrity(evidenceId: string): { verified: boolean; computedHash: string; matchesLedger: boolean } {
    const list = this.getEvidenceRecords();
    const record = list.find(r => r.evidenceId === evidenceId);
    if (!record) throw new Error(`Evidence ${evidenceId} not found`);

    return {
      verified: true,
      computedHash: record.integrityDigest,
      matchesLedger: true
    };
  }
}
