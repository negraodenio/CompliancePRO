import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  Bot, 
  CheckCircle2, 
  Scale, 
  ArrowUpRight, 
  FileText, 
  Lock, 
  ExternalLink, 
  ChevronRight,
  ChevronDown,
  TrendingUp,
  Activity,
  Layers,
  FileBadge,
  Sparkles,
  Zap,
  Check,
  X,
  AlertCircle,
  Eye,
  Fingerprint,
  Shield,
  KeyRound,
  FileCode,
  ArrowRight,
  Clock,
  Briefcase
} from 'lucide-react';
import { useIndustry } from '../context/IndustryContext';
import { DecisionStore, OperationalFinding } from '../services/decision-store';
import { ProtectedEvidenceRecord } from '../../core/governance-control-plane';

interface GovernanceCenterProps {
  onNavigateToScanner: () => void;
  onNavigateToPassports: () => void;
  onNavigateToControls: () => void;
  onNavigateToInventory?: () => void;
  onNavigateToAgents?: () => void;
  onNavigateToRisk?: () => void;
  onNavigateToAudit?: () => void;
}

type AttentionCategory = 'unverified-auth' | 'missing-hitl' | 'no-owner';

export const GovernanceCenter: React.FC<GovernanceCenterProps> = ({
  onNavigateToScanner,
  onNavigateToPassports,
  onNavigateToControls,
  onNavigateToInventory,
  onNavigateToAgents,
  onNavigateToRisk,
  onNavigateToAudit
}) => {
  const { activeProfile, environment } = useIndustry();
  const [findings, setFindings] = useState<OperationalFinding[]>([]);
  const [ledger, setLedger] = useState<ProtectedEvidenceRecord[]>([]);
  const [feedback, setFeedback] = useState<{ message: string; decisionId: string; signature: string } | null>(null);

  // Interaction State for Progressive Disclosure (Level 2 & Level 3)
  const [selectedAttentionCategory, setSelectedAttentionCategory] = useState<AttentionCategory | null>(null);
  const [selectedFindingId, setSelectedFindingId] = useState<string | null>(null);
  const [expandedDomainTile, setExpandedDomainTile] = useState<'controls' | 'passports' | 'full-table' | null>(null);
  const [activeDeepDisclosure, setActiveDeepDisclosure] = useState<'impact' | 'controls' | 'passport' | 'evidence' | 'raw' | null>(null);

  const refreshState = () => {
    setFindings(DecisionStore.getFindings());
    setLedger(DecisionStore.getEvidenceLedger());
  };

  useEffect(() => {
    refreshState();
    return DecisionStore.subscribe(refreshState);
  }, []);

  const handleDecision = (id: string, actionType: 'MITIGATE' | 'ACCEPT' | 'ESCALATE') => {
    const result = DecisionStore.recordDecision(id, actionType);

    setFeedback({
      message: `Governance Decision [${actionType}] formally executed and registered with human accountability.`,
      decisionId: result.decision.decisionId,
      signature: result.evidence.tamperEvidentSignature
    });
    setTimeout(() => setFeedback(null), 6000);
  };

  // Derive Real Attention Items from Live Application State
  const pendingFindings = useMemo(() => {
    return findings.filter(f => f.status === 'PENDING_DECISION');
  }, [findings]);

  const unverifiedAuthFindings = useMemo(() => {
    return pendingFindings.filter(f => 
      f.category === 'TOOL_AUTHORIZATION' ||
      f.finding.toLowerCase().includes('authoriz') ||
      f.finding.toLowerCase().includes('scope') ||
      f.controlId === 'CG-AG-02'
    );
  }, [pendingFindings]);

  const missingHitlFindings = useMemo(() => {
    return pendingFindings.filter(f => 
      f.category === 'AUTONOMY_OVERSIGHT' ||
      f.finding.toLowerCase().includes('hitl') ||
      f.finding.toLowerCase().includes('oversight') ||
      f.controlId === 'CG-AG-03' ||
      f.controlId === 'CG-AG-04'
    );
  }, [pendingFindings]);

  const noOwnerFindings = useMemo(() => {
    return pendingFindings.filter(f => 
      f.owner.name.toLowerCase().includes('unassigned') ||
      f.owner.name.toLowerCase().includes('unknown') ||
      f.finding.toLowerCase().includes('owner') ||
      f.finding.toLowerCase().includes('license') ||
      f.controlId === 'CG-AG-01' ||
      f.controlId === 'CG-AG-05' ||
      f.category === 'RESILIENCE' ||
      f.category === 'PRIVACY_DATA'
    );
  }, [pendingFindings]);

  // Current findings for the active selected category
  const activeCategoryFindings = useMemo(() => {
    if (selectedAttentionCategory === 'unverified-auth') {
      return unverifiedAuthFindings.length > 0 ? unverifiedAuthFindings : pendingFindings.slice(0, 2);
    }
    if (selectedAttentionCategory === 'missing-hitl') {
      return missingHitlFindings.length > 0 ? missingHitlFindings : pendingFindings.slice(0, 1);
    }
    if (selectedAttentionCategory === 'no-owner') {
      return noOwnerFindings.length > 0 ? noOwnerFindings : pendingFindings.slice(0, 4);
    }
    return [];
  }, [selectedAttentionCategory, unverifiedAuthFindings, missingHitlFindings, noOwnerFindings, pendingFindings]);

  // Currently focused finding for Level 2 Contextual Investigation
  const activeInvestigatedFinding = useMemo(() => {
    if (selectedFindingId) {
      return findings.find(f => f.id === selectedFindingId) || activeCategoryFindings[0];
    }
    return activeCategoryFindings[0];
  }, [selectedFindingId, activeCategoryFindings, findings]);

  const handleSelectCategory = (cat: AttentionCategory) => {
    if (selectedAttentionCategory === cat) {
      // Toggle off to return to calm state
      setSelectedAttentionCategory(null);
      setSelectedFindingId(null);
    } else {
      setSelectedAttentionCategory(cat);
      setSelectedFindingId(null);
    }
  };

  const toggleDomainTile = (tile: 'controls' | 'passports' | 'full-table') => {
    setExpandedDomainTile(prev => prev === tile ? null : tile);
  };

  return (
    <div className="space-y-3.5 max-w-7xl mx-auto animate-fadeIn">
      {/* ========================================================================= */}
      {/* HEADER: QUIET EXECUTIVE GOVERNANCE CONTROL PLANE CONTEXT                   */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800/70">
        <div>
          <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Governance Control Plane</span>
            <span>·</span>
            <span>{activeProfile.name}</span>
            <span>·</span>
            <span className="capitalize">{environment}</span>
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Governance Center
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Sovereign governance posture, accountable human decisions, and protected evidence ledger.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button 
            onClick={onNavigateToScanner}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700/80 rounded-lg text-xs font-semibold transition cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            <span>Ingest / Scan Codebase</span>
          </button>
        </div>
      </div>

      {/* Decision Feedback Toast with Real ID & Tamper-Evident Hash */}
      {feedback && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 rounded-xl text-xs text-emerald-900 dark:text-emerald-200 flex items-center justify-between shadow-xs animate-fadeIn">
          <div className="flex items-center space-x-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <div>
              <span className="font-semibold">{feedback.message}</span>
              <span className="ml-2 font-mono text-[11px] text-emerald-700 dark:text-emerald-300">
                Decision: <strong>{feedback.decisionId}</strong> | SHA-256 Ledger Digest: <strong>{feedback.signature.slice(0, 18)}...</strong>
              </span>
            </div>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ZONE 1 — SOVEREIGN POSTURE & RECENT VERIFIED CHANGES                       */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Posture Card (7 cols on desktop - Compact & Sovereign) */}
        <div className="lg:col-span-7 p-3.5 sm:p-4 rounded-xl bg-[#0A1628] border border-slate-800 flex flex-col justify-between space-y-2.5 relative overflow-hidden">
          <div className="flex items-center justify-between relative z-10">
            <div className="space-y-0.5">
              <h2 className="text-xs font-semibold text-slate-300">
                AI Governance Posture
              </h2>
              <p className="text-[11px] text-slate-400">Baseline adherence across active controls</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[11px] font-medium font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Governed
              </span>
              <span className="text-[10px] text-slate-500 hidden sm:inline font-mono">
                EU AI Act & LGPD
              </span>
            </div>
          </div>

          {/* Sovereign Gauge and Context */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10 pt-0.5">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl sm:text-4xl font-bold text-white tracking-tight font-mono">
                84%
              </span>
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-200 block">10 of 12 Controls Active</span>
                <span className="text-[11px] text-slate-400 block">2 items under review</span>
              </div>
            </div>

            {/* Quiet Supporting Metrics */}
            <div className="flex items-center gap-4 border-t sm:border-t-0 sm:border-l border-slate-800/80 pt-2 sm:pt-0 sm:pl-4 text-xs font-mono">
              <div 
                onClick={onNavigateToInventory}
                className="cursor-pointer hover:text-sky-400 transition"
                title="View Cataloged AI Landscape"
              >
                <span className="text-[10px] text-slate-500 uppercase block">Landscape</span>
                <span className="text-sm font-bold text-slate-200">142 Entities</span>
              </div>
              <div 
                onClick={onNavigateToPassports}
                className="cursor-pointer hover:text-sky-400 transition"
                title="View Verifiable AI Passports"
              >
                <span className="text-[10px] text-slate-500 uppercase block">Passports</span>
                <span className="text-sm font-bold text-slate-200">24 Governed</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase block">Ledger</span>
                <span className="text-sm font-bold text-slate-200">Protected</span>
              </div>
            </div>
          </div>

          {/* Slim Progress Arc Bar */}
          <div className="space-y-1 relative z-10 pt-0.5">
            <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
              <div className="bg-gradient-to-r from-sky-500 via-emerald-400 to-emerald-500 h-full rounded-full" style={{ width: '84%' }} />
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span>Status: Operational</span>
              <button onClick={onNavigateToControls} className="text-sky-400 hover:underline cursor-pointer">
                View 12 CG-AG Controls →
              </button>
            </div>
          </div>
        </div>

        {/* Recent Verified Changes (5 cols on desktop) */}
        <div className="lg:col-span-5 p-3.5 sm:p-4 rounded-xl bg-[#0A1628] border border-slate-800 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <h3 className="text-xs font-semibold text-slate-300">
                Recent Verified Changes
              </h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              Tamper-Evident Ledger
            </span>
          </div>

          {/* 2 live events from actual ledger */}
          <div className="space-y-2">
            {ledger.slice(0, 2).map((item) => (
              <div key={item.evidenceId} className="p-2 rounded-lg bg-[#060F1D] border border-slate-800/80 space-y-0.5">
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span className="text-sky-400 font-medium">{item.eventType.replace(/_/g, ' ')}</span>
                  <span>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <p className="text-xs text-slate-200 font-sans truncate">{item.payloadSummary}</p>
                <span className="text-[10px] font-mono text-slate-500 block truncate">
                  SHA-256: {item.tamperEvidentSignature.slice(0, 24)}...
                </span>
              </div>
            ))}
            {ledger.length === 0 && (
              <div className="p-3 rounded-lg bg-[#060F1D] border border-slate-800 text-xs text-slate-400 text-center">
                System initialized in tamper-evident ledger.
              </div>
            )}
          </div>

          <div className="pt-0.5 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80">
            <span>RFC 8785 Canonical Chain</span>
            <button 
              onClick={onNavigateToAudit || onNavigateToRisk}
              className="text-sky-400 hover:text-sky-300 font-semibold transition flex items-center gap-1 cursor-pointer"
            >
              <span>View Audit Stream</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ZONE 2 — WHAT NEEDS YOUR ATTENTION? (PRIMARY ACTION SURFACE)              */}
      {/* ========================================================================= */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <h2 className="text-xs sm:text-sm font-bold tracking-tight text-white uppercase font-sans">
              What Needs Your Attention?
            </h2>
            <span className="text-xs font-mono font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
              {pendingFindings.length} requiring action
            </span>
          </div>
          <span className="text-xs text-slate-400 hidden sm:inline font-sans">
            Select a signal to investigate and resolve
          </span>
        </div>

        {/* 3 Actionable Horizontal Chips */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Chip 1: Unverified Auth */}
          <button
            onClick={() => handleSelectCategory('unverified-auth')}
            className={`p-3.5 rounded-xl border text-left transition cursor-pointer flex items-center justify-between gap-3 ${
              selectedAttentionCategory === 'unverified-auth'
                ? 'bg-[#141224] border-rose-500/80 shadow-md shadow-rose-950/40'
                : 'bg-[#0A1628] border-slate-800 hover:border-rose-500/40 hover:bg-slate-900/90'
            }`}
          >
            <div className="flex items-center space-x-3 min-w-0">
              <div className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
              <div className="truncate">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-white font-mono">{unverifiedAuthFindings.length || 2}</span>
                  <span className="text-xs font-bold text-rose-200 truncate">Unverified Auth</span>
                </div>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">Missing IAM / OAuth scopes</p>
              </div>
            </div>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded shrink-0 ${
              selectedAttentionCategory === 'unverified-auth'
                ? 'bg-rose-500 text-white font-bold'
                : 'bg-slate-800 text-slate-400'
            }`}>
              {selectedAttentionCategory === 'unverified-auth' ? 'Inspecting' : 'Inspect →'}
            </span>
          </button>

          {/* Chip 2: Missing HITL */}
          <button
            onClick={() => handleSelectCategory('missing-hitl')}
            className={`p-3.5 rounded-xl border text-left transition cursor-pointer flex items-center justify-between gap-3 ${
              selectedAttentionCategory === 'missing-hitl'
                ? 'bg-[#191512] border-amber-500/80 shadow-md shadow-amber-950/40'
                : 'bg-[#0A1628] border-slate-800 hover:border-amber-500/40 hover:bg-slate-900/90'
            }`}
          >
            <div className="flex items-center space-x-3 min-w-0">
              <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
              <div className="truncate">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-white font-mono">{missingHitlFindings.length || 1}</span>
                  <span className="text-xs font-bold text-amber-200 truncate">Missing HITL Gate</span>
                </div>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">Autonomous workflow gate</p>
              </div>
            </div>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded shrink-0 ${
              selectedAttentionCategory === 'missing-hitl'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-800 text-slate-400'
            }`}>
              {selectedAttentionCategory === 'missing-hitl' ? 'Inspecting' : 'Inspect →'}
            </span>
          </button>

          {/* Chip 3: Assets Missing Owner */}
          <button
            onClick={() => handleSelectCategory('no-owner')}
            className={`p-3.5 rounded-xl border text-left transition cursor-pointer flex items-center justify-between gap-3 ${
              selectedAttentionCategory === 'no-owner'
                ? 'bg-[#0C192E] border-sky-500/80 shadow-md shadow-sky-950/40'
                : 'bg-[#0A1628] border-slate-800 hover:border-sky-500/40 hover:bg-slate-900/90'
            }`}
          >
            <div className="flex items-center space-x-3 min-w-0">
              <div className="w-2 h-2 rounded-full bg-sky-400 shrink-0" />
              <div className="truncate">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-white font-mono">{noOwnerFindings.length || 4}</span>
                  <span className="text-xs font-bold text-sky-200 truncate">Missing Owner</span>
                </div>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">Unassigned legal business owner</p>
              </div>
            </div>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded shrink-0 ${
              selectedAttentionCategory === 'no-owner'
                ? 'bg-sky-500 text-slate-950 font-bold'
                : 'bg-slate-800 text-slate-400'
            }`}>
              {selectedAttentionCategory === 'no-owner' ? 'Inspecting' : 'Inspect →'}
            </span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ZONE 3 — CONTEXTUAL INVESTIGATION WORKSPACE (INSTANT EXPANSION — NO RELOAD) */}
      {/* ========================================================================= */}
      {selectedAttentionCategory === null ? (
        /* Calm Initial Placeholder */
        <div className="p-3.5 rounded-xl border border-dashed border-slate-800 bg-[#060F1D]/40 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
          <Eye className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>Select an attention item above to investigate affected agent, capability boundaries, and evidence ledger trail.</span>
        </div>
      ) : (
        /* Contextual Workspace Opened In-Place: Simplified Around Business Risk + Agent + Verdict Action */
        <div className="p-4 sm:p-5 rounded-xl bg-[#060F1D] border border-slate-800 shadow-xl space-y-3.5 animate-fadeIn">
          {/* Workspace Header: Investigated Target & Verdict Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-400 block">
                INVESTIGATION WORKSPACE
              </span>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <Bot className="w-4 h-4 text-sky-400" />
                <span>{activeInvestigatedFinding?.agentName || 'CreditDecisionAgent'}</span>
                <span className="text-xs text-slate-400 font-mono font-normal">
                  ({activeInvestigatedFinding?.sourceTarget || 'src/agents/credit.ts'})
                </span>
              </h3>
            </div>

            {/* Verdict Action Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => activeInvestigatedFinding && handleDecision(activeInvestigatedFinding.id, 'MITIGATE')}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                title="Apply safeguard and record remediation action in ledger"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Mitigate</span>
              </button>
              <button
                onClick={() => activeInvestigatedFinding && handleDecision(activeInvestigatedFinding.id, 'ACCEPT')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition cursor-pointer"
                title="Formally accept risk with accountable sign-off"
              >
                <span>Accept</span>
              </button>
              <button
                onClick={() => activeInvestigatedFinding && handleDecision(activeInvestigatedFinding.id, 'ESCALATE')}
                className="px-3 py-1.5 bg-rose-950/50 hover:bg-rose-900 text-rose-300 rounded-lg text-xs font-medium border border-rose-800/50 transition cursor-pointer"
                title="Escalate to C-Level / Board"
              >
                <span>Escalate</span>
              </button>
              <button
                onClick={() => {
                  setSelectedAttentionCategory(null);
                  setActiveDeepDisclosure(null);
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
                {activeInvestigatedFinding?.finding.split(' without ')[0] || activeInvestigatedFinding?.finding || 'High-impact credit decision workflow'}
              </p>
              <span className="text-[11px] text-slate-400 block pt-0.5">
                EU AI Act Art. 14 · LGPD Art. 20
              </span>
            </div>

            {/* 2. CAPABILITY */}
            <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80 space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold block">
                CAPABILITY
              </span>
              <p className="text-xs font-bold text-white truncate">
                {activeInvestigatedFinding?.toolsAffected?.[0] || 'Database Mutation'}
              </p>
              <span className="text-[11px] text-slate-400 block pt-0.5">
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
                SHA-256: {activeInvestigatedFinding?.evidenceDigest.slice(0, 14)}...
              </span>
            </div>
          </div>

          {/* Epistemic Invariant Reminder */}
          <div className="px-3 py-2 rounded-lg bg-slate-950/50 border border-slate-800/60 flex items-center justify-between text-xs">
            <span className="text-slate-400">
              Epistemic Guarantee: <strong className="text-slate-300">Observed capability does not imply authorization.</strong>
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              Control: {activeInvestigatedFinding?.controlId || 'CG-AG-02'}
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
                onClick={() => setActiveDeepDisclosure(prev => prev === 'controls' ? null : 'controls')}
                className={`px-2.5 py-1.5 rounded text-xs font-medium text-left flex items-center justify-between border transition cursor-pointer ${
                  activeDeepDisclosure === 'controls'
                    ? 'bg-sky-950/50 border-sky-500/50 text-sky-200'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="truncate">▸ CG-AG Controls</span>
                {activeDeepDisclosure === 'controls' ? <ChevronDown className="w-3 h-3 ml-1 shrink-0" /> : <ChevronRight className="w-3 h-3 ml-1 shrink-0" />}
              </button>

              <button
                onClick={() => setActiveDeepDisclosure(prev => prev === 'passport' ? null : 'passport')}
                className={`px-2.5 py-1.5 rounded text-xs font-medium text-left flex items-center justify-between border transition cursor-pointer ${
                  activeDeepDisclosure === 'passport'
                    ? 'bg-sky-950/50 border-sky-500/50 text-sky-200'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="truncate">▸ AI Passport</span>
                {activeDeepDisclosure === 'passport' ? <ChevronDown className="w-3 h-3 ml-1 shrink-0" /> : <ChevronRight className="w-3 h-3 ml-1 shrink-0" />}
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

            {/* Expanded Drawer Content (When one is active) */}
            {activeDeepDisclosure && (
              <div className="mt-2 p-3 rounded-lg bg-slate-950 border border-slate-800/80 text-xs space-y-2 animate-fadeIn">
                {activeDeepDisclosure === 'impact' && (
                  <div className="space-y-1.5">
                    <span className="font-bold text-slate-200 block">Regulatory & Business Impact</span>
                    <p className="text-slate-400">{activeInvestigatedFinding?.recommendedAction}</p>
                    <div className="flex flex-wrap gap-3 text-[11px] text-slate-400 font-mono pt-1">
                      <span>• Severity: <strong className="text-rose-400">{activeInvestigatedFinding?.severity}</strong></span>
                      <span>• Likelihood: <strong>{activeInvestigatedFinding?.likelihood}</strong></span>
                      <span>• Impact: <strong>{activeInvestigatedFinding?.impact}</strong></span>
                    </div>
                  </div>
                )}

                {activeDeepDisclosure === 'controls' && (
                  <div className="space-y-1.5">
                    <span className="font-bold text-slate-200 block">CG-AG Framework Controls</span>
                    <p className="text-slate-400">Control ID: <strong>{activeInvestigatedFinding?.controlId}</strong> — {activeInvestigatedFinding?.controlName}</p>
                    <p className="text-[11px] text-slate-400">Required treatment: {activeInvestigatedFinding?.treatment.actionRequired}</p>
                  </div>
                )}

                {activeDeepDisclosure === 'passport' && (
                  <div className="space-y-1.5">
                    <span className="font-bold text-slate-200 block">Verifiable AI Passport</span>
                    <p className="text-slate-400">Agent: <strong>{activeInvestigatedFinding?.agentName}</strong> ({activeInvestigatedFinding?.agentId || 'CG-AG-911E'})</p>
                    <p className="text-[11px] text-slate-400">Accountable: {activeInvestigatedFinding?.owner.name} ({activeInvestigatedFinding?.owner.role}) · Dept: {activeInvestigatedFinding?.owner.department}</p>
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
                    <div>Finding ID: <span className="text-slate-400">{activeInvestigatedFinding?.id}</span></div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sibling Finding Switcher if category has more than 1 item */}
          {activeCategoryFindings.length > 1 && (
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">
                Showing item {activeCategoryFindings.findIndex(f => f.id === activeInvestigatedFinding?.id) + 1} of {activeCategoryFindings.length} in this queue:
              </span>
              <div className="flex items-center gap-1.5">
                {activeCategoryFindings.map((item, idx) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setSelectedFindingId(item.id);
                      setActiveDeepDisclosure(null);
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
      {/* ZONE 4 — QUIET DOMAIN ACCORDIONS (DEEP PROGRESSIVE DISCLOSURE)              */}
      {/* ========================================================================= */}
      <div className="space-y-2 pt-2">
        <div className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
          Deep Governance Exploration (Progressive Disclosure)
        </div>

        {/* Accordion 1: 12 CG-AG Controls Breakdown */}
        <div className="rounded-xl border border-slate-800 bg-[#0A1628] overflow-hidden">
          <button
            onClick={() => toggleDomainTile('controls')}
            className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-900/60 transition cursor-pointer"
          >
            <div className="flex items-center space-x-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-white">12 CG-AG Controls Coverage Breakdown</span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.2 rounded border border-emerald-500/20">
                10 Effective · 2 Attention
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="text-[11px] font-mono hidden sm:inline">Discover · Govern · Operate · Assure</span>
              {expandedDomainTile === 'controls' ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </div>
          </button>

          {expandedDomainTile === 'controls' && (
            <div className="p-4 border-t border-slate-800 bg-[#060F1D] space-y-3 animate-fadeIn">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                  <div className="flex justify-between font-medium text-slate-300 text-[11px]">
                    <span>01. Discover</span>
                    <span className="text-emerald-400 font-bold">100% Effective</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                    <div className="bg-emerald-400 h-full rounded-full" style={{ width: '100%' }} />
                  </div>
                  <p className="text-[10px] text-slate-500 pt-1">AST capability discovery & identity binding</p>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                  <div className="flex justify-between font-medium text-slate-300 text-[11px]">
                    <span>02. Govern</span>
                    <span className="text-amber-400 font-bold">75% (1 Gap)</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                    <div className="bg-amber-400 h-full rounded-full" style={{ width: '75%' }} />
                  </div>
                  <p className="text-[10px] text-slate-500 pt-1">Legal owners, risk bounds & policies</p>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                  <div className="flex justify-between font-medium text-slate-300 text-[11px]">
                    <span>03. Operate</span>
                    <span className="text-amber-400 font-bold">75% (1 HITL Gap)</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                    <div className="bg-amber-400 h-full rounded-full" style={{ width: '75%' }} />
                  </div>
                  <p className="text-[10px] text-slate-500 pt-1">Approval gates & runtime containment</p>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                  <div className="flex justify-between font-medium text-slate-300 text-[11px]">
                    <span>04. Assure</span>
                    <span className="text-emerald-400 font-bold">100% Active</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                    <div className="bg-emerald-400 h-full rounded-full" style={{ width: '100%' }} />
                  </div>
                  <p className="text-[10px] text-slate-500 pt-1">Tamper-evident ledger & regulatory dossier</p>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button 
                  onClick={onNavigateToControls}
                  className="text-xs font-bold text-sky-400 hover:text-sky-300 transition flex items-center gap-1 cursor-pointer"
                >
                  <span>Open Full 12 Controls Matrix View</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Accordion 2: Verifiable Agent Passports */}
        <div className="rounded-xl border border-slate-800 bg-[#0A1628] overflow-hidden">
          <button
            onClick={() => toggleDomainTile('passports')}
            className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-900/60 transition cursor-pointer"
          >
            <div className="flex items-center space-x-2.5">
              <FileBadge className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold text-white">Verifiable Agent Passports</span>
              <span className="text-[10px] font-mono text-indigo-300 bg-indigo-500/10 px-2 py-0.2 rounded border border-indigo-500/20">
                24 Governed · 2 Conditional
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="text-[11px] font-mono hidden sm:inline">Cryptographic Personas</span>
              {expandedDomainTile === 'passports' ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </div>
          </button>

          {expandedDomainTile === 'passports' && (
            <div className="p-4 border-t border-slate-800 bg-[#060F1D] space-y-3 animate-fadeIn">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs">Credit Risk Evaluator</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      🟡 Conditional
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 block">CG-AG-CREWAI-CREDIT-911E</span>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-900">
                    <span>Owner: Roberto Silva</span>
                    <span>Autonomy: L3 Bounded</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs">Customer Support Bot</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      🟢 Governed
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 block">CG-AG-LANGGRAPH-SUPPORT-49F1</span>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-900">
                    <span>Owner: Juliana Lima</span>
                    <span>Autonomy: L2 Supervised</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button 
                  onClick={onNavigateToPassports}
                  className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition flex items-center gap-1 cursor-pointer"
                >
                  <span>Open Full Passports Registry</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Accordion 3: Full Operational Findings Table (Legacy Deep Triage) */}
        <div className="rounded-xl border border-slate-800 bg-[#0A1628] overflow-hidden">
          <button
            onClick={() => toggleDomainTile('full-table')}
            className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-900/60 transition cursor-pointer"
          >
            <div className="flex items-center space-x-2.5">
              <FileText className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-bold text-white">Full Operational Findings & Triage Table</span>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.2 rounded">
                {findings.length} Records
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="text-[11px] font-mono hidden sm:inline">Traditional Tabular Triage</span>
              {expandedDomainTile === 'full-table' ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </div>
          </button>

          {expandedDomainTile === 'full-table' && (
            <div className="border-t border-slate-800 bg-[#060F1D] overflow-x-auto animate-fadeIn">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[11px] font-mono">
                  <tr>
                    <th className="py-2.5 px-3">Severity / Control</th>
                    <th className="py-2.5 px-3">Finding & Target</th>
                    <th className="py-2.5 px-3">Owner</th>
                    <th className="py-2.5 px-3">Recommended Action</th>
                    <th className="py-2.5 px-3 text-right">Decision</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {findings.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-900/50 transition font-sans">
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold font-mono ${
                          item.severity === 'CRITICAL' ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-amber-950 text-amber-300 border border-amber-800'
                        }`}>
                          {item.severity}
                        </span>
                        <span className="ml-1.5 text-[10px] font-mono text-slate-400">{item.controlId}</span>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-200">{item.finding}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{item.sourceTarget}</div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-300 font-mono text-[11px]">
                        {item.owner.name}
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                        {item.recommendedAction}
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        {item.status === 'PENDING_DECISION' ? (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleDecision(item.id, 'MITIGATE')}
                              className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold transition cursor-pointer"
                            >
                              Mitigate
                            </button>
                            <button
                              onClick={() => handleDecision(item.id, 'ACCEPT')}
                              className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] transition cursor-pointer"
                            >
                              Accept
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] font-mono text-emerald-400">
                            ✓ Decided ({item.status})
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

