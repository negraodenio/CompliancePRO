import { useEffect } from 'react';
import { FunnelAnalytics } from '../services/funnel-analytics';
import React from 'react';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle2, 
  Bot, 
  Cpu, 
  Layers, 
  Lock, 
  ArrowRight, 
  Sparkles, 
  AlertOctagon, 
  Database, 
  Zap, 
  FileBadge, 
  Building2, 
  Scale, 
  FileCheck2,
  KeyRound,
  EyeOff,
  UserCheck
} from 'lucide-react';
import type { ScannerResult, AgentCapability } from '../../core/types';

interface FreeScanSnapshotViewProps {
  result: ScannerResult;
  onGovernFindings: () => void;
  onExploreGovernanceOs: () => void;
  onResetScan: () => void;
}

export const FreeScanSnapshotView: React.FC<FreeScanSnapshotViewProps> = ({
  result,
  onGovernFindings,
  onExploreGovernanceOs,
  onResetScan,
}) => {
  const agents = result.source?.agents || result.agentClassifications || [];
  const models = result.source?.aiModels || [];
  const capabilities = result.agentCapabilities || [];
  const identities = result.agentIdentities || [];
  const capSummary = result.capabilitiesSummary;

  const totalUnknownAuth = capSummary?.unknownAuthorizationCount ?? capabilities.filter(c => c.state === 'UNKNOWN_AUTHORIZATION' || !c.authorizationEvidence).length;
  const highRiskFindings = (result.violations || []).filter(v => v.severity === 'critical' || v.severity === 'high');
  const destructiveActions = capabilities.filter(c => c.isDestructive);
  const averageScore = Math.round(result.compliance?.overallScore ?? 0);

  useEffect(() => {
    FunnelAnalytics.track('SNAPSHOT_VIEWED', {
      agentsCount: agents.length,
      modelsCount: models.length,
      capabilitiesCount: capabilities.length,
      unknownAuthCount: totalUnknownAuth,
      complianceScore: averageScore
    });
  }, [result]);

  const getStatusBadge = (state: string) => {
    switch (state) {
      case 'AUTHORIZED_CAPABILITY':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'DECLARED_CAPABILITY':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'OBSERVED_CAPABILITY':
        return 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20';
      case 'USED_CAPABILITY':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
      case 'UNKNOWN_AUTHORIZATION':
      default:
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner / Headline */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-sky-950/60 to-slate-900 border border-sky-500/30 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-sky-500/20 border border-sky-500/40 text-sky-300 text-xs font-mono font-bold tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
              <span>Real AI Governance Scan Complete</span>
            </div>
            <button
              onClick={onResetScan}
              className="text-xs text-slate-400 hover:text-white underline transition cursor-pointer"
            >
              Scan Another Project
            </button>
          </div>

          <div className="max-w-3xl space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              AI Governance & Capability Snapshot
            </h2>
            <p className="text-sm text-slate-300">
              Technical ground truth extracted from <span className="text-sky-300 font-semibold font-mono">{result.repo?.name || 'Scanned AI Project'}</span>. Discovered autonomous agents, execution capabilities, authorization boundaries, and governance/compliance exposure.
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">AI Agents</span>
            <Bot className="w-4 h-4 text-sky-400" />
          </div>
          <p className="text-2xl font-bold text-white font-mono">{agents.length}</p>
          <p className="text-[10px] text-slate-400">Discovered in AST</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">AI Models</span>
            <Cpu className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-bold text-white font-mono">{models.length}</p>
          <p className="text-[10px] text-slate-400">Endpoints & LLMs</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Capabilities</span>
            <Layers className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-bold text-white font-mono">{capabilities.length}</p>
          <p className="text-[10px] text-slate-400">Tools, DB, S3, APIs</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Unverified Auth</span>
            <Lock className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl font-bold text-rose-400 font-mono">
            {totalUnknownAuth}
          </p>
          <p className="text-[10px] text-rose-400/80">No verified auth evidence</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">High Risks</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-amber-400 font-mono">{highRiskFindings.length}</p>
          <p className="text-[10px] text-slate-400">High-Priority Findings</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Compliance</span>
            <Shield className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400 font-mono">{averageScore}%</p>
          <p className="text-[10px] text-slate-400">EU AI Act & LGPD</p>
        </div>
      </div>

      {/* CORE DIFFERENTIATOR: The Invariant Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-slate-900 border border-amber-500/30 space-y-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
            <AlertOctagon className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                CANONICAL INVARIANT
              </span>
              <span className="text-sm font-bold text-white">
                OBSERVED_CAPABILITY ≠ AUTHORIZED_CAPABILITY
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Your code reveals declared and coded capabilities (e.g. tool definitions, database operations, cloud storage actions, shell executions). <strong>A code import or function call NEVER constitutes legal or technical authorization.</strong> Unless supported by explicit IAM policies, database grants, or OAuth scopes, capabilities remain in state <span className="font-mono text-rose-400 font-bold">UNKNOWN_AUTHORIZATION</span>.
            </p>
          </div>
        </div>
      </div>

      {/* Discovered Capability Boundaries Table */}
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-sky-400" />
              <span>Discovered Agent Capabilities & Permission Boundaries</span>
            </h3>
            <p className="text-xs text-slate-400">
              The canonical chain: <span className="font-mono text-sky-300">Agent → Identity → Role → System → Resource → Action → Authorization</span>
            </p>
          </div>
          <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
            {capabilities.length} Capabilities Discovered
          </span>
        </div>

        {capabilities.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px] bg-slate-950/50">
                  <th className="py-3 px-3">Agent / Origin</th>
                  <th className="py-3 px-3">System & Resource</th>
                  <th className="py-3 px-3">Action</th>
                  <th className="py-3 px-3">Capability State</th>
                  <th className="py-3 px-3">Authorization Evidence</th>
                  <th className="py-3 px-3">Anomalies</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {capabilities.slice(0, 8).map((cap, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-3 font-semibold text-white">
                      <div className="flex items-center gap-1.5">
                        <Bot className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                        <span className="truncate max-w-[140px]">{cap.agentName || 'Agent'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      <div className="space-y-0.5">
                        <span className="text-sky-300 font-bold">{cap.systemType}</span>
                        <div className="text-[10px] text-slate-400 font-mono truncate max-w-[180px]">
                          {cap.resourceTarget}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        cap.isDestructive 
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' 
                          : 'bg-slate-800 text-slate-300'
                      }`}>
                        {cap.action} {cap.isDestructive ? '⚠️ (DESTRUCTIVE)' : ''}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusBadge(cap.state)}`}>
                        {cap.state}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-400">
                      {cap.authorizationEvidence ? (
                        <span className="text-emerald-400 font-mono text-[10px] truncate max-w-[160px] block">
                          {cap.authorizationEvidence.type} {cap.authorizationEvidence.grantedScope ? `(${cap.authorizationEvidence.grantedScope})` : ''}
                        </span>
                      ) : (
                        <span className="text-rose-400/80 italic text-[10px]">
                          No verified authorization evidence
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      {cap.anomalies && cap.anomalies.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {cap.anomalies.map((a, aIdx) => (
                            <span key={aIdx} className="px-1.5 py-0.5 rounded text-[9px] bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">
                              {a}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-500 text-[10px]">None</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {capabilities.length > 8 && (
              <p className="text-center text-xs text-slate-400 pt-3">
                Showing 8 of {capabilities.length} capabilities. Unlock full report in CG-AG Governance OS.
              </p>
            )}
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400 space-y-2">
            <p className="text-sm font-semibold">No capabilities discovered in this scan.</p>
            <p className="text-xs text-slate-500">Zero synthetic or mocked capabilities were generated.</p>
          </div>
        )}
      </div>

      {/* Identity & Execution Bindings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-indigo-400" />
              <span>Execution Identities & Service Accounts</span>
            </h4>
            <span className="text-xs text-slate-400 font-mono">
              {identities.length} Bindings
            </span>
          </div>
          <div className="space-y-2">
            {identities.length > 0 ? (
              identities.map((idBinding, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs font-mono">
                  <div className="space-y-0.5">
                    <div className="text-white font-bold">{idBinding.agentName}</div>
                    <div className="text-[10px] text-slate-400">Type: {idBinding.identityType}</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    idBinding.identityType === 'unassigned'
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  }`}>
                    {idBinding.roleMapped || 'ROLE: UNKNOWN'}
                  </span>
                </div>
              ))
            ) : (
              <div className="p-4 rounded-xl bg-slate-950/40 text-center text-xs text-slate-400">
                Identity: UNKNOWN (Unassigned service account)
              </div>
            )}
          </div>
        </div>

        {/* Security & Sanitization Guarantee */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <EyeOff className="w-4 h-4 text-emerald-400" />
              <span>Zero Secrets & Air-Gapped Privacy</span>
            </h4>
            <span className="text-xs font-mono text-emerald-400">VERIFIED</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Designed for privacy-preserving analysis: source code is analyzed in-memory in the browser and sensitive credential patterns are redacted before processing. All API keys, JWT bearer tokens, connection strings, and database passwords are <strong>redacted in memory</strong>.
          </p>
          <div className="pt-2 flex flex-wrap gap-2 text-[10px] font-mono text-slate-400">
            <span className="px-2 py-1 rounded bg-slate-800 border border-slate-700">✓ In-Memory AST Analysis</span>
            <span className="px-2 py-1 rounded bg-slate-800 border border-slate-700">✓ RFC 8785 Compatible</span>
            <span className="px-2 py-1 rounded bg-slate-800 border border-slate-700">✓ SHA-256 Tamper Proof</span>
          </div>
        </div>
      </div>

      {/* CONVERSION CALL TO ACTION */}
      <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-r from-sky-950 via-indigo-950 to-slate-950 border-2 border-sky-500/50 text-white shadow-2xl text-center space-y-6 relative overflow-hidden">
        <div className="max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-mono font-bold tracking-widest text-sky-400 uppercase">
            COMMERCIAL AI GOVERNANCE
          </span>
          <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Turn Discovered Capabilities Into Governed AI Assets
          </h3>
          <p className="text-sm text-slate-300">
            Create your enterprise organization now to ingest these discovered findings into your immutable Cryptographic Ledger, issue AI Passports, enforce HITL approval gates, and generate cryptographically verifiable conformity dossiers.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 max-w-md mx-auto">
          <button
            onClick={onGovernFindings}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-sky-500/20 flex items-center justify-center gap-2 transition transform hover:-translate-y-0.5 cursor-pointer"
          >
            <span>Preserve & Govern These Findings</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          
          <button
            onClick={onExploreGovernanceOs}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-sm transition cursor-pointer"
          >
            Explore Governance OS
          </button>
        </div>
      </div>
    </div>
  );
};
