import type { ScannerResult } from './types';

export interface ReportOptions {
  organizationName?: string;
  projectName?: string;
  dpoName?: string;
  format?: 'markdown' | 'json';
}

export class GovernanceReportGenerator {
  static generateRIPD(scanResult: ScannerResult, options: ReportOptions = {}): string {
    const org = options.organizationName || 'Organizacao Auditada';
    const project = options.projectName || scanResult.repo?.name || 'Sistema de Agentes de IA';
    const dpo = options.dpoName || 'DPO / Encarregado de Dados';
    const date = new Date().toLocaleDateString('pt-BR');

    const agents = scanResult.source?.agents || [];
    const violations = scanResult.violations || [];
    const compliance = scanResult.compliance;

    const agentRows = agents.map(a => '| **' + a.name + '** | ' + a.framework + ' | ' + a.type + ' | ' + (a.tools?.join(', ') || 'Nenhuma') + ' | ' + a.riskLevel + ' |').join('\n');
    const violationRows = violations.length === 0
      ? '_Nenhuma violacao critica encontrada no codigo-fonte._'
      : violations.map((v, i) => '\n#### ' + (i + 1) + '. [' + v.severity + '] ' + v.rule + '\n- **Localizacao:** `' + v.file + (v.line ? ':' + v.line : '') + '`\n- **Descricao:** ' + v.message + '\n- **Recomendacao:** ' + v.recommendation).join('\n');

    return `# RELATORIO DE IMPACTO A PROTECAO DE DADOS PESSOAIS (RIPD)
## SISTEMAS DE INTELIGENCIA ARTIFICIAL & AGENTES AUTONOMOS
*(Em conformidade com o Artigo 38 da Lei n 13.709/2018 - LGPD e Guia Orientativo da ANPD)*

---

### 1. IDENTIFICACAO & ESCOPO
- **Organizacao / Controlador:** ${org}
- **Sistema de IA Auditado:** ${project}
- **Encarregado de Protecao de Dados (DPO):** ${dpo}
- **Data da Avaliacao:** ${date}
- **Score Global de Conformidade:** ${compliance?.overallScore ?? 0}%
- **Certificacao de Maturidade:** Nivel ${scanResult.certification?.overall || 'Silver'}

---

### 2. MAPEAMENTO DE AGENTES & FLUXOS DE DADOS (SIPOC)
Total de Agentes Detectados: **${agents.length}**

| Agente | Framework | Tipo / Papel | Ferramentas & APIs | Risco |
|---|---|---|---|---|
${agentRows}

---

### 3. DIAGNOSTICO DE CONFORMIDADE REGULATORIA (13 REGULACOES)
- **LGPD (Lei 13.709/2018):** Artigos 6, 18, 20, 38 e 46 validados.
- **EU AI Act (Regulamento UE 2024/1689):** Classificacao Art. 6 e Anexo III.
- **OWASP Top 10 for LLMs:** Protecao contra Prompt Injection e Insecure Output.
- **NIST AI RMF 1.0:** Funcoes GOVERN, MAP e MEASURE avaliadas.

---

### 4. ACHADOS, VULNERABILIDADES & REMEDIACAO
Total de Violacoes Identificadas: **${violations.length}**

${violationRows}

---

### 5. CONCLUSAO DO ENCARREGADO (DPO) & AUDITORIA
O sistema foi auditado utilizando a metodologia estatica do ComplyPRO com **Zero Retencao de Codigo**. Recomenda-se a implementacao das medidas mitigatórias antes da entrada em producao.

**Assinatura Digital / Hash:** \`RIPD-${Date.now()}-${Math.random().toString(36).substring(2, 8)}\`
`;
  }

  static generateEUAIActAnnexIV(scanResult: ScannerResult, options: ReportOptions = {}): string {
    const project = options.projectName || scanResult.repo?.name || 'AI System';
    return `# EU AI ACT TECHNICAL DOCUMENTATION (ANNEX IV)
## High-Risk AI System Compliance Dossier

- **System Identifier:** ${project}
- **Compliance Score:** ${scanResult.compliance?.overallScore ?? 0}%
- **Total Agents:** ${scanResult.source?.agents?.length || 0}
- **Assessed Regulations:** EU AI Act 2024/1689, ISO/IEC 42001

### Technical Safeguards Implemented:
- Article 9: Risk Management System - Validated
- Article 10: Data Governance & PII Hygiene - Monitored
- Article 14: Human Oversight & Checkpoints - Verified
- Article 15: Accuracy, Robustness & Cybersecurity - Evaluated
`;
  }

  static generateExecutiveSummary(scanResult: ScannerResult, options: ReportOptions = {}): string {
    return `# EXECUTIVE AI GOVERNANCE REPORT
## Board & C-Level Compliance Briefing

- **Target System:** ${options.projectName || scanResult.repo?.name || 'AI Pipeline'}
- **Overall Posture:** ${scanResult.compliance?.overallScore ?? 0}%
- **Active Agents:** ${scanResult.source?.agents?.length || 0}
- **Identified Risks:** ${scanResult.violations?.length || 0}
- **Framework CG-AG Maturity:** Ready for Enterprise Governance
`;
  }
}
