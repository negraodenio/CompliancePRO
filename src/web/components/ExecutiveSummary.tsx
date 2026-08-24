import React, { useState } from 'react';
import { 
  ShieldAlert, ShieldCheck, AlertTriangle, Bot, Cpu, DollarSign, 
  Sparkles, FileText, CheckCircle2, XCircle, ArrowUpRight, Copy, Check, Info, Calculator, Scale, Lock, ArrowRight, Layers
} from 'lucide-react';
import type { ScannerResult } from '../../core/types';
import { generateExecutiveSummaryWithAI } from '../services/siliconflow';
import { 
  calculateRegulationScores, 
  calculateOverallScore, 
  classifySystemPurpose 
} from '../services/regulation-mapper';
import { EnterpriseLeadModal } from './EnterpriseLeadModal';

interface ExecutiveSummaryProps {
  result: ScannerResult;
}

const REGULATION_DEFINITIONS = [
  { id: 'EU_AI_ACT', name: 'EU AI Act', jurisdiction: 'União Europeia 🇪🇺', category: 'Regulação de IA', description: '', articles: [] },
  { id: 'LGPD', name: 'LGPD', jurisdiction: 'Brasil 🇧🇷', category: 'Privacidade', description: '', articles: [] },
  { id: 'GDPR', name: 'GDPR', jurisdiction: 'União Europeia 🇪🇺', category: 'Privacidade', description: '', articles: [] },
  { id: 'NIST_AI_RMF', name: 'NIST AI RMF', jurisdiction: 'Estados Unidos 🇺🇸', category: 'Framework de Risco', description: '', articles: [] },
  { id: 'ISO_42001', name: 'ISO/IEC 42001', jurisdiction: 'Internacional 🌐', category: 'Gestão de IA', description: '', articles: [] },
  { id: 'OWASP_LLM_TOP_10', name: 'OWASP Top 10 LLM', jurisdiction: 'Global 🛡️', category: 'Segurança LLM', description: '', articles: [] },
  { id: 'BCB_4893', name: 'Resolução BCB nº 4.893', jurisdiction: 'Brasil 🏦', category: 'Financeiro', description: '', articles: [] },
  { id: 'ANVISA_RDC', name: 'RDC ANVISA nº 657', jurisdiction: 'Brasil 🏥', category: 'Saúde & SaMD', description: '', articles: [] },
  { id: 'DORA', name: 'DORA', jurisdiction: 'União Europeia 🇪🇺', category: 'Resiliência TIC', description: '', articles: [] },
  { id: 'NIS2', name: 'NIS2', jurisdiction: 'União Europeia 🇪🇺', category: 'Cibersegurança', description: '', articles: [] },
  { id: 'PCI_DSS', name: 'PCI-DSS v4.0', jurisdiction: 'Pagamentos 💳', category: 'Meios de Pagamento', description: '', articles: [] },
  { id: 'CG_AG', name: 'CG-AG (12 Controles)', jurisdiction: 'Governança 📜', category: 'Controles de Agentes', description: '', articles: [] },
];

export const ExecutiveSummary: React.FC<ExecutiveSummaryProps> = ({ result }) => {
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [showFormulaModal, setShowFormulaModal] = useState(false);
  const [showEnterpriseModal, setShowEnterpriseModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const violations = result.violations || [];
  const regulationScores = calculateRegulationScores(violations, REGULATION_DEFINITIONS);

  // 1. Purpose-First EU AI Act Classification (Annex III check before code violations)
  const purpose = classifySystemPurpose(
    result.source,
    result.repo?.name || '',
    result.source?.fileTree || []
  );

  // 2. Weighted Context-Aware Overall Score (Option C)
  const { score: overallScore, formulaText, domainWeights } = calculateOverallScore(
    regulationScores,
    purpose.domain
  );

  const criticalViolations = violations.filter(v => v.severity === 'critical').length;
  const highViolations = violations.filter(v => v.severity === 'high').length;
  const agentCount = result.source?.agents?.length || 0;
  const shadowAICount = result.shadowAI?.length || 0;
  const totalViolations = violations.length;

  const getScoreColor = (score: number) => {
    if (score >= 80) return { text: 'text-emerald-700', stroke: '#059669', bg: 'bg-emerald-50', border: 'border-emerald-200' };
    if (score >= 60) return { text: 'text-amber-700', stroke: '#d97706', bg: 'bg-amber-50', border: 'border-amber-200' };
    return { text: 'text-rose-700', stroke: '#e11d48', bg: 'bg-rose-50', border: 'border-rose-200' };
  };

  const scoreTheme = getScoreColor(overallScore);

  const handleGenerateAIReport = async () => {
    setIsGeneratingReport(true);
    try {
      const report = await generateExecutiveSummaryWithAI(result);
      setAiReport(report);
    } catch (e: any) {
      alert(`Falha ao gerar parecer: ${e.message}`);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleCopyReport = () => {
    if (aiReport) {
      navigator.clipboard.writeText(aiReport);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Overall Score Circular Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center space-x-5 relative overflow-hidden">
          <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
            <svg className="w-24 h-24 transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                className="text-slate-100"
              />
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke={scoreTheme.stroke}
                strokeWidth="8"
                fill="transparent"
                strokeDasharray="251"
                strokeDashoffset={251 - (251 * overallScore) / 100}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-2xl font-black font-mono ${scoreTheme.text}`}>
                {overallScore}
              </span>
              <span className="text-[10px] text-slate-500 font-medium">/100</span>
            </div>
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">Score Geral</span>
              <button
                onClick={() => setShowFormulaModal(true)}
                className="text-[10.5px] text-slate-600 hover:text-slate-900 font-medium flex items-center space-x-0.5 cursor-pointer underline"
                title="Ver fórmula e metodologia auditável"
              >
                <Info className="w-3 h-3 text-slate-500" />
                <span>Como calculamos</span>
              </button>
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-1">Conformidade IA</h3>
            <p className="text-[11px] text-slate-600 mt-0.5">
              {overallScore >= 80 ? 'Nível Elevado de Governança' : overallScore >= 60 ? 'Requer Mitigações Pontuais' : 'Alto Risco Regulatório'}
            </p>
          </div>
        </div>

        {/* EU AI Act Risk Tier - Purpose-First Classification */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">EU AI Act</span>
            <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-md border ${
              purpose.riskTier === 'HIGH_RISK'
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}>
              {purpose.riskTier === 'HIGH_RISK' ? 'HIGH RISK (Anexo III)' : 'LIMITED RISK (Art. 50)'}
            </span>
          </div>

          <div className="mt-3">
            <div className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <ShieldAlert className={`w-5 h-5 ${purpose.riskTier === 'HIGH_RISK' ? 'text-rose-600' : 'text-amber-600'}`} />
              <span className="truncate">{purpose.riskTier === 'HIGH_RISK' ? 'Alto Risco Mandatório' : 'Risco Limitado'}</span>
            </div>
            <p className="text-[11px] text-slate-600 mt-1 line-clamp-2" title={purpose.legalJustification}>
              {purpose.legalJustification}
            </p>
          </div>
        </div>

        {/* Shadow AI Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">Shadow AI</span>
            <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-md border ${
              shadowAICount > 0
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}>
              {shadowAICount > 0 ? `${shadowAICount} Detectados` : 'Nenhum'}
            </span>
          </div>

          <div className="mt-3">
            <div className="text-xl font-bold text-slate-900 flex items-center space-x-2">
              <Bot className="w-5 h-5 text-slate-700" />
              <span>{agentCount} Agentes Mapeados</span>
            </div>
            <p className="text-[11px] text-slate-600 mt-1">
              {shadowAICount > 0 
                ? `${shadowAICount} chamadas diretas a LLMs sem governança declarada.`
                : 'Todos os pipelines de IA possuem rastreabilidade.'}
            </p>
          </div>
        </div>

        {/* Violations & AI Trigger */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">Auditoria</span>
            <span className="text-xs font-mono font-semibold text-slate-700">{totalViolations} achados ({criticalViolations} críticos)</span>
          </div>

          <div className="mt-3">
            <button
              onClick={handleGenerateAIReport}
              disabled={isGeneratingReport}
              className="w-full py-2.5 px-3 rounded-xl bg-[#0f172a] hover:bg-[#1e293b] text-white text-xs font-semibold flex items-center justify-center space-x-2 transition-all disabled:opacity-50 cursor-pointer shadow-2xs"
            >
              {isGeneratingReport ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Gerando Parecer Executivo...</span>
                </>
              ) : (
                <>
                  <FileText className="w-3.5 h-3.5 text-slate-300" />
                  <span>Gerar Parecer Executivo</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>

      {/* 🌟 Termômetro de Maturidade de Governança de IA (Framework ComplyPRO) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 font-bold">
              <Layers className="w-4 h-4 text-slate-700" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <span>Nível de Maturidade de Governança de IA</span>
                <span className="px-2 py-0.5 text-[10px] bg-slate-100 text-slate-700 border border-slate-200 rounded font-mono">
                  ISO 42001 & NIST AI RMF
                </span>
              </h3>
              <p className="text-[11px] text-slate-500">Classificação da postura corporativa de conformidade e gestão de ciclo de vida</p>
            </div>
          </div>

          <span className="text-[11px] font-mono text-slate-800 bg-slate-100 border border-slate-200 px-3 py-1 rounded-lg">
            Diagnóstico Atual: <strong>NÍVEL 2 (EMERGENTE)</strong>
          </span>
        </div>

        {/* 5 Levels Step Progress Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 text-xs">
          
          {/* Level 1 */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 opacity-60 space-y-1">
            <span className="text-[10px] font-mono text-slate-500 block uppercase font-bold">Nível 1</span>
            <span className="font-bold text-slate-700 block text-[11px]">Ad-Hoc / Não Gerenciado</span>
            <p className="text-[10px] text-slate-500">Shadow AI dispersa e sem controle de chaves ou logs.</p>
          </div>

          {/* Level 2 (ACTIVE) */}
          <div className="p-3.5 rounded-xl bg-slate-900 text-white border-2 border-slate-900 shadow-sm space-y-1 relative">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-300 block uppercase font-bold">Nível 2</span>
              <span className="px-1.5 py-0.2 bg-white text-slate-900 text-[9px] font-black rounded uppercase">Atual</span>
            </div>
            <span className="font-bold text-white block text-[11px]">Emergente / Mapeamento Estático</span>
            <p className="text-[10px] text-slate-300">Auditoria de código, detecção de 13 regulações e matriz SIPOC.</p>
          </div>

          {/* Level 3 */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[10px] font-mono text-slate-600 block uppercase font-bold">Nível 3</span>
            <span className="font-bold text-slate-800 block text-[11px]">Definido & Estruturado</span>
            <p className="text-[10px] text-slate-500">Process Owners e esteira RACI homologados formalmente.</p>
          </div>

          {/* Level 4 */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[10px] font-mono text-slate-600 block uppercase font-bold">Nível 4</span>
            <span className="font-bold text-slate-800 block text-[11px]">Quantitativamente Gerenciado</span>
            <p className="text-[10px] text-slate-500">SLAs de inferência, FinOps ativo e circuit breaker de loops.</p>
          </div>

          {/* Level 5 */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[10px] font-mono text-slate-600 block uppercase font-bold">Nível 5</span>
            <span className="font-bold text-slate-800 block text-[11px]">Otimização Contínua</span>
            <p className="text-[10px] text-slate-500">Auto-remediação de guardrails e relatórios automáticos ao Board.</p>
          </div>

        </div>

        {/* 🔒 Blurred Enterprise Evolution Roadmap (Teaser) */}
        <div className="relative rounded-xl border border-slate-200 bg-slate-50 overflow-hidden p-4 group">
          {/* Blurred Content */}
          <div className="filter blur-[3.5px] select-none pointer-events-none opacity-40 space-y-2 text-xs text-slate-700">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-white border border-slate-200">
                <span className="font-bold block text-slate-900">Controle de Deriva (Model Drift Engine)</span>
                <span className="text-slate-600">Alerta automático de alucinação de agentes em tempo real</span>
              </div>
              <div className="p-3 rounded-lg bg-white border border-slate-200">
                <span className="font-bold block text-slate-900">Approval Gate CI/CD</span>
                <span className="text-slate-600">Bloqueio mandatório de merges que violem o Anexo III do EU AI Act</span>
              </div>
              <div className="p-3 rounded-lg bg-white border border-slate-200">
                <span className="font-bold block text-slate-900">Notificação de Incidentes à ANPD</span>
                <span className="text-slate-600">Workflow automatizado de geração de relatório em 72 horas</span>
              </div>
            </div>
          </div>

          {/* Floating Action Overlay with Lock */}
          <div className="absolute inset-0 bg-slate-900/85 backdrop-blur-[2px] flex flex-col sm:flex-row items-center justify-between p-5 gap-3">
            <div className="flex items-center space-x-3 text-left">
              <div className="p-2 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 shrink-0">
                <Lock className="w-4 h-4 text-slate-300" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">
                  Evolução para Nível 4 & 5 de Governança Contínua (Enterprise)
                </h4>
                <p className="text-[11px] text-slate-300">
                  Desbloqueie guardrails em tempo real, bloqueio em pipeline de CI/CD e dossiê contínuo para auditorias ANPD e EU.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setAiReport(null);
                setShowEnterpriseModal(true);
              }}
              className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold flex items-center space-x-2 shadow-sm transition-all shrink-0 cursor-pointer"
            >
              <span>Conhecer Módulo Enterprise</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

      {/* Enterprise Lead Capture Modal */}
      {showEnterpriseModal && (
        <EnterpriseLeadModal onClose={() => setShowEnterpriseModal(false)} featureContext="Roadmap de Maturidade de Governança de IA (Nível 4 e 5)" />
      )}

      {/* Formula & Calculation Modal */}
      {showFormulaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="glass-panel w-full max-w-2xl bg-[#0c101d] border border-cyan-500/40 rounded-2xl p-6 sm:p-7 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
            
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-surface-border">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-black font-bold">
                  <Calculator className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Metodologia Auditável de Pontuação</h3>
                  <p className="text-[11px] text-slate-400">Transparência matemática para CISOs, DPOs e Auditores</p>
                </div>
              </div>
              <button
                onClick={() => setShowFormulaModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-5 text-xs text-slate-300 leading-relaxed font-sans">
              
              {/* Section 1: Score por Regulação */}
              <div className="p-4 rounded-xl bg-[#080d1a] border border-surface-border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-cyan-300 text-sm">1. Score por Regulação — Base 100</span>
                  <span className="px-2 py-0.5 text-[10px] font-mono bg-cyan-950 text-cyan-300 rounded border border-cyan-800">
                    Por Norma
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Cada regulação aplicável começa com <strong>100 pontos</strong>. Cada violação identificada é subtraída de acordo com a sua gravidade técnica e jurídica:
                </p>
                
                <div className="p-3 rounded-lg bg-[#050811] font-mono text-[11px] text-cyan-300 border border-slate-800 text-center font-bold">
                  Score = max(0, 100 − (Crítica × 25) − (Alta × 14) − (Média × 7) − (Baixa × 3))
                </div>

                {/* Table of Penalties */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono text-center">
                  <div className="p-2 rounded-lg bg-rose-950/60 text-rose-300 border border-rose-800/80">
                    <span className="block font-bold">🔴 Crítica</span>
                    <span>−25 pontos</span>
                  </div>
                  <div className="p-2 rounded-lg bg-orange-950/60 text-orange-300 border border-orange-800/80">
                    <span className="block font-bold">🟠 Alta</span>
                    <span>−14 pontos</span>
                  </div>
                  <div className="p-2 rounded-lg bg-amber-950/60 text-amber-300 border border-amber-800/80">
                    <span className="block font-bold">🟡 Média</span>
                    <span>−7 pontos</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-850 bg-slate-900 text-slate-300 border border-slate-750 border-slate-700">
                    <span className="block font-bold">🔵 Baixa</span>
                    <span>−3 pontos</span>
                  </div>
                </div>

                {/* Concrete Worked Example */}
                <div className="p-3 rounded-lg bg-[#060a14] border border-slate-800/70 space-y-1.5 text-[11px]">
                  <span className="font-bold text-slate-200 block">Exemplo Prático de Auditoria:</span>
                  <p className="text-slate-400">
                    Se uma regulação apresentar <strong>1 Crítica</strong>, <strong>2 Altas</strong>, <strong>1 Média</strong> e <strong>2 Baixas</strong>:
                  </p>
                  <div className="font-mono text-cyan-300 bg-[#090e1c] p-2 rounded border border-slate-800">
                    Score = 100 − (1 × 25) − (2 × 14) − (1 × 7) − (2 × 3)<br/>
                    Score = 100 − 25 − 28 − 7 − 6 = <strong>34/100</strong>
                  </div>
                  <p className="text-emerald-400 text-[10px] italic">
                    ✓ Regulações sem violações mantêm automaticamente: 100 − 0 − 0 − 0 − 0 = <strong>100/100</strong>.
                  </p>
                </div>
              </div>

              {/* Section 2: Score Geral Ponderado */}
              <div className="p-4 rounded-xl bg-[#080d1a] border border-surface-border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-purple-300 text-sm">2. Score Geral Ponderado pelo Contexto do Negócio</span>
                  <span className="px-2 py-0.5 text-[10px] font-mono bg-purple-950 text-purple-300 rounded border border-purple-800">
                    Ponderação de Risco
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">
                  O score geral consolida todas as normas atribuindo pesos contextuais ao domínio de aplicação do sistema:
                </p>

                <div className="p-3 rounded-lg bg-[#050811] font-mono text-[11px] text-purple-300 border border-slate-800 text-center font-bold">
                  Score Geral = Σ(Score_Regulação × Peso) / Σ(Peso)
                </div>

                {/* Finance Domain Worked Example Table */}
                <div className="overflow-x-auto rounded-lg border border-slate-800">
                  <table className="w-full text-left text-[11px] font-mono">
                    <thead className="bg-[#0c1224] text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="py-2 px-3">Regulação</th>
                        <th className="py-2 px-3 text-center">Score</th>
                        <th className="py-2 px-3 text-center">Peso</th>
                        <th className="py-2 px-3 text-right">Score × Peso</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 bg-[#060a14] text-slate-300">
                      <tr>
                        <td className="py-1.5 px-3 font-semibold text-white">EU AI Act</td>
                        <td className="py-1.5 px-3 text-center">70</td>
                        <td className="py-1.5 px-3 text-center">3</td>
                        <td className="py-1.5 px-3 text-right text-cyan-300">210</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 px-3 font-semibold text-white">Res. BCB nº 4.893</td>
                        <td className="py-1.5 px-3 text-center">80</td>
                        <td className="py-1.5 px-3 text-center">3</td>
                        <td className="py-1.5 px-3 text-right text-cyan-300">240</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 px-3 font-semibold text-white">GDPR / LGPD</td>
                        <td className="py-1.5 px-3 text-center">90</td>
                        <td className="py-1.5 px-3 text-center">2</td>
                        <td className="py-1.5 px-3 text-right text-cyan-300">180</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 px-3 font-semibold text-white">ISO/IEC 42001</td>
                        <td className="py-1.5 px-3 text-center">95</td>
                        <td className="py-1.5 px-3 text-center">1</td>
                        <td className="py-1.5 px-3 text-right text-cyan-300">95</td>
                      </tr>
                    </tbody>
                    <tfoot className="bg-[#0c1224] text-white font-bold border-t border-slate-800">
                      <tr>
                        <td className="py-2 px-3">Cálculo Consolidado</td>
                        <td colSpan={2} className="py-2 px-3 text-center text-slate-400">725 / 9 pesos</td>
                        <td className="py-2 px-3 text-right text-emerald-400">= 80,6 / 100</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Legal Audit-proof Disclaimer */}
                <div className="p-3 rounded-lg bg-purple-950/20 border border-purple-900/40 text-[11px] text-purple-200">
                  <strong>Nota de Conformidade Jurídica:</strong> Os pesos representam <em>relevância contextual para priorização de controles operacionais</em>, não uma afirmação de que uma legislação é hierarquicamente superior a outra.
                </div>
              </div>

              {/* Section 3: Classificação Regulatória por Finalidade */}
              <div className="p-4 rounded-xl bg-[#080d1a] border border-surface-border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-rose-300 text-sm">3. Classificação Regulatória por Finalidade (Anexo III)</span>
                  <span className="px-2 py-0.5 text-[10px] font-mono bg-rose-950 text-rose-300 rounded border border-rose-800">
                    EU AI Act Art. 6
                  </span>
                </div>

                <p className="text-[11px] text-slate-300">
                  A pontuação técnica de código e a classificação regulatória de risco são <strong>dimensões distintas</strong>:
                </p>

                <div className="p-3 rounded-lg bg-[#060a14] border border-slate-800 space-y-2 text-[11px]">
                  <div className="text-center font-bold text-amber-300 py-1 border-b border-slate-800 font-mono">
                    Código 100% Seguro ≠ Sistema Automaticamente Desregulado
                  </div>

                  <p className="text-slate-400 leading-relaxed">
                    Determinados sistemas utilizados para avaliar a solvabilidade de pessoas singulares (crédito), triagem de candidatos em RH ou apoio ao diagnóstico clínico enquadram-se como <strong>HIGH-RISK</strong> por exigência mandatória do Anexo III do EU AI Act, independentemente de o código estar limpo.
                  </p>

                  <div className="grid grid-cols-2 gap-2 font-mono text-[10px] pt-1">
                    <div className="p-2 rounded bg-[#090e1c] border border-slate-800 space-y-0.5">
                      <span className="text-slate-400 block">Classificação Regulatória:</span>
                      <strong className="text-rose-400">Responde a "Que obrigações legais se aplicam?"</strong>
                    </div>
                    <div className="p-2 rounded bg-[#090e1c] border border-slate-800 space-y-0.5">
                      <span className="text-slate-400 block">Score de Conformidade:</span>
                      <strong className="text-emerald-400">Responde a "Quão bem o sistema as cumpre?"</strong>
                    </div>
                  </div>
                </div>

                <p className="text-[10px] text-slate-400 italic">
                  Essa separação metodológica permite que CISOs, DPOs e auditores externos distingam claramente <strong>classificação regulatória mandatória</strong>, <strong>exposição a risco</strong> e <strong>nível técnico de conformidade</strong>.
                </p>
              </div>

            </div>

            {/* Footer */}
            <div className="pt-2 flex items-center justify-between border-t border-surface-border">
              <span className="text-[11px] text-slate-400">
                Padrão de auditoria adotado por ComplyPRO.pt
              </span>
              <button
                onClick={() => setShowFormulaModal(false)}
                className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black rounded-xl text-xs font-bold shadow-glow transition-all cursor-pointer"
              >
                Entendi e Concordo
              </button>
            </div>

          </div>
        </div>
      )}

      {/* AI Generated Executive Report Panel */}
      {aiReport && (
        <div className="glass-panel p-6 rounded-2xl border border-purple-500/40 bg-[#0e1222] shadow-2xl relative animate-in fade-in duration-300">
          <div className="flex items-center justify-between pb-4 border-b border-surface-border">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-lg bg-purple-950/80 border border-purple-800/80 text-purple-300">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Parecer Executivo de Governança & Conformidade</h4>
                <p className="text-[11px] text-slate-400">Análise jurídica e técnica consolidada</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleCopyReport}
                className="px-3 py-1.5 rounded-lg bg-surface border border-surface-border text-xs text-slate-300 hover:text-white transition-colors flex items-center space-x-1.5 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copiado!' : 'Copiar'}</span>
              </button>
              <button
                onClick={() => setAiReport(null)}
                className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1 cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>

          <div className="mt-4 prose prose-invert max-w-none text-xs leading-relaxed text-slate-300 whitespace-pre-wrap font-sans">
            {aiReport}
          </div>
        </div>
      )}
    </div>
  );
};
