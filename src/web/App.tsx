import { FunnelAnalytics } from './services/funnel-analytics';
import { AcademyView } from './views/AcademyView';
import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { IndustryProvider } from './context/IndustryContext';
import { RoleLensProvider } from './context/RoleLensContext';
import { AppShell, ActiveNavView } from './components/AppShell';
import { GovernanceCenter } from './views/GovernanceCenter';
import { AiInventoryView } from './views/AiInventoryView';
import { AgentsTeamsView } from './views/AgentsTeamsView';
import { AssessmentsView } from './views/AssessmentsView';
import { ControlsMatrixView } from './views/ControlsMatrixView';
import { RiskEngineView } from './views/RiskEngineView';
import { PolicyEngineView } from './views/PolicyEngineView';
import { ComplianceFrameworksView } from './views/ComplianceFrameworksView';
import { DecisionsPipelineView } from './views/DecisionsPipelineView';
import { HitlApprovalsView } from './views/HitlApprovalsView';
import { RemediationActionsView } from './views/RemediationActionsView';
import { IncidentsFailsafeView } from './views/IncidentsFailsafeView';
import { RuntimeFinOpsView } from './views/RuntimeFinOpsView';
import { ProtectedEvidenceView } from './views/ProtectedEvidenceView';
import { AuditLedgerView } from './views/AuditLedgerView';
import { RegulatoryDossiersView } from './views/RegulatoryDossiersView';
import { GovernanceSimulatorView } from './views/GovernanceSimulatorView';
import { OperationsCenterView } from './views/OperationsCenterView';
import { ProductionDeploymentView } from './views/ProductionDeploymentView';
import { SystemReadinessView } from './views/SystemReadinessView';
import { TeamManagementView } from './views/TeamManagementView';
import { HeroScanner } from './components/HeroScanner';
import { AgentInventory } from './components/AgentInventory';
import { RegulationsGrid } from './components/RegulationsGrid';
import { PersonaViews } from './components/PersonaViews';
import { ViolationsList } from './components/ViolationsList';
import { CodePlayground } from './components/CodePlayground';
import { ExecutiveSummary } from './components/ExecutiveSummary';
import { ReportExportModal } from './components/ReportExportModal';
import { SettingsModal } from './components/SettingsModal';
import { AcademyModal } from './components/AcademyModal';
import { CommercialLandingView } from './views/CommercialLandingView';
import { AuthModal } from './components/AuthModal';

import { fetchGitHubRepo } from './services/github-fetcher';
import { readZipFile, readFolderFiles } from './services/zip-reader';
import { runLocalScan } from './services/scanner-bridge';
import { ScanGovernanceBridge } from './services/scan-governance-bridge';
import { sanitizeScanForWorkspacePromotion, assertValidAuthenticatedTenant } from './services/scan-security-boundary';
import { DEMO_PROJECTS, DemoProject } from './services/demo-projects';
import type { ScannerResult } from '../core/types';
import { Lock, Sparkles, Terminal, FileBadge, CheckSquare, Layers, CheckCircle2, Bot, ShieldCheck } from 'lucide-react';

interface AuthSessionGuardProps {
  pageMode: 'landing' | 'app';
  onForceLanding: () => void;
  children: React.ReactNode;
}

const AuthSessionGuard: React.FC<AuthSessionGuardProps> = ({
  pageMode,
  onForceLanding,
  children
}) => {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    // If user is in app mode and authentication is lost (e.g. logout or token expired), immediately return to landing
    if (pageMode === 'app' && !isAuthenticated && !isLoading) {
      onForceLanding();
    }
  }, [pageMode, isAuthenticated, isLoading, onForceLanding]);

  return <>{children}</>;
};

const AppInner: React.FC = () => {
  const { isAuthenticated, activeOrganization, user } = useAuth();
  const [pageMode, setPageMode] = useState<'landing' | 'app'>('landing');
  const [activeView, setActiveView] = useState<ActiveNavView>('overview-center');
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup' | null>(null);
  const [authContextBanner, setAuthContextBanner] = useState<{ title: string; description: string } | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState({ message: '', percent: 0 });
  const [scanResult, setScanResult] = useState<ScannerResult | null>(null);

  const [showSettings, setShowSettings] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showAcademy, setShowAcademy] = useState(false);

  useEffect(() => {
    if (DEMO_PROJECTS && DEMO_PROJECTS.length > 0 && !scanResult) {
      handleSelectDemo(DEMO_PROJECTS[0]);
    }
  }, []);

  // Settings nav item opens the existing SettingsModal overlay
  // (SettingsModal is an overlay, not a dedicated page view)
  useEffect(() => {
    if (pageMode === 'app' && activeView === 'settings') {
      setShowSettings(true);
      setActiveView('overview-center');
    }
  }, [activeView, pageMode]);

  const triggerConfetti = () => {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#0284c7', '#10b981', '#6366f1'],
    });
  };

  const handleScanGitHub = async (url: string) => {
    setIsScanning(true);
    FunnelAnalytics.track('SCAN_STARTED', { inputType: 'github' });
    setScanProgress({ message: 'Connecting to GitHub repository...', percent: 10 });
    try {
      const gitToken = localStorage.getItem('github_token') || undefined;
      const repoDetails = await fetchGitHubRepo(url, (msg, pct) => {
        setScanProgress({ message: msg, percent: pct });
      }, gitToken);

      setScanProgress({ message: 'Running AST analysis across 12 CG-AG controls...', percent: 85 });
      const result = await runLocalScan(repoDetails.files, {
        repoName: `${repoDetails.owner}/${repoDetails.repo}`,
        repoUrl: url,
        defaultBranch: repoDetails.defaultBranch,
      });

      setScanResult(result);
      ScanGovernanceBridge.ingestScan(result);
      FunnelAnalytics.track('SCAN_COMPLETED', { 
        inputType: 'github', 
        fileCount: repoDetails.files.size, 
        agentCount: result.source?.agents?.length || 0 
      });
      setScanProgress({ message: 'Scan Complete!', percent: 100 });
      triggerConfetti();
      if (pageMode === 'app') {
        setActiveView('overview-center');
      }
    } catch (err: any) {
      alert(`GitHub Scan Error: ${err.message}`);
    } finally {
      setIsScanning(false);
    }
  };

  const handleScanZip = async (file: File) => {
    setIsScanning(true);
    setScanProgress({ message: 'Extracting ZIP archive...', percent: 20 });
    try {
      const files = await readZipFile(file, (msg, pct) => {
        setScanProgress({ message: msg, percent: pct });
      });

      setScanProgress({ message: 'Executing CG-AG Governance Engine...', percent: 85 });
      const result = await runLocalScan(files.files, {
        repoName: file.name.replace(/\.zip$/i, ''),
      });

      setScanResult(result);
      ScanGovernanceBridge.ingestScan(result);
      setScanProgress({ message: 'Scan Complete!', percent: 100 });
      triggerConfetti();
      if (pageMode === 'app') {
        setActiveView('overview-center');
      }
    } catch (err: any) {
      alert(`ZIP Scan Error: ${err.message}`);
    } finally {
      setIsScanning(false);
    }
  };

  const handleScanFolder = async (fileList: FileList) => {
    setIsScanning(true);
    setScanProgress({ message: 'Reading directory files...', percent: 20 });
    try {
      const files = await readFolderFiles(fileList, (msg, pct) => {
        setScanProgress({ message: msg, percent: pct });
      });

      const folderName = fileList[0]?.webkitRelativePath.split('/')[0] || 'Local Project';
      setScanProgress({ message: 'Executing CG-AG Governance Engine...', percent: 85 });
      const result = await runLocalScan(files.files, { repoName: folderName });

      setScanResult(result);
      ScanGovernanceBridge.ingestScan(result);
      setScanProgress({ message: 'Scan Complete!', percent: 100 });
      triggerConfetti();
      if (pageMode === 'app') {
        setActiveView('overview-center');
      }
    } catch (err: any) {
      alert(`Folder Scan Error: ${err.message}`);
    } finally {
      setIsScanning(false);
    }
  };

  const handleSelectDemo = async (demo: DemoProject) => {
    setIsScanning(true);
    setScanProgress({ message: `Loading ${demo.name}...`, percent: 40 });
    try {
      const fileMap = new Map(Object.entries(demo.files));
      const result = await runLocalScan(fileMap, {
        repoName: demo.name,
      });
      setScanResult(result);
      ScanGovernanceBridge.ingestScan(result);
      setScanProgress({ message: 'Loaded!', percent: 100 });
      triggerConfetti();
      if (pageMode === 'app') {
        setActiveView('overview-center');
      }
    } catch (err: any) {
      console.error('Demo load error:', err);
    } finally {
      setIsScanning(false);
    }
  };

  const handleGovernFindings = () => {
    if (isAuthenticated) {
      if (scanResult) {
        try {
          const tenantId = assertValidAuthenticatedTenant(activeOrganization?.id || user?.id);
          const sanitized = sanitizeScanForWorkspacePromotion(scanResult);
          ScanGovernanceBridge.ingestScan(sanitized as any, { tenantId, workspaceId: tenantId });
        } catch (err) {
          console.warn('[GOVERNANCE_PROMOTION_WARNING]', err);
        }
      }
      setPageMode('app');
      setActiveView('overview-center');
    } else {
      setAuthContextBanner({
        title: 'Preserve Seus Resultados no Workspace',
        description: 'Crie seu workspace ComplyPRO para explorar o inventário de IA, passaportes e trilhas de auditoria gerados neste scan. Seus metadados de governança serão protegidos com segurança na sua organização.'
      });
      setAuthModalMode('signup');
    }
  };

  const handleEnterApp = () => {
    if (isAuthenticated) {
      if (scanResult) {
        try {
          const tenantId = assertValidAuthenticatedTenant(activeOrganization?.id || user?.id);
          const sanitized = sanitizeScanForWorkspacePromotion(scanResult);
          ScanGovernanceBridge.ingestScan(sanitized as any, { tenantId, workspaceId: tenantId });
        } catch (err) {
          console.warn('[GOVERNANCE_PROMOTION_WARNING]', err);
        }
      }
      setPageMode('app');
      setActiveView('overview-center');
    } else {
      setAuthContextBanner({
        title: 'Acesso ao Workspace ComplyPRO',
        description: 'Entre na sua conta para explorar a plataforma de governança de IA.'
      });
      setAuthModalMode('login');
    }
  };

  const handleAuthSuccess = () => {
    if (scanResult) {
      try {
        const tenantId = assertValidAuthenticatedTenant(activeOrganization?.id || user?.id);
        const sanitized = sanitizeScanForWorkspacePromotion(scanResult);
        ScanGovernanceBridge.ingestScan(sanitized as any, { tenantId, workspaceId: tenantId });
      } catch (err) {
        console.warn('[AUTH_PROMOTION_WARNING]', err);
      }
    }
    setAuthContextBanner(null);
    setPageMode('app');
    setActiveView('overview-center');
  };

  const handleOpenAuth = (mode: 'login' | 'signup' = 'signup') => {
    setAuthContextBanner(null);
    setAuthModalMode(mode);
  };

  const totalAgentsCount = scanResult?.source?.agents?.length || 27;
  const criticalGapsCount = scanResult?.violations?.filter(v => (v.severity as any) === 'critical' || (v.severity as any) === 'high').length || 3;

  return (
    <RoleLensProvider onNavigate={(view) => setActiveView(view)}>
      <AuthSessionGuard
        pageMode={pageMode}
        onForceLanding={() => {
          setPageMode('landing');
          setActiveView('overview-center');
        }}
      >
        {pageMode === 'landing' ? (
          <>
            <CommercialLandingView
              onScanGitHub={handleScanGitHub}
              onScanZip={handleScanZip}
              onScanFolder={handleScanFolder}
              onSelectDemo={handleSelectDemo}
              isScanning={isScanning}
              scanProgress={scanProgress}
              scanResult={scanResult}
              onResetScan={() => setScanResult(null)}
              onOpenAuth={handleOpenAuth}
              onEnterApp={handleEnterApp}
              onGovernFindings={handleGovernFindings}
            />

            {authModalMode && (
              <AuthModal
                isOpen={Boolean(authModalMode)}
                onClose={() => {
                  setAuthModalMode(null);
                  setAuthContextBanner(null);
                }}
                onSuccess={handleAuthSuccess}
                initialTab={authModalMode}
                contextBanner={authContextBanner || undefined}
              />
            )}
          </>
        ) : (
          <AppShell
            activeView={activeView}
            setActiveView={setActiveView}
            totalAgentsCount={totalAgentsCount}
            criticalGapsCount={criticalGapsCount}
            onNavigateToLanding={() => {
              setPageMode('landing');
              setActiveView('overview-center');
            }}
          >
                {activeView === 'overview-center' && (
                  <GovernanceCenter 
                    onNavigateToScanner={() => setActiveView('tools-scanner')}
                    onNavigateToPassports={() => setActiveView('discover-agents')}
                    onNavigateToControls={() => setActiveView('govern-controls')}
                    onNavigateToInventory={() => setActiveView('discover-inventory')}
                    onNavigateToAgents={() => setActiveView('discover-agents')}
                  />
                )}

                {activeView === 'discover-inventory' && (
                  <AiInventoryView 
                    result={scanResult}
                    onOpenScanner={() => setActiveView('tools-scanner')}
                  />
                )}

                {activeView === 'discover-agents' && (
                  <AgentsTeamsView 
                    result={scanResult}
                  />
                )}

                {activeView === 'discover-assessments' && (
                  <AssessmentsView 
                    result={scanResult}
                  />
                )}

                {activeView === 'discover-passports' && (
                  <AgentsTeamsView 
                    result={scanResult}
                  />
                )}

                {activeView === 'learn-academy' && <AcademyView onNavigate={(view) => setActiveView(view)} />}
                {activeView === 'tools-operations' && <OperationsCenterView />}
                {activeView === 'tools-deployment' && <ProductionDeploymentView />}
                {activeView === 'tools-scanner' && (
                  <div className="space-y-6">
                    {/* Header Banner */}
                    <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-sky-950/40 to-slate-900 border border-slate-800 text-white shadow-xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
                      <div className="relative z-10 space-y-2">
                        <div className="flex items-center space-x-2">
                          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold tracking-wider uppercase bg-sky-500/20 text-sky-300 border border-sky-500/30">
                            SENSOR & INGESTION SUITE
                          </span>
                        </div>
                        <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                          <Terminal className="w-6 h-6 text-sky-400" />
                          <span>Codebase AST Scanner & Capability Detector</span>
                        </h1>
                        <p className="text-xs text-slate-300 max-w-2xl">
                          Execute deep static analysis on TypeScript, Python, notebooks, and configuration files to extract AI agents, models, credentials, shadow AI, and compliance violations.
                        </p>
                      </div>
                    </div>

                    <HeroScanner 
                      onScanGitHub={handleScanGitHub}
                      onScanZip={handleScanZip}
                      onScanFolder={handleScanFolder}
                      onSelectDemo={handleSelectDemo}
                      isScanning={isScanning}
                      scanProgress={scanProgress}
                    />

                    {scanResult && (
                      <div className="space-y-6 animate-fadeIn">
                        <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs">
                          <div className="flex items-center space-x-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            <span className="font-semibold">
                              Scan of <strong>{scanResult.repo?.name || 'Local Repository'}</strong> successfully mapped into Governance Domain Stores.
                            </span>
                          </div>
                          <button
                            onClick={() => setActiveView('overview-center')}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition shadow-xs"
                          >
                            Open Governance Center →
                          </button>
                        </div>
                        <ExecutiveSummary result={scanResult} />
                        <ViolationsList result={scanResult} />
                      </div>
                    )}
                  </div>
                )}

                {activeView === 'govern-controls' && (
                  <ControlsMatrixView 
                    result={scanResult} 
                  />
                )}

                {activeView === 'govern-risk' && (
                  <RiskEngineView 
                    result={scanResult}
                  />
                )}

                {activeView === 'govern-policies' && (
                  <PolicyEngineView 
                    result={scanResult}
                  />
                )}

                {activeView === 'govern-compliance' && (
                  <ComplianceFrameworksView 
                    result={scanResult}
                  />
                )}

                {activeView === 'operate-decisions' && (
                  <DecisionsPipelineView 
                    result={scanResult}
                  />
                )}

                {activeView === 'operate-approvals' && (
                  <HitlApprovalsView 
                    result={scanResult}
                  />
                )}

                {activeView === 'operate-actions' && (
                  <RemediationActionsView 
                    result={scanResult}
                  />
                )}

                {activeView === 'operate-incidents' && (
                  <IncidentsFailsafeView 
                    result={scanResult}
                  />
                )}

                {activeView === 'operate-runtime' && (
                  <RuntimeFinOpsView 
                    result={scanResult}
                  />
                )}

                {activeView === 'assure-evidence' && (
                  <ProtectedEvidenceView 
                    result={scanResult}
                  />
                )}

                {activeView === 'assure-audit' && (
                  <AuditLedgerView 
                    result={scanResult}
                  />
                )}

                {activeView === 'assure-reports' && (
                  <RegulatoryDossiersView 
                    result={scanResult}
                  />
                )}

                {activeView === 'assure-simulator' && (
                  <GovernanceSimulatorView />
                )}

                {activeView === 'assure-readiness' && (
                  <SystemReadinessView />
                )}

                {activeView === 'manage-team' && (
                  <TeamManagementView />
                )}

                {/* Universal MCP — Informational Status View */}
                {activeView === 'tools-integrations' && (
                  <div className="space-y-5">
                    <div className="pb-3 border-b border-slate-200 dark:border-slate-800">
                      <div className="flex items-center space-x-2 text-xs font-semibold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
                        <span>Platform & System</span>
                        <span>·</span>
                        <span>Model Context Protocol</span>
                      </div>
                      <h1 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">Universal MCP Server</h1>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        CG-AG Control Plane exposes a fully operational MCP server for AI agent integration via Stdio (local IDEs) and SSE (remote hosts).
                      </p>
                    </div>

                    {/* Server Identity */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {[{ label: 'Tools', value: '14', desc: 'Semantic governance tools', color: 'sky' },
                        { label: 'Resources', value: '7', desc: 'Live data resources (controls, policies, ledger)', color: 'indigo' },
                        { label: 'Prompts', value: '4', desc: 'Guided prompts (Executive, CISO, DPO, Vendor)', color: 'violet' }
                      ].map(item => (
                        <div key={item.label} className="p-4 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800">
                          <div className={`text-2xl font-black text-${item.color}-600 dark:text-${item.color}-400`}>{item.value}</div>
                          <div className="font-bold text-slate-800 dark:text-slate-200 text-sm mt-0.5">{item.label}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">{item.desc}</div>
                        </div>
                      ))}
                    </div>

                    {/* Transport Configuration */}
                    <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
                      <div className="font-bold text-slate-800 dark:text-slate-200">Transport Configuration</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded">STDIO</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">Local IDE Integration</span>
                          </div>
                          <p className="text-[11px] text-slate-500 leading-relaxed">
                            Connect from Cursor, Claude Desktop, VS Code Copilot or any MCP-compatible IDE.
                          </p>
                          <pre className="bg-slate-900 text-slate-300 rounded p-2.5 text-[10px] font-mono overflow-x-auto">{`npx tsx src/mcp/server.ts`}</pre>
                        </div>
                        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 rounded">SSE</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">Remote / HTTP Integration</span>
                          </div>
                          <p className="text-[11px] text-slate-500 leading-relaxed">
                            Streamable HTTP/SSE transport for remote agents and multi-tenant access with Bearer token auth.
                          </p>
                          <pre className="bg-slate-900 text-slate-300 rounded p-2.5 text-[10px] font-mono overflow-x-auto">{`TRANSPORT_MODE=sse npx tsx src/mcp/server.ts`}</pre>
                        </div>
                      </div>
                    </div>

                    {/* Tool Categories */}
                    <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3">
                      <div className="font-bold text-slate-800 dark:text-slate-200">Tool Categories (14 Canonical Tools)</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {[
                          { cat: 'Discovery', tools: ['scan_repository', 'get_scan_summary', 'discover_agents', 'discover_capabilities'] },
                          { cat: 'Governance', tools: ['get_governance_score', 'list_controls', 'get_control_detail', 'get_policy'] },
                          { cat: 'Evidence & Decisions', tools: ['get_evidence_ledger', 'list_findings', 'record_decision'] },
                          { cat: 'Operations', tools: ['get_hitl_gates', 'get_remediation_actions', 'get_incidents'] }
                        ].map(({ cat, tools: tl }) => (
                          <div key={cat} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                            <div className="font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{cat}</div>
                            {tl.map(t => (
                              <div key={t} className="font-mono text-[10px] text-slate-500 py-0.5">{t}</div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-[11px] text-amber-800 dark:text-amber-200">
                      <strong>Production note:</strong> The MCP server runs as a Node.js process (Stdio or SSE). It is not embedded in the browser frontend.
                      Remote SSE deployment requires a dedicated server host. See <code className="font-mono">docs/MCP_SETUP.md</code> for full integration instructions.
                    </div>
                  </div>
                )}

                {!['overview-center', 'discover-inventory', 'discover-agents', 'discover-passports', 'discover-assessments', 'govern-risk', 'govern-policies', 'govern-compliance', 'operate-decisions', 'operate-approvals', 'operate-actions', 'tools-scanner', 'govern-controls', 'assure-simulator', 'assure-reports', 'assure-audit', 'assure-evidence', 'operate-runtime', 'operate-incidents', 'manage-team', 'learn-academy', 'tools-operations', 'tools-deployment', 'assure-readiness', 'tools-integrations', 'settings'].includes(activeView) && (
                  <div className="p-12 text-center bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 elevation-card space-y-4">
                    <div className="w-12 h-12 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center mx-auto">
                      <Lock className="w-6 h-6" />
                    </div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white capitalize">
                      {activeView.replace('-', ' → ')}
                    </h2>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      This Control Plane operational workspace is part of the CG-AG Enterprise SaaS roadmap.
                    </p>
                    <button
                      onClick={() => setActiveView('overview-center')}
                      className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-md text-xs font-medium transition"
                    >
                      Back to Governance Center
                    </button>
                  </div>
                )}

                {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
                {showExport && scanResult && <ReportExportModal result={scanResult} onClose={() => setShowExport(false)} />}
                {showAcademy && <AcademyModal onClose={() => setShowAcademy(false)} />}
              </AppShell>
            )}
          </AuthSessionGuard>
        </RoleLensProvider>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <IndustryProvider>
          <AppInner />
        </IndustryProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
