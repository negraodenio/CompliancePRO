import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { ThemeProvider } from './context/ThemeContext';
import { IndustryProvider } from './context/IndustryContext';
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

import { fetchGitHubRepo } from './services/github-fetcher';
import { readZipFile, readFolderFiles } from './services/zip-reader';
import { runLocalScan } from './services/scanner-bridge';
import { ScanGovernanceBridge } from './services/scan-governance-bridge';
import { DEMO_PROJECTS, DemoProject } from './services/demo-projects';
import type { ScannerResult } from '../core/types';
import { Lock, Sparkles, Terminal, FileBadge, CheckSquare, Layers, CheckCircle2, Bot, ShieldCheck } from 'lucide-react';

export const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ActiveNavView>('overview-center');
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState({ message: '', percent: 0 });
  const [scanResult, setScanResult] = useState<ScannerResult | null>(null);

  const [showSettings, setShowSettings] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showAcademy, setShowAcademy] = useState(false);

  useEffect(() => {
    if (DEMO_PROJECTS && DEMO_PROJECTS.length > 0) {
      handleSelectDemo(DEMO_PROJECTS[0]);
    }
  }, []);

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
      setScanProgress({ message: 'Scan Complete!', percent: 100 });
      triggerConfetti();
      setActiveView('overview-center');
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
      setActiveView('overview-center');
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
      setActiveView('overview-center');
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
    } catch (err: any) {
      console.error('Demo load error:', err);
    } finally {
      setIsScanning(false);
    }
  };

  const totalAgentsCount = scanResult?.source?.agents?.length || 27;
  const criticalGapsCount = scanResult?.violations?.filter(v => (v.severity as any) === 'critical' || (v.severity as any) === 'high').length || 3;

  return (
    <ThemeProvider>
      <IndustryProvider>
        <AppShell 
          activeView={activeView} 
          setActiveView={setActiveView}
          totalAgentsCount={totalAgentsCount}
          criticalGapsCount={criticalGapsCount}
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

                    {activeView === 'tools-operations' && <OperationsCenterView />}
                    {activeView === 'tools-deployment' && <ProductionDeploymentView />}
          {activeView === 'tools-scanner' && (
            <div className="space-y-6">
              <div className="pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center space-x-2 text-xs font-semibold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
                  <span>Tools & Ingestion Sensors</span>
                </div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                  Codebase & Repository AST Scanner
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Ingest local codebases, GitHub repositories, or ZIP archives to detect agents, tools, Shadow AI, and feed findings into the Governance Control Plane.
                </p>
              </div>

              <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 p-6 elevation-card">
                <HeroScanner 
                  onScanGitHub={handleScanGitHub}
                  onScanZip={handleScanZip}
                  onScanFolder={handleScanFolder}
                  onSelectDemo={handleSelectDemo}
                  isScanning={isScanning}
                  scanProgress={scanProgress}
                />
              </div>

              {scanResult && (
                <div className="space-y-6 animate-fadeIn">
                  {/* Ingestion Telemetry Card */}
                  <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border border-indigo-500/30 shadow-xl space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-800/50 pb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h2 className="text-sm font-bold tracking-tight text-white">
                              Ingestão AST Concluída & Sincronizada com o Governance OS
                            </h2>
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              LIVE INGESTION
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 mt-0.5">
                            Repositório: <span className="font-mono text-indigo-300 font-semibold">{scanResult.repo?.fullName || scanResult.repo?.name || 'Local Scan'}</span> ({scanResult.repo?.fileCount || 0} arquivos analisados)
                          </p>
                        </div>
                      </div>

                      {/* Quick Navigation Action Buttons */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => setActiveView('discover-agents')}
                          className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center space-x-1.5 shadow-sm"
                        >
                          <Bot className="w-3.5 h-3.5" />
                          <span>Ver Agentes & SIPOC ({scanResult.source?.agents?.length || 0}) ➔</span>
                        </button>
                        <button
                          onClick={() => setActiveView('operate-decisions')}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition border border-slate-700 flex items-center space-x-1.5"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                          <span>Decisões & Riscos ➔</span>
                        </button>
                        <button
                          onClick={() => setActiveView('assure-evidence')}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition border border-slate-700 flex items-center space-x-1.5"
                        >
                          <Lock className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Evidência RFC 8785 ➔</span>
                        </button>
                      </div>
                    </div>

                    {/* Sensor Ingestion Metric Badges */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Agentes & Passports</span>
                        <span className="text-base font-bold text-indigo-300">{scanResult.source?.agents?.length || 0} detectados</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">Roteados para Agents & Teams</span>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Achados & Riscos</span>
                        <span className="text-base font-bold text-amber-300">{(scanResult.risks?.length || 0) + (scanResult.violations?.length || 0)} achados</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">Roteados para Decisions Store</span>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Modelos & Shadow AI</span>
                        <span className="text-base font-bold text-sky-300">{(scanResult.source?.aiModels?.length || 0)} modelos</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">{scanResult.shadowAI?.length || 0} Shadow LLM</span>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Conformidade Global</span>
                        <span className="text-base font-bold text-emerald-300">{scanResult.compliance?.overallScore || 0}% score</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">13 regulações avaliadas</span>
                      </div>
                    </div>
                  </div>

                  {/* Clean Code Violations & AST Findings Sensor Output */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                        <Terminal className="w-4 h-4 text-sky-500" />
                        <span>Diagnóstico de Código AST & Regras de Conformidade</span>
                      </div>
                      <span className="text-xs text-slate-500">
                        {(scanResult.violations?.length || 0) + (scanResult.risks?.length || 0)} violações identificadas no repositório
                      </span>
                    </div>
                    <ViolationsList result={scanResult} />
                  </div>
                </div>
              )}
            </div>
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

          {activeView === 'assure-audit' && (
            <AuditLedgerView 
              result={scanResult}
            />
          )}

          {activeView === 'assure-evidence' && (
            <ProtectedEvidenceView 
              result={scanResult}
            />
          )}

          {activeView === 'operate-runtime' && (
            <RuntimeFinOpsView 
              result={scanResult}
            />
          )}

          {activeView === 'operate-incidents' && (
            <IncidentsFailsafeView 
              result={scanResult}
            />
          )}

          {activeView === 'operate-actions' && (
            <RemediationActionsView 
              result={scanResult}
            />
          )}

          {activeView === 'operate-approvals' && (
            <HitlApprovalsView 
              result={scanResult}
            />
          )}

          {activeView === 'operate-decisions' && (
            <DecisionsPipelineView 
              result={scanResult}
            />
          )}

          {activeView === 'govern-compliance' && (
            <ComplianceFrameworksView 
              result={scanResult}
            />
          )}

          {activeView === 'govern-policies' && (
            <PolicyEngineView 
              result={scanResult}
            />
          )}

          {activeView === 'govern-risk' && (
            <RiskEngineView 
              result={scanResult}
            />
          )}

          {activeView === 'govern-controls' && (
            <ControlsMatrixView result={scanResult} />
          )}

          {!['overview-center', 'discover-inventory', 'discover-agents', 'discover-passports', 'discover-assessments', 'govern-risk', 'govern-policies', 'govern-compliance', 'operate-decisions', 'operate-approvals', 'operate-actions', 'tools-scanner', 'govern-controls', 'assure-simulator', 'assure-reports', 'assure-audit', 'assure-evidence', 'operate-runtime', 'operate-incidents'].includes(activeView) && (
            <div className="p-12 text-center bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-slate-800 elevation-card space-y-4">
              <div className="w-12 h-12 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center mx-auto">
                <Lock className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white capitalize">
                {activeView.replace('-', ' · ')}
              </h2>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                This Control Plane operational workspace is part of the CG-AG Enterprise SaaS roadmap. 
                Use the <strong>Governance Center</strong>, <strong>AI Inventory</strong>, or <strong>Agents & Teams</strong> to manage current active policies.
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
      </IndustryProvider>
    </ThemeProvider>
  );
};

export default App;
