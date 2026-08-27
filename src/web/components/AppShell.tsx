import React, { useState, useEffect } from 'react';
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
  Activity, 
  Zap, 
  FolderCheck, 
  BookOpen, 
  FileDown, Crosshair, Award, 
  Terminal, 
  Share2, 
  ChevronDown, 
  Sun, 
  Moon, 
  Building2,
  LockKeyhole,
  CheckCircle2
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useIndustry, INDUSTRY_PROFILES } from '../context/IndustryContext';
import { DecisionStore } from '../services/decision-store';
import { HitlStore } from '../services/hitl-store';
import { RemediationStore } from '../services/remediation-store';
import { IncidentStore } from '../services/incident-store';

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
  const [pendingDecisionsCount, setPendingDecisionsCount] = useState(3);
  const [pendingHitlCount, setPendingHitlCount] = useState(2);
  const [pendingRemedCount, setPendingRemedCount] = useState(1);
  const [activeIncidentsCount, setActiveIncidentsCount] = useState(2);

  const refreshBadges = () => {
    const findings = DecisionStore.getFindings();
    setPendingDecisionsCount(findings.filter(f => f.status === 'PENDING_DECISION').length);

    const gates = HitlStore.getGates();
    setPendingHitlCount(gates.filter(g => g.status === 'PENDING_REVIEW').length);

    const actions = RemediationStore.getActions();
    setPendingRemedCount(actions.filter(a => a.status === 'PENDING_VERIFICATION').length);

    const incidents = IncidentStore.getIncidents();
    setActiveIncidentsCount(incidents.filter(i => i.containmentStatus === 'CONTAINED' || i.containmentStatus === 'RECOVERY_PENDING').length);
  };

  useEffect(() => {
    refreshBadges();
    const unsub1 = DecisionStore.subscribe(refreshBadges);
    const unsub2 = HitlStore.subscribe(refreshBadges);
    const unsub3 = RemediationStore.subscribe(refreshBadges);
    const unsub4 = IncidentStore.subscribe(refreshBadges);
    return () => {
      unsub1();
      unsub2();
      unsub3();
      unsub4();
    };
  }, []);

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
        { id: 'govern-risk', label: 'Risk Engine', icon: AlertTriangle, badge: pendingDecisionsCount > 0 ? `${pendingDecisionsCount} Pending` : null },
        { id: 'govern-policies', label: 'Policy Engine', icon: FileText, badge: null },
        { id: 'govern-compliance', label: 'Compliance Frameworks', icon: Scale, badge: 'AI Act' }
      ]
    },
    {
      group: 'OPERATE',
      items: [
        { id: 'operate-decisions', label: 'Decisions Pipeline', icon: Scale, badge: null },
        { id: 'operate-approvals', label: 'HITL Approvals', icon: LockKeyhole, badge: pendingHitlCount > 0 ? `${pendingHitlCount} Pending` : null },
        { id: 'operate-actions', label: 'Remediation Actions', icon: CheckCircle2, badge: pendingRemedCount > 0 ? `${pendingRemedCount} Verify` : null },
        { id: 'operate-incidents', label: 'Incidents & Failsafe', icon: Zap, badge: activeIncidentsCount > 0 ? `${activeIncidentsCount} Contained` : null },
        { id: 'operate-runtime', label: 'Runtime FinOps', icon: Activity, badge: null }
      ]
    },
    {
      group: 'ASSURE',
      items: [
        { id: 'assure-evidence', label: 'Protected Evidence', icon: FolderCheck, badge: 'Secured' },
        { id: 'assure-audit', label: 'Audit Ledger', icon: BookOpen, badge: null },
        { id: 'assure-reports', label: 'Regulatory Dossiers', icon: FileDown, Crosshair, Award, badge: 'RIPD' }
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
    <div className="min-h-screen flex flex-col bg-slate-100 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 transition-colors duration-150">
      {/* Top Application Bar */}
      <header className="h-14 border-b border-slate-200 dark:border-slate-800/90 bg-white dark:bg-[#0f172a] px-4 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        {/* Left: Brand & Workspace */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2.5 cursor-pointer" onClick={() => setActiveView('overview-center')}>
            <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center shadow-xs">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                CG-AG <span className="font-normal text-xs text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 px-1.5 py-0.5 rounded border border-sky-200 dark:border-sky-800/50">Governance OS</span>
              </span>
            </div>
          </div>

          <div className="h-4 w-px bg-slate-200 dark:border-slate-800" />

          {/* Workspace & Industry Selector */}
          <div className="relative">
            <button 
              onClick={() => setIsIndustryMenuOpen(!isIndustryMenuOpen)}
              className="flex items-center space-x-2 text-xs bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 transition"
            >
              <Building2 className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span className="font-semibold text-slate-800 dark:text-slate-200">{activeProfile.sampleOrg}</span>
              <span className="text-slate-300 dark:text-slate-600">|</span>
              <span className="text-sky-600 dark:text-sky-400 font-medium">{activeProfile.icon} {activeProfile.name}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isIndustryMenuOpen && (
              <div className="absolute left-0 mt-1.5 w-84 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-2 z-50">
                <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
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
                      className={`w-full text-left px-3 py-2.5 text-xs flex items-start space-x-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition ${
                        activeProfile.id === p.id ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300' : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span className="text-lg">{p.icon}</span>
                      <div className="flex-1">
                        <div className="font-semibold flex items-center justify-between">
                          <span>{p.name}</span>
                          {activeProfile.id === p.id && <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400">ACTIVE</span>}
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
          <div className="hidden sm:flex items-center space-x-1 bg-slate-100 dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px]">
            {(['Production', 'Staging', 'Sandbox'] as const).map((env) => (
              <button
                key={env}
                onClick={() => setEnvironment(env)}
                className={`px-2.5 py-0.5 rounded font-medium transition ${
                  environment === env 
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-semibold' 
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {env}
              </button>
            ))}
          </div>

          <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/70 text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-[11px]">Evidence Integrity Active</span>
          </div>

          <button 
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            className="p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <div className="flex items-center space-x-2 pl-2 border-l border-slate-200 dark:border-slate-800">
            <div className="w-7 h-7 rounded-full bg-slate-800 text-sky-400 border border-slate-700 flex items-center justify-center font-bold text-xs">
              RA
            </div>
            <div className="hidden lg:block text-left">
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight">Roberto Silva</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">CISO & Accountable Lead</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Control Plane Sidebar */}
        <aside className="w-60 border-r border-slate-200 dark:border-slate-800/90 bg-white dark:bg-[#0f172a] flex flex-col justify-between overflow-y-auto shrink-0 select-none">
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
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                          isActive
                            ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-semibold border border-sky-200/80 dark:border-sky-800/50'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5">
                          <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400 dark:text-slate-500'}`} />
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
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

          <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span className="font-mono-code text-[10px]">CG-AG OS v1.2.0</span>
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Operational
              </span>
            </div>
          </div>
        </aside>

        {/* Main View Area */}
        <main className="flex-1 overflow-y-auto bg-slate-100/70 dark:bg-[#0b0f19] p-4 lg:p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
