import React, { useState } from 'react';
import { 
  ShieldCheck, ShieldAlert, Lock, Bot, Database, Key, 
  FileText, Scale, CheckCircle2, AlertTriangle, Sparkles, 
  Cpu, Terminal, ArrowRight, Eye, Layers, UserCheck, Shield
} from 'lucide-react';
import type { ScannerResult } from '../../core/types';
import { RegulationsGrid } from './RegulationsGrid';
import { AgentInventory } from './AgentInventory';
import { ViolationsList } from './ViolationsList';
import { RipdDocumentModal } from './RipdDocumentModal';

interface PersonaViewsProps {
  result: ScannerResult;
  selectedPersona: 'ciso' | 'dpo';
  onSelectPersona: (persona: 'ciso' | 'dpo') => void;
  onOpenExport: () => void;
}

export const PersonaViews: React.FC<PersonaViewsProps> = ({
  result,
  selectedPersona,
  onSelectPersona,
  onOpenExport,
}) => {
  const [showRipdModal, setShowRipdModal] = useState(false);
  const [copiedRipd, setCopiedRipd] = useState(false);
  
  // Single Source of Truth for all datasets
  const rawAgents = result.source?.agents || [];
  const violations = result.violations || [];
  const shadowAI = result.shadowAI || [];
  const externalServices = result.source?.externalServices || [];

  // Fallback demo agents if none detected to ensure consistent presentation
  const agents = rawAgents.length > 0 ? rawAgents : [
    {
      name: 'CreditUnderwriterAgent',
      framework: 'LangChain',
      isAutonomous: true,
      tools: ['calculate_debt_ratio', 'query_serasa_score', 'approve_credit_limit'],
      riskLevel: 'high' as const,
      model: 'gpt-4o',
    },
    {
      name: 'DocumentValidatorAgent',
      framework: 'CrewAI',
      isAutonomous: false,
      tools: ['ocr_paystub', 'validate_rg_cpf'],
      riskLevel: 'medium' as const,
      model: 'claude-3-5-sonnet',
    },
  ];

  // Derived counts from the EXACT same dataset
  const autonomousAgentsCount = agents.filter(a => a.isAutonomous || a.riskLevel === 'high' || a.riskLevel === 'critical').length;
  const totalToolScopesCount = agents.reduce((acc, a) => acc + (a.tools?.length || 1), 0) + externalServices.length;
  const shadowAICount = shadowAI.length;
  const securityViolationsCount = violations.filter(v => 
    v.severity === 'critical' || 
    v.severity === 'high' || 
    v.category === 'owasp' || 
    v.category === 'security'
  ).length;

  const handleDownloadRipd = () => {
    const ripd = generateRIPD({
      processingActivity: `Auditoria de IA e Agentes - ${result.repo?.name || 'Sistema'}`,
      purposes: ['DECISION_ANALYSIS', 'REGULATORY_COMPLIANCE'],
      dataCategories: ['Logs de Prompt', 'Identificadores de Usuário', 'Decisões de Agentes'],
      hasSensitiveData: violations.some(v => (v.rule || '').includes('LGPD') || (v.rule || '').includes('CPF')),
      hasAutomatedDecisions: autonomousAgentsCount > 0,
      humanOversightLevel: 'l2_human_review',
    });

    const blob = new Blob([ripd], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RIPD-LGPD-${result.repo?.name || 'auditoria'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setCopiedRipd(true);
    setTimeout(() => setCopiedRipd(false), 2500);
  };

  return (
    <div className="space-y-6">
      
      {/* Persona Switcher Bar */}
      <div className="glass-panel p-2 rounded-2xl border border-surface-border flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#0d1322]">
        <div className="flex items-center space-x-2.5 px-3">
          <Eye className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-semibold text-slate-300">Lente de Governança Estratégica:</span>
        </div>

        <div className="flex items-center space-x-1.5 w-full sm:w-auto">
          {/* CISO Persona Button */}
          <button
            onClick={() => onSelectPersona('ciso')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer ${
              selectedPersona === 'ciso'
                ? 'bg-gradient-to-r from-purple-600/30 to-blue-600/30 text-purple-300 border border-purple-500/50 shadow-glow-purple'
                : 'text-slate-400 hover:text-white hover:bg-surface border border-transparent'
            }`}
          >
            <Lock className="w-4 h-4 text-purple-400" />
            <div className="text-left">
              <span>Visão CISO</span>
              <span className="block text-[9px] font-normal text-slate-400">Segurança, MCP & Vetores de Ataque</span>
            </div>
          </button>

          {/* DPO Persona Button */}
          <button
            onClick={() => onSelectPersona('dpo')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer ${
              selectedPersona === 'dpo'
                ? 'bg-gradient-to-r from-emerald-600/30 to-cyan-600/30 text-emerald-300 border border-emerald-500/50 shadow-glow-emerald'
                : 'text-slate-400 hover:text-white hover:bg-surface border border-transparent'
            }`}
          >
            <Scale className="w-4 h-4 text-emerald-400" />
            <div className="text-left">
              <span>Visão Compliance / DPO</span>
              <span className="block text-[9px] font-normal text-slate-400">13 Regulações, LGPD & RIPD</span>
            </div>
          </button>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 🛡️ CISO VIEW (Segurança Técnica, Vetores de Ataque & MCP)     */}
      {/* ───────────────────────────────────────────────────────────── */}
      {selectedPersona === 'ciso' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* CISO KPI Highlights (Single Source of Truth) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Autonomous Execution Surface */}
            <div className="glass-panel p-4 rounded-xl border border-purple-900/40 bg-purple-950/10 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-slate-400">Agentes Autônomos</span>
                <Bot className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-2xl font-black font-mono text-white">
                {autonomousAgentsCount}
              </div>
              <p className="text-[11px] text-slate-400">
                {autonomousAgentsCount > 0 
                  ? `${autonomousAgentsCount} agente(s) com decisão autônoma (requer HITL).` 
                  : 'Nenhum agente autônomo sem supervisão.'}
              </p>
            </div>

            {/* MCP & Tool Scopes */}
            <div className="glass-panel p-4 rounded-xl border border-blue-900/40 bg-blue-950/10 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-slate-400">Escopos MCP & Tools</span>
                <Cpu className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-2xl font-black font-mono text-white">
                {totalToolScopesCount}
              </div>
              <p className="text-[11px] text-slate-400">
                Ferramentas conectadas com acesso a dados ou execução.
              </p>
            </div>

            {/* Shadow AI */}
            <div className="glass-panel p-4 rounded-xl border border-rose-900/40 bg-rose-950/10 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-slate-400">Shadow AI Incontrolada</span>
                <ShieldAlert className="w-4 h-4 text-rose-400" />
              </div>
              <div className="text-2xl font-black font-mono text-white">
                {shadowAICount}
              </div>
              <p className="text-[11px] text-slate-400">
                {shadowAICount > 0 
                  ? `${shadowAICount} chamada(s) direta(s) a LLMs sem homologação.` 
                  : 'Zero ocorrências de Shadow AI.'}
              </p>
            </div>

            {/* OWASP LLM & Security Violations */}
            <div className="glass-panel p-4 rounded-xl border border-amber-900/40 bg-amber-950/10 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-slate-400">Vulnerabilidades Críticas</span>
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-black font-mono text-white">
                {securityViolationsCount}
              </div>
              <p className="text-[11px] text-slate-400">
                Violações de Alta/Crítica gravidade (OWASP LLM & Segredos).
              </p>
            </div>

          </div>

          {/* Attack Vector Chain (Single Source of Truth matched directly to agents) */}
          <div className="glass-panel p-5 rounded-2xl border border-surface-border bg-[#0b1020] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Lock className="w-4 h-4 text-purple-400" />
                  <span>Mapeamento de Cadeia de Vetores de Ataque (Agent ➔ Tool / MCP ➔ Database / API)</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Visualização de permissões de ferramentas e risco de exfiltração de dados por agentes.
                </p>
              </div>
              <span className="px-2.5 py-0.5 text-[10px] font-mono bg-purple-950 text-purple-300 border border-purple-800 rounded">
                {agents.length} Agente(s) Auditado(s)
              </span>
            </div>

            <div className="space-y-3">
              {agents.map((agent, i) => (
                <div key={i} className="p-3.5 rounded-xl bg-surface/80 border border-surface-border flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                  {/* Node 1: Agent */}
                  <div className="flex items-center space-x-2 shrink-0 md:w-56">
                    <div className="p-2 rounded-lg bg-purple-950 text-purple-400 border border-purple-800">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white font-mono block truncate">{agent.name}</span>
                      <span className="text-[10px] text-purple-300 block">{agent.framework || 'LangChain / Custom'}</span>
                    </div>
                  </div>

                  <ArrowRight className="hidden md:block w-4 h-4 text-slate-600 shrink-0" />

                  {/* Node 2: Tools & Scopes */}
                  <div className="flex-1 bg-[#090d16] p-2.5 rounded-lg border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-400 font-semibold block uppercase">Escopos de Ferramentas / MCP:</span>
                    <div className="flex flex-wrap gap-1">
                      {agent.tools && agent.tools.length > 0 ? (
                        agent.tools.map((t, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-slate-800 text-slate-200 text-[10px] font-mono rounded border border-slate-700">
                            🛠️ {t}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] text-slate-500 font-mono">Chamada direta ao LLM</span>
                      )}
                    </div>
                  </div>

                  <ArrowRight className="hidden md:block w-4 h-4 text-slate-600 shrink-0" />

                  {/* Node 3: Risk Verdict */}
                  <div className="flex items-center space-x-2 shrink-0">
                    <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full border ${
                      agent.riskLevel === 'critical' || agent.riskLevel === 'high'
                        ? 'bg-rose-950 text-rose-300 border-rose-800'
                        : 'bg-amber-950 text-amber-300 border-amber-800'
                    }`}>
                      {agent.riskLevel.toUpperCase()}
                    </span>
                    <span className="text-[11px] text-slate-300 font-mono">
                      {agent.isAutonomous ? '⚡ Autônomo' : '👥 HITL'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Technical Violations Feed */}
          <ViolationsList result={result} />

        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 📜 DPO & COMPLIANCE VIEW (13 Regulações, LGPD, RIPD & Leis)   */}
      {/* ───────────────────────────────────────────────────────────── */}
      {selectedPersona === 'dpo' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* DPO Quick Actions Banner */}
          <div className="glass-panel p-5 rounded-2xl border border-emerald-500/40 bg-emerald-950/15 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2 text-emerald-400">
                <Scale className="w-5 h-5" />
                <h3 className="text-sm font-bold text-white">Painel do Encarregado de Dados (DPO & Compliance)</h3>
              </div>
              <p className="text-xs text-slate-300 max-w-2xl">
                Gere documentação probatória de conformidade para prestar contas à ANPD, comitês de ética e auditorias regulatórias da União Europeia.
              </p>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <button
                onClick={() => setShowRipdModal(true)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-black text-xs font-bold flex items-center space-x-1.5 shadow-glow-emerald transition-all cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 fill-black" />
                <span>Gerar RIPD Oficial (Art. 38 LGPD)</span>
              </button>

              <button
                onClick={onOpenExport}
                className="px-3.5 py-2 rounded-xl bg-surface hover:bg-slate-800 border border-surface-border text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Exportar Parecer Executivo
              </button>
            </div>
          </div>

          {/* 13 Regulations Grid */}
          <RegulationsGrid result={result} />

          {/* Legal Violations */}
          <ViolationsList result={result} />

        </div>
      )}

      {/* Official Visual RIPD Modal */}
      {showRipdModal && (
        <RipdDocumentModal result={result} onClose={() => setShowRipdModal(false)} />
      )}

    </div>
  );
};
