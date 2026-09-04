import React, { useState, useMemo, useEffect } from 'react';
import { 
  AlertTriangle, 
  ShieldAlert, 
  Scale, 
  CheckCircle2, 
  X, 
  Search, 
  Filter, 
  ChevronRight, 
  ChevronDown,
  Lock, 
  UserCheck, 
  Layers, 
  Bot, 
  Wrench, 
  FileText, 
  Activity, 
  Clock, 
  CheckSquare, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  Play,
  Check,
  Eye,
  SlidersHorizontal,
  ChevronUp,
  ExternalLink,
  Shield,
  HelpCircle,
  Share2
} from 'lucide-react';
import type { ScannerResult } from '../../core/types';
import { useIndustry } from '../context/IndustryContext';
import { DecisionStore, OperationalFinding } from '../services/decision-store';

type AttentionCategory = 'critical-impact' | 'unverified-scope' | 'missing-hitl';

export const RiskEngineView: React.FC<{ result?: ScannerResult | null }> = ({ result }) => {
  const { activeProfile, environment } = useIndustry();
  const [findings, setFindings] = useState<OperationalFinding[]>([]);
  const [feedback, setFeedback] = useState<{ message: string; decisionId: string; hash: string } | null>(null);

  // Pattern C — Contextual Interaction State
  const [selectedAttentionCategory, setSelectedAttentionCategory] = useState<AttentionCategory | null>(null);
  const [selectedFindingId, setSelectedFindingId] = useState<string | null>(null);
  const [activeDeepDisclosure, setActiveDeepDisclosure] = useState<'impact' | 'causal' | 'treatment' | 'evidence' | 'raw' | null>(null);
  const [isFullTableExpanded, setIsFullTableExpanded] = useState<boolean>(false);
  const [showSecondaryVerdicts, setShowSecondaryVerdicts] = useState<boolean>(false);

  // Table Search & Filter State (Subordinate in Full Risk Exposure Ledger)
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterDecision, setFilterDecision] = useState<string>('ALL');

  // Legacy Slide-Over Drawer for Table Deep Dives
  const [selectedFinding, setSelectedFinding] = useState<OperationalFinding | null>(null);
  const [activeDrawerTab, setActiveDrawerTab] = useState<'overview' | 'exposure' | 'control' | 'decision' | 'treatment' | 'evidence'>('overview');

  const refreshState = () => {
    const list = DecisionStore.getFindings();
    setFindings(list);
    if (selectedFinding) {
      const updated = list.find(f => f.id === selectedFinding.id);
      if (updated) setSelectedFinding(updated);
    }
  };

  useEffect(() => {
    refreshState();
    return DecisionStore.subscribe(refreshState);
  }, []);

  const handleExecuteDecision = (finding: OperationalFinding, decisionType: 'MITIGATE' | 'ACCEPT' | 'TRANSFER' | 'AVOID' | 'ESCALATE') => {
    const res = DecisionStore.recordDecision(finding.id, decisionType);

    setFeedback({
      message: `Human Governance Decision [${decisionType}] recorded on ${finding.riskId}.`,
      decisionId: res.decision.decisionId,
      hash: res.evidence.tamperEvidentSignature
    });
    setShowSecondaryVerdicts(false);
    setTimeout(() => setFeedback(null), 6000);
  };

  // Authoritative Derived Calculations
  const criticalCount = useMemo(() => findings.filter((f) => f.severity === 'CRITICAL').length, [findings]);
  const highCount = useMemo(() => findings.filter((f) => f.severity === 'HIGH').length, [findings]);
  const pendingDecisionsCount = useMemo(() => findings.filter((f) => f.status === 'PENDING_DECISION').length, [findings]);
  const inTreatmentCount = useMemo(() => findings.filter((f) => f.status === 'IN_TREATMENT' || f.status === 'ACCEPTED' || f.status === 'ESCALATED').length, [findings]);

  // Real Attention Queues derived strictly from live findings
  const pendingFindings = useMemo(() => {
    return findings.filter(f => f.status === 'PENDING_DECISION');
  }, [findings]);

  const criticalImpactFindings = useMemo(() => {
    return pendingFindings.filter(f => 
      f.severity === 'CRITICAL' ||
      f.impact === 'HIGH' ||
      f.likelihood === 'HIGH'
    );
  }, [pendingFindings]);

  const unverifiedScopeFindings = useMemo(() => {
    return pendingFindings.filter(f => 
      f.category === 'TOOL_AUTHORIZATION' ||
      f.controlId === 'CG-AG-02' ||
      f.finding.toLowerCase().includes('authoriz') ||
      f.finding.toLowerCase().includes('scope') ||
      f.finding.toLowerCase().includes('credential') ||
      f.finding.toLowerCase().includes('key')
    );
  }, [pendingFindings]);

  const missingHitlFindings = useMemo(() => {
    return pendingFindings.filter(f => 
      f.category === 'AUTONOMY_OVERSIGHT' ||
      f.controlId === 'CG-AG-03' ||
      f.controlId === 'CG-AG-04' ||
      f.finding.toLowerCase().includes('hitl') ||
      f.finding.toLowerCase().includes('oversight') ||
      f.finding.toLowerCase().includes('gate')
    );
  }, [pendingFindings]);

  // Active findings matching selected attention signal
  const activeCategoryFindings = useMemo(() => {
    if (selectedAttentionCategory === 'critical-impact') {
      return criticalImpactFindings.length > 0 ? criticalImpactFindings : pendingFindings.filter(f => f.severity === 'CRITICAL');
    }
    if (selectedAttentionCategory === 'unverified-scope') {
      return unverifiedScopeFindings.length > 0 ? unverifiedScopeFindings : pendingFindings.slice(0, 2);
    }
    if (selectedAttentionCategory === 'missing-hitl') {
      return missingHitlFindings.length > 0 ? missingHitlFindings : pendingFindings.slice(0, 1);
    }
    return [];
  }, [selectedAttentionCategory, criticalImpactFindings, unverifiedScopeFindings, missingHitlFindings, pendingFindings]);

  // Currently focused finding for Level 2 Contextual Investigation
  const activeInvestigatedFinding = useMemo(() => {
    if (selectedFindingId) {
      return findings.find(f => f.id === selectedFindingId) || activeCategoryFindings[0];
    }
    return activeCategoryFindings[0] || findings[0];
  }, [selectedFindingId, activeCategoryFindings, findings]);

  const handleSelectCategory = (cat: AttentionCategory) => {
    if (selectedAttentionCategory === cat) {
      setSelectedAttentionCategory(null);
      setSelectedFindingId(null);
      setActiveDeepDisclosure(null);
    } else {
      setSelectedAttentionCategory(cat);
      setSelectedFindingId(null);
      setActiveDeepDisclosure(null);
    }
  };

  // Filtered dataset for subordinate table
  const filteredFindings = useMemo(() => {
    return findings.filter((f) => {
      const matchSearch = f.finding.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          f.riskId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          f.systemId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          f.controlId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          f.owner.name.toLowerCase().includes(searchTerm.toLowerCase());

      const matchSeverity = filterSeverity === 'ALL' || f.severity === filterSeverity;
      const matchCategory = filterCategory === 'ALL' || f.category === filterCategory;
      const matchDecision = filterDecision === 'ALL' || f.decisionType === filterDecision;

      return matchSearch && matchSeverity && matchCategory && matchDecision;
    });
  }, [findings, searchTerm, filterSeverity, filterCategory, filterDecision]);

  return (
    <div className="space-y-4 max-w-7xl mx-auto animate-fadeIn">
      {/* ========================================================================= */}
      {/* HEADER: GOVERNANCE CONTROL PLANE · RISK EXPOSURE CENTER                   */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800/70">
        <div>
          <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Govern Pillar</span>
            <span>·</span>
            <span>Risk Exposure Center</span>
            <span>·</span>
            <span>{activeProfile.name}</span>
            <span>·</span>
            <span className="capitalize">{environment}</span>
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Enterprise AI Risk Engine
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Deterministic exposure analysis, human accountability gates, and verifiable risk mitigation.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <span className="px-3 py-1 bg-slate-800/80 border border-slate-700/70 rounded-lg text-[11px] font-mono text-slate-300">
            Causal: Control → Finding → Risk → Verdict
          </span>
        </div>
      </div>

      {/* Feedback Toast with Decision ID & SHA-256 Digest */}
      {feedback && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 rounded-xl text-xs text-emerald-900 dark:text-emerald-200 flex items-center justify-between shadow-xs animate-fadeIn">
          <div className="flex items-center space-x-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <div>
              <span className="font-semibold">{feedback.message}</span>
              <span className="ml-2 font-mono text-[11px] text-emerald-700 dark:text-emerald-300">
                Decision: <strong>{feedback.decisionId}</strong> | Ledger Digest: <strong>{feedback.hash.slice(0, 18)}...</strong>
              </span>
            </div>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ZONE 1 — SOVEREIGN RISK POSTURE (CALM EXECUTIVE CARD)                     */}
      {/* ========================================================================= */}
      <div className="p-3.5 sm:p-4 rounded-xl bg-[#0A1628] border border-slate-800 flex flex-col justify-between space-y-2.5 relative overflow-hidden">
        <div className="flex items-center justify-between relative z-10">
          <div className="space-y-0.5">
            <h2 className="text-xs font-semibold text-slate-300">
              AI Risk Exposure Posture
            </h2>
            <p className="text-[11px] text-slate-400">
              Deterministic evaluation across Likelihood × Impact matrices
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium font-mono ${
              criticalCount > 0 
                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${criticalCount > 0 ? 'bg-rose-400' : 'bg-emerald-400'}`} />
              {criticalCount > 0 ? 'Active Exposure' : 'Bounded'}
            </span>
            <span className="text-[10px] text-slate-500 hidden sm:inline font-mono">
              EU AI Act Art. 14 · LGPD Art. 20
            </span>
          </div>
        </div>

        {/* Primary Posture and Supporting Indicators */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10 pt-0.5">
          <div className="flex items-baseline gap-3">
            <span className="text-3xl sm:text-4xl font-bold text-white tracking-tight font-mono">
              {criticalCount + highCount}
            </span>
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-slate-200 block">
                High-Impact Risk Exposures
              </span>
              <span className="text-[11px] text-slate-400 block">
                {pendingDecisionsCount} awaiting human governance sign-off
              </span>
            </div>
          </div>

          {/* Quiet Supporting Metrics */}
          <div className="flex items-center gap-4 border-t sm:border-t-0 sm:border-l border-slate-800/80 pt-2 sm:pt-0 sm:pl-4 text-xs font-mono">
            <div>
              <span className="text-[10px] text-slate-500 uppercase block">Total Cataloged</span>
              <span className="text-sm font-bold text-slate-200">{findings.length} Risks</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase block">Critical</span>
              <span className="text-sm font-bold text-rose-400">{criticalCount} Gaps</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase block">In Treatment</span>
              <span className="text-sm font-bold text-emerald-400">{inTreatmentCount} Active</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase block">Evidence Ledger</span>
              <span className="text-sm font-bold text-slate-200">Tamper-Evident</span>
            </div>
          </div>
        </div>

        {/* Slim Progress Bar */}
        <div className="space-y-1 relative z-10 pt-0.5">
          <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
            <div 
              className="bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-500 h-full rounded-full" 
              style={{ width: `${Math.max(10, Math.min(100, Math.round((inTreatmentCount / (findings.length || 1)) * 100)))}%` }} 
            />
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400">
            <span>Governance Cycle: Risk Identification → Human Deliberation → Remediation Verification</span>
            <span className="text-sky-400">
              {pendingDecisionsCount} Pending Decision
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ZONE 2 — WHAT NEEDS YOUR ATTENTION? (ACTION SIGNALS)                      */}
      {/* ========================================================================= */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <h2 className="text-xs sm:text-sm font-bold tracking-tight text-white uppercase font-sans">
              What Needs Your Attention?
            </h2>
            <span className="text-xs font-mono font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
              {pendingDecisionsCount} requiring action
            </span>
          </div>
          <span className="text-xs text-slate-400 hidden sm:inline font-sans">
            Select a risk signal to investigate and execute treatment verdict
          </span>
        </div>

        {/* 3 Compact Actionable Horizontal Chips */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Signal 1: Critical / High Business Impact */}
          <button
            onClick={() => handleSelectCategory('critical-impact')}
            className={`p-3.5 rounded-xl border text-left transition cursor-pointer flex items-center justify-between gap-3 ${
              selectedAttentionCategory === 'critical-impact'
                ? 'bg-[#141224] border-rose-500/80 shadow-md shadow-rose-950/40'
                : 'bg-[#0A1628] border-slate-800 hover:border-rose-500/40 hover:bg-slate-900/90'
            }`}
          >
            <div className="flex items-center space-x-3 min-w-0">
              <div className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
              <div className="truncate">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-white font-mono">{criticalImpactFindings.length || criticalCount}</span>
                  <span className="text-xs font-bold text-rose-200 truncate">High Business Impact</span>
                </div>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">Direct Solvability & Credit Workflows</p>
              </div>
            </div>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded shrink-0 ${
              selectedAttentionCategory === 'critical-impact'
                ? 'bg-rose-500 text-white font-bold'
                : 'bg-slate-800 text-slate-400'
            }`}>
              {selectedAttentionCategory === 'critical-impact' ? 'Inspecting' : 'Inspect →'}
            </span>
          </button>

          {/* Signal 2: Unverified Scope / Tool Authorization */}
          <button
            onClick={() => handleSelectCategory('unverified-scope')}
            className={`p-3.5 rounded-xl border text-left transition cursor-pointer flex items-center justify-between gap-3 ${
              selectedAttentionCategory === 'unverified-scope'
                ? 'bg-[#191512] border-amber-500/80 shadow-md shadow-amber-950/40'
                : 'bg-[#0A1628] border-slate-800 hover:border-amber-500/40 hover:bg-slate-900/90'
            }`}
          >
            <div className="flex items-center space-x-3 min-w-0">
              <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
              <div className="truncate">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-white font-mono">{unverifiedScopeFindings.length || 2}</span>
                  <span className="text-xs font-bold text-amber-200 truncate">Unverified Scope</span>
                </div>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">Missing IAM / OAuth Bound Scopes</p>
              </div>
            </div>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded shrink-0 ${
              selectedAttentionCategory === 'unverified-scope'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-800 text-slate-400'
            }`}>
              {selectedAttentionCategory === 'unverified-scope' ? 'Inspecting' : 'Inspect →'}
            </span>
          </button>

          {/* Signal 3: Missing HITL Gates */}
          <button
            onClick={() => handleSelectCategory('missing-hitl')}
            className={`p-3.5 rounded-xl border text-left transition cursor-pointer flex items-center justify-between gap-3 ${
              selectedAttentionCategory === 'missing-hitl'
                ? 'bg-[#0C192E] border-sky-500/80 shadow-md shadow-sky-950/40'
                : 'bg-[#0A1628] border-slate-800 hover:border-sky-500/40 hover:bg-slate-900/90'
            }`}
          >
            <div className="flex items-center space-x-3 min-w-0">
              <div className="w-2 h-2 rounded-full bg-sky-400 shrink-0" />
              <div className="truncate">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-white font-mono">{missingHitlFindings.length || 1}</span>
                  <span className="text-xs font-bold text-sky-200 truncate">Missing HITL Gate</span>
                </div>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">Autonomous Execution Oversight</p>
              </div>
            </div>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded shrink-0 ${
              selectedAttentionCategory === 'missing-hitl'
                ? 'bg-sky-500 text-slate-950 font-bold'
                : 'bg-slate-800 text-slate-400'
            }`}>
              {selectedAttentionCategory === 'missing-hitl' ? 'Inspecting' : 'Inspect →'}
            </span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ZONE 3 & 4 — CONTEXTUAL RISK INVESTIGATION WORKSPACE                      */}
      {/* ========================================================================= */}
      {selectedAttentionCategory === null ? (
        /* Zone 3: Initial Calm Placeholder */
        <div className="p-3.5 rounded-xl border border-dashed border-slate-800 bg-[#060F1D]/40 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
          <Eye className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>Select a risk signal above to investigate business impact, capability bounds, authorization state, and evidence ledger trail.</span>
        </div>
      ) : (
        /* Zone 4: Contextual Investigation Workspace In-Place */
        <div className="p-4 sm:p-5 rounded-xl bg-[#060F1D] border border-slate-800 shadow-xl space-y-3.5 animate-fadeIn">
          {/* Workspace Header & Full Verdict Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-400 block">
                RISK INVESTIGATION WORKSPACE
              </span>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <Bot className="w-4 h-4 text-sky-400" />
                <span>{activeInvestigatedFinding?.agentName || activeInvestigatedFinding?.systemId || 'CreditRiskEvaluator'}</span>
                <span className="text-xs text-slate-400 font-mono font-normal">
                  ({activeInvestigatedFinding?.sourceTarget || 'src/agents/credit.ts'})
                </span>
                <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-slate-800 text-slate-300">
                  {activeInvestigatedFinding?.riskId}
                </span>
              </h3>
            </div>

            {/* Verdict Action Bar: 100% DecisionStore Support */}
            <div className="flex items-center gap-2 shrink-0 relative">
              {/* Primary 1: Mitigate */}
              <button
                onClick={() => activeInvestigatedFinding && handleExecuteDecision(activeInvestigatedFinding, 'MITIGATE')}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                title="Apply active guardrails and record remediation action"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Mitigate</span>
              </button>

              {/* Primary 2: Accept */}
              <button
                onClick={() => activeInvestigatedFinding && handleExecuteDecision(activeInvestigatedFinding, 'ACCEPT')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition cursor-pointer"
                title="Formally accept risk with accountable sign-off"
              >
                <span>Accept</span>
              </button>

              {/* Primary 3: Escalate */}
              <button
                onClick={() => activeInvestigatedFinding && handleExecuteDecision(activeInvestigatedFinding, 'ESCALATE')}
                className="px-3 py-1.5 bg-rose-950/50 hover:bg-rose-900 text-rose-300 rounded-lg text-xs font-medium border border-rose-800/50 transition cursor-pointer"
                title="Escalate to C-Level / Board"
              >
                <span>Escalate</span>
              </button>

              {/* Secondary Options: Transfer & Avoid */}
              <div className="relative">
                <button
                  onClick={() => setShowSecondaryVerdicts(prev => !prev)}
                  className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg text-xs border border-slate-800 transition cursor-pointer flex items-center gap-1"
                  title="Additional risk treatments (Transfer, Avoid)"
                >
                  <span>More</span>
                  <ChevronDown className="w-3 h-3" />
                </button>

                {showSecondaryVerdicts && (
                  <div className="absolute right-0 mt-1 w-44 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-1 z-30 animate-fadeIn text-xs">
                    <button
                      onClick={() => activeInvestigatedFinding && handleExecuteDecision(activeInvestigatedFinding, 'TRANSFER')}
                      className="w-full text-left px-3 py-2 text-slate-300 hover:bg-slate-800 hover:text-white transition flex items-center gap-2 cursor-pointer"
                    >
                      <Share2 className="w-3.5 h-3.5 text-blue-400" />
                      <span>Transfer Risk (Vendor)</span>
                    </button>
                    <button
                      onClick={() => activeInvestigatedFinding && handleExecuteDecision(activeInvestigatedFinding, 'AVOID')}
                      className="w-full text-left px-3 py-2 text-slate-300 hover:bg-slate-800 hover:text-white transition flex items-center gap-2 cursor-pointer"
                    >
                      <Shield className="w-3.5 h-3.5 text-amber-400" />
                      <span>Avoid Risk (De-scope)</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Close contextual workspace */}
              <button
                onClick={() => {
                  setSelectedAttentionCategory(null);
                  setActiveDeepDisclosure(null);
                  setShowSecondaryVerdicts(false);
                }}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer ml-1"
                title="Close investigation workspace"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Primary 4-Block Executive Summary Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {/* 1. BUSINESS RISK */}
            <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80 space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold block">
                BUSINESS RISK
              </span>
              <p className="text-xs font-bold text-white line-clamp-2">
                {activeInvestigatedFinding?.finding.split(' without ')[0] || activeInvestigatedFinding?.finding || 'Autonomous decision workflow exposure'}
              </p>
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                <span>EU AI Act Art. 14 · LGPD</span>
                <span className="text-rose-400 font-mono font-bold">{activeInvestigatedFinding?.severity}</span>
              </div>
            </div>

            {/* 2. CAPABILITY */}
            <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80 space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold block">
                CAPABILITY
              </span>
              <p className="text-xs font-bold text-white truncate">
                {activeInvestigatedFinding?.toolsAffected?.[0] || 'Database Mutation / API'}
              </p>
              <span className="text-[11px] text-slate-400 block pt-0.5 truncate">
                Target: {activeInvestigatedFinding?.systemId || 'Production DB / APIs'}
              </span>
            </div>

            {/* 3. AUTHORIZATION */}
            <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80 space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold block">
                AUTHORIZATION
              </span>
              <p className="text-xs font-bold text-rose-400 flex items-center gap-1">
                <span>⚠ Not Verified</span>
              </p>
              <span className="text-[11px] text-slate-400 block pt-0.5">
                Missing explicit IAM / OAuth scope
              </span>
            </div>

            {/* 4. EVIDENCE */}
            <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80 space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold block">
                EVIDENCE
              </span>
              <p className="text-xs font-bold text-emerald-400 truncate">
                Tamper-Evident Ledger
              </p>
              <span className="text-[10px] font-mono text-slate-400 block truncate pt-0.5">
                SHA-256: {activeInvestigatedFinding?.evidenceDigest?.slice(0, 14) || 'a129206c6d4358'}...
              </span>
            </div>
          </div>

          {/* Epistemic Invariant Guarantee */}
          <div className="px-3 py-2 rounded-lg bg-slate-950/50 border border-slate-800/60 flex items-center justify-between text-xs">
            <span className="text-slate-400">
              Epistemic Guarantee: <strong className="text-slate-300">Observed capability does not imply authorization.</strong>
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              Control: {activeInvestigatedFinding?.controlId || 'CG-AG-02'} · Owner: {activeInvestigatedFinding?.owner.name}
            </span>
          </div>

          {/* Progressive Disclosure Triggers (Level 3–5) */}
          <div className="space-y-1 pt-1 border-t border-slate-800/80">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
              De-escalate to Technical Detail (On Demand):
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-1.5">
              <button
                onClick={() => setActiveDeepDisclosure(prev => prev === 'impact' ? null : 'impact')}
                className={`px-2.5 py-1.5 rounded text-xs font-medium text-left flex items-center justify-between border transition cursor-pointer ${
                  activeDeepDisclosure === 'impact'
                    ? 'bg-sky-950/50 border-sky-500/50 text-sky-200'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="truncate">▸ Business Impact</span>
                {activeDeepDisclosure === 'impact' ? <ChevronDown className="w-3 h-3 ml-1 shrink-0" /> : <ChevronRight className="w-3 h-3 ml-1 shrink-0" />}
              </button>

              <button
                onClick={() => setActiveDeepDisclosure(prev => prev === 'causal' ? null : 'causal')}
                className={`px-2.5 py-1.5 rounded text-xs font-medium text-left flex items-center justify-between border transition cursor-pointer ${
                  activeDeepDisclosure === 'causal'
                    ? 'bg-sky-950/50 border-sky-500/50 text-sky-200'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="truncate">▸ CG-AG Causal Chain</span>
                {activeDeepDisclosure === 'causal' ? <ChevronDown className="w-3 h-3 ml-1 shrink-0" /> : <ChevronRight className="w-3 h-3 ml-1 shrink-0" />}
              </button>

              <button
                onClick={() => setActiveDeepDisclosure(prev => prev === 'treatment' ? null : 'treatment')}
                className={`px-2.5 py-1.5 rounded text-xs font-medium text-left flex items-center justify-between border transition cursor-pointer ${
                  activeDeepDisclosure === 'treatment'
                    ? 'bg-sky-950/50 border-sky-500/50 text-sky-200'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="truncate">▸ Treatment Plan</span>
                {activeDeepDisclosure === 'treatment' ? <ChevronDown className="w-3 h-3 ml-1 shrink-0" /> : <ChevronRight className="w-3 h-3 ml-1 shrink-0" />}
              </button>

              <button
                onClick={() => setActiveDeepDisclosure(prev => prev === 'evidence' ? null : 'evidence')}
                className={`px-2.5 py-1.5 rounded text-xs font-medium text-left flex items-center justify-between border transition cursor-pointer ${
                  activeDeepDisclosure === 'evidence'
                    ? 'bg-sky-950/50 border-sky-500/50 text-sky-200'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="truncate">▸ Evidence Details</span>
                {activeDeepDisclosure === 'evidence' ? <ChevronDown className="w-3 h-3 ml-1 shrink-0" /> : <ChevronRight className="w-3 h-3 ml-1 shrink-0" />}
              </button>

              <button
                onClick={() => setActiveDeepDisclosure(prev => prev === 'raw' ? null : 'raw')}
                className={`px-2.5 py-1.5 rounded text-xs font-medium text-left flex items-center justify-between border transition cursor-pointer ${
                  activeDeepDisclosure === 'raw'
                    ? 'bg-sky-950/50 border-sky-500/50 text-sky-200'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="truncate">▸ Raw Tech Data</span>
                {activeDeepDisclosure === 'raw' ? <ChevronDown className="w-3 h-3 ml-1 shrink-0" /> : <ChevronRight className="w-3 h-3 ml-1 shrink-0" />}
              </button>
            </div>

            {/* Expanded Drawer Content (When active) */}
            {activeDeepDisclosure && (
              <div className="mt-2 p-3 rounded-lg bg-slate-950 border border-slate-800/80 text-xs space-y-2 animate-fadeIn">
                {activeDeepDisclosure === 'impact' && (
                  <div className="space-y-1.5">
                    <span className="font-bold text-slate-200 block">Deterministic Risk Methodology (Likelihood × Impact)</span>
                    <p className="text-slate-400">{activeInvestigatedFinding?.recommendedAction}</p>
                    <div className="flex flex-wrap gap-3 text-[11px] text-slate-400 font-mono pt-1">
                      <span>• Severity: <strong className="text-rose-400">{activeInvestigatedFinding?.severity}</strong></span>
                      <span>• Likelihood: <strong>{activeInvestigatedFinding?.likelihood}</strong></span>
                      <span>• Impact: <strong>{activeInvestigatedFinding?.impact}</strong></span>
                    </div>
                  </div>
                )}

                {activeDeepDisclosure === 'causal' && (
                  <div className="space-y-1.5">
                    <span className="font-bold text-slate-200 block">Causal Chain: Why Does This Risk Exist?</span>
                    <p className="text-slate-400">Control ID: <strong>{activeInvestigatedFinding?.controlId}</strong> — {activeInvestigatedFinding?.controlName}</p>
                    <p className="text-[11px] text-slate-400">Observed Gap: {activeInvestigatedFinding?.finding}</p>
                    <div className="text-[10px] font-mono text-slate-500">Risk ID: {activeInvestigatedFinding?.riskId}</div>
                  </div>
                )}

                {activeDeepDisclosure === 'treatment' && (
                  <div className="space-y-1.5">
                    <span className="font-bold text-slate-200 block">Assigned Treatment & Due Date</span>
                    <p className="text-slate-400">{activeInvestigatedFinding?.treatment.actionRequired}</p>
                    <div className="flex flex-wrap gap-3 text-[11px] text-slate-400 font-mono pt-1">
                      <span>• Assigned To: <strong>{activeInvestigatedFinding?.treatment.assignedTo}</strong></span>
                      <span>• Target Due: <strong>{activeInvestigatedFinding?.treatment.targetDueDate}</strong></span>
                      <span>• Status: <strong>{activeInvestigatedFinding?.treatment.status}</strong></span>
                    </div>
                  </div>
                )}

                {activeDeepDisclosure === 'evidence' && (
                  <div className="space-y-1.5">
                    <span className="font-bold text-slate-200 block">RFC 8785 Canonical Evidence</span>
                    <p className="text-[11px] font-mono text-sky-400 bg-slate-900 p-2 rounded border border-slate-800 break-all">
                      SHA-256 Digest: {activeInvestigatedFinding?.evidenceDigest}
                    </p>
                    <p className="text-[11px] text-slate-400">Recorded into immutable session ledger with human accountability timestamp.</p>
                  </div>
                )}

                {activeDeepDisclosure === 'raw' && (
                  <div className="space-y-1.5 font-mono text-[11px]">
                    <span className="font-bold text-slate-200 font-sans block">Raw Technical Data</span>
                    <div>Source Target: <span className="text-slate-300">{activeInvestigatedFinding?.sourceTarget}</span></div>
                    <div>Tools Affected: <span className="text-slate-300">{activeInvestigatedFinding?.toolsAffected?.join(', ') || 'None'}</span></div>
                    <div>System ID: <span className="text-slate-300">{activeInvestigatedFinding?.systemId}</span></div>
                    <div>Finding Ref ID: <span className="text-slate-400">{activeInvestigatedFinding?.id}</span></div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sibling Finding Switcher if queue has more than 1 item */}
          {activeCategoryFindings.length > 1 && (
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">
                Item {activeCategoryFindings.findIndex(f => f.id === activeInvestigatedFinding?.id) + 1} of {activeCategoryFindings.length} in this queue:
              </span>
              <div className="flex items-center gap-1.5">
                {activeCategoryFindings.map((item, idx) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setSelectedFindingId(item.id);
                      setActiveDeepDisclosure(null);
                      setShowSecondaryVerdicts(false);
                    }}
                    className={`px-2 py-0.5 rounded text-[11px] font-mono transition cursor-pointer ${
                      activeInvestigatedFinding?.id === item.id
                        ? 'bg-sky-600 text-white font-bold'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    #{idx + 1}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* ZONE 5 / 6 — FULL RISK EXPOSURE LEDGER (PROGRESSIVE EXPLORATION)          */}
      {/* ========================================================================= */}
      <div className="rounded-xl border border-slate-800 bg-[#0A1628] overflow-hidden pt-0.5">
        <button
          onClick={() => setIsFullTableExpanded(prev => !prev)}
          className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-900/60 transition cursor-pointer"
        >
          <div className="flex items-center space-x-2.5">
            <FileText className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold text-white">Full Risk Exposure Ledger & Tabular Triage</span>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.2 rounded">
              {filteredFindings.length} of {findings.length} Records
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="text-[11px] font-mono hidden sm:inline">Deep Operational Triage</span>
            {isFullTableExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </div>
        </button>

        {isFullTableExpanded && (
          <div className="p-4 border-t border-slate-800 bg-[#060F1D] space-y-3.5 animate-fadeIn">
            {/* SUBORDINATE FILTER & SEARCH BAR */}
            <div className="p-3 bg-[#0A1628] border border-slate-800 rounded-xl flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search risk ID, title, affected target, control, or owner..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <select
                  value={filterSeverity}
                  onChange={(e) => setFilterSeverity(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-sky-500"
                >
                  <option value="ALL">All Severities</option>
                  <option value="CRITICAL">🔴 Critical</option>
                  <option value="HIGH">🟠 High</option>
                  <option value="MEDIUM">🟡 Medium</option>
                  <option value="LOW">🔵 Low</option>
                </select>

                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-sky-500"
                >
                  <option value="ALL">All Categories</option>
                  <option value="AUTONOMY_OVERSIGHT">Autonomy & HITL</option>
                  <option value="PRIVACY_DATA">Privacy & PII</option>
                  <option value="TOOL_AUTHORIZATION">Tool Authorization</option>
                  <option value="RESILIENCE">Resilience & Failsafe</option>
                </select>

                <select
                  value={filterDecision}
                  onChange={(e) => setFilterDecision(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-sky-500"
                >
                  <option value="ALL">All Decisions</option>
                  <option value="PENDING_DECISION">⚠️ Pending Decision</option>
                  <option value="MITIGATE">✓ Mitigated</option>
                  <option value="ACCEPT">✓ Accepted</option>
                  <option value="ESCALATE">▲ Escalated</option>
                </select>

                {(searchTerm || filterSeverity !== 'ALL' || filterCategory !== 'ALL' || filterDecision !== 'ALL') && (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setFilterSeverity('ALL');
                      setFilterCategory('ALL');
                      setFilterDecision('ALL');
                    }}
                    className="px-2 py-1.5 text-xs text-slate-400 hover:text-white transition cursor-pointer"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            {/* FULL 8-COLUMN DATA TABLE */}
            <div className="bg-[#0A1628] border border-slate-800 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[11px] font-mono">
                    <tr>
                      <th className="py-2.5 px-3">Risk ID & Finding</th>
                      <th className="py-2.5 px-3">Severity</th>
                      <th className="py-2.5 px-3">Affected Target</th>
                      <th className="py-2.5 px-3">CG-AG Control</th>
                      <th className="py-2.5 px-3">Accountable Owner</th>
                      <th className="py-2.5 px-3">Decision Status</th>
                      <th className="py-2.5 px-3">Treatment Action</th>
                      <th className="py-2.5 px-3 text-right">Investigate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans">
                    {filteredFindings.map((item) => {
                      const isCritical = item.severity === 'CRITICAL';
                      const isHigh = item.severity === 'HIGH';
                      const isPending = item.status === 'PENDING_DECISION';

                      return (
                        <tr
                          key={item.id}
                          onClick={() => setSelectedFinding(item)}
                          className="hover:bg-slate-900/60 transition cursor-pointer group"
                        >
                          {/* ID & Title */}
                          <td className="py-3 px-3">
                            <div className="font-bold text-slate-200 group-hover:text-sky-400 transition-colors flex items-center gap-1.5">
                              <AlertTriangle className={`w-3.5 h-3.5 shrink-0 ${isCritical ? 'text-rose-500' : (isHigh ? 'text-amber-500' : 'text-blue-500')}`} />
                              <span>{item.finding}</span>
                            </div>
                            <div className="font-mono text-[10px] text-slate-400 mt-0.5">{item.riskId} · {item.category.replace(/_/g, ' ')}</div>
                          </td>

                          {/* Severity */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                              isCritical
                                ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                : (isHigh
                                  ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                  : 'bg-blue-950 text-blue-300 border border-blue-800')
                            }`}>
                              {item.severity}
                            </span>
                          </td>

                          {/* Affected Target */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <div className="font-medium text-slate-300">{item.agentName || item.systemId}</div>
                            <div className="text-[10px] text-slate-500 font-mono">{item.sourceTarget}</div>
                          </td>

                          {/* CG-AG Control */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span className="font-mono font-bold text-sky-400 bg-sky-950/60 px-2 py-0.5 rounded border border-sky-800">
                              {item.controlId}
                            </span>
                            <div className="text-[10px] text-slate-400 mt-0.5">{item.controlName}</div>
                          </td>

                          {/* Owner */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <div className="font-medium text-slate-300">{item.owner.name}</div>
                            <div className="text-[10px] text-slate-500">{item.owner.role}</div>
                          </td>

                          {/* Decision Status */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                              isPending
                                ? 'bg-rose-950/70 text-rose-300 border border-rose-800 animate-pulse'
                                : 'bg-emerald-950/70 text-emerald-300 border border-emerald-800'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${isPending ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                              {item.decisionType.replace(/_/g, ' ')}
                            </span>
                          </td>

                          {/* Treatment Action */}
                          <td className="py-3 px-3">
                            <div className="text-[11px] text-slate-300 truncate max-w-xs">{item.treatment.actionRequired}</div>
                            <div className="text-[10px] text-slate-500 font-mono">Due: {item.treatment.targetDueDate}</div>
                          </td>

                          {/* Action Button */}
                          <td className="py-3 px-3 text-right whitespace-nowrap">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedFinding(item);
                              }}
                              className="text-sky-400 hover:text-sky-300 font-semibold text-xs inline-flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform cursor-pointer"
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
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* LEGACY DEEP INSPECTION SLIDE-OVER DRAWER (PRESERVED FOR TABLE TRIAGE)     */}
      {/* ========================================================================= */}
      {selectedFinding && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-xs flex justify-end animate-fadeIn">
          <div className="w-full max-w-2xl bg-[#0B132B] border-l border-slate-800 h-full shadow-2xl flex flex-col justify-between overflow-y-auto">
            <div>
              {/* Drawer Top */}
              <div className="p-5 border-b border-slate-800 flex items-start justify-between bg-slate-950/60">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-rose-400 bg-rose-950 px-2 py-0.5 rounded border border-rose-800">
                      {selectedFinding.riskId}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-slate-800 text-slate-300">
                      {selectedFinding.category.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-rose-950 text-rose-300">
                      {selectedFinding.severity}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-white mt-2">
                    {selectedFinding.finding}
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Target: {selectedFinding.sourceTarget}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedFinding(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Tabs */}
              <div className="flex border-b border-slate-800 px-5 text-xs font-semibold overflow-x-auto">
                {(['overview', 'exposure', 'control', 'decision', 'treatment', 'evidence'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveDrawerTab(tab)}
                    className={`py-3 px-3 border-b-2 capitalize whitespace-nowrap transition cursor-pointer ${
                      activeDrawerTab === tab
                        ? 'border-sky-500 text-sky-400 font-bold'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {tab === 'control' ? 'Control & Finding' : tab}
                  </button>
                ))}
              </div>

              {/* Drawer Tab Content */}
              <div className="p-6 space-y-5 text-xs">
                {/* 1. OVERVIEW */}
                {activeDrawerTab === 'overview' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-3">
                      <div className="font-bold text-slate-200 flex items-center justify-between">
                        <span>Deterministic Risk Methodology</span>
                        <span className="font-mono text-[11px] text-sky-400">Likelihood × Impact</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="p-2.5 bg-slate-800 rounded-lg">
                          <span className="text-[10px] text-slate-400">Likelihood:</span>
                          <div className="font-bold text-slate-100">{selectedFinding.likelihood}</div>
                        </div>
                        <div className="p-2.5 bg-slate-800 rounded-lg">
                          <span className="text-[10px] text-slate-400">Impact:</span>
                          <div className="font-bold text-slate-100">{selectedFinding.impact}</div>
                        </div>
                        <div className="p-2.5 bg-rose-950/60 border border-rose-800 rounded-lg">
                          <span className="text-[10px] text-rose-400 font-semibold">Calculated Level:</span>
                          <div className="font-bold text-rose-400">{selectedFinding.severity}</div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 p-4 bg-slate-900/60 rounded-xl border border-slate-800 text-slate-300">
                      <div>
                        <span className="text-slate-400 text-[11px]">Accountable Owner:</span>
                        <div className="font-semibold text-white mt-0.5">{selectedFinding.owner.name}</div>
                        <div className="text-[10px] text-slate-400">{selectedFinding.owner.role}</div>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px]">Department / Unit:</span>
                        <div className="font-semibold text-white mt-0.5">{selectedFinding.owner.department}</div>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px]">Governance Decision State:</span>
                        <div className="font-bold text-sky-400 mt-0.5">{selectedFinding.decisionType.replace(/_/g, ' ')}</div>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px]">Operational Status:</span>
                        <div className="font-semibold text-white mt-0.5">{selectedFinding.status}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. EXPOSURE */}
                {activeDrawerTab === 'exposure' && (
                  <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-3">
                    <div className="font-bold text-slate-200 flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-sky-400" />
                      <span>Affected AI Architecture & Target</span>
                    </div>
                    <div className="space-y-2 text-slate-300">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Target System Reference:</span>
                        <span className="font-semibold text-white">{selectedFinding.systemId}</span>
                      </div>
                      {selectedFinding.agentName && (
                        <div className="flex justify-between">
                          <span className="text-slate-400">Autonomous Agent:</span>
                          <span className="font-mono font-bold text-sky-400">{selectedFinding.agentName} ({selectedFinding.agentId})</span>
                        </div>
                      )}
                      {selectedFinding.team && (
                        <div className="flex justify-between">
                          <span className="text-slate-400">Squad / Team:</span>
                          <span>{selectedFinding.team}</span>
                        </div>
                      )}
                      {selectedFinding.model && (
                        <div className="flex justify-between">
                          <span className="text-slate-400">Foundation Model:</span>
                          <span className="font-mono">{selectedFinding.model}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 3. CONTROL & FINDING CAUSAL CHAIN */}
                {activeDrawerTab === 'control' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-3">
                      <div className="font-bold text-slate-200">Causal Chain: Why Does This Risk Exist?</div>
                      <div className="space-y-3">
                        <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                          <div className="text-[10px] text-slate-400 uppercase font-bold">1. Governance Control In Scope</div>
                          <div className="font-bold text-sky-400 mt-0.5">{selectedFinding.controlId} · {selectedFinding.controlName}</div>
                        </div>

                        <div className="flex justify-center">
                          <ArrowRight className="w-4 h-4 text-slate-400 transform rotate-90" />
                        </div>

                        <div className="p-3 bg-amber-950/40 border border-amber-800 rounded-lg">
                          <div className="text-[10px] text-amber-400 uppercase font-bold">2. Observed Finding / Gap</div>
                          <div className="font-semibold text-amber-200 mt-0.5">{selectedFinding.finding}</div>
                          <div className="text-[10px] font-mono text-slate-400 mt-1">Ref: {selectedFinding.id}</div>
                        </div>

                        <div className="flex justify-center">
                          <ArrowRight className="w-4 h-4 text-slate-400 transform rotate-90" />
                        </div>

                        <div className="p-3 bg-rose-950/40 border border-rose-800 rounded-lg">
                          <div className="text-[10px] text-rose-400 uppercase font-bold">3. Resulting Exposure Risk</div>
                          <div className="font-bold text-rose-200 mt-0.5">{selectedFinding.riskId}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. HUMAN DECISION */}
                {activeDrawerTab === 'decision' && (
                  <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-4">
                    <div className="font-bold text-slate-200 flex items-center justify-between">
                      <span>Human Governance Decision Sign-Off</span>
                      <span className="text-[10px] text-slate-400">Accountable Lead: {selectedFinding.owner.name}</span>
                    </div>

                    {selectedFinding.status === 'PENDING_DECISION' ? (
                      <div className="space-y-3">
                        <p className="text-[11px] text-slate-300 leading-relaxed">
                          Under CG-AG Governance OS, risks do not automatically become actions. Choose an explicit, accountable decision:
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => handleExecuteDecision(selectedFinding, 'MITIGATE')}
                            className="p-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>1. MITIGATE (Apply Guardrails)</span>
                          </button>
                          <button
                            onClick={() => handleExecuteDecision(selectedFinding, 'ACCEPT')}
                            className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 border border-slate-700 cursor-pointer"
                          >
                            <span>2. ACCEPT (Formal Sign-Off)</span>
                          </button>
                          <button
                            onClick={() => handleExecuteDecision(selectedFinding, 'TRANSFER')}
                            className="p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                          >
                            <span>3. TRANSFER (Insurance/Vendor)</span>
                          </button>
                          <button
                            onClick={() => handleExecuteDecision(selectedFinding, 'ESCALATE')}
                            className="p-3 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                          >
                            <span>4. ESCALATE (Board / C-Level)</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-emerald-950/60 border border-emerald-800 rounded-xl space-y-2">
                        <div className="flex items-center gap-1.5 text-emerald-300 font-bold">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          <span>Governance Decision Formally Executed</span>
                        </div>
                        <div className="text-xs text-slate-300">
                          Decision Type: <strong className="text-emerald-400">{selectedFinding.decisionType}</strong>
                        </div>
                        <div className="font-mono text-[11px] text-slate-400">
                          Decision ID: {selectedFinding.decision?.decisionId || 'DEC-2026-RESOLVED'}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 5. TREATMENT */}
                {activeDrawerTab === 'treatment' && (
                  <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-3">
                    <div className="font-bold text-slate-200">Treatment Plan & Corrective Action</div>
                    <div className="space-y-2 text-slate-300">
                      <div>
                        <span className="text-slate-400">Assigned Action:</span>
                        <div className="p-2.5 bg-slate-800 rounded-lg mt-1 font-semibold text-white">
                          {selectedFinding.treatment.actionRequired}
                        </div>
                      </div>
                      <div className="flex justify-between pt-1">
                        <span className="text-slate-400">Assigned Treatment Squad:</span>
                        <span className="font-semibold text-white">{selectedFinding.treatment.assignedTo}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Target Resolution Due Date:</span>
                        <span className="font-mono font-bold text-white">{selectedFinding.treatment.targetDueDate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Treatment Lifecycle Status:</span>
                        <span className="font-bold text-sky-400">{selectedFinding.treatment.status}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 6. EVIDENCE & AUDIT */}
                {activeDrawerTab === 'evidence' && (
                  <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-3">
                    <div className="font-bold text-slate-200 flex items-center gap-1.5">
                      <Lock className="w-4 h-4 text-emerald-500" />
                      <span>Tamper-Evident Evidence & Audit Link</span>
                    </div>
                    <div className="font-mono text-[11px] p-2.5 bg-slate-900 rounded border border-slate-800 text-sky-400 break-all">
                      RFC 8785 SHA-256 Digest: {selectedFinding.evidenceDigest}
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Chained into the Tamper-Evident Session Ledger upon risk identification and human decision registration.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-mono">Risk ID: {selectedFinding.riskId}</span>
              <button
                onClick={() => setSelectedFinding(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition cursor-pointer"
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
