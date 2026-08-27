import React, { useState } from 'react';
import { 
  Shield, 
  LayoutDashboard, 
  Layers, 
  Bot, 
  FileBadge, 
  ClipboardCheck, 
  CheckSquare, 
  AlertTriangle, 
  FileText, 
  Scale, 
  Cpu, 
  Lock, 
  Activity, 
  Zap, 
  FolderCheck, 
  BookOpen, 
  FileDown, 
  Terminal, 
  Share2, 
  Settings, 
  ChevronDown, 
  Sun, 
  Moon, 
  ExternalLink,
  Search,
  Building2,
  CheckCircle2,
  LockKeyhole
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useIndustry, INDUSTRY_PROFILES, IndustryProfile } from '../context/IndustryContext';

export type ActiveNavView = 
  | 'overview-center'
  | 'discover-inventory'
  | 'discover-agents'
  | 'discover-passports'
  | 'discover-assessments'
  | 'govern-controls'
  | 'govern-risk'
  | 'govern-policies'
  | 'govern-compliance'
  | 'operate-decisions'
  | 'operate-approvals'
  | 'operate-actions'
  | 'operate-incidents'
  | 'operate-runtime'
  | 'assure-evidence'
  | 'assure-audit'
  | 'assure-reports'
  | 'tools-scanner'
  | 'tools-integrations'
  | 'settings';

interface AppShellProps {
  activeView: ActiveNavView;
  setActiveView: (view: ActiveNavView) => void;
  children: React.ReactNode;
  totalAgentsCount?: number;
  criticalGapsCount?: number;
}

export const AppShell: React.FC<AppShellProps> = ({
  activeView,
  setActiveView,
  children,
  totalAgentsCount = 27,
  criticalGapsCount = 3
}) => {
  const { theme, toggleTheme } = useTheme();
  const { activeProfile, setActiveProfile, environment, setEnvironment } = useIndustry();
  const [isIndustryMenuOpen, setIsIndustryMenuOpen] = useState(false);

  const navItems = [
    {
      group: 'OVERVIEW',
      items: [
        { id: 'overview-center', label: 'Governance Center', icon: LayoutDashboard, badge: null }
      ]
    },
    {
      group: 'DISCOVER',
      items: [
        { id: 'discover-inventory', label: 'AI Inventory', icon: Layers, badge: '142' },
        { id: 'discover-agents', label: 'Agents & Teams', icon: Bot, badge: String(totalAgentsCount) },
        { id: 'discover-passports', label: 'Agent Passports', icon: FileBadge, badge: 'Verified' },
        { id: 'discover-assessments', label: 'Assessments', icon: ClipboardCheck, badge: null }
      ]
    },
    {
      group: 'GOVERN',
      items: [
        { id: 'govern-controls', label: '12 CG-AG Controls', icon: CheckSquare, badge: '12/12' },
        { id: 'govern-risk', label: 'Risk Engine', icon: AlertTriangle, badge: criticalGapsCount > 0 ? `${criticalGapsCount} High` : null },
        { id: 'govern-policies', label: 'Policy Engine', icon: FileText, badge: null },
        { id: 'govern-compliance', label: 'Compliance Frameworks', icon: Scale, badge: 'AI Act' }
      ]
    },
    {
      group: 'OPERATE',
      items: [
        { id: 'operate-decisions', label: 'Decisions Pipeline', icon: Scale, badge: null },
        { id: 'operate-approvals', label: 'HITL Approvals', icon: LockKeyhole, badge: '2 Pending' },
        { id: 'operate-actions', label: 'Remediation Actions', icon: CheckCircle2, badge: null },
        { id: 'operate-incidents', label: 'Incidents & Circuit Breakers', icon: Zap, badge: null },
        { id: 'operate-runtime', label: 'Runtime FinOps', icon: Activity, badge: null }
      ]
    },
    {
      group: 'ASSURE',
      items: [
        { id: 'assure-evidence', label: 'Protected Evidence', icon: FolderCheck, badge: 'Tamper-Evident' },
        { id: 'assure-audit', label: 'Audit Ledger', icon: BookOpen, badge: null },
        { id: 'assure-reports', label: 'Regulatory Dossiers', icon: FileDown, badge: 'RIPD' }
      ]
    },
    {
      group: 'TOOLS',
      items: [
        { id: 'tools-scanner', label: 'Codebase Scanner', icon: Terminal, badge: 'Sensor' },
        { id: 'tools-integrations', label: 'MCP & Connectors', icon: Share2, badge: 'Stdio/SSE' }
      ]
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#080c14] text-slate-900 dark:text-slate-100 transition-colors duration-150">
      {/* Top Application Bar */}
      <header className="h-14 border-b border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-[#0b0f19]/90 backdrop-blur-md px-4 flex items-center justify-between sticky top-0 z-30">
        {/* Left: Brand & Workspace */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2.5 cursor-pointer" onClick={() => setActiveView('overview-center')}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center shadow-sm">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                CG-AG <span className="font-normal text-xs text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 px-1.5 py-0.5 rounded border border-sky-200 dark:border-sky-800/50">Governance OS</span>
              </span>
            </div>
          </div>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />

          {/* Workspace & Industry Selector */}
          <div className="relative">
            <button 
              onClick={() => setIsIndustryMenuOpen(!isIndustryMenuOpen)}
              className="flex items-center space-x-2 text-xs bg-slate-100 dark:bg-slate-900/90 hover:bg-slate-200/80 dark:hover:bg-slate-800/80 px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-800 transition"
            >
              <Building2 className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span className="font-medium text-slate-800 dark:text-slate-200">{activeProfile.sampleOrg}</span>
              <span className="text-slate-400 dark:text-slate-500">·</span>
              <span className="text-sky-600 dark:text-sky-400 font-medium">{activeProfile.icon} {activeProfile.name}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isIndustryMenuOpen && (
              <div className="absolute left-0 mt-1.5 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl py-2 z-50">
                <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Select Industry Governance Profile
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                  {INDUSTRY_PROFILES.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setActiveProfile(p);
                        setIsIndustryMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-start space-x-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition ${
                        activeProfile.id === p.id ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300' : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span className="text-base">{p.icon}</span>
                      <div className="flex-1">
                        <div className="font-medium flex items-center justify-between">
                          <span>{p.name}</span>
                          {activeProfile.id === p.id && <span className="text-[10px] font-semibold text-sky-600 dark:text-sky-400">ACTIVE</span>}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">{p.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Environment, Audit Badge & User Profile */}
        <div className="flex items-center space-x-3">
          {/* Environment Switcher */}
          <div className="hidden sm:flex items-center space-x-1 bg-slate-100 dark:bg-slate-900 p-0.5 rounded-md border border-slate-200 dark:border-slate-800 text-[11px]">
            {(['Production', 'Staging', 'Sandbox'] as const).map((env) => (
              <button
                key={env}
                onClick={() => setEnvironment(env)}
                className={`px-2 py-0.5 rounded font-medium transition ${
                  environment === env 
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' 
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {env}
              </button>
            ))}
          </div>

          {/* Tamper-Evident Status */}
          <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-medium text-[11px]">Tamper-Evident Active</span>
          </div>

          {/* Theme Switcher */}
          <button 
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            className="p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* User / Stakeholder Avatar */}
          <div className="flex items-center space-x-2 pl-2 border-l border-slate-200 dark:border-slate-800">
            <div className="w-7 h-7 rounded-full bg-slate-800 text-sky-400 border border-slate-700 flex items-center justify-center font-bold text-xs">
              RA
            </div>
            <div className="hidden lg:block text-left">
              <div className="text-xs font-medium text-slate-800 dark:text-slate-200 leading-tight">Roberto Silva</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">CISO & Accountable Lead</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Control Plane Sidebar */}
        <aside className="w-64 border-r border-slate-200 dark:border-slate-800/80 bg-white/50 dark:bg-[#0b0f19]/60 flex flex-col justify-between overflow-y-auto shrink-0 select-none">
          <div className="p-3 space-y-4">
            {navItems.map((group) => (
              <div key={group.group}>
                <div className="px-2.5 mb-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase">
                  {group.group}
                </div>
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeView === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveView(item.id as ActiveNavView)}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition ${
                          isActive
                            ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200/80 dark:border-sky-800/50'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5">
                          <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400 dark:text-slate-500'}`} />
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          <span className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                            isActive
                              ? 'bg-sky-200/60 dark:bg-sky-900/60 text-sky-800 dark:text-sky-200'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Sidebar Footer */}
          <div className="p-3 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40">
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span className="font-mono-code text-[10px]">CG-AG OS v1.2.0</span>
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Operational
              </span>
            </div>
          </div>
        </aside>

        {/* Main View Area */}
        <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-[#080c14] p-4 lg:p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
