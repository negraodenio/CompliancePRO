import React, { useState, useMemo } from 'react';
import { 
  Scale, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  Search, 
  Filter, 
  ChevronRight, 
  Lock, 
  UserCheck, 
  Layers, 
  Bot, 
  FileText, 
  Activity, 
  Clock, 
  CheckSquare, 
  Sparkles,
  ArrowRight,
  FileDown,
  Building2,
  ExternalLink,
  BookOpen,
  Info
} from 'lucide-react';
import type { ScannerResult } from '../../core/types';
import { useIndustry } from '../context/IndustryContext';
import { ComplianceStore, ComplianceFramework, RegulatoryClauseMapping } from '../services/compliance-store';

export const ComplianceFrameworksView: React.FC<{ result?: ScannerResult | null }> = ({ result }) => {
  const { activeProfile, environment } = useIndustry();
  const frameworks = ComplianceStore.getFrameworks();
  const [selectedFrameworkId, setSelectedFrameworkId] = useState<string>(frameworks[0].id);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPosture, setFilterPosture] = useState<string>('ALL');
  const [selectedClause, setSelectedClause] = useState<RegulatoryClauseMapping | null>(null);
  const [activeDrawerTab, setActiveDrawerTab] = useState<'overview' | 'crosswalk' | 'gaps' | 'dossier' | 'evidence'>('overview');

  const { isRegulationPriority } = useIndustry();

  const sortedFrameworks = useMemo(() => {
    return [...frameworks].sort((a, b) => {
      const aPri = isRegulationPriority(a.name) || isRegulationPriority(a.id) ? 1 : 0;
      const bPri = isRegulationPriority(b.name) || isRegulationPriority(b.id) ? 1 : 0;
      return bPri - aPri;
    });
  }, [frameworks, activeProfile, isRegulationPriority]);

  const currentFramework = useMemo(() => {
    return sortedFrameworks.find(f => f.id === selectedFrameworkId) || sortedFrameworks[0];
  }, [sortedFrameworks, selectedFrameworkId]);

  const filteredClauses = useMemo(() => {
    return currentFramework.clauses.filter((c) => {
      const matchSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.article.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.clauseId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.requirementSummary.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.mappedControlIds.some(cid => cid.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchPosture = filterPosture === 'ALL' || c.posture === filterPosture;

      return matchSearch && matchPosture;
    });
  }, [currentFramework, searchTerm, filterPosture]);

  const totalClauses = frameworks.reduce((acc, f) => acc + f.clauses.length, 0);
  const alignedClauses = frameworks.reduce((acc, f) => acc + f.clauses.filter(c => c.posture === 'ALIGNED').length, 0);
  const gapClauses = frameworks.reduce((acc, f) => acc + f.clauses.filter(c => c.posture === 'GAP_DETECTED').length, 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
            <span>Govern Pillar</span>
            <span>·</span>
            <span>Regulatory Overlays & Crosswalk Center</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5 flex items-center gap-2">
            <span>Compliance Frameworks</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold font-mono-code">
              {alignedClauses}/{totalClauses} Articles Aligned
            </span>
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Maps contextual regulatory requirements onto the <strong>12 proprietary CG-AG Controls</strong>, providing crosswalk evidence and regulatory dossier export.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="px-3 py-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-600 dark:text-slate-300 font-mono-code">
            Principle: CG-AG = Normative Engine · Laws = Contextual Overlays
          </span>
        </div>
      </div>

      {/* SUMMARY STATS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 elevation-card">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Frameworks Tracked</span>
            <Scale className="w-4 h-4 text-sky-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-sky-600 dark:text-sky-400">{frameworks.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">EU, BR, US & International</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 elevation-card">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Mapped Clauses</span>
            <BookOpen className="w-4 h-4 text-purple-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-purple-600 dark:text-purple-400">{totalClauses}</div>
          <div className="text-[11px] text-slate-500 mt-1">Directly Crosswalked to Controls</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 elevation-card">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Regulatory Gaps</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400">{gapClauses}</div>
          <div className="text-[11px] text-slate-500 mt-1">Connected to Open Findings</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 elevation-card">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Overall Alignment</span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{currentFramework.overallAlignmentScore}%</div>
          <div className="text-[11px] text-slate-500 mt-1">Crosswalk Evidence Verified</div>
        </div>
      </div>

      {/* FRAMEWORK SELECTOR TABS */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-2 overflow-x-auto pb-0.5">
        {sortedFrameworks.map((fw) => {
          const isPriority = isRegulationPriority(fw.name) || isRegulationPriority(fw.id);
          const isSelected = fw.id === selectedFrameworkId;
          return (
            <button
              key={fw.id}
              onClick={() => setSelectedFrameworkId(fw.id)}
              className={`flex items-center space-x-2 py-2.5 px-4 text-xs font-semibold rounded-t-xl transition border-b-2 ${
                isSelected
                  ? 'bg-white dark:bg-[#111827] border-sky-600 text-sky-600 dark:text-sky-400 border-t border-x border-slate-200 dark:border-slate-800 shadow-xs'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900/40'
              }`}
            >
              <span>{fw.acronym}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded font-mono-code font-bold bg-slate-100 dark:bg-slate-800">
                {fw.overallAlignmentScore}%
              </span>
            </button>
          );
        })}
      </div>

      {/* ACTIVE FRAMEWORK CONTEXT CARD */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-sky-950/30 via-slate-900/40 to-slate-950/30 border border-slate-200 dark:border-slate-800 text-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-sm text-slate-900 dark:text-white">{currentFramework.name}</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300">
                {currentFramework.status.replace(/_/g, ' ')}
              </span>
              <span className="font-mono-code text-[11px] text-slate-400">{currentFramework.version}</span>
            </div>
            <p className="text-slate-600 dark:text-slate-300 text-[11px] mt-1 max-w-3xl">
              {currentFramework.description}
            </p>
            <div className="flex items-center space-x-4 text-[10px] text-slate-400 mt-2">
              <span>Jurisdiction: <strong>{currentFramework.jurisdiction}</strong></span>
              <span>Authority: <strong>{currentFramework.authority}</strong></span>
              <span>Effective: <strong>{currentFramework.effectiveDate}</strong></span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-semibold text-xs flex items-center gap-1.5">
              <FileDown className="w-3.5 h-3.5" />
              <span>Dossier: {currentFramework.dossierStatus.replace(/_/g, ' ')}</span>
            </span>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="p-3 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl elevation-card flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search article, clause, title, requirement, or mapped CG-AG control..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-sky-500 transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={filterPosture}
            onChange={(e) => setFilterPosture(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-sky-500"
          >
            <option value="ALL">All Postures</option>
            <option value="ALIGNED">🟢 Aligned</option>
            <option value="PARTIALLY_ALIGNED">🟡 Partially Aligned</option>
            <option value="GAP_DETECTED">🔴 Gap Detected</option>
          </select>
        </div>
      </div>

      {/* CROSSWALK ARTICLES TABLE */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl elevation-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold">
              <tr>
                <th className="py-3 px-4">Article / Clause</th>
                <th className="py-3 px-4">Requirement Summary</th>
                <th className="py-3 px-4">Mapped CG-AG Controls</th>
                <th className="py-3 px-4">Supporting Policies</th>
                <th className="py-3 px-4">Alignment Posture</th>
                <th className="py-3 px-4">Evidence Digest</th>
                <th className="py-3 px-4 text-right">Investigate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredClauses.map((clause) => {
                const isAligned = clause.posture === 'ALIGNED';
                const isGap = clause.posture === 'GAP_DETECTED';

                return (
                  <tr
                    key={clause.clauseId}
                    onClick={() => setSelectedClause(clause)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition cursor-pointer group"
                  >
                    {/* Clause ID & Title */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors flex items-center gap-1.5">
                        <Scale className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                        <span>{clause.article}</span>
                      </div>
                      <div className="text-[11px] font-medium text-slate-700 dark:text-slate-300 mt-0.5">{clause.title}</div>
                      <div className="font-mono-code text-[10px] text-slate-400 mt-0.5">{clause.clauseId}</div>
                    </td>

                    {/* Requirement Summary */}
                    <td className="py-3.5 px-4">
                      <div className="text-[11px] text-slate-700 dark:text-slate-300 leading-snug line-clamp-2 max-w-sm">
                        {clause.requirementSummary}
                      </div>
                    </td>

                    {/* Mapped CG-AG Controls */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {clause.mappedControlIds.map((cid) => (
                          <span key={cid} className="font-mono-code font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950 px-1.5 py-0.5 rounded text-[10px] border border-sky-200 dark:border-sky-800">
                            {cid}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Supporting Policies */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {clause.mappedPolicyIds.map((pid) => (
                          <span key={pid} className="font-mono-code text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[10px]">
                            {pid}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Posture */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isAligned
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          : (isGap
                            ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 animate-pulse'
                            : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800')
                      }`}>
                        {clause.posture.replace(/_/g, ' ')} ({clause.compliancePercentage}%)
                      </span>
                    </td>

                    {/* Evidence Digest */}
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono-code text-[10px] text-slate-500">
                      {clause.evidenceDigest}
                    </td>

                    {/* Action Button */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedClause(clause);
                        }}
                        className="text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 font-semibold text-xs inline-flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform"
                      >
                        Crosswalk <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* RIGHT-SIDE CROSSWALK INVESTIGATION DRAWER */}
      {selectedClause && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-xs flex justify-end animate-fadeIn">
          <div className="w-full max-w-2xl bg-white dark:bg-[#0f172a] border-l border-slate-200 dark:border-slate-800 h-full shadow-2xl flex flex-col justify-between overflow-y-auto">
            <div>
              {/* Drawer Top */}
              <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between bg-slate-50/50 dark:bg-slate-900/40">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono-code text-xs font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950 px-2 py-0.5 rounded border border-sky-200 dark:border-sky-800">
                      {selectedClause.clauseId}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {currentFramework.acronym}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                      selectedClause.posture === 'ALIGNED'
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                        : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                    }`}>
                      {selectedClause.posture.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-2">
                    {selectedClause.article} — {selectedClause.title}
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    {selectedClause.requirementSummary}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedClause(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Tabs */}
              <div className="flex border-b border-slate-200 dark:border-slate-800 px-5 text-xs font-semibold overflow-x-auto">
                {(['overview', 'crosswalk', 'gaps', 'dossier', 'evidence'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveDrawerTab(tab)}
                    className={`py-3 px-3 border-b-2 capitalize whitespace-nowrap transition ${
                      activeDrawerTab === tab
                        ? 'border-sky-600 text-sky-600 dark:text-sky-400 font-bold'
                        : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    {tab === 'crosswalk' ? 'Crosswalk Pipeline' : tab}
                  </button>
                ))}
              </div>

              {/* Drawer Tab Content */}
              <div className="p-6 space-y-5 text-xs">
                {/* 1. OVERVIEW */}
                {activeDrawerTab === 'overview' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 text-slate-700 dark:text-slate-300">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Legal Authority:</span>
                        <span className="font-semibold text-slate-900 dark:text-slate-100">{currentFramework.authority}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Jurisdiction:</span>
                        <span>{currentFramework.jurisdiction}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Effective Mandatory Date:</span>
                        <span className="font-mono-code font-bold">{currentFramework.effectiveDate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Alignment Percentage:</span>
                        <span className="font-bold text-sky-600 dark:text-sky-400">{selectedClause.compliancePercentage}%</span>
                      </div>
                    </div>

                    <div className="p-4 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 rounded-xl space-y-1.5">
                      <div className="font-bold text-sky-900 dark:text-sky-200 flex items-center gap-1.5">
                        <Info className="w-4 h-4 text-sky-500" />
                        <span>Regulatory Guidance & Best Practice</span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed">
                        {selectedClause.regulatoryGuidance}
                      </p>
                    </div>
                  </div>
                )}

                {/* 2. CROSSWALK PIPELINE */}
                {activeDrawerTab === 'crosswalk' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                      <div className="font-bold text-slate-800 dark:text-slate-200">Regulatory Crosswalk Pipeline</div>
                      <div className="space-y-3">
                        <div className="p-3 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-lg">
                          <div className="text-[10px] text-slate-400 uppercase font-bold">1. Legal Requirement in Scope</div>
                          <div className="font-bold text-slate-900 dark:text-white mt-0.5">{selectedClause.article} — {selectedClause.title}</div>
                        </div>

                        <div className="flex justify-center">
                          <ArrowRight className="w-4 h-4 text-slate-400 transform rotate-90" />
                        </div>

                        <div className="p-3 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 rounded-lg">
                          <div className="text-[10px] text-sky-600 dark:text-sky-400 uppercase font-bold">2. Mapped CG-AG Controls</div>
                          <div className="font-bold text-sky-900 dark:text-sky-200 mt-0.5">
                            {selectedClause.mappedControlIds.join(', ')}
                          </div>
                        </div>

                        <div className="flex justify-center">
                          <ArrowRight className="w-4 h-4 text-slate-400 transform rotate-90" />
                        </div>

                        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-bold">3. Supporting Policy & Evidence</div>
                          <div className="font-bold text-emerald-900 dark:text-emerald-200 mt-0.5">
                            {selectedClause.mappedPolicyIds.join(', ')}
                          </div>
                          <div className="text-[10px] font-mono-code text-slate-400 mt-1">{selectedClause.evidenceDigest}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. GAPS */}
                {activeDrawerTab === 'gaps' && (
                  <div className="space-y-4">
                    {selectedClause.gapSummary ? (
                      <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl space-y-2">
                        <div className="font-bold text-rose-900 dark:text-rose-200 flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-rose-500" />
                          <span>Active Regulatory Gap Detected</span>
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed">
                          {selectedClause.gapSummary}
                        </p>
                        {selectedClause.linkedFindingId && (
                          <div className="font-mono-code text-[11px] text-rose-700 dark:text-rose-300 pt-1">
                            Operational Finding Link: <strong>{selectedClause.linkedFindingId}</strong>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-6 text-center border border-dashed border-slate-300 dark:border-slate-800 rounded-xl text-slate-500 text-xs">
                        No regulatory gaps detected for this clause. All mapped CG-AG controls are operating effectively.
                      </div>
                    )}
                  </div>
                )}

                {/* 4. DOSSIER */}
                {activeDrawerTab === 'dossier' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                      <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                        <span>Regulatory Dossier Technical Pack</span>
                        <span className="font-mono-code text-[11px] text-emerald-600 dark:text-emerald-400">Ready</span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 text-[11px]">
                        The technical conformity documentation for <strong>{currentFramework.acronym}</strong> is continuously assembled from the Passports, Control Evaluations, and Decision Ledger.
                      </p>
                      <button className="w-full py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs">
                        <FileDown className="w-4 h-4" />
                        <span>Export Certified Conformity Dossier (PDF/JSON)</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 5. EVIDENCE & LEDGER */}
                {activeDrawerTab === 'evidence' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                      <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Lock className="w-4 h-4 text-emerald-500" />
                        <span>Tamper-Evident Digest & Crosswalk Hash</span>
                      </div>
                      <div className="font-mono-code text-[11px] p-2.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-700 dark:text-slate-300">
                        Integrity Hash: {selectedClause.evidenceDigest}
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Verified across all {selectedClause.mappedControlIds.length} mapped CG-AG controls and chained into the audit ledger.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-mono-code">Clause ID: {selectedClause.clauseId}</span>
              <button
                onClick={() => setSelectedClause(null)}
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
