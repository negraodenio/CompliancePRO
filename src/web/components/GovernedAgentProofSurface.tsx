import React, { useState } from 'react';
import { 
  Play, 
  Pause, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  ShieldCheck, 
  Cpu, 
  Lock, 
  Radio, 
  Terminal, 
  ArrowRight, 
  RefreshCw,
  Clock,
  Sparkles,
  KeyRound
} from 'lucide-react';

interface TimelineStep {
  time: string;
  capability: string;
  action: string;
  verdict: 'ALLOW' | 'REQUIRE_HITL' | 'BLOCK';
  status: 'SUCCESS' | 'PAUSED' | 'BLOCKED';
  gateId?: string;
  payload?: any;
}

export const GovernedAgentProofSurface: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [hitlApproved, setHitlApproved] = useState<boolean | null>(null);
  const [toolExecutionCount, setToolExecutionCount] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'timeline' | 'evidence' | 'passport'>('timeline');

  // Interactive Live Sequence States
  const timeline: TimelineStep[] = [
    {
      time: '10:31:02',
      capability: 'crm.read_customer',
      action: 'READ (KYC Dossier)',
      verdict: 'ALLOW',
      status: 'SUCCESS',
      payload: { customerId: 'CUST-EU-8819' }
    },
    {
      time: '10:31:04',
      capability: 'credit_bureau_query',
      action: 'READ (SCHUFA / Experian)',
      verdict: 'ALLOW',
      status: 'SUCCESS',
      payload: { bureauScore: 782, maxUnsecuredRatio: 0.35 }
    },
    {
      time: '10:31:07',
      capability: 'credit.approve (€25,000)',
      action: 'WRITE (Corporate Credit Line)',
      verdict: 'REQUIRE_HITL',
      status: 'PAUSED',
      gateId: 'GATE-8819-HITL',
      payload: { amount: 25000, riskTier: 'HIGH', reason: 'Facility exceeds autonomous €10k threshold' }
    }
  ];

  const handleStartDemo = () => {
    setIsRunning(true);
    setCurrentStep(1);
    setHitlApproved(null);
    setToolExecutionCount(0);

    setTimeout(() => setCurrentStep(2), 700);
    setTimeout(() => {
      setCurrentStep(3); // Pauses on HITL
    }, 1500);
  };

  const handleApprove = () => {
    setHitlApproved(true);
    setToolExecutionCount(1);
    setCurrentStep(4); // Resumed -> Tool executes -> Completed
  };

  const handleReject = () => {
    setHitlApproved(false);
    setToolExecutionCount(0);
    setCurrentStep(5); // Blocked
  };

  const handleReset = () => {
    setIsRunning(false);
    setCurrentStep(0);
    setHitlApproved(null);
    setToolExecutionCount(0);
  };

  return (
    <div className="w-full max-w-5xl mx-auto rounded-3xl bg-slate-950/90 border border-slate-800 shadow-2xl overflow-hidden backdrop-blur-xl transition-all duration-300">
      {/* Top Banner */}
      <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 font-bold text-xs">
            CP
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-extrabold text-white tracking-wider">COMPLYPRO EXECUTION SURFACE</span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-mono text-emerald-400 uppercase tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                LIVE
              </span>
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-2 font-mono mt-0.5">
              <span>Framework: CrewAI 0.102.0</span>
              <span>•</span>
              <span className="text-sky-400">Passport: VERIFIED (SIG-SHA256)</span>
              <span>•</span>
              <span className="text-indigo-400">Runtime: IsolatedWorker</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {!isRunning ? (
            <button
              onClick={handleStartDemo}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-sky-500/25 flex items-center gap-1.5 transition transform hover:-translate-y-0.5 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Run Governed Agent</span>
            </button>
          ) : (
            <button
              onClick={handleReset}
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-mono flex items-center gap-1.5 transition cursor-pointer"
            >
              <RefreshCw className="w-3 h-3 text-slate-400" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Surface Nav Tabs */}
      <div className="flex items-center gap-6 px-6 pt-3 border-b border-slate-800/60 text-xs font-mono">
        <button
          onClick={() => setActiveTab('timeline')}
          className={`pb-2.5 transition border-b-2 cursor-pointer ${activeTab === 'timeline' ? 'text-sky-400 border-sky-400 font-bold' : 'text-slate-400 border-transparent hover:text-slate-200'}`}
        >
          EXECUTION TIMELINE
        </button>
        <button
          onClick={() => setActiveTab('evidence')}
          className={`pb-2.5 transition border-b-2 cursor-pointer ${activeTab === 'evidence' ? 'text-sky-400 border-sky-400 font-bold' : 'text-slate-400 border-transparent hover:text-slate-200'}`}
        >
          EVIDENCE LEDGER (15 EVENTS)
        </button>
        <button
          onClick={() => setActiveTab('passport')}
          className={`pb-2.5 transition border-b-2 cursor-pointer ${activeTab === 'passport' ? 'text-sky-400 border-sky-400 font-bold' : 'text-slate-400 border-transparent hover:text-slate-200'}`}
        >
          AGENT PASSPORT BINDING
        </button>
      </div>

      {/* Main Execution Surface Body */}
      <div className="p-6">
        {activeTab === 'timeline' && (
          <div className="space-y-4">
            {/* Idle Welcome State */}
            {!isRunning && (
              <div className="text-center py-10 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mx-auto flex items-center justify-center">
                  <Cpu className="w-6 h-6 animate-pulse" />
                </div>
                <h3 className="text-base font-bold text-white">Interactive Governed Agent Sandbox</h3>
                <p className="text-xs text-slate-400 max-w-lg mx-auto">
                  Click <span className="text-sky-400 font-semibold font-mono">"Run Governed Agent"</span> to simulate an autonomous CrewAI credit analyst attempting low-risk reads and a high-risk €25,000 credit limit approval.
                </p>
              </div>
            )}

            {/* Step 1: customer.read */}
            {currentStep >= 1 && (
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 font-mono text-xs animate-fadeIn">
                <div className="flex items-center gap-3">
                  <span className="text-slate-500">10:31:02</span>
                  <span className="font-semibold text-slate-200">crm.read_customer</span>
                  <span className="text-slate-500 text-[11px] hidden sm:inline">KYC Dossier (READ)</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold">
                    ALLOW
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
              </div>
            )}

            {/* Step 2: credit_bureau_query */}
            {currentStep >= 2 && (
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 font-mono text-xs animate-fadeIn">
                <div className="flex items-center gap-3">
                  <span className="text-slate-500">10:31:04</span>
                  <span className="font-semibold text-slate-200">credit_bureau_query</span>
                  <span className="text-slate-500 text-[11px] hidden sm:inline">SCHUFA/Experian (READ)</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold">
                    ALLOW
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
              </div>
            )}

            {/* Step 3: credit.approve (€25,000) -> REQUIRE_HITL Card */}
            {currentStep >= 3 && (
              <div className="space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30 font-mono text-xs">
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500">10:31:07</span>
                    <span className="font-bold text-amber-300">credit.approve</span>
                    <span className="text-amber-400/80 font-bold">€25,000</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] font-bold">
                      REQUIRE_HITL
                    </span>
                    <div className="w-4 h-4 rounded-full border-2 border-amber-400 border-t-transparent animate-spin"></div>
                  </div>
                </div>

                {/* HITL Intervention Prompt */}
                {currentStep === 3 && (
                  <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-950/30 via-slate-900 to-amber-950/20 border-2 border-amber-500/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-400 animate-pulse" />
                        <span className="font-mono text-xs font-bold text-amber-300 tracking-wider">
                          HUMAN SUPERVISOR INTERVENTION REQUIRED
                        </span>
                      </div>
                      <span className="font-mono text-[11px] text-slate-400">Gate: GATE-8819-HITL</span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed font-sans">
                      The CrewAI agent requested to approve a <span className="font-bold text-white">€25,000 credit limit</span> for customer <span className="font-mono text-sky-400">CUST-EU-8819</span>. Under policy <span className="font-mono text-indigo-300">CP-EU-AI-ACT-HIGH-RISK-FINANCIAL</span>, autonomous approvals above €10,000 are paused until an authorized human decision.
                    </p>

                    <div className="flex items-center justify-between pt-2">
                      <div className="text-[11px] font-mono text-slate-400">
                        Worker state: <span className="text-amber-400 font-bold">PAUSED</span> · Tool executed: <span className="text-slate-300 font-bold">0</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleReject}
                          className="px-4 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 border border-rose-500/40 text-rose-300 font-mono text-xs font-bold transition cursor-pointer"
                        >
                          [ REJECT ]
                        </button>
                        <button
                          onClick={handleApprove}
                          className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold shadow-lg shadow-emerald-500/20 transition cursor-pointer flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>[ APPROVE €25,000 ]</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Approved & Resumed */}
            {currentStep >= 4 && hitlApproved === true && (
              <div className="space-y-2 animate-fadeIn">
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 font-mono text-xs">
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500">10:31:15</span>
                    <span className="font-semibold text-slate-200">credit.approve</span>
                    <span className="text-emerald-400 font-bold">ALLOW (Resumed by OP-SENIOR-CREDIT-OFFICER)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold">
                      ALLOW
                    </span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  </div>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 font-mono text-xs">
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500">10:31:16</span>
                    <span className="font-semibold text-emerald-300">tool execution</span>
                    <span className="text-slate-400 text-[11px]">Core Banking Gateway</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[11px] font-bold">
                      SUCCESS (Count: 1)
                    </span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  </div>
                </div>

                {/* Second Action Showcase: Prohibited Action defense */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-rose-950/20 border border-rose-500/30 font-mono text-xs mt-4">
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500">10:31:20</span>
                    <span className="font-semibold text-rose-300">customer.delete / DIRECT_DB_DDL</span>
                    <span className="text-rose-400/80 text-[11px]">Prohibited Action Defense</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[11px] font-bold">
                      BLOCK
                    </span>
                    <XCircle className="w-4 h-4 text-rose-400" />
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Rejected */}
            {currentStep >= 5 && hitlApproved === false && (
              <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/40 font-mono text-xs space-y-2 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="text-rose-400 font-bold">10:31:15 — credit.approve HALTED</span>
                  <span className="text-rose-300 font-bold">REJECTED BY HUMAN SUPERVISOR</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Tool execution strictly aborted. Tool execution count: <span className="font-bold text-white">0</span>. Causal evidence anchored.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Evidence Tab */}
        {activeTab === 'evidence' && (
          <div className="space-y-3 font-mono text-xs">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-slate-400 text-[11px]">CHAIN INTEGRITY</div>
                <div className="text-emerald-400 font-bold flex items-center gap-1.5 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>SHA-256 HASH CHAIN 100% VALID (15 EVENTS)</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-slate-400 text-[11px]">GENESIS ANCHOR</div>
                <div className="text-slate-300 text-[11px] font-bold">00000000000000000000...</div>
              </div>
            </div>

            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {[
                { seq: 1, type: 'AGENT_PROVISIONED', verdict: '—', hash: '8f7a...190c' },
                { seq: 2, type: 'RUNTIME_CREATED', verdict: '—', hash: 'c90b...44a1' },
                { seq: 3, type: 'RUNTIME_STARTED', verdict: '—', hash: '12d8...901e' },
                { seq: 4, type: 'AGENT_EXECUTION_STARTED', verdict: '—', hash: 'bb81...335f' },
                { seq: 5, type: 'CAPABILITY_REQUESTED (crm.read)', verdict: 'ALLOW', hash: 'a12e...6687' },
                { seq: 6, type: 'CAPABILITY_REQUESTED (credit.approve)', verdict: 'REQUIRE_HITL', hash: 'f560...98a3' },
                { seq: 7, type: 'HITL_REQUEST (GATE-8819)', verdict: 'PAUSED', hash: 'e012...88cc' },
                { seq: 8, type: 'HITL_DECISION (OP-SENIOR)', verdict: 'APPROVED', hash: '77ac...4401' },
                { seq: 9, type: 'AGENT_EXECUTION_RESUMED', verdict: '—', hash: '9901...ee42' },
                { seq: 10, type: 'TOOL_EXECUTION (Core Banking)', verdict: 'SUCCESS', hash: '43fb...8811' },
                { seq: 11, type: 'CAPABILITY_REQUESTED (DIRECT_DB_DDL)', verdict: 'BLOCK', hash: 'd001...5566' },
                { seq: 12, type: 'AGENT_EXECUTION_BLOCKED', verdict: 'BLOCKED', hash: '0812...aa77' }
              ].map(item => (
                <div key={item.seq} className="p-2.5 rounded-lg bg-slate-900/40 border border-slate-800/80 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500">#{item.seq}</span>
                    <span className="text-slate-200 font-semibold">{item.type}</span>
                  </div>
                  <div className="flex items-center gap-3 font-mono">
                    <span className={item.verdict === 'ALLOW' || item.verdict === 'SUCCESS' || item.verdict === 'APPROVED' ? 'text-emerald-400 font-bold' : item.verdict === 'BLOCK' || item.verdict === 'BLOCKED' ? 'text-rose-400 font-bold' : item.verdict === 'REQUIRE_HITL' || item.verdict === 'PAUSED' ? 'text-amber-400 font-bold' : 'text-slate-500'}>
                      {item.verdict}
                    </span>
                    <span className="text-slate-500 text-[10px]">{item.hash}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Passport Tab */}
        {activeTab === 'passport' && (
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 font-mono text-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-slate-400 text-[11px] block">PASSPORT FINGERPRINT</span>
                <span className="font-bold text-sky-400 text-sm">SIG-SHA256-BE887C085CFB8970</span>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-[10px]">
                SIGNED & VERIFIABLE
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-[11px]">
              <div>
                <span className="text-slate-500 block">Agent ID</span>
                <span className="text-slate-200 font-bold">agt_2445db66</span>
              </div>
              <div>
                <span className="text-slate-500 block">Runtime Sandbox</span>
                <span className="text-slate-200 font-bold">rt_8c26d9eb (/sandbox/rt_8c26d9eb)</span>
              </div>
              <div>
                <span className="text-slate-500 block">Compliance Profile Checksum</span>
                <span className="text-indigo-400 font-bold">d0c33e6a98dab819... (EU AI Act Financial)</span>
              </div>
              <div>
                <span className="text-slate-500 block">Tool Manifest Digest</span>
                <span className="text-slate-200 font-bold">d570310fb6e4ef53...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Surface Status Footer */}
      <div className="px-6 py-3.5 bg-slate-900/70 border-t border-slate-800 flex flex-wrap items-center justify-between text-xs font-mono text-slate-400 gap-2">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Evidence: <strong className="text-white">15 events</strong> (Hash Verified)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Passport: <strong className="text-white">VERIFIED</strong></span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-[11px]">
          <span className="text-sky-400">Secrets: <strong>DENIED</strong></span>
          <span className="text-sky-400">Network: <strong>DENIED</strong></span>
          <span className="text-emerald-400 font-bold">Enforcement: <strong>ACTIVE</strong></span>
        </div>
      </div>
    </div>
  );
};
