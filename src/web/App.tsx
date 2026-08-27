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
                  <ExecutiveSummary result={scanResult} />
                  <AgentInventory result={scanResult} />
                  <ViolationsList result={scanResult} />
                </div>
              )}
            </div>
          )}

          {activeView === 'govern-risk' && (
            <RiskEngineView 
              result={scanResult}
            />
          )}

          {activeView === 'govern-controls' && (
            <ControlsMatrixView result={scanResult} />
          )}

          {!['overview-center', 'discover-inventory', 'discover-agents', 'discover-passports', 'discover-assessments', 'govern-risk', 'tools-scanner', 'govern-controls'].includes(activeView) && (
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
