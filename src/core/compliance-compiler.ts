/**
 * CodeGuard v3.1 — Compliance Compiler
 * 
 * Compiles contextual regulatory requirements, CG-AG operational controls,
 * and organizational policies into deterministic, checksummed Compliance Profiles.
 * 
 * Pipeline:
 * Regulation -> Requirement -> CG-AG Control -> Executable Policy -> Compliance Profile
 */

import {
  RegulationId,
  CgAgControlId,
  SourceReference,
  ComplianceRequirement,
  CompliancePolicy,
  ComplianceProfile,
  ComplianceProfileContext,
  calculateProfileChecksum,
  verifyProfileChecksum
} from './compliance-contract';
import { CG_AG_CONTROLS, CG_AG_TRACEABILITY } from './cg-ag-controls';

export const COMPILER_VERSION = 'CG-COMPILER-1.0.0';

// --------------------------------------------------------------------------
// 1. Regulatory Knowledge Base (Auditable, contextual reference requirements)
// --------------------------------------------------------------------------

export class RegulatoryKnowledge {
  private static readonly REQUIREMENTS: ComplianceRequirement[] = [
    // EU AI Act Requirements
    {
      id: 'REQ-EU-AIA-ART-14',
      regulation: 'EU_AI_ACT',
      articleOrSection: 'Article 14',
      title: 'Human Oversight & Stop Mechanisms for High-Risk Systems',
      mappedControl: 'CG-AG-03',
      description: 'High-risk AI systems must allow designated human overseers to monitor operation, prevent risks, and override or abort execution at any time.',
      enforcementMode: 'REQUIRE_HITL',
      sourceReference: {
        regulation: 'EU_AI_ACT',
        section: 'Article 14',
        sourceUri: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1689',
        effectiveFrom: '2026-08-02',
        title: 'Regulation (EU) 2024/1689 - Artificial Intelligence Act'
      },
      rationale: 'Applied when the agent operates in an EU jurisdiction or serves EU citizens in a high-risk category, demanding verifiable human oversight.'
    },
    {
      id: 'REQ-EU-AIA-ART-09',
      regulation: 'EU_AI_ACT',
      articleOrSection: 'Article 9',
      title: 'Continuous Risk Management System',
      mappedControl: 'CG-AG-04',
      description: 'High-risk AI systems must implement systematic runtime containment, timeout parameters, and failsafe bounds to mitigate operational hazards.',
      enforcementMode: 'CIRCUIT_BREAK',
      sourceReference: {
        regulation: 'EU_AI_ACT',
        section: 'Article 9',
        sourceUri: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1689',
        effectiveFrom: '2026-08-02',
        title: 'Regulation (EU) 2024/1689 - Risk Management System'
      },
      rationale: 'Mandates technical runtime safeguards (anti-loop, timeouts, token limits) to contain agent execution within defined safety bounds.'
    },
    {
      id: 'REQ-EU-AIA-ART-12',
      regulation: 'EU_AI_ACT',
      articleOrSection: 'Article 12',
      title: 'Record-Keeping & Automated Logging',
      mappedControl: 'CG-AG-07',
      description: 'High-risk AI systems must technically enable automatic recording of lifecycle events ensuring traceability and tamper-evident auditability.',
      enforcementMode: 'MANDATORY_EVIDENCE',
      sourceReference: {
        regulation: 'EU_AI_ACT',
        section: 'Article 12',
        sourceUri: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1689',
        effectiveFrom: '2026-08-02',
        title: 'Regulation (EU) 2024/1689 - Record-Keeping'
      },
      rationale: 'Ensures that every decision, tool call, and policy verdict is persistently recorded in an audit-grade evidence ledger.'
    },
    {
      id: 'REQ-EU-AIA-ART-16',
      regulation: 'EU_AI_ACT',
      articleOrSection: 'Article 16',
      title: 'Provider Obligations: Inventory & System Registration',
      mappedControl: 'CG-AG-01',
      description: 'Providers must maintain documented inventory of high-risk AI systems with verified system identity, model boundaries, and operational purpose.',
      enforcementMode: 'HARD_BLOCK',
      sourceReference: {
        regulation: 'EU_AI_ACT',
        section: 'Article 16',
        sourceUri: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1689',
        effectiveFrom: '2026-08-02',
        title: 'Regulation (EU) 2024/1689 - Obligations of Providers'
      },
      rationale: 'Unregistered or anonymous agents lacking verifiable asset passports must be blocked from production execution.'
    },

    // DORA Requirements (Financial Operational Resilience)
    {
      id: 'REQ-DORA-ART-08',
      regulation: 'DORA',
      articleOrSection: 'Article 8',
      title: 'ICT Systems Identification & Critical Function Inventory',
      mappedControl: 'CG-AG-01',
      description: 'Financial entities shall identify, classify, and adequately document all ICT-supported business functions and automated decision components.',
      enforcementMode: 'HARD_BLOCK',
      sourceReference: {
        regulation: 'DORA',
        section: 'Article 8',
        sourceUri: 'https://eur-lex.europa.eu/eli/reg/2022/2554/oj',
        effectiveFrom: '2025-01-17',
        title: 'Regulation (EU) 2022/2554 - Digital Operational Resilience Act'
      },
      rationale: 'Applied to financial institutions to ensure all algorithmic agents are bound to recognized organizational owners and inventories.'
    },
    {
      id: 'REQ-DORA-ART-09',
      regulation: 'DORA',
      articleOrSection: 'Article 9',
      title: 'ICT Protection & Tool Authorization Scope',
      mappedControl: 'CG-AG-02',
      description: 'Deploy access policies and authorization restrictions ensuring tools and execution interfaces operate with strictly bounded least-privilege.',
      enforcementMode: 'HARD_BLOCK',
      sourceReference: {
        regulation: 'DORA',
        section: 'Article 9',
        sourceUri: 'https://eur-lex.europa.eu/eli/reg/2022/2554/oj',
        effectiveFrom: '2025-01-17',
        title: 'Regulation (EU) 2022/2554 - Protection and Prevention'
      },
      rationale: 'Bars agents from accessing raw, unscoped databases, arbitrary shell commands, or unauthorized financial APIs.'
    },
    {
      id: 'REQ-DORA-ART-10',
      regulation: 'DORA',
      articleOrSection: 'Article 10',
      title: 'Anomalous Activity Detection & Continuous Monitoring',
      mappedControl: 'CG-AG-04',
      description: 'Deploy mechanisms to promptly detect anomalous activity, runaway transactions, and operational execution bottlenecks in automated services.',
      enforcementMode: 'CIRCUIT_BREAK',
      sourceReference: {
        regulation: 'DORA',
        section: 'Article 10',
        sourceUri: 'https://eur-lex.europa.eu/eli/reg/2022/2554/oj',
        effectiveFrom: '2025-01-17',
        title: 'Regulation (EU) 2022/2554 - Detection Mechanisms'
      },
      rationale: 'Requires automated trip-wires (circuit breakers) when token consumption or transaction velocity exceeds pre-approved bounds.'
    },

    // GDPR Requirements
    {
      id: 'REQ-GDPR-ART-25',
      regulation: 'GDPR',
      articleOrSection: 'Article 25',
      title: 'Data Protection by Design & PII Sanitization',
      mappedControl: 'CG-AG-06',
      description: 'Implement appropriate technical and organizational measures (such as pseudonymisation and data minimization) before data ingestion or external dispatch.',
      enforcementMode: 'HARD_BLOCK',
      sourceReference: {
        regulation: 'GDPR',
        section: 'Article 25',
        sourceUri: 'https://eur-lex.europa.eu/eli/reg/2016/679/oj',
        effectiveFrom: '2018-05-25',
        title: 'Regulation (EU) 2016/679 - Data Protection by Design'
      },
      rationale: 'Prevents transmission of unmasked personal data into third-party foundation models or external egress tools.'
    },
    {
      id: 'REQ-GDPR-ART-22',
      regulation: 'GDPR',
      articleOrSection: 'Article 22',
      title: 'Human Review of Automated Decision-Making',
      mappedControl: 'CG-AG-03',
      description: 'Data subjects have the right not to be subject to a decision based solely on automated processing which produces legal or similarly significant effects without human intervention.',
      enforcementMode: 'REQUIRE_HITL',
      sourceReference: {
        regulation: 'GDPR',
        section: 'Article 22',
        sourceUri: 'https://eur-lex.europa.eu/eli/reg/2016/679/oj',
        effectiveFrom: '2018-05-25',
        title: 'Regulation (EU) 2016/679 - Automated Decision-Making'
      },
      rationale: 'Requires human-in-the-loop checkpoints before any binding legal or impactful consumer decision is completed.'
    },

    // LGPD Requirements
    {
      id: 'REQ-LGPD-ART-46',
      regulation: 'LGPD',
      articleOrSection: 'Artigo 46',
      title: 'Medidas de Segurança, Técnicas e Administrativas',
      mappedControl: 'CG-AG-06',
      description: 'Os agentes de tratamento devem adotar medidas de segurança aptas a proteger os dados pessoais de acessos não autorizados e exposições acidentais.',
      enforcementMode: 'HARD_BLOCK',
      sourceReference: {
        regulation: 'LGPD',
        section: 'Artigo 46',
        sourceUri: 'https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm',
        effectiveFrom: '2020-09-18',
        title: 'Lei Federal 13.709/2018 - Segurança e Sigilo de Dados'
      },
      rationale: 'Exige sanitização automática de CPFs, dados bancários e dados sensíveis pré-envio a ferramentas externas.'
    },
    {
      id: 'REQ-LGPD-ART-20',
      regulation: 'LGPD',
      articleOrSection: 'Artigo 20',
      title: 'Revisão de Decisões Automatizadas',
      mappedControl: 'CG-AG-03',
      description: 'O titular tem direito a solicitar a revisão de decisões tomadas unicamente com base em tratamento automatizado que afetem seus interesses.',
      enforcementMode: 'REQUIRE_HITL',
      sourceReference: {
        regulation: 'LGPD',
        section: 'Artigo 20',
        sourceUri: 'https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm',
        effectiveFrom: '2020-09-18',
        title: 'Lei Federal 13.709/2018 - Revisão de Decisões Automatizadas'
      },
      rationale: 'Assegura checkpoints de supervisão humana para decisões de crédito, elegibilidade ou triagem automatizada.'
    },

    // ISO 42001 & NIST AI RMF Reference Standards
    {
      id: 'REQ-ISO-42001-A6',
      regulation: 'ISO_42001',
      articleOrSection: 'Clause A.6.2',
      title: 'AI System Inventory & Documented Intended Use',
      mappedControl: 'CG-AG-01',
      description: 'Document and classify all AI components, capabilities, and autonomy levels across the enterprise.',
      enforcementMode: 'HARD_BLOCK',
      sourceReference: {
        regulation: 'ISO_42001',
        section: 'A.6.2',
        title: 'ISO/IEC 42001:2023 - AI Management System'
      },
      rationale: 'Establishes registered inventory traceability for enterprise AI components.'
    },
    {
      id: 'REQ-NIST-AI-GOV',
      regulation: 'NIST_AI_RMF',
      articleOrSection: 'GOVERN 1.2',
      title: 'Accountability Structures & Bounded Tool Roles',
      mappedControl: 'CG-AG-02',
      description: 'Roles, authority boundaries, and tool scopes are documented and enforced systematically.',
      enforcementMode: 'HARD_BLOCK',
      sourceReference: {
        regulation: 'NIST_AI_RMF',
        section: 'GOVERN 1.2',
        title: 'NIST AI 100-1 - AI Risk Management Framework'
      },
      rationale: 'Enforces explicit scoping of tool functions, whitelisting, and authorization boundaries.'
    }
  ];

  static getAllRequirements(): ComplianceRequirement[] {
    return [...this.REQUIREMENTS];
  }

  static getRequirementsForRegulations(regulations: RegulationId[]): ComplianceRequirement[] {
    const set = new Set(regulations);
    return this.REQUIREMENTS.filter(r => set.has(r.regulation));
  }

  static getRequirementById(id: string): ComplianceRequirement | undefined {
    return this.REQUIREMENTS.find(r => r.id === id);
  }
}

// --------------------------------------------------------------------------
// 2. Applicability Engine (Contextual analysis of regulatory scope)
// --------------------------------------------------------------------------

export interface ApplicabilityInput {
  jurisdictions?: string[];
  industry?: string;
  dataClassification?: string;
  riskTier?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  autonomyLevel?: 'ASSISTED' | 'SUPERVISED' | 'AUTONOMOUS';
}

export interface ApplicabilityResult {
  applicableRegulations: RegulationId[];
  mandatoryControls: CgAgControlId[];
  requirements: ComplianceRequirement[];
  rationale: string[];
}

export class ApplicabilityEngine {
  static evaluate(input: ApplicabilityInput): ApplicabilityResult {
    const regulations = new Set<RegulationId>();
    const rationale: string[] = [];

    const jurisdictions = (input.jurisdictions || []).map(j => j.toUpperCase());
    const isEU = jurisdictions.includes('EU') || jurisdictions.includes('EEA') || jurisdictions.includes('PORTUGAL') || jurisdictions.includes('EUROPE');
    const isBR = jurisdictions.includes('BR') || jurisdictions.includes('BRAZIL') || jurisdictions.includes('BRASIL');
    const isUS = jurisdictions.includes('US') || jurisdictions.includes('USA');

    const industry = (input.industry || '').toLowerCase();
    const isFinancial = industry.includes('finan') || industry.includes('bank') || industry.includes('credit');
    const isHighRisk = input.riskTier === 'CRITICAL' || input.riskTier === 'HIGH';

    // Regulatory Applicability Rules (Contextual, defensible heuristics)
    if (isEU) {
      regulations.add('GDPR');
      rationale.push('GDPR applies due to European Union jurisdiction scope.');
      if (isHighRisk || isFinancial) {
        regulations.add('EU_AI_ACT');
        rationale.push('EU AI Act High-Risk controls apply based on risk tier and sector operations.');
      }
      if (isFinancial) {
        regulations.add('DORA');
        rationale.push('DORA applies due to Financial Sector ICT resilience requirements in the EU.');
      }
    }

    if (isBR) {
      regulations.add('LGPD');
      rationale.push('LGPD applies due to Brazilian jurisdiction data processing scope.');
      if (isFinancial) {
        regulations.add('BCB_4893');
        rationale.push('BCB Res. 4893 applies due to Brazilian central banking cybersecurity rules.');
      }
    }

    // Default reference standards for all managed deployments
    regulations.add('ISO_42001');
    regulations.add('NIST_AI_RMF');
    rationale.push('ISO 42001 and NIST AI RMF incorporated as enterprise baseline reference standards.');

    const applicableRegsList = Array.from(regulations);
    const requirements = RegulatoryKnowledge.getRequirementsForRegulations(applicableRegsList);

    // Resolve Mandatory CG-AG Controls from requirements
    const controlSet = new Set<CgAgControlId>();
    // Baseline mandatory controls for all governed agents
    controlSet.add('CG-AG-01'); // Registration is universally required
    controlSet.add('CG-AG-02'); // Tool scoping is universally required
    controlSet.add('CG-AG-07'); // Audit trail is universally required

    requirements.forEach(req => {
      controlSet.add(req.mappedControl);
    });

    if (isHighRisk) {
      controlSet.add('CG-AG-03'); // HITL mandatory for high risk
      controlSet.add('CG-AG-04'); // Circuit breaker mandatory for high risk
    }

    if (input.dataClassification === 'RESTRICTED' || input.dataClassification === 'CONFIDENTIAL') {
      controlSet.add('CG-AG-06'); // PII / Data protection mandatory for confidential/restricted
    }

    return {
      applicableRegulations: applicableRegsList.sort(),
      mandatoryControls: Array.from(controlSet).sort() as CgAgControlId[],
      requirements,
      rationale
    };
  }
}

// --------------------------------------------------------------------------
// 3. Control Mapper (Translates controls into executable operational policies)
// --------------------------------------------------------------------------

export class ControlMapper {
  static getControlMetadata(controlId: CgAgControlId) {
    return CG_AG_CONTROLS[controlId];
  }

  static getRegulatoryTraceability(controlId: CgAgControlId) {
    return CG_AG_TRACEABILITY[controlId];
  }
}

// --------------------------------------------------------------------------
// 4. Policy Compiler (Compiles requirements + controls into immutable Profile)
// --------------------------------------------------------------------------

export interface CompileProfileBlueprint {
  profileId: string;
  version: string;
  name: string;
  description: string;
  context: ComplianceProfileContext;
  applicableRegulations: RegulationId[];
  mandatoryControls: CgAgControlId[];
  customRequirements?: ComplianceRequirement[];
  customExecutablePolicies?: CompliancePolicy[];
  forbiddenActions?: string[];
  requireHumanApproval?: string[];
  evidenceRequirements?: string[];
}

export class PolicyCompiler {
  /**
   * Compiles an immutable, checksummed ComplianceProfile.
   * Ensures deterministic ordering, version binding, and cryptographic checksum.
   */
  static compile(blueprint: CompileProfileBlueprint): ComplianceProfile {
    // 1. Resolve requirements (standard + custom)
    const standardReqs = RegulatoryKnowledge.getRequirementsForRegulations(blueprint.applicableRegulations);
    const customReqs = blueprint.customRequirements || [];
    const allRequirements = [...standardReqs, ...customReqs];

    // Deduplicate requirements by ID
    const requirementMap = new Map<string, ComplianceRequirement>();
    allRequirements.forEach(req => requirementMap.set(req.id, req));
    const sortedRequirements = Array.from(requirementMap.values()).sort((a, b) => a.id.localeCompare(b.id));

    // 2. Synthesize source references
    const sourceRefMap = new Map<string, SourceReference>();
    sortedRequirements.forEach(req => {
      const key = `${req.sourceReference.regulation}:${req.sourceReference.section}`;
      if (!sourceRefMap.has(key)) {
        sourceRefMap.set(key, req.sourceReference);
      }
    });
    const sortedSourceReferences = Array.from(sourceRefMap.values()).sort((a, b) => 
      `${a.regulation}:${a.section}`.localeCompare(`${b.regulation}:${b.section}`)
    );

    // 3. Compile Executable Policies
    const policies: CompliancePolicy[] = [];

    // Compile from explicit custom policies
    if (blueprint.customExecutablePolicies) {
      policies.push(...blueprint.customExecutablePolicies);
    }

    // Synthesize standard executable policies from mandatory controls if not already provided
    const controlSet = new Set(blueprint.mandatoryControls);

    if (controlSet.has('CG-AG-02') && !policies.some(p => p.controlId === 'CG-AG-02')) {
      policies.push({
        policyId: 'POL-AUTO-CG-AG-02',
        policyVersion: '1.0.0',
        controlId: 'CG-AG-02',
        title: 'Least-Privilege Tool Execution Boundary',
        description: 'Enforces explicit scoping of declared tools; blocks undeclared or arbitrary system command execution.',
        condition: {
          actionTypes: ['EXECUTE', 'ADMIN']
        },
        verdict: 'ALLOW',
        reasonTemplate: 'Execution permitted only for tools explicitly declared in the Agent Passport.'
      });
    }

    if (controlSet.has('CG-AG-03') && !policies.some(p => p.controlId === 'CG-AG-03')) {
      policies.push({
        policyId: 'POL-AUTO-CG-AG-03',
        policyVersion: '1.0.0',
        controlId: 'CG-AG-03',
        title: 'High-Impact Action Human-in-the-Loop Sign-Off',
        description: 'Mandates human approval for sensitive financial or data alteration actions.',
        condition: {
          actionTypes: ['DELETE', 'ADMIN']
        },
        verdict: 'REQUIRE_HITL',
        reasonTemplate: 'Action requires human approval in accordance with Article 14 Human Oversight standards.'
      });
    }

    if (controlSet.has('CG-AG-06') && !policies.some(p => p.controlId === 'CG-AG-06')) {
      policies.push({
        policyId: 'POL-AUTO-CG-AG-06',
        policyVersion: '1.0.0',
        controlId: 'CG-AG-06',
        title: 'Sensitive Data Egress & PII Boundary Policy',
        description: 'Prohibits unmasked egress of restricted or confidential personal data.',
        condition: {
          dataClassifications: ['RESTRICTED', 'CONFIDENTIAL']
        },
        verdict: 'BLOCK',
        reasonTemplate: 'Direct egress of unmasked confidential data is prohibited by privacy safeguards.'
      });
    }

    const sortedPolicies = policies.sort((a, b) => a.policyId.localeCompare(b.policyId));

    // 4. Assemble sets for Forbidden Actions and HITL Approvals
    const forbiddenActions = Array.from(new Set(blueprint.forbiddenActions || [])).sort();
    const requireHumanApproval = Array.from(new Set(blueprint.requireHumanApproval || [])).sort();

    // 5. Standard evidence requirements
    const evidenceRequirements = Array.from(new Set([
      'agent_fingerprint',
      'passport_id',
      'compliance_profile_checksum',
      'policy_version',
      'decision_latency_ms',
      'verdict',
      'action_payload_digest',
      'execution_timestamp',
      ...(blueprint.evidenceRequirements || [])
    ])).sort();

    // 6. Assemble profile shell
    const profileDraft: Omit<ComplianceProfile, 'checksum'> = {
      profileId: blueprint.profileId,
      version: blueprint.version,
      name: blueprint.name,
      description: blueprint.description,
      compilerVersion: COMPILER_VERSION,
      applicableRegulations: [...blueprint.applicableRegulations].sort(),
      mandatoryControls: [...blueprint.mandatoryControls].sort(),
      requirements: sortedRequirements,
      executablePolicies: sortedPolicies,
      forbiddenActions,
      requireHumanApproval,
      evidenceRequirements,
      applicabilityContext: {
        jurisdiction: [...blueprint.context.jurisdiction].sort(),
        industries: [...blueprint.context.industries].sort(),
        dataClassifications: [...blueprint.context.dataClassifications].sort(),
        autonomyLevels: blueprint.context.autonomyLevels ? [...blueprint.context.autonomyLevels].sort() : []
      },
      sourceReferences: sortedSourceReferences,
      createdAt: '2026-09-22T00:00:00.000Z' // Fixed reference date; omitted from checksum anyway
    };

    // 7. Calculate deterministic SHA-256 checksum
    const checksum = calculateProfileChecksum(profileDraft);

    return {
      ...profileDraft,
      checksum
    };
  }
}

// --------------------------------------------------------------------------
// 5. Compliance Profile Registry (In-memory storage & pre-compiled baselines)
// --------------------------------------------------------------------------

export class ComplianceProfileRegistry {
  private static profiles: Map<string, ComplianceProfile> = new Map();

  static {
    this.initializeBaselineProfiles();
  }

  private static initializeBaselineProfiles(): void {
    // 1. EU_AI_ACT_HIGH_RISK_FINANCIAL
    const financialProfile = PolicyCompiler.compile({
      profileId: 'CP-EU-AI-ACT-HIGH-RISK-FINANCIAL',
      version: '1.0.0',
      name: 'EU AI Act & DORA High-Risk Financial Agent Profile',
      description: 'Pre-configured compliance profile for high-risk autonomous agents operating in EU banking, credit assessment, or financial transactions.',
      context: {
        jurisdiction: ['EU', 'EEA'],
        industries: ['financial-services'],
        dataClassifications: ['CONFIDENTIAL', 'RESTRICTED'],
        autonomyLevels: ['SUPERVISED', 'AUTONOMOUS']
      },
      applicableRegulations: ['EU_AI_ACT', 'DORA', 'GDPR'],
      mandatoryControls: ['CG-AG-01', 'CG-AG-02', 'CG-AG-03', 'CG-AG-04', 'CG-AG-05', 'CG-AG-06', 'CG-AG-07', 'CG-AG-11'],
      forbiddenActions: [
        'DIRECT_DB_DDL',
        'DISABLE_AUDIT_LOG',
        'EXECUTE_UNAUTHORIZED_WIRE_TRANSFER',
        'EXPORT_RAW_FINANCIAL_RECORDS'
      ],
      requireHumanApproval: [
        'approve_credit_limit',
        'create_wire_transfer',
        'override_risk_score',
        'transfer_funds'
      ],
      customExecutablePolicies: [
        {
          policyId: 'POL-FIN-WIRE-TRANSFER-HITL',
          policyVersion: '1.2.0',
          controlId: 'CG-AG-03',
          title: 'Mandatory Human Sign-Off on Wire Transfers',
          description: 'Requires human approver validation before wire transfer dispatches in compliance with EU AI Act Art. 14 and DORA Art. 9.',
          condition: {
            toolNames: ['create_wire_transfer', 'transfer_funds'],
            actionTypes: ['EXECUTE', 'WRITE']
          },
          verdict: 'REQUIRE_HITL',
          reasonTemplate: 'Action requires authorized Human-in-the-Loop approval under high-risk financial oversight rules.'
        },
        {
          policyId: 'POL-FIN-FORBIDDEN-DDL',
          policyVersion: '1.0.0',
          controlId: 'CG-AG-02',
          title: 'Immediate Rejection of Direct Database DDL',
          description: 'Strict prohibition of schema alterations or direct table drops by autonomous agents.',
          condition: {
            toolNames: ['execute_sql_ddl', 'drop_table'],
            actionTypes: ['DELETE', 'ADMIN']
          },
          verdict: 'BLOCK',
          reasonTemplate: 'DDL and destructive database commands are strictly forbidden by financial protection policies.'
        }
      ]
    });
    this.register(financialProfile);

    // 2. GDPR_STRICT_DATA_PROCESSING
    const gdprProfile = PolicyCompiler.compile({
      profileId: 'CP-GDPR-STRICT-DATA-PROCESSING',
      version: '1.0.0',
      name: 'GDPR & LGPD Strict Personal Data Processing Profile',
      description: 'Strict privacy profile for agents ingesting, summarizing, or analyzing personally identifiable information (PII).',
      context: {
        jurisdiction: ['EU', 'BR'],
        industries: ['technology-saas', 'healthcare', 'general'],
        dataClassifications: ['CONFIDENTIAL', 'RESTRICTED'],
        autonomyLevels: ['ASSISTED', 'SUPERVISED']
      },
      applicableRegulations: ['GDPR', 'LGPD'],
      mandatoryControls: ['CG-AG-01', 'CG-AG-02', 'CG-AG-06', 'CG-AG-07'],
      forbiddenActions: [
        'BULK_EXPORT_UNMASKED_PII',
        'DISABLE_DATA_ENCRYPTION',
        'STORE_PLAINTEXT_PASSWORDS'
      ],
      requireHumanApproval: [
        'export_customer_data',
        're-identify_pseudonymized_record'
      ]
    });
    this.register(gdprProfile);

    // 3. STANDARD_ENTERPRISE_INTERNAL
    const enterpriseProfile = PolicyCompiler.compile({
      profileId: 'CP-STANDARD-ENTERPRISE-INTERNAL',
      version: '1.0.0',
      name: 'Standard Enterprise Internal AI Agent Profile',
      description: 'Baseline governance profile for internal automation bots, developer helpers, and productivity agents.',
      context: {
        jurisdiction: ['GLOBAL'],
        industries: ['general'],
        dataClassifications: ['INTERNAL', 'PUBLIC'],
        autonomyLevels: ['ASSISTED', 'SUPERVISED']
      },
      applicableRegulations: ['ISO_42001', 'NIST_AI_RMF'],
      mandatoryControls: ['CG-AG-01', 'CG-AG-02', 'CG-AG-04', 'CG-AG-07'],
      forbiddenActions: [
        'RAW_BASH_EXECUTION',
        'UNRESTRICTED_FILE_SYSTEM_WRITE'
      ],
      requireHumanApproval: [
        'execute_deployment_pipeline',
        'modify_production_config'
      ]
    });
    this.register(enterpriseProfile);
  }

  static register(profile: ComplianceProfile): void {
    if (!verifyProfileChecksum(profile)) {
      throw new Error(`Cannot register corrupted ComplianceProfile "${profile.profileId}": checksum mismatch.`);
    }
    this.profiles.set(profile.profileId, Object.freeze({ ...profile }));
  }

  static getProfile(profileId: string): ComplianceProfile | undefined {
    return this.profiles.get(profileId);
  }

  static listProfiles(): ComplianceProfile[] {
    return Array.from(this.profiles.values());
  }

  static verifyProfileIntegrity(profile: ComplianceProfile): boolean {
    return verifyProfileChecksum(profile);
  }

  static compileAndRegister(blueprint: CompileProfileBlueprint): ComplianceProfile {
    const profile = PolicyCompiler.compile(blueprint);
    this.register(profile);
    return profile;
  }
}
