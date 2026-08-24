import React, { useState } from 'react';
import { Download, FileText, FileCode, Check, ShieldCheck, Printer } from 'lucide-react';
import type { ScannerResult } from '../../core/types';
import { generateRIPD } from '../../regulations/lgpd';

interface ReportExportModalProps {
  result: ScannerResult;
  onClose: () => void;
}

export const ReportExportModal: React.FC<ReportExportModalProps> = ({ result, onClose }) => {
  const [copiedType, setCopiedType] = useState<string | null>(null);

  const handleDownloadMarkdown = () => {
    const applicableRegs = result.compliance?.applicableRegulations || [];
    const models = result.source?.aiModels || [];
    const agents = result.source?.agents || [];
    const frameworks = result.source?.frameworks || [];
    const violations = result.violations || [];

    const md = `# 🛡️ Relatório de Auditoria de Governança e Conformidade de IA
**Projeto / Repositório:** ${result.repo?.name || 'Projeto IA'}  
**Data da Auditoria:** ${new Date().toLocaleString('pt-BR')}  
**Score Geral de Conformidade:** ${result.compliance?.overallScore ?? 78}/100  
**EU AI Act Risk Tier:** ${result.aiActSummary?.overallRiskTier || 'LIMITED_RISK'}  
**Domínio Classificado:** ${result.compliance?.summary || 'Geral'}

---

## 📊 1. Resumo Executivo
- **Total de Arquivos Auditados:** ${result.repo?.fileCount || 0}
- **Modelos LLM / IA Detectados:** ${models.length}
- **Agentes de IA Mapeados:** ${agents.length}
- **Ocorrências de Shadow AI:** ${result.shadowAI?.length || 0}
- **Total de Violações Identificadas:** ${violations.length}

---

## 📜 2. Status das 13 Regulações Globais

| Regulação | Autoridade | Status | Principais Requisitos / Evidências |
| :--- | :---: | :---: | :--- |
${applicableRegs.map(reg => {
  const statusLabel = reg.status === 'compliant' ? '✅ Conforme' : reg.status === 'partial' ? '⚠️ Parcial' : reg.status === 'non_compliant' ? '❌ Não Conforme' : '⚪ Não Aplicável';
  const evidence = reg.evidenceFound?.slice(0, 2).join('; ') || 'Em avaliação';
  return `| **${reg.name}** | ${reg.authority} | ${statusLabel} | ${evidence} |`;
}).join('\n')}

---

## 🤖 3. Inventário de Agentes, Modelos e Frameworks

### 🧠 Modelos de IA Detectados (${models.length}):
${models.length > 0
  ? models.map((m, i) => `${i + 1}. **${m.provider}** \`${m.modelId || 'Default'}\` — Finalidade: *${m.usage || 'Inference / Chat'}*`).join('\n')
  : '- Nenhum modelo LLM externo identificado.'}

### 🤖 Agentes de IA (${agents.length}):
${agents.length > 0
  ? agents.map((a, i) => `${i + 1}. **${a.name}** (${a.framework || 'Custom'}) — Nível de Risco: **${a.riskLevel?.toUpperCase()}** — Decisão Autônoma: ${a.isAutonomous ? 'Sim (HITL Requerido)' : 'Não'}`).join('\n')
  : '- Nenhum agente autônomo específico registrado.'}

### 🔌 Frameworks e Ferramentas:
${frameworks.length > 0
  ? frameworks.map((f: any) => `- **${typeof f === 'string' ? f : f.framework}** (Confiança: ${typeof f === 'string' ? 'Alta' : f.confidence})`).join('\n')
  : '- Sem frameworks adicionais detectados.'}

---

## ⚠️ 4. Violações e Riscos Encontrados (${violations.length})
${violations.length > 0
  ? violations.map((v: any, i: number) => {
      const ruleCode = v.rule || v.ruleId || v.id || 'VIOLATION_DETECTED';
      const regCategory = v.regulation || v.category?.toUpperCase() || 'Geral / OWASP';
      const fileLoc = v.file ? `${v.file}${v.line ? `:${v.line}` : ''}` : 'Configuração Global';
      return `### ${i + 1}. [${(v.severity || 'HIGH').toUpperCase()}] ${ruleCode}
- **Regulação / Categoria:** ${regCategory}
- **Localização:** \`${fileLoc}\`
- **Mensagem:** ${v.message || v.description || 'Risco de conformidade identificado'}
- **Recomendação:** ${v.recommendation || 'Adequar implementação aos padrões de conformidade.'}
`;
    }).join('\n')
  : 'Nenhuma violação crítica encontrada. Código em total conformidade!'}

---
*Gerado automaticamente por ComplyPRO.pt — AI & Regulatory Governance Platform.*
`;

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `auditoria-compliance-${result.repo?.name || 'ai'}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadJSON = () => {
    const jsonStr = JSON.stringify(result, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compliance-audit-${result.repo?.name || 'ai'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadRIPD = () => {
    const ripd = generateRIPD({
      processingActivity: `Pipeline de Agentes IA - ${result.repo?.name || 'Sistema'}`,
      purposes: ['DECISION_ANALYSIS', 'REGULATORY_COMPLIANCE'],
      dataCategories: ['Logs de Prompt', 'Identificadores de Usuário', 'Decisões de Algoritmo'],
      hasSensitiveData: true,
      hasAutomatedDecisions: true,
      humanOversightLevel: 'l2_human_review',
    });

    const blob = new Blob([ripd], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RIPD-LGPD-${result.repo?.name || 'projeto'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="glass-panel w-full max-w-lg bg-[#0e1424] border border-cyan-500/40 rounded-2xl p-6 shadow-2xl space-y-5">
        
        <div className="flex items-start justify-between pb-3 border-b border-surface-border">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Exportar Relatórios Oficiais</h3>
              <p className="text-[11px] text-slate-400">Documentação para auditoria, ANPD e diretoria</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg text-lg"
          >
            ✕
          </button>
        </div>

        {/* Options */}
        <div className="space-y-3">
          
          <button
            onClick={handleDownloadMarkdown}
            className="w-full p-3.5 rounded-xl bg-surface hover:bg-slate-800 border border-surface-border flex items-center justify-between text-left transition-all group"
          >
            <div className="flex items-center space-x-3">
              <FileText className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
              <div>
                <h4 className="text-xs font-bold text-white">Relatório Executivo (.MD)</h4>
                <p className="text-[11px] text-slate-400">Markdown formatado com todas as 13 regulações e riscos</p>
              </div>
            </div>
            <Download className="w-4 h-4 text-slate-500 group-hover:text-cyan-400" />
          </button>

          <button
            onClick={handleDownloadRIPD}
            className="w-full p-3.5 rounded-xl bg-surface hover:bg-slate-800 border border-surface-border flex items-center justify-between text-left transition-all group"
          >
            <div className="flex items-center space-x-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
              <div>
                <h4 className="text-xs font-bold text-white">RIPD Oficial LGPD (.TXT)</h4>
                <p className="text-[11px] text-slate-400">Relatório de Impacto à Proteção de Dados (Art. 38 LGPD)</p>
              </div>
            </div>
            <Download className="w-4 h-4 text-slate-500 group-hover:text-emerald-400" />
          </button>

          <button
            onClick={handleDownloadJSON}
            className="w-full p-3.5 rounded-xl bg-surface hover:bg-slate-800 border border-surface-border flex items-center justify-between text-left transition-all group"
          >
            <div className="flex items-center space-x-3">
              <FileCode className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform" />
              <div>
                <h4 className="text-xs font-bold text-white">Dados Brutos do Scanner (.JSON)</h4>
                <p className="text-[11px] text-slate-400">Árvore completa de entidades, violações e linhagem de dados</p>
              </div>
            </div>
            <Download className="w-4 h-4 text-slate-500 group-hover:text-purple-400" />
          </button>

          <button
            onClick={handlePrint}
            className="w-full p-3.5 rounded-xl bg-surface hover:bg-slate-800 border border-surface-border flex items-center justify-between text-left transition-all group"
          >
            <div className="flex items-center space-x-3">
              <Printer className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
              <div>
                <h4 className="text-xs font-bold text-white">Imprimir / Salvar em PDF</h4>
                <p className="text-[11px] text-slate-400">Layout preparado para impressão e exportação em PDF</p>
              </div>
            </div>
            <Printer className="w-4 h-4 text-slate-500 group-hover:text-amber-400" />
          </button>

        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-surface hover:bg-slate-800 text-white rounded-xl text-xs font-semibold border border-surface-border"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
