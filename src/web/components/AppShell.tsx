import React, { useState, useEffect } from 'react';
import { 
  Check,
  GraduationCap, 
  Shield,
  Globe, 
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
  FileDown, 
  Crosshair, 
  Award, 
  Terminal, 
  Share2, 
  ChevronDown, 
  ChevronRight,
  AlertCircle,
  Sun, 
  Moon, 
  Building2,
  LockKeyhole,
  CheckCircle2,
  UserCheck,
  Eye,
  Sparkles,
  Lock,
  Users,
  LogOut,
  LogIn,
  UserPlus
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useIndustry, INDUSTRY_PROFILES } from '../context/IndustryContext';
import { useRoleLens, ROLE_LENSES, RoleLensDefinition } from '../context/RoleLensContext';
import { useAuth } from '../context/AuthContext';
import { DecisionStore } from '../services/decision-store';
import { HitlStore } from '../services/hitl-store';
import { RemediationStore } from '../services/remediation-store';
import { IncidentStore } from '../services/incident-store';
import { AuthModal } from './AuthModal';

export type ActiveNavView = 
  | 'ai-agents'
  | 'studio-builder'
  | 'cockpit-control'
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
  | 'assure-simulator'
  | 'assure-readiness'
  | 'tools-scanner'
  | 'tools-operations'
  | 'tools-deployment'
  | 'tools-integrations'
  | 'learn-academy'
  | 'manage-team'
  | 'settings';

interface AppShellProps {
  activeView: ActiveNavView;
  setActiveView: (view: ActiveNavView) => void;
  onNavigateToLanding?: () => void;
  children: React.ReactNode;
  totalAgentsCount?: number;
  criticalGapsCount?: number;
}

export const AppShell: React.FC<AppShellProps> = ({
  activeView,
  setActiveView,
  onNavigateToLanding,
  children,
  totalAgentsCount = 27,
  criticalGapsCount = 3
}) => {
  const { theme, toggleTheme } = useTheme();
  const { activeProfile, setActiveProfile, environment, setEnvironment } = useIndustry();
  const { activeLens, setRoleLensById, isLensPrioritized } = useRoleLens();
  const { 
    isAuthenticated, 
    user, 
    activeOrganization, 
    availableOrganizations, 
    switchOrganization, 
    logout, 
    enterpriseRole 
  } = useAuth();

  const [isIndustryMenuOpen, setIsIndustryMenuOpen] = useState(false);
  const [isLensMenuOpen, setIsLensMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'signup' | 'invite'>('login');

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

  // Simplified Enterprise Navigation: Canonical 4 Destinations
  const topLevelItems = [
    { id: 'ai-agents' as ActiveNavView, label: 'AI Agents', icon: Bot },
    { id: 'tools-scanner' as ActiveNavView, label: 'Discover', icon: Terminal },
    { id: 'assure-evidence' as ActiveNavView, label: 'Evidence', icon: LockKeyhole }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 transition-colors duration-150">
      
      {/* Top Application Bar */}
      <header className="h-14 border-b border-slate-200 dark:border-slate-800/90 bg-white dark:bg-[#0f172a] px-4 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        
        {/* Left: Brand & Title */}
        <div className="flex items-center space-x-3">
          <div 
            className="flex items-center space-x-2.5 cursor-pointer" 
            onClick={() => onNavigateToLanding ? onNavigateToLanding() : setActiveView('ai-agents')}
          >
            <div className="w-8 h-8 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center shadow-xs">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-white">ComplyPRO</span>
                <span className="text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.2 rounded border border-slate-200 dark:border-slate-700">Enterprise</span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">AI Agent Governance</p>
            </div>
          </div>
        </div>

        {/* Center & Right Controls: Role Lens, Industry Profile, Org & User Profile, Environment & Theme */}
        <div className="flex items-center space-x-2.5">
          
                    {/* Public Landing Page CTA */}
          {onNavigateToLanding && (
            <button
              onClick={onNavigateToLanding}
              className="hidden lg:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 hover:text-sky-500 text-xs font-semibold transition cursor-pointer"
              title="Voltar para a Landing Page pública comercial"
            >
              <Globe className="w-3.5 h-3.5 text-sky-400" />
              <span>Public Landing Page</span>
            </button>
          )}

          {/* 1. ROLE-BASED LENS (Discreet Secondary Utility) */}
          <div className="relative hidden xl:block">
            <button
              onClick={() => {
                setIsLensMenuOpen(!isLensMenuOpen);
                setIsIndustryMenuOpen(false);
                setIsUserMenuOpen(false);
              }}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs text-slate-600 dark:text-slate-400 transition cursor-pointer"
              title="Role Lens Perspective (Optional)"
            >
              <span className="text-xs">{activeLens.icon}</span>
              <span className="text-xs font-medium truncate max-w-[110px]">{activeLens.shortLabel}</span>
              <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
            </button>

            {isLensMenuOpen && (
              <div className="absolute right-0 mt-1.5 w-88 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl py-2 z-50 animate-fadeIn">
                <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800/70">
                  <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Role-Based Lenses • Perspectiva de Cargo
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Reorganiza a esteira de trabalho e prioriza os módulos mais relevantes para o seu papel.
                  </p>
                </div>

                <div className="max-h-84 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/50 p-1.5 space-y-1">
                  {ROLE_LENSES.map((lens) => (
                    <button
                      key={lens.id}
                      onClick={() => {
                        setRoleLensById(lens.id, true);
                        setIsLensMenuOpen(false);
                      }}
                      className={`w-full text-left p-2.5 rounded-xl text-xs flex items-start space-x-3 transition cursor-pointer ${
                        activeLens.id === lens.id
                          ? 'bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800/80'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <span className="text-xl shrink-0 mt-0.5">{lens.icon}</span>
                      <div className="flex-1 space-y-0.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 dark:text-white">{lens.name}</span>
                          {activeLens.id === lens.id && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-sky-500/20 text-sky-400 border border-sky-500/30">
                              ACTIVE
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                          {lens.tagline}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 2. INDUSTRY GOVERNANCE PROFILE (Discreet Secondary Utility) */}
          <div className="relative hidden xl:block">
            <button
              onClick={() => {
                setIsIndustryMenuOpen(!isIndustryMenuOpen);
                setIsLensMenuOpen(false);
                setIsUserMenuOpen(false);
              }}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs text-slate-600 dark:text-slate-400 transition cursor-pointer"
              title="Industry Governance Profile (Optional)"
            >
              <span className="text-xs">{activeProfile.icon}</span>
              <span className="text-xs font-medium truncate max-w-[110px]">{activeProfile.name}</span>
              <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
            </button>

            {isIndustryMenuOpen && (
              <div className="absolute right-0 mt-1.5 w-84 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-2 z-50">
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
                      className={`w-full text-left px-3 py-2.5 text-xs flex items-start space-x-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition cursor-pointer ${
                        activeProfile.id === p.id ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300' : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span className="text-lg">{p.icon}</span>
                      <div className="flex-1">
                        <div className="font-bold flex items-center justify-between">
                          <span>{p.name}</span>
                          {activeProfile.id === p.id && <span className="text-[10px] text-sky-600 font-mono">ACTIVE</span>}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">{p.sampleOrg}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 3. USER PROFILE & ORGANIZATION SWITCHER */}
          <div className="relative">
            {isAuthenticated && user ? (
              <button
                onClick={() => {
                  setIsUserMenuOpen(!isUserMenuOpen);
                  setIsLensMenuOpen(false);
                  setIsIndustryMenuOpen(false);
                }}
                className="flex items-center space-x-2 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white text-[11px] font-bold">
                  {user.fullName?.charAt(0) || 'U'}
                </div>
                <div className="hidden lg:flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[100px]">
                    {activeOrganization?.name || 'Workspace'}
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono">
                    {enterpriseRole}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>
            ) : (
              <button
                onClick={() => {
                  setAuthModalTab('login');
                  setIsAuthModalOpen(true);
                }}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}

            {isUserMenuOpen && isAuthenticated && user && (
              <div className="absolute right-0 mt-1.5 w-72 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl py-2 z-50 animate-fadeIn">
                <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">{user.fullName}</span>
                  <span className="text-[11px] text-slate-400 truncate block">{user.email}</span>
                  <div className="mt-1.5 flex items-center space-x-1.5">
                    <span className="px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-500 border border-sky-500/20 text-[10px] font-mono font-bold">
                      {enterpriseRole}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-mono font-bold">
                      {activeOrganization?.planTier?.toUpperCase() || 'FREE'}
                    </span>
                  </div>
                </div>

                {/* Organization Switcher */}
                {availableOrganizations.length > 1 && (
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 uppercase font-mono block mb-1">
                      Switch Organization
                    </span>
                    <div className="space-y-1">
                      {availableOrganizations.map((org) => (
                        <button
                          key={org.id}
                          onClick={() => {
                            switchOrganization(org.id);
                            setIsUserMenuOpen(false);
                          }}
                          className={`w-full text-left px-2 py-1.5 rounded-lg text-xs flex items-center justify-between transition cursor-pointer ${
                            activeOrganization?.id === org.id
                              ? 'bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400 font-bold'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <span className="truncate">{org.name}</span>
                          {activeOrganization?.id === org.id && <Check className="w-3.5 h-3.5 shrink-0" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="p-1 space-y-0.5">
                  <button
                    onClick={() => {
                      setActiveView('manage-team');
                      setIsUserMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-xl flex items-center space-x-2 transition cursor-pointer"
                  >
                    <Users className="w-4 h-4 text-slate-400" />
                    <span>Manage Team & Access</span>
                  </button>

                  <button
                    onClick={() => {
                      logout();
                      setIsUserMenuOpen(false);
                      onNavigateToLanding?.();
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl flex items-center space-x-2 transition cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 4. THEME TOGGLE */}
          <button 
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>
        </div>
      </header>

      {/* Main App Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Sidebar Navigation — Enterprise 4 Destinations */}
        <aside className="w-60 border-r border-slate-200 dark:border-slate-800/90 bg-white dark:bg-[#0f172a] flex flex-col justify-between shrink-0 select-none">
          <div className="p-3 space-y-1">
            {topLevelItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    isActive
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white dark:text-slate-950' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Academy & Settings - Visually Separated */}
          <div className="p-3 border-t border-slate-200/80 dark:border-slate-800/80 space-y-1">
            <button
              onClick={() => setActiveView('learn-academy')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeView === 'learn-academy'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <GraduationCap className={`w-4 h-4 shrink-0 ${activeView === 'learn-academy' ? 'text-white dark:text-slate-950' : 'text-slate-400'}`} />
              <span className="truncate">Academia</span>
            </button>
            <button
              onClick={() => setActiveView('settings')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeView === 'settings'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Lock className={`w-4 h-4 shrink-0 ${activeView === 'settings' ? 'text-white dark:text-slate-950' : 'text-slate-400'}`} />
              <span className="truncate">Settings</span>
            </button>
          </div>
        </aside>

        {/* Main View Area */}
        <main className="flex-1 overflow-y-auto bg-slate-100/70 dark:bg-[#0b0f19] p-4 lg:p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialTab={authModalTab}
      />

    </div>
  );
};
