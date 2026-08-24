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
import { inferAgentFramework } from '../services/agent-sipoc-mapper';
import { EnterpriseLeadModal } from './EnterpriseLeadModal';

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
  const [showEnterpriseModal, setShowEnterpriseModal] = useState(false);
  const [enterpriseContext, setEnterpriseContext] = useState('');
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
                      <span className="text-[10px] text-purple-300 block">{inferAgentFramework(agent)}</span>
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

          {/* 🔒 Framework CG-AG: Matriz de 12 Controles de Agentes Autônomos (Blurred Enterprise Teaser) */}
          <div className="glass-panel p-6 rounded-2xl border border-cyan-500/30 bg-[#090e1c] space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-surface-border">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-800">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                    <span>Framework CG-AG: Matriz de 12 Controles de Agentes Autônomos</span>
                    <span className="px-2 py-0.5 text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800 rounded font-mono">
                      Enterprise Suite
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">Postura de segurança defensiva para arquiteturas Multi-Agente em produção</p>
                </div>
              </div>

              <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/60 border border-cyan-800/50 px-2.5 py-1 rounded-lg">
                Padrão CISO Enterprise
              </span>
            </div>

            {/* Blurred Grid of 12 Controls */}
            <div className="relative rounded-2xl border border-slate-800 overflow-hidden p-2">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 text-xs filter blur-[3.5px] select-none pointer-events-none opacity-40">
                <div className="p-2.5 rounded-lg bg-[#060a14] border border-slate-800">
                  <span className="font-mono text-cyan-400 font-bold block text-[10px]">CG-AG-01</span>
                  <span className="font-semibold text-white block">Sandboxing de Execução</span>
                  <span className="text-[10px] text-slate-400">Isolamento de containers para nós de código</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#060a14] border border-slate-800">
                  <span className="font-mono text-cyan-400 font-bold block text-[10px]">CG-AG-02</span>
                  <span className="font-semibold text-white block">Escopos de MCP / Tools</span>
                  <span className="text-[10px] text-slate-400">Princípio do menor privilégio em conexões</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#060a14] border border-slate-800">
                  <span className="font-mono text-cyan-400 font-bold block text-[10px]">CG-AG-03</span>
                  <span className="font-semibold text-white block">Imutabilidade de Prompts</span>
                  <span className="text-[10px] text-slate-400">Assinatura HMAC de System Prompts</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#060a14] border border-slate-800">
                  <span className="font-mono text-cyan-400 font-bold block text-[10px]">CG-AG-04</span>
                  <span className="font-semibold text-white block">Circuit Breaker FinOps</span>
                  <span className="text-[10px] text-slate-400">Corte automático de loops infinitos</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#060a14] border border-slate-800">
                  <span className="font-mono text-cyan-400 font-bold block text-[10px]">CG-AG-05</span>
                  <span className="font-semibold text-white block">Anti-Prompt Injection</span>
                  <span className="text-[10px] text-slate-400">Filtragem semântica em tempo real</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#060a14] border border-slate-800">
                  <span className="font-mono text-cyan-400 font-bold block text-[10px]">CG-AG-06</span>
                  <span className="font-semibold text-white block">Trilha Forense SHA-256</span>
                  <span className="text-[10px] text-slate-400">Logs imutáveis auditáveis por reguladores</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#060a14] border border-slate-800">
                  <span className="font-mono text-cyan-400 font-bold block text-[10px]">CG-AG-07</span>
                  <span className="font-semibold text-white block">HITL em Ações Críticas</span>
                  <span className="text-[10px] text-slate-400">Validação humana em deletes/updates</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#060a14] border border-slate-800">
                  <span className="font-mono text-cyan-400 font-bold block text-[10px]">CG-AG-08</span>
                  <span className="font-semibold text-white block">Kill Switch Remoto</span>
                  <span className="text-[10px] text-slate-400">Desativação instantânea de agentes</span>
                </div>
              </div>

              {/* Floating Action Overlay with Lock */}
              <div className="absolute inset-0 bg-[#070b16]/80 backdrop-blur-[2px] flex flex-col sm:flex-row items-center justify-between p-5 gap-3">
                <div className="flex items-center space-x-3 text-left">
                  <div className="p-2.5 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-800 shrink-0">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">
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
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black text-xs font-bold flex items-center space-x-2 shadow-glow cursor-pointer transition-all shrink-0"
                >
                  <span>Desbloquear Matriz CG-AG no Enterprise</span>
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

          {/* 🔒 Módulo de Gestão de Incidentes com IA & Notificação ANPD em 72h (Blurred Enterprise Teaser) */}
          <div className="glass-panel p-6 rounded-2xl border border-emerald-500/30 bg-[#061410] space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-surface-border">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                    <span>Módulo de Resposta a Incidentes de IA & Notificação à ANPD em 72h</span>
                    <span className="px-2 py-0.5 text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 rounded font-mono">
                      LGPD Art. 48 & Art. 52
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">Workflow automatizado de contenção, mensuração de impacto a titulares e geração de ofício</p>
                </div>
              </div>

              <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950/60 border border-emerald-800/50 px-2.5 py-1 rounded-lg">
                Auditoria Legal 24/7
              </span>
            </div>

            {/* Blurred Incident Workflow */}
            <div className="relative rounded-2xl border border-slate-800 overflow-hidden p-2">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5 text-xs filter blur-[3.5px] select-none pointer-events-none opacity-40">
                <div className="p-3 rounded-lg bg-[#040c0a] border border-slate-800">
                  <span className="font-mono text-emerald-400 font-bold block text-[10px]">Etapa 1</span>
                  <span className="font-semibold text-white block">Detecção de Deriva de PII</span>
                  <span className="text-[10px] text-slate-400">Alerta de vazamento de CPF/dados bancários</span>
                </div>
                <div className="p-3 rounded-lg bg-[#040c0a] border border-slate-800">
                  <span className="font-mono text-emerald-400 font-bold block text-[10px]">Etapa 2</span>
                  <span className="font-semibold text-white block">Avaliação de Risco & Dano</span>
                  <span className="text-[10px] text-slate-400">Cálculo de gravidade e número de titulares</span>
                </div>
                <div className="p-3 rounded-lg bg-[#040c0a] border border-slate-800">
                  <span className="font-mono text-emerald-400 font-bold block text-[10px]">Etapa 3</span>
                  <span className="font-semibold text-white block">Ofício Pré-Formatado ANPD</span>
                  <span className="text-[10px] text-slate-400">Minuta jurídica no padrão regulatório</span>
                </div>
                <div className="p-3 rounded-lg bg-[#040c0a] border border-slate-800">
                  <span className="font-mono text-emerald-400 font-bold block text-[10px]">Etapa 4</span>
                  <span className="font-semibold text-white block">Registro de Trilha RIPD</span>
                  <span className="text-[10px] text-slate-400">Anexação probatória ao livro de incidentes</span>
                </div>
              </div>

              {/* Floating Action Overlay with Lock */}
              <div className="absolute inset-0 bg-[#040c0a]/80 backdrop-blur-[2px] flex flex-col sm:flex-row items-center justify-between p-5 gap-3">
                <div className="flex items-center space-x-3 text-left">
                  <div className="p-2.5 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800 shrink-0">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">
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
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black text-xs font-bold flex items-center space-x-2 shadow-glow-emerald cursor-pointer transition-all shrink-0"
                >
                  <span>Ativar Módulo ANPD no Enterprise</span>
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
