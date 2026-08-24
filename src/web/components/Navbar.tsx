import React from 'react';
import { ShieldCheck, Sparkles, Settings, FileText, Github, Terminal, Zap } from 'lucide-react';
import { Logo } from './Logo';
import { getSelectedModel, AVAILABLE_MODELS } from '../services/siliconflow';

interface NavbarProps {
  onOpenSettings: () => void;
  onOpenExport?: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  hasScanResult: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenSettings,
  onOpenExport,
  activeTab,
  setActiveTab,
  hasScanResult,
}) => {
  const currentModelId = getSelectedModel();
  const currentModel = AVAILABLE_MODELS.find(m => m.id === currentModelId) || AVAILABLE_MODELS[0];

  return (
    <header className="sticky top-0 z-40 border-b border-surface-border bg-[#090d16]/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div 
          onClick={() => setActiveTab('scanner')} 
          className="cursor-pointer"
        >
          <Logo size="md" showTagline={true} />
        </div>

        {/* Center Tabs */}
        <nav className="hidden md:flex items-center space-x-1 bg-surface/80 p-1 rounded-xl border border-surface-border">
          <button
            onClick={() => setActiveTab('scanner')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center space-x-1.5 ${
              activeTab === 'scanner'
                ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Auditoria & Scanner</span>
          </button>

          <button
            onClick={() => setActiveTab('playground')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center space-x-1.5 ${
              activeTab === 'playground'
                ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Code Playground</span>
          </button>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center space-x-3">
          {/* AI Engine Status Badge */}
          <div className="hidden sm:flex items-center space-x-2 px-2.5 py-1 rounded-lg bg-[#0e1424] border border-cyan-500/30 text-xs text-slate-300 shadow-sm">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-semibold text-[11px] text-cyan-300">ComplyPRO AI Engine</span>
          </div>

          {/* Export Report button (if scan exists) */}
          {hasScanResult && (
            <button
              onClick={onOpenExport}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 hover:bg-emerald-900/60 transition-colors flex items-center space-x-1.5 shadow-sm"
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Exportar Relatório</span>
            </button>
          )}

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-surface border border-transparent hover:border-surface-border transition-all"
            title="Configurações & Chaves de API"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* GitHub Repo */}
          <a
            href="https://github.com/negraodenio/CompliancePRO"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-surface border border-transparent hover:border-surface-border transition-all"
            title="Código no GitHub"
          >
            <Github className="w-4 h-4" />
          </a>
        </div>
      </div>
    </header>
  );
};
