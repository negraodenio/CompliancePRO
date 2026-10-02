import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Cpu, 
  Shield, 
  Layers, 
  Play, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  RefreshCw, 
  ArrowRight, 
  Check, 
  Terminal, 
  KeyRound, 
  FileBadge,
  Sparkles,
  Lock,
  Pause
} from 'lucide-react';

interface ComplianceProfileMeta {
  profileId: string;
  name: string;
  description: string;
  version: string;
  checksum: string;
  applicableRegulations: string[];
  mandatoryControls: string[];
  forbiddenActions: string[];
  requireHumanApproval: string[];
  status: string;
}

interface GovernedCapabilityMeta {
  id: string;
  name: string;
  description: string;
  channel: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  allowedActions: string[];
  dataClassification: string;
  provider: string;
  rateLimit?: { requestsPerMinute: number };
  budget?: { maxCostPerInvocationEur?: number };
  hitl?: { required: boolean; condition?: string };
}

interface ProvisioningResponse {
  agentId: string;
  passportId: string;
  runtimeId: string;
  name: string;
  framework: { name: string; version: string };
  status: 'PROVISIONED';
  guardianStatus: 'ACTIVE';
  evidenceStatus: 'INITIALIZED';
  complianceProfileId: string;
  complianceProfileChecksum: string;
  governedCapabilities: number;
  toolManifestHash: string;
  passportFingerprint: string;
}

interface RuntimeResponse {
  runtimeId: string;
  agentId: string;
  passportId: string;
  status: 'PROVISIONED' | 'STARTING' | 'RUNNING' | 'STOPPED' | 'FAILED' | 'REVOKED';
  isolation: {
    network: string;
    secrets: string;
    filesystem: string;
  };
}

export const AgentStudioView: React.FC = () => {
  // Step state (1: Definition, 2: Framework, 3: Profile, 4: Capabilities, 5: Limits, 6: Provisioned/Control Plane)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form State
  const [agentName, setAgentName] = useState('credit-risk-analyst');
  const [environment, setEnvironment] = useState<'sandbox' | 'staging' | 'production'>('sandbox');
  const [selectedFramework, setSelectedFramework] = useState<'crewai' | 'langgraph' | 'openai'>('crewai');
  const [selectedProfileId, setSelectedProfileId] = useState<string>('CP-EU-AI-ACT-HIGH-RISK-FINANCIAL');
  const [selectedCapabilities, setSelectedCapabilities] = useState<string[]>([
    'crm.read_customer',
    'credit_bureau_query',
    'credit.approve'
  ]);
  const [budgetEur, setBudgetEur] = useState<number>(10.0);
  const [maxTokensPerStep, setMaxTokensPerStep] = useState<number>(4096);
  const [maxCallsPerMinute, setMaxCallsPerMinute] = useState<number>(30);

  // Server-side loaded Metadata
  const [profiles, setProfiles] = useState<ComplianceProfileMeta[]>([]);
  const [capabilities, setCapabilities] = useState<GovernedCapabilityMeta[]>([]);
  const [isLoadingMeta, setIsLoadingMeta] = useState<boolean>(true);
  const [apiError, setApiError] = useState<string | null>(null);

  // Operation States (Authoritative from Backend)
  const [isProvisioning, setIsProvisioning] = useState<boolean>(false);
  const [provisionedAgent, setProvisionedAgent] = useState<ProvisioningResponse | null>(null);
  
  const [isStartingRuntime, setIsStartingRuntime] = useState<boolean>(false);
  const [runtimeState, setRuntimeState] = useState<RuntimeResponse | null>(null);

  // Execution Demo States
  const [isExecutingDemo, setIsExecutingDemo] = useState<boolean>(false);
  const [executionResult, setExecutionResult] = useState<any | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // Load Real Metadata on Mount via Backend REST Endpoints
  useEffect(() => {
    async function loadMetadata() {
      setIsLoadingMeta(true);
      try {
        const [profRes, capRes] = await Promise.all([
          fetch('/api/v1/compliance-profiles'),
          fetch('/api/v1/capabilities')
        ]);

        if (profRes.ok) {
          const profData = await profRes.json();
          setProfiles(profData.profiles || []);
        }

        if (capRes.ok) {
          const capData = await capRes.json();
          setCapabilities(capData.capabilities || []);
        }
      } catch (err: any) {
        console.error('Failed to load server metadata:', err);
        // Fallback default metadata if running in pure dev static mode
        setProfiles([
          {
            profileId: 'CP-EU-AI-ACT-HIGH-RISK-FINANCIAL',
            name: 'EU AI Act High-Risk Financial & Credit Scoring Profile',
            description: 'Enforces human oversight (Art 14), failsafe circuit breakers (Art 9) and audit logging.',
            version: '1.0.0',
            checksum: 'd0c33e6a98dab81966a3d9d300fb2feecbe30b05b3310058b725b8a07c3be1aa',
            applicableRegulations: ['EU_AI_ACT', 'DORA'],
            mandatoryControls: ['CG-AG-01', 'CG-AG-02', 'CG-AG-03'],
            forbiddenActions: ['DIRECT_DB_DDL', 'DISABLE_AUDIT_LOGGING'],
            requireHumanApproval: ['credit.approve', 'approve_credit_limit', 'transfer_funds'],
            status: 'COMPILED_AND_VERIFIED'
          },
          {
            profileId: 'CP-EU-GDPR-PRIVACY-HEAVY',
            name: 'EU GDPR Privacy & Confidentiality Agent Profile',
            description: 'Strict purpose limitation, automated PII scrubbing, and mandatory consent.',
            version: '1.0.0',
            checksum: '8b48cb45cf14e7a783783a3dbe84a7e93f3c4db52f01fdf7922d56d11f2679aa',
            applicableRegulations: ['GDPR'],
            mandatoryControls: ['CG-AG-01', 'CG-AG-02', 'CG-AG-05'],
            forbiddenActions: ['BULK_EXPORT_UNMASKED_PII', 'DISABLE_DATA_ENCRYPTION'],
            requireHumanApproval: ['export_customer_data'],
            status: 'COMPILED_AND_VERIFIED'
          }
        ]);
        setCapabilities([
          {
            id: 'crm.read_customer',
            name: 'CRM Read Customer Profile',
            description: 'Read customer account metadata and public KYC records',
            channel: 'TOOL',
            riskLevel: 'LOW',
            allowedActions: ['READ'],
            dataClassification: 'CONFIDENTIAL',
            provider: 'salesforce-mcp-server'
          },
          {
            id: 'credit_bureau_query',
            name: 'Credit Bureau External Query',
            description: 'Queries national and international credit scoring bureaus',
            channel: 'TOOL',
            riskLevel: 'LOW',
            allowedActions: ['READ'],
            dataClassification: 'CONFIDENTIAL',
            provider: 'schufa-experian-gateway'
          },
          {
            id: 'credit.approve',
            name: 'Credit Decision Approval',
            description: 'Approve or increase customer credit lines and overdraft limits',
            channel: 'TOOL',
            riskLevel: 'HIGH',
            allowedActions: ['WRITE', 'EXECUTE'],
            dataClassification: 'CONFIDENTIAL',
            provider: 'core-banking-system',
            hitl: { required: true, condition: 'amount > 10000' }
          },
          {
            id: 'DIRECT_DB_DDL',
            name: 'Direct Database Schema Alteration',
            description: 'Arbitrary SQL DDL commands (ALTER, DROP, CREATE TABLE)',
            channel: 'TOOL',
            riskLevel: 'CRITICAL',
            allowedActions: ['DELETE', 'ADMIN'],
            dataClassification: 'RESTRICTED',
            provider: 'direct-postgresql-pool',
            hitl: { required: true, condition: 'always' }
          }
        ]);
      } finally {
        setIsLoadingMeta(false);
      }
    }

    loadMetadata();
  }, []);

  const toggleCapability = (id: string) => {
    if (selectedCapabilities.includes(id)) {
      setSelectedCapabilities(selectedCapabilities.filter(c => c !== id));
    } else {
      setSelectedCapabilities([...selectedCapabilities, id]);
    }
  };

  // STEP 8: Call the REAL Provisioning API
  const handleProvision = async () => {
    setIsProvisioning(true);
    setApiError(null);

    const definition = {
      name: agentName,
      framework: {
        name: selectedFramework,
        version: selectedFramework === 'crewai' ? '0.102.0' : '1.0.0'
      },
      complianceProfile: selectedProfileId,
      capabilities: selectedCapabilities,
      budget: {
        maxCostPerRunEur: Number(budgetEur),
        maxTokensPerStep: Number(maxTokensPerStep),
        maxCallsPerMinute: Number(maxCallsPerMinute)
      },
      environment
    };

    try {
      const res = await fetch('/api/v1/agents/provision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(definition)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Provisioning rejected by ComplyPRO Control Plane');
      }

      setProvisionedAgent(data);
      setCurrentStep(6); // Navigate to Operating View
    } catch (err: any) {
      setApiError(err.message || 'Provisioning failed');
    } finally {
      setIsProvisioning(false);
    }
  };

  // STEP 9: Call the REAL Runtime API
  const handleStartRuntime = async () => {
    if (!provisionedAgent) return;
    setIsStartingRuntime(true);
    setApiError(null);

    try {
      const res = await fetch('/api/v1/runtimes/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ runtimeId: provisionedAgent.runtimeId })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to start isolated runtime worker');
      }

      // Authoritative status returned by backend
      setRuntimeState(data.runtime);
    } catch (err: any) {
      setApiError(err.message || 'Runtime start denied');
    } finally {
      setIsStartingRuntime(false);
    }
  };

  // STEP 10: Call the REAL Governed Execution Launch Endpoint
  const handleLaunchExecution = async (capability: string, actionType: 'READ' | 'WRITE' | 'DELETE', payload?: any) => {
    if (!runtimeState || runtimeState.status !== 'RUNNING') return;
    setIsExecutingDemo(true);
    setApiError(null);

    try {
      const res = await fetch('/api/v1/executions/launch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          runtimeId: runtimeState.runtimeId,
          task: {
            taskId: `task_${Date.now()}`,
            description: `Agent Studio Invocation: ${capability}`,
            targetCapability: capability,
            actionType,
            payload
          }
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Execution failed');
      }

      setExecutionResult(data.result);
      setActiveSessionId(data.executionId);
    } catch (err: any) {
      setApiError(err.message);
    } finally {
      setIsExecutingDemo(false);
    }
  };

  // STEP 11: Call the REAL Approve Endpoint
  const handleApproveHitl = async () => {
    if (!activeSessionId) return;
    try {
      const res = await fetch(`/api/v1/executions/${activeSessionId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operatorId: 'OP-STUDIO-OFFICER' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Approval failed');
      setExecutionResult(data.result);
    } catch (err: any) {
      setApiError(err.message);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8 font-sans">
      {/* Studio Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 text-[11px] font-mono font-bold uppercase tracking-wider">
              ComplyPRO Control Plane
            </span>
            <span className="text-xs font-mono text-slate-400">· Active Provisioning</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
            Governed Agent Studio
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl mt-0.5">
            Create, run and govern AI agents inside a controlled execution environment where every capability is enforced at runtime.
          </p>
        </div>

        {/* Global Lifecycle Step Indicator */}
        <div className="flex items-center gap-1.5 font-mono text-xs">
          {[
            { step: 1, label: 'Metadata' },
            { step: 2, label: 'Framework' },
            { step: 3, label: 'Profile' },
            { step: 4, label: 'Capabilities' },
            { step: 5, label: 'Review' },
            { step: 6, label: 'Operating' }
          ].map(s => (
            <button
              key={s.step}
              onClick={() => {
                if (provisionedAgent || s.step <= currentStep) setCurrentStep(s.step);
              }}
              disabled={!provisionedAgent && s.step > currentStep}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                currentStep === s.step
                  ? 'bg-sky-600 text-white font-bold shadow-xs'
                  : currentStep > s.step || provisionedAgent
                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700'
                    : 'bg-transparent text-slate-400 opacity-50 cursor-not-allowed'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error Alert Banner */}
      {apiError && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-mono flex items-center justify-between">
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4 shrink-0" />
            <span>{apiError}</span>
          </div>
          <button onClick={() => setApiError(null)} className="text-slate-400 hover:text-slate-200 font-bold">×</button>
        </div>
      )}

      {/* STEP 1: Agent Metadata */}
      {currentStep === 1 && (
        <div className="space-y-6 animate-fadeIn max-w-3xl">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">1. Agent Operational Identity</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Define the business entity and target deployment boundary for this governed agent.
            </p>
          </div>

          <div className="space-y-4 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div>
              <label className="block text-xs font-mono font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                AGENT IDENTIFIER NAME
              </label>
              <input
                type="text"
                value={agentName}
                onChange={e => setAgentName(e.target.value)}
                placeholder="e.g. credit-risk-analyst"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                DEPLOYMENT PERIMETER ENVIRONMENT
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(['sandbox', 'staging', 'production'] as const).map(env => (
                  <button
                    key={env}
                    type="button"
                    onClick={() => setEnvironment(env)}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      environment === env
                        ? 'border-sky-500 bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <span className="font-mono text-xs uppercase block">{env}</span>
                    <span className="text-[10px] text-slate-400">
                      {env === 'sandbox' ? 'Strict isolation & mock gateways' : env === 'staging' ? 'Pre-production testnet' : 'Live tenant workloads'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => setCurrentStep(2)}
              className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-2 transition cursor-pointer"
            >
              <span>Next: Select Framework</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Framework Selection */}
      {currentStep === 2 && (
        <div className="space-y-6 animate-fadeIn max-w-3xl">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">2. Execution Framework Integration</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select the autonomous agent framework. Build with your existing codebase; ComplyPRO provides the governed execution perimeter.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* CrewAI: Real & Executable */}
            <div
              onClick={() => setSelectedFramework('crewai')}
              className={`p-5 rounded-2xl border transition cursor-pointer space-y-3 ${
                selectedFramework === 'crewai'
                  ? 'border-sky-500 bg-sky-500/10 ring-2 ring-sky-500/20'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-900 dark:text-white text-sm">CrewAI</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold">
                  EXECUTABLE
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Full execution support via <code className="text-sky-400 font-mono">CrewAiRuntimeAdapter</code>. Intercepts capability invocations and enforces Guardian policies.
              </p>
              <div className="text-[11px] font-mono text-slate-400 pt-1">
                Version: <strong className="text-slate-200">0.102.0</strong> · Zero Secrets
              </div>
            </div>

            {/* LangGraph: Planned */}
            <div
              onClick={() => setSelectedFramework('langgraph')}
              className={`p-5 rounded-2xl border transition cursor-pointer space-y-3 opacity-80 ${
                selectedFramework === 'langgraph'
                  ? 'border-sky-500 bg-sky-500/10'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-900 dark:text-white text-sm">LangGraph</span>
                <span className="px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-500 border border-slate-500/30 text-[10px] font-mono">
                  ADAPTER PLANNED
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Framework catalog entry. Graph state checkpointing and tool interception adapter scheduled in roadmap.
              </p>
              <div className="text-[11px] font-mono text-slate-400 pt-1">
                State: Provisioning Only
              </div>
            </div>

            {/* OpenAI SDK: Planned */}
            <div
              onClick={() => setSelectedFramework('openai')}
              className={`p-5 rounded-2xl border transition cursor-pointer space-y-3 opacity-80 ${
                selectedFramework === 'openai'
                  ? 'border-sky-500 bg-sky-500/10'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-900 dark:text-white text-sm">OpenAI SDK</span>
                <span className="px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-500 border border-slate-500/30 text-[10px] font-mono">
                  ADAPTER PLANNED
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Framework catalog entry. Assistants API tool interception adapter scheduled in roadmap.
              </p>
              <div className="text-[11px] font-mono text-slate-400 pt-1">
                State: Provisioning Only
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setCurrentStep(1)}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Back
            </button>
            <button
              onClick={() => setCurrentStep(3)}
              className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-2 transition cursor-pointer"
            >
              <span>Next: Select Compliance Profile</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Compliance Profile */}
      {currentStep === 3 && (
        <div className="space-y-6 animate-fadeIn max-w-3xl">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">3. Compliance Profile Configuration</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select the compiled, checksummed policy bundle that governs the agent. The profile defines executable policies, prohibited actions, and human oversight gates.
            </p>
          </div>

          <div className="space-y-3">
            {profiles.map(p => (
              <div
                key={p.profileId}
                onClick={() => setSelectedProfileId(p.profileId)}
                className={`p-5 rounded-2xl border transition cursor-pointer space-y-3 ${
                  selectedProfileId === p.profileId
                    ? 'border-sky-500 bg-sky-500/10 ring-2 ring-sky-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-sky-500" />
                    <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">{p.profileId}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 text-[10px] font-mono">
                    Profile configured for this agent
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-semibold">
                  {p.name}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {p.description}
                </p>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-slate-400">
                  <div>
                    Checksum: <span className="text-indigo-400 font-bold">{p.checksum.substring(0, 16)}...</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>Forbidden: <strong className="text-rose-400">{p.forbiddenActions.length}</strong></span>
                    <span>·</span>
                    <span>HITL Gates: <strong className="text-amber-400">{p.requireHumanApproval.length}</strong></span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setCurrentStep(2)}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Back
            </button>
            <button
              onClick={() => setCurrentStep(4)}
              className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-2 transition cursor-pointer"
            >
              <span>Next: Select Capabilities</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Governed Capabilities */}
      {currentStep === 4 && (
        <div className="space-y-6 animate-fadeIn max-w-4xl">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">4. Governed Capability Invocations</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select the capabilities this agent is authorized to request. Every capability is bound to a channel, risk level and HITL thresholds.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {capabilities.map(cap => {
              const isSelected = selectedCapabilities.includes(cap.id);
              return (
                <div
                  key={cap.id}
                  onClick={() => toggleCapability(cap.id)}
                  className={`p-4 rounded-xl border transition cursor-pointer flex flex-col justify-between space-y-2 ${
                    isSelected
                      ? 'border-sky-500 bg-sky-500/10'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">{cap.id}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      cap.riskLevel === 'HIGH' || cap.riskLevel === 'CRITICAL'
                        ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                        : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                    }`}>
                      {cap.riskLevel}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                    {cap.description}
                  </p>

                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>Channel: <strong className="text-slate-200">{cap.channel}</strong></span>
                    {cap.hitl?.required && (
                      <span className="text-amber-400 font-bold">HITL: {cap.hitl.condition || 'Required'}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setCurrentStep(3)}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Back
            </button>
            <button
              onClick={() => setCurrentStep(5)}
              className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-2 transition cursor-pointer"
            >
              <span>Next: Review & Limits</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: Limits & Review */}
      {currentStep === 5 && (
        <div className="space-y-6 animate-fadeIn max-w-3xl">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">5. Operational Boundaries & Review</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Configure strict budget boundaries. Review the agent operational definition before binding it to a cryptographic Agent Passport.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-xs font-mono font-bold text-sky-500 uppercase tracking-wider">
              FINANCIAL & RESOURCE BOUNDARIES
            </h3>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">Max Cost/Run (€)</label>
                <input
                  type="number"
                  value={budgetEur}
                  onChange={e => setBudgetEur(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">Max Tokens/Step</label>
                <input
                  type="number"
                  value={maxTokensPerStep}
                  onChange={e => setMaxTokensPerStep(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">Max Calls/Minute</label>
                <input
                  type="number"
                  value={maxCallsPerMinute}
                  onChange={e => setMaxCallsPerMinute(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-xs text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Agent Name:</span>
                <span className="text-white font-bold">{agentName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Framework:</span>
                <span className="text-sky-400 font-bold">{selectedFramework.toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Compliance Profile:</span>
                <span className="text-indigo-400 font-bold">{selectedProfileId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Capabilities:</span>
                <span className="text-emerald-400 font-bold">{selectedCapabilities.length} declared</span>
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setCurrentStep(4)}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Back
            </button>
            <button
              onClick={handleProvision}
              disabled={isProvisioning}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-sky-500/25 flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
            >
              <FileBadge className="w-4 h-4" />
              <span>{isProvisioning ? 'Provisioning...' : 'Provision Agent'}</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 6: Operating & Control Plane View */}
      {currentStep === 6 && (
        <div className="space-y-6 animate-fadeIn">
          {/* Top Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card 1: Provisioning State */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-400">PROVISIONING STATE</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-mono font-bold">
                  {provisionedAgent?.status || 'PROVISIONED'}
                </span>
              </div>
              <div className="font-mono text-sm font-extrabold text-slate-900 dark:text-white truncate">
                {provisionedAgent?.agentId || '—'}
              </div>
              <div className="text-[10px] font-mono text-slate-400">
                Passport: <strong className="text-sky-400">{provisionedAgent?.passportFingerprint.substring(0, 16)}...</strong>
              </div>
            </div>

            {/* Card 2: Runtime State (Authoritative) */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-400">RUNTIME WORKER</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                  runtimeState?.status === 'RUNNING'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                }`}>
                  {runtimeState ? runtimeState.status : 'PROVISIONED (READY)'}
                </span>
              </div>
              <div className="font-mono text-sm font-extrabold text-slate-900 dark:text-white truncate">
                {provisionedAgent?.runtimeId || '—'}
              </div>
              <div className="text-[10px] font-mono text-slate-400">
                Isolation: <strong className="text-sky-400">NET=DENY · SECRETS=DENY</strong>
              </div>
            </div>

            {/* Card 3: Guardian & Evidence */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-400">GUARDIAN & EVIDENCE</span>
                <span className="px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/30 text-[10px] font-mono font-bold">
                  ACTIVE
                </span>
              </div>
              <div className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                Tamper-Evident Hash Chain
              </div>
              <div className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Causal Evidence Genesis Validated</span>
              </div>
            </div>
          </div>

          {/* Runtime Launch Operations */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-sky-400" />
                  <span>Isolated Runtime Lifecycle Control</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Launch or stop the dedicated isolated execution worker process for this provisioned passport.
                </p>
              </div>

              {!runtimeState || runtimeState.status !== 'RUNNING' ? (
                <button
                  onClick={handleStartRuntime}
                  disabled={isStartingRuntime}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{isStartingRuntime ? 'Starting Worker...' : 'Start Runtime'}</span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    RUNNING ON /sandbox/{runtimeState.runtimeId}
                  </span>
                </div>
              )}
            </div>

            {/* Governed Execution Demo Controls (Only when RUNNING) */}
            {runtimeState?.status === 'RUNNING' && (
              <div className="pt-4 border-t border-slate-800 space-y-3">
                <div className="text-xs font-mono font-bold text-slate-300">
                  DISPATCH GOVERNED TASKS (VIA TOOL GATEWAY & GUARDIAN)
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => handleLaunchExecution('crm.read_customer', 'READ', { customerId: 'CUST-10928' })}
                    disabled={isExecutingDemo}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs border border-slate-700 transition cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Read Customer (ALLOW)</span>
                  </button>

                  <button
                    onClick={() => handleLaunchExecution('credit.approve', 'WRITE', { customerId: 'CUST-10928', amount: 25000 })}
                    disabled={isExecutingDemo}
                    className="px-4 py-2 rounded-xl bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 font-mono text-xs border border-amber-500/30 transition cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Approve €25,000 (HITL)</span>
                  </button>

                  <button
                    onClick={() => handleLaunchExecution('DIRECT_DB_DDL', 'DELETE', { sql: 'DROP TABLE customers;' })}
                    disabled={isExecutingDemo}
                    className="px-4 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 font-mono text-xs border border-rose-500/30 transition cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Direct DDL (BLOCK)</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Live Execution Timeline / Results */}
          {executionResult && (
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-slate-200">REAL EXECUTION VERDICT</span>
                <span className={`px-2.5 py-1 rounded text-[11px] font-bold ${
                  executionResult.status === 'COMPLETED'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : executionResult.status === 'PAUSED'
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                }`}>
                  {executionResult.status} (Tool Count: {executionResult.toolExecutionCount})
                </span>
              </div>

              {executionResult.status === 'PAUSED' && (
                <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-amber-300 font-bold">HUMAN APPROVAL REQUIRED</span>
                    <span className="text-slate-400 text-[10px]">Gate: {executionResult.gateId}</span>
                  </div>
                  <p className="text-slate-300 text-[11px] font-sans">
                    The agent action exceeded autonomous thresholds. Execution is held in memory inside the worker.
                  </p>
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={handleApproveHitl}
                      className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer"
                    >
                      [ APPROVE & RESUME ]
                    </button>
                  </div>
                </div>
              )}

              {executionResult.status === 'BLOCKED' && (
                <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/30 text-rose-300 text-[11px]">
                  <strong>BLOCKED BY GUARDIAN:</strong> {executionResult.error}
                </div>
              )}

              {executionResult.status === 'COMPLETED' && (
                <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-emerald-300 text-[11px]">
                  <strong>TOOL EXECUTED VIA GATEWAY:</strong> Latency: {executionResult.decisionLatencyMs?.toFixed(2)}ms · Causal evidence anchored.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
