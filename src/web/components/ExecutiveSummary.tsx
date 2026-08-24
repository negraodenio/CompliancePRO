import React, { useState } from 'react';
import { 
  ShieldAlert, ShieldCheck, AlertTriangle, Bot, Cpu, DollarSign, 
  Sparkles, FileText, CheckCircle2, XCircle, ArrowUpRight, Copy, Check, Info, Calculator, Scale
} from 'lucide-react';
import type { ScannerResult } from '../../core/types';
import { generateExecutiveSummaryWithAI } from '../services/siliconflow';
import { 
  calculateRegulationScores, 
  calculateOverallScore, 
  classifySystemPurpose 
} from '../services/regulation-mapper';

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
    if (score >= 80) return { text: 'text-emerald-400', stroke: '#10b981', bg: 'from-emerald-500/20 to-teal-500/20', border: 'border-emerald-500/40' };
    if (score >= 60) return { text: 'text-amber-400', stroke: '#f59e0b', bg: 'from-amber-500/20 to-orange-500/20', border: 'border-amber-500/40' };
    return { text: 'text-rose-400', stroke: '#f43f5e', bg: 'from-rose-500/20 to-red-500/20', border: 'border-rose-500/40' };
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
        <div className="glass-panel p-5 rounded-2xl border border-surface-border flex items-center space-x-5 relative overflow-hidden">
          <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
            <svg className="w-24 h-24 transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                className="text-slate-800"
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
              <span className="text-[10px] text-slate-400 font-medium">/100</span>
            </div>
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Score Geral</span>
              <button
                onClick={() => setShowFormulaModal(true)}
                className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center space-x-0.5 cursor-pointer"
                title="Ver fórmula e metodologia auditável"
              >
                <Info className="w-3 h-3" />
                <span>Como calculamos</span>
              </button>
            </div>
            <h3 className="text-base font-bold text-white mt-0.5">Conformidade IA</h3>
            <p className="text-[11px] text-slate-400 mt-1">
              {overallScore >= 80 ? 'Nível Elevado de Governança' : overallScore >= 60 ? 'Requer Mitigações Pontuais' : 'Alto Risco Regulatório'}
            </p>
          </div>
        </div>

        {/* EU AI Act Risk Tier - Purpose-First Classification */}
        <div className="glass-panel p-5 rounded-2xl border border-surface-border flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">EU AI Act</span>
            <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${
              purpose.riskTier === 'HIGH_RISK'
                ? 'bg-rose-950/80 text-rose-300 border-rose-800/80 animate-pulse'
                : 'bg-amber-950/80 text-amber-300 border-amber-800/80'
            }`}>
              {purpose.riskTier === 'HIGH_RISK' ? 'HIGH RISK (Anexo III)' : 'LIMITED RISK (Art. 50)'}
            </span>
          </div>

          <div className="mt-3">
            <div className="text-base font-bold text-white flex items-center space-x-2">
              <ShieldAlert className={`w-5 h-5 ${purpose.riskTier === 'HIGH_RISK' ? 'text-rose-400' : 'text-amber-400'}`} />
              <span className="truncate">{purpose.riskTier === 'HIGH_RISK' ? 'Alto Risco Mandatório' : 'Risco Limitado'}</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 line-clamp-2" title={purpose.legalJustification}>
              {purpose.legalJustification}
            </p>
          </div>
        </div>

        {/* Shadow AI Card */}
        <div className="glass-panel p-5 rounded-2xl border border-surface-border flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Shadow AI</span>
            <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${
              shadowAICount > 0
                ? 'bg-rose-950/80 text-rose-300 border-rose-800/80'
                : 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80'
            }`}>
              {shadowAICount > 0 ? `${shadowAICount} Detectados` : 'Nenhum'}
            </span>
          </div>

          <div className="mt-3">
            <div className="text-xl font-bold text-white flex items-center space-x-2">
              <Bot className="w-5 h-5 text-purple-400" />
              <span>{agentCount} Agentes Mapeados</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {shadowAICount > 0 
                ? `${shadowAICount} chamadas diretas a LLMs sem governança declarada.`
                : 'Todos os pipelines de IA possuem rastreabilidade.'}
            </p>
          </div>
        </div>

        {/* Violations & AI Trigger */}
        <div className="glass-panel p-5 rounded-2xl border border-surface-border flex flex-col justify-between bg-gradient-to-br from-purple-950/20 to-surface">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Auditoria</span>
            <span className="text-xs font-mono text-purple-300">{totalViolations} achados ({criticalViolations} críticos)</span>
          </div>

          <div className="mt-3">
            <button
              onClick={handleGenerateAIReport}
              disabled={isGeneratingReport}
              className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold flex items-center justify-center space-x-2 shadow-glow-purple transition-all disabled:opacity-50 cursor-pointer"
            >
              {isGeneratingReport ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Consultando DeepSeek-V3...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                  <span>Gerar Parecer com IA</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>

      {/* Formula & Calculation Modal */}
      {showFormulaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="glass-panel w-full max-w-xl bg-[#0e1424] border border-cyan-500/40 rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-start justify-between pb-3 border-b border-surface-border">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-800">
                  <Calculator className="w-5 h-5" />
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

            <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
              
              {/* Rule 1: Individual Regulation Score */}
              <div className="p-3.5 rounded-xl bg-surface border border-surface-border space-y-2">
                <span className="font-bold text-cyan-300 block">1. Fórmula do Score por Regulação (Base 100):</span>
                <p className="text-[11px] text-slate-400">
                  Toda regulação parte de <strong>100 pontos</strong>. Violações associadas aos seus artigos de lei específicos subtraem pontos por gravidade:
                </p>
                <div className="p-2.5 rounded bg-[#090d16] font-mono text-[11px] text-cyan-300 border border-slate-800">
                  Score = max(0, 100 - (Crítica × 25) - (Alta × 14) - (Média × 7) - (Baixa × 3))
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-1">
                  <div className="p-1.5 rounded bg-rose-950/60 text-rose-300 border border-rose-800">Crítica: -25 pts</div>
                  <div className="p-1.5 rounded bg-orange-950/60 text-orange-300 border border-orange-800">Alta: -14 pts</div>
                  <div className="p-1.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800">Média: -7 pts</div>
                  <div className="p-1.5 rounded bg-slate-800 text-slate-300 border border-slate-700">Baixa: -3 pts</div>
                </div>
                <p className="text-[10px] text-emerald-400 italic">
                  ✓ Regulações sem violações pontuam estritamente 100%.
                </p>
              </div>

              {/* Rule 2: Overall Score Weighting */}
              <div className="p-3.5 rounded-xl bg-surface border border-surface-border space-y-2">
                <span className="font-bold text-purple-300 block">2. Score Geral Ponderado pelo Contexto do Negócio:</span>
                <p className="text-[11px] text-slate-400">
                  O Score Geral reflete a criticidade do domínio (ex: em FinTech, <strong>EU AI Act e BCB 4893</strong> têm peso 3x maior que normas secundárias):
                </p>
                <div className="p-2.5 rounded bg-[#090d16] font-mono text-[11px] text-purple-300 border border-slate-800">
                  Score Geral = Σ(Score_Regulação_i × Peso_i) / Σ(Peso_i)
                </div>
                <div className="text-[11px] text-slate-400 space-y-1">
                  <div><strong>Domínio Detectado:</strong> <span className="text-white font-semibold uppercase">{purpose.domain}</span></div>
                  <div><strong>Referência Legal EU AI Act:</strong> <span className="text-slate-300">{purpose.annexReference}</span></div>
                </div>
              </div>

              {/* Rule 3: Purpose-first Annex III Classification */}
              <div className="p-3.5 rounded-xl bg-surface border border-surface-border space-y-1.5">
                <span className="font-bold text-rose-300 block">3. Classificação de Risco por Finalidade (Anexo III):</span>
                <p className="text-[11px] text-slate-400">
                  Sistemas de concessão de crédito, triagem de saúde ou RH são classificados como <strong>HIGH_RISK</strong> por exigência expressa do Anexo III do EU AI Act, independente do código estar limpo.
                </p>
              </div>

            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowFormulaModal(false)}
                className="px-5 py-2 bg-surface hover:bg-slate-800 text-white rounded-xl text-xs font-semibold border border-surface-border cursor-pointer"
              >
                Entendi
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
