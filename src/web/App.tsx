import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { ThemeProvider } from './context/ThemeContext';
import { IndustryProvider } from './context/IndustryContext';
import { AppShell, ActiveNavView } from './components/AppShell';
import { GovernanceCenter } from './views/GovernanceCenter';
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
import { DEMO_PROJECTS, DemoProject } from './services/demo-projects';
import type { ScannerResult } from '../core/types';
import { Lock, Sparkles, Terminal, FileBadge, CheckSquare, Layers } from 'lucide-react';

export const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ActiveNavView>('overview-center');
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState({ message: '', percent: 0 });
  const [scanResult, setScanResult] = useState<ScannerResult | null>(null);

  const [showSettings, setShowSettings] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showAcademy, setShowAcademy] = useState(false);

  // Auto-load demo on first launch to populate initial enterprise posture
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
              onNavigateToPassports={() => setActiveView('discover-passports')}
              onNavigateToControls={() => setActiveView('govern-controls')}
            />
          )}

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

              {/* In-Browser AST Scanner Tool */}
              <div className="bg-white dark:bg-[#0f172a] rounded-xl border border-slate-200 dark:border-slate-800 p-6 elevation-card">
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
                  <ExecutiveSummary result={scanResult} />
                  <AgentInventory result={scanResult} />
                  <ViolationsList result={scanResult} />
                </div>
              )}
            </div>
          )}

          {activeView === 'discover-passports' && (
            <div className="space-y-6">
              <div className="pb-3 border-b border-slate-200 dark:border-slate-800">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                  🪪 Cryptographically Verifiable Agent Passports
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Standardized, cryptographically signed governance identity records across the enterprise AI landscape.
                </p>
              </div>

              {/* Passports Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 bg-white dark:bg-[#0f172a] rounded-xl border border-slate-200 dark:border-slate-800 elevation-card space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                        🟡 CONDITIONAL APPROVAL
                      </span>
                      <h2 className="text-base font-bold text-slate-900 dark:text-white mt-2">Credit Risk Evaluator</h2>
                      <div className="font-mono-code text-xs text-slate-400">ID: CG-AG-CREWAI-CREDIT_AGENT-911E</div>
                    </div>
                    <div className="text-right text-xs font-mono-code text-emerald-500">SIG-HASH-911E</div>
                  </div>

                  <div className="space-y-2 text-xs divide-y divide-slate-100 dark:divide-slate-800 text-slate-600 dark:text-slate-300">
                    <div className="pt-2 flex justify-between">
                      <span className="text-slate-400">Accountable Owner:</span>
                      <span className="font-medium">Roberto Silva (Risk Lead)</span>
                    </div>
                    <div className="pt-2 flex justify-between">
                      <span className="text-slate-400">Autonomy Level:</span>
                      <span className="font-medium">L3 (Autonomous Bounded)</span>
                    </div>
                    <div className="pt-2 flex justify-between">
                      <span className="text-slate-400">Model & Framework:</span>
                      <span className="font-medium">CrewAI 0.1.x (gpt-4-turbo)</span>
                    </div>
                    <div className="pt-2 flex justify-between">
                      <span className="text-slate-400">PII Processing:</span>
                      <span className="text-amber-500 font-semibold">⚠️ Sim (LGPD Art. 38 RIPD)</span>
                    </div>
                    <div className="pt-2 flex justify-between">
                      <span className="text-slate-400">Circuit Breaker & Kill Switch:</span>
                      <span className="text-emerald-500 font-semibold">🟢 Pronto / Testado</span>
                    </div>
                  </div>
                </div>

                <div className="p-5 bg-white dark:bg-[#0f172a] rounded-xl border border-slate-200 dark:border-slate-800 elevation-card space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                        🟢 ACTIVE GOVERNED
                      </span>
                      <h2 className="text-base font-bold text-slate-900 dark:text-white mt-2">Customer Service Bot</h2>
                      <div className="font-mono-code text-xs text-slate-400">ID: CG-AG-LANGGRAPH-SUPPORT-49F1</div>
                    </div>
                    <div className="text-right text-xs font-mono-code text-emerald-500">SIG-HASH-49F1</div>
                  </div>

                  <div className="space-y-2 text-xs divide-y divide-slate-100 dark:divide-slate-800 text-slate-600 dark:text-slate-300">
                    <div className="pt-2 flex justify-between">
                      <span className="text-slate-400">Accountable Owner:</span>
                      <span className="font-medium">Juliana Lima (CX Operations)</span>
                    </div>
                    <div className="pt-2 flex justify-between">
                      <span className="text-slate-400">Autonomy Level:</span>
                      <span className="font-medium">L2 (Supervised HITL)</span>
                    </div>
                    <div className="pt-2 flex justify-between">
                      <span className="text-slate-400">Model & Framework:</span>
                      <span className="font-medium">LangGraph (gpt-3.5-turbo)</span>
                    </div>
                    <div className="pt-2 flex justify-between">
                      <span className="text-slate-400">PII Processing:</span>
                      <span className="text-emerald-500 font-semibold">✅ Anonimização Ativa</span>
                    </div>
                    <div className="pt-2 flex justify-between">
                      <span className="text-slate-400">Circuit Breaker & Kill Switch:</span>
                      <span className="text-emerald-500 font-semibold">🟢 Pronto / Testado</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeView === 'govern-controls' && scanResult && (
            <div className="space-y-6">
              <div className="pb-3 border-b border-slate-200 dark:border-slate-800">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                  📜 The 12 CG-AG Governance Controls
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Normative operational baseline for enterprise AI agent governance.
                </p>
              </div>

              {/* Regulations and 12 Controls view */}
              <RegulationsGrid result={scanResult} />
            </div>
          )}

          {/* Fallback for other planned views */}
          {!['overview-center', 'tools-scanner', 'discover-passports', 'govern-controls'].includes(activeView) && (
            <div className="p-12 text-center bg-white dark:bg-[#0f172a] rounded-xl border border-slate-200 dark:border-slate-800 elevation-card space-y-4">
              <div className="w-12 h-12 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center mx-auto">
                <Lock className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white capitalize">
                {activeView.replace('-', ' · ')}
              </h2>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                This Control Plane operational workspace is part of the CG-AG Enterprise SaaS roadmap. 
                Use the <strong>Governance Center</strong> or <strong>Scanner</strong> to manage current active policies.
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
