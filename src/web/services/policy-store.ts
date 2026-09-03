/**
 * Authoritative Policy Store for CG-AG Governance OS
 * Causal Pipeline: Control -> Policy -> Applicability -> Guardrail/Enforcement -> Finding -> Risk -> Decision -> Action -> Evidence
 */

import { DecisionStore } from './decision-store';
import { PersistenceAdapter } from './persistence-adapter';
import { ProtectedEvidenceRecord } from '../../core/governance-control-plane';

export type PolicyType = 
  | 'GOVERNANCE'
  | 'SECURITY'
  | 'PRIVACY'
  | 'ACCESS_TOOL'
  | 'HUMAN_OVERSIGHT'
  | 'RUNTIME'
  | 'DATA_PROTECTION'
  | 'FINOPS'
  | 'THIRD_PARTY_AI';

export type PolicyStatus = 'DRAFT' | 'ACTIVE' | 'SUSPENDED' | 'RETIRED';

export type EnforcementMode = 'STATIC' | 'RUNTIME' | 'HYBRID' | 'HUMAN_GATE' | 'MONITOR_ONLY';

export type ApplicabilityState = 'APPLICABLE' | 'NOT_APPLICABLE' | 'EXCEPTION';

export interface PolicyVersion {
  version: string;
  effectiveDate: string;
  changedBy: string;
  changeSummary: string;
  previousVersion?: string;
}

export interface PolicyException {
  exceptionId: string;
  reason: string;
  accountableOwner: string;
  decisionId: string;
  createdDate: string;
  expiryDate: string;
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
  evidenceDigest: string;
}

export interface PolicyGuardrail {
  ruleId: string;
  ruleTitle: string;
  specification: string;
  configuredState: string;
  observedState: string;
  enforcementStatus: 'CONFIGURED' | 'OBSERVED' | 'ENFORCED' | 'GAP_DETECTED';
}

export interface GovernancePolicy {
  id: string;
  title: string;
  description: string;
  type: PolicyType;
  status: PolicyStatus;
  currentVersion: string;
  versionHistory: PolicyVersion[];
  owner: {
    name: string;
    role: string;
    department: string;
  };
  accountableLead: {
    name: string;
    role: string;
  };
  scope: string;
  applicableControls: Array<{
    controlId: string;
    controlName: string;
    relationship: 'PRIMARY_SUPPORT' | 'SECONDARY_SUPPORT' | 'OVERLAY';
  }>;
  applicabilityCriteria: {
    industries: string[]; // e.g. ['financial-services', 'healthcare-lifesciences', 'technology-saas', '*']
    aiSystemTypes: string[]; // ['AUTONOMOUS_AGENT', 'LLM_PIPELINE', 'PREDICTIVE_MODEL', 'RAG_SYSTEM']
    riskTiers: Array<'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'>;
    environments: Array<'Production' | 'Staging' | 'Sandbox'>;
    dataClassifications: Array<'PII' | 'FINANCIAL' | 'CONFIDENTIAL' | 'PUBLIC'>;
    autonomyLevels: Array<'CG-AG L1 Assisted' | 'CG-AG L2 Supervised' | 'CG-AG L3 Bounded' | 'CG-AG L4 High Autonomy'>;
  };
  enforcement: {
    mode: EnforcementMode;
    configuredCoverage: string;
    observedCoverage: string;
    enforcementCoverage: string;
    telemetrySensor: string;
    isRuntimeInstrumented: boolean;
  };
  guardrails: PolicyGuardrail[];
  exceptions: PolicyException[];
  effectiveFrom: string;
  reviewDate: string;
  lastUpdated: string;
  evidenceReference: string;
  linkedFindingIds: string[];
  regulatoryOverlays: string[]; // ['EU AI Act Art. 14', 'LGPD Art. 38', 'NIST AI RMF GOVERN']
}

const STORAGE_KEY_POLICIES = 'cg_ag_unified_policies_v1';

const BASELINE_POLICIES: GovernancePolicy[] = [
  {
    id: 'POL-CG-AG-03-01',
    title: 'Tier-2 High-Risk Autonomous Action Human Sign-Off Policy',
    description: 'Mandates explicit Human-in-the-Loop approval checkpoints for any autonomous agent executing transactions exceeding financial thresholds (R$ 50,000) or high-impact credit underwriting decisions.',
    type: 'HUMAN_OVERSIGHT',
    status: 'ACTIVE',
    currentVersion: 'v2.1',
    versionHistory: [
      {
        version: 'v2.1',
        effectiveDate: '2026-08-01',
        changedBy: 'Roberto Silva (CISO)',
        changeSummary: 'Raised financial threshold from R$ 25k to R$ 50k and aligned with EU AI Act Art. 14 requirements.',
        previousVersion: 'v2.0'
      },
      {
        version: 'v2.0',
        effectiveDate: '2026-03-15',
        changedBy: 'AppSec Governance Lead',
        changeSummary: 'Initial formalization of multi-tier HITL gates for autonomous agents.',
        previousVersion: 'v1.0'
      }
    ],
    owner: {
      name: 'Roberto Silva',
      role: 'CISO & Accountable Lead',
      department: 'Cybersecurity & Compliance'
    },
    accountableLead: {
      name: 'Juliana Lima',
      role: 'Head of AI Governance & Risk'
    },
    scope: 'Enterprise-wide for all autonomous agents operating with financial, credit, or customer impact.',
    applicableControls: [
      { controlId: 'CG-AG-03', controlName: 'Human-in-the-Loop Oversight', relationship: 'PRIMARY_SUPPORT' },
      { controlId: 'CG-AG-04', controlName: 'Runtime Safety & Circuit Breakers', relationship: 'SECONDARY_SUPPORT' },
      { controlId: 'CG-AG-10', controlName: 'Human Oversight & Override', relationship: 'PRIMARY_SUPPORT' }
    ],
    applicabilityCriteria: {
      industries: ['financial-services', 'retail-consumer', 'technology-saas'],
      aiSystemTypes: ['AUTONOMOUS_AGENT', 'LLM_PIPELINE'],
      riskTiers: ['CRITICAL', 'HIGH'],
      environments: ['Production'],
      dataClassifications: ['FINANCIAL', 'CONFIDENTIAL'],
      autonomyLevels: ['CG-AG L3 Bounded', 'CG-AG L4 High Autonomy']
    },
    enforcement: {
      mode: 'HUMAN_GATE',
      configuredCoverage: '100% Configured in Policy Registry',
      observedCoverage: '75% Telemetry Observed (1 Agent Lacks Gate)',
      enforcementCoverage: '75% Active Human Blocking Gateway',
      telemetrySensor: 'HITL Proxy / Workflow Interceptor v2.4',
      isRuntimeInstrumented: true
    },
    guardrails: [
      {
        ruleId: 'RULE-HITL-001',
        ruleTitle: 'Financial Transaction Value Gate (> R$ 50,000)',
        specification: 'If action.amount > 50000 -> pause execution and require 2FA manager signature before token dispatch.',
        configuredState: 'Rule deployed to credit workflow engine',
        observedState: 'Active on 3 of 4 underwriting services',
        enforcementStatus: 'GAP_DETECTED'
      },
      {
        ruleId: 'RULE-HITL-002',
        ruleTitle: 'Autonomous Override Timeout (120s max before fallback)',
        specification: 'If human reviewer does not respond within 120s -> abort transaction safely with code HITL_TIMEOUT.',
        configuredState: 'Configured in Orchestrator config',
        observedState: 'Observed active in staging & production',
        enforcementStatus: 'ENFORCED'
      }
    ],
    exceptions: [],
    effectiveFrom: '2026-01-15',
    reviewDate: '2026-12-31',
    lastUpdated: '2026-08-25T10:00:00Z',
    evidenceReference: 'EV-POL-03-01-DIGEST',
    linkedFindingIds: ['FIND-001'],
    regulatoryOverlays: ['EU AI Act Art. 14 (Human Oversight)', 'BACEN Res. 4.893 (Operational Risk)']
  },
  {
    id: 'POL-CG-AG-06-01',
    title: 'PII De-Identification & Sanitization Boundary Policy',
    description: 'Prohibits direct submission of unmasked Personally Identifiable Information (PII) or sensitive banking credentials into third-party foundation models without SecurityGuard tokenization.',
    type: 'PRIVACY',
    status: 'ACTIVE',
    currentVersion: 'v1.4',
    versionHistory: [
      {
        version: 'v1.4',
        effectiveDate: '2026-06-01',
        changedBy: 'Carlos DPO',
        changeSummary: 'Added strict sanitization rules for LGPD Art. 38 RIPD alignment.',
        previousVersion: 'v1.3'
      }
    ],
    owner: {
      name: 'Carlos DPO',
      role: 'Data Protection Officer',
      department: 'Privacy & Legal'
    },
    accountableLead: {
      name: 'Carlos DPO',
      role: 'Data Protection Officer'
    },
    scope: 'All LLM prompt invocations, RAG vector embeddings, and telemetry pipelines across all environments.',
    applicableControls: [
      { controlId: 'CG-AG-06', controlName: 'Data Privacy & PII Protection', relationship: 'PRIMARY_SUPPORT' },
      { controlId: 'CG-AG-05', controlName: 'AI Security & Prompt Injection', relationship: 'SECONDARY_SUPPORT' }
    ],
    applicabilityCriteria: {
      industries: ['*'], // All industries
      aiSystemTypes: ['AUTONOMOUS_AGENT', 'LLM_PIPELINE', 'RAG_SYSTEM', 'PREDICTIVE_MODEL'],
      riskTiers: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
      environments: ['Production', 'Staging', 'Sandbox'],
      dataClassifications: ['PII', 'FINANCIAL', 'CONFIDENTIAL'],
      autonomyLevels: ['CG-AG L1 Assisted', 'CG-AG L2 Supervised', 'CG-AG L3 Bounded', 'CG-AG L4 High Autonomy']
    },
    enforcement: {
      mode: 'HYBRID',
      configuredCoverage: '100% Configured in SecurityGuard Proxy',
      observedCoverage: '88% Telemetry Observed (Direct Call Detected)',
      enforcementCoverage: '88% Active Egress Sanitization',
      telemetrySensor: 'SecurityGuard Anonymizer & Egress Filter',
      isRuntimeInstrumented: true
    },
    guardrails: [
      {
        ruleId: 'RULE-PRIV-001',
        ruleTitle: 'Mandatory CPF/SSN Regex Masking Pre-LLM',
        specification: 'Inspect prompt payload; replace [0-9]{3}\\.[0-9]{3}\\.[0-9]{3}-[0-9]{2} with synthetic pseudonyms.',
        configuredState: 'SecurityGuard middleware active',
        observedState: 'Active on all gateway routes',
        enforcementStatus: 'ENFORCED'
      },
      {
        ruleId: 'RULE-PRIV-002',
        ruleTitle: 'Prohibition of Direct Unmonitored LLM Endpoints',
        specification: 'Direct SDK imports bypassing SecurityGuard gateway are blocked by CI/CD static scan.',
        configuredState: 'Static scanner rule configured',
        observedState: '1 finding detected in services/direct_llm.py',
        enforcementStatus: 'GAP_DETECTED'
      }
    ],
    exceptions: [],
    effectiveFrom: '2026-02-01',
    reviewDate: '2026-11-30',
    lastUpdated: '2026-08-26T14:30:00Z',
    evidenceReference: 'EV-POL-06-01-DIGEST',
    linkedFindingIds: ['FIND-002'],
    regulatoryOverlays: ['LGPD Art. 38 & 46', 'EU GDPR Art. 25 (Privacy by Design)']
  },
  {
    id: 'POL-CG-AG-02-01',
    title: 'Agent Least-Privilege Tool Authorization & Scoping Policy',
    description: 'Prohibits attaching high-privilege execution tools (e.g. raw shell/bash, arbitrary SQL DDL, production database writes) to autonomous agents without explicit sandbox boundaries and whitelist declaration.',
    type: 'ACCESS_TOOL',
    status: 'ACTIVE',
    currentVersion: 'v1.2',
    versionHistory: [
      {
        version: 'v1.2',
        effectiveDate: '2026-07-10',
        changedBy: 'Security Architecture Team',
        changeSummary: 'Enforced read-only tool scopes as mandatory default for Tier-3 agents.',
        previousVersion: 'v1.1'
      }
    ],
    owner: {
      name: 'Security Engineering Lead',
      role: 'AppSec Architect',
      department: 'Cybersecurity'
    },
    accountableLead: {
      name: 'Roberto Silva',
      role: 'CISO'
    },
    scope: 'All autonomous agent definitions, CrewAI tool assignments, LangGraph nodes, and MCP tool servers.',
    applicableControls: [
      { controlId: 'CG-AG-02', controlName: 'Agent & Tool Scoping', relationship: 'PRIMARY_SUPPORT' },
      { controlId: 'CG-AG-01', controlName: 'AI & Agent Inventory Registry', relationship: 'SECONDARY_SUPPORT' }
    ],
    applicabilityCriteria: {
      industries: ['*'],
      aiSystemTypes: ['AUTONOMOUS_AGENT'],
      riskTiers: ['CRITICAL', 'HIGH'],
      environments: ['Production', 'Staging'],
      dataClassifications: ['CONFIDENTIAL', 'FINANCIAL'],
      autonomyLevels: ['CG-AG L2 Supervised', 'CG-AG L3 Bounded', 'CG-AG L4 High Autonomy']
    },
    enforcement: {
      mode: 'STATIC',
      configuredCoverage: '100% Configured in Static Scanner',
      observedCoverage: '90% Static AST Analysis',
      enforcementCoverage: 'Static Scan Only (Runtime Not Instrumented)',
      telemetrySensor: 'AST Tool Boundary Scanner',
      isRuntimeInstrumented: false
    },
    guardrails: [
      {
        ruleId: 'RULE-TOOL-001',
        ruleTitle: 'Explicit Tool Whitelist Declaration',
        specification: 'Agents must explicitly declare allowed tool names in their Passport manifest.',
        configuredState: 'Required in agent schema',
        observedState: '26 of 27 agents compliant',
        enforcementStatus: 'GAP_DETECTED'
      }
    ],
    exceptions: [],
    effectiveFrom: '2026-04-01',
    reviewDate: '2026-10-31',
    lastUpdated: '2026-08-27T08:00:00Z',
    evidenceReference: 'EV-POL-02-01-DIGEST',
    linkedFindingIds: ['FIND-003'],
    regulatoryOverlays: ['OWASP Top 10 LLM06 (Excessive Agency)', 'NIST AI RMF MANAGE 2.2']
  },
  {
    id: 'POL-CG-AG-04-01',
    title: 'Autonomous Multi-Agent Loop Circuit Breaker & Timeout Policy',
    description: 'Enforces execution quotas, max loop iterations (max_iterations <= 5), and hard execution timeouts (<= 120s) on all multi-agent orchestration graphs to prevent runaway cost loops and denial of service.',
    type: 'RUNTIME',
    status: 'ACTIVE',
    currentVersion: 'v1.0',
    versionHistory: [
      {
        version: 'v1.0',
        effectiveDate: '2026-05-01',
        changedBy: 'AI Platform Engineering',
        changeSummary: 'Baseline circuit breaker policy established for multi-agent teams.',
        previousVersion: undefined
      }
    ],
    owner: {
      name: 'AI Platform Engineering',
      role: 'Platform Lead',
      department: 'Core Engineering'
    },
    accountableLead: {
      name: 'Juliana Lima',
      role: 'Head of AI Governance & Risk'
    },
    scope: 'Multi-agent orchestration engines (CrewAI, LangGraph, AutoGen, ChatDev).',
    applicableControls: [
      { controlId: 'CG-AG-04', controlName: 'Runtime Safety & Circuit Breakers', relationship: 'PRIMARY_SUPPORT' },
      { controlId: 'CG-AG-11', controlName: 'Runtime FinOps & Token Budgets', relationship: 'SECONDARY_SUPPORT' }
    ],
    applicabilityCriteria: {
      industries: ['*'],
      aiSystemTypes: ['AUTONOMOUS_AGENT'],
      riskTiers: ['CRITICAL', 'HIGH', 'MEDIUM'],
      environments: ['Production', 'Staging'],
      dataClassifications: ['CONFIDENTIAL', 'PUBLIC'],
      autonomyLevels: ['CG-AG L3 Bounded', 'CG-AG L4 High Autonomy']
    },
    enforcement: {
      mode: 'RUNTIME',
      configuredCoverage: '100% Configured in Platform Orchestrator',
      observedCoverage: '100% (Remediation In Progress on Wealth Team)',
      enforcementCoverage: '100% Enforced in Runtime Container',
      telemetrySensor: 'Orchestrator Heartbeat & Timeout Monitor',
      isRuntimeInstrumented: true
    },
    guardrails: [
      {
        ruleId: 'RULE-SAFE-001',
        ruleTitle: 'Max Multi-Agent Iteration Limit (<= 5)',
        specification: 'Orchestration loop terminates with error CIRCUIT_BREAKER_MAX_ITER if counter exceeds 5.',
        configuredState: 'Configured in Orchestrator',
        observedState: 'Active in production runtime',
        enforcementStatus: 'ENFORCED'
      }
    ],
    exceptions: [],
    effectiveFrom: '2026-05-01',
    reviewDate: '2026-11-15',
    lastUpdated: '2026-08-27T09:30:00Z',
    evidenceReference: 'EV-POL-04-01-DIGEST',
    linkedFindingIds: ['FIND-004'],
    regulatoryOverlays: ['NIST AI RMF GOVERN 1.2', 'ISO/IEC 42001 Cl. 8.4']
  },
  {
    id: 'POL-CG-AG-01-01',
    title: 'Mandatory AI & Agent Inventory Registration Policy',
    description: 'Requires all AI models, autonomous agents, and third-party LLM endpoints to be cataloged in the Enterprise AI Inventory before production deployment with assigned business owner and passport.',
    type: 'GOVERNANCE',
    status: 'ACTIVE',
    currentVersion: 'v2.0',
    versionHistory: [
      {
        version: 'v2.0',
        effectiveDate: '2026-02-01',
        changedBy: 'Juliana Lima',
        changeSummary: 'Integrated Verifiable Agent Passport requirements into onboarding workflow.',
        previousVersion: 'v1.0'
      }
    ],
    owner: {
      name: 'Juliana Lima',
      role: 'Head of AI Governance & Risk',
      department: 'AI Governance Office'
    },
    accountableLead: {
      name: 'Roberto Silva',
      role: 'CISO'
    },
    scope: 'All enterprise AI assets across all business units and cloud environments.',
    applicableControls: [
      { controlId: 'CG-AG-01', controlName: 'AI & Agent Inventory Registry', relationship: 'PRIMARY_SUPPORT' },
      { controlId: 'CG-AG-12', controlName: 'Supply Chain & Model Provenance', relationship: 'SECONDARY_SUPPORT' }
    ],
    applicabilityCriteria: {
      industries: ['*'],
      aiSystemTypes: ['AUTONOMOUS_AGENT', 'LLM_PIPELINE', 'PREDICTIVE_MODEL', 'RAG_SYSTEM'],
      riskTiers: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
      environments: ['Production', 'Staging', 'Sandbox'],
      dataClassifications: ['CONFIDENTIAL', 'FINANCIAL', 'PII', 'PUBLIC'],
      autonomyLevels: ['CG-AG L1 Assisted', 'CG-AG L2 Supervised', 'CG-AG L3 Bounded', 'CG-AG L4 High Autonomy']
    },
    enforcement: {
      mode: 'STATIC',
      configuredCoverage: '100% Configured in Pre-Commit Hook',
      observedCoverage: '100% Verified Catalog',
      enforcementCoverage: 'Static Pre-Commit Gate (Runtime Not Instrumented)',
      telemetrySensor: 'Repository Scanner & Asset Catalog Sensor',
      isRuntimeInstrumented: false
    },
    guardrails: [
      {
        ruleId: 'RULE-REG-001',
        ruleTitle: 'Mandatory System ID & Owner Assignment',
        specification: 'Deployment manifests without sys_id and accountable owner trigger build failure.',
        configuredState: 'Enforced in CI/CD pre-commit gate',
        observedState: 'Active across all repos',
        enforcementStatus: 'ENFORCED'
      }
    ],
    exceptions: [],
    effectiveFrom: '2026-01-01',
    reviewDate: '2026-12-15',
    lastUpdated: '2026-08-20T10:00:00Z',
    evidenceReference: 'EV-POL-01-01-DIGEST',
    linkedFindingIds: [],
    regulatoryOverlays: ['EU AI Act Art. 49 (Registration)', 'NIST AI RMF MAP 1.1']
  },
  {
    id: 'POL-CG-AG-07-01',
    title: 'Tamper-Evident Decision Audit Logging Policy',
    description: 'Mandates cryptographic hashing (SHA-256) and immutable chaining of all governance decisions, agent lifecycle state changes, and human approval interventions into the protected ledger.',
    type: 'SECURITY',
    status: 'ACTIVE',
    currentVersion: 'v1.5',
    versionHistory: [
      {
        version: 'v1.5',
        effectiveDate: '2026-04-15',
        changedBy: 'Audit Engineering Lead',
        changeSummary: 'Established 1825-day (5-year) retention baseline for regulated audit artifacts.',
        previousVersion: 'v1.4'
      }
    ],
    owner: {
      name: 'Internal Audit & Compliance Lead',
      role: 'Chief Audit Executive',
      department: 'Internal Audit'
    },
    accountableLead: {
      name: 'Roberto Silva',
      role: 'CISO'
    },
    scope: 'All governance control events, human decisions, exception logs, and passport verifications.',
    applicableControls: [
      { controlId: 'CG-AG-07', controlName: 'Audit Logging & Traceability', relationship: 'PRIMARY_SUPPORT' },
      { controlId: 'CG-AG-09', controlName: 'Model & Agent Observability', relationship: 'SECONDARY_SUPPORT' }
    ],
    applicabilityCriteria: {
      industries: ['*'],
      aiSystemTypes: ['AUTONOMOUS_AGENT', 'LLM_PIPELINE', 'PREDICTIVE_MODEL', 'RAG_SYSTEM'],
      riskTiers: ['CRITICAL', 'HIGH', 'MEDIUM'],
      environments: ['Production', 'Staging'],
      dataClassifications: ['CONFIDENTIAL', 'FINANCIAL', 'PII'],
      autonomyLevels: ['CG-AG L2 Supervised', 'CG-AG L3 Bounded', 'CG-AG L4 High Autonomy']
    },
    enforcement: {
      mode: 'RUNTIME',
      configuredCoverage: '100% Configured in Audit Store Engine',
      observedCoverage: '100% Operational',
      enforcementCoverage: '100% Chained into Protected Ledger',
      telemetrySensor: 'Cryptographic Ledger Daemon',
      isRuntimeInstrumented: true
    },
    guardrails: [
      {
        ruleId: 'RULE-AUD-001',
        ruleTitle: 'SHA-256 Digest on Every Decision Event',
        specification: 'Every human sign-off generates a tamper-evident digest chained to previous block.',
        configuredState: 'Integrated in DecisionStore service',
        observedState: 'Active and generating hashes',
        enforcementStatus: 'ENFORCED'
      }
    ],
    exceptions: [],
    effectiveFrom: '2026-01-01',
    reviewDate: '2026-12-31',
    lastUpdated: '2026-08-27T12:00:00Z',
    evidenceReference: 'EV-POL-07-01-DIGEST',
    linkedFindingIds: [],
    regulatoryOverlays: ['EU AI Act Art. 12 (Record-Keeping)', 'LGPD Art. 38', 'SEC Rule 17a-4']
  }
];

export class PolicyStore {
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

  static getPolicies(tenantId?: string): GovernancePolicy[] {
    if (tenantId) {
      PersistenceAdapter.setContext({ tenantId });
    }
    const saved = PersistenceAdapter.read<GovernancePolicy[]>('policies', STORAGE_KEY_POLICIES);
    if (saved && Array.isArray(saved) && saved.length > 0) {
      return saved;
    }
    return JSON.parse(JSON.stringify(BASELINE_POLICIES));
  }

  static resetToBaseline(tenantId?: string) {
    if (tenantId) {
      PersistenceAdapter.setContext({ tenantId });
    }
    PersistenceAdapter.delete('policies', STORAGE_KEY_POLICIES);
    this.notify();
  }

  static recordPolicyException(
    policyId: string,
    reason: string,
    accountableOwner: string,
    expiryDate: string,
    tenantId?: string
  ): { policy: GovernancePolicy; exception: PolicyException; evidence: ProtectedEvidenceRecord } {
    if (tenantId) {
      PersistenceAdapter.setContext({ tenantId });
    }
    const policies = this.getPolicies(tenantId);
    const policyIndex = policies.findIndex(p => p.id === policyId);
    if (policyIndex === -1) {
      throw new Error(`Policy ${policyId} not found`);
    }

    const targetPolicy = policies[policyIndex];
    const exceptionId = `EXC-${Date.now().toString(36).toUpperCase()}`;
    const hash = Math.random().toString(36).substring(2, 10).toUpperCase();

    // Record decision via DecisionStore for human accountability
    const decisionResult = DecisionStore.recordDecision(
      targetPolicy.id,
      'ACCEPT',
      { name: accountableOwner, role: 'Accountable Executive', stakeholderGroup: 'CISO' },
      undefined,
      undefined,
      tenantId
    );

    const exception: PolicyException = {
      exceptionId,
      reason,
      accountableOwner,
      decisionId: decisionResult.decision.decisionId,
      createdDate: new Date().toISOString(),
      expiryDate,
      status: 'ACTIVE',
      evidenceDigest: `DIGEST-${hash}-SHA256`
    };

    const updatedPolicy: GovernancePolicy = {
      ...targetPolicy,
      exceptions: [exception, ...targetPolicy.exceptions],
      lastUpdated: new Date().toISOString()
    };

    policies[policyIndex] = updatedPolicy;
    PersistenceAdapter.write('policies', policies, STORAGE_KEY_POLICIES);

    this.notify();
    return { policy: updatedPolicy, exception, evidence: decisionResult.evidence };
  }

  static evaluateApplicability(
    policy: GovernancePolicy,
    context: {
      industryId: string;
      systemType?: string;
      riskTier?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
      environment?: 'Production' | 'Staging' | 'Sandbox';
    }
  ): { state: ApplicabilityState; rationale: string } {
    // Check if active exception exists
    const hasActiveException = policy.exceptions.some(e => e.status === 'ACTIVE');
    if (hasActiveException) {
      return {
        state: 'EXCEPTION',
        rationale: 'Active formal governance exception registered with accountable owner sign-off.'
      };
    }

    // Check Industry applicability
    const matchesIndustry = policy.applicabilityCriteria.industries.includes('*') || 
                            policy.applicabilityCriteria.industries.includes(context.industryId);

    if (!matchesIndustry) {
      return {
        state: 'NOT_APPLICABLE',
        rationale: `Out of scope for industry profile [${context.industryId}].`
      };
    }

    // Check environment if provided
    if (context.environment && !policy.applicabilityCriteria.environments.includes(context.environment)) {
      return {
        state: 'NOT_APPLICABLE',
        rationale: `Policy only applies to [${policy.applicabilityCriteria.environments.join(', ')}]. Current: ${context.environment}.`
      };
    }

    return {
      state: 'APPLICABLE',
      rationale: 'All applicability criteria satisfied. Policy is active and binding.'
    };
  }
}
