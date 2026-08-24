import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  ShieldCheck, LayoutDashboard, Scale, Bot, AlertTriangle, 
  Terminal, Sparkles, RefreshCw, Layers, Lock, UserCheck, Eye 
} from 'lucide-react';

import { Navbar } from './components/Navbar';
import { HeroScanner } from './components/HeroScanner';
import { ExecutiveSummary } from './components/ExecutiveSummary';
import { RegulationsGrid } from './components/RegulationsGrid';
import { AgentInventory } from './components/AgentInventory';
import { ViolationsList } from './components/ViolationsList';
import { CodePlayground } from './components/CodePlayground';
import { ReportExportModal } from './components/ReportExportModal';
import { SettingsModal } from './components/SettingsModal';
import { PersonaViews } from './components/PersonaViews';
import { AcademyModal } from './components/AcademyModal';

import { fetchGitHubRepo } from './services/github-fetcher';
import { readZipFile, readFolderFiles } from './services/zip-reader';
import { runLocalScan } from './services/scanner-bridge';
import { DEMO_PROJECTS, DemoProject } from './services/demo-projects';
import type { ScannerResult } from '../core/types';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'scanner' | 'playground'>('scanner');
  const [viewSection, setViewSection] = useState<'overview' | 'personas' | 'regulations' | 'agents' | 'violations'>('overview');
  const [selectedPersona, setSelectedPersona] = useState<'ciso' | 'dpo' | 'cio' | 'board' | 'cfo'>('ciso');
  
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState({ message: '', percent: 0 });
  const [scanResult, setScanResult] = useState<ScannerResult | null>(null);
  
  const [showSettings, setShowSettings] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showAcademy, setShowAcademy] = useState(false);

  // Auto-load demo on first launch to show immediate value
  useEffect(() => {
    handleSelectDemo(DEMO_PROJECTS[0]);
  }, []);

  const triggerConfetti = () => {
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#06b6d4', '#3b82f6', '#10b981', '#8b5cf6'],
    });
  };

  const handleScanGitHub = async (url: string) => {
    setIsScanning(true);
    setScanProgress({ message: 'Conectando ao GitHub...', percent: 5 });

    try {
      const gitToken = localStorage.getItem('github_token') || undefined;
      const repoDetails = await fetchGitHubRepo(url, (msg, pct) => {
        setScanProgress({ message: msg, percent: pct });
      }, gitToken);

      setScanProgress({ message: 'Executando motor de análise de 13 regulações...', percent: 90 });
      const result = await runLocalScan(repoDetails.files, {
        repoName: `${repoDetails.owner}/${repoDetails.repo}`,
        repoUrl: url,
        defaultBranch: repoDetails.defaultBranch,
      });

      setScanResult(result);
      setScanProgress({ message: 'Pronto!', percent: 100 });
      triggerConfetti();
    } catch (e: any) {
      alert(`Erro no escaneamento: ${e.message}`);
    } finally {
      setIsScanning(false);
    }
  };

  const handleScanZip = async (file: File) => {
    setIsScanning(true);
    setScanProgress({ message: 'Lendo arquivo .ZIP...', percent: 10 });

    try {
      const zipData = await readZipFile(file, (msg, pct) => {
        setScanProgress({ message: msg, percent: pct });
      });

      setScanProgress({ message: 'Auditando conformidade...', percent: 90 });
      const result = await runLocalScan(zipData.files, {
        repoName: zipData.name,
      });

      setScanResult(result);
      setScanProgress({ message: 'Pronto!', percent: 100 });
      triggerConfetti();
    } catch (e: any) {
      alert(`Erro ao ler ZIP: ${e.message}`);
    } finally {
      setIsScanning(false);
    }
  };

  const handleScanFolder = async (fileList: FileList) => {
    setIsScanning(true);
    setScanProgress({ message: 'Carregando arquivos da pasta...', percent: 15 });

    try {
      const folderData = await readFolderFiles(fileList, (msg, pct) => {
        setScanProgress({ message: msg, percent: pct });
      });

      setScanProgress({ message: 'Auditando conformidade...', percent: 90 });
      const result = await runLocalScan(folderData.files, {
        repoName: folderData.name,
      });

      setScanResult(result);
      setScanProgress({ message: 'Pronto!', percent: 100 });
      triggerConfetti();
    } catch (e: any) {
      alert(`Erro ao ler pasta: ${e.message}`);
    } finally {
      setIsScanning(false);
    }
  };

  const handleSelectDemo = async (demo: DemoProject) => {
    setIsScanning(true);
    setScanProgress({ message: `Carregando projeto de demonstração: ${demo.name}...`, percent: 30 });

    try {
      const files = new Map<string, string>();
      for (const [path, content] of Object.entries(demo.files)) {
        files.set(path, content);
      }

      setScanProgress({ message: 'Executando auditoria...', percent: 80 });
      const result = await runLocalScan(files, {
        repoName: demo.name,
      });

      setScanResult(result);
      setScanProgress({ message: 'Pronto!', percent: 100 });
    } catch (e: any) {
      alert(`Erro ao carregar demo: ${e.message}`);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] text-slate-900 selection:bg-slate-800 selection:text-white">
      
      {/* Navbar */}
      <Navbar
        onOpenSettings={() => setShowSettings(true)}
        onOpenExport={() => setShowExport(true)}
        onOpenAcademy={() => setShowAcademy(true)}
        activeTab={activeTab}
        setActiveTab={(t) => setActiveTab(t as any)}
        hasScanResult={Boolean(scanResult)}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {activeTab === 'scanner' ? (
          <div>
            {/* Top Hero & Scanner Input */}
            <HeroScanner
              onScanGitHub={handleScanGitHub}
              onScanZip={handleScanZip}
              onScanFolder={handleScanFolder}
              onSelectDemo={handleSelectDemo}
              isScanning={isScanning}
              scanProgress={scanProgress}
            />

            {/* Scanned Results View */}
            {scanResult && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 animate-in fade-in duration-300">
                
                {/* Result Section Tabs */}
                <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-4 gap-3">
                  <div className="flex items-center space-x-2.5">
                    <span className="text-xs text-slate-500 font-mono">Repositório:</span>
                    <span className="text-sm font-bold text-slate-900 font-mono">{scanResult.repo?.name}</span>
                    <span className="px-2.5 py-0.5 text-[11px] bg-slate-100 border border-slate-200 text-slate-700 rounded-md font-mono">
                      {scanResult.repo?.fileCount} arquivos analisados
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
                    <button
                      onClick={() => setViewSection('overview')}
                      className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center space-x-2 cursor-pointer ${
                        viewSection === 'overview'
                          ? 'bg-white text-slate-900 border border-slate-200 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
                      }`}
                    >
                      <LayoutDashboard className="w-3.5 h-3.5 text-slate-600" />
                      <span>Visão Geral</span>
                    </button>

                    {/* Persona Views Tab */}
                    <button
                      onClick={() => setViewSection('personas')}
                      className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center space-x-2 cursor-pointer ${
                        viewSection === 'personas'
                          ? 'bg-white text-slate-900 border border-slate-200 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
                      }`}
                    >
                      <UserCheck className="w-3.5 h-3.5 text-slate-700" />
                      <span>Lentes Executivas C-Level</span>
                    </button>

                    <button
                      onClick={() => setViewSection('regulations')}
                      className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center space-x-2 cursor-pointer ${
                        viewSection === 'regulations'
                          ? 'bg-white text-slate-900 border border-slate-200 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
                      }`}
                    >
                      <Scale className="w-3.5 h-3.5 text-slate-600" />
                      <span>13 Regulações</span>
                    </button>

                    <button
                      onClick={() => setViewSection('agents')}
                      className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center space-x-2 cursor-pointer ${
                        viewSection === 'agents'
                          ? 'bg-white text-slate-900 border border-slate-200 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
                      }`}
                    >
                      <Bot className="w-3.5 h-3.5 text-slate-600" />
                      <span>Agentes & Shadow AI</span>
                    </button>

                    <button
                      onClick={() => setViewSection('violations')}
                      className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center space-x-2 cursor-pointer ${
                        viewSection === 'violations'
                          ? 'bg-white text-slate-900 border border-slate-200 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
                      }`}
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      <span>Violações ({scanResult.violations?.length || 0})</span>
                    </button>
                  </div>
                </div>

                {/* Sub-Views */}
                {viewSection === 'overview' && (
                  <div className="space-y-8">
                    <ExecutiveSummary result={scanResult} />
                    
                    {/* Persona Toggle embedded in overview */}
                    <PersonaViews
                      result={scanResult}
                      selectedPersona={selectedPersona}
                      onSelectPersona={(p) => setSelectedPersona(p)}
                      onOpenExport={() => setShowExport(true)}
                    />
                  </div>
                )}

                {viewSection === 'personas' && (
                  <PersonaViews
                    result={scanResult}
                    selectedPersona={selectedPersona}
                    onSelectPersona={(p) => setSelectedPersona(p)}
                    onOpenExport={() => setShowExport(true)}
                  />
                )}

                {viewSection === 'regulations' && (
                  <RegulationsGrid result={scanResult} />
                )}

                {viewSection === 'agents' && (
                  <AgentInventory result={scanResult} />
                )}

                {viewSection === 'violations' && (
                  <ViolationsList result={scanResult} />
                )}

              </div>
            )}
          </div>
        ) : (
          <CodePlayground />
        )}
      </main>

      {/* Modals */}
      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}

      {showExport && scanResult && (
        <ReportExportModal result={scanResult} onClose={() => setShowExport(false)} />
      )}

      {showAcademy && (
        <AcademyModal onClose={() => setShowAcademy(false)} />
      )}

      {/* Footer */}
      <footer className="border-t border-surface-border py-6 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            ComplyPRO.pt • Scanner de Governança, Riscos & Conformidade de IA
          </span>
          <div className="flex items-center space-x-4 text-slate-400">
            <span>Visão CISO</span>
            <span>•</span>
            <span>Visão DPO</span>
            <span>•</span>
            <span>EU AI Act & LGPD</span>
            <span>•</span>
            <span>Motor de Privacidade Client-Side</span>
          </div>
        </div>
      </footer>

    </div>
  );
};
