import React, { useState } from 'react';
import { 
  Download, FileText, FileCode, Check, ShieldCheck, Printer, 
  Scale, AlertTriangle, Cpu, Bot, CheckCircle2, XCircle, ArrowUpRight 
} from 'lucide-react';
import type { ScannerResult } from '../../core/types';
import { RipdDocumentModal } from './RipdDocumentModal';
import { getAgentBusinessAndSipoc } from '../services/agent-sipoc-mapper';

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
  const riskTier = (result as any)?.aiActSummary?.overallRiskTier || (result as any)?.aiActSummary?.systemTier || 'LIMITED_RISK';
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

## 🤖 3. Inventário de Modelos e Agentes (Arquitetura SIPOC)

### Modelos LLM Conectados:
${models.length > 0 ? models.map((m, i) => `${i + 1}. **${m.provider}** \`${m.modelId || 'Default'}\` — Finalidade: ${m.usage || 'Inference'}`).join('\n') : '_Nenhum modelo externo identificado._'}

### Agentes Autônomos e Cadeia SIPOC:
${agents.length > 0 ? agents.map((a, i) => {
  const { businessPurpose, sipoc } = getAgentBusinessAndSipoc(a);
  return `#### ${i + 1}. ${a.name} (${a.framework || 'Framework de IA'}) — [RISCO ${a.riskLevel.toUpperCase()}]
- **Função de Negócio:** ${businessPurpose}
- **📥 Entrada (Input):** ${sipoc.input} _(Origem: ${sipoc.supplier})_
- **⚙️ Processo:** ${sipoc.process} _(Supervisão: ${a.oversightLevel || 'l2_human_review'})_
- **📤 Saída (Output):** ${sipoc.output} _(Destino: ${sipoc.customer})_
- **Ferramentas:** ${a.tools && a.tools.length > 0 ? a.tools.join(', ') : 'Inferência Direta'}
`;
}).join('\n') : '_Nenhum agente autônomo complexo mapeado._'}

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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in">
        <div className="w-full max-w-5xl bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
          
          {/* Top Bar */}
          <div className="p-4 sm:px-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-slate-100 text-slate-800 border border-slate-200 font-bold">
                <FileText className="w-5 h-5 text-slate-700" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                  <span>Relatório Executivo Oficial de Auditoria de IA</span>
                  <span className="px-2 py-0.5 text-[10px] bg-slate-100 text-slate-700 border border-slate-200 rounded font-mono font-bold">
                    ComplyPRO.pt
                  </span>
                </h3>
                <p className="text-[11px] text-slate-500">Documentação visual formatada para Diretoria, C-Level e Auditorias</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2">
              <button
                onClick={handlePrint}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center space-x-1.5 shadow-xs transition-all cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir / Salvar PDF</span>
              </button>

              <button
                onClick={() => setShowRipdModal(true)}
                className="hidden sm:flex px-3 py-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold hover:bg-emerald-100 transition-colors items-center space-x-1.5 cursor-pointer shadow-2xs"
              >
                <Scale className="w-3.5 h-3.5 text-emerald-700" />
                <span>Ver RIPD LGPD</span>
              </button>

              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="px-6 py-2 bg-white border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setActiveTab('visual')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'visual'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Visualização Executiva Formatada
              </button>
              <button
                onClick={() => setActiveTab('files')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'files'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Downloads de Arquivos (.MD / .JSON)
              </button>
            </div>

            <span className="text-[11px] text-slate-500 hidden sm:inline font-mono">
              Data: {currentDate}
            </span>
          </div>

          {/* Body Content */}
          <div className="p-6 sm:p-8 overflow-y-auto bg-slate-50 space-y-6 text-slate-800">
            
            {activeTab === 'visual' ? (
              
              /* Visual Executive Report for Managers */
              <div id="executive-printable-report" className="max-w-4xl mx-auto space-y-8 bg-white p-6 sm:p-10 rounded-2xl border border-slate-200 shadow-2xs font-sans text-xs leading-relaxed">
                
                {/* Executive Header */}
                <div className="border-b-2 border-slate-200 pb-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-slate-800 font-bold tracking-wider uppercase text-[11px]">
                      <ShieldCheck className="w-4 h-4 text-slate-700" />
                      <span>ComplyPRO.pt • Plataforma de Governança de IA</span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-100 text-slate-800 border border-slate-200">
                      AUDITORIA CONCLUÍDA
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                        RELATÓRIO DE GOVERNANÇA & CONFORMIDADE
                      </h1>
                      <p className="text-xs text-slate-600 mt-1">
                        Auditoria de Conformidade Regulatória, Segurança e Mitigação de Riscos de IA
                      </p>
                    </div>

                    {/* Overall Score Badge */}
                    <div className="flex items-center space-x-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-500 block font-bold uppercase">Score de Governança:</span>
                        <span className="text-2xl font-black text-slate-900">{overallScore}/100</span>
                      </div>
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-base ${
                        overallScore >= 80 ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                        overallScore >= 60 ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                        'bg-rose-50 text-rose-800 border border-rose-200'
                      }`}>
                        {overallScore}%
                      </div>
                    </div>
                  </div>

                  {/* Metadata Row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-[11px]">
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Repositório / Pipeline:</span>
                      <span className="font-mono text-slate-900 font-bold">{repoName}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">EU AI Act Risk Tier:</span>
                      <span className="font-mono text-slate-900 font-bold">{riskTier}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Total de Arquivos:</span>
                      <span className="text-slate-900 font-bold">{result.repo?.fileCount || 0} arquivos</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Data da Auditoria:</span>
                      <span className="text-slate-900 font-bold">{currentDate}</span>
                    </div>
                  </div>
                </div>

                {/* Section 1: Executive KPI Cards */}
                <div className="space-y-3">
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide border-b border-slate-200 pb-1">
                    1. Síntese Executiva de Riscos & Ativos de IA
                  </h2>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-xl font-black text-rose-700 block">
                        {violations.filter(v => v.severity === 'critical').length}
                      </span>
                      <span className="text-[10px] text-slate-500 uppercase font-bold">Violações Críticas</span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-xl font-black text-amber-700 block">
                        {violations.filter(v => v.severity === 'high').length}
                      </span>
                      <span className="text-[10px] text-slate-500 uppercase font-bold">Violações Altas</span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-xl font-black text-slate-900 block">{models.length}</span>
                      <span className="text-[10px] text-slate-500 uppercase font-bold">Modelos LLM</span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-xl font-black text-emerald-700 block">
                        {applicableRegs.filter(r => r.status === 'compliant').length}/13
                      </span>
                      <span className="text-[10px] text-slate-500 uppercase font-bold">Regulações Conformes</span>
                    </div>
                  </div>
                </div>

                {/* Section 2: 13 Global Regulations Table */}
                <div className="space-y-3">
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide border-b border-slate-200 pb-1">
                    2. Matriz de Conformidade Regulatória (13 Normas Globais)
                  </h2>

                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-slate-100 text-slate-700 border-b border-slate-200 uppercase text-[10px]">
                        <tr>
                          <th className="py-2.5 px-3">Regulação / Norma</th>
                          <th className="py-2.5 px-3">Autoridade</th>
                          <th className="py-2.5 px-3">Status de Conformidade</th>
                          <th className="py-2.5 px-3">Diagnóstico Técnico</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {applicableRegs.map((reg, idx) => {
                          const isCompliant = reg.status === 'compliant';
                          const isPartial = reg.status === 'partial';
                          const isNon = reg.status === 'non_compliant';

                          return (
                            <tr key={idx} className="hover:bg-slate-50 transition-colors">
                              <td className="py-2.5 px-3 font-semibold text-slate-900">
                                {reg.name}
                              </td>
                              <td className="py-2.5 px-3 text-slate-600 font-mono text-[10px]">
                                {reg.authority}
                              </td>
                              <td className="py-2.5 px-3">
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold inline-flex items-center space-x-1 border ${
                                  isCompliant ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                                  isPartial ? 'bg-amber-50 text-amber-800 border-amber-200' :
                                  isNon ? 'bg-rose-50 text-rose-800 border-rose-200' :
                                  'bg-slate-100 text-slate-700 border-slate-200'
                                }`}>
                                  <span>{isCompliant ? '✓ Conforme' : isPartial ? '⚠ Parcial' : isNon ? '✕ Não Conforme' : '⚪ N/A'}</span>
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-slate-700">
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
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide border-b border-slate-200 pb-1">
                    3. Inventário Mapeado de Modelos & Agentes
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <span className="font-bold text-slate-900 block text-[11px]">Modelos LLM Conectados:</span>
                      {models.length > 0 ? (
                        <ul className="space-y-1 text-slate-700 text-[11px]">
                          {models.map((m, i) => (
                            <li key={i} className="flex items-center justify-between font-mono">
                              <span className="text-slate-900 font-bold">▸ {m.provider} {m.modelId}</span>
                              <span className="text-slate-500 text-[10px]">{m.usage}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-slate-500 italic text-[11px]">Nenhum modelo externo identificado.</p>
                      )}
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <span className="font-bold text-slate-900 block text-[11px]">Agentes de IA & Papel de Negócio:</span>
                      {agents.length > 0 ? (
                        <div className="space-y-1.5 max-h-48 overflow-y-auto">
                          {agents.slice(0, 6).map((a, i) => {
                            const { sipoc } = getAgentBusinessAndSipoc(a);
                            return (
                              <div key={i} className="p-2 rounded bg-white border border-slate-200 text-[10px] space-y-0.5 shadow-2xs">
                                <div className="flex items-center justify-between font-mono">
                                  <span className="font-bold text-slate-900">🤖 {a.name}</span>
                                  <span className="text-slate-600 font-semibold">{a.framework || 'LangGraph'}</span>
                                </div>
                                <p className="text-slate-600 truncate">{sipoc.businessRole}</p>
                              </div>
                            );
                          })}
                        </div>
                      ) : frameworks.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {frameworks.map((f: any, i) => (
                            <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-mono text-[10px] border border-slate-200 font-bold">
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
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide border-b border-slate-200 pb-1">
                    4. Recomendações e Ações Prioritárias para Conformidade
                  </h2>

                  <div className="space-y-2">
                    {violations.slice(0, 5).map((v: any, i) => (
                      <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 font-mono text-[11px]">
                            {i + 1}. {v.rule || v.id || 'VIOLATION'}
                          </span>
                          <span className="text-[10px] text-slate-600 font-mono font-bold">
                            {v.file}:{v.line || 1}
                          </span>
                        </div>
                        <p className="text-slate-700 text-[11px]">{v.message}</p>
                        <div className="text-emerald-800 text-[10px] font-mono font-bold">
                          <strong>Ação:</strong> {v.recommendation || 'Implementar controle de mitigação'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Executive Sign-off */}
                <div className="pt-6 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Documento emitido por <strong>ComplyPRO.pt</strong> AI Regulatory Governance Platform</span>
                  <span>Homologação e Conformidade Digital</span>
                </div>

              </div>

            ) : (
              
              /* File Downloads Tab */
              <div className="max-w-2xl mx-auto space-y-4 py-6">
                <button
                  onClick={handleDownloadMarkdown}
                  className="w-full p-4 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 flex items-center justify-between text-left transition-all group cursor-pointer shadow-2xs"
                >
                  <div className="flex items-center space-x-3">
                    <FileText className="w-6 h-6 text-slate-700 group-hover:scale-110 transition-transform" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Relatório Executivo em Markdown (.MD)</h4>
                      <p className="text-[11px] text-slate-500">Documento estruturado com todas as 13 regulações, scores e tabelas</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1.5 text-xs text-slate-800 font-bold">
                    {copiedMd ? <Check className="w-4 h-4 text-emerald-600" /> : <Download className="w-4 h-4" />}
                    <span>{copiedMd ? 'Baixado!' : 'Baixar MD'}</span>
                  </div>
                </button>

                <button
                  onClick={() => setShowRipdModal(true)}
                  className="w-full p-4 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 flex items-center justify-between text-left transition-all group cursor-pointer shadow-2xs"
                >
                  <div className="flex items-center space-x-3">
                    <Scale className="w-6 h-6 text-slate-700 group-hover:scale-110 transition-transform" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Relatório de Impacto à Proteção de Dados — RIPD (.PDF / .TXT)</h4>
                      <p className="text-[11px] text-slate-500">Documento oficial exigido pelo Artigo 38 da LGPD</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1.5 text-xs text-slate-800 font-bold">
                    <ArrowUpRight className="w-4 h-4" />
                    <span>Visualizar RIPD</span>
                  </div>
                </button>

                <button
                  onClick={handleDownloadJSON}
                  className="w-full p-4 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 flex items-center justify-between text-left transition-all group cursor-pointer shadow-2xs"
                >
                  <div className="flex items-center space-x-3">
                    <FileCode className="w-6 h-6 text-slate-700 group-hover:scale-110 transition-transform" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Árvore Completa de Dados do Scanner (.JSON)</h4>
                      <p className="text-[11px] text-slate-500">Exportação técnica integral de dados para integrações e pipelines CI/CD</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1.5 text-xs text-slate-800 font-bold">
                    {copiedJson ? <Check className="w-4 h-4 text-emerald-600" /> : <Download className="w-4 h-4" />}
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
