import React, { useState, useRef } from 'react';
import { 
  Search, FolderUp, FileArchive, ArrowRight, Shield, 
  Sparkles, Landmark, Stethoscope, MessageSquare, CheckCircle, 
  Scale, BarChart3, Lock, Github, Cloud, Terminal, Cpu,
  RefreshCw, CheckCircle2, AlertTriangle, Layers, Database
} from 'lucide-react';
import { DEMO_PROJECTS, DemoProject } from '../services/demo-projects';

interface HeroScannerProps {
  onScanGitHub: (url: string) => void;
  onScanZip: (file: File) => void;
  onScanFolder: (fileList: FileList) => void;
  onSelectDemo: (demo: DemoProject) => void;
  isScanning: boolean;
  scanProgress: { message: string; percent: number };
}

export const HeroScanner: React.FC<HeroScannerProps> = ({
  onScanGitHub,
  onScanZip,
  onScanFolder,
  onSelectDemo,
  isScanning,
  scanProgress,
}) => {
  const [activeTab, setActiveTab] = useState<'github' | 'zip' | 'folder' | 'demo'>('github');
  const [gitUrl, setGitUrl] = useState('https://github.com/negraodenio/CompliancePRO');
  const [isDragOver, setIsDragOver] = useState(false);
  const zipInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (gitUrl.trim()) {
      onScanGitHub(gitUrl.trim());
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.zip')) {
        onScanZip(file);
      } else {
        onScanFolder(e.dataTransfer.files);
      }
    }
  };

  return (
    <div className="space-y-4 animate-fadeIn">

      {/* Ingestion Workstation Card */}
      <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden elevation-card">
        
        {/* Ingestion Mode Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 p-1.5 gap-1.5 overflow-x-auto">
          <button
            onClick={() => setActiveTab('github')}
            disabled={isScanning}
            className={`flex-1 min-w-[130px] px-3.5 py-2 rounded-xl text-xs font-medium transition flex items-center justify-center space-x-2 cursor-pointer ${
              activeTab === 'github'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs border border-slate-200 dark:border-slate-700 font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800/40'
            }`}
          >
            <Github className="w-4 h-4" />
            <span>GitHub Repository</span>
          </button>

          <button
            onClick={() => setActiveTab('zip')}
            disabled={isScanning}
            className={`flex-1 min-w-[130px] px-3.5 py-2 rounded-xl text-xs font-medium transition flex items-center justify-center space-x-2 cursor-pointer ${
              activeTab === 'zip'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs border border-slate-200 dark:border-slate-700 font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800/40'
            }`}
          >
            <FileArchive className="w-4 h-4" />
            <span>ZIP Archive</span>
          </button>

          <button
            onClick={() => setActiveTab('folder')}
            disabled={isScanning}
            className={`flex-1 min-w-[130px] px-3.5 py-2 rounded-xl text-xs font-medium transition flex items-center justify-center space-x-2 cursor-pointer ${
              activeTab === 'folder'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs border border-slate-200 dark:border-slate-700 font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800/40'
            }`}
          >
            <FolderUp className="w-4 h-4" />
            <span>Local Directory</span>
          </button>

          <button
            onClick={() => setActiveTab('demo')}
            disabled={isScanning}
            className={`flex-1 min-w-[130px] px-3.5 py-2 rounded-xl text-xs font-medium transition flex items-center justify-center space-x-2 cursor-pointer ${
              activeTab === 'demo'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs border border-slate-200 dark:border-slate-700 font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800/40'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Demo Scenarios</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-5 sm:p-6 space-y-5">
          
          {/* TAB 1: GITHUB */}
          {activeTab === 'github' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold tracking-wider text-slate-700 dark:text-slate-300 uppercase font-mono">
                  Git Repository URL (Public or Private)
                </label>
                <div className="flex flex-col sm:flex-row items-center gap-2.5">
                  <div className="relative flex-1 w-full">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                      <Github className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={gitUrl}
                      onChange={(e) => setGitUrl(e.target.value)}
                      placeholder="https://github.com/org/ai-agent-project"
                      disabled={isScanning}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50/70 dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:bg-white dark:focus:bg-slate-950 focus:border-slate-400 dark:focus:border-slate-600 transition-all font-mono"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isScanning || !gitUrl.trim()}
                    className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 font-semibold text-xs rounded-xl transition flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0 shadow-xs"
                  >
                    {isScanning ? (
                      <>
                        <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                        <span>Scanning AST...</span>
                      </>
                    ) : (
                      <>
                        <span>Scan Repository</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Repositories are analyzed in memory. Models, frameworks, tools, and access boundaries are mapped automatically.
              </p>
            </form>
          )}

          {/* TAB 2: ZIP ARCHIVE */}
          {activeTab === 'zip' && (
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              className={`p-6 sm:p-8 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center text-center gap-3 ${
                isDragOver
                  ? 'border-slate-400 bg-slate-100/50 dark:bg-slate-900/50'
                  : 'border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950/50 hover:border-slate-400 dark:hover:border-slate-600'
              }`}
            >
              <input
                ref={zipInputRef}
                type="file"
                accept=".zip"
                className="hidden"
                disabled={isScanning}
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    onScanZip(e.target.files[0]);
                  }
                }}
              />
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
                <FileArchive className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Drag and drop your .ZIP archive here</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Or select a compressed archive containing your agent codebase
                </p>
              </div>
              <button
                type="button"
                onClick={() => zipInputRef.current?.click()}
                disabled={isScanning}
                className="mt-1 px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 rounded-lg text-xs font-semibold transition flex items-center space-x-2 shadow-xs cursor-pointer"
              >
                <FileArchive className="w-4 h-4" />
                <span>Select .ZIP File</span>
              </button>
            </div>
          )}

          {/* TAB 3: FOLDER */}
          {activeTab === 'folder' && (
            <div className="p-6 sm:p-8 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950/50 flex flex-col items-center justify-center text-center gap-3">
              <input
                ref={folderInputRef}
                type="file"
                // @ts-ignore
                webkitdirectory="true"
                directory=""
                className="hidden"
                disabled={isScanning}
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    onScanFolder(e.target.files);
                  }
                }}
              />
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
                <FolderUp className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Scan Local Project Directory</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Select a directory on your local machine. Processed entirely in memory.
                </p>
              </div>
              <button
                type="button"
                onClick={() => folderInputRef.current?.click()}
                disabled={isScanning}
                className="mt-1 px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 rounded-lg text-xs font-semibold transition flex items-center space-x-2 shadow-xs cursor-pointer"
              >
                <FolderUp className="w-4 h-4" />
                <span>Choose Local Directory</span>
              </button>
            </div>
          )}

          {/* TAB 4: DEMO SCENARIOS */}
          {activeTab === 'demo' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Select Pre-Configured Enterprise Scenario
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">1-Click Live Ingestion</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {/* Demo 1: FinTech */}
                <button
                  onClick={() => onSelectDemo(DEMO_PROJECTS[0])}
                  disabled={isScanning}
                  className="text-left p-4 rounded-xl bg-slate-50/70 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 hover:border-sky-500 dark:hover:border-sky-500 hover:shadow-lg transition-all group cursor-pointer flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2.5">
                      <div className="p-2 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 group-hover:bg-sky-500 group-hover:text-white transition-colors">
                        <Landmark className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                        FinTech Credit Scoring
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                      CrewAI + LangChain with automated credit decisions, scoring, and financial criticality.
                    </p>
                  </div>
                  <div>
                    <span className="inline-block px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 rounded-md">
                      HIGH RISK • FINANCIAL / EU AI ACT
                    </span>
                  </div>
                </button>

                {/* Demo 2: MedIA */}
                <button
                  onClick={() => onSelectDemo(DEMO_PROJECTS[1] || DEMO_PROJECTS[0])}
                  disabled={isScanning}
                  className="text-left p-4 rounded-xl bg-slate-50/70 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 hover:border-rose-500 dark:hover:border-rose-500 hover:shadow-lg transition-all group cursor-pointer flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2.5">
                      <div className="p-2 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 group-hover:bg-rose-500 group-hover:text-white transition-colors">
                        <Stethoscope className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                        MedIA Diagnostic Assistant
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                      Medical assistant with symptom analysis, sensitive clinical records, and automated triage.
                    </p>
                  </div>
                  <div>
                    <span className="inline-block px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-md">
                      HIGH RISK • HEALTHCARE / EU AI ACT
                    </span>
                  </div>
                </button>

                {/* Demo 3: SmartCommerce */}
                <button
                  onClick={() => onSelectDemo(DEMO_PROJECTS[2] || DEMO_PROJECTS[0])}
                  disabled={isScanning}
                  className="text-left p-4 rounded-xl bg-slate-50/70 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 hover:shadow-lg transition-all group cursor-pointer flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2.5">
                      <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        SmartCommerce Support
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                      Customer support agent with MCP tools, external API calls, and OWASP guardrails.
                    </p>
                  </div>
                  <div>
                    <span className="inline-block px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-md">
                      MODERATE RISK • OWASP LLM TOP 10
                    </span>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Real-time Progress Bar */}
          {isScanning && (
            <div className="p-4 bg-sky-50/80 dark:bg-sky-950/30 rounded-xl border border-sky-200 dark:border-sky-900/50 space-y-2.5 animate-fadeIn">
              <div className="flex items-center justify-between text-xs">
                <span className="text-sky-900 dark:text-sky-300 font-mono font-semibold flex items-center space-x-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-ping" />
                  <span>{scanProgress.message || 'Analyzing AST patterns and agent capability manifests...'}</span>
                </span>
                <span className="text-sky-700 dark:text-sky-400 font-mono font-bold">{scanProgress.percent}%</span>
              </div>
              <div className="w-full h-2 bg-sky-100 dark:bg-sky-950/80 rounded-full overflow-hidden border border-sky-200 dark:border-sky-800">
                <div 
                  className="h-full bg-gradient-to-r from-sky-500 via-indigo-500 to-emerald-500 transition-all duration-300 ease-out shadow-xs"
                  style={{ width: `${scanProgress.percent}%` }}
                />
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Feature Highlights Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
        
        <div className="p-4 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 elevation-card flex items-start space-x-3">
          <div className="p-2 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 shrink-0">
            <CheckCircle className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Audit Evidence</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Tamper-evident cryptographic ledger of agent actions and decisions.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 elevation-card flex items-start space-x-3">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shrink-0">
            <Scale className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Global Standards</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Direct alignment with EU AI Act, NIST AI RMF, and ISO/IEC 42001.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 elevation-card flex items-start space-x-3">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 shrink-0">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Audit Dossiers</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Pre-compiled compliance profiles, risk matrices, and evidence chains.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 elevation-card flex items-start space-x-3">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
            <Lock className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Zero Secret Leaks</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Air-gapped worker execution. Provider API keys are held out-of-band.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
};
