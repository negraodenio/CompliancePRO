import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Cpu, 
  Shield, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  RefreshCw, 
  Lock, 
  Terminal, 
  FileBadge, 
  Activity, 
  Eye, 
  Clock, 
  Sparkles,
  Download,
  Check,
  ChevronRight,
  ArrowRight,
  Database,
  Layers,
  FileCheck,
  Search,
  ExternalLink
} from 'lucide-react';

export type CockpitPerspective = 'OVERVIEW' | 'DEVELOPER' | 'COMPLIANCE' | 'AUDITOR';

export interface TimelineEvent {
  sequence: number;
  eventType: string;
  verdict?: 'ALLOW' | 'REQUIRE_HITL' | 'BLOCK' | 'PAUSED' | 'APPROVED' | 'REJECTED' | 'SUCCESS';
  timestamp: string;
  capability?: string;
  eventHash: string;
  prevHash?: string;
  latencyMs?: number;
  risk?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  policy?: string;
  details?: string;
}

export const GovernanceCockpitView: React.FC = () => {
  const [perspective, setPerspective] = useState<CockpitPerspective>('OVERVIEW');
  
  // Real Agent & Runtime Selection
  const [agents, setAgents] = useState<any[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [agentData, setAgentData] = useState<any | null>(null);
  const [runtimeData, setRuntimeData] = useState<any | null>(null);
  const [evidenceEntries, setEvidenceEntries] = useState<any[]>([]);
  const [auditPackData, setAuditPackData] = useState<any | null>(null);
  const [verificationResult, setVerificationResult] = useState<any | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showAuditPack, setShowAuditPack] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Active HITL Gate State for Interactive Resolution
  const [activeHitlGate, setActiveHitlGate] = useState<{
    executionId: string;
    gateId: string;
    capability: string;
    risk: string;
    amount?: string;
    policy: string;
    customerMasked: string;
    requestedAt: string;
  } | null>(null);

  // Load Real Data from Backend Endpoints
  const refreshAgentData = async (targetId?: string) => {
    setIsLoading(true);
    try {
      // 1. Fetch Agents List from real GET /api/v1/agents
      const agentsRes = await fetch('/api/v1/agents');
      if (!agentsRes.ok) throw new Error(`Agent inventory request failed: HTTP ${agentsRes.status}`);
      let currentId = targetId || selectedAgentId;
      if (agentsRes.ok) {
        const data = await agentsRes.json();
        const list = data.agents || [];
        setAgents(list);
        if (!currentId && list.length > 0) {
          currentId = list[0].agentId;
          setSelectedAgentId(currentId);
        }
      }

      if (!currentId) {
        setAgentData(null);
        setRuntimeData(null);
        setEvidenceEntries([]);
        setActiveHitlGate(null);
        return;
      }

      // 2. Fetch Active Agent Details
      const agentRes = await fetch(`/api/v1/agents/${currentId}`);
      if (agentRes.ok) {
        const ag = await agentRes.json();
        setAgentData(ag);

        // Fetch runtime state if runtimeId exists
        const rtId = ag.runtimeId || (ag.runtimeSpec && ag.runtimeSpec.runtimeId);
        if (rtId) {
          const rtRes = await fetch(`/api/v1/runtimes/${rtId}`);
          if (rtRes.ok) {
            const rt = await rtRes.json();
            setRuntimeData(rt.runtime || rt);
          }
        }
      }

      // 3. Fetch Real Evidence Chain for Agent
      const evRes = await fetch(`/api/v1/evidence/${currentId}`);
      if (evRes.ok) {
        const evData = await evRes.json();
        setEvidenceEntries(evData.entries || []);
      }
    } catch (err: any) {
      setAgentData(null);
      setRuntimeData(null);
      setEvidenceEntries([]);
      setActiveHitlGate(null);
      setActionMessage(`Backend data unavailable: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshAgentData();
  }, [selectedAgentId]);

  // Handle Real Auditor Verification using Backend EvidenceVerifier
  const handleVerifyEvidence = async () => {
    setIsVerifying(true);
    setActionMessage(null);
    try {
      const res = await fetch('/api/v1/evidence/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: selectedAgentId })
      });
      if (!res.ok) throw new Error(`Evidence verification failed: HTTP ${res.status}`);
      const data = await res.json();
      setVerificationResult(data);
      if (data.auditPack) {
        setAuditPackData(data.auditPack);
      }
      setActionMessage(data.chain?.valid && data.chain?.totalEntries > 0
        ? 'Backend hash-chain verification completed.' : 'No successful non-empty evidence verification was reported.');
    } catch (err: any) {
      setVerificationResult(null);
      setAuditPackData(null);
      setActionMessage(`Evidence verification unavailable: ${err.message}`);
    } finally {
      setIsVerifying(false);
    }
  };

  // Handle Real HITL Approval / Rejection
  const handleResolveHitl = async (decision: 'APPROVED' | 'REJECTED') => {
    if (!activeHitlGate?.executionId) return;
    try {
      const endpoint = decision === 'APPROVED' ? 'approve' : 'reject';
      const res = await fetch(`/api/v1/executions/${activeHitlGate.executionId}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operatorId: 'OP-COCKPIT-SUPERVISOR' })
      });
      if (res.ok) {
        setActionMessage(`Gate ${activeHitlGate.gateId} was ${decision} by OP-COCKPIT-SUPERVISOR.`);
        setActiveHitlGate(null);
        refreshAgentData();
      } else {
        setActionMessage(`Approval request failed: HTTP ${res.status}. No successful authorization was confirmed.`);
      }
    } catch (err: any) {
      setActionMessage(`Approval request failed: ${err.message}. No successful authorization was confirmed.`);
    }
  };

  // Compute Aggregates from Real Backend Entries (No fabricated metrics)
  const defaultEntries: TimelineEvent[] = [
    { sequence: 1, eventType: 'AGENT_PROVISIONED', verdict: undefined, timestamp: '10:30:58', capability: 'system', eventHash: 'cb6a2baebc5a61048bcf7990...', latencyMs: 14, risk: 'LOW', details: 'Provisioned with CP-EU-AI-ACT-HIGH-RISK-FINANCIAL' },
    { sequence: 2, eventType: 'RUNTIME_STARTED', verdict: undefined, timestamp: '10:31:01', capability: 'system', eventHash: '485e9d69aa010f44bc1098...', latencyMs: 35, risk: 'LOW', details: 'Worker spawned in IsolatedWorker process' },
    { sequence: 3, eventType: 'AGENT_EXECUTION_STARTED', verdict: undefined, timestamp: '10:31:02', capability: 'runtime', eventHash: '99812ab0012e88a0bcff21...', latencyMs: 2, risk: 'LOW', details: 'CrewAI kickoff with isolated task' },
    { sequence: 4, eventType: 'CAPABILITY_REQUESTED', verdict: 'ALLOW', timestamp: '10:31:02', capability: 'crm.read_customer', eventHash: '77ac4401bb013919af4401...', latencyMs: 1.1, risk: 'LOW', policy: 'CP-EU-AI-ACT-HIGH-RISK-FINANCIAL', details: 'KYC customer dossier read (Masked)' },
    { sequence: 5, eventType: 'CAPABILITY_REQUESTED', verdict: 'ALLOW', timestamp: '10:31:04', capability: 'credit_bureau_query', eventHash: 'd39cf2a0b778f527c90b44...', latencyMs: 1.3, risk: 'LOW', policy: 'CP-EU-AI-ACT-HIGH-RISK-FINANCIAL', details: 'External bureau credit rating lookup' },
    { sequence: 6, eventType: 'CAPABILITY_REQUESTED', verdict: 'REQUIRE_HITL', timestamp: '10:31:07', capability: 'credit.approve', eventHash: 'a899fe104b8ce219bc8871...', latencyMs: 0.9, risk: 'HIGH', policy: 'Threshold rule > €10,000', details: 'Requested facility increase €25,000' },
    { sequence: 7, eventType: 'HITL_REQUESTED', verdict: 'PAUSED', timestamp: '10:31:08', capability: 'credit.approve', eventHash: 'c90b44a1bb81335f608779...', latencyMs: 1.0, risk: 'HIGH', details: 'Worker execution paused; awaiting supervisor' },
    { sequence: 8, eventType: 'HITL_DECISION', verdict: 'APPROVED', timestamp: '10:31:12', capability: 'credit.approve', eventHash: '12d8901eee01334421aa09...', latencyMs: 4200, risk: 'HIGH', details: 'Approved by OP-COCKPIT-SUPERVISOR' },
    { sequence: 9, eventType: 'EXECUTION_RESUMED', verdict: 'ALLOW', timestamp: '10:31:12', capability: 'credit.approve', eventHash: '43fb8811bb021877cb1190...', latencyMs: 1.2, risk: 'HIGH', details: 'Worker resumed with signed token' },
    { sequence: 10, eventType: 'TOOL_EXECUTION', verdict: 'SUCCESS', timestamp: '10:31:13', capability: 'credit.approve', eventHash: 'd0015566aa1098877112aa...', latencyMs: 12.4, risk: 'HIGH', details: 'Dispatched to core banking gateway' },
    { sequence: 11, eventType: 'CAPABILITY_REQUESTED', verdict: 'BLOCK', timestamp: '10:31:20', capability: 'DIRECT_DB_DDL', eventHash: '0812aa77cc011988223400...', latencyMs: 0.6, risk: 'CRITICAL', policy: 'ForbiddenActions: DIRECT_DB_DDL', details: 'Direct SQL DDL rejected by Guardian' }
  ];

  const rawEntries = evidenceEntries;

  const totalDecisions = rawEntries.filter(e => e.verdict || e.eventType === 'CAPABILITY_REQUESTED' || e.eventType === 'GUARDIAN_DECISION').length;
  const allowCount = rawEntries.filter(e => e.verdict === 'ALLOW' || e.verdict === 'SUCCESS').length;
  const hitlCount = rawEntries.filter(e => e.verdict === 'REQUIRE_HITL' || e.verdict === 'PAUSED').length;
  const blockCount = rawEntries.filter(e => e.verdict === 'BLOCK' || e.eventType === 'AGENT_EXECUTION_BLOCKED').length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 font-sans">
      {/* ========================================================================= */}
      {/* 5. AGENT CONTROL PLANE HEADER & PERSONA LENSES SWITCHER */}
      {/* ========================================================================= */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-wrap items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-sky-500/10 text-sky-400 border border-sky-500/20 text-[10px] font-mono font-bold uppercase tracking-wider">
              ComplyPRO Agent Control Plane
            </span>
            <span className="text-xs font-mono text-slate-400">· One Agent. Three Perspectives. One Truth.</span>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 mt-1.5">
            {/* Agent Selector Dropdown */}
            {agents.length > 0 ? (
              <select
                value={selectedAgentId}
                onChange={(e) => {
                  setSelectedAgentId(e.target.value);
                  refreshAgentData(e.target.value);
                }}
                className="bg-slate-950 text-white font-extrabold text-xl px-3 py-1 rounded-xl border border-slate-700 focus:outline-none focus:border-sky-500 font-mono cursor-pointer"
              >
                {agents.map((ag) => (
                  <option key={ag.agentId} value={ag.agentId}>
                    {ag.definition?.name || ag.name || ag.agentId}
                  </option>
                ))}
              </select>
            ) : (
              <h1 className="text-2xl font-black text-white tracking-tight">
                {agentData?.name || 'No agent selected'}
              </h1>
            )}

            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              {runtimeData?.status || 'UNKNOWN'}
            </span>

            <span className="px-2.5 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-mono font-bold flex items-center gap-1">
              <FileBadge className="w-3.5 h-3.5" />
              {agentData?.passportFingerprint ? 'PASSPORT LOADED' : 'PASSPORT NOT LOADED'}
            </span>

            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-xs font-mono">
              Sandbox
            </span>
          </div>

          <div className="text-xs text-slate-400 font-mono flex flex-wrap items-center gap-2 pt-1">
            <span>Framework: <strong className="text-slate-200">{agentData?.framework?.name || 'Unknown'} {agentData?.framework?.version || ''}</strong></span>
            <span>·</span>
            <span>Runtime: <strong className="text-slate-200">{runtimeData?.runtimeId || agentData?.runtimeId || 'Not loaded'}</strong></span>
            <span>·</span>
            <span>Profile: <strong className="text-sky-400">{agentData?.complianceProfileId || 'Not loaded'}</strong></span>
            <span>·</span>
            <span>Checksum: <strong className="text-slate-400">{agentData?.complianceProfileChecksum || 'Not loaded'}</strong></span>
          </div>
        </div>

        {/* 4 Navigation Lenses */}
        <div className="flex items-center p-1.5 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-xs">
          <button
            onClick={() => setPerspective('OVERVIEW')}
            className={`px-3.5 py-2 rounded-xl transition cursor-pointer font-bold ${
              perspective === 'OVERVIEW'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            OVERVIEW
          </button>
          <button
            onClick={() => setPerspective('DEVELOPER')}
            className={`px-3.5 py-2 rounded-xl transition cursor-pointer font-bold ${
              perspective === 'DEVELOPER'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            DEVELOPER
          </button>
          <button
            onClick={() => setPerspective('COMPLIANCE')}
            className={`px-3.5 py-2 rounded-xl transition cursor-pointer font-bold ${
              perspective === 'COMPLIANCE'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            COMPLIANCE
          </button>
          <button
            onClick={() => setPerspective('AUDITOR')}
            className={`px-3.5 py-2 rounded-xl transition cursor-pointer font-bold ${
              perspective === 'AUDITOR'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            AUDITOR
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3.5 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-300 text-xs font-mono flex items-center justify-between">
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage(null)} className="font-bold text-slate-400 hover:text-white cursor-pointer">×</button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. OVERVIEW PERSPECTIVE (First View after Studio) */}
      {/* ========================================================================= */}
      {perspective === 'OVERVIEW' && agentData && (
        <div className="space-y-6 animate-fadeIn font-mono">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* GOVERNANCE SUMMARY */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="font-bold text-white tracking-wider flex items-center gap-2">
                  <Shield className="w-4 h-4 text-sky-400" />
                  GOVERNANCE
                </span>
                <span className="text-[11px] text-sky-400 font-bold">{agentData.complianceProfileId}</span>
              </div>
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Profile:</span>
                  <span className="text-white font-bold">{agentData.passport?.riskTier || 'Unknown'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Guardian Policy:</span>
                  <span className="text-emerald-400 font-bold">{agentData.guardianStatus || 'Unknown'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Capabilities Bound:</span>
                  <span className="text-white font-bold">{agentData.governedCapabilities ?? 'Unknown'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Human Oversight (HITL):</span>
                  <span className="text-amber-400 font-bold">{activeHitlGate ? '1 Pending' : '0 Pending'}</span>
                </div>
              </div>
            </div>

            {/* RUNTIME SUMMARY */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="font-bold text-white tracking-wider flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-indigo-400" />
                  RUNTIME
                </span>
                <span className="text-[11px] text-emerald-400 font-bold">{runtimeData?.status || 'Unknown'}</span>
              </div>
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Worker Architecture:</span>
                  <span className="text-white font-bold">Runtime metadata; OS isolation not verified</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Resource Ceiling:</span>
                  <span className="text-slate-200 font-bold">CPU: {runtimeData?.resources?.cpu ?? 'Unknown'} · Memory: {runtimeData?.resources?.memoryMb ?? 'Unknown'} MB</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/60">
                  <span className="text-slate-400">Session Uptime:</span>
                  <span className="text-slate-200 font-bold">{runtimeData?.startedAt || 'Not recorded'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Direct Network Access:</span>
                  <span className="text-rose-400 font-bold">Declared policy: {runtimeData?.isolation?.network || 'Unknown'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* RECENT DECISIONS SUMMARY */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="font-bold text-white tracking-wider">ILLUSTRATIVE POLICY CASES</span>
              <span className="text-slate-400 text-xs">Credit-governance examples</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-emerald-400">ALLOW</span>
                  <span className="text-white">crm.read_customer</span>
                </div>
                <span className="text-slate-400">Fastpath Execution (&lt;1.2 ms)</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-amber-950/20 border border-amber-500/30">
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span className="font-bold text-amber-400">HITL</span>
                  <span className="text-white">credit.approve</span>
                  <span className="text-amber-300 font-bold">€25,000</span>
                </div>
                <span className="text-amber-400/90 font-bold">Paused (Requires Human Sign-off)</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-rose-950/20 border border-rose-500/30">
                <div className="flex items-center gap-3">
                  <XCircle className="w-4 h-4 text-rose-400" />
                  <span className="font-bold text-rose-400">BLOCK</span>
                  <span className="text-white">DIRECT_DB_DDL</span>
                </div>
                <span className="text-rose-400/90 font-bold">Prohibited by Profile (Tool Exec: 0)</span>
              </div>
            </div>
          </div>

          {/* EVIDENCE & PASSPORT FOOTER */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-slate-400 text-xs block">EVIDENCE LEDGER</span>
                <span className="text-white font-bold text-sm mt-0.5 block">{verificationResult?.chain?.valid && verificationResult.chain.totalEntries > 0 ? 'Backend chain check passed' : 'Verification not established'}</span>
                <span className="text-slate-500 text-[11px]">{rawEntries.length} events anchored</span>
              </div>
              <button
                onClick={() => setPerspective('AUDITOR')}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
              >
                Inspect Ledger →
              </button>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-slate-400 text-xs block">AGENT PASSPORT</span>
                <span className="text-white font-bold text-sm mt-0.5 block">{agentData.passportFingerprint ? 'Passport supplied by backend' : 'Not loaded'}</span>
                <span className="text-slate-500 text-[11px]">HMAC-SHA256 Binding</span>
              </div>
              <button
                onClick={() => setPerspective('AUDITOR')}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
              >
                Inspect Passport →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. DEVELOPER PERSPECTIVE */}
      {/* ========================================================================= */}
      {perspective === 'DEVELOPER' && agentData && (
        <div className="space-y-6 animate-fadeIn font-mono">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-400">AGENT PROCESS</span>
              <div className="text-base font-extrabold text-white">{agentData.name}</div>
              <div className="text-[10px] text-emerald-400">{runtimeData?.status || 'Unknown'}</div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-400">FRAMEWORK</span>
              <div className="text-base font-extrabold text-white">{agentData.framework?.name} {agentData.framework?.version}</div>
              <div className="text-[10px] text-sky-400">Runtime: {runtimeData?.runtimeId || 'Not loaded'}</div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-400">CAPABILITIES</span>
              <div className="text-base font-extrabold text-white">{agentData.governedCapabilities ?? 'Unknown'} declared</div>
              <div className="text-[10px] text-amber-400">{hitlCount} HITL · {blockCount} blocking events</div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-400">DECISION LATENCY</span>
              <div className="text-base font-extrabold text-indigo-400">Not measured</div>
              <div className="text-[10px] text-emerald-400">Use backend telemetry</div>
            </div>
          </div>

          {/* Operational Capability Execution Table */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="font-bold text-white tracking-wider">ILLUSTRATIVE EXECUTION CASES</span>
              <span className="text-slate-400 text-[11px]">Credit-governance examples</span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="flex items-center gap-3">
                  <span className="text-slate-500">10:31:02</span>
                  <span className="font-bold text-slate-200">customer.read</span>
                  <span className="text-slate-500 text-[11px]">Payload digest: sha256:49fa...</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <span>ALLOW</span>
                  <span>✓</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="flex items-center gap-3">
                  <span className="text-slate-500">10:31:04</span>
                  <span className="font-bold text-slate-200">credit.score</span>
                  <span className="text-slate-500 text-[11px]">Calculated score=782</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <span>ALLOW</span>
                  <span>✓</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30">
                <div className="flex items-center gap-3">
                  <span className="text-slate-500">10:31:07</span>
                  <span className="font-bold text-amber-300">credit.approve</span>
                  <span className="text-amber-400/80 text-[11px]">Amount €25,000 (Awaiting Supervisor)</span>
                </div>
                <div className="flex items-center gap-2 text-amber-400 font-bold">
                  <span>HITL</span>
                  <span>◐</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-rose-950/20 border border-rose-500/30">
                <div className="flex items-center gap-3">
                  <span className="text-slate-500">10:31:20</span>
                  <span className="font-bold text-rose-300">customer.delete (DIRECT_DB_DDL)</span>
                  <span className="text-rose-400/80 text-[11px]">Schema drop attempt</span>
                </div>
                <div className="flex items-center gap-2 text-rose-400 font-bold">
                  <span>BLOCK</span>
                  <span>✕</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. COMPLIANCE PERSPECTIVE */}
      {/* ========================================================================= */}
      {perspective === 'COMPLIANCE' && agentData && (
        <div className="space-y-6 animate-fadeIn font-mono">
          {/* Compliance Profile Card */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <span className="text-[11px] text-indigo-400 uppercase tracking-wider block">
                  COMPLIANCE STATUS
                </span>
                <h3 className="text-base font-extrabold text-white mt-0.5">
                  Profile: {agentData.complianceProfileId}
                </h3>
                <span className="text-slate-400 text-xs">Checksum: {agentData.complianceProfileChecksum}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400 text-[10px] block">ALLOW</span>
                <span className="text-xl font-bold text-emerald-400">{allowCount}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400 text-[10px] block">REQUIRE_HITL</span>
                <span className="text-xl font-bold text-amber-400">{hitlCount}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400 text-[10px] block">BLOCK</span>
                <span className="text-xl font-bold text-rose-400">{blockCount}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400 text-[10px] block">CIRCUIT_BREAK</span>
                <span className="text-xl font-bold text-slate-400">0</span>
              </div>
            </div>
          </div>

          {/* 7. FIRST-CLASS HUMAN OVERSIGHT SURFACE */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-extrabold text-white tracking-wider">
                  HUMAN OVERSIGHT (HITL INTERVENTIONS)
                </h3>
              </div>
              <div className="text-right text-xs text-slate-400">
                Pending request loaded: <strong className="text-amber-400">{activeHitlGate ? 'Yes' : 'No'}</strong>
              </div>
            </div>

            {activeHitlGate ? (
              <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-950/30 via-slate-950 to-amber-950/20 border-2 border-amber-500/40 space-y-4 text-xs">
                <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-400 font-extrabold text-sm">⚠ APPROVAL REQUIRED</span>
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px]">Risk: {activeHitlGate.risk}</span>
                  </div>
                  <span className="text-slate-400 text-[11px]">Requested: {activeHitlGate.requestedAt}</span>
                </div>

                <div className="space-y-1 text-slate-300">
                  <div className="text-sm font-bold text-white">Action: {activeHitlGate.capability}</div>
                  <div>Customer: <code className="text-slate-400">{activeHitlGate.customerMasked}</code></div>
                  <div>Amount: <strong className="text-amber-300">{activeHitlGate.amount}</strong></div>
                  <div>Policy: <span className="text-slate-400">{activeHitlGate.policy}</span></div>
                  <div>Agent: <span className="text-sky-400">credit-risk-analyst</span></div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-amber-500/20">
                  <span className="text-[11px] text-slate-500">
                    Resolution will resume runtime execution or terminate task safely.
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleResolveHitl('REJECTED')}
                      className="px-5 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-500/40 text-rose-300 font-bold transition cursor-pointer"
                    >
                      [ REJECT ]
                    </button>
                    <button
                      onClick={() => handleResolveHitl('APPROVED')}
                      className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition shadow-lg shadow-emerald-500/20 cursor-pointer"
                    >
                      [ APPROVE ]
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800 text-center text-slate-400 text-xs">
                No pending approval request has been loaded for this agent.
              </div>
            )}

            {/* Policy Interventions Record */}
            <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/30 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-rose-400">ILLUSTRATIVE BLOCKING POLICY</span>
                <span className="text-rose-400 font-bold">BLOCKED: DIRECT_DB_DDL</span>
              </div>
              <div className="text-slate-300">
                Reason: <span className="text-slate-400">Action prohibited by Compliance Profile (Destructive DDL)</span>
              </div>
              <div className="text-slate-400 text-[11px]">
                Tool execution: <strong className="text-rose-300">0 (Strictly prevented from execution)</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. AUDITOR PERSPECTIVE */}
      {/* ========================================================================= */}
      {perspective === 'AUDITOR' && (
        <div className="space-y-6 animate-fadeIn font-mono">
          {/* Cryptographic Proof Verification Bar */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <span className="text-[11px] text-emerald-400 uppercase tracking-wider block">
                  AUDIT EVIDENCE & CRYPTOGRAPHIC PROOF
                </span>
                <h3 className="text-base font-extrabold text-white mt-0.5">
                  Authority: ComplyPRO EvidenceVerifier (SHA-256 Hash Chain + Merkle Proof)
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleVerifyEvidence}
                  disabled={isVerifying}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
                  <span>{isVerifying ? 'Verifying...' : 'VERIFY EVIDENCE'}</span>
                </button>
              </div>
            </div>

            {/* Cryptographic Invariants Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400 text-[10px] block">Agent Passport</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1 mt-0.5">
                  {verificationResult?.auditPack?.report?.checks?.passportBinding ? 'Binding matches' : 'Not verified'}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400 text-[10px] block">Profile Checksum</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1 mt-0.5">
                  {verificationResult?.auditPack?.report?.checks?.profileChecksumMatch ? 'Checksum matches' : 'Not verified'}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400 text-[10px] block">Tool Manifest</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1 mt-0.5">
                  Not independently verified
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400 text-[10px] block">Evidence Chain</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1 mt-0.5">
                  {verificationResult?.chain?.valid && verificationResult.chain.totalEntries > 0 ? 'Hash chain checked' : 'Not verified'}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400 text-[10px] block">Merkle Integrity</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1 mt-0.5">
                  {verificationResult?.auditPack?.report?.checks?.merkleInclusion ? 'Inclusion checked' : 'Not verified'}
                </span>
              </div>
            </div>

            {/* Audit Pack Details */}
            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-xs flex flex-wrap items-center justify-between gap-3 text-slate-300">
              <div>
                <span className="text-emerald-400 font-bold block">
                  Audit Pack: {auditPackData?.packId || 'Not loaded'}
                </span>
                <span className="text-slate-400 text-[10px]">
                  Merkle Root: {auditPackData?.merkleRoot || 'Not loaded'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={!auditPackData}
                  onClick={() => setShowAuditPack((v) => !v)}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition cursor-pointer"
                >
                  {showAuditPack ? '[ HIDE AUDIT PACK ]' : '[ VIEW AUDIT PACK ]'}
                </button>
                <button
                  onClick={() => {
                    if (!auditPackData) return;
                    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(auditPackData, null, 2));
                    const downloadAnchor = document.createElement('a');
                    downloadAnchor.setAttribute("href", dataStr);
                    downloadAnchor.setAttribute("download", `complypro_audit_pack_${selectedAgentId || 'credit_analyst'}.json`);
                    document.body.appendChild(downloadAnchor);
                    downloadAnchor.click();
                    downloadAnchor.remove();
                  }}
                  disabled={!auditPackData}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>[ EXPORT ]</span>
                </button>
              </div>
            </div>

            {showAuditPack && auditPackData && (
              <div
                data-testid="audit-pack-viewer"
                className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] text-emerald-400 uppercase tracking-wider">
                    Audit Pack JSON
                  </span>
                  <button
                    onClick={() => setShowAuditPack(false)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
                  >
                    [ CLOSE ]
                  </button>
                </div>
                <pre className="max-h-80 overflow-auto text-[11px] leading-relaxed text-slate-300 bg-slate-900 border border-slate-800 rounded-xl p-3 whitespace-pre-wrap break-all">
                  {JSON.stringify(auditPackData, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 11. UNIVERSAL EXECUTION TIMELINE (ONE TIMELINE. THREE LENSES) */}
      {/* ========================================================================= */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 font-mono text-xs">
        <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-3 gap-2">
          <div>
            <span className="font-bold text-white tracking-wider block">
              UNIVERSAL EXECUTION TIMELINE
            </span>
            <span className="text-slate-400 text-[11px]">
              Same backend events · Filtered through the <strong className="text-sky-400">{perspective}</strong> lens
            </span>
          </div>
          <span className="text-slate-500 text-[11px]">{rawEntries.length} total chronological events</span>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
          {rawEntries.map((ev: TimelineEvent) => {
            // Apply persona-specific emphasis
            const isDeveloper = perspective === 'DEVELOPER';
            const isCompliance = perspective === 'COMPLIANCE';
            const isAuditor = perspective === 'AUDITOR';

            return (
              <div 
                key={ev.sequence} 
                className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-[11px] hover:border-slate-700 transition"
              >
                <div className="flex items-center gap-3">
                  <span className="text-slate-500">#{ev.sequence}</span>
                  <span className="text-slate-400">{ev.timestamp}</span>
                  <span className="text-white font-bold">{ev.eventType}</span>
                  {ev.capability && ev.capability !== 'system' && (
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-sky-300 font-bold">
                      {ev.capability}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  {/* Developer emphasis: latency and operational tools */}
                  {isDeveloper && (
                    <span className="text-indigo-400">
                      {ev.latencyMs ? `${ev.latencyMs} ms` : '<1 ms'}
                    </span>
                  )}

                  {/* Compliance emphasis: risk level & policy */}
                  {isCompliance && ev.risk && (
                    <span className={
                      ev.risk === 'HIGH' || ev.risk === 'CRITICAL'
                        ? 'text-amber-400 font-bold'
                        : 'text-slate-400'
                    }>
                      Risk: {ev.risk}
                    </span>
                  )}

                  {/* Verdict tag */}
                  {ev.verdict && (
                    <span className={
                      ev.verdict === 'ALLOW' || ev.verdict === 'APPROVED' || ev.verdict === 'SUCCESS'
                        ? 'text-emerald-400 font-bold'
                        : ev.verdict === 'BLOCK'
                          ? 'text-rose-400 font-bold'
                          : 'text-amber-400 font-bold'
                    }>
                      {ev.verdict}
                    </span>
                  )}

                  {/* Auditor emphasis: event hash and previous hash */}
                  {isAuditor && (
                    <span className="text-slate-500 text-[10px]">
                      hash: {ev.eventHash ? ev.eventHash.substring(0, 16) : 'e1df394c523f'}...
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
