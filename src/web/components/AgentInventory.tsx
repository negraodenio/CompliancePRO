import React, { useState } from 'react';
import { 
  Bot, Cpu, DollarSign, Database, ShieldAlert, CheckCircle, 
  Zap, Layers, AlertCircle, ArrowRight, ArrowDownRight, Workflow, Briefcase, Eye, ChevronDown, ChevronUp,
  Sparkles, Lock
} from 'lucide-react';
import type { ScannerResult } from '../../core/types';
import { getAgentBusinessAndSipoc, inferAgentFramework } from '../services/agent-sipoc-mapper';
import { EnterpriseLeadModal } from './EnterpriseLeadModal';

interface AgentInventoryProps {
  result: ScannerResult;
}

export const AgentInventory: React.FC<AgentInventoryProps> = ({ result }) => {
  const [expandedAgentIndex, setExpandedAgentIndex] = useState<number | null>(null);
  const [showEnterpriseModal, setShowEnterpriseModal] = useState(false);

  const agents = result.source?.agents || [];
  const costEstimate = (result as any)._costEstimate || { totalMonthlyUsd: 0, estimatedMonthlyTokens: 0, modelCount: 0 };
  const shadowAI = result.shadowAI || [];

  const toggleAgent = (idx: number) => {
    setExpandedAgentIndex(expandedAgentIndex === idx ? null : idx);
  };

  return (
    <div className="space-y-6">
      
      {/* Header with quick stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center space-x-2">
            <Bot className="w-5 h-5 text-purple-400" />
            <span>Inventário de Agentes de IA & Arquitetura de Negócio (SIPOC)</span>
          </h2>
          <p className="text-xs text-slate-400">
            Mapeamento de funções de negócio, fluxo de dados (Entrada ➔ Processo ➔ Saída) e governança operacional.
          </p>
        </div>

        {/* Cost Badge */}
        <div className="flex items-center space-x-3 text-xs bg-surface p-2 rounded-xl border border-surface-border">
          <div className="flex items-center space-x-1.5 text-emerald-400 font-mono">
            <DollarSign className="w-4 h-4" />
            <span>~${costEstimate.totalMonthlyUsd.toFixed(2)}/mês</span>
          </div>
          <span className="text-slate-500">•</span>
          <div className="text-slate-400 font-mono">
            {(costEstimate.estimatedMonthlyTokens / 1000).toFixed(0)}k tokens est.
          </div>
        </div>
      </div>

      {/* Agents Grid with SIPOC Breakdown */}
      <div className="grid grid-cols-1 gap-4">
        {agents.length === 0 ? (
          <div className="p-8 text-center glass-panel rounded-2xl border border-surface-border text-slate-400 text-xs">
            Nenhum agente autônomo complexo detectado no repositório.
          </div>
        ) : (
          agents.map((agent, idx) => {
            const { businessPurpose, sipoc } = getAgentBusinessAndSipoc(agent);
            const isExpanded = expandedAgentIndex === idx;

            return (
              <div
                key={idx}
                className="glass-panel p-5 rounded-2xl border border-surface-border hover:border-purple-500/40 transition-all space-y-4 bg-[#0a0f1e]"
              >
                {/* Agent Card Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-surface-border">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-950/80 border border-purple-800/60 flex items-center justify-center text-purple-400 shrink-0">
                      <Bot className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-bold text-white font-mono">{agent.name}</h4>
                        <span className="px-2 py-0.5 text-[10px] font-medium bg-purple-950/70 text-purple-300 border border-purple-800/50 rounded-full">
                          {inferAgentFramework(agent)}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        {sipoc.businessRole}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full border ${
                      agent.riskLevel === 'critical' || agent.riskLevel === 'high'
                        ? 'bg-rose-950/80 text-rose-300 border-rose-800/80'
                        : agent.riskLevel === 'medium'
                        ? 'bg-amber-950/80 text-amber-300 border-amber-800/80'
                        : 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80'
                    }`}>
                      RISCO {agent.riskLevel.toUpperCase()}
                    </span>

                    <button
                      onClick={() => toggleAgent(idx)}
                      className="p-1.5 rounded-lg bg-surface hover:bg-slate-800 border border-surface-border text-slate-400 hover:text-white transition-colors cursor-pointer"
                      title="Ver detalhes da Cadeia SIPOC"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Business Purpose in 1-2 Lines */}
                <div className="bg-[#070b16] p-3 rounded-xl border border-slate-800/70 space-y-1">
                  <div className="flex items-center space-x-1.5 text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>Função no Negócio:</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {businessPurpose}
                  </p>
                </div>

                {/* RACI Ownership & Governance Bar (ISO 42001) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] p-2.5 rounded-xl bg-[#080d1a] border border-surface-border">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Dono do Processo (Business Owner):</span>
                    <span className="font-semibold text-white truncate block">{sipoc.processOwner}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Guardião Técnico (Tech Lead):</span>
                    <span className="font-semibold text-purple-300 truncate block">{sipoc.technicalCustodian}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Status de Homologação:</span>
                    <span className={`inline-block px-2 py-0.5 text-[10px] font-mono font-bold rounded ${
                      sipoc.governanceStatus === 'HOMOLOGADO' 
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' 
                        : 'bg-amber-950 text-amber-300 border border-amber-800'
                    }`}>
                      {sipoc.governanceStatus === 'HOMOLOGADO' ? '✓ HOMOLOGADO' : '🟡 PENDENTE DE COMITÊ'}
                    </span>
                  </div>
                </div>

                {/* SIPOC Flow (Input ➔ Process ➔ Output) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs">
                  
                  {/* Step 1: Input */}
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                    <div className="text-[10px] font-bold text-cyan-300 uppercase tracking-wider flex items-center justify-between">
                      <span>📥 1. Entrada (Input)</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-tight">
                      {sipoc.input}
                    </p>
                    <span className="text-[9px] text-slate-500 block font-mono">
                      Origem: {sipoc.supplier}
                    </span>
                  </div>

                  {/* Step 2: Process */}
                  <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-900/40 space-y-1">
                    <div className="text-[10px] font-bold text-purple-300 uppercase tracking-wider flex items-center justify-between">
                      <span>⚙️ 2. Processamento</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-tight">
                      {sipoc.process}
                    </p>
                    <span className="text-[9px] text-purple-400/80 block font-mono">
                      Supervisão: {agent.oversightLevel || 'l2_human_review'}
                    </span>
                  </div>

                  {/* Step 3: Output */}
                  <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-900/40 space-y-1">
                    <div className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider flex items-center justify-between">
                      <span>📤 3. Saída (Output)</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-tight">
                      {sipoc.output}
                    </p>
                    <span className="text-[9px] text-emerald-400/80 block font-mono">
                      Destino: {sipoc.customer}
                    </span>
                  </div>

                </div>

                {/* 🔒 Blurred Enterprise Feature Card (Teaser) */}
                <div className="relative rounded-xl border border-purple-500/30 bg-[#090d18] overflow-hidden p-3 group">
                  {/* Blurred Background Content */}
                  <div className="filter blur-[3px] select-none pointer-events-none opacity-50 space-y-1 text-[11px] text-slate-400">
                    <div className="flex items-center justify-between font-mono">
                      <span>Telemetria de Tokens em Tempo Real: 142.420 tokens/dia</span>
                      <span className="text-emerald-400">Drift: 0.04% (Estável)</span>
                    </div>
                    <div className="flex items-center justify-between font-mono">
                      <span>Workflow de Aprovação de Deploy: 2/2 Aprovadores (CISO + DPO)</span>
                      <span>Logs Imutáveis: SHA-256 Validado</span>
                    </div>
                  </div>

                  {/* Floating Overlay with Lock */}
                  <div className="absolute inset-0 bg-[#070b16]/75 backdrop-blur-[2px] flex items-center justify-between px-4 py-2">
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 rounded-lg bg-purple-950 text-purple-400 border border-purple-800">
                        <Lock className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white block">
                          Gestão Contínua do Ciclo de Vida & Drift de Modelo
                        </span>
                        <span className="text-[10px] text-purple-300 block">
                          Workflow de aprovação, telemetria em produção e guardrails ativos
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => setShowEnterpriseModal(true)}
                      className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white text-[11px] font-bold flex items-center space-x-1 shadow-glow-purple cursor-pointer transition-all shrink-0"
                    >
                      <span>Desbloquear no Enterprise</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Expanded Technical Details (Tools & Governance) */}
                {isExpanded && (
                  <div className="pt-2 border-t border-surface-border/50 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs animate-in fade-in">
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-1 font-semibold">Ferramentas & Integrações Declaradas:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {agent.tools && agent.tools.length > 0 ? (
                          agent.tools.map((t, i) => (
                            <span key={i} className="px-2 py-0.5 bg-slate-800 text-slate-300 text-[10px] font-mono rounded border border-slate-700">
                              🛠️ {t}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-slate-500 italic">Chamada direta ao LLM sem tools externas</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block mb-1 font-semibold">Diretriz EU AI Act & Supervisão:</span>
                      <div className="text-[11px] text-slate-300 font-mono">
                        {agent.isAutonomous ? '⚡ Execução Autônoma (Requer HITL no Art. 14)' : '👥 Supervisão Humana Ativa (Em Conformidade)'}
                      </div>
                    </div>
                  </div>
                )}

              </div>
            );
          })
        )}
      </div>

      {/* Shadow AI & Direct API Call Governance Section (Clean, Non-Alarmist Amber/Cyan) */}
      {shadowAI.length > 0 && (
        <div className="glass-panel p-5 rounded-2xl border border-amber-500/30 bg-amber-950/10 space-y-4">
          <div className="flex items-center space-x-2 text-amber-400">
            <AlertCircle className="w-5 h-5" />
            <h3 className="text-sm font-bold text-white">
              Governança de Modelos & Chamadas Diretas de IA ({shadowAI.length} detectadas)
            </h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Chamadas diretas a modelos de linguagem identificadas no código. Mapeadas para inclusão automática no catálogo de conformidade e auditoria de tokens.
          </p>

          <div className="space-y-2">
            {shadowAI.map((item, i) => {
              const displayProvider = item.provider === 'unknown' ? 'PIPELINE LLM' : item.provider;
              const displayModel = !item.modelId || item.modelId === 'unknown' ? 'Motor de Inferência de IA' : item.modelId;

              return (
                <div key={i} className="p-3 rounded-xl bg-[#090d18] border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="space-y-0.5">
                    <span className="font-mono text-cyan-300 font-semibold">{item.file}</span>
                    <p className="text-[11px] text-slate-400">{item.reason}</p>
                  </div>
                  <span className="px-2.5 py-1 text-[10px] bg-[#0f172a] text-cyan-300 border border-cyan-800/60 rounded-lg font-mono shrink-0">
                    {displayProvider} • {displayModel}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Enterprise Suite Upsell Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-purple-500/40 bg-gradient-to-r from-purple-950/20 via-[#0d1326] to-cyan-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xl">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-purple-400">
            <Sparkles className="w-4 h-4" />
            <h4 className="text-sm font-bold text-white">ComplyPRO Enterprise Governance Suite</h4>
          </div>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Deseja orquestrar esteiras de aprovação de deploy, monitoramento de deriva de modelo (Drift) e inventário ativo de agentes em tempo real com auditoria ISO 42001?
          </p>
        </div>

        <button
          onClick={() => setShowEnterpriseModal(true)}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white text-xs font-bold flex items-center space-x-2 shadow-glow-purple cursor-pointer transition-all shrink-0"
        >
          <span>Agendar Demonstração Executiva</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Enterprise Lead Modal */}
      {showEnterpriseModal && (
        <EnterpriseLeadModal onClose={() => setShowEnterpriseModal(false)} featureContext="Gestão do Ciclo de Vida de Agentes & RACI" />
      )}

    </div>
  );
};
