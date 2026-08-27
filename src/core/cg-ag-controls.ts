import type { DetectedRisk } from './types';

export const AGENTIC_CORE_PRINCIPLE = 'Every Agent Action Must Be Governable and Evidenced.';

export interface CGAGControl {
  id: string;
  dbFlag: string | null;
  name: string;
  description: string;
  domain: 'inventory' | 'ownership' | 'models' | 'access' | 'prompts' | 'mcp' | 'oversight' | 'audit' | 'data' | 'risk' | 'a2a' | 'autonomous';
}

export interface CGAGTraceability {
  aiAct?: string;
  dora?: string;
  iso42001?: string;
  nist?: string;
  lgpd?: string;
}

export const CG_AG_TRACEABILITY: Record<string, CGAGTraceability> = {
  'CG-AG-001': { aiAct: 'Art. 16 (provider obligations)', iso42001: 'A.6.2 (AI system inventory)', nist: 'GOVERN 1.1', lgpd: 'Art. 37 (Registro das Operacoes)' },
  'CG-AG-002': { aiAct: 'Art. 26 (deployer obligations)', iso42001: 'A.3.2 (roles & responsibilities)', nist: 'GOVERN 2.1', lgpd: 'Art. 41 (Encarregado / DPO)' },
  'CG-AG-003': { aiAct: 'Art. 11 (technical documentation)', iso42001: 'A.7.2 (data & model documentation)', nist: 'MAP 2.3', lgpd: 'Art. 38 (Documentacao Tecnica)' },
  'CG-AG-004': { aiAct: 'Art. 9 (risk management)', dora: 'Art. 9 (ICT protection)', iso42001: 'A.5.3 (access control)', lgpd: 'Art. 46 (Seguranca e Sigilo)' },
  'CG-AG-005': { aiAct: 'Art. 15 (accuracy & robustness)', nist: 'MEASURE 2.7 (prompt injection)', iso42001: 'A.8.2 (robustness)' },
  'CG-AG-006': { dora: 'Art. 28 (third-party ICT)', iso42001: 'A.10.3 (supplier AI)', nist: 'GOVERN 6.1', aiAct: 'Art. 25 (value chain responsibilities)' },
  'CG-AG-007': { aiAct: 'Art. 14 (human oversight)', iso42001: 'A.8.4 (human oversight)', nist: 'GOVERN 3.2', lgpd: 'Art. 20 (Revisao Humana de Decisoes)' },
  'CG-AG-008': { aiAct: 'Art. 12 (record-keeping/logs)', dora: 'Art. 12 (logging)', iso42001: 'A.6.7 (event logs)', lgpd: 'Art. 37 (Rastreabilidade)' },
  'CG-AG-009': { aiAct: 'Art. 10 (data governance)', iso42001: 'A.7.3 (data quality)', nist: 'MAP 2.2', lgpd: 'Art. 6 (Finalidade, Adequacao, Necessidade)' },
  'CG-AG-010': { aiAct: 'Art. 6 + Annex III (classification)', iso42001: 'A.5.2 (risk assessment)', nist: 'MAP 1.5', lgpd: 'Art. 38 (Avaliacao de Alto Risco)' },
  'CG-AG-011': { aiAct: 'Art. 9 (interaction risk)', dora: 'Art. 30 (chain outsourcing)', nist: 'MEASURE 2.9', iso42001: 'A.9.1 (system interfaces)' },
  'CG-AG-012': { aiAct: 'Art. 14 (autonomous oversight)', iso42001: 'A.8.4', nist: 'GOVERN 3.2 / MANAGE 2.4', lgpd: 'Art. 20 (Salvaguardas de Autonomia)' },
};

export const CG_AG_CONTROLS: Record<string, CGAGControl> = {
  'CG-AG-001': {
    id: 'CG-AG-001',
    dbFlag: 'cg_ag_001_registered',
    name: 'Agent Inventory',
    description: 'Every AI agent must be formally registered in the master agent inventory before operating.',
    domain: 'inventory',
  },
  'CG-AG-002': {
    id: 'CG-AG-002',
    dbFlag: 'cg_ag_002_owner',
    name: 'Agent Owner',
    description: 'Every registered agent must have an identified, accountable human owner.',
    domain: 'ownership',
  },
  'CG-AG-003': {
    id: 'CG-AG-003',
    dbFlag: 'cg_ag_003_model_reg',
    name: 'Model Registration',
    description: 'Every agent AI model must be documented with model name and provider.',
    domain: 'models',
  },
  'CG-AG-004': {
    id: 'CG-AG-004',
    dbFlag: 'cg_ag_004_compliant',
    name: 'Tool Authorisation',
    description: 'Every tool and external resource accessed by an agent must be explicitly authorised before use.',
    domain: 'access',
  },
  'CG-AG-005': {
    id: 'CG-AG-005',
    dbFlag: 'cg_ag_005_compliant',
    name: 'Prompt Governance',
    description: 'Prompts must be registered, versioned, and assessed for robustness and injection risk.',
    domain: 'prompts',
  },
  'CG-AG-006': {
    id: 'CG-AG-006',
    dbFlag: 'cg_ag_006_compliant',
    name: 'MCP Server Governance',
    description: 'All MCP server connections must be registered, classified, and periodically reviewed.',
    domain: 'mcp',
  },
  'CG-AG-007': {
    id: 'CG-AG-007',
    dbFlag: 'cg_ag_007_oversight',
    name: 'Human Oversight',
    description: 'Every agent must have an appropriate human oversight level calibrated to its risk.',
    domain: 'oversight',
  },
  'CG-AG-008': {
    id: 'CG-AG-008',
    dbFlag: 'cg_ag_008_audit_trail',
    name: 'Audit Trail',
    description: 'Agent activities and governance state changes must be captured in an immutable audit ledger.',
    domain: 'audit',
  },
  'CG-AG-009': {
    id: 'CG-AG-009',
    dbFlag: 'cg_ag_009_compliant',
    name: 'Data Governance',
    description: 'Every resource carrying PII, PHI, or financial data must undergo a mandatory data governance review.',
    domain: 'data',
  },
  'CG-AG-010': {
    id: 'CG-AG-010',
    dbFlag: 'cg_ag_010_classified',
    name: 'Risk Classification',
    description: 'Every agent must be assigned both an operational risk level and an AI Act risk class.',
    domain: 'risk',
  },
  'CG-AG-011': {
    id: 'CG-AG-011',
    dbFlag: null,
    name: 'Agent-to-Agent Governance',
    description: 'All agent-to-agent relationships must be explicitly registered in the agent graph.',
    domain: 'a2a',
  },
  'CG-AG-012': {
    id: 'CG-AG-012',
    dbFlag: 'cg_ag_012_autonomous_governed',
    name: 'Autonomous Agent Governance',
    description: 'Autonomous agents require elevated oversight, fallback mechanisms, and enhanced monitoring.',
    domain: 'autonomous',
  },
};

export const CONTROL_LIST = Object.values(CG_AG_CONTROLS);

export function getCGAGControl(id: string): CGAGControl | undefined {
  return CG_AG_CONTROLS[id];
}

export function getCGAGControlByRisk(risk: DetectedRisk): CGAGControl | undefined {
  return risk.cgagControl ? CG_AG_CONTROLS[risk.cgagControl] : undefined;
}

export function isCGAGImplemented(dbFlags: Record<string, string | boolean | null>): string[] {
  const passed: string[] = [];
  for (const control of CONTROL_LIST) {
    if (!control.dbFlag) continue;
    const val = dbFlags[control.dbFlag];
    if (val === true || val === 'passed') passed.push(control.id);
  }
  return passed;
}

export function getCGAGScore(dbFlags: Record<string, string | boolean | null>): number {
  const total = CONTROL_LIST.filter(c => c.dbFlag).length;
  if (total === 0) return 100;
  const passed = isCGAGImplemented(dbFlags).length;
  return Math.round((passed / total) * 100);
}

export function buildCGAGSpecification() {
  const controls = Object.values(CG_AG_CONTROLS).map(c => ({
    id: c.id,
    name: c.name,
    domain: c.domain,
    description: c.description,
    traceability: CG_AG_TRACEABILITY[c.id] ?? {},
  }));
  return {
    standard: 'CG-AG CodeGuard Agent Governance Framework',
    principle: AGENTIC_CORE_PRINCIPLE,
    version: '1.1.0',
    license: 'CC BY 4.0',
    purpose: 'The open standard for AI agent governance. Every AI agent in production should satisfy these 12 controls.',
    mappedFrameworks: ['EU AI Act 2024/1689', 'LGPD Lei 13.709/2018', 'DORA (EU) 2022/2554', 'ISO/IEC 42001:2023', 'NIST AI RMF 1.0'],
    controls,
  };
}

export function cgagSpecificationToMarkdown(spec = buildCGAGSpecification()): string {
  const lines: string[] = [
    '# ' + spec.standard,
    '',
    '**Core Principle:** *"' + spec.principle + '"*',
    '',
    '**Version:** ' + spec.version + ' | **License:** ' + spec.license,
    '',
    '> ' + spec.purpose,
    '',
    '**Mapped Frameworks:** ' + spec.mappedFrameworks.join(' * '),
    '',
    '## The 12 Controls',
    '',
    '| ID | Control | Domain | Requirement |',
    '|----|---------|--------|-------------|',
  ];
  for (const c of spec.controls) {
    lines.push('| **' + c.id + '** | ' + c.name + ' | ' + c.domain + ' | ' + c.description + ' |');
  }
  lines.push('', '## Regulatory Traceability Matrix', '');
  lines.push('| Control | EU AI Act | LGPD | DORA | ISO/IEC 42001 | NIST AI RMF |');
  lines.push('|---------|-----------|------|------|----------------|-------------|');
  for (const c of spec.controls) {
    const t = c.traceability;
    lines.push('| ' + c.id + ' | ' + (t.aiAct ?? '-') + ' | ' + (t.lgpd ?? '-') + ' | ' + (t.dora ?? '-') + ' | ' + (t.iso42001 ?? '-') + ' | ' + (t.nist ?? '-') + ' |');
  }
  lines.push('', '---', '', '*Generated by ComplyPRO AI Governance Core Engine. Zero code retention.*');
  return lines.join('\n');
}
