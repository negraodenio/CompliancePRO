import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  ExternalLink, 
  ChevronRight, 
  Layers, 
  Bot, 
  Cpu, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  Lock, 
  Calendar, 
  UserCheck, 
  SlidersHorizontal,
  Building2,
  FileBadge,
  Terminal,
  Activity
} from 'lucide-react';
import type { ScannerResult } from '../../core/types';
import { useIndustry } from '../context/IndustryContext';

export interface AISystemRecord {
  id: string;
  name: string;
  type: 'AUTONOMOUS_AGENT' | 'MULTI_AGENT_TEAM' | 'RAG_PIPELINE' | 'PREDICTIVE_MODEL' | 'SHADOW_AI_ENDPOINT';
  owner: {
    name: string;
    role: string;
    department: string;
  };
  industry: string;
  model: string;
  riskTier: 'HIGH_RISK' | 'LIMITED_RISK' | 'MINIMAL_RISK' | 'PROHIBITED';
  governanceStatus: 'GOVERNED' | 'ATTENTION' | 'EXPOSURE';
  environment: 'Production' | 'Staging' | 'Sandbox';
  lastAssessmentDate: string;
  score: number;
  toolsCount: number;
  piiProcessing: boolean;
  hitlRequired: boolean;
  signature: string;
  filePath?: string;
  description: string;
}

const INITIAL_INVENTORY: AISystemRecord[] = [
  {
    id: 'SYS-CREDIT-001',
    name: 'Credit Risk Scoring Orchestrator',
    type: 'AUTONOMOUS_AGENT',
    owner: { name: 'Roberto Silva', role: 'Credit Risk Lead', department: 'Risk & Compliance' },
    industry: 'Financial Services',
    model: 'gpt-4-turbo (CrewAI 0.1.x)',
    riskTier: 'HIGH_RISK',
    governanceStatus: 'ATTENTION',
    environment: 'Production',
    lastAssessmentDate: '2026-08-27',
    score: 72,
    toolsCount: 4,
    piiProcessing: true,
    hitlRequired: true,
    signature: 'SIG-911EB3A0C872',
    filePath: 'agents/credit_agent.py',
    description: 'Evaluates applicant financial solvability and autonomously determines preliminary loan eligibility.'
  },
  {
    id: 'SYS-SUPPORT-002',
    name: 'OmniChannel Customer CX Copilot',
    type: 'RAG_PIPELINE',
    owner: { name: 'Juliana Lima', role: 'CX Operations Head', department: 'Customer Success' },
    industry: 'Financial Services',
    model: 'gpt-3.5-turbo (LangChain)',
    riskTier: 'LIMITED_RISK',
    governanceStatus: 'GOVERNED',
    environment: 'Production',
    lastAssessmentDate: '2026-08-26',
    score: 95,
    toolsCount: 2,
    piiProcessing: false,
    hitlRequired: false,
    signature: 'SIG-49F128E93B01',
    filePath: 'services/support_bot.ts',
    description: 'Contextual RAG assistant answering client inquiries with automated PII masking and tone guardrails.'
  },
  {
    id: 'SYS-SHADOW-003',
    name: 'Direct Marketing Prompt Service',
    type: 'SHADOW_AI_ENDPOINT',
    owner: { name: 'Unassigned (Detected via AST)', role: 'Developer Key', department: 'Growth Marketing' },
    industry: 'Financial Services',
    model: 'gpt-4-0613 (OpenAI SDK Direct)',
    riskTier: 'HIGH_RISK',
    governanceStatus: 'EXPOSURE',
    environment: 'Staging',
    lastAssessmentDate: '2026-08-27',
    score: 38,
    toolsCount: 0,
    piiProcessing: true,
    hitlRequired: true,
    signature: 'SIG-UNREGISTERED',
    filePath: 'services/direct_llm.py',
    description: 'Uncataloged direct OpenAI call bypassing corporate SecurityGuard proxies and data masking.'
  },
  {
    id: 'SYS-FRAUD-004',
    name: 'Real-time Anti-Fraud Transaction Sentinel',
    type: 'PREDICTIVE_MODEL',
    owner: { name: 'Carlos Mendes', role: 'Security Architect', department: 'InfoSec' },
    industry: 'Financial Services',
    model: 'XGBoost + Embeddings (Local Inference)',
    riskTier: 'HIGH_RISK',
    governanceStatus: 'GOVERNED',
    environment: 'Production',
    lastAssessmentDate: '2026-08-25',
    score: 88,
    toolsCount: 6,
    piiProcessing: true,
    hitlRequired: true,
    signature: 'SIG-8812F9A0192C',
    filePath: 'models/fraud_detector.py',
    description: 'Continuous transaction anomaly monitoring enforcing DORA Art. 11 operational continuity.'
  },
  {
    id: 'SYS-INVEST-005',
    name: 'Wealth Management Portfolio Balancer',
    type: 'MULTI_AGENT_TEAM',
    owner: { name: 'Mariana Duarte', role: 'Asset Management VP', department: 'Private Banking' },
    industry: 'Financial Services',
    model: 'claude-3-5-sonnet (AutoGen)',
    riskTier: 'HIGH_RISK',
    governanceStatus: 'GOVERNED',
    environment: 'Production',
    lastAssessmentDate: '2026-08-24',
    score: 91,
    toolsCount: 5,
    piiProcessing: false,
    hitlRequired: true,
    signature: 'SIG-7729A10091FF',
    filePath: 'agents/wealth_manager.py',
    description: 'Multi-agent simulation and asset rebalancing team operating under strict human mandate.'
  }
];

export const AiInventoryView: React.FC<{ result?: ScannerResult | null; onOpenScanner: () => void }> = ({
  result,
  onOpenScanner
}) => {
  const { activeProfile } = useIndustry();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterRisk, setFilterRisk] = useState<string>('ALL');
  const [selectedSystem, setSelectedSystem] = useState<AISystemRecord | null>(null);
  const [activeDrawerTab, setActiveDrawerTab] = useState<'overview' | 'ownership' | 'controls' | 'evidence' | 'incidents'>('overview');

  // Filtered Inventory Data
  const filteredData = useMemo(() => {
    return INITIAL_INVENTORY.filter(item => {
      const matchSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.owner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.model.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchType = filterType === 'ALL' || item.type === filterType;
      const matchStatus = filterStatus === 'ALL' || item.governanceStatus === filterStatus;
      const matchRisk = filterRisk === 'ALL' || item.riskTier === filterRisk;

      return matchSearch && matchType && matchStatus && matchRisk;
    });
  }, [searchTerm, filterType, filterStatus, filterRisk]);

  const handleExportCSV = () => {
    const headers = ['ID', 'Name', 'Type', 'Owner', 'Department', 'RiskTier', 'Status', 'Score', 'Environment', 'Signature'];
    const rows = filteredData.map(i => [
      i.id,
      `"${i.name}"`,
      i.type,
      `"${i.owner.name}"`,
      `"${i.owner.department}"`,
      i.riskTier,
      i.governanceStatus,
      i.score,
      i.environment,
      i.signature
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ai_inventory_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      {/* Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
            <span>Discover Pillar</span>
            <span>·</span>
            <span>Master System Registry</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5 flex items-center gap-2">
            <span>AI Systems & Pipelines Inventory</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold font-mono-code">
              {filteredData.length} Registered
            </span>
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Enterprise system of record cataloging all AI agents, models, RAG pipelines, and Shadow AI endpoints.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold transition shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={onOpenScanner}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold shadow-xs transition"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Register via Scanner</span>
          </button>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="p-3 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl elevation-card flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search AI system name, ID, owner, model, or file..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-sky-500 transition"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-sky-500"
          >
            <option value="ALL">All Types</option>
            <option value="AUTONOMOUS_AGENT">Autonomous Agent</option>
            <option value="MULTI_AGENT_TEAM">Multi-Agent Team</option>
            <option value="RAG_PIPELINE">RAG Pipeline</option>
            <option value="PREDICTIVE_MODEL">Predictive Model</option>
            <option value="SHADOW_AI_ENDPOINT">Shadow AI</option>
          </select>

          {/* Governance Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-sky-500"
          >
            <option value="ALL">All Status</option>
            <option value="GOVERNED">🟢 Governed</option>
            <option value="ATTENTION">🟡 Attention</option>
            <option value="EXPOSURE">🔴 Exposure</option>
          </select>

          {/* Risk Tier Filter */}
          <select
            value={filterRisk}
            onChange={(e) => setFilterRisk(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-sky-500"
          >
            <option value="ALL">All Risk Tiers</option>
            <option value="HIGH_RISK">High Risk (Art. 6)</option>
            <option value="LIMITED_RISK">Limited Risk</option>
            <option value="MINIMAL_RISK">Minimal Risk</option>
          </select>

          {(searchTerm || filterType !== 'ALL' || filterStatus !== 'ALL' || filterRisk !== 'ALL') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterType('ALL');
                setFilterStatus('ALL');
                setFilterRisk('ALL');
              }}
              className="px-2 py-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* RICH DATA TABLE */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl elevation-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold tracking-wider">
              <tr>
                <th className="py-3 px-4">AI System Name / ID</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Accountable Owner</th>
                <th className="py-3 px-4">Model & Runtime</th>
                <th className="py-3 px-4">Risk Tier</th>
                <th className="py-3 px-4">Governance Posture</th>
                <th className="py-3 px-4">Env</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredData.map((item) => {
                const isGoverned = item.governanceStatus === 'GOVERNED';
                const isAttention = item.governanceStatus === 'ATTENTION';
                const isHighRisk = item.riskTier === 'HIGH_RISK';

                return (
                  <tr 
                    key={item.id}
                    onClick={() => setSelectedSystem(item)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition cursor-pointer group"
                  >
                    {/* Name & ID */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                        {item.name}
                      </div>
                      <div className="font-mono-code text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <span>{item.id}</span>
                        {item.filePath && <span className="text-slate-500">· {item.filePath}</span>}
                      </div>
                    </td>

                    {/* Type Badge */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {item.type.replace(/_/g, ' ')}
                      </span>
                    </td>

                    {/* Owner & Department */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-medium text-slate-800 dark:text-slate-200">{item.owner.name}</div>
                      <div className="text-[10px] text-slate-400">{item.owner.department}</div>
                    </td>

                    {/* Model */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="text-slate-700 dark:text-slate-300 font-mono-code text-[11px]">{item.model}</div>
                      <div className="text-[10px] text-slate-400">{item.toolsCount} Tools attached</div>
                    </td>

                    {/* Risk Tier */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isHighRisk 
                          ? 'bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                      }`}>
                        {item.riskTier.replace('_', ' ')}
                      </span>
                    </td>

                    {/* Governance Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                        isGoverned
                          ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          : (isAttention
                            ? 'bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                            : 'bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800')
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isGoverned ? 'bg-emerald-500' : (isAttention ? 'bg-amber-500' : 'bg-rose-500')}`} />
                        {item.governanceStatus} ({item.score}%)
                      </span>
                    </td>

                    {/* Environment */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 dark:text-slate-400 font-mono-code text-[11px]">
                      {item.environment}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSystem(item);
                        }}
                        className="text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 font-semibold text-xs inline-flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform"
                      >
                        Inspect <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* RIGHT-SIDE SLIDE-OVER DETAIL DRAWER */}
      {selectedSystem && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-xs flex justify-end animate-fadeIn">
          <div className="w-full max-w-2xl bg-white dark:bg-[#0f172a] border-l border-slate-200 dark:border-slate-800 h-full shadow-2xl flex flex-col justify-between overflow-y-auto">
            {/* Drawer Header */}
            <div>
              <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between bg-slate-50/50 dark:bg-slate-900/40">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono-code text-xs font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950 px-2 py-0.5 rounded border border-sky-200 dark:border-sky-800">
                      {selectedSystem.id}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {selectedSystem.type}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-2">
                    {selectedSystem.name}
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    {selectedSystem.description}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedSystem(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Tabs */}
              <div className="flex border-b border-slate-200 dark:border-slate-800 px-5 text-xs font-semibold">
                {(['overview', 'ownership', 'controls', 'evidence', 'incidents'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveDrawerTab(tab)}
                    className={`py-3 px-3 border-b-2 capitalize transition ${
                      activeDrawerTab === tab
                        ? 'border-sky-600 text-sky-600 dark:text-sky-400 font-bold'
                        : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Drawer Content */}
              <div className="p-6 space-y-5 text-xs">
                {activeDrawerTab === 'overview' && (
                  <div className="space-y-4">
                    {/* Key Attributes Grid */}
                    <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800">
                      <div>
                        <span className="text-slate-400 text-[11px]">Declared Model:</span>
                        <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{selectedSystem.model}</div>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px]">Governance Status:</span>
                        <div className="font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">{selectedSystem.governanceStatus} ({selectedSystem.score}%)</div>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px]">Risk Classification:</span>
                        <div className="font-semibold text-rose-600 dark:text-rose-400 mt-0.5">{selectedSystem.riskTier}</div>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px]">Human Oversight (HITL):</span>
                        <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{selectedSystem.hitlRequired ? 'Mandatory Checkpoint' : 'Standard Monitoring'}</div>
                      </div>
                    </div>

                    {/* Operational Boundaries */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="font-bold text-slate-800 dark:text-slate-200">Operational & Data Boundaries</div>
                      <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                        <span>PII Processing Flag:</span>
                        <span className={selectedSystem.piiProcessing ? 'text-amber-500 font-bold' : 'text-emerald-500 font-bold'}>
                          {selectedSystem.piiProcessing ? '⚠️ Active (Requires RIPD)' : '✅ Masked'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                        <span>Registered Tools:</span>
                        <span className="font-mono-code font-bold">{selectedSystem.toolsCount} Connectors Bounded</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                        <span>Source File Reference:</span>
                        <span className="font-mono-code text-slate-400">{selectedSystem.filePath}</span>
                      </div>
                    </div>
                  </div>
                )}

                {activeDrawerTab === 'ownership' && (
                  <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800">
                    <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-sky-500" />
                      <span>RACI & Legal Accountability (EU AI Act Art. 26 / DPO LGPD)</span>
                    </div>
                    <div className="divide-y divide-slate-200 dark:divide-slate-800 space-y-2 pt-2 text-slate-700 dark:text-slate-300">
                      <div className="flex justify-between pt-2">
                        <span className="text-slate-400">Accountable Process Owner:</span>
                        <span className="font-semibold">{selectedSystem.owner.name}</span>
                      </div>
                      <div className="flex justify-between pt-2">
                        <span className="text-slate-400">Role:</span>
                        <span>{selectedSystem.owner.role}</span>
                      </div>
                      <div className="flex justify-between pt-2">
                        <span className="text-slate-400">Department / Unit:</span>
                        <span>{selectedSystem.owner.department}</span>
                      </div>
                    </div>
                  </div>
                )}

                {activeDrawerTab === 'controls' && (
                  <div className="space-y-2">
                    <div className="font-bold text-slate-800 dark:text-slate-200 mb-2">12 CG-AG Controls Coverage Status</div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2.5 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex justify-between">
                        <span>CG-AG-01 (Inventory)</span>
                        <span className="text-emerald-500 font-bold">✓ Passed</span>
                      </div>
                      <div className="p-2.5 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex justify-between">
                        <span>CG-AG-02 (Tool Scoping)</span>
                        <span className="text-emerald-500 font-bold">✓ Passed</span>
                      </div>
                      <div className="p-2.5 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex justify-between">
                        <span>CG-AG-03 (Human-in-Loop)</span>
                        <span className={selectedSystem.hitlRequired ? 'text-amber-500 font-bold' : 'text-emerald-500 font-bold'}>
                          {selectedSystem.hitlRequired ? '⚠️ Checkpoint Req.' : '✓ Passed'}
                        </span>
                      </div>
                      <div className="p-2.5 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex justify-between">
                        <span>CG-AG-07 (Audit Trail)</span>
                        <span className="text-emerald-500 font-bold">✓ Logged</span>
                      </div>
                    </div>
                  </div>
                )}

                {activeDrawerTab === 'evidence' && (
                  <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800">
                    <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Lock className="w-4 h-4 text-emerald-500" />
                      <span>Tamper-Evident Evidence Signature</span>
                    </div>
                    <div className="font-mono-code text-[11px] p-2 bg-slate-100 dark:bg-slate-800 rounded text-slate-700 dark:text-slate-300">
                      Digital Hash: {selectedSystem.signature}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Cryptographically chained to Audit Ledger. Legal retention standard: 1825 days (5 years).
                    </div>
                  </div>
                )}

                {activeDrawerTab === 'incidents' && (
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 text-center text-slate-500">
                    No open security incidents or circuit breaker trips recorded for this system.
                  </div>
                )}
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-mono-code">Last Evaluated: {selectedSystem.lastAssessmentDate}</span>
              <button
                onClick={() => setSelectedSystem(null)}
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
