import React, { useState, useMemo } from 'react';
import { 
  CheckSquare, 
  ShieldCheck, 
  AlertTriangle, 
  Scale, 
  Lock, 
  FileText, 
  Bot, 
  ChevronRight, 
  Search, 
  ExternalLink, 
  X, 
  CheckCircle2, 
  Layers, 
  Activity, 
  Sliders, 
  Sparkles,
  Zap,
  UserCheck,
  FileBadge,
  Terminal,
  BookOpen
} from 'lucide-react';
import type { ScannerResult } from '../../core/types';
import { CONTROL_LIST, CGAGControl } from '../../core/cg-ag-controls';
import { useIndustry } from '../context/IndustryContext';

export interface ExtendedControlRecord extends CGAGControl {
  corePrinciple: string;
  pillarGroup: 'DISCOVER' | 'GOVERN' | 'OPERATE' | 'ASSURE';
  accountableRole: string;
  enforcementMode: 'STATIC_AST' | 'RUNTIME_GATE' | 'HYBRID';
  complianceStatus: 'EFFECTIVE' | 'ATTENTION' | 'NON_COMPLIANT';
  activePoliciesCount: number;
  openFindingsCount: number;
  evidenceType: string;
  appliedSystemsCount: number;
}

const EXTENDED_CONTROLS: ExtendedControlRecord[] = CONTROL_LIST.map((ctrl) => {
  
  let corePrinciple = 'Every agent action must be governable, bounded, and evidenced.';
  if (ctrl.id === 'CG-AG-01') corePrinciple = 'No AI agent shall run in production without a verified Identity and cataloged Passport.';
  if (ctrl.id === 'CG-AG-02') corePrinciple = 'Agents must operate under strict least-privilege tool access boundaries.';
  if (ctrl.id === 'CG-AG-03') corePrinciple = 'High-impact decisions require mandatory Human-in-the-Loop approval checkpoints.';
  if (ctrl.id === 'CG-AG-04') corePrinciple = 'Autonomous execution loops must enforce finite bounds and instant kill switches.';
  if (ctrl.id === 'CG-AG-05') corePrinciple = 'All agent prompts and outputs must pass active injection and toxicity guardrails.';
  if (ctrl.id === 'CG-AG-06') corePrinciple = 'Personal and sensitive data must be de-identified before model processing.';
  if (ctrl.id === 'CG-AG-07') corePrinciple = 'Every decision, invocation, and override must produce a tamper-evident audit record.';
  if (ctrl.id === 'CG-AG-08') corePrinciple = 'API keys, credentials, and secrets must never be exposed to agent context.';
  if (ctrl.id === 'CG-AG-09') corePrinciple = 'Model drift, hallucination rate, and output variance must be continuously monitored.';
  if (ctrl.id === 'CG-AG-10') corePrinciple = 'Agent failures must degrade gracefully with predictable fallback routines.';
  if (ctrl.id === 'CG-AG-11') corePrinciple = 'Token consumption and computational budgets must be strictly bounded per agent.';
  if (ctrl.id === 'CG-AG-12') corePrinciple = 'Third-party models, plugins, and dependencies must maintain a verified SBOM.';

  let pillarGroup: ExtendedControlRecord['pillarGroup'] = 'GOVERN';
  let accountableRole = 'Security & AI Governance Lead';
  let enforcementMode: ExtendedControlRecord['enforcementMode'] = 'STATIC_AST';
  let complianceStatus: ExtendedControlRecord['complianceStatus'] = 'EFFECTIVE';
  let activePoliciesCount = 3;
  let openFindingsCount = 0;
  let evidenceType = 'AST Ingestion Manifest (JSON)';
  let appliedSystemsCount = 142;

  if (ctrl.id === 'CG-AG-01') {
    pillarGroup = 'DISCOVER';
    accountableRole = 'Enterprise Architecture / AI Office';
    enforcementMode = 'HYBRID';
    complianceStatus = 'EFFECTIVE';
    evidenceType = 'Cryptographic Passport Manifest';
  } else if (ctrl.id === 'CG-AG-02') {
    pillarGroup = 'GOVERN';
    accountableRole = 'AppSec Engineering Lead';
    enforcementMode = 'STATIC_AST';
    complianceStatus = 'EFFECTIVE';
    activePoliciesCount = 4;
    appliedSystemsCount = 27;
  } else if (ctrl.id === 'CG-AG-03') {
    pillarGroup = 'OPERATE';
    accountableRole = 'CISO & Business Process Owner';
    enforcementMode = 'RUNTIME_GATE';
    complianceStatus = 'ATTENTION';
    openFindingsCount = 1;
    activePoliciesCount = 2;
    appliedSystemsCount = 5;
    evidenceType = 'HITL Signature Log';
  } else if (ctrl.id === 'CG-AG-04') {
    pillarGroup = 'OPERATE';
    accountableRole = 'AI Platform Reliability Lead';
    enforcementMode = 'RUNTIME_GATE';
    complianceStatus = 'EFFECTIVE';
    appliedSystemsCount = 27;
    evidenceType = 'Circuit Breaker Telemetry';
  } else if (ctrl.id === 'CG-AG-06') {
    pillarGroup = 'GOVERN';
    accountableRole = 'Data Protection Officer (DPO)';
    enforcementMode = 'HYBRID';
    complianceStatus = 'ATTENTION';
    openFindingsCount = 1;
    evidenceType = 'PII Masking Audit Record (RIPD)';
    appliedSystemsCount = 142;
  } else if (ctrl.id === 'CG-AG-07') {
    pillarGroup = 'ASSURE';
    accountableRole = 'Internal Audit & Compliance Lead';
    enforcementMode = 'HYBRID';
    complianceStatus = 'EFFECTIVE';
    evidenceType = 'SHA-256 Tamper-Evident Ledger';
    appliedSystemsCount = 142;
  } else if (ctrl.id === 'CG-AG-12') {
    pillarGroup = 'DISCOVER';
    accountableRole = 'Supply Chain & Procurement Security';
    enforcementMode = 'STATIC_AST';
    complianceStatus = 'EFFECTIVE';
    evidenceType = 'Software Bill of Materials (SBOM)';
    appliedSystemsCount = 38;
  }

  return {
    ...ctrl,
    corePrinciple,
    pillarGroup,
    accountableRole,
    enforcementMode,
    complianceStatus,
    activePoliciesCount,
    openFindingsCount,
    evidenceType,
    appliedSystemsCount
  };
});

export const ControlsMatrixView: React.FC<{ result?: ScannerResult | null }> = ({ result }) => {
  const { activeProfile } = useIndustry();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPillar, setFilterPillar] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [selectedControl, setSelectedControl] = useState<ExtendedControlRecord | null>(null);
  const [activeDrawerTab, setActiveDrawerTab] = useState<'normative' | 'scope' | 'policies' | 'risk' | 'evidence' | 'regulations'>('normative');

  const { isControlMandatory } = useIndustry();

  const sortedControls = useMemo(() => {
    return [...EXTENDED_CONTROLS].sort((a, b) => {
      const aMan = isControlMandatory(a.id) ? 1 : 0;
      const bMan = isControlMandatory(b.id) ? 1 : 0;
      return bMan - aMan;
    });
  }, [EXTENDED_CONTROLS, activeProfile, isControlMandatory]);

  const filteredControls = useMemo(() => {
    return sortedControls.filter((ctrl) => {
      const matchSearch = ctrl.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          ctrl.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          ctrl.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          ctrl.accountableRole.toLowerCase().includes(searchTerm.toLowerCase());

      const matchPillar = filterPillar === 'ALL' || ctrl.pillarGroup === filterPillar;
      const matchStatus = filterStatus === 'ALL' || ctrl.complianceStatus === filterStatus;

      return matchSearch && matchPillar && matchStatus;
    });
  }, [searchTerm, filterPillar, filterStatus]);

  const effectiveCount = EXTENDED_CONTROLS.filter(c => c.complianceStatus === 'EFFECTIVE').length;
  const attentionCount = EXTENDED_CONTROLS.filter(c => c.complianceStatus === 'ATTENTION').length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
            <span>Govern Pillar</span>
            <span>·</span>
            <span>Normative Engine</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5 flex items-center gap-2">
            <span>The 12 CG-AG Governance Controls Matrix</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold font-mono-code">
              {effectiveCount} Effective · {attentionCount} Attention
            </span>
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            The core governance engine defining deterministic, auditable static and runtime operational controls for autonomous AI systems.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="px-3 py-1.5 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-mono-code text-slate-600 dark:text-slate-300">
            Control Engine: 12 Normative Controls
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="p-3 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl elevation-card flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search control ID (e.g. CG-AG-03), name, policy, or owner..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-sky-500 transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Pillar Filter */}
          <select
            value={filterPillar}
            onChange={(e) => setFilterPillar(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-sky-500"
          >
            <option value="ALL">All Control Pillars</option>
            <option value="DISCOVER">Discover (CG-AG-01, 12)</option>
            <option value="GOVERN">Govern (CG-AG-02, 05, 06, 08)</option>
            <option value="OPERATE">Operate (CG-AG-03, 04, 10, 11)</option>
            <option value="ASSURE">Assure (CG-AG-07, 09)</option>
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-sky-500"
          >
            <option value="ALL">All Status</option>
            <option value="EFFECTIVE">🟢 Effective</option>
            <option value="ATTENTION">🟡 Attention (Gap Detected)</option>
          </select>
        </div>
      </div>

      {/* 12 CONTROLS MASTER MATRIX TABLE */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl elevation-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold">
              <tr>
                <th className="py-3 px-4">Control ID & Name</th>
                <th className="py-3 px-4">Control Plane Pillar</th>
                <th className="py-3 px-4">Enforcement Mode</th>
                <th className="py-3 px-4">Accountable Lead</th>
                <th className="py-3 px-4">Active Policies</th>
                <th className="py-3 px-4">Status & Gaps</th>
                <th className="py-3 px-4">Evidence Artifact</th>
                <th className="py-3 px-4 text-right">Investigate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredControls.map((ctrl) => {
                const isEffective = ctrl.complianceStatus === 'EFFECTIVE';

                return (
                  <tr
                    key={ctrl.id}
                    onClick={() => setSelectedControl(ctrl)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition cursor-pointer group"
                  >
                    {/* ID & Name */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono-code text-[11px] font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950 px-2 py-0.5 rounded border border-sky-200 dark:border-sky-800">
                          {ctrl.id}
                        </span>
                        <span className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                          {ctrl.name}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-1 mt-1">{ctrl.description}</p>
                    </td>

                    {/* Pillar */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {ctrl.pillarGroup}
                      </span>
                    </td>

                    {/* Enforcement */}
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono-code text-[11px] text-slate-700 dark:text-slate-300">
                      {ctrl.enforcementMode.replace('_', ' ')}
                    </td>

                    {/* Accountable Owner */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-medium text-slate-800 dark:text-slate-200">{ctrl.accountableRole}</div>
                      <div className="text-[10px] text-slate-400">{ctrl.appliedSystemsCount} Systems Bounded</div>
                    </td>

                    {/* Active Policies */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{ctrl.activePoliciesCount} Guardrails</span>
                      <div className="text-[10px] text-slate-400">Continuous Rules</div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                        isEffective
                          ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          : 'bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isEffective ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        {isEffective ? 'Effective' : `${ctrl.openFindingsCount} Gap Detected`}
                      </span>
                    </td>

                    {/* Evidence */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 dark:text-slate-400 text-[11px] truncate max-w-[140px]">
                      {ctrl.evidenceType}
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedControl(ctrl);
                        }}
                        className="text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 font-semibold text-xs inline-flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform"
                      >
                        Investigate <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* RIGHT-SIDE SLIDE-OVER DEEP INVESTIGATION DRAWER */}
      {selectedControl && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-xs flex justify-end animate-fadeIn">
          <div className="w-full max-w-2xl bg-white dark:bg-[#0f172a] border-l border-slate-200 dark:border-slate-800 h-full shadow-2xl flex flex-col justify-between overflow-y-auto">
            <div>
              {/* Drawer Top */}
              <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between bg-slate-50/50 dark:bg-slate-900/40">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono-code text-xs font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950 px-2 py-0.5 rounded border border-sky-200 dark:border-sky-800">
                      {selectedControl.id}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {selectedControl.pillarGroup} Pillar
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      {selectedControl.complianceStatus}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-2">
                    {selectedControl.name}
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    {selectedControl.description}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedControl(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Tabs */}
              <div className="flex border-b border-slate-200 dark:border-slate-800 px-5 text-xs font-semibold overflow-x-auto">
                {(['normative', 'scope', 'policies', 'risk', 'evidence', 'regulations'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveDrawerTab(tab)}
                    className={`py-3 px-3 border-b-2 capitalize whitespace-nowrap transition ${
                      activeDrawerTab === tab
                        ? 'border-sky-600 text-sky-600 dark:text-sky-400 font-bold'
                        : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    {tab === 'normative' ? 'Normative Standard' : tab}
                  </button>
                ))}
              </div>

              {/* Drawer Content */}
              <div className="p-6 space-y-5 text-xs">
                {/* 1. NORMATIVE STANDARD */}
                {activeDrawerTab === 'normative' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <BookOpen className="w-4 h-4 text-sky-500" />
                        <span>Core Operational Principle</span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 italic leading-relaxed">
                        "{selectedControl.corePrinciple}"
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800">
                      <div>
                        <span className="text-slate-400 text-[11px]">Domain:</span>
                        <div className="font-semibold text-slate-800 dark:text-slate-200 capitalize mt-0.5">{selectedControl.domain.replace('_', ' ')}</div>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px]">Enforcement Mechanism:</span>
                        <div className="font-mono-code font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{selectedControl.enforcementMode}</div>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px]">Accountable Role:</span>
                        <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{selectedControl.accountableRole}</div>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px]">Audit Retention Standard:</span>
                        <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">Policy Configured (1825d)</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. SCOPE */}
                {activeDrawerTab === 'scope' && (
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-sky-500" />
                      <span>Applied Systems Scope ({selectedControl.appliedSystemsCount} Entities)</span>
                    </div>
                    <p className="text-slate-500 text-[11px]">
                      This control automatically inspects and enforces governance rules across all cataloged agents, models, and pipelines in the active workspace.
                    </p>
                    <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded font-mono-code text-[11px] text-slate-700 dark:text-slate-300">
                      Scope: All Autonomous Agents, RAG Pipelines & Predictive Models
                    </div>
                  </div>
                )}

                {/* 3. POLICIES & GUARDRAILS */}
                {activeDrawerTab === 'policies' && (
                  <div className="space-y-3">
                    <div className="font-bold text-slate-800 dark:text-slate-200">Active Policy Rules ({selectedControl.activePoliciesCount} Guardrails)</div>
                    <div className="space-y-2">
                      <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                        <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center justify-between">
                          <span>POL-{selectedControl.id}-01 (Baseline Validation)</span>
                          <span className="text-emerald-500 font-bold text-[10px]">🟢 Active</span>
                        </div>
                        <p className="text-[11px] text-slate-500">Deterministic invariant checks matching control requirements.</p>
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                        <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center justify-between">
                          <span>POL-{selectedControl.id}-02 (Runtime Assertion)</span>
                          <span className="text-emerald-500 font-bold text-[10px]">🟢 Active</span>
                        </div>
                        <p className="text-[11px] text-slate-500">Continuous telemetry monitoring and circuit breaker triggers.</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. RISK & FINDINGS */}
                {activeDrawerTab === 'risk' && (
                  <div className="space-y-3">
                    <div className="font-bold text-slate-800 dark:text-slate-200">Failure Risk Tier & Observed Gaps</div>
                    {selectedControl.openFindingsCount > 0 ? (
                      <div className="p-4 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800 space-y-2">
                        <div className="flex items-center justify-between text-amber-700 dark:text-amber-300 font-bold">
                          <span>⚠️ Active Finding: Missing Tier-2 Escalation</span>
                          <span className="text-[10px] bg-amber-200/60 dark:bg-amber-900/60 px-2 py-0.5 rounded">High Exposure</span>
                        </div>
                        <p className="text-[11px] text-amber-800 dark:text-amber-200 leading-relaxed">
                          Autonomous execution threshold for financial underwriting requires an explicit Human-in-the-Loop checkpoint above R$ 50,000.
                        </p>
                      </div>
                    ) : (
                      <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200">
                        ✓ 0 Open risk exposures. Control is currently performing with 100% effectiveness.
                      </div>
                    )}
                  </div>
                )}

                {/* 5. EVIDENCE */}
                {activeDrawerTab === 'evidence' && (
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Lock className="w-4 h-4 text-emerald-500" />
                      <span>Tamper-Evident Evidence Format</span>
                    </div>
                    <div className="font-mono-code text-[11px] p-2.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-700 dark:text-slate-300">
                      Artifact: {selectedControl.evidenceType}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Evaluated deterministically and recorded into the SHA-256 protected audit trail upon every codebase scan or runtime invocation.
                    </p>
                  </div>
                )}

                {/* 6. REGULATORY OVERLAYS */}
                {activeDrawerTab === 'regulations' && (
                  <div className="space-y-3">
                    <div className="font-bold text-slate-800 dark:text-slate-200">Global Regulatory References Mapping</div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800">
                        <span className="font-bold text-slate-800 dark:text-slate-200">🇪🇺 EU AI Act</span>
                        <div className="text-[11px] text-slate-500 mt-1">Art. 14 (Supervisão Humana) & Art. 15 (Cibersegurança)</div>
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800">
                        <span className="font-bold text-slate-800 dark:text-slate-200">🇧🇷 LGPD</span>
                        <div className="text-[11px] text-slate-500 mt-1">Art. 20 (Revisão Automatizada) & Art. 46 (Segurança)</div>
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800">
                        <span className="font-bold text-slate-800 dark:text-slate-200">🇺🇸 NIST AI RMF</span>
                        <div className="text-[11px] text-slate-500 mt-1">GOVERN 1.1 & MANAGE 2.4</div>
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800">
                        <span className="font-bold text-slate-800 dark:text-slate-200">🇪🇺 DORA</span>
                        <div className="text-[11px] text-slate-500 mt-1">Art. 9 (Proteção TIC) & Art. 11 (Continuidade)</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-mono-code">Control: {selectedControl.id}</span>
              <button
                onClick={() => setSelectedControl(null)}
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
