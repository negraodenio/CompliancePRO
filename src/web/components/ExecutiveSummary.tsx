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
import { calculateMaturityLevel } from '../services/maturity-calculator';
import { EnterpriseLeadModal } from './EnterpriseLeadModal';
import { OrganizationalAssessmentModal } from './OrganizationalAssessmentModal';

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
  const [showMaturityFormulaModal, setShowMaturityFormulaModal] = useState(false);
  const [showEnterpriseModal, setShowEnterpriseModal] = useState(false);
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
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

  // 3. Dynamic ISO 42001 & NIST AI RMF Maturity Level
  const maturity = calculateMaturityLevel(result);

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
        <div className="bg-white dark:bg-[#111827] p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex items-center space-x-5 relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-emerald-500" />
          <div className="relative w-22 h-22 flex items-center justify-center shrink-0">
            <svg className="w-22 h-22 transform -rotate-90">
              <circle
                cx="44"
                cy="44"
                r="36"
                stroke="currentColor"
                strokeWidth="7"
                fill="transparent"
                className="text-slate-100"
              />
              <circle
                cx="44"
                cy="44"
                r="36"
                stroke={scoreTheme.stroke}
                strokeWidth="7"
                fill="transparent"
                strokeDasharray="226"
                strokeDashoffset={226 - (226 * overallScore) / 100}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-2xl font-black font-mono ${scoreTheme.text}`}>
                {overallScore}
              </span>
              <span className="text-[9.5px] text-slate-500 font-bold uppercase tracking-wider">/ 100</span>
            </div>
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider font-mono">Score Geral</span>
              <button
                onClick={() => setShowFormulaModal(true)}
                className="text-[10.5px] text-blue-600 hover:text-blue-800 font-semibold flex items-center space-x-0.5 cursor-pointer underline"
                title="Ver fórmula e metodologia auditável"
              >
                <Info className="w-3 h-3 text-blue-500" />
                <span>Como calculamos</span>
              </button>
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-1">Conformidade IA</h3>
            <div className="mt-1">
              <span className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded border ${scoreTheme.bg} ${scoreTheme.text} ${scoreTheme.border}`}>
                {overallScore >= 80 ? 'Nível Elevado de Governança' : overallScore >= 60 ? 'Requer Mitigações' : 'Alto Risco Regulatório'}
              </span>
            </div>
          </div>
        </div>

        {/* EU AI Act Risk Tier - Purpose-First Classification */}
        <div className="bg-white dark:bg-[#111827] p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden">
          <div className={`absolute top-0 left-0 right-0 h-1 ${purpose.riskTier === 'HIGH_RISK' ? 'bg-rose-500' : 'bg-amber-500'}`} />
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider font-mono">EU AI Act</span>
            <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-md border ${
              purpose.riskTier === 'HIGH_RISK'
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}>
              {purpose.riskTier === 'HIGH_RISK' ? 'HIGH RISK (Anexo III)' : 'LIMITED RISK (Art. 50)'}
            </span>
          </div>

          <div className="mt-3">
            <div className="flex items-center space-x-2.5">
              <div className={`p-2 rounded-xl border shrink-0 ${purpose.riskTier === 'HIGH_RISK' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <span className="text-sm font-bold text-slate-900 block truncate">
                  {purpose.riskTier === 'HIGH_RISK' ? 'Alto Risco Mandatório' : 'Risco Limitado'}
                </span>
                <span className="text-[10.5px] text-slate-500 font-mono">Art. 6 & Anexo III</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-600 mt-2 line-clamp-2" title={purpose.legalJustification}>
              {purpose.legalJustification}
            </p>
          </div>
        </div>

        {/* Shadow AI Card */}
        <div className="bg-white dark:bg-[#111827] p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-purple-500" />
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider font-mono">Shadow AI & Agentes</span>
            <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-md border ${
              shadowAICount > 0
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}>
              {shadowAICount > 0 ? `${shadowAICount} Detectados` : 'Nenhum'}
            </span>
          </div>

          <div className="mt-3">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <span className="text-sm font-bold text-slate-900 block font-mono">
                  {agentCount} Agentes Mapeados
                </span>
                <span className="text-[10.5px] text-purple-700 font-medium font-mono">
                  {shadowAICount > 0 ? `${shadowAICount} Shadow LLMs` : '100% Rastreável'}
                </span>
              </div>
            </div>
            <p className="text-[11px] text-slate-600 mt-2 line-clamp-2">
              {shadowAICount > 0 
                ? `${shadowAICount} chamadas diretas a LLMs sem governança declarada.`
                : 'Todos os pipelines de IA possuem custódia e rastreabilidade.'}
            </p>
          </div>
        </div>

        {/* Violations & AI Trigger */}
        <div className="bg-white dark:bg-[#111827] p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-indigo-600" />
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider font-mono">Auditoria & IA</span>
            <span className="text-xs font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800">
              {totalViolations} achados ({criticalViolations} críticos)
            </span>
          </div>

          <div className="mt-3 space-y-2">
            <button
              onClick={handleGenerateAIReport}
              disabled={isGeneratingReport}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 hover:from-blue-800 hover:to-slate-950 text-white text-xs font-bold flex items-center justify-center space-x-2 transition-all disabled:opacity-50 cursor-pointer shadow-sm hover:shadow-blue-500/20 active:scale-[0.99]"
            >
              {isGeneratingReport ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Gerando Parecer Executivo...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-blue-200" />
                  <span>Gerar Parecer Executivo IA</span>
                </>
              )}
            </button>
            <p className="text-[10.5px] text-slate-500 text-center">
              Consolidação jurídica para DPOs e CISOs
            </p>
          </div>
        </div>

      </div>

      {/* 🌟 Termômetro de Maturidade de Governança de IA (Framework ComplyPRO) */}
      <div className="bg-white dark:bg-[#111827] p-6 rounded-2xl border border-slate-200 space-y-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 font-bold">
              <Layers className="w-4 h-4 text-slate-700 dark:text-slate-300" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <span>Modelo de Maturidade ComplyPRO</span>
                <span className="px-2 py-0.5 text-[10px] bg-slate-100 text-slate-700 border border-slate-200 rounded font-mono">
                  Alinhado a CMMI, ISO 42001 & NIST AI RMF
                </span>
              </h3>
              <p className="text-[11px] text-slate-500">
                {maturity.rationale}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => setShowMaturityFormulaModal(true)}
              className="text-[10.5px] text-slate-600 hover:text-slate-900 font-medium flex items-center space-x-0.5 cursor-pointer underline mr-1"
              title="Ver metodologia e critérios do Modelo de Maturidade ComplyPRO"
            >
              <Info className="w-3 h-3 text-slate-500" />
              <span>Como calculamos</span>
            </button>
            <button
              onClick={() => setShowAssessmentModal(true)}
              className="px-3 py-1 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg flex items-center space-x-1.5 cursor-pointer shadow-2xs transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>Avaliação de Processos (Opcional)</span>
            </button>
            <span className="text-[11px] font-mono text-slate-900 bg-slate-100 border border-slate-300 px-3 py-1 rounded-lg font-bold">
              Diagnóstico: {maturity.badge}
            </span>
          </div>
        </div>

        {/* 5 Levels Step Progress Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 text-xs">
          
          {/* Level 1 */}
          <div className={`p-3.5 rounded-xl transition-all ${
            maturity.level === 1
              ? 'bg-slate-900 text-white border-2 border-slate-900 shadow-sm relative'
              : 'bg-slate-50 border border-slate-200 opacity-70'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-mono uppercase font-bold ${maturity.level === 1 ? 'text-slate-300' : 'text-slate-500'}`}>Nível 1</span>
              {maturity.level === 1 && <span className="px-1.5 py-0.2 bg-white text-slate-900 text-[9px] font-black rounded uppercase">Atual</span>}
            </div>
            <span className={`font-bold block text-[11px] mt-1 ${maturity.level === 1 ? 'text-white' : 'text-slate-800'}`}>Ad-Hoc / Não Gerenciado</span>
            <p className={`text-[10px] mt-1 ${maturity.level === 1 ? 'text-slate-300' : 'text-slate-500'}`}>Práticas informais, Shadow AI ou chaves expostas em código.</p>
          </div>

          {/* Level 2 */}
          <div className={`p-3.5 rounded-xl transition-all ${
            maturity.level === 2
              ? 'bg-slate-900 text-white border-2 border-slate-900 shadow-sm relative'
              : 'bg-slate-50 border border-slate-200 opacity-70'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-mono uppercase font-bold ${maturity.level === 2 ? 'text-slate-300' : 'text-slate-500'}`}>Nível 2</span>
              {maturity.level === 2 && <span className="px-1.5 py-0.2 bg-white text-slate-900 text-[9px] font-black rounded uppercase">Atual</span>}
            </div>
            <span className={`font-bold block text-[11px] mt-1 ${maturity.level === 2 ? 'text-white' : 'text-slate-800'}`}>Emergente / Identificação</span>
            <p className={`text-[10px] mt-1 ${maturity.level === 2 ? 'text-slate-300' : 'text-slate-500'}`}>Mapeamento inicial de agentes, prompts e modelos (NIST MAP).</p>
          </div>

          {/* Level 3 */}
          <div className={`p-3.5 rounded-xl transition-all ${
            maturity.level === 3
              ? 'bg-slate-900 text-white border-2 border-slate-900 shadow-sm relative'
              : 'bg-slate-50 border border-slate-200 opacity-70'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-mono uppercase font-bold ${maturity.level === 3 ? 'text-slate-300' : 'text-slate-500'}`}>Nível 3</span>
              {maturity.level === 3 && <span className="px-1.5 py-0.2 bg-white text-slate-900 text-[9px] font-black rounded uppercase">Atual</span>}
            </div>
            <span className={`font-bold block text-[11px] mt-1 ${maturity.level === 3 ? 'text-white' : 'text-slate-800'}`}>Estruturado / Controles</span>
            <p className={`text-[10px] mt-1 ${maturity.level === 3 ? 'text-slate-300' : 'text-slate-500'}`}>Guardrails de prompt, quality gates e controles repetíveis no CI/CD.</p>
          </div>

          {/* Level 4 */}
          <div className={`p-3.5 rounded-xl transition-all ${
            maturity.level === 4
              ? 'bg-slate-900 text-white border-2 border-slate-900 shadow-sm relative'
              : 'bg-slate-50 border border-slate-200 opacity-70'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-mono uppercase font-bold ${maturity.level === 4 ? 'text-slate-300' : 'text-slate-500'}`}>Nível 4</span>
              {maturity.level === 4 && <span className="px-1.5 py-0.2 bg-white text-slate-900 text-[9px] font-black rounded uppercase">Atual</span>}
            </div>
            <span className={`font-bold block text-[11px] mt-1 ${maturity.level === 4 ? 'text-white' : 'text-slate-800'}`}>Gerenciado & Quantificado</span>
            <p className={`text-[10px] mt-1 ${maturity.level === 4 ? 'text-slate-300' : 'text-slate-500'}`}>HITL formalizado, RACI, métricas e rastreabilidade (NIST MEASURE).</p>
          </div>

          {/* Level 5 */}
          <div className={`p-3.5 rounded-xl transition-all ${
            maturity.level === 5
              ? 'bg-slate-900 text-white border-2 border-slate-900 shadow-sm relative'
              : 'bg-slate-50 border border-slate-200 opacity-70'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-mono uppercase font-bold ${maturity.level === 5 ? 'text-slate-300' : 'text-slate-500'}`}>Nível 5</span>
              {maturity.level === 5 && <span className="px-1.5 py-0.2 bg-white text-slate-900 text-[9px] font-black rounded uppercase">Atual</span>}
            </div>
            <span className={`font-bold block text-[11px] mt-1 ${maturity.level === 5 ? 'text-white' : 'text-slate-800'}`}>Otimizado & Melhoria Contínua</span>
            <p className={`text-[10px] mt-1 ${maturity.level === 5 ? 'text-slate-300' : 'text-slate-500'}`}>Sistema contínuo de gestão, auditoria e feedback (CMMI Optimizing).</p>
          </div>

        </div>

        {/* 🔒 Blurred Enterprise Evolution Roadmap (Teaser) */}
        <div className="relative rounded-xl border border-slate-200 bg-slate-50 overflow-hidden p-4 group">
          {/* Blurred Content */}
          <div className="filter blur-[3.5px] select-none pointer-events-none opacity-40 space-y-2 text-xs text-slate-700 dark:text-slate-300">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-white border border-slate-200 dark:border-slate-800">
                <span className="font-bold block text-slate-900 dark:text-slate-100">Controle de Deriva (Model Drift Engine)</span>
                <span className="text-slate-600 dark:text-slate-400">Alerta automático de alucinação de agentes em tempo real</span>
              </div>
              <div className="p-3 rounded-lg bg-white border border-slate-200 dark:border-slate-800">
                <span className="font-bold block text-slate-900 dark:text-slate-100">Approval Gate CI/CD</span>
                <span className="text-slate-600 dark:text-slate-400">Bloqueio mandatório de merges que violem o Anexo III do EU AI Act</span>
              </div>
              <div className="p-3 rounded-lg bg-white border border-slate-200 dark:border-slate-800">
                <span className="font-bold block text-slate-900 dark:text-slate-100">Notificação de Incidentes à ANPD</span>
                <span className="text-slate-600 dark:text-slate-400">Workflow automatizado de geração de relatório em 72 horas</span>
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

      {/* Optional Organizational Assessment Modal (ISO 42001 & EU AI Act) */}
      {showAssessmentModal && (
        <OrganizationalAssessmentModal result={result} onClose={() => setShowAssessmentModal(false)} />
      )}

      {/* Formula & Calculation Modal */}
      {showFormulaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
            
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-slate-100 text-slate-800 border border-slate-200 font-bold">
                  <Calculator className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Metodologia Auditável de Pontuação</h3>
                  <p className="text-[11px] text-slate-500">Transparência matemática para CISOs, DPOs e Auditores</p>
                </div>
              </div>
              <button
                onClick={() => setShowFormulaModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-5 text-xs text-slate-700 leading-relaxed font-sans">
              
              {/* Section 1: Score por Regulação */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">1. Score por Regulação — Base 100</span>
                  <span className="px-2 py-0.5 text-[10px] font-mono bg-white text-slate-700 font-bold rounded border border-slate-200 dark:border-slate-800">
                    Por Norma
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  Cada regulação aplicável começa com <strong>100 pontos</strong>. Cada violação identificada é subtraída de acordo com a sua gravidade técnica e jurídica:
                </p>
                
                <div className="p-3 rounded-lg bg-white font-mono text-[11px] text-slate-900 border border-slate-200 text-center font-bold">
                  Score = max(0, 100 − (Crítica × 25) − (Alta × 14) − (Média × 7) − (Baixa × 3))
                </div>

                {/* Table of Penalties */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono text-center">
                  <div className="p-2 rounded-lg bg-rose-50 text-rose-800 border border-rose-200">
                    <span className="block font-bold">Crítica</span>
                    <span>−25 pontos</span>
                  </div>
                  <div className="p-2 rounded-lg bg-orange-50 text-orange-800 border border-orange-200">
                    <span className="block font-bold">Alta</span>
                    <span>−14 pontos</span>
                  </div>
                  <div className="p-2 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
                    <span className="block font-bold">Média</span>
                    <span>−7 pontos</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 dark:border-slate-800">
                    <span className="block font-bold">Baixa</span>
                    <span>−3 pontos</span>
                  </div>
                </div>

                {/* Concrete Worked Example */}
                <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-1.5 text-[11px]">
                  <span className="font-bold text-slate-900 block">Exemplo Prático de Auditoria:</span>
                  <p className="text-slate-600 dark:text-slate-400">
                    Se uma regulação apresentar <strong>1 Crítica</strong>, <strong>2 Altas</strong>, <strong>1 Média</strong> e <strong>2 Baixas</strong>:
                  </p>
                  <div className="font-mono text-slate-900 bg-slate-50 p-2 rounded border border-slate-200 dark:border-slate-800">
                    Score = 100 − (1 × 25) − (2 × 14) − (1 × 7) − (2 × 3)<br/>
                    Score = 100 − 25 − 28 − 7 − 6 = <strong>34/100</strong>
                  </div>
                  <p className="text-emerald-700 text-[10px] italic font-semibold">
                    ✓ Regulações sem violações mantêm automaticamente: 100 − 0 − 0 − 0 − 0 = <strong>100/100</strong>.
                  </p>
                </div>
              </div>

              {/* Section 2: Score Geral Ponderado */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">2. Score Geral Ponderado pelo Contexto do Negócio</span>
                  <span className="px-2 py-0.5 text-[10px] font-mono bg-white text-slate-700 font-bold rounded border border-slate-200 dark:border-slate-800">
                    Ponderação de Risco
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  O score geral consolida todas as normas atribuindo pesos contextuais ao domínio de aplicação do sistema:
                </p>

                <div className="p-3 rounded-lg bg-white font-mono text-[11px] text-slate-900 border border-slate-200 text-center font-bold">
                  Score Geral = Σ(Score_Regulação × Peso) / Σ(Peso)
                </div>

                {/* Finance Domain Worked Example Table */}
                <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left text-[11px] font-mono">
                    <thead className="bg-slate-100 text-slate-700 border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="py-2 px-3">Regulação</th>
                        <th className="py-2 px-3 text-center">Score</th>
                        <th className="py-2 px-3 text-center">Peso</th>
                        <th className="py-2 px-3 text-right">Score × Peso</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white text-slate-700 dark:text-slate-300">
                      <tr>
                        <td className="py-1.5 px-3 font-semibold text-slate-900 dark:text-slate-100">EU AI Act</td>
                        <td className="py-1.5 px-3 text-center">70</td>
                        <td className="py-1.5 px-3 text-center">3</td>
                        <td className="py-1.5 px-3 text-right text-slate-900 font-bold">210</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 px-3 font-semibold text-slate-900 dark:text-slate-100">Res. BCB nº 4.893</td>
                        <td className="py-1.5 px-3 text-center">80</td>
                        <td className="py-1.5 px-3 text-center">3</td>
                        <td className="py-1.5 px-3 text-right text-slate-900 font-bold">240</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 px-3 font-semibold text-slate-900 dark:text-slate-100">GDPR / LGPD</td>
                        <td className="py-1.5 px-3 text-center">90</td>
                        <td className="py-1.5 px-3 text-center">2</td>
                        <td className="py-1.5 px-3 text-right text-slate-900 font-bold">180</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 px-3 font-semibold text-slate-900 dark:text-slate-100">ISO/IEC 42001</td>
                        <td className="py-1.5 px-3 text-center">95</td>
                        <td className="py-1.5 px-3 text-center">1</td>
                        <td className="py-1.5 px-3 text-right text-slate-900 font-bold">95</td>
                      </tr>
                    </tbody>
                    <tfoot className="bg-slate-100 text-slate-900 font-bold border-t border-slate-200 dark:border-slate-800">
                      <tr>
                        <td className="py-2 px-3">Cálculo Consolidado</td>
                        <td colSpan={2} className="py-2 px-3 text-center text-slate-600 dark:text-slate-400">725 / 9 pesos</td>
                        <td className="py-2 px-3 text-right text-emerald-800 font-bold">= 80,6 / 100</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Legal Audit-proof Disclaimer */}
                <div className="p-3 rounded-lg bg-white border border-slate-200 text-[11px] text-slate-700 dark:text-slate-300">
                  <strong>Nota de Conformidade Jurídica:</strong> Os pesos representam <em>relevância contextual para priorização de controles operacionais</em>, não uma afirmação de que uma legislação é hierarquicamente superior a outra.
                </div>
              </div>

              {/* Section 3: Classificação Regulatória por Finalidade */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">3. Classificação Regulatória por Finalidade (Anexo III)</span>
                  <span className="px-2 py-0.5 text-[10px] font-mono bg-rose-50 text-rose-800 font-bold rounded border border-rose-200">
                    EU AI Act Art. 6
                  </span>
                </div>

                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  A pontuação técnica de código e a classificação regulatória de risco são <strong>dimensões distintas</strong>:
                </p>

                <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-2 text-[11px]">
                  <div className="text-center font-bold text-slate-900 py-1 border-b border-slate-100 font-mono">
                    Código 100% Seguro ≠ Sistema Automaticamente Desregulado
                  </div>

                  <p className="text-slate-600 leading-relaxed">
                    Determinados sistemas utilizados para avaliar a solvabilidade de pessoas singulares (crédito), triagem de candidatos em RH ou apoio ao diagnóstico clínico enquadram-se como <strong>HIGH-RISK</strong> por exigência mandatória do Anexo III do EU AI Act, independentemente de o código estar limpo.
                  </p>

                  <div className="grid grid-cols-2 gap-2 font-mono text-[10px] pt-1">
                    <div className="p-2 rounded bg-slate-50 border border-slate-200 space-y-0.5">
                      <span className="text-slate-500 block">Classificação Regulatória:</span>
                      <strong className="text-rose-800">Responde a "Que obrigações legais se aplicam?"</strong>
                    </div>
                    <div className="p-2 rounded bg-slate-50 border border-slate-200 space-y-0.5">
                      <span className="text-slate-500 block">Score de Conformidade:</span>
                      <strong className="text-emerald-800">Responde a "Quão bem o sistema as cumpre?"</strong>
                    </div>
                  </div>
                </div>

                <p className="text-[10px] text-slate-500 italic">
                  Essa separação metodológica permite que CISOs, DPOs e auditores externos distingam claramente <strong>classificação regulatória mandatória</strong>, <strong>exposição a risco</strong> e <strong>nível técnico de conformidade</strong>.
                </p>
              </div>

            </div>

            {/* Footer */}
            <div className="pt-2 flex items-center justify-between border-t border-slate-200 dark:border-slate-800">
              <span className="text-[11px] text-slate-500">
                Padrão de auditoria adotado por ComplyPRO.pt
              </span>
              <button
                onClick={() => setShowFormulaModal(false)}
                className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                Entendi e Concordo
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Maturity Level Methodology Modal */}
      {showMaturityFormulaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-3xl bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto">
            
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-slate-100 text-slate-800 border border-slate-200 font-bold">
                  <Layers className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Como Calculamos o Nível de Maturidade</h3>
                  <p className="text-[11px] text-slate-500">Modelo de Maturidade ComplyPRO alinhado a ISO/IEC 42001, CMMI e NIST AI RMF</p>
                </div>
              </div>
              <button
                onClick={() => setShowMaturityFormulaModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6 text-xs text-slate-700 leading-relaxed font-sans">
              
              {/* Section 1: Avaliação Baseada em Evidências */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <span className="font-bold text-slate-900 text-sm block">1. Avaliação Baseada em Evidências</span>
                <p className="text-slate-600 text-[11px]">
                  O ComplyPRO utiliza um <strong>modelo de maturidade próprio</strong>, baseado em evidências técnicas e organizacionais, para avaliar o nível de desenvolvimento da governança de IA.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div className="space-y-1">
                    <span className="font-bold text-slate-800 block">A avaliação combina:</span>
                    <ul className="list-disc list-inside space-y-0.5 text-slate-600 dark:text-slate-400">
                      <li>Evidências técnicas extraídas do código;</li>
                      <li>Inventário de agentes e modelos;</li>
                      <li>Controles de segurança e governance;</li>
                      <li>Evidências de supervisão humana;</li>
                    </ul>
                  </div>
                  <div className="space-y-1">
                    <span className="font-bold text-slate-800 block">Dimensões organizacionais:</span>
                    <ul className="list-disc list-inside space-y-0.5 text-slate-600 dark:text-slate-400">
                      <li>Processos e responsabilidades;</li>
                      <li>Mecanismos de monitorização;</li>
                      <li>Práticas de gestão de risco;</li>
                      <li>Evidências de melhoria contínua.</li>
                    </ul>
                  </div>
                </div>
                <p className="text-slate-600 text-[11px] pt-1">
                  Os resultados são relacionados aos princípios e requisitos aplicáveis da <strong>ISO/IEC 42001</strong>, às funções <em>Govern, Map, Measure</em> e <em>Manage</em> do <strong>NIST AI RMF</strong> e à lógica de evolução de maturidade do <strong>CMMI</strong>.
                </p>
                <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[10.5px]">
                  <strong>Importante:</strong> O nível de maturidade ComplyPRO é um modelo de avaliação próprio e não constitui uma certificação ISO/IEC 42001 nem uma classificação oficial do NIST.
                </div>
              </div>

              {/* Section 2: Escala de Maturidade ComplyPRO */}
              <div className="space-y-3">
                <span className="font-bold text-slate-900 text-sm block">2. Escala de Maturidade ComplyPRO</span>

                {/* Level 1 */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                    <span className="font-bold text-slate-900 text-xs font-mono">Nível 1 — Ad-Hoc / Não Gerenciado</span>
                    <span className="text-[10px] font-bold text-slate-700 bg-slate-200 px-2 py-0.5 rounded font-mono">Estado: Informal / Reativo</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    <strong>Estado:</strong> Práticas inexistentes, informais ou predominantemente reativas.
                  </p>
                  <div>
                    <span className="font-bold text-slate-800 text-[11px] block">Indicadores:</span>
                    <ul className="list-disc list-inside text-[11px] text-slate-600 space-y-0.5">
                      <li>Ausência de inventário de sistemas de IA;</li>
                      <li>Shadow AI não identificada ou não controlada;</li>
                      <li>Ausência de responsáveis claramente definidos;</li>
                      <li>Credenciais ou chaves expostas no código;</li>
                      <li>Ausência de processos formais de avaliação de risco;</li>
                      <li>Ausência de políticas ou controles básicos de AI Governance.</li>
                    </ul>
                  </div>
                  <p className="text-[11px] text-slate-700 bg-white p-2 rounded border border-slate-200 dark:border-slate-800">
                    <strong>Característica principal:</strong> A organização utiliza IA, mas não possui mecanismos consistentes para governar os seus riscos.
                  </p>
                </div>

                {/* Level 2 */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                    <span className="font-bold text-slate-900 text-xs font-mono">Nível 2 — Emergente / Identificação</span>
                    <span className="text-[10px] font-bold text-slate-700 bg-slate-200 px-2 py-0.5 rounded font-mono">MAP (NIST AI RMF)</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    <strong>Estado:</strong> Primeiros mecanismos de identificação e controlo começam a existir.
                  </p>
                  <div>
                    <span className="font-bold text-slate-800 text-[11px] block">Indicadores:</span>
                    <ul className="list-disc list-inside text-[11px] text-slate-600 space-y-0.5">
                      <li>Inventário inicial de agentes e modelos;</li>
                      <li>Identificação de componentes de IA no código;</li>
                      <li>Classificação inicial de riscos;</li>
                      <li>Avaliação estática de conformidade;</li>
                      <li>Identificação de ferramentas, prompts e integrações;</li>
                      <li>Primeiros processos de governance documentados.</li>
                    </ul>
                  </div>
                  <p className="text-[11px] text-slate-700 bg-white p-2 rounded border border-slate-200 dark:border-slate-800">
                    <strong>Característica principal:</strong> A organização começou a identificar e mapear o seu ecossistema de IA. Este nível aproxima-se particularmente da lógica de <strong>MAP do NIST AI RMF</strong>, que procura estabelecer contexto e identificar riscos relacionados com o sistema de IA.
                  </p>
                </div>

                {/* Level 3 */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                    <span className="font-bold text-slate-900 text-xs font-mono">Nível 3 — Estruturado / Controles Implementados</span>
                    <span className="text-[10px] font-bold text-slate-700 bg-slate-200 px-2 py-0.5 rounded font-mono">Defined (CMMI)</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    <strong>Estado:</strong> Governance e controles começam a ser formalizados e incorporados ao ciclo de desenvolvimento.
                  </p>
                  <div>
                    <span className="font-bold text-slate-800 text-[11px] block">Indicadores:</span>
                    <ul className="list-disc list-inside text-[11px] text-slate-600 space-y-0.5">
                      <li>Políticas e procedimentos definidos;</li>
                      <li>Agentes e modelos classificados;</li>
                      <li>Controles de segurança implementados;</li>
                      <li>Proteção contra prompt injection e outras ameaças relevantes;</li>
                      <li>Validações automatizadas;</li>
                      <li>Quality gates no CI/CD;</li>
                      <li>Definição de responsáveis;</li>
                      <li>Processos documentados de avaliação e tratamento de riscos.</li>
                    </ul>
                  </div>
                  <p className="text-[11px] text-slate-700 bg-white p-2 rounded border border-slate-200 dark:border-slate-800">
                    <strong>Característica principal:</strong> Os controles deixam de ser apenas recomendações e passam a fazer parte do processo operacional. Este nível corresponde à evolução para processos definidos e repetíveis, coerente com a progressão de maturidade utilizada pelo <strong>CMMI</strong>.
                  </p>
                </div>

                {/* Level 4 */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                    <span className="font-bold text-slate-900 text-xs font-mono">Nível 4 — Gerenciado & Quantificado</span>
                    <span className="text-[10px] font-bold text-slate-700 bg-slate-200 px-2 py-0.5 rounded font-mono">MEASURE (NIST AI RMF)</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    <strong>Estado:</strong> Os controles são operacionalizados, monitorizados e medidos.
                  </p>
                  <div>
                    <span className="font-bold text-slate-800 text-[11px] block">Indicadores:</span>
                    <ul className="list-disc list-inside text-[11px] text-slate-600 space-y-0.5">
                      <li>Human-in-the-Loop formalizado quando aplicável;</li>
                      <li>RACI e ownership definidos;</li>
                      <li>Métricas de risco e performance;</li>
                      <li>Monitorização contínua;</li>
                      <li>Auditoria e rastreabilidade;</li>
                      <li>Gestão de incidentes;</li>
                      <li>Avaliação periódica de controles;</li>
                      <li>Métricas de eficácia;</li>
                      <li>Gestão de risco integrada aos processos organizacionais.</li>
                    </ul>
                  </div>
                  <p className="text-[11px] text-slate-700 bg-white p-2 rounded border border-slate-200 dark:border-slate-800">
                    <strong>Característica principal:</strong> A organização não apenas possui controles — consegue demonstrar que eles estão a funcionar. Este nível está particularmente alinhado com a dimensão <strong>MEASURE do NIST AI RMF</strong>, que contempla métodos, métricas, avaliação e monitorização dos riscos de IA.
                  </p>
                </div>

                {/* Level 5 */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                    <span className="font-bold text-slate-900 text-xs font-mono">Nível 5 — Otimizado & Melhoria Contínua</span>
                    <span className="text-[10px] font-bold text-slate-700 bg-slate-200 px-2 py-0.5 rounded font-mono">Optimizing (CMMI)</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    <strong>Estado:</strong> AI Governance funciona como um sistema contínuo de gestão, medição e melhoria.
                  </p>
                  <div>
                    <span className="font-bold text-slate-800 text-[11px] block">Indicadores:</span>
                    <ul className="list-disc list-inside text-[11px] text-slate-600 space-y-0.5">
                      <li>Monitorização contínua do ambiente de IA;</li>
                      <li>Identificação de novos riscos;</li>
                      <li>Gestão de drift e mudanças relevantes;</li>
                      <li>Auditoria contínua baseada em evidências;</li>
                      <li>Melhoria sistemática dos controles;</li>
                      <li>Análise de tendências;</li>
                      <li>Automatização de remediação quando apropriado;</li>
                      <li>Feedback incorporado ao ciclo de governance;</li>
                      <li>Melhoria contínua baseada em métricas e resultados.</li>
                    </ul>
                  </div>
                  <p className="text-[11px] text-slate-700 bg-white p-2 rounded border border-slate-200 dark:border-slate-800">
                    <strong>Característica principal:</strong> A organização utiliza evidências e métricas para melhorar continuamente a sua capacidade de governar riscos de IA. Isto aproxima-se do conceito <strong>Optimizing do CMMI</strong>, cujo nível 5 é caracterizado por melhoria contínua baseada em dados.
                  </p>
                </div>
              </div>

              {/* Section 3: Os Quatro Pilares do NIST AI RMF */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="font-bold text-slate-900 text-sm block">3. Os Quatro Pilares do NIST AI RMF</span>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  O ComplyPRO utiliza os quatro domínios do NIST AI RMF como <strong>dimensões de análise</strong>, não como níveis de maturidade:
                </p>
                <div className="p-3 bg-white rounded-lg border border-slate-200 font-mono text-center text-xs font-bold text-slate-800">
                  GOVERN (Transversal) &nbsp;→&nbsp; MAP &nbsp;→&nbsp; MEASURE &nbsp;→&nbsp; MANAGE
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  Na realidade, o NIST trata <strong>Govern</strong> como uma função transversal, que informa e se integra com <em>Map, Measure</em> e <em>Manage</em>. A gestão de risco deve ocorrer continuamente ao longo do ciclo de vida do sistema de IA.
                </p>
              </div>

              {/* Section 4: Evidência Técnica ≠ Maturidade Organizacional */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <span className="font-bold text-slate-900 text-sm block">4. Evidência Técnica ≠ Maturidade Organizacional</span>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  Um scanner de código estático fornece comprovação técnica essencial, mas maturidade empresarial plena requer contexto de governança e processos:
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                  <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                    <span className="font-bold text-emerald-800 block">✓ O Scanner de Código Prova:</span>
                    <ul className="space-y-0.5 text-slate-600 dark:text-slate-400">
                      <li>• Agentes e modelos identificados;</li>
                      <li>• Ferramentas e prompts mapeados;</li>
                      <li>• Secrets e credenciais ausentes no código;</li>
                      <li>• Guardrails e HITL implementados no código.</li>
                    </ul>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                    <span className="font-bold text-amber-800 block">✗ O Código Sozinho Não Prova:</span>
                    <ul className="space-y-0.5 text-slate-600 dark:text-slate-400">
                      <li>• Que a política é efetivamente aplicada;</li>
                      <li>• Que existe um responsável formal designado;</li>
                      <li>• Que a gestão aprovou determinado risco residual;</li>
                      <li>• Que uma auditoria interna foi realizada.</li>
                    </ul>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-lg border border-slate-200 font-mono text-center text-xs font-bold text-slate-900 dark:text-slate-100">
                  Technical Evidence &nbsp;+&nbsp; Governance Evidence &nbsp;+&nbsp; Organizational Evidence &nbsp;=&nbsp; Score 360° Real
                </div>

                {/* Assessment Bridge */}
                <div className="p-3 bg-slate-100 rounded-lg border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 pt-2">
                  <span className="text-[11px] text-slate-700 dark:text-slate-300">
                    O <strong>Diagnóstico de Processos (6 Questões)</strong> complementa o scanner para preencher a camada organizacional.
                  </span>
                  <button
                    onClick={() => {
                      setShowMaturityFormulaModal(false);
                      setShowAssessmentModal(true);
                    }}
                    className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shrink-0 cursor-pointer shadow-xs"
                  >
                    Abrir Diagnóstico 360°
                  </button>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="pt-2 flex items-center justify-between border-t border-slate-200 dark:border-slate-800">
              <span className="text-[11px] text-slate-500">
                Modelo de Maturidade ComplyPRO • Alinhado a CMMI, ISO 42001 & NIST AI RMF
              </span>
              <button
                onClick={() => setShowMaturityFormulaModal(false)}
                className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                Fechar
              </button>
            </div>

          </div>
        </div>
      )}

      {/* AI Generated Executive Report Panel */}
      {aiReport && (
        <div className="bg-white dark:bg-[#111827] p-6 rounded-2xl border border-slate-200 shadow-2xs relative animate-in fade-in duration-300">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-lg bg-slate-100 border border-slate-200 text-slate-800 font-bold">
                <Sparkles className="w-4 h-4 text-slate-700 dark:text-slate-300" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Parecer Executivo de Governança & Conformidade</h4>
                <p className="text-[11px] text-slate-500">Análise jurídica e técnica consolidada</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleCopyReport}
                className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs text-slate-700 hover:bg-slate-50 transition-colors flex items-center space-x-1.5 cursor-pointer shadow-2xs font-semibold"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copiado!' : 'Copiar'}</span>
              </button>
              <button
                onClick={() => setAiReport(null)}
                className="text-xs text-slate-500 hover:text-slate-800 px-2 py-1 cursor-pointer font-semibold"
              >
                Fechar
              </button>
            </div>
          </div>

          <div className="mt-4 text-xs leading-relaxed text-slate-700 whitespace-pre-wrap font-sans bg-slate-50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            {aiReport}
          </div>
        </div>
      )}
    </div>
  );
};
