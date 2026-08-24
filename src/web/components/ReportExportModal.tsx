import React, { useState } from 'react';
import { 
  Download, FileText, FileCode, Check, ShieldCheck, Printer, 
  Scale, AlertTriangle, Cpu, Bot, CheckCircle2, XCircle, ArrowUpRight 
} from 'lucide-react';
import type { ScannerResult } from '../../core/types';
import { RipdDocumentModal } from './RipdDocumentModal';

interface ReportExportModalProps {
  result: ScannerResult;
  onClose: () => void;
}

export const ReportExportModal: React.FC<ReportExportModalProps> = ({ result, onClose }) => {
  const [activeTab, setActiveTab] = useState<'visual' | 'files'>('visual');
  const [showRipdModal, setShowRipdModal] = useState(false);
  const [copiedMd, setCopiedMd] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);

  const applicableRegs = result.compliance?.applicableRegulations || [];
  const models = result.source?.aiModels || [];
  const agents = result.source?.agents || [];
  const frameworks = result.source?.frameworks || [];
  const violations = result.violations || [];
  const overallScore = result.compliance?.overallScore ?? 78;
  const riskTier = result.aiActSummary?.overallRiskTier || 'LIMITED_RISK';
  const repoName = result.repo?.name || 'Sistema de Inteligência Artificial';
  const currentDate = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadMarkdown = () => {
    const md = `# 🛡️ Relatório Executivo de Governança & Conformidade de IA
**Sistema Auditado:** ${repoName}  
**Data da Auditoria:** ${currentDate}  
**Score Geral de Conformidade:** ${overallScore}/100  
**EU AI Act Risk Tier:** ${riskTier}  
**Domínio Classificado:** ${result.compliance?.summary || 'Geral'}

---

## 📊 1. Resumo Executivo
- **Total de Arquivos:** ${result.repo?.fileCount || 0}
- **Modelos de IA / LLMs:** ${models.length}
- **Agentes de IA Mapeados:** ${agents.length}
- **Violações Identificadas:** ${violations.length}

---

## 📜 2. Matriz de Conformidade das 13 Regulações Globais

| Regulação | Autoridade | Status | Evidências / Gaps |
| :--- | :---: | :---: | :--- |
${applicableRegs.map(reg => {
  const statusLabel = reg.status === 'compliant' ? '✅ Conforme' : reg.status === 'partial' ? '⚠️ Parcial' : reg.status === 'non_compliant' ? '❌ Não Conforme' : '⚪ Não Aplicável';
  const evidence = reg.evidenceFound?.slice(0, 2).join('; ') || 'Em avaliação';
  return `| **${reg.name}** | ${reg.authority} | ${statusLabel} | ${evidence} |`;
}).join('\n')}

---

## 🤖 3. Inventário de Modelos e Agentes
${models.map((m, i) => `${i + 1}. **${m.provider}** \`${m.modelId || 'Default'}\` — Finalidade: ${m.usage || 'Inference'}`).join('\n')}

---

## ⚠️ 4. Riscos e Ações de Mitigação Prioritárias
${violations.slice(0, 15).map((v: any, i: number) => `### ${i + 1}. [${(v.severity || 'HIGH').toUpperCase()}] ${v.rule || v.id || 'VIOLATION'}
- **Local:** \`${v.file || 'N/A'}${v.line ? `:${v.line}` : ''}\`
- **Diagnóstico:** ${v.message || v.description}
- **Recomendação:** ${v.recommendation || 'Aplicar correção'}
`).join('\n')}

---
*Gerado por ComplyPRO.pt — AI & Regulatory Governance Platform.*
`;

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-executivo-compliance-${repoName}.md`;
    a.click();
    URL.revokeObjectURL(url);
    setCopiedMd(true);
    setTimeout(() => setCopiedMd(false), 2000);
  };

  const handleDownloadJSON = () => {
    const jsonStr = JSON.stringify(result, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compliance-audit-${repoName}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
        <div className="glass-panel w-full max-w-5xl bg-[#0c101d] border border-cyan-500/40 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
          
          {/* Top Bar */}
          <div className="p-4 sm:px-6 bg-[#0e1426] border-b border-surface-border flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-black font-bold">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <span>Relatório Executivo Oficial de Auditoria de IA</span>
                  <span className="px-2 py-0.5 text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800 rounded font-mono">
                    ComplyPRO.pt
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400">Documentação visual formatada para Diretoria, C-Level e Auditorias</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2">
              <button
                onClick={handlePrint}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black text-xs font-bold flex items-center space-x-1.5 shadow-glow transition-all cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 fill-black" />
                <span>Imprimir / Salvar PDF</span>
              </button>

              <button
                onClick={() => setShowRipdModal(true)}
                className="hidden sm:flex px-3 py-2 rounded-xl bg-emerald-950 text-emerald-300 border border-emerald-800 text-xs font-semibold hover:bg-emerald-900 transition-colors items-center space-x-1.5 cursor-pointer"
              >
                <Scale className="w-3.5 h-3.5" />
                <span>Ver RIPD LGPD</span>
              </button>

              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-surface hover:bg-slate-800 border border-surface-border text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="px-6 py-2 bg-[#090d18] border-b border-surface-border flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setActiveTab('visual')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'visual'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Visualização Executiva Formatada
              </button>
              <button
                onClick={() => setActiveTab('files')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'files'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Downloads de Arquivos (.MD / .JSON)
              </button>
            </div>

            <span className="text-[11px] text-slate-400 hidden sm:inline">
              Data: {currentDate}
            </span>
          </div>

          {/* Body Content */}
          <div className="p-6 sm:p-8 overflow-y-auto bg-[#070b14] space-y-6 text-slate-200">
            
            {activeTab === 'visual' ? (
              
              /* Visual Executive Report for Managers */
              <div id="executive-printable-report" className="max-w-4xl mx-auto space-y-8 bg-[#0a0f1e] p-6 sm:p-10 rounded-2xl border border-surface-border shadow-inner font-sans text-xs leading-relaxed">
                
                {/* Executive Header */}
                <div className="border-b-2 border-cyan-500/40 pb-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-cyan-400 font-bold tracking-wider uppercase text-[11px]">
                      <ShieldCheck className="w-4 h-4" />
                      <span>ComplyPRO.pt • Plataforma de Governança de IA</span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
                      AUDITORIA CONCLUÍDA
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                        RELATÓRIO DE GOVERNANÇA & CONFORMIDADE
                      </h1>
                      <p className="text-xs text-slate-300 mt-1">
                        Auditoria de Conformidade Regulatória, Segurança e Mitigação de Riscos de IA
                      </p>
                    </div>

                    {/* Overall Score Badge */}
                    <div className="flex items-center space-x-3 bg-[#080d1a] p-3 rounded-2xl border border-surface-border">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block font-semibold uppercase">Score de Governança:</span>
                        <span className="text-2xl font-black text-white">{overallScore}/100</span>
                      </div>
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-base ${
                        overallScore >= 80 ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                        overallScore >= 60 ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                        'bg-rose-950 text-rose-300 border border-rose-800'
                      }`}>
                        {overallScore}%
                      </div>
                    </div>
                  </div>

                  {/* Metadata Row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#080d1a] p-3.5 rounded-xl border border-surface-border text-[11px]">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Repositório / Pipeline:</span>
                      <span className="font-mono text-cyan-300 font-semibold">{repoName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">EU AI Act Risk Tier:</span>
                      <span className="font-mono text-amber-400 font-bold">{riskTier}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Total de Arquivos:</span>
                      <span className="text-white font-semibold">{result.repo?.fileCount || 0} arquivos</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Data da Auditoria:</span>
                      <span className="text-white font-semibold">{currentDate}</span>
                    </div>
                  </div>
                </div>

                {/* Section 1: Executive KPI Cards */}
                <div className="space-y-3">
                  <h2 className="text-sm font-bold text-cyan-300 uppercase tracking-wide border-b border-surface-border pb-1">
                    1. Síntese Executiva de Riscos & Ativos de IA
                  </h2>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="p-3 bg-[#080d1a] rounded-xl border border-surface-border">
                      <span className="text-xl font-black text-rose-400 block">
                        {violations.filter(v => v.severity === 'critical').length}
                      </span>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Violações Críticas</span>
                    </div>

                    <div className="p-3 bg-[#080d1a] rounded-xl border border-surface-border">
                      <span className="text-xl font-black text-amber-400 block">
                        {violations.filter(v => v.severity === 'high').length}
                      </span>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Violações Altas</span>
                    </div>

                    <div className="p-3 bg-[#080d1a] rounded-xl border border-surface-border">
                      <span className="text-xl font-black text-cyan-400 block">{models.length}</span>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Modelos LLM</span>
                    </div>

                    <div className="p-3 bg-[#080d1a] rounded-xl border border-surface-border">
                      <span className="text-xl font-black text-emerald-400 block">
                        {applicableRegs.filter(r => r.status === 'compliant').length}/13
                      </span>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Regulações Conformes</span>
                    </div>
                  </div>
                </div>

                {/* Section 2: 13 Global Regulations Table */}
                <div className="space-y-3">
                  <h2 className="text-sm font-bold text-cyan-300 uppercase tracking-wide border-b border-surface-border pb-1">
                    2. Matriz de Conformidade Regulatória (13 Normas Globais)
                  </h2>

                  <div className="overflow-x-auto rounded-xl border border-surface-border">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-[#080d1a] text-slate-400 border-b border-surface-border uppercase text-[10px]">
                        <tr>
                          <th className="py-2.5 px-3">Regulação / Norma</th>
                          <th className="py-2.5 px-3">Autoridade</th>
                          <th className="py-2.5 px-3">Status de Conformidade</th>
                          <th className="py-2.5 px-3">Diagnóstico Técnico</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-border bg-[#090d18]">
                        {applicableRegs.map((reg, idx) => {
                          const isCompliant = reg.status === 'compliant';
                          const isPartial = reg.status === 'partial';
                          const isNon = reg.status === 'non_compliant';

                          return (
                            <tr key={idx} className="hover:bg-surface/50 transition-colors">
                              <td className="py-2.5 px-3 font-semibold text-white">
                                {reg.name}
                              </td>
                              <td className="py-2.5 px-3 text-slate-400 font-mono text-[10px]">
                                {reg.authority}
                              </td>
                              <td className="py-2.5 px-3">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center space-x-1 ${
                                  isCompliant ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                                  isPartial ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                                  isNon ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                                  'bg-slate-800 text-slate-300'
                                }`}>
                                  <span>{isCompliant ? '✓ Conforme' : isPartial ? '⚠ Parcial' : isNon ? '✕ Não Conforme' : '⚪ N/A'}</span>
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-slate-300">
                                {reg.evidenceFound && reg.evidenceFound.length > 0 
                                  ? reg.evidenceFound[0] 
                                  : reg.gaps && reg.gaps.length > 0 
                                  ? reg.gaps[0] 
                                  : 'Em conformidade'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Section 3: AI Inventory */}
                <div className="space-y-3">
                  <h2 className="text-sm font-bold text-cyan-300 uppercase tracking-wide border-b border-surface-border pb-1">
                    3. Inventário Mapeado de Modelos & Agentes
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3.5 bg-[#080d1a] rounded-xl border border-surface-border space-y-2">
                      <span className="font-bold text-white block text-[11px]">Modelos LLM Conectados:</span>
                      {models.length > 0 ? (
                        <ul className="space-y-1 text-slate-300 text-[11px]">
                          {models.map((m, i) => (
                            <li key={i} className="flex items-center justify-between font-mono">
                              <span className="text-cyan-300">▸ {m.provider} {m.modelId}</span>
                              <span className="text-slate-500 text-[10px]">{m.usage}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-slate-500 italic text-[11px]">Nenhum modelo externo identificado.</p>
                      )}
                    </div>

                    <div className="p-3.5 bg-[#080d1a] rounded-xl border border-surface-border space-y-2">
                      <span className="font-bold text-white block text-[11px]">Agentes de IA e Frameworks:</span>
                      {frameworks.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {frameworks.map((f: any, i) => (
                            <span key={i} className="px-2 py-0.5 bg-slate-800 text-slate-200 rounded font-mono text-[10px]">
                              {typeof f === 'string' ? f : f.framework}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-slate-500 italic text-[11px]">Código padrão sem frameworks adicionais.</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Section 4: Top Prioritized Remediation Actions */}
                <div className="space-y-3">
                  <h2 className="text-sm font-bold text-cyan-300 uppercase tracking-wide border-b border-surface-border pb-1">
                    4. Recomendações e Ações Prioritárias para Conformidade
                  </h2>

                  <div className="space-y-2">
                    {violations.slice(0, 5).map((v: any, i) => (
                      <div key={i} className="p-3 bg-[#080d1a] rounded-xl border border-surface-border space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white font-mono text-[11px]">
                            {i + 1}. {v.rule || v.id || 'VIOLATION'}
                          </span>
                          <span className="text-[10px] text-amber-400 font-mono">
                            {v.file}:{v.line || 1}
                          </span>
                        </div>
                        <p className="text-slate-300 text-[11px]">{v.message}</p>
                        <div className="text-emerald-400 text-[10px] font-mono">
                          <strong>Ação:</strong> {v.recommendation || 'Implementar controle de mitigação'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Executive Sign-off */}
                <div className="pt-6 border-t border-surface-border flex items-center justify-between text-[11px] text-slate-400">
                  <span>Documento emitido por <strong>ComplyPRO.pt</strong> AI Regulatory Governance Platform</span>
                  <span>Homologação e Conformidade Digital</span>
                </div>

              </div>

            ) : (
              
              /* File Downloads Tab */
              <div className="max-w-2xl mx-auto space-y-4 py-6">
                <button
                  onClick={handleDownloadMarkdown}
                  className="w-full p-4 rounded-2xl bg-surface hover:bg-slate-800 border border-surface-border flex items-center justify-between text-left transition-all group cursor-pointer"
                >
                  <div className="flex items-center space-x-3">
                    <FileText className="w-6 h-6 text-cyan-400 group-hover:scale-110 transition-transform" />
                    <div>
                      <h4 className="text-xs font-bold text-white">Relatório Executivo em Markdown (.MD)</h4>
                      <p className="text-[11px] text-slate-400">Documento estruturado com todas as 13 regulações, scores e tabelas</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1.5 text-xs text-cyan-400">
                    {copiedMd ? <Check className="w-4 h-4 text-emerald-400" /> : <Download className="w-4 h-4" />}
                    <span>{copiedMd ? 'Baixado!' : 'Baixar MD'}</span>
                  </div>
                </button>

                <button
                  onClick={() => setShowRipdModal(true)}
                  className="w-full p-4 rounded-2xl bg-surface hover:bg-slate-800 border border-surface-border flex items-center justify-between text-left transition-all group cursor-pointer"
                >
                  <div className="flex items-center space-x-3">
                    <Scale className="w-6 h-6 text-emerald-400 group-hover:scale-110 transition-transform" />
                    <div>
                      <h4 className="text-xs font-bold text-white">Relatório de Impacto à Proteção de Dados — RIPD (.PDF / .TXT)</h4>
                      <p className="text-[11px] text-slate-400">Documento oficial exigido pelo Artigo 38 da LGPD</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1.5 text-xs text-emerald-400">
                    <ArrowUpRight className="w-4 h-4" />
                    <span>Visualizar RIPD</span>
                  </div>
                </button>

                <button
                  onClick={handleDownloadJSON}
                  className="w-full p-4 rounded-2xl bg-surface hover:bg-slate-800 border border-surface-border flex items-center justify-between text-left transition-all group cursor-pointer"
                >
                  <div className="flex items-center space-x-3">
                    <FileCode className="w-6 h-6 text-purple-400 group-hover:scale-110 transition-transform" />
                    <div>
                      <h4 className="text-xs font-bold text-white">Árvore Completa de Dados do Scanner (.JSON)</h4>
                      <p className="text-[11px] text-slate-400">Exportação técnica integral de dados para integrações e pipelines CI/CD</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1.5 text-xs text-purple-400">
                    {copiedJson ? <Check className="w-4 h-4 text-emerald-400" /> : <Download className="w-4 h-4" />}
                    <span>{copiedJson ? 'Baixado!' : 'Baixar JSON'}</span>
                  </div>
                </button>
              </div>
            )}

          </div>

        </div>
      </div>

      {/* Render Official RIPD Modal if requested */}
      {showRipdModal && (
        <RipdDocumentModal result={result} onClose={() => setShowRipdModal(false)} />
      )}
    </>
  );
};
