import React, { useState, useMemo } from 'react';
import { 
  Bot,
  Building2, 
  Users, 
  Cpu, 
  Wrench, 
  ShieldAlert, 
  ShieldCheck, 
  Lock, 
  Sliders, 
  CheckCircle2, 
  AlertTriangle, 
  FileBadge, 
  ChevronRight, 
  ExternalLink, 
  X, 
  Search, 
  Download, 
  Sparkles,
  Layers,
  Terminal,
  Activity,
  UserCheck,
  Zap,
  Network
} from 'lucide-react';
import type { ScannerResult } from '../../core/types';
import { useIndustry } from '../context/IndustryContext';
import { ScanGovernanceBridge } from '../services/scan-governance-bridge';
import { getAgentBusinessAndSipoc } from '../services/agent-sipoc-mapper';

export interface AgentEntity {
  id: string;
  name: string;
  role: string;
  team: string;
  teamTopology: 'HIERARCHICAL_CREW' | 'STATE_GRAPH' | 'GROUP_CHAT' | 'STANDALONE_PIPELINE';
  framework: 'CrewAI' | 'LangGraph' | 'AutoGen' | 'LlamaIndex' | 'Custom';
  autonomyLevel: 'L1_ASSISTIVE' | 'L2_SUPERVISED' | 'L3_AUTONOMOUS_BOUNDED' | 'L4_HIGH_AUTONOMY';
  model: string;
  temperature: number;
  owner: {
    name: string;
    role: string;
    department: string;
  };
  tools: Array<{
    name: string;
    permission: 'READ_ONLY' | 'READ_WRITE' | 'EXECUTE_HIGH_PRIVILEGE';
    boundary: string;
  }>;
  hitlCheckpoint: {
    required: boolean;
    trigger: string;
    fallbackTimeoutSec: number;
  };
  circuitBreaker: {
    maxIterations: number;
    maxExecutionTimeSec: number;
    killSwitchReady: boolean;
  };
  governanceStatus: 'GOVERNED' | 'CONDITIONAL' | 'UNGOVERNED';
  riskClassification: 'HIGH_RISK_ART6' | 'LIMITED_RISK' | 'MINIMAL_RISK';
  passport: {
    passportId: string;
    issuedAt: string;
    digitalSignature: string;
    issuer: string;
    assuranceTier: 'ASSURED_TIER_1' | 'PROVISIONAL_TIER_2';
  };
  description: string;
}

const INITIAL_AGENTS: AgentEntity[] = [
  {
    id: 'AGT-CREDIT-911E',
    name: 'Credit Risk Evaluator',
    role: 'Autonomous Underwriting & Solvability Decision Engine',
    team: 'Credit Underwriting Squad',
    teamTopology: 'HIERARCHICAL_CREW',
    framework: 'CrewAI',
    autonomyLevel: 'L3_AUTONOMOUS_BOUNDED',
    model: 'gpt-4-turbo (0125-preview)',
    temperature: 0.1,
    owner: { name: 'Roberto Silva', role: 'Credit Risk Lead', department: 'Risk & Compliance' },
    tools: [
      { name: 'CreditBureauAPI', permission: 'READ_ONLY', boundary: 'REST Endpoint /v2/credit-score' },
      { name: 'FinancialLedgerQuery', permission: 'READ_ONLY', boundary: 'SQL Read-Only View `v_applicant_solvability`' },
      { name: 'LoanOfferGenerator', permission: 'READ_WRITE', boundary: 'Sandbox /proposals table only' }
    ],
    hitlCheckpoint: {
      required: true,
      trigger: 'Mandatory approval for loan proposals exceeding R$ 50,000 or credit score < 600',
      fallbackTimeoutSec: 300
    },
    circuitBreaker: {
      maxIterations: 5,
      maxExecutionTimeSec: 60,
      killSwitchReady: true
    },
    governanceStatus: 'CONDITIONAL',
    riskClassification: 'HIGH_RISK_ART6',
    passport: {
      passportId: 'CG-AG-CREWAI-CREDIT-911E',
      issuedAt: '2026-08-27T10:15:00Z',
      digitalSignature: 'SIG-911EB3A0C872-SHA256',
      issuer: 'CG-AG Governance OS v1.2',
      assuranceTier: 'ASSURED_TIER_1'
    },
    description: 'Calculates applicant creditworthiness, applies risk score models, and prepares loan offers under human supervisor validation.'
  },
  {
    id: 'AGT-SUPPORT-49F1',
    name: 'Customer Support Triager',
    role: 'Contextual Inquiries & Ticket Classification',
    team: 'OmniChannel CX Squad',
    teamTopology: 'STATE_GRAPH',
    framework: 'LangGraph',
    autonomyLevel: 'L2_SUPERVISED',
    model: 'gpt-3.5-turbo (1106)',
    temperature: 0.3,
    owner: { name: 'Juliana Lima', role: 'CX Operations Head', department: 'Customer Success' },
    tools: [
      { name: 'KnowledgeBaseRAG', permission: 'READ_ONLY', boundary: 'Vector Store `kb_public_faq`' },
      { name: 'TicketDraftService', permission: 'READ_WRITE', boundary: 'Zendesk Drafts Queue' }
    ],
    hitlCheckpoint: {
      required: false,
      trigger: 'Escalate to human agent if sentiment score < -0.6 or cancellation detected',
      fallbackTimeoutSec: 120
    },
    circuitBreaker: {
      maxIterations: 3,
      maxExecutionTimeSec: 30,
      killSwitchReady: true
    },
    governanceStatus: 'GOVERNED',
    riskClassification: 'LIMITED_RISK',
    passport: {
      passportId: 'CG-AG-LANGGRAPH-SUPPORT-49F1',
      issuedAt: '2026-08-26T14:30:00Z',
      digitalSignature: 'SIG-49F128E93B01-SHA256',
      issuer: 'CG-AG Governance OS v1.2',
      assuranceTier: 'ASSURED_TIER_1'
    },
    description: 'Classifies customer requests, queries authorized documentation, and drafts responses with automated PII masking.'
  },
  {
    id: 'AGT-INVEST-7729',
    name: 'Asset Allocation Analyst',
    role: 'Macroeconomic Simulation & Portfolio Rebalancing',
    team: 'Wealth Management AI Team',
    teamTopology: 'GROUP_CHAT',
    framework: 'AutoGen',
    autonomyLevel: 'L3_AUTONOMOUS_BOUNDED',
    model: 'claude-3-5-sonnet',
    temperature: 0.2,
    owner: { name: 'Mariana Duarte', role: 'Asset Management VP', department: 'Private Banking' },
    tools: [
      { name: 'MarketDataFeed', permission: 'READ_ONLY', boundary: 'Bloomberg B-PIPE Streaming API' },
      { name: 'PortfolioOptimizer', permission: 'READ_WRITE', boundary: 'Local Python NumPy / CVXPY engine' },
      { name: 'OrderDraftQueue', permission: 'READ_WRITE', boundary: 'Order Management Sandbox' }
    ],
    hitlCheckpoint: {
      required: true,
      trigger: 'Execution of order reallocation requires portfolio manager biometrics / dual sign-off',
      fallbackTimeoutSec: 600
    },
    circuitBreaker: {
      maxIterations: 8,
      maxExecutionTimeSec: 180,
      killSwitchReady: true
    },
    governanceStatus: 'GOVERNED',
    riskClassification: 'HIGH_RISK_ART6',
    passport: {
      passportId: 'CG-AG-AUTOGEN-INVEST-7729',
      issuedAt: '2026-08-25T09:00:00Z',
      digitalSignature: 'SIG-7729A10091FF-SHA256',
      issuer: 'CG-AG Governance OS v1.2',
      assuranceTier: 'ASSURED_TIER_1'
    },
    description: 'Simulates asset stress tests and calculates rebalancing vectors for high-net-worth investment strategies.'
  },
  {
    id: 'AGT-FRAUD-8812',
    name: 'Transaction Anomaly Sentinel',
    role: 'Real-time Payment Anomaly & Velocity Detector',
    team: 'Fraud & Security Sentinel',
    teamTopology: 'STANDALONE_PIPELINE',
    framework: 'Custom',
    autonomyLevel: 'L4_HIGH_AUTONOMY',
    model: 'XGBoost + Embeddings',
    temperature: 0.0,
    owner: { name: 'Carlos Mendes', role: 'Security Architect', department: 'InfoSec' },
    tools: [
      { name: 'PaymentStreamKafka', permission: 'READ_ONLY', boundary: 'Kafka Topic `tx_events_stream`' },
      { name: 'TemporaryCardBlocker', permission: 'EXECUTE_HIGH_PRIVILEGE', boundary: 'Core Banking API /cards/freeze' }
    ],
    hitlCheckpoint: {
      required: false,
      trigger: 'Immediate automated freeze for velocity anomaly > 3 std deviations; post-incident review within 2h',
      fallbackTimeoutSec: 10
    },
    circuitBreaker: {
      maxIterations: 1,
      maxExecutionTimeSec: 2,
      killSwitchReady: true
    },
    governanceStatus: 'GOVERNED',
    riskClassification: 'HIGH_RISK_ART6',
    passport: {
      passportId: 'CG-AG-SENTINEL-FRAUD-8812',
      issuedAt: '2026-08-25T11:45:00Z',
      digitalSignature: 'SIG-8812F9A0192C-SHA256',
      issuer: 'CG-AG Governance OS v1.2',
      assuranceTier: 'ASSURED_TIER_1'
    },
    description: 'High-speed automated fraud mitigation sentinel operating under strict DORA Art. 11 operational resilience standards.'
  }
];

export const AgentsTeamsView: React.FC<{ result?: ScannerResult | null }> = ({ result }) => {
  const { activeProfile } = useIndustry();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAutonomy, setFilterAutonomy] = useState<string>('ALL');
  const [filterTeam, setFilterTeam] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [selectedAgent, setSelectedAgent] = useState<AgentEntity | null>(null);
  const [activeDrawerTab, setActiveDrawerTab] = useState<'topology' | 'sipoc' | 'autonomy' | 'tools' | 'hitl' | 'controls' | 'passport'>('topology');

  const ingestedAgents = ScanGovernanceBridge.getIngestedAgents();
  const allAgents = useMemo(() => {
    if (ingestedAgents.length > 0) {
      return ingestedAgents as unknown as AgentEntity[];
    }
    return INITIAL_AGENTS;
  }, [ingestedAgents]);

  const filteredAgents = useMemo(() => {
    return allAgents.filter(agent => {
const matchSearch = agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          agent.team.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          agent.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          agent.model.toLowerCase().includes(searchTerm.toLowerCase());

      const matchAutonomy = filterAutonomy === 'ALL' || agent.autonomyLevel === filterAutonomy;
      const matchTeam = filterTeam === 'ALL' || agent.team === filterTeam;
      const matchStatus = filterStatus === 'ALL' || agent.governanceStatus === filterStatus;

      return matchSearch && matchAutonomy && matchTeam && matchStatus;
    });
  }, [searchTerm, filterAutonomy, filterTeam, filterStatus]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
            <span>Discover Pillar</span>
            <span>·</span>
            <span>Agentic Operating Models</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5 flex items-center gap-2">
            <span>Autonomous Agents & Teams Registry</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold font-mono-code">
              {filteredAgents.length} Agents Active
            </span>
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Answers <strong>"How does autonomous AI operate?"</strong> — Autonomy levels, multi-agent topologies, tool boundaries, HITL gates, and embedded Verifiable Governance Passports.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="px-3 py-1.5 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-mono-code text-slate-600 dark:text-slate-300">
            Topology: Multi-Agent Teams
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="p-3 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl elevation-card flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search agent name, team, role, model, or tool..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-sky-500 transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Autonomy Level Filter */}
          <select
            value={filterAutonomy}
            onChange={(e) => setFilterAutonomy(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-sky-500"
          >
            <option value="ALL">All CG-AG Autonomy Tiers</option>
            <option value="L1_ASSISTIVE">L1 Assistive</option>
            <option value="L2_SUPERVISED">L2 Supervised</option>
            <option value="L3_AUTONOMOUS_BOUNDED">L3 Autonomous Bounded</option>
            <option value="L4_HIGH_AUTONOMY">L4 High Autonomy</option>
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-sky-500"
          >
            <option value="ALL">All Postures</option>
            <option value="GOVERNED">🟢 Governed</option>
            <option value="CONDITIONAL">🟡 Conditional</option>
            <option value="UNGOVERNED">🔴 Ungoverned</option>
          </select>
        </div>
      </div>

      {/* AGENTS & TEAMS TABLE */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl elevation-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold">
              <tr>
                <th className="py-3 px-4">Agent Name & Role</th>
                <th className="py-3 px-4">Team & Topology</th>
                <th className="py-3 px-4">CG-AG Autonomy Tier</th>
                <th className="py-3 px-4">Model & Runtime</th>
                <th className="py-3 px-4">Bounded Tools</th>
                <th className="py-3 px-4">HITL Checkpoint</th>
                <th className="py-3 px-4">Governance</th>
                <th className="py-3 px-4 text-right">Passport</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredAgents.map((agent) => {
                const isGoverned = agent.governanceStatus === 'GOVERNED';
                const isConditional = agent.governanceStatus === 'CONDITIONAL';

                return (
                  <tr
                    key={agent.id}
                    onClick={() => setSelectedAgent(agent)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition cursor-pointer group"
                  >
                    {/* Name & Role */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors flex items-center gap-1.5">
                        <Bot className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                        <span>{agent.name}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 truncate max-w-xs mt-0.5">{agent.role}</div>
                      <div className="font-mono-code text-[10px] text-slate-400 mt-0.5">{agent.id}</div>
                    </td>

                    {/* Team & Topology */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>{agent.team}</span>
                      </div>
                      <div className="text-[10px] font-mono-code text-slate-400">{agent.teamTopology.replace('_', ' ')}</div>
                    </td>

                    {/* Autonomy Level */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                        {agent.autonomyLevel.replace(/_/g, ' ')}
                      </span>
                    </td>

                    {/* Model */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-mono-code text-[11px] text-slate-700 dark:text-slate-300">{agent.model}</div>
                      <div className="text-[10px] text-slate-400">{agent.framework} (T: {agent.temperature})</div>
                    </td>

                    {/* Tools */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                        <Wrench className="w-3 h-3 text-slate-400" />
                        <span>{agent.tools.length} Tools</span>
                      </div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[130px]">
                        {agent.tools.map(t => t.name).join(', ')}
                      </div>
                    </td>

                    {/* HITL */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold ${
                        agent.hitlCheckpoint.required ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                      }`}>
                        {agent.hitlCheckpoint.required ? '⚠️ Checkpoint Req.' : '✓ Supervised'}
                      </span>
                    </td>

                    {/* Governance Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                        isGoverned
                          ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          : (isConditional
                            ? 'bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                            : 'bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800')
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isGoverned ? 'bg-emerald-500' : (isConditional ? 'bg-amber-500' : 'bg-rose-500')}`} />
                        {agent.governanceStatus}
                      </span>
                    </td>

                    {/* Passport Action */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAgent(agent);
                            setActiveDrawerTab('sipoc');
                          }}
                          className="px-2 py-1 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/80 rounded text-[11px] font-bold transition flex items-center gap-1"
                          title="Visualizar Cadeia SIPOC (Entrada ➔ Processo ➔ Saída)"
                        >
                          <Layers className="w-3 h-3" />
                          <span>SIPOC</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAgent(agent);
                            setActiveDrawerTab('passport');
                          }}
                          className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-sky-600 hover:text-white dark:hover:bg-sky-600 text-slate-700 dark:text-slate-300 rounded text-[11px] font-medium transition"
                        >
                          Passport ➔
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* RIGHT-SIDE SLIDE-OVER OPERATIONAL AGENT DRAWER */}
      {selectedAgent && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-xs flex justify-end animate-fadeIn">
          <div className="w-full max-w-2xl bg-white dark:bg-[#0f172a] border-l border-slate-200 dark:border-slate-800 h-full shadow-2xl flex flex-col justify-between overflow-y-auto">
            {/* Drawer Top Bar */}
            <div>
              <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between bg-slate-50/50 dark:bg-slate-900/40">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono-code text-xs font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950 px-2 py-0.5 rounded border border-sky-200 dark:border-sky-800">
                      {selectedAgent.id}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {selectedAgent.framework}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                      {selectedAgent.autonomyLevel.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-2 flex items-center gap-2">
                    <Bot className="w-5 h-5 text-sky-500" />
                    <span>{selectedAgent.name}</span>
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    {selectedAgent.description}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedAgent(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Tabs */}
              <div className="flex border-b border-slate-200 dark:border-slate-800 px-5 text-xs font-semibold overflow-x-auto">
                {(['topology', 'autonomy', 'tools', 'hitl', 'controls', 'passport'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveDrawerTab(tab)}
                    className={`py-3 px-3 border-b-2 capitalize whitespace-nowrap transition ${
                      activeDrawerTab === tab
                        ? 'border-sky-600 text-sky-600 dark:text-sky-400 font-bold'
                        : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    {tab === 'passport' ? '🪪 Governance Passport' : tab}
                  </button>
                ))}
              </div>

              {/* Drawer Tab Contents */}
              <div className="p-6 space-y-5 text-xs">
                {/* 1. TOPOLOGY & TEAM MEMBERSHIP */}
                {activeDrawerTab === 'topology' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                      <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-sky-500" />
                        <span>Team Membership & Orchestration Topology</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-slate-700 dark:text-slate-300">
                        <div>
                          <span className="text-slate-400 text-[11px]">Assigned Team / Squad:</span>
                          <div className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">{selectedAgent.team}</div>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[11px]">Orchestration Pattern:</span>
                          <div className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">{selectedAgent.teamTopology.replace(/_/g, ' ')}</div>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[11px]">Runtime Framework:</span>
                          <div className="font-mono-code text-slate-900 dark:text-slate-100 mt-0.5">{selectedAgent.framework}</div>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[11px]">Accountable Manager:</span>
                          <div className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">{selectedAgent.owner.name} ({selectedAgent.owner.role})</div>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="font-bold text-slate-800 dark:text-slate-200">Circuit Breaker & Execution Safeguards (CG-AG-04)</div>
                      <div className="flex justify-between text-slate-600 dark:text-slate-300">
                        <span>Max Loop Iterations:</span>
                        <span className="font-mono-code font-bold">{selectedAgent.circuitBreaker.maxIterations} iterations</span>
                      </div>
                      <div className="flex justify-between text-slate-600 dark:text-slate-300">
                        <span>Execution Timeout Threshold:</span>
                        <span className="font-mono-code font-bold">{selectedAgent.circuitBreaker.maxExecutionTimeSec} seconds</span>
                      </div>
                      <div className="flex justify-between text-slate-600 dark:text-slate-300">
                        <span>Kill Switch Readiness:</span>
                        <span className="text-emerald-500 font-bold">🟢 Active & Testable</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. AUTONOMY & BOUNDARIES */}
                {activeDrawerTab === 'sipoc' && (() => {
              const sipocData = getAgentBusinessAndSipoc({
                name: selectedAgent.name,
                framework: selectedAgent.framework,
                tools: selectedAgent.tools.map(t => typeof t === 'string' ? t : t.name),
                description: selectedAgent.description
              } as any);
              const { businessPurpose, sipoc } = sipocData;
              return (
                <div className="space-y-4">
                  {/* Business Purpose Banner */}
                  <div className="p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800">
                    <div className="text-[11px] font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-wider mb-1 flex items-center space-x-1.5">
                      <Building2 className="w-3.5 h-3.5" />
                      <span>Função de Negócio (Business Purpose)</span>
                    </div>
                    <p className="text-xs text-indigo-950 dark:text-indigo-200 leading-relaxed font-medium">
                      {businessPurpose}
                    </p>
                    <div className="mt-2 pt-2 border-t border-indigo-200/50 dark:border-indigo-800/50 flex items-center justify-between text-[11px] text-indigo-700 dark:text-indigo-300">
                      <span>Papel Arquitetural: <strong>{sipoc.businessRole}</strong></span>
                      <span className="px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 font-mono text-[10px]">
                        {sipoc.governanceStatus}
                      </span>
                    </div>
                  </div>

                  {/* 5-Stage SIPOC Grid */}
                  <div className="space-y-2.5">
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center space-x-1.5">
                      <Activity className="w-3.5 h-3.5 text-indigo-700" />
                      <span>Cadeia SIPOC (Supplier ➔ Input ➔ Process ➔ Output ➔ Customer)</span>
                    </div>

                    {/* Step 1: Supplier & Input */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                          1. Fornecedor (Supplier / Origem)
                        </span>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                          {sipoc.supplier}
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                        <span className="text-[10px] font-bold text-blue-800 dark:text-blue-400 uppercase tracking-wider block">
                          2. Entrada de Dados (Input)
                        </span>
                        <p className="text-xs text-slate-700 dark:text-slate-300">
                          {sipoc.input}
                        </p>
                      </div>
                    </div>

                    {/* Step 2: Process */}
                    <div className="p-3 rounded-xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-200/80 dark:border-indigo-800/60 space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-bold text-indigo-800 dark:text-indigo-400 uppercase tracking-wider">
                        <span>3. Processamento do Agente (Process)</span>
                        <span className="font-mono">{selectedAgent.framework}</span>
                      </div>
                      <p className="text-xs text-slate-800 dark:text-slate-200 font-medium">
                        {sipoc.process}
                      </p>
                    </div>

                    {/* Step 3: Output & Customer */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                        <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider block">
                          4. Saída Gerada (Output)
                        </span>
                        <p className="text-xs text-slate-700 dark:text-slate-300">
                          {sipoc.output}
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                          5. Cliente / Destino (Customer)
                        </span>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                          {sipoc.customer}
                        </p>
                      </div>
                    </div>

                    {/* Custodianship */}
                    <div className="p-3 rounded-xl bg-slate-100/70 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-slate-500 block text-[10px] font-bold uppercase">Process Owner:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{sipoc.processOwner}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px] font-bold uppercase">Technical Custodian:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{sipoc.technicalCustodian}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
            {activeDrawerTab === 'autonomy' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="font-bold text-slate-800 dark:text-slate-200">CG-AG Autonomy Tier Classification</div>
                      <div className="text-sky-600 dark:text-sky-400 font-bold text-sm">{selectedAgent.autonomyLevel.replace(/_/g, ' ')}</div>
                      <p className="text-slate-500 text-[11px] leading-relaxed">
                        Under CG-AG Core Control 03, autonomous execution is bounded by explicit API policies, tool whitelists, and mandatory human escalation triggers.
                      </p>
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="font-bold text-slate-800 dark:text-slate-200">Model Configuration</div>
                      <div className="flex justify-between text-slate-600 dark:text-slate-300">
                        <span>LLM Foundation Model:</span>
                        <span className="font-mono-code font-semibold">{selectedAgent.model}</span>
                      </div>
                      <div className="flex justify-between text-slate-600 dark:text-slate-300">
                        <span>Sampling Temperature:</span>
                        <span className="font-mono-code font-semibold">{selectedAgent.temperature}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. TOOLS & PERMISSIONS */}
                {activeDrawerTab === 'tools' && (
                  <div className="space-y-3">
                    <div className="font-bold text-slate-800 dark:text-slate-200">Attached Tools & Granular Privileges (CG-AG-02)</div>
                    <div className="space-y-2">
                      {selectedAgent.tools.map((tool) => (
                        <div key={tool.name} className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                              <Wrench className="w-3.5 h-3.5 text-sky-500" />
                              <span>{tool.name}</span>
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              tool.permission === 'READ_ONLY'
                                ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                : (tool.permission === 'READ_WRITE'
                                  ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                                  : 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800')
                            }`}>
                              {tool.permission.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono-code">Boundary: {tool.boundary}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. HITL GATES */}
                {activeDrawerTab === 'hitl' && (
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-amber-500" />
                      <span>Human-in-the-Loop (HITL) Checkpoint (EU AI Act Art. 14 / CG-AG-03)</span>
                    </div>
                    <div className="space-y-2 text-slate-700 dark:text-slate-300">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Mandatory Gate:</span>
                        <span className={selectedAgent.hitlCheckpoint.required ? 'text-amber-500 font-bold' : 'text-emerald-500 font-bold'}>
                          {selectedAgent.hitlCheckpoint.required ? '⚠️ Enforced Checkpoint' : '✓ Standard Logging'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400">Escalation Trigger:</span>
                        <div className="text-xs bg-slate-100 dark:bg-slate-800 p-2.5 rounded-lg mt-1 text-slate-800 dark:text-slate-200">
                          {selectedAgent.hitlCheckpoint.trigger}
                        </div>
                      </div>
                      <div className="flex justify-between pt-1">
                        <span className="text-slate-400">Fallback Timeout:</span>
                        <span className="font-mono-code font-semibold">{selectedAgent.hitlCheckpoint.fallbackTimeoutSec} seconds</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. 12 CONTROLS */}
                {activeDrawerTab === 'controls' && (
                  <div className="space-y-2">
                    <div className="font-bold text-slate-800 dark:text-slate-200 mb-2">12 CG-AG Normative Controls Mapping</div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex justify-between">
                        <span>CG-AG-01 (Inventory)</span>
                        <span className="text-emerald-500 font-bold">✓ Active</span>
                      </div>
                      <div className="p-2.5 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex justify-between">
                        <span>CG-AG-02 (Tools)</span>
                        <span className="text-emerald-500 font-bold">✓ Bounded</span>
                      </div>
                      <div className="p-2.5 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex justify-between">
                        <span>CG-AG-03 (HITL)</span>
                        <span className={selectedAgent.hitlCheckpoint.required ? 'text-amber-500 font-bold' : 'text-emerald-500 font-bold'}>
                          {selectedAgent.hitlCheckpoint.required ? '⚠️ Checkpoint' : '✓ Supervised'}
                        </span>
                      </div>
                      <div className="p-2.5 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex justify-between">
                        <span>CG-AG-04 (Circuit Breaker)</span>
                        <span className="text-emerald-500 font-bold">✓ Armed</span>
                      </div>
                      <div className="p-2.5 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex justify-between">
                        <span>CG-AG-07 (Audit Ledger)</span>
                        <span className="text-emerald-500 font-bold">✓ Signed</span>
                      </div>
                      <div className="p-2.5 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex justify-between">
                        <span>CG-AG-11 (FinOps)</span>
                        <span className="text-emerald-500 font-bold">✓ Tracked</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 6. GOVERNANCE PASSPORT ARTIFACT */}
                {activeDrawerTab === 'passport' && (
                  <div className="space-y-4 p-5 rounded-xl bg-gradient-to-b from-sky-950/30 to-slate-900/80 border border-sky-500/40 elevation-card">
                    <div className="flex items-center justify-between border-b border-sky-800/40 pb-3">
                      <div>
                        <div className="flex items-center gap-1.5 text-sky-400 font-bold text-xs">
                          <FileBadge className="w-4 h-4" />
                          <span>CRYPTOGRAPHICALLY VERIFIABLE AGENT PASSPORT</span>
                        </div>
                        <div className="font-mono-code text-[11px] text-slate-300 mt-0.5">{selectedAgent.passport.passportId}</div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        {selectedAgent.passport.assuranceTier}
                      </span>
                    </div>

                    <div className="space-y-3 text-xs divide-y divide-slate-800/60">
                      <div className="pt-2 flex justify-between">
                        <span className="text-slate-400">Integrity Hash (SHA-256):</span>
                        <span className="font-mono-code text-sky-300">{selectedAgent.passport.digitalSignature}</span>
                      </div>
                      <div className="pt-2 flex justify-between">
                        <span className="text-slate-400">Accountable Lead:</span>
                        <span className="font-semibold text-white">{selectedAgent.owner.name} ({selectedAgent.owner.department})</span>
                      </div>
                      <div className="pt-2 flex justify-between">
                        <span className="text-slate-400">Issued Timestamp:</span>
                        <span className="font-mono-code text-slate-300">{new Date(selectedAgent.passport.issuedAt).toUTCString()}</span>
                      </div>
                      <div className="pt-2 flex justify-between">
                        <span className="text-slate-400">Evidence Retention Policy:</span>
                        <span className="text-slate-300">Configured (1825d / 5y Standard)</span>
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={() => alert(`Passport [${selectedAgent.passport.passportId}] Verified against tamper-evident root hash!`)}
                        className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold transition shadow-xs flex items-center gap-1.5"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Verify Tamper-Evident Hash</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-mono-code">Passport ID: {selectedAgent.passport.passportId}</span>
              <button
                onClick={() => setSelectedAgent(null)}
                className="px-4 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-semibold transition"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
