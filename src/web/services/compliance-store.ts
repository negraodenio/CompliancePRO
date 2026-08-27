/**
 * Authoritative Regulatory Overlays & Compliance Crosswalk Store
 * Crosswalk Mapping: Regulation / Article -> CG-AG Controls -> Policies -> Evidence -> Ledger
 */

export type RegulatoryPosture = 'ALIGNED' | 'PARTIALLY_ALIGNED' | 'GAP_DETECTED' | 'NOT_APPLICABLE';

export interface RegulatoryClauseMapping {
  clauseId: string;
  article: string;
  title: string;
  requirementSummary: string;
  mappedControlIds: string[];
  mappedPolicyIds: string[];
  posture: RegulatoryPosture;
  compliancePercentage: number;
  gapSummary?: string;
  linkedFindingId?: string;
  evidenceDigest: string;
  regulatoryGuidance: string;
}

export interface ComplianceFramework {
  id: string;
  name: string;
  acronym: string;
  jurisdiction: string;
  authority: string;
  version: string;
  effectiveDate: string;
  status: 'MANDATORY_REGULATION' | 'VOLUNTARY_STANDARD' | 'SECTORAL_DIRECTIVE';
  overallAlignmentScore: number;
  applicableIndustries: string[];
  description: string;
  clauses: RegulatoryClauseMapping[];
  dossierStatus: 'READY_FOR_EXPORT' | 'IN_COMPILATION' | 'ATTENTION_REQUIRED';
}

const BASELINE_FRAMEWORKS: ComplianceFramework[] = [
  {
    id: 'EU_AI_ACT',
    name: 'EU Artificial Intelligence Act',
    acronym: 'EU AI Act',
    jurisdiction: 'European Union (EEA)',
    authority: 'European Artificial Intelligence Board (EAIB)',
    version: 'Regulation (EU) 2024/1689',
    effectiveDate: '2026-08-02',
    status: 'MANDATORY_REGULATION',
    overallAlignmentScore: 82,
    applicableIndustries: ['*'],
    description: 'Harmonised rules on artificial intelligence establishing risk categories, mandatory governance for High-Risk AI systems, transparency requirements, and human oversight.',
    dossierStatus: 'ATTENTION_REQUIRED',
    clauses: [
      {
        clauseId: 'EU-AIA-ART-14',
        article: 'Article 14',
        title: 'Human Oversight & Stop Mechanism',
        requirementSummary: 'High-risk AI systems must be designed to enable natural persons to oversee operation, understand outputs, and override or stop execution at any moment.',
        mappedControlIds: ['CG-AG-03', 'CG-AG-10'],
        mappedPolicyIds: ['POL-CG-AG-03-01'],
        posture: 'GAP_DETECTED',
        compliancePercentage: 68,
        gapSummary: 'Credit Scoring Agent operates autonomous loan approvals exceeding R$ 50,000 without Tier-2 HITL checkpoint.',
        linkedFindingId: 'FIND-001',
        evidenceDigest: 'DIGEST-EU-ART14-SHA256',
        regulatoryGuidance: 'High-Risk Annex III requirement: Multi-tier approvals and real-time kill-switch mandatory.'
      },
      {
        clauseId: 'EU-AIA-ART-09',
        article: 'Article 9',
        title: 'Continuous Risk Management System',
        requirementSummary: 'Establish, implement, document, and maintain a continuous risk management system throughout the entire lifecycle of high-risk AI systems.',
        mappedControlIds: ['CG-AG-05', 'CG-AG-04'],
        mappedPolicyIds: ['POL-CG-AG-04-01'],
        posture: 'ALIGNED',
        compliancePercentage: 90,
        evidenceDigest: 'DIGEST-EU-ART09-SHA256',
        regulatoryGuidance: 'Systematic iterative evaluation from design to decommission.'
      },
      {
        clauseId: 'EU-AIA-ART-12',
        article: 'Article 12',
        title: 'Record-Keeping & Logging Capabilities',
        requirementSummary: 'High-risk AI systems must technically allow automatic recording of events (logs) over their lifecycle ensuring traceability and tamper-evident auditability.',
        mappedControlIds: ['CG-AG-07', 'CG-AG-09'],
        mappedPolicyIds: ['POL-CG-AG-07-01'],
        posture: 'ALIGNED',
        compliancePercentage: 95,
        evidenceDigest: 'DIGEST-EU-ART12-SHA256',
        regulatoryGuidance: 'Cryptographic log retention minimum 6 months / 1825 days for regulated financial entities.'
      },
      {
        clauseId: 'EU-AIA-ART-49',
        article: 'Article 49',
        title: 'EU Database Registration & Inventory',
        requirementSummary: 'High-risk AI systems must be registered in the official EU database with identified system owners, model origins, and technical documentation.',
        mappedControlIds: ['CG-AG-01', 'CG-AG-12'],
        mappedPolicyIds: ['POL-CG-AG-01-01'],
        posture: 'ALIGNED',
        compliancePercentage: 100,
        evidenceDigest: 'DIGEST-EU-ART49-SHA256',
        regulatoryGuidance: 'Verifiable Agent Passports satisfy registration and metadata provenance standards.'
      }
    ]
  },
  {
    id: 'LGPD_BR',
    name: 'Lei Geral de Proteção de Dados (Brasil)',
    acronym: 'LGPD',
    jurisdiction: 'Brasil',
    authority: 'Autoridade Nacional de Proteção de Dados (ANPD)',
    version: 'Lei Federal 13.709/2018',
    effectiveDate: '2020-09-18',
    status: 'MANDATORY_REGULATION',
    overallAlignmentScore: 84,
    applicableIndustries: ['*'],
    description: 'Regulação brasileira sobre tratamento de dados pessoais, decisões automatizadas (Art. 20), Relatório de Impacto à Proteção de Dados - RIPD (Art. 38) e salvaguardas de segurança (Art. 46).',
    dossierStatus: 'READY_FOR_EXPORT',
    clauses: [
      {
        clauseId: 'LGPD-ART-38',
        article: 'Artigo 38',
        title: 'Relatório de Impacto à Proteção de Dados (RIPD)',
        requirementSummary: 'A autoridade nacional poderá determinar a elaboração de RIPD contendo a descrição dos tipos de dados coletados, metodologia de segurança e mitigação de riscos.',
        mappedControlIds: ['CG-AG-06', 'CG-AG-08'],
        mappedPolicyIds: ['POL-CG-AG-06-01'],
        posture: 'ALIGNED',
        compliancePercentage: 92,
        evidenceDigest: 'DIGEST-LGPD-ART38-SHA256',
        regulatoryGuidance: 'RIPD formal exportável com cálculo determinístico de risco e salvaguardas SecurityGuard.'
      },
      {
        clauseId: 'LGPD-ART-46',
        article: 'Artigo 46',
        title: 'Medidas de Segurança, Técnicas e Administrativas',
        requirementSummary: 'Os agentes de tratamento devem adotar medidas de segurança aptas a proteger os dados pessoais de acessos não autorizados e de situações acidentais ou ilícitas.',
        mappedControlIds: ['CG-AG-06', 'CG-AG-02'],
        mappedPolicyIds: ['POL-CG-AG-06-01', 'POL-CG-AG-02-01'],
        posture: 'GAP_DETECTED',
        compliancePercentage: 74,
        gapSummary: 'Chamada direta de LLM sem proxy de sanitização de PII detectada em serviço de marketing.',
        linkedFindingId: 'FIND-002',
        evidenceDigest: 'DIGEST-LGPD-ART46-SHA256',
        regulatoryGuidance: 'Obrigatória anonimização / mascaramento pré-envio a provedores externos de LLM.'
      },
      {
        clauseId: 'LGPD-ART-20',
        article: 'Artigo 20',
        title: 'Revisão de Decisões Automatizadas',
        requirementSummary: 'O titular dos dados tem direito a solicitar a revisão de decisões tomadas unicamente com base em tratamento automatizado de dados pessoais que afetem seus interesses.',
        mappedControlIds: ['CG-AG-03', 'CG-AG-08', 'CG-AG-10'],
        mappedPolicyIds: ['POL-CG-AG-03-01'],
        posture: 'PARTIALLY_ALIGNED',
        compliancePercentage: 80,
        gapSummary: 'Critérios explicativos disponíveis, porém falta automação no canal de contestação do titular.',
        evidenceDigest: 'DIGEST-LGPD-ART20-SHA256',
        regulatoryGuidance: 'Transparência de critérios lógicos e intervenção humana sob demanda.'
      }
    ]
  },
  {
    id: 'NIST_AI_RMF',
    name: 'NIST AI Risk Management Framework',
    acronym: 'NIST AI RMF 1.0',
    jurisdiction: 'United States & Global Benchmark',
    authority: 'National Institute of Standards and Technology (NIST)',
    version: 'NIST AI 100-1',
    effectiveDate: '2023-01-26',
    status: 'VOLUNTARY_STANDARD',
    overallAlignmentScore: 88,
    applicableIndustries: ['*'],
    description: 'Framework voluntário para governança de IA confiável estruturado nas 4 funções centrais: GOVERN, MAP, MEASURE e MANAGE.',
    dossierStatus: 'READY_FOR_EXPORT',
    clauses: [
      {
        clauseId: 'NIST-GOVERN-1.2',
        article: 'GOVERN 1.2',
        title: 'Accountability & Ownership Structures',
        requirementSummary: 'Roles and responsibilities for AI system design, development, deployment, and monitoring are clearly documented and assigned to accountable executives.',
        mappedControlIds: ['CG-AG-01', 'CG-AG-03'],
        mappedPolicyIds: ['POL-CG-AG-01-01', 'POL-CG-AG-03-01'],
        posture: 'ALIGNED',
        compliancePercentage: 96,
        evidenceDigest: 'DIGEST-NIST-GOV-SHA256',
        regulatoryGuidance: 'Accountable Human Lead formalmente registrado em cada Passaporte e Política.'
      },
      {
        clauseId: 'NIST-MAP-1.1',
        article: 'MAP 1.1',
        title: 'Context of Use & System Categorization',
        requirementSummary: 'AI system context of use, intended purpose, autonomy boundaries, and potential positive/negative impacts are documented in an enterprise inventory.',
        mappedControlIds: ['CG-AG-01', 'CG-AG-02'],
        mappedPolicyIds: ['POL-CG-AG-01-01', 'POL-CG-AG-02-01'],
        posture: 'ALIGNED',
        compliancePercentage: 92,
        evidenceDigest: 'DIGEST-NIST-MAP-SHA256',
        regulatoryGuidance: 'Inventário completo de sistemas, modelos, agentes e limites de ferramentas.'
      },
      {
        clauseId: 'NIST-MANAGE-2.2',
        article: 'MANAGE 2.2',
        title: 'Runtime Safeguards & Incident Management',
        requirementSummary: 'Mechanisms are in place to detect, track, mitigate, and respond to AI incidents, unintended behaviors, and security violations during runtime operation.',
        mappedControlIds: ['CG-AG-04', 'CG-AG-05'],
        mappedPolicyIds: ['POL-CG-AG-04-01'],
        posture: 'ALIGNED',
        compliancePercentage: 85,
        evidenceDigest: 'DIGEST-NIST-MAN-SHA256',
        regulatoryGuidance: 'Circuit breakers automatizados e monitoramento de execução de loops.'
      }
    ]
  },
  {
    id: 'ISO_IEC_42001',
    name: 'ISO/IEC 42001:2023 AI Management System',
    acronym: 'ISO/IEC 42001',
    jurisdiction: 'International (ISO/IEC)',
    authority: 'International Organization for Standardization',
    version: 'ISO/IEC 42001:2023',
    effectiveDate: '2023-12-18',
    status: 'VOLUNTARY_STANDARD',
    overallAlignmentScore: 85,
    applicableIndustries: ['*'],
    description: 'Norma internacional que especifica requisitos para estabelecer, implementar, manter e melhorar continuamente um Sistema de Gestão de Inteligência Artificial (SGIA / AIMS).',
    dossierStatus: 'READY_FOR_EXPORT',
    clauses: [
      {
        clauseId: 'ISO-42001-CL-6',
        article: 'Clause 6.1',
        title: 'Actions to Address AI Risks & Opportunities',
        requirementSummary: 'The organization shall plan and determine risks and opportunities related to AI systems and integrate mitigation controls into operational processes.',
        mappedControlIds: ['CG-AG-05', 'CG-AG-03'],
        mappedPolicyIds: ['POL-CG-AG-03-01'],
        posture: 'ALIGNED',
        compliancePercentage: 88,
        evidenceDigest: 'DIGEST-ISO-CL6-SHA256',
        regulatoryGuidance: 'Cadeia de governança determinística: Risco -> Decisão -> Ação -> Evidência.'
      },
      {
        clauseId: 'ISO-42001-CL-8',
        article: 'Clause 8.4',
        title: 'Operational Planning & Control of AI Systems',
        requirementSummary: 'Operational controls must ensure that AI tools, third-party components, and autonomous agent loops operate within certified parameters.',
        mappedControlIds: ['CG-AG-02', 'CG-AG-04', 'CG-AG-12'],
        mappedPolicyIds: ['POL-CG-AG-02-01', 'POL-CG-AG-04-01'],
        posture: 'ALIGNED',
        compliancePercentage: 84,
        evidenceDigest: 'DIGEST-ISO-CL8-SHA256',
        regulatoryGuidance: 'Tool whitelisting e quotas de execução de agentes.'
      }
    ]
  },
  {
    id: 'DORA_EU',
    name: 'Digital Operational Resilience Act (DORA)',
    acronym: 'DORA (FinServ)',
    jurisdiction: 'European Union (Financial Sector)',
    authority: 'European Banking Authority (EBA) & ESMA',
    version: 'Regulation (EU) 2022/2554',
    effectiveDate: '2025-01-17',
    status: 'SECTORAL_DIRECTIVE',
    overallAlignmentScore: 80,
    applicableIndustries: ['financial-services'],
    description: 'Regulamentação setorial para resiliência operacional digital e gestão de riscos em TICs e modelos algorítmicos em instituições financeiras europeias.',
    dossierStatus: 'ATTENTION_REQUIRED',
    clauses: [
      {
        clauseId: 'DORA-ART-08',
        article: 'Article 8',
        title: 'ICT Systems Identification & Critical Asset Inventory',
        requirementSummary: 'Financial entities shall identify, classify, and adequately document all ICT-supported business functions, including AI and automated decision systems.',
        mappedControlIds: ['CG-AG-01', 'CG-AG-11'],
        mappedPolicyIds: ['POL-CG-AG-01-01'],
        posture: 'ALIGNED',
        compliancePercentage: 94,
        evidenceDigest: 'DIGEST-DORA-ART08-SHA256',
        regulatoryGuidance: 'Inventário completo e segregação de ambientes produtivos.'
      },
      {
        clauseId: 'DORA-ART-10',
        article: 'Article 10',
        title: 'Anomalous Activity Detection & Continuous Monitoring',
        requirementSummary: 'Deploy mechanisms to promptly detect anomalous activity, runaway automated transactions, and operational execution bottlenecks in algorithmic systems.',
        mappedControlIds: ['CG-AG-04', 'CG-AG-07', 'CG-AG-09'],
        mappedPolicyIds: ['POL-CG-AG-04-01', 'POL-CG-AG-07-01'],
        posture: 'ALIGNED',
        compliancePercentage: 82,
        evidenceDigest: 'DIGEST-DORA-ART10-SHA256',
        regulatoryGuidance: 'Circuit breakers e log de auditoria protegido com hash SHA-256.'
      }
    ]
  }
];

export class ComplianceStore {
  static getFrameworks(): ComplianceFramework[] {
    return BASELINE_FRAMEWORKS;
  }

  static getFrameworkById(id: string): ComplianceFramework | undefined {
    return BASELINE_FRAMEWORKS.find(f => f.id === id || f.acronym.toLowerCase() === id.toLowerCase());
  }

  static getCrosswalkForControl(controlId: string): Array<{ frameworkName: string; clause: RegulatoryClauseMapping }> {
    const results: Array<{ frameworkName: string; clause: RegulatoryClauseMapping }> = [];
    BASELINE_FRAMEWORKS.forEach(fw => {
      fw.clauses.forEach(clause => {
        if (clause.mappedControlIds.includes(controlId)) {
          results.push({ frameworkName: fw.name, clause });
        }
      });
    });
    return results;
  }
}
