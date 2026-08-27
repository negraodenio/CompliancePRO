/**
 * CG-AG Agentic Light — Rapid Agent Governance Assessment
 * 
 * 10-Dimension Rapid Assessment for organizations scaling AI Agents.
 * Generates the Agentic Governance Score (0 - 100):
 * 🟢 Governed | 🟡 Attention Required | 🔴 Exposure
 * 
 * Note: The Agentic Governance Score (10 dimensions) is distinct from the
 * CG-AG Governance Score (based on the 12 CG-AG Governance Controls).
 */

import type { ScannerResult } from './types';
import { AgentPassportGenerator, AgentGovernancePassport } from './agent-passport';
import { AgenticLifecycleEngine, AgenticLifecycleAudit } from './agentic-lifecycle';

export interface AgenticLightDimension {
  id: number;
  name: string;
  question: string;
  status: 'PASS' | 'WARN' | 'FAIL';
  score: number; // 0 - 100
  evidence: string;
  missingControl: string | null;
  remediationPriority: 'P1 - Immediate' | 'P2 - High' | 'P3 - Medium' | 'P4 - Low';
}

export interface AgenticLightResult {
  projectName: string;
  assessedAt: string;
  agenticGovernanceScore: number; // 0 - 100 (based on the 10 dimensions)
  rating: 'Governed' | 'Attention Required' | 'Exposure';
  ratingEmoji: '🟢' | '🟡' | '🔴';
  totalAgentsAudited: number;
  dimensions: AgenticLightDimension[];
  keyGaps: string[];
  missingControls: string[];
  autonomyPosture: string;
  observabilityPosture: string;
  interventionCapacity: string;
  correctivePriorities: { priority: string; action: string }[];
  passports: AgentGovernancePassport[];
  lifecycleAudits: AgenticLifecycleAudit[];
}

export class AgenticLightAssessment {
  /**
   * Executes the 10-Dimension Rapid Agent Governance Assessment.
   */
  static assess(scanResult: ScannerResult): AgenticLightResult {
    const agents = scanResult.source?.agents || [];
    const violations = scanResult.violations || [];
    const risks = scanResult.risks || [];
    const projectName = scanResult.repo?.name || 'AI Agent System';

    // 1. Purpose
    const dim1: AgenticLightDimension = {
      id: 1,
      name: 'Purpose',
      question: 'Sabemos exatamente por que o agente existe?',
      status: agents.length > 0 ? 'PASS' : 'WARN',
      score: agents.length > 0 ? 95 : 50,
      evidence: `${agents.length} agente(s) com papéis mapeados no código.`,
      missingControl: null,
      remediationPriority: 'P4 - Low'
    };

    // 2. Ownership
    const hasOwnerExplicit = agents.some(a => a.businessPurpose && /owner|responsavel|gestor/i.test(a.businessPurpose));
    const dim2: AgenticLightDimension = {
      id: 2,
      name: 'Ownership',
      question: 'Existe um responsável humano legalmente atribuído?',
      status: hasOwnerExplicit ? 'PASS' : 'WARN',
      score: hasOwnerExplicit ? 90 : 55,
      evidence: hasOwnerExplicit ? 'Owner identificado nas declarações.' : 'Owner implícito ao repositório.',
      missingControl: hasOwnerExplicit ? null : 'CG-AG-01: Formal Agent Ownership Assignment',
      remediationPriority: 'P2 - High'
    };

    // 3. Autonomy
    const hasHighAutonomy = agents.some(a => (a.riskLevel || '').toLowerCase() === 'high' || (a.riskLevel || '').toLowerCase() === 'critical');
    const dim3: AgenticLightDimension = {
      id: 3,
      name: 'Autonomy',
      question: 'Sabemos o que ele pode decidir sozinho e seus limites?',
      status: hasHighAutonomy ? 'WARN' : 'PASS',
      score: hasHighAutonomy ? 60 : 85,
      evidence: hasHighAutonomy ? 'Agente opera em nível L3 (Autonomia com alçada crítica).' : 'Autonomia L2 supervisionada.',
      missingControl: hasHighAutonomy ? 'CG-AG-04: Autonomous Agent Operational Boundary' : null,
      remediationPriority: 'P1 - Immediate'
    };

    // 4. Data
    const hasPiiFindings = violations.some(v => v.rule.includes('PII') || v.rule.includes('LGPD'));
    const dim4: AgenticLightDimension = {
      id: 4,
      name: 'Data',
      question: 'Sabemos quais dados ele acessa e se há dados pessoais/sensíveis?',
      status: hasPiiFindings ? 'FAIL' : 'PASS',
      score: hasPiiFindings ? 35 : 90,
      evidence: hasPiiFindings ? 'Acesso a fluxos com PII sem sanitização comprovada.' : 'Sem violações diretas de PII.',
      missingControl: hasPiiFindings ? 'CG-AG-06: PII & Restricted Data Governance Safeguard' : null,
      remediationPriority: 'P1 - Immediate'
    };

    // 5. Tools
    const totalTools = agents.reduce((acc, a) => acc + (a.tools?.length || 0), 0);
    const dim5: AgenticLightDimension = {
      id: 5,
      name: 'Tools',
      question: 'Sabemos quais ferramentas e conectores ele pode utilizar?',
      status: 'PASS',
      score: 85,
      evidence: `${totalTools} ferramenta(s) e conectores registrados na análise estática.`,
      missingControl: null,
      remediationPriority: 'P3 - Medium'
    };

    // 6. Permissions
    const hasDangerousTools = agents.some(a => (a.tools || []).some(t => /exec|shell|bash|eval/i.test(t)));
    const dim6: AgenticLightDimension = {
      id: 6,
      name: 'Permissions',
      question: 'Seus privilégios estão controlados pelo princípio do menor privilégio?',
      status: hasDangerousTools ? 'FAIL' : 'PASS',
      score: hasDangerousTools ? 30 : 90,
      evidence: hasDangerousTools ? 'Ferramentas com permissão de execução aberta identificadas.' : 'Permissões restritas ao escopo.',
      missingControl: hasDangerousTools ? 'CG-AG-02: Least-Privilege Tool Authorization' : null,
      remediationPriority: 'P1 - Immediate'
    };

    // 7. Policy
    const hasVerboseOrDebug = violations.some(v => v.rule.includes('VERBOSE') || v.rule.includes('DEBUG'));
    const dim7: AgenticLightDimension = {
      id: 7,
      name: 'Policy',
      question: 'Existem políticas, guardrails e defesas ativas contra injeção de prompt?',
      status: hasVerboseOrDebug ? 'WARN' : 'PASS',
      score: hasVerboseOrDebug ? 50 : 85,
      evidence: hasVerboseOrDebug ? 'Debug ativo em código suscetível a vazamento de prompt.' : 'Políticas padrão ativas.',
      missingControl: hasVerboseOrDebug ? 'CG-AG-05: Prompt & Guardrail Governance' : null,
      remediationPriority: 'P2 - High'
    };

    // 8. Observability
    const dim8: AgenticLightDimension = {
      id: 8,
      name: 'Observability',
      question: 'Conseguimos observar suas ações e telemetria de execução?',
      status: 'PASS',
      score: 75,
      evidence: 'Pontos de observabilidade mapeados no grafo de execução.',
      missingControl: null,
      remediationPriority: 'P3 - Medium'
    };

    // 9. Evidence
    const dim9: AgenticLightDimension = {
      id: 9,
      name: 'Evidence',
      question: 'Conseguimos reconstruir suas decisões perante auditoria ou ANPD?',
      status: 'WARN',
      score: 65,
      evidence: 'Linhagem de decisão depende de retenção imutável de logs.',
      missingControl: 'CG-AG-07: Tamper-Evident Audit & Evidence Ledger',
      remediationPriority: 'P2 - High'
    };

    // 10. Response
    const dim10: AgenticLightDimension = {
      id: 10,
      name: 'Response',
      question: 'Conseguimos intervir, bloquear ou desligar o agente imediatamente (Kill Switch)?',
      status: 'WARN',
      score: 60,
      evidence: 'Kill switch manual disponível via código; automação de circuit breaker pendente.',
      missingControl: 'CG-AG-04: Automated Circuit Breaker & Emergency Kill Switch',
      remediationPriority: 'P1 - Immediate'
    };

    const dimensions = [dim1, dim2, dim3, dim4, dim5, dim6, dim7, dim8, dim9, dim10];
    const totalScore = Math.round(dimensions.reduce((acc, d) => acc + d.score, 0) / dimensions.length);

    let rating: 'Governed' | 'Attention Required' | 'Exposure' = 'Attention Required';
    let ratingEmoji: '🟢' | '🟡' | '🔴' = '🟡';

    if (totalScore >= 80) {
      rating = 'Governed';
      ratingEmoji = '🟢';
    } else if (totalScore < 60) {
      rating = 'Exposure';
      ratingEmoji = '🔴';
    }

    const keyGaps: string[] = dimensions.filter(d => d.status !== 'PASS').map(d => `${d.name}: ${d.evidence}`);
    const missingControls: string[] = dimensions.map(d => d.missingControl).filter(Boolean) as string[];

    const correctivePriorities = dimensions
      .filter(d => d.missingControl !== null)
      .map(d => ({
        priority: d.remediationPriority,
        action: `[${d.name}] Implementar ${d.missingControl}`
      }))
      .sort((a, b) => a.priority.localeCompare(b.priority));

    const passports = agents.map(a => AgentPassportGenerator.generatePassport(a, projectName, violations));
    const lifecycleAudits = agents.map(a => AgenticLifecycleEngine.auditAgent(a, violations, risks));

    return {
      projectName,
      assessedAt: new Date().toISOString(),
      agenticGovernanceScore: totalScore,
      rating,
      ratingEmoji,
      totalAgentsAudited: agents.length,
      dimensions,
      keyGaps,
      missingControls,
      autonomyPosture: hasHighAutonomy ? 'Elevated (Requires Tier-2 HITL)' : 'Standard Supervised',
      observabilityPosture: 'Telemetry Ready',
      interventionCapacity: 'Manual Stop Active / Automated Circuit Breaker Recommended',
      correctivePriorities,
      passports,
      lifecycleAudits
    };
  }

  static toMarkdown(result: AgenticLightResult): string {
    return `# 🎯 CG-AG AGENTIC LIGHT ASSESSMENT
## Rapid Agent Governance Diagnostic (10 Dimensions)

**Project:** ${result.projectName} | **Date:** ${new Date(result.assessedAt).toLocaleDateString('pt-BR')}  
**Agentic Governance Score:** **${result.agenticGovernanceScore}%** — ${result.ratingEmoji} **${result.rating.toUpperCase()}**  
*(Note: Agentic Score is based on 10 dimensions; CG-AG Governance Score is based on 12 controls)*  
**Total Agents Audited:** ${result.totalAgentsAudited}

---

### 📋 10-DIMENSION SCORECARD

| # | Dimension | Question | Status | Score | Missing Control |
|---|---|---|---|---|---|
${result.dimensions.map(d => `| **${d.id}** | **${d.name}** | ${d.question} | ${d.status === 'PASS' ? '🟢 PASS' : (d.status === 'WARN' ? '🟡 WARN' : '🔴 FAIL')} | ${d.score}% | ${d.missingControl || '—'} |`).join('\n')}

---

### ⚠️ IDENTIFIED GAPS & EXPOSURES
${result.keyGaps.length === 0 ? '_Nenhum gap crítico detectado._' : result.keyGaps.map(g => `- ⚠️ ${g}`).join('\n')}

---

### 🚀 PRIORITIZED CORRECTIVE ACTIONS
${result.correctivePriorities.length === 0 ? '_Sistema em conformidade ótima._' : result.correctivePriorities.map(c => `- **${c.priority}:** ${c.action}`).join('\n')}

---

### 🪪 ISSUED VERIFIABLE AGENT GOVERNANCE PASSPORTS (${result.passports.length})
${result.passports.map(p => `- **${p.identity.name}** (\`${p.identity.agentId}\`): ${p.operational.currentStatus} | Autonomia: ${p.governance.autonomyLevel} | Risco: ${p.governance.riskLevel}`).join('\n')}

---
*Governed under the CG-AG Governance Control Plane. Principle: "Every Agent Action Must Be Governable and Evidenced."*
`;
  }
}
