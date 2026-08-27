/**
 * Authoritative Store for Regulatory Dossiers & Technical Evidence Export Packages
 * Pillar: ASSURE (Can we package governance proof for an auditor/regulator?)
 * Causal Pipeline: Controls -> Policies -> Findings -> Risks -> Decisions -> Actions/Incidents -> Evidence -> Ledger -> Dossier Package
 */

export type RegulatoryFramework = 'EU_AI_ACT' | 'LGPD_RIPD' | 'NIST_AI_RMF' | 'ISO_IEC_42001';
export type DossierStatus = 'DRAFT' | 'GENERATED' | 'INTEGRITY_VERIFIED' | 'EXPORTED';

export interface RegulatoryDossier {
  dossierId: string;
  title: string;
  framework: RegulatoryFramework;
  frameworkStandard: string;
  targetScope: string;
  targetEntityId: string;
  version: string;
  generatedAt: string;
  custodian: string;
  status: DossierStatus;
  packageHash: string;
  evidenceRefs: string[];
  ledgerBlockRefs: string[];
  controlsCovered: string[];
  executiveSummary: string;
  sections: {
    sectionId: string;
    sectionTitle: string;
    regulatoryClause: string;
    contentSummary: string;
    linkedEvidenceId?: string;
  }[];
}

const STORAGE_KEY_DOSSIERS = 'cg_ag_dossiers_catalog_v1';

const BASELINE_DOSSIERS: RegulatoryDossier[] = [
  {
    dossierId: 'DOS-2026-EUAI-001',
    title: 'EU AI Act High-Risk Technical Documentation Dossier (Annex IV / Art. 11, 12, 14)',
    framework: 'EU_AI_ACT',
    frameworkStandard: 'Regulation (EU) 2024/1689 (Annex IV & Articles 9, 11, 12, 14)',
    targetScope: 'Credit Risk Scoring Orchestrator (SYS-CREDIT-001)',
    targetEntityId: 'AGT-CREDIT-911E',
    version: 'v2.4.0-FINAL',
    generatedAt: '2026-08-27T19:30:00Z',
    custodian: 'Roberto Silva (CISO & Accountable Lead)',
    status: 'INTEGRITY_VERIFIED',
    packageHash: 'SHA256:8f4c219803b92ac7184ef9281746192837461928374619283746192837461928',
    evidenceRefs: ['EV-2026-0042', 'EV-2026-0001', 'EV-2026-0055', 'EV-2026-0088'],
    ledgerBlockRefs: ['LEDGER-BLK-0012', 'LEDGER-BLK-0062', 'LEDGER-BLK-0074', 'LEDGER-BLK-0089'],
    controlsCovered: ['CG-AG-01', 'CG-AG-02', 'CG-AG-03', 'CG-AG-05', 'CG-AG-07', 'CG-AG-12'],
    executiveSummary: 'Comprehensive technical documentation file compiled to support independent conformity assessment under EU AI Act Annex IV for credit scoring high-risk AI system.',
    sections: [
      {
        sectionId: 'SEC-01',
        sectionTitle: 'System Description & Intended Purpose',
        regulatoryClause: 'Annex IV (1)(a)',
        contentSummary: 'Autonomous Bounded credit risk evaluator (Tier L3) with deterministic parameter boundary capping.',
        linkedEvidenceId: 'EV-2026-0001'
      },
      {
        sectionId: 'SEC-02',
        sectionTitle: 'Risk Management & Mitigation Strategy',
        regulatoryClause: 'Article 9',
        contentSummary: 'Formal decision signed to mitigate unbounded tool access with parameter boundary capping at R$ 50k.',
        linkedEvidenceId: 'EV-2026-0042'
      },
      {
        sectionId: 'SEC-03',
        sectionTitle: 'Human-in-the-Loop Oversight Mechanisms',
        regulatoryClause: 'Article 14',
        contentSummary: 'Runtime HITL interception gate for high-value evaluations and database schema modifications.',
        linkedEvidenceId: 'EV-2026-0088'
      },
      {
        sectionId: 'SEC-04',
        sectionTitle: 'Automatic Event Logging & Auditability',
        regulatoryClause: 'Article 12',
        contentSummary: 'Continuous cryptographic logging into SHA-256 tamper-evident chained audit ledger.',
        linkedEvidenceId: 'EV-2026-0055'
      }
    ]
  },
  {
    dossierId: 'DOS-2026-LGPD-002',
    title: 'Relatório de Impacto à Proteção de Dados Pessoais (RIPD / Art. 38 LGPD)',
    framework: 'LGPD_RIPD',
    frameworkStandard: 'Lei Geral de Proteção de Dados (Lei 13.709/2018 - Art. 38)',
    targetScope: 'Automated CRM Campaign Dispatcher & Data Enrichment Pipeline',
    targetEntityId: 'SYS-MKTG-002',
    version: 'v1.1.0-SEALED',
    generatedAt: '2026-08-27T16:00:00Z',
    custodian: 'Juliana Paes (Data Protection Lead)',
    status: 'INTEGRITY_VERIFIED',
    packageHash: 'SHA256:2d18471928374619283746192837461928374619283746192837461928374619',
    evidenceRefs: ['EV-2026-0019', 'EV-2026-0055'],
    ledgerBlockRefs: ['LEDGER-BLK-0062', 'LEDGER-BLK-0078'],
    controlsCovered: ['CG-AG-01', 'CG-AG-04', 'CG-AG-05', 'CG-AG-08'],
    executiveSummary: 'Formal impact assessment and risk mitigation report regarding personal data processing and AI gateway isolation.',
    sections: [
      {
        sectionId: 'RIPD-01',
        sectionTitle: 'Identificação dos Agentes de Tratamento & Finalidade',
        regulatoryClause: 'Art. 38, I',
        contentSummary: 'Finalidade estrita de enriquecimento cadastral com isolamento de API direta e passagem por proxy corporate.'
      },
      {
        sectionId: 'RIPD-02',
        sectionTitle: 'Medidas de Segurança, Técnicas e Administrativas',
        regulatoryClause: 'Art. 38, II & Art. 46',
        contentSummary: 'Remediação de Shadow AI concluída com PR #89 e validação de gateway corporativo com controle de tokens.',
        linkedEvidenceId: 'EV-2026-0019'
      }
    ]
  },
  {
    dossierId: 'DOS-2026-NIST-003',
    title: 'NIST AI Risk Management Framework Comprehensive Audit Pack (NIST AI RMF 1.0)',
    framework: 'NIST_AI_RMF',
    frameworkStandard: 'NIST AI 100-1 (GOVERN, MAP, MEASURE, MANAGE)',
    targetScope: 'Enterprise Autonomous AI Ecosystem',
    targetEntityId: 'ALL_ENTERPRISE',
    version: 'v3.0.0-AUDIT',
    generatedAt: '2026-08-27T18:00:00Z',
    custodian: 'Carlos Mendoza (AppSec & AI Governance Lead)',
    status: 'INTEGRITY_VERIFIED',
    packageHash: 'SHA256:7c99182374619283746192837461928374619283746192837461928374619283',
    evidenceRefs: ['EV-2026-0001', 'EV-2026-0042', 'EV-2026-0091'],
    ledgerBlockRefs: ['LEDGER-BLK-0012', 'LEDGER-BLK-0082', 'LEDGER-BLK-0089'],
    controlsCovered: ['CG-AG-01', 'CG-AG-02', 'CG-AG-03', 'CG-AG-04', 'CG-AG-05', 'CG-AG-06', 'CG-AG-07', 'CG-AG-08', 'CG-AG-09', 'CG-AG-10', 'CG-AG-11', 'CG-AG-12'],
    executiveSummary: 'Full-spectrum audit pack aligned with NIST AI RMF core functions to support third-party risk assessment.',
    sections: [
      {
        sectionId: 'NIST-GOV',
        sectionTitle: 'GOVERN: Culture, Policies and System Transparency',
        regulatoryClause: 'GOVERN 1.1 - 1.4',
        contentSummary: '12 CG-AG baseline controls established and enforced via Policy Engine and CISO accountability.'
      },
      {
        sectionId: 'NIST-MAN',
        sectionTitle: 'MANAGE: Incident Response & Runtime Failsafes',
        regulatoryClause: 'MANAGE 3.1 - 3.4',
        contentSummary: 'Autonomous circuit breaker mechanism with Hard-Kill and Safe-Fallback triggers.',
        linkedEvidenceId: 'EV-2026-0091'
      }
    ]
  }
];

export class DossierStore {
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

  static getDossiers(): RegulatoryDossier[] {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY_DOSSIERS);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          // fallback
        }
      }
    }
    return BASELINE_DOSSIERS;
  }

    static updateDossierContextFromScan(compliance: any) {
    this.notify();
  }

static markDossierExported(dossierId: string): RegulatoryDossier {
    const list = this.getDossiers();
    const index = list.findIndex(d => d.dossierId === dossierId);
    if (index === -1) throw new Error(`Dossier ${dossierId} not found`);

    list[index] = {
      ...list[index],
      status: 'EXPORTED'
    };

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_DOSSIERS, JSON.stringify(list));
    }

    this.notify();
    return list[index];
  }
}
