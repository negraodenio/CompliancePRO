import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  ArrowLeft, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Lock, 
  Database, 
  Cpu, 
  Play, 
  Pause, 
  ChevronDown, 
  ChevronRight,
  ExternalLink,
  Shield,
  Layers
} from 'lucide-react';
import { 
  InventoryAgent, 
  AgentInventoryStore, 
  AgentGovernanceStatus,
  AgentRiskTier 
} from '../services/agent-inventory-store';

interface AgentDetailViewProps {
  agentId: string;
  onBack: () => void;
  onOpenCockpit?: (agentId: string) => void;
  onOpenStudio?: (agentId: string) => void;
  onOpenEvidence?: () => void;
}

export const AgentDetailView: React.FC<AgentDetailViewProps> = ({
  agentId,
  onBack,
  onOpenCockpit,
  onOpenStudio,
  onOpenEvidence
}) => {
  const [agent, setAgent] = useState<InventoryAgent | undefined>(() => AgentInventoryStore.getAgent(agentId));
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    const ag = AgentInventoryStore.getAgent(agentId);
    if (ag) {
      setAgent(ag);
    } else {
      AgentInventoryStore.fetchFromBackend().then(() => {
        setAgent(AgentInventoryStore.getAgent(agentId));
      });
    }

    const unsub = AgentInventoryStore.subscribe(() => {
      setAgent(AgentInventoryStore.getAgent(agentId));
    });
    return unsub;
  }, [agentId]);

  if (!agent) {
    return (
      <div className="p-12 text-center bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
        <Bot className="w-10 h-10 text-slate-400 mx-auto" />
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">Agent not found</h2>
        <p className="text-xs text-slate-500">The agent "{agentId}" does not exist in the organization inventory.</p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg text-xs font-medium cursor-pointer"
        >
          ← Back to AI Agents
        </button>
      </div>
    );
  }

  const handleToggleStatus = () => {
    if (agent.status === 'RUNNING' || agent.status === 'GOVERNED') {
      AgentInventoryStore.updateAgentStatus(agent.id, 'PAUSED');
    } else {
      AgentInventoryStore.updateAgentStatus(agent.id, 'GOVERNED');
    }
  };

  const getGovernanceDisplay = (status: AgentGovernanceStatus) => {
    switch (status) {
      case 'GOVERNED':
      case 'RUNNING':
        return { label: 'Governed', dotClass: 'bg-emerald-500', textClass: 'text-emerald-700 dark:text-emerald-300' };
      case 'PAUSED':
      case 'IMPORTED':
      case 'DISCOVERED':
        return { label: 'Needs Review', dotClass: 'bg-amber-500', textClass: 'text-amber-700 dark:text-amber-300' };
      case 'BLOCKED':
        return { label: 'Blocked', dotClass: 'bg-rose-500', textClass: 'text-rose-700 dark:text-rose-300' };
      case 'UNKNOWN':
      default:
        return { label: 'Unknown', dotClass: 'bg-slate-400', textClass: 'text-slate-600 dark:text-slate-400' };
    }
  };

  const getRiskDisplay = (risk: AgentRiskTier) => {
    switch (risk) {
      case 'CRITICAL':
        return { label: 'CRITICAL RISK', badgeClass: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800 font-bold' };
      case 'HIGH':
        return { label: 'HIGH RISK', badgeClass: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800 font-semibold' };
      case 'MEDIUM':
        return { label: 'MEDIUM RISK', badgeClass: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 font-medium' };
      case 'LOW':
      default:
        return { label: 'LOW RISK', badgeClass: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 font-medium' };
    }
  };

  const gov = getGovernanceDisplay(agent.status);
  const risk = getRiskDisplay(agent.risk);

  // Models, tools, and data lists with clean fallbacks
  const modelsList = agent.access?.models?.length 
    ? agent.access.models 
    : [{ name: agent.model || 'GPT-4o', allowed: true, provider: 'Model Gateway' }];

  const toolsList = agent.access?.tools?.length
    ? agent.access.tools
    : [
        { name: 'CRM Read', status: 'ALLOW' as const, boundary: 'Read-only Customer Scopes' },
        { name: 'Credit Approval', status: agent.risk === 'HIGH' || agent.risk === 'CRITICAL' ? ('HITL' as const) : ('ALLOW' as const), boundary: 'Financial Authorization' }
      ];

  const dataList = agent.access?.data?.length
    ? agent.access.data
    : [
        { name: 'Customer Records', allowed: true, classification: 'Confidential' },
        { name: 'Credit Data', allowed: true, classification: 'Restricted' }
      ];

  // Activity list with clean fallbacks
  const activityList = agent.activity?.length
    ? agent.activity
    : [
        { id: 'act-1', timestamp: '10:31', type: 'EXECUTION' as const, summary: 'CRM Read', verdict: 'ALLOW' as const },
        { id: 'act-2', timestamp: '10:32', type: 'HITL' as const, summary: 'Credit Approval (€25,000)', verdict: 'REQUIRE_HITL' as const },
        { id: 'act-3', timestamp: '10:33', type: 'DECISION' as const, summary: 'Credit Approval Operator Review', verdict: 'APPROVED' as const },
        { id: 'act-4', timestamp: '10:33', type: 'EXECUTION' as const, summary: 'Credit Approval Execution', verdict: 'ALLOW' as const }
      ];

  return (
    <div className="space-y-6 pb-16 max-w-4xl mx-auto">
      {/* Top Breadcrumb */}
      <div>
        <button
          onClick={onBack}
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to AI Agents</span>
        </button>
      </div>

      {/* 1. FIRST LEVEL: Agent Header Card */}
      <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {agent.name}
            </h1>
            <div className="text-sm text-slate-500 dark:text-slate-400 flex items-center space-x-2">
              <span>{agent.owner.name === 'Unknown' ? 'Unassigned Owner' : agent.owner.name}</span>
              {agent.owner.department && (
                <>
                  <span>·</span>
                  <span>{agent.owner.department}</span>
                </>
              )}
              <span>·</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">{agent.framework}</span>
            </div>
            {agent.description && (
              <p className="text-xs text-slate-500 dark:text-slate-400 pt-1 leading-relaxed">
                {agent.description}
              </p>
            )}
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={handleToggleStatus}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition flex items-center space-x-1.5 cursor-pointer ${
                agent.status === 'PAUSED'
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-transparent'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {agent.status === 'PAUSED' ? (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Resume Agent</span>
                </>
              ) : (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pause Execution</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Status & Risk Indicators */}
        <div className="flex items-center space-x-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <span className={`px-2.5 py-0.5 rounded-md text-xs border ${risk.badgeClass}`}>
            {risk.label}
          </span>

          <div className="flex items-center space-x-1.5 text-xs">
            <span className={`w-2 h-2 rounded-full ${gov.dotClass}`} />
            <span className={`font-semibold ${gov.textClass}`}>{gov.label}</span>
          </div>

          <span className="text-xs text-slate-400">·</span>
          <span className="text-xs text-slate-400">Last activity {agent.lastActivity || 'recently'}</span>
        </div>
      </div>

      {/* 2. ACCESS: Models / Tools / Data (Clean 3-Column Perimeter, No Nested Cards) */}
      <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-5">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono">
            Access Perimeters
          </h2>
          <p className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">
            What this agent is allowed to access
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-1 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-800/80">
          {/* Models */}
          <div className="space-y-3">
            <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <Cpu className="w-4 h-4 text-slate-400" />
              <span>Models</span>
            </div>
            <div className="space-y-2">
              {modelsList.map((m, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-900 dark:text-white">{m.name}</span>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Allowed</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tools */}
          <div className="space-y-3 md:pl-6 pt-4 md:pt-0">
            <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <Bot className="w-4 h-4 text-slate-400" />
              <span>Tools</span>
            </div>
            <div className="space-y-2">
              {toolsList.map((t, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-900 dark:text-white">{t.name}</span>
                  <span className={`text-[11px] font-medium ${
                    t.status === 'HITL' 
                      ? 'text-amber-600 dark:text-amber-400' 
                      : t.status === 'BLOCKED' 
                      ? 'text-rose-600 dark:text-rose-400' 
                      : 'text-emerald-600 dark:text-emerald-400'
                  }`}>
                    {t.status === 'HITL' ? 'Approval required' : t.status === 'BLOCKED' ? 'Blocked' : 'Allowed'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Data */}
          <div className="space-y-3 md:pl-6 pt-4 md:pt-0">
            <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <Database className="w-4 h-4 text-slate-400" />
              <span>Data</span>
            </div>
            <div className="space-y-2">
              {dataList.map((d, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-900 dark:text-white">{d.name}</span>
                  <span className="text-[11px] text-slate-400">{d.classification}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. RECENT ACTIVITY: Clear Timeline */}
      <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono">
            Recent Activity
          </h2>
          <p className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">
            Audit trail of recent requests and decisions made by this agent
          </p>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
          {activityList.map((act) => {
            const isApproved = act.verdict === 'ALLOW' || act.verdict === 'APPROVED';
            const isHitl = act.verdict === 'REQUIRE_HITL';
            const isBlocked = act.verdict === 'BLOCK' || act.verdict === 'REJECTED';

            return (
              <div key={act.id} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-3">
                  <span className="font-mono text-slate-400 text-[11px] w-12">{act.timestamp}</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{act.summary}</span>
                </div>
                <div>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                    isHitl 
                      ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                      : isBlocked
                      ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                      : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  }`}>
                    {isHitl ? 'Human approval required' : isBlocked ? 'Blocked' : 'Allowed'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. GOVERNANCE: Policies & Rules (No Nested Card) */}
      <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono">
            Governance Policy
          </h2>
          <p className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">
            {agent.complianceProfile ? agent.complianceProfile.replace('CP-', '') : 'EU AI Act High-Risk Profile'}
          </p>
        </div>

        <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-2 list-disc list-inside">
          <li>Human approval required for any transaction above €10,000</li>
          <li>Zero secret access: Model and Tool API keys held outside execution worker</li>
          <li>Air-gapped network execution with outbound requests intercepted by Gateways</li>
          <li>All capability invocations require verified cryptographic passport</li>
        </ul>
      </div>

      {/* 5. EVIDENCE: Cryptographic Proof Link */}
      <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono">
            Audit Evidence
          </h2>
          <p className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">
            Cryptographically signed ledger records for this agent
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Every decision and capability execution is immutably logged in the Evidence Ledger.
          </p>
        </div>

        <button
          onClick={onOpenEvidence}
          className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 font-semibold text-xs transition cursor-pointer shrink-0 shadow-xs"
        >
          View audit evidence →
        </button>
      </div>

      {/* 6. ADVANCED DETAILS: Progressive Disclosure */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-[#111827]">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full p-4 flex items-center justify-between text-left text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition cursor-pointer"
        >
          <div className="flex items-center space-x-2">
            <Lock className="w-4 h-4 text-slate-400" />
            <span>Advanced details</span>
            <span className="text-[10px] text-slate-400 font-normal">(Passport, cryptographic hashes, sandbox specification)</span>
          </div>
          {showAdvanced ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
        </button>

        {showAdvanced && (
          <div className="p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-4 text-xs font-mono">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block font-sans">Agent Identity ID</span>
                <span className="text-slate-800 dark:text-slate-200 break-all">{agent.id}</span>
              </div>

              <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block font-sans">Passport ID</span>
                <span className="text-slate-800 dark:text-slate-200 break-all">{agent.governance.passportId}</span>
              </div>

              <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block font-sans">Cryptographic Signature Status</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{agent.governance.passportStatus} (HMAC-SHA256)</span>
              </div>

              <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block font-sans">Sandbox Perimeter</span>
                <span className="text-slate-800 dark:text-slate-200">Worker Air-Gapped (Zero Secrets)</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block font-sans">Policy Checksum / Version</span>
              <span className="text-slate-600 dark:text-slate-400 text-[11px] break-all">{agent.governance.passportFingerprint || 'sha256:7f9b8c2d1e0a4f5b6c7d8e9f0a1b2c3d'}</span>
            </div>

            {/* Direct links to technical workspaces if needed */}
            <div className="flex items-center space-x-2 pt-2 font-sans">
              {onOpenCockpit && (
                <button
                  onClick={() => onOpenCockpit(agent.id)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 transition cursor-pointer"
                >
                  Open in Governance Cockpit
                </button>
              )}
              {onOpenStudio && (
                <button
                  onClick={() => onOpenStudio(agent.id)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 transition cursor-pointer"
                >
                  Open in Agent Studio
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
