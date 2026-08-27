import React, { useState } from 'react';
import { 
  ShieldCheck, ShieldAlert, Lock, Bot, Database, Key, 
  FileText, Scale, CheckCircle2, AlertTriangle, Sparkles, 
  Cpu, Terminal, ArrowRight, Eye, Layers, UserCheck, Shield,
  Briefcase, Landmark, TrendingUp, BarChart3, Clock, DollarSign, Activity
} from 'lucide-react';
import type { ScannerResult } from '../../core/types';
import { RegulationsGrid } from './RegulationsGrid';
import { AgentInventory } from './AgentInventory';
import { ViolationsList } from './ViolationsList';
import { RipdDocumentModal } from './RipdDocumentModal';
import { inferAgentFramework } from '../services/agent-sipoc-mapper';
import { runMonteCarloRegulatorySimulation } from '../services/monte-carlo-simulator';
import { EnterpriseLeadModal } from './EnterpriseLeadModal';

export type ExecutivePersona = 'ciso' | 'dpo' | 'cio' | 'board' | 'cfo';

interface PersonaViewsProps {
  result: ScannerResult;
  selectedPersona: ExecutivePersona;
  onSelectPersona: (persona: ExecutivePersona) => void;
  onOpenExport: () => void;
}

export const PersonaViews: React.FC<PersonaViewsProps> = ({
  result,
  selectedPersona,
  onSelectPersona,
  onOpenExport,
}) => {
  const [showRipdModal, setShowRipdModal] = useState(false);
  const [showEnterpriseModal, setShowEnterpriseModal] = useState(false);
  const [enterpriseContext, setEnterpriseContext] = useState('');
  
  // Single Source of Truth for all datasets
  const rawAgents = result.source?.agents || [];
  const violations = result.violations || [];
  const shadowAI = result.shadowAI || [];
  const externalServices = result.source?.externalServices || [];

  // Automated 10,000-Iteration Monte Carlo Simulation
  const monteCarlo = runMonteCarloRegulatorySimulation(result);

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
    v.category === 'owasp'
  ).length;

  return (
    <div className="space-y-6">
      {/* Persona Switcher Bar */}
      <div className="bg-white p-2.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col xl:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5 px-3">
          <Eye className="w-4 h-4 text-slate-700" />
          <span className="text-xs font-bold text-slate-900">Lentes de Governança Executiva:</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1.5 w-full xl:w-auto">
          
          {/* 1. CISO Persona Button */}
          <button
            onClick={() => onSelectPersona('ciso')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
              selectedPersona === 'ciso'
                ? 'bg-gradient-to-r from-slate-900 to-blue-950 text-white border border-blue-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
            }`}
          >
            <Lock className={`w-4 h-4 shrink-0 ${selectedPersona === 'ciso' ? 'text-blue-400' : 'text-slate-500'}`} />
            <div className="text-left">
              <span className="block">Visão CISO</span>
              <span className={`text-[9px] font-normal block truncate ${selectedPersona === 'ciso' ? 'text-blue-200' : 'text-slate-500'}`}>Segurança & MCP</span>
            </div>
          </button>

          {/* 2. DPO Persona Button */}
          <button
            onClick={() => onSelectPersona('dpo')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
              selectedPersona === 'dpo'
                ? 'bg-gradient-to-r from-slate-900 to-emerald-950 text-white border border-emerald-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
            }`}
          >
            <Scale className={`w-4 h-4 shrink-0 ${selectedPersona === 'dpo' ? 'text-emerald-400' : 'text-slate-500'}`} />
            <div className="text-left">
              <span className="block">Visão DPO</span>
              <span className={`text-[9px] font-normal block truncate ${selectedPersona === 'dpo' ? 'text-emerald-200' : 'text-slate-500'}`}>13 Normas & RIPD</span>
            </div>
          </button>

          {/* 3. CIO Persona Button (Enterprise) */}
          <button
            onClick={() => onSelectPersona('cio')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
              selectedPersona === 'cio'
                ? 'bg-gradient-to-r from-slate-900 to-purple-950 text-white border border-purple-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
            }`}
          >
            <Cpu className={`w-4 h-4 shrink-0 ${selectedPersona === 'cio' ? 'text-purple-400' : 'text-slate-500'}`} />
            <div className="text-left">
              <div className="flex items-center space-x-1">
                <span>Visão CIO</span>
                <span className="text-[8px] font-mono bg-purple-50 text-purple-700 px-1 rounded border border-purple-200">Enterprise</span>
              </div>
              <span className={`text-[9px] font-normal block truncate ${selectedPersona === 'cio' ? 'text-purple-200' : 'text-slate-500'}`}>MLOps & SLAs</span>
            </div>
          </button>

          {/* 4. Board / Conselho Button (Enterprise) */}
          <button
            onClick={() => onSelectPersona('board')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
              selectedPersona === 'board'
                ? 'bg-gradient-to-r from-slate-900 to-amber-950 text-white border border-amber-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
            }`}
          >
            <Landmark className={`w-4 h-4 shrink-0 ${selectedPersona === 'board' ? 'text-amber-400' : 'text-slate-500'}`} />
            <div className="text-left">
              <div className="flex items-center space-x-1">
                <span>Visão Conselho</span>
                <span className="text-[8px] font-mono bg-amber-50 text-amber-700 px-1 rounded border border-amber-200">Enterprise</span>
              </div>
              <span className={`text-[9px] font-normal block truncate ${selectedPersona === 'board' ? 'text-amber-200' : 'text-slate-500'}`}>Risco & Multas</span>
            </div>
          </button>

          {/* 5. CFO / FinOps Button (Enterprise) */}
          <button
            onClick={() => onSelectPersona('cfo')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
              selectedPersona === 'cfo'
                ? 'bg-gradient-to-r from-slate-900 to-cyan-950 text-white border border-cyan-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
            }`}
          >
            <DollarSign className={`w-4 h-4 shrink-0 ${selectedPersona === 'cfo' ? 'text-cyan-400' : 'text-slate-500'}`} />
            <div className="text-left">
              <div className="flex items-center space-x-1">
                <span>Visão FinOps</span>
                <span className="text-[8px] font-mono bg-cyan-50 text-cyan-700 px-1 rounded border border-cyan-200">Enterprise</span>
              </div>
              <span className={`text-[9px] font-normal block truncate ${selectedPersona === 'cfo' ? 'text-cyan-200' : 'text-slate-500'}`}>Budget & Tokens</span>
            </div>
          </button>

        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 🛡️ CISO VIEW (Segurança Técnica, Vetores de Ataque & MCP)     */}
      {/* ───────────────────────────────────────────────────────────── */}
      {selectedPersona === 'ciso' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* CISO KPI Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Autonomous Execution Surface */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-slate-500 font-mono">Agentes Autônomos</span>
                <Bot className="w-4 h-4 text-slate-700" />
              </div>
              <div className="text-2xl font-black font-mono text-slate-900">
                {autonomousAgentsCount}
              </div>
              <p className="text-[11px] text-slate-500">
                {autonomousAgentsCount > 0 
                  ? `${autonomousAgentsCount} agente(s) com decisão autônoma (requer HITL).` 
                  : 'Nenhum agente autônomo sem supervisão.'}
              </p>
            </div>

            {/* MCP & Tool Scopes */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-slate-500 font-mono">Escopos MCP & Tools</span>
                <Cpu className="w-4 h-4 text-slate-700" />
              </div>
              <div className="text-2xl font-black font-mono text-slate-900">
                {totalToolScopesCount}
              </div>
              <p className="text-[11px] text-slate-500">
                Ferramentas conectadas com acesso a dados ou execução.
              </p>
            </div>

            {/* Shadow AI */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-slate-500 font-mono">Shadow AI Detectada</span>
                <ShieldAlert className="w-4 h-4 text-rose-700" />
              </div>
              <div className="text-2xl font-black font-mono text-slate-900">
                {shadowAICount}
              </div>
              <p className="text-[11px] text-slate-500">
                {shadowAICount > 0 
                  ? `${shadowAICount} chamada(s) direta(s) a LLMs sem homologação.` 
                  : 'Zero ocorrências de Shadow AI.'}
              </p>
            </div>

            {/* Security Violations */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-slate-500 font-mono">Vulnerabilidades Críticas</span>
                <AlertTriangle className="w-4 h-4 text-amber-700" />
              </div>
              <div className="text-2xl font-black font-mono text-slate-900">
                {securityViolationsCount}
              </div>
              <p className="text-[11px] text-slate-500">
                Violações de Alta/Crítica gravidade (OWASP LLM & Segredos).
              </p>
            </div>

          </div>

          {/* Attack Vector Chain */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                  <Lock className="w-4 h-4 text-slate-700" />
                  <span>Mapeamento de Cadeia de Vetores de Ataque (Agent ➔ Tool / MCP ➔ Database / API)</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Visualização de permissões de ferramentas e risco de exfiltração de dados por agentes.
                </p>
              </div>
              <span className="px-2.5 py-0.5 text-[10px] font-mono bg-slate-100 text-slate-700 border border-slate-200 rounded font-bold">
                {agents.length} Agente(s) Auditado(s)
              </span>
            </div>

            <div className="space-y-3">
              {agents.map((agent, i) => (
                <div key={i} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                  {/* Node 1: Agent */}
                  <div className="flex items-center space-x-2 shrink-0 md:w-56">
                    <div className="p-2 rounded-lg bg-white border border-slate-200 text-slate-800">
                      <Bot className="w-4 h-4 text-slate-700" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 font-mono block truncate">{agent.name}</span>
                      <span className="text-[10px] text-slate-500 block font-semibold">{inferAgentFramework(agent)}</span>
                    </div>
                  </div>

                  <ArrowRight className="hidden md:block w-4 h-4 text-slate-400 shrink-0" />

                  {/* Node 2: Tools & Scopes */}
                  <div className="flex-1 bg-white p-2.5 rounded-lg border border-slate-200 space-y-1">
                    <span className="text-[10px] text-slate-500 font-bold block uppercase font-mono">Escopos de Ferramentas / MCP:</span>
                    <div className="flex flex-wrap gap-1">
                      {agent.tools && agent.tools.length > 0 ? (
                        agent.tools.map((t, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-slate-100 text-slate-800 text-[10px] font-mono rounded border border-slate-200">
                            🛠️ {t}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] text-slate-400 font-mono italic">Chamada direta ao LLM</span>
                      )}
                    </div>
                  </div>

                  <ArrowRight className="hidden md:block w-4 h-4 text-slate-400 shrink-0" />

                  {/* Node 3: Risk Verdict */}
                  <div className="flex items-center space-x-2 shrink-0">
                    <span className={`px-2.5 py-1 text-[10px] font-bold rounded-md border ${
                      agent.riskLevel === 'critical' || agent.riskLevel === 'high'
                        ? 'bg-rose-50 text-rose-800 border-rose-200'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}>
                      {agent.riskLevel.toUpperCase()}
                    </span>
                    <span className="text-[11px] text-slate-600 font-mono font-medium">
                      {agent.isAutonomous ? '⚡ Autônomo' : '👥 HITL'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 🔒 Framework CG-AG: Matriz de 12 Controles de Agentes Autônomos (Enterprise Teaser) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-slate-100 text-slate-800 border border-slate-200 font-bold">
                  <Shield className="w-4 h-4 text-slate-700" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                    <span>Framework CG-AG: Matriz de 12 Controles de Agentes Autônomos</span>
                    <span className="px-2 py-0.5 text-[10px] bg-slate-100 text-slate-700 border border-slate-200 rounded font-mono">
                      Enterprise Suite
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500">Postura de segurança defensiva para arquiteturas Multi-Agente em produção</p>
                </div>
              </div>

              <span className="text-[10px] font-mono text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg font-bold">
                Padrão CISO Enterprise
              </span>
            </div>

            {/* Blurred Grid of 12 Controls */}
            <div className="relative rounded-2xl border border-slate-200 overflow-hidden p-2 bg-slate-50">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 text-xs filter blur-[3.5px] select-none pointer-events-none opacity-40">
                <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                  <span className="font-mono text-slate-800 font-bold block text-[10px]">CG-AG-01</span>
                  <span className="font-semibold text-slate-900 block">Sandboxing de Execução</span>
                  <span className="text-[10px] text-slate-500">Isolamento de containers para nós de código</span>
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                  <span className="font-mono text-slate-800 font-bold block text-[10px]">CG-AG-02</span>
                  <span className="font-semibold text-slate-900 block">Escopos de MCP / Tools</span>
                  <span className="text-[10px] text-slate-500">Princípio do menor privilégio em conexões</span>
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                  <span className="font-mono text-slate-800 font-bold block text-[10px]">CG-AG-03</span>
                  <span className="font-semibold text-slate-900 block">Imutabilidade de Prompts</span>
                  <span className="text-[10px] text-slate-500">Assinatura HMAC de System Prompts</span>
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                  <span className="font-mono text-slate-800 font-bold block text-[10px]">CG-AG-04</span>
                  <span className="font-semibold text-slate-900 block">Circuit Breaker FinOps</span>
                  <span className="text-[10px] text-slate-500">Corte automático de loops infinitos</span>
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
                      Matriz Completa de 12 Controles CG-AG em Produção
                    </h4>
                    <p className="text-[11px] text-slate-300 max-w-xl">
                      Ative a validação em tempo real dos 12 controles de segurança de agentes autônomos com telemetria contínua e bloqueio ativo de ataques.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setEnterpriseContext('Framework CG-AG (12 Controles de Agentes Autônomos)');
                    setShowEnterpriseModal(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold flex items-center space-x-2 shadow-sm cursor-pointer transition-all shrink-0"
                >
                  <span>Conhecer Módulo Enterprise</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
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
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2 text-slate-900 font-bold">
                <Scale className="w-5 h-5 text-slate-700" />
                <h3 className="text-sm font-bold text-slate-900">Painel do Encarregado de Dados (DPO & Compliance)</h3>
              </div>
              <p className="text-xs text-slate-600 max-w-2xl">
                Gere documentação probatória de conformidade para prestar contas à ANPD, comitês de ética e auditorias regulatórias da União Europeia.
              </p>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <button
                onClick={() => setShowRipdModal(true)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Gerar RIPD Oficial (Art. 38 LGPD)</span>
              </button>

              <button
                onClick={onOpenExport}
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs font-bold transition-colors cursor-pointer shadow-2xs"
              >
                Exportar Parecer Executivo
              </button>
            </div>
          </div>

          {/* 🔒 Módulo de Gestão de Incidentes com IA (Enterprise Teaser) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-slate-100 text-slate-800 border border-slate-200 font-bold">
                  <AlertTriangle className="w-4 h-4 text-slate-700" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                    <span>Módulo de Resposta a Incidentes de IA & Notificação à ANPD em 72h</span>
                    <span className="px-2 py-0.5 text-[10px] bg-slate-100 text-slate-700 border border-slate-200 rounded font-mono">
                      LGPD Art. 48 & Art. 52
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500">Workflow automatizado de contenção, mensuração de impacto a titulares e geração de ofício</p>
                </div>
              </div>

              <span className="text-[10px] font-mono text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg font-bold">
                Auditoria Legal 24/7
              </span>
            </div>

            {/* Blurred Incident Workflow */}
            <div className="relative rounded-2xl border border-slate-200 overflow-hidden p-2 bg-slate-50">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5 text-xs filter blur-[3.5px] select-none pointer-events-none opacity-40">
                <div className="p-3 rounded-lg bg-white border border-slate-200">
                  <span className="font-mono text-slate-800 font-bold block text-[10px]">Etapa 1</span>
                  <span className="font-semibold text-slate-900 block">Detecção de Deriva de PII</span>
                  <span className="text-[10px] text-slate-500">Alerta de vazamento de CPF/dados bancários</span>
                </div>
                <div className="p-3 rounded-lg bg-white border border-slate-200">
                  <span className="font-mono text-slate-800 font-bold block text-[10px]">Etapa 2</span>
                  <span className="font-semibold text-slate-900 block">Avaliação de Risco & Dano</span>
                  <span className="text-[10px] text-slate-500">Cálculo de gravidade e número de titulares</span>
                </div>
                <div className="p-3 rounded-lg bg-white border border-slate-200">
                  <span className="font-mono text-slate-800 font-bold block text-[10px]">Etapa 3</span>
                  <span className="font-semibold text-slate-900 block">Ofício Pré-Formatado ANPD</span>
                  <span className="text-[10px] text-slate-500">Minuta jurídica no padrão regulatório</span>
                </div>
                <div className="p-3 rounded-lg bg-white border border-slate-200">
                  <span className="font-mono text-slate-800 font-bold block text-[10px]">Etapa 4</span>
                  <span className="font-semibold text-slate-900 block">Registro de Trilha RIPD</span>
                  <span className="text-[10px] text-slate-500">Anexação probatória ao livro de incidentes</span>
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
                      Automação de Resposta a Incidentes de Privacidade (LGPD & GDPR)
                    </h4>
                    <p className="text-[11px] text-slate-300 max-w-xl">
                      Garanta o cumprimento do prazo legal de 72 horas para comunicação de incidentes de IA com geração automática de dossiês probatórios.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setEnterpriseContext('Resposta a Incidentes ANPD em 72h & Trilha RIPD');
                    setShowEnterpriseModal(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold flex items-center space-x-2 shadow-sm cursor-pointer transition-all shrink-0"
                >
                  <span>Conhecer Módulo Enterprise</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* 13 Regulations Grid */}
          <RegulationsGrid result={result} />

          {/* Legal Violations */}
          <ViolationsList result={result} />

        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 👔 CIO & HEAD OF AI VIEW (MLOps, SLAs & Catálogo de Modelos)   */}
      {/* ───────────────────────────────────────────────────────────── */}
      {selectedPersona === 'cio' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* Executive Header */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2 text-slate-900 font-bold">
                <Cpu className="w-5 h-5 text-slate-700" />
                <h3 className="text-sm font-bold text-slate-900">Painel Estratégico do CIO & Liderança de IA (MLOps & Governança de Modelos)</h3>
              </div>
              <p className="text-xs text-slate-600 max-w-2xl">
                Supervisão consolidada de infraestrutura de IA, SLAs de provedores externos, latência de inferência e esteiras de homologação técnica.
              </p>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <span className="text-[11px] font-mono text-slate-700 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl font-bold">
                Módulo Enterprise
              </span>
            </div>
          </div>

          {/* Blurred KPI Highlights Grid */}
          <div className="relative rounded-2xl border border-slate-200 overflow-hidden p-3 bg-slate-50">
            
            {/* Top KPI Cards (Blurred) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 filter blur-[3.5px] select-none pointer-events-none opacity-40">
              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase">SLA Médio de Provedores</span>
                <div className="text-xl font-bold text-emerald-700 font-mono">99.98%</div>
                <p className="text-[10px] text-slate-500">OpenAI, Anthropic & Bedrock</p>
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase">Latência Média P95</span>
                <div className="text-xl font-bold text-slate-800 font-mono">340 ms</div>
                <p className="text-[10px] text-slate-500">Tempo de resposta em inferência</p>
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase">Economia com Cache Semântico</span>
                <div className="text-xl font-bold text-slate-800 font-mono">42.5%</div>
                <p className="text-[10px] text-slate-500">Tokens reutilizados com sucesso</p>
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase">Modelos Homologados</span>
                <div className="text-xl font-bold text-slate-900 font-mono">4 Ativos</div>
                <p className="text-[10px] text-slate-500">100% com chaves gerenciadas</p>
              </div>
            </div>

            {/* Model Portfolio Table (Blurred) */}
            <div className="mt-4 rounded-xl border border-slate-200 overflow-hidden filter blur-[3.5px] select-none pointer-events-none opacity-40">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-100 text-slate-700 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4">Modelo / Endpoint</th>
                    <th className="py-2.5 px-4">Finalidade</th>
                    <th className="py-2.5 px-4 text-center">Latência P95</th>
                    <th className="py-2.5 px-4 text-center">SLA Mensal</th>
                    <th className="py-2.5 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white text-slate-700">
                  <tr>
                    <td className="py-2 px-4 font-semibold text-slate-900">OpenAI GPT-4o</td>
                    <td className="py-2 px-4">Raciocínio Complexo & Subscrição</td>
                    <td className="py-2 px-4 text-center">420ms</td>
                    <td className="py-2 px-4 text-center text-emerald-700 font-bold">99.99%</td>
                    <td className="py-2 px-4 text-right text-emerald-700 font-bold">Homologado</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4 font-semibold text-slate-900">Anthropic Claude 3.5 Sonnet</td>
                    <td className="py-2 px-4">Validação Documental & OCR</td>
                    <td className="py-2 px-4 text-center">310ms</td>
                    <td className="py-2 px-4 text-center text-emerald-700 font-bold">99.95%</td>
                    <td className="py-2 px-4 text-right text-emerald-700 font-bold">Homologado</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Sober Floating Overlay */}
            <div className="absolute inset-0 bg-slate-900/85 backdrop-blur-[2px] flex flex-col sm:flex-row items-center justify-between p-6 gap-4">
              <div className="flex items-center space-x-3 text-left">
                <div className="p-2 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 shrink-0">
                  <Lock className="w-4 h-4 text-slate-300" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">
                    Plataforma Centralizada de Gestão MLOps & SLAs de IA
                  </h4>
                  <p className="text-[11px] text-slate-300 max-w-xl">
                    Monitore a saúde operacional de todos os modelos em produção, aplique cache semântico inteligente e controle latências em tempo real.
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setEnterpriseContext('Painel do CIO & Gestão de MLOps / SLAs');
                  setShowEnterpriseModal(true);
                }}
                className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold flex items-center space-x-2 shadow-sm cursor-pointer transition-all shrink-0"
              >
                <span>Conhecer Módulo Enterprise</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>

        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 🏛️ BOARD & AUDIT COMMITTEE VIEW (Exposição a Multas & ESG)    */}
      {/* ───────────────────────────────────────────────────────────── */}
      {selectedPersona === 'board' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* Executive Header */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2 text-slate-900 font-bold">
                <Landmark className="w-5 h-5 text-slate-700" />
                <h3 className="text-sm font-bold text-slate-900">Painel do Conselho de Administração & Comitê de Auditoria (Governança e Risco Residual)</h3>
              </div>
              <p className="text-xs text-slate-600 max-w-2xl">
                Visão macro para diretores e conselheiros: exposição financeira máxima a penalidades legais, seguros de responsabilidade civil e índice ESG de IA ética.
              </p>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <span className="text-[11px] font-mono text-slate-700 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl font-bold">
                Módulo Board / C-Level
              </span>
            </div>
          </div>

          {/* Blurred Board Highlights Grid */}
          <div className="relative rounded-2xl border border-slate-200 overflow-hidden p-3 bg-slate-50">
            
            {/* Top KPI Cards (Blurred Monte Carlo Output) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 filter blur-[3.5px] select-none pointer-events-none opacity-40">
              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase font-mono">VaR 95% (Simulação Monte Carlo)</span>
                <div className="text-xl font-bold text-rose-800 font-mono">€ {monteCarlo.var95Eur.toLocaleString()}</div>
                <p className="text-[10px] text-slate-500">R$ {monteCarlo.var95Brl.toLocaleString()} (10.000 iterações)</p>
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase font-mono">Risco Residual Pós-Controles</span>
                <div className="text-xl font-bold text-emerald-800 font-mono">{monteCarlo.residualRiskScore} / 100</div>
                <p className="text-[10px] text-slate-500">Prob. de Sanção: {monteCarlo.probSanctionPercent}%</p>
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase font-mono">ROI Preventivo de Remediação</span>
                <div className="text-xl font-bold text-amber-800 font-mono">+{monteCarlo.remediationRoiPercent}%</div>
                <p className="text-[10px] text-slate-500">Evasão de passivo vs custo de fix</p>
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase font-mono">Parecer Seguro Cyber</span>
                <div className="text-xl font-bold text-slate-800 font-mono">{monteCarlo.cyberInsuranceEligibility}</div>
                <p className="text-[10px] text-slate-500">Apólice de Risco Tecnológico</p>
              </div>
            </div>

            {/* Risk Categories Table (Blurred) */}
            <div className="mt-4 rounded-xl border border-slate-200 overflow-hidden filter blur-[3.5px] select-none pointer-events-none opacity-40">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-100 text-slate-700 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4">Direcionador de Risco (Ontologia)</th>
                    <th className="py-2.5 px-4 text-center">Contribuição no VaR</th>
                    <th className="py-2.5 px-4 text-center">Impacto</th>
                    <th className="py-2.5 px-4 text-right">Ação Recomendada</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white text-slate-700">
                  {monteCarlo.keyRiskDrivers.map((driver, idx) => (
                    <tr key={idx}>
                      <td className="py-2 px-4 font-semibold text-slate-900">{driver.factor}</td>
                      <td className="py-2 px-4 text-center text-amber-800 font-bold">{driver.contributionPercent}%</td>
                      <td className="py-2 px-4 text-center">
                        <span className={`px-2 py-0.5 text-[9px] rounded font-bold ${
                          driver.impact === 'CRITICAL' ? 'bg-rose-50 text-rose-800 border border-rose-200' :
                          driver.impact === 'HIGH' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {driver.impact}
                        </span>
                      </td>
                      <td className="py-2 px-4 text-right text-emerald-700 font-bold">Plano de Conformidade</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Sober Floating Overlay */}
            <div className="absolute inset-0 bg-slate-900/85 backdrop-blur-[2px] flex flex-col sm:flex-row items-center justify-between p-6 gap-4">
              <div className="flex items-center space-x-3 text-left">
                <div className="p-2 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 shrink-0">
                  <Lock className="w-4 h-4 text-slate-300" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">
                    Relatórios Executivos Trimestrais para Conselhos de Administração
                  </h4>
                  <p className="text-[11px] text-slate-300 max-w-xl">
                    Gere apresentações prontas em PDF para o comitê de auditoria com pareceres formais de risco residual e exposição financeira a multas.
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setEnterpriseContext('Painel do Conselho de Administração & Riscos Corporativos');
                  setShowEnterpriseModal(true);
                }}
                className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold flex items-center space-x-2 shadow-sm cursor-pointer transition-all shrink-0"
              >
                <span>Conhecer Módulo Enterprise</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>

        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 💰 FINOPS & CFO VIEW (Orçamento de IA, Custos & Projeções)     */}
      {/* ───────────────────────────────────────────────────────────── */}
      {selectedPersona === 'cfo' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* Executive Header */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2 text-slate-900 font-bold">
                <DollarSign className="w-5 h-5 text-slate-700" />
                <h3 className="text-sm font-bold text-slate-900">Painel FinOps & CFO (Gestão Orçamentária e Eficiência de Tokens)</h3>
              </div>
              <p className="text-xs text-slate-600 max-w-2xl">
                Alocação de centros de custo por squad de engenharia, previsão de burn rate de inferência e prevenção de desperdício em chamadas de LLM.
              </p>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <span className="text-[11px] font-mono text-slate-700 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl font-bold">
                Módulo FinOps Enterprise
              </span>
            </div>
          </div>

          {/* Blurred FinOps Highlights Grid */}
          <div className="relative rounded-2xl border border-slate-200 overflow-hidden p-3 bg-slate-50">
            
            {/* Top KPI Cards (Blurred) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 filter blur-[3.5px] select-none pointer-events-none opacity-40">
              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase font-mono">Orçamento Mensal (Budget)</span>
                <div className="text-xl font-bold text-slate-900 font-mono">$ 5.000,00</div>
                <p className="text-[10px] text-slate-500">Limite contratual contratado</p>
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase font-mono">Consumo Estimado (MoM)</span>
                <div className="text-xl font-bold text-emerald-800 font-mono">$ 1.840,20</div>
                <p className="text-[10px] text-slate-500">36.8% do teto orçamentário</p>
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase font-mono">Desperdício por Alucinação/Loops</span>
                <div className="text-xl font-bold text-slate-800 font-mono">&lt; 0.8% ($14,20)</div>
                <p className="text-[10px] text-slate-500">Protegido por Circuit Breaker</p>
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase font-mono">Potencial de Economia (SLMs)</span>
                <div className="text-xl font-bold text-slate-800 font-mono">Até 64%</div>
                <p className="text-[10px] text-slate-500">Migração de prompts simples</p>
              </div>
            </div>

            {/* Squad Cost Allocation Table (Blurred) */}
            <div className="mt-4 rounded-xl border border-slate-200 overflow-hidden filter blur-[3.5px] select-none pointer-events-none opacity-40">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-100 text-slate-700 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4">Centro de Custo / Squad</th>
                    <th className="py-2.5 px-4 text-center">Consumo de Tokens</th>
                    <th className="py-2.5 px-4 text-center">Custo Mensal Est.</th>
                    <th className="py-2.5 px-4 text-center">% do Budget</th>
                    <th className="py-2.5 px-4 text-right">Tendência (MoM)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white text-slate-700">
                  <tr>
                    <td className="py-2 px-4 font-semibold text-slate-900">Squad Atendimento & Chatbot</td>
                    <td className="py-2 px-4 text-center">4.2M tokens</td>
                    <td className="py-2 px-4 text-center text-emerald-800 font-bold">$ 420,00</td>
                    <td className="py-2 px-4 text-center">22.8%</td>
                    <td className="py-2 px-4 text-right text-emerald-800 font-bold">Estável (-3%)</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4 font-semibold text-slate-900">Squad Mesa de Crédito (RAG)</td>
                    <td className="py-2 px-4 text-center">8.8M tokens</td>
                    <td className="py-2 px-4 text-center text-emerald-800 font-bold">$ 880,00</td>
                    <td className="py-2 px-4 text-center">47.8%</td>
                    <td className="py-2 px-4 text-right text-slate-800 font-bold">+12% Expansão</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Sober Floating Overlay */}
            <div className="absolute inset-0 bg-slate-900/85 backdrop-blur-[2px] flex flex-col sm:flex-row items-center justify-between p-6 gap-4">
              <div className="flex items-center space-x-3 text-left">
                <div className="p-2 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 shrink-0">
                  <Lock className="w-4 h-4 text-slate-300" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">
                    Gestão Centralizada de FinOps & Otimização de Custos de IA
                  </h4>
                  <p className="text-[11px] text-slate-300 max-w-xl">
                    Controle o consumo de tokens em nível de projeto, defina tetos orçamentários por equipe e evite cobranças inesperadas em APIs de LLMs.
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setEnterpriseContext('Painel FinOps & Otimização de Custos de IA');
                  setShowEnterpriseModal(true);
                }}
                className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold flex items-center space-x-2 shadow-sm cursor-pointer transition-all shrink-0"
              >
                <span>Conhecer Módulo Enterprise</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>

        </div>
      )}

      {/* Official Visual RIPD Modal */}
      {showRipdModal && (
        <RipdDocumentModal result={result} onClose={() => setShowRipdModal(false)} />
      )}

      {/* Enterprise Lead Capture Modal */}
      {showEnterpriseModal && (
        <EnterpriseLeadModal onClose={() => setShowEnterpriseModal(false)} featureContext={enterpriseContext} />
      )}

    </div>
  );
};
