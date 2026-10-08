import React, { useState } from 'react';
import { ActiveNavView } from '../components/AppShell';
import { 
  Building, 
  Key, 
  Shield, 
  Cpu, 
  Lock, 
  ChevronDown, 
  ChevronRight,
  Check,
  CheckCircle2,
  Server,
  Layers,
  ArrowUpRight,
  Users,
  AlertTriangle,
  FileCheck,
  Sliders
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useIndustry } from '../context/IndustryContext';
import { 
  getSiliconFlowApiKey, 
  setSiliconFlowApiKey, 
  getSelectedModel, 
  setSelectedModel, 
  AVAILABLE_MODELS 
} from '../services/siliconflow';

interface SettingsViewProps {
  onNavigate?: (view: ActiveNavView) => void;
}

const ADVANCED_WORKSPACES: Array<{
  id: ActiveNavView;
  name: string;
  category: string;
  description: string;
}> = [
  { id: 'cockpit-control', name: 'Governance Cockpit', category: 'Executive', description: 'Real-time telemetry, threat levels, and active perimeters' },
  { id: 'overview-center', name: 'Governance Center', category: 'Executive', description: 'Central governance health overview and compliance posture' },
  { id: 'govern-controls', name: '12 Controls Matrix', category: 'Controls', description: 'CG-AGF 12 Controls framework assessment and enforcement status' },
  { id: 'govern-risk', name: 'Risk Engine', category: 'Risk', description: 'Multi-dimensional risk scoring across EU AI Act tiers' },
  { id: 'govern-policies', name: 'Policy Engine', category: 'Policies', description: 'Enterprise policy rules, constraints, and runtime evaluation' },
  { id: 'operate-approvals', name: 'Human Approvals (HITL)', category: 'Runtime', description: 'Supervisory authorization queue for sensitive agent actions' },
  { id: 'operate-incidents', name: 'Failsafe & Incidents', category: 'Runtime', description: 'Kill switches, containment perimeters, and incident logs' },
  { id: 'tools-integrations', name: 'Universal MCP', category: 'Integrations', description: 'Model Context Protocol endpoints, tools, and resource bridges' },
  { id: 'manage-team', name: 'Team & RBAC', category: 'Access', description: 'Role-based access control, tenant users, and organization members' },
  { id: 'learn-academy', name: 'Governance Academy', category: 'Knowledge', description: 'Compliance blueprints, guides, and enterprise standards' },
  { id: 'studio-builder', name: 'Agent Studio', category: 'Builder', description: 'Native agent creation workspace with built-in governance passport' },
];

export const SettingsView: React.FC<SettingsViewProps> = ({ onNavigate }) => {
  const { user, activeOrganization, enterpriseRole } = useAuth();
  const { activeProfile, setActiveProfile, environment, setEnvironment } = useIndustry();

  const [apiKey, setKey] = useState(getSiliconFlowApiKey());
  const [model, setModel] = useState(getSelectedModel());
  const [gitToken, setGitToken] = useState(() => localStorage.getItem('github_token') || '');
  const [savedToast, setSavedToast] = useState(false);

  // Progressive Disclosure: Collapsible sections
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    general: true,
    auth: false,
    providers: true,
    governance: false,
    advanced: false
  });

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleSaveProviders = (e: React.FormEvent) => {
    e.preventDefault();
    setSiliconFlowApiKey(apiKey);
    setSelectedModel(model);
    if (gitToken.trim()) {
      localStorage.setItem('github_token', gitToken.trim());
    } else {
      localStorage.removeItem('github_token');
    }
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2500);
  };

  return (
    <div className="space-y-6 pb-16 max-w-4xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Settings
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage organization preferences, provider credentials, and governance configurations.
        </p>
      </div>

      {savedToast && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-200 flex items-center space-x-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>Configuration saved successfully.</span>
        </div>
      )}

      <div className="space-y-4">
        {/* 1. GENERAL SETTINGS */}
        <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('general')}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 transition cursor-pointer"
          >
            <div className="flex items-center space-x-3">
              <Building className="w-4 h-4 text-slate-500" />
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">General</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Organization profile and environment mode</p>
              </div>
            </div>
            {openSections.general ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
          </button>

          {openSections.general && (
            <div className="p-5 border-t border-slate-100 dark:border-slate-800 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-medium text-slate-700 dark:text-slate-300">Organization Name</label>
                  <input
                    type="text"
                    readOnly
                    value={activeOrganization?.name || 'ComplyPRO Enterprise Org'}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-slate-700 dark:text-slate-300">Environment</label>
                  <select
                    value={environment}
                    onChange={(e) => setEnvironment(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs cursor-pointer"
                  >
                    <option value="production">Production</option>
                    <option value="staging">Staging</option>
                    <option value="development">Development</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-slate-700 dark:text-slate-300">Regulatory Profile</label>
                <input
                  type="text"
                  readOnly
                  value={`${activeProfile.name} (${activeProfile.id})`}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 text-xs"
                />
              </div>
            </div>
          )}
        </div>

        {/* 2. AUTHENTICATION & ACCESS */}
        <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('auth')}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 transition cursor-pointer"
          >
            <div className="flex items-center space-x-3">
              <Key className="w-4 h-4 text-slate-500" />
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Authentication & Access</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Tenant isolation, active user, and role-based permissions</p>
              </div>
            </div>
            {openSections.auth ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
          </button>

          {openSections.auth && (
            <div className="p-5 border-t border-slate-100 dark:border-slate-800 space-y-3 text-xs">
              <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800/80">
                <span className="text-slate-500 dark:text-slate-400">Authenticated User</span>
                <span className="font-semibold text-slate-900 dark:text-white">{user?.email || 'admin@complypro.org'}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800/80">
                <span className="text-slate-500 dark:text-slate-400">Enterprise Role</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">{enterpriseRole}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-500 dark:text-slate-400">Tenant Isolation Level</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">RLS Strict Isolation (Active)</span>
              </div>
              {onNavigate && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                  <button
                    type="button"
                    onClick={() => onNavigate('manage-team')}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>Manage Team & RBAC Permissions</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 3. PROVIDERS & CREDENTIALS */}
        <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('providers')}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 transition cursor-pointer"
          >
            <div className="flex items-center space-x-3">
              <Cpu className="w-4 h-4 text-slate-500" />
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Providers</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Model inference providers and source control connections</p>
              </div>
            </div>
            {openSections.providers ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
          </button>

          {openSections.providers && (
            <form onSubmit={handleSaveProviders} className="p-5 border-t border-slate-100 dark:border-slate-800 space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-medium text-slate-700 dark:text-slate-300">Model Inference API Key</label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-900 dark:text-white"
                />
                <p className="text-[11px] text-slate-400">Credentials are stored locally and routed securely via Model Gateway perimeters.</p>
              </div>

              <div className="space-y-2">
                <label className="font-medium text-slate-700 dark:text-slate-300">Default Analysis Model</label>
                <div className="space-y-1.5">
                  {AVAILABLE_MODELS.map((m) => (
                    <label
                      key={m.id}
                      onClick={() => setModel(m.id)}
                      className={`p-3 rounded-lg border flex items-center justify-between cursor-pointer transition ${
                        model === m.id
                          ? 'bg-slate-50 dark:bg-slate-800/60 border-slate-900 dark:border-slate-600'
                          : 'bg-white dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white">{m.name}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">{m.description}</div>
                      </div>
                      <input
                        type="radio"
                        name="settings_model"
                        checked={model === m.id}
                        onChange={() => setModel(m.id)}
                        className="accent-slate-900 dark:accent-slate-100"
                      />
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="font-medium text-slate-700 dark:text-slate-300">GitHub Personal Access Token (Optional)</label>
                <input
                  type="password"
                  value={gitToken}
                  onChange={(e) => setGitToken(e.target.value)}
                  placeholder="ghp_... (used for private repositories during Discovery)"
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 rounded-lg text-xs font-semibold cursor-pointer transition shadow-xs"
                >
                  Save Provider Settings
                </button>
              </div>
            </form>
          )}
        </div>

        {/* 4. GOVERNANCE CONFIGURATION */}
        <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('governance')}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 transition cursor-pointer"
          >
            <div className="flex items-center space-x-3">
              <Shield className="w-4 h-4 text-slate-500" />
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Governance Configuration</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Baseline thresholds, sandbox requirements, and ledger retention</p>
              </div>
            </div>
            {openSections.governance ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
          </button>

          {openSections.governance && (
            <div className="p-5 border-t border-slate-100 dark:border-slate-800 space-y-3 text-xs">
              <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800/80">
                <div>
                  <span className="font-medium text-slate-900 dark:text-white block">Human Approval Threshold</span>
                  <span className="text-[11px] text-slate-400">Trigger mandatory operator sign-off for financial impact</span>
                </div>
                <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold">€10,000.00</span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800/80">
                <div>
                  <span className="font-medium text-slate-900 dark:text-white block">Worker Air-Gap Perimeter</span>
                  <span className="text-[11px] text-slate-400">Execute agent code in zero-secret worker sandboxes</span>
                </div>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Enforced</span>
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <span className="font-medium text-slate-900 dark:text-white block">Evidence Ledger Retention</span>
                  <span className="text-[11px] text-slate-400">Cryptographic audit log retention policy</span>
                </div>
                <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold">7 Years (Immutable)</span>
              </div>
            </div>
          )}
        </div>

        {/* 5. ADVANCED GOVERNANCE & WORKSPACES */}
        <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('advanced')}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 transition cursor-pointer"
          >
            <div className="flex items-center space-x-3">
              <Layers className="w-4 h-4 text-slate-500" />
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Advanced Governance & Workspaces</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Deep telemetry, 12 controls matrix, policy & risk engines, runtime failsafes, and universal MCP</p>
              </div>
            </div>
            {openSections.advanced ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
          </button>

          {openSections.advanced && (
            <div className="p-5 border-t border-slate-100 dark:border-slate-800 space-y-3 text-xs">
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                Advanced governance infrastructure components operate under progressive disclosure. All underlying engines, matrices, and gateways remain active and can be accessed directly below.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                {ADVANCED_WORKSPACES.map((ws) => (
                  <div
                    key={ws.id}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex flex-col justify-between space-y-2 hover:border-slate-300 dark:hover:border-slate-700 transition"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900 dark:text-white text-xs">{ws.name}</span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-medium bg-slate-100 dark:bg-slate-800 text-slate-500">
                          {ws.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                        {ws.description}
                      </p>
                    </div>

                    {onNavigate && (
                      <div className="pt-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => onNavigate(ws.id)}
                          className="inline-flex items-center space-x-1 text-[11px] font-semibold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
                        >
                          <span>Open Workspace</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
