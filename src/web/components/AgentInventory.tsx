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
          <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
            <Bot className="w-5 h-5 text-slate-700 dark:text-slate-300" />
            <span>Inventário de Agentes de IA & Arquitetura de Negócio (SIPOC)</span>
          </h2>
          <p className="text-xs text-slate-500">
            Mapeamento de funções de negócio, fluxo de dados (Entrada ➔ Processo ➔ Saída) e governança operacional.
          </p>
        </div>

        {/* Cost Badge */}
        <div className="flex items-center space-x-3 text-xs bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center space-x-1.5 text-emerald-800 font-mono font-bold">
            <DollarSign className="w-4 h-4 text-emerald-700" />
            <span>~${costEstimate.totalMonthlyUsd.toFixed(2)}/mês</span>
          </div>
          <span className="text-slate-300">•</span>
          <div className="text-slate-600 font-mono">
            {(costEstimate.estimatedMonthlyTokens / 1000).toFixed(0)}k tokens est.
          </div>
        </div>
      </div>

      {/* Agents Grid with SIPOC Breakdown */}
      <div className="grid grid-cols-1 gap-4">
        {agents.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs shadow-2xs">
            Nenhum agente autônomo complexo detectado no repositório.
          </div>
        ) : (
          agents.map((agent, idx) => {
            const { businessPurpose, sipoc } = getAgentBusinessAndSipoc(agent);
            const isExpanded = expandedAgentIndex === idx;

            return (
              <div
                key={idx}
                className="bg-white dark:bg-[#111827] p-5 rounded-2xl border border-slate-200 hover:border-slate-300 transition-all space-y-4 shadow-2xs"
              >
                {/* Agent Card Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800 shrink-0">
                      <Bot className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-bold text-slate-900 font-mono">{agent.name}</h4>
                        <span className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 rounded-full">
                          {inferAgentFramework(agent)}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 block mt-0.5">
                        {sipoc.businessRole}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className={`px-2.5 py-1 text-[10px] font-bold rounded-md border ${
                      agent.riskLevel === 'critical' || agent.riskLevel === 'high'
                        ? 'bg-rose-50 text-rose-800 border-rose-200'
                        : agent.riskLevel === 'medium'
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    }`}>
                      RISCO {agent.riskLevel.toUpperCase()}
                    </span>

                    <button
                      onClick={() => toggleAgent(idx)}
                      className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                      title="Ver detalhes da Cadeia SIPOC"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Business Purpose in 1-2 Lines */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                  <div className="flex items-center space-x-1.5 text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                    <Briefcase className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                    <span>Função no Negócio:</span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {businessPurpose}
                  </p>
                </div>

                {/* RACI Ownership & Governance Bar (ISO 42001) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] p-2.5 rounded-xl bg-slate-50 border border-slate-200 dark:border-slate-800">
                  <div>
                    <span className="text-[10px] text-slate-500 block font-semibold">Dono do Processo (Business Owner):</span>
                    <span className="font-bold text-slate-900 truncate block">{sipoc.processOwner}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block font-semibold">Guardião Técnico (Tech Lead):</span>
                    <span className="font-bold text-slate-900 truncate block">{sipoc.technicalCustodian}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block font-semibold">Status de Homologação:</span>
                    <span className={`inline-block px-2 py-0.5 text-[10px] font-mono font-bold rounded ${
                      sipoc.governanceStatus === 'HOMOLOGADO' 
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}>
                      {sipoc.governanceStatus === 'HOMOLOGADO' ? '✓ HOMOLOGADO' : '🟡 PENDENTE DE COMITÊ'}
                    </span>
                  </div>
                </div>

                {/* SIPOC Flow (Input ➔ Process ➔ Output) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs">
                  
                  {/* Step 1: Input */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <div className="text-[10px] font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                      <span>1. Entrada (Input)</span>
                    </div>
                    <p className="text-[11px] text-slate-700 leading-tight">
                      {sipoc.input}
                    </p>
                    <span className="text-[10px] text-slate-500 block font-mono">
                      Origem: {sipoc.supplier}
                    </span>
                  </div>

                  {/* Step 2: Process */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <div className="text-[10px] font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                      <span>2. Processamento</span>
                    </div>
                    <p className="text-[11px] text-slate-700 leading-tight">
                      {sipoc.process}
                    </p>
                    <span className="text-[10px] text-slate-500 block font-mono">
                      Supervisão: {agent.oversightLevel || 'l2_human_review'}
                    </span>
                  </div>

                  {/* Step 3: Output */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <div className="text-[10px] font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                      <span>3. Saída (Output)</span>
                    </div>
                    <p className="text-[11px] text-slate-700 leading-tight">
                      {sipoc.output}
                    </p>
                    <span className="text-[10px] text-slate-500 block font-mono">
                      Destino: {sipoc.customer}
                    </span>
                  </div>

                </div>

                {/* 🔒 Sober Enterprise Feature Card (Teaser) */}
                <div className="relative rounded-xl border border-slate-200 bg-slate-50 overflow-hidden p-3 group">
                  {/* Blurred Background Content */}
                  <div className="filter blur-[3px] select-none pointer-events-none opacity-40 space-y-1 text-[11px] text-slate-600 dark:text-slate-400">
                    <div className="flex items-center justify-between font-mono">
                      <span>Telemetria de Tokens em Tempo Real: 142.420 tokens/dia</span>
                      <span className="text-emerald-700">Drift: 0.04% (Estável)</span>
                    </div>
                    <div className="flex items-center justify-between font-mono">
                      <span>Workflow de Aprovação de Deploy: 2/2 Aprovadores (CISO + DPO)</span>
                      <span>Logs Imutáveis: SHA-256 Validado</span>
                    </div>
                  </div>

                  {/* Floating Overlay with Lock */}
                  <div className="absolute inset-0 bg-slate-900/85 backdrop-blur-[2px] flex items-center justify-between px-4 py-2">
                    <div className="flex items-center space-x-2.5">
                      <div className="p-1.5 rounded-lg bg-slate-800 text-slate-200 border border-slate-700">
                        <Lock className="w-3.5 h-3.5 text-slate-300" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white block">
                          Gestão Contínua do Ciclo de Vida & Drift de Modelo
                        </span>
                        <span className="text-[10px] text-slate-300 block">
                          Workflow de aprovação, telemetria em produção e guardrails ativos
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => setShowEnterpriseModal(true)}
                      className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-900 text-[11px] font-bold flex items-center space-x-1 shadow-xs cursor-pointer transition-all shrink-0"
                    >
                      <span>Módulo Enterprise</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Expanded Technical Details (Tools & Governance) */}
                {isExpanded && (
                  <div className="pt-2 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs animate-in fade-in">
                    <div>
                      <span className="text-[10px] text-slate-500 block mb-1 font-bold">Ferramentas & Integrações Declaradas:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {agent.tools && agent.tools.length > 0 ? (
                          agent.tools.map((t, i) => (
                            <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-mono rounded border border-slate-200 dark:border-slate-800">
                              🛠️ {t}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-slate-500 italic">Chamada direta ao LLM sem tools externas</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 block mb-1 font-bold">Diretriz EU AI Act & Supervisão:</span>
                      <div className="text-[11px] text-slate-800 font-mono font-medium">
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

      {/* Shadow AI & Direct API Call Governance Section */}
      {shadowAI.length > 0 && (
        <div className="bg-white dark:bg-[#111827] p-5 rounded-2xl border border-amber-200 space-y-4 shadow-2xs">
          <div className="flex items-center space-x-2 text-amber-800">
            <AlertCircle className="w-5 h-5 text-amber-700" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Governança de Modelos & Chamadas Diretas de IA ({shadowAI.length} detectadas)
            </h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Chamadas diretas a modelos de linguagem identificadas no código. Mapeadas para inclusão automática no catálogo de conformidade e auditoria de tokens.
          </p>

          <div className="space-y-2">
            {shadowAI.map((item, i) => {
              const displayProvider = item.provider === 'unknown' ? 'PIPELINE LLM' : item.provider;
              const displayModel = !item.modelId || item.modelId === 'unknown' ? 'Motor de Inferência de IA' : item.modelId;

              return (
                <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="space-y-0.5">
                    <span className="font-mono text-slate-900 font-bold">{item.file}</span>
                    <p className="text-[11px] text-slate-500">{item.reason}</p>
                  </div>
                  <span className="px-2.5 py-1 text-[10px] bg-white text-slate-800 border border-slate-300 rounded-lg font-mono font-bold shrink-0 shadow-2xs">
                    {displayProvider} • {displayModel}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Enterprise Suite Upsell Banner */}
      <div className="bg-white dark:bg-[#111827] p-6 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-slate-800">
            <Sparkles className="w-4 h-4 text-slate-700 dark:text-slate-300" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">ComplyPRO Enterprise Governance Suite</h4>
          </div>
          <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
            Deseja orquestrar esteiras de aprovação de deploy, monitoramento de deriva de modelo (Drift) e inventário ativo de agentes em tempo real com auditoria ISO 42001?
          </p>
        </div>

        <button
          onClick={() => setShowEnterpriseModal(true)}
          className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center space-x-2 shadow-xs cursor-pointer transition-all shrink-0"
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
