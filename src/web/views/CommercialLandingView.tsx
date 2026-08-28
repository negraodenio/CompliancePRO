import React, { useState, useRef } from 'react';
import { 
  Shield, 
  Sparkles, 
  ArrowRight, 
  Bot, 
  Cpu, 
  Layers, 
  Lock, 
  CheckCircle2, 
  AlertTriangle, 
  Database, 
  FileBadge, 
  Terminal, 
  Scale, 
  Building2, 
  Globe, 
  UserCheck, 
  Eye, 
  ChevronRight, 
  FolderUp, 
  FileArchive, 
  Github, 
  Play, 
  Zap, 
  CheckSquare, 
  KeyRound, 
  ShieldAlert, 
  FileText,
  Activity,
  Layers3,
  Flame,
  Award
} from 'lucide-react';
import { DEMO_PROJECTS, DemoProject } from '../services/demo-projects';
import { FreeScanSnapshotView } from '../components/FreeScanSnapshotView';
import type { ScannerResult } from '../../core/types';

interface CommercialLandingViewProps {
  onScanGitHub: (url: string) => void;
  onScanZip: (file: File) => void;
  onScanFolder: (files: FileList) => void;
  onSelectDemo: (demo: DemoProject) => void;
  isScanning: boolean;
  scanProgress: { message: string; percent: number };
  scanResult: ScannerResult | null;
  onResetScan: () => void;
  onOpenAuth: (mode?: 'login' | 'signup') => void;
  onEnterApp: () => void;
}

export const CommercialLandingView: React.FC<CommercialLandingViewProps> = ({
  onScanGitHub,
  onScanZip,
  onScanFolder,
  onSelectDemo,
  isScanning,
  scanProgress,
  scanResult,
  onResetScan,
  onOpenAuth,
  onEnterApp,
}) => {
  const [activeScanTab, setActiveScanTab] = useState<'demo' | 'github' | 'zip' | 'folder'>('demo');
  const [gitUrl, setGitUrl] = useState('https://github.com/negraodenio/CompliancePRO');
  const [isDragOver, setIsDragOver] = useState(false);
  const [activeTriadTab, setActiveTriadTab] = useState<'industry' | 'role' | 'capability'>('capability');

  const zipInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const scannerSectionRef = useRef<HTMLDivElement>(null);

  const scrollToScanner = () => {
    scannerSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleGitSubmit = (e: React.FormEvent) => {
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
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-sky-500 selection:text-white font-sans antialiased">
      
      {/* Background Decorative Gradients */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] bg-sky-500/10 rounded-full blur-[140px]" />
        <div className="absolute top-[40%] right-[-10%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-10%] left-[10%] w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[140px]" />
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-30" />
      </div>

      {/* Top Public Navigation Bar */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-cyan-400 p-0.5 shadow-lg shadow-sky-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Shield className="w-5 h-5 text-sky-400" />
              </div>
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
                <span>CG-AG</span>
                <span className="text-sky-400 font-light">Governance OS</span>
              </span>
              <span className="block text-[9px] font-mono text-slate-400 tracking-wider uppercase">
                AI Agent Control Plane
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-6 text-xs font-semibold text-slate-300">
            <a href="#discovery" className="hover:text-sky-400 transition">Capability Discovery</a>
            <a href="#triad" className="hover:text-sky-400 transition">Governance Triad</a>
            <a href="#controls" className="hover:text-sky-400 transition">12 Controls</a>
            <a href="#compliance" className="hover:text-sky-400 transition">Global Frameworks</a>
          </nav>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => onOpenAuth('login')}
              className="text-xs font-semibold text-slate-300 hover:text-white px-3 py-2 rounded-lg hover:bg-slate-900 transition"
            >
              Sign In
            </button>
            <button
              onClick={scrollToScanner}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-sky-500/25 flex items-center gap-1.5 transition transform hover:-translate-y-0.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Free AI Scan</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="relative z-10">
        
        {/* ========================================================================= */}
        {/* 1. CINEMATIC HERO SECTION */}
        {/* ========================================================================= */}
        <section className="pt-16 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center space-y-8">
          
          {/* Executive Pill Badge */}
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-sky-500/10 via-indigo-500/10 to-cyan-500/10 border border-sky-500/30 text-sky-300 text-xs font-mono font-semibold backdrop-blur-md animate-fadeIn">
            <Sparkles className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
            <span>CANONICAL AI GOVERNANCE OPERATING SYSTEM</span>
          </div>

          {/* Main Headline */}
          <div className="max-w-4xl mx-auto space-y-4">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1]">
              Discover What Your AI <br />
              <span className="bg-gradient-to-r from-sky-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">
                Can Actually Do.
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto font-normal leading-relaxed">
              Scan your repositories to uncover autonomous agents, LLM models, execution capabilities, identity bindings, permissions, shadow AI APIs, and regulatory exposure.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              onClick={scrollToScanner}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-sky-500 via-indigo-600 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 text-white font-extrabold text-sm sm:text-base shadow-2xl shadow-sky-500/30 flex items-center justify-center gap-2.5 transition transform hover:-translate-y-1 cursor-pointer"
            >
              <Sparkles className="w-5 h-5 text-sky-200" />
              <span>RUN FREE AI GOVERNANCE SCAN</span>
              <ArrowRight className="w-5 h-5" />
            </button>

            <button
              onClick={onEnterApp}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold text-sm sm:text-base shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>EXPLORE CG-AG GOVERNANCE OS</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          {/* Micro Assurance Signals */}
          <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-xs text-slate-400 font-mono">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>100% Real AST Extraction</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-sky-400" />
              <span>Zero Code Persisted / In-Memory</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Award className="w-4 h-4 text-indigo-400" />
              <span>13 Regulatory Frameworks</span>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 2. FREE SCAN INTERACTIVE CONSOLE / RESULTS SNAPSHOT */}
        {/* ========================================================================= */}
        <section ref={scannerSectionRef} id="scanner-console" className="py-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
          
          {scanResult ? (
            <FreeScanSnapshotView 
              result={scanResult}
              onGovernFindings={() => onOpenAuth('signup')}
              onExploreGovernanceOs={onEnterApp}
              onResetScan={onResetScan}
            />
          ) : (
            <div className="p-6 sm:p-10 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-xl space-y-6">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
                <div>
                  <span className="text-[10px] font-mono font-bold tracking-wider uppercase px-2.5 py-1 rounded-md bg-sky-500/10 text-sky-400 border border-sky-500/20">
                    REAL SENSOR ENGINE
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-white mt-1.5 flex items-center gap-2">
                    <span>Execute Free AI Governance Scan</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Select a pre-loaded enterprise AI project or upload your own repository to extract live capabilities.
                  </p>
                </div>

                {/* Input Method Tabs */}
                <div className="flex items-center p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold">
                  <button
                    onClick={() => setActiveScanTab('demo')}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      activeScanTab === 'demo' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Demo Repos
                  </button>
                  <button
                    onClick={() => setActiveScanTab('github')}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      activeScanTab === 'github' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    GitHub
                  </button>
                  <button
                    onClick={() => setActiveScanTab('zip')}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      activeScanTab === 'zip' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    ZIP Upload
                  </button>
                  <button
                    onClick={() => setActiveScanTab('folder')}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      activeScanTab === 'folder' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Folder
                  </button>
                </div>
              </div>

              {/* TAB 1: DEMO PROJECTS */}
              {activeScanTab === 'demo' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                    {DEMO_PROJECTS.map((demo) => (
                      <div
                        key={demo.id}
                        onClick={() => onSelectDemo(demo)}
                        className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-sky-500/50 hover:bg-slate-900/90 transition cursor-pointer space-y-3 group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                            {demo.category}
                          </span>
                          <Play className="w-4 h-4 text-slate-500 group-hover:text-sky-400 group-hover:scale-110 transition" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-sm font-bold text-white group-hover:text-sky-300 transition">
                            {demo.name}
                          </h4>
                          <p className="text-xs text-slate-400 line-clamp-2">
                            {demo.description}
                          </p>
                        </div>
                        <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-1 border-t border-slate-800/80">
                          <span>{Object.keys(demo.files).length} Source Files</span>
                          <span className="text-sky-400 font-semibold group-hover:underline">Scan Real Code →</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 2: GITHUB REPO */}
              {activeScanTab === 'github' && (
                <form onSubmit={handleGitSubmit} className="space-y-3">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <Github className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        value={gitUrl}
                        onChange={(e) => setGitUrl(e.target.value)}
                        placeholder="https://github.com/org/ai-agent-repo"
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-sky-500 font-mono"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isScanning}
                      className="px-6 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>{isScanning ? 'Analyzing AST...' : 'Scan GitHub Repo'}</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Works on any public repository with Python, TypeScript, LangChain, CrewAI, AutoGen, or OpenAI SDK.
                  </p>
                </form>
              )}

              {/* TAB 3: ZIP UPLOAD */}
              {activeScanTab === 'zip' && (
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => zipInputRef.current?.click()}
                  className={`p-10 rounded-2xl border-2 border-dashed text-center transition cursor-pointer space-y-3 ${
                    isDragOver ? 'border-sky-500 bg-sky-500/10' : 'border-slate-800 hover:border-slate-700 bg-slate-950/50'
                  }`}
                >
                  <input
                    ref={zipInputRef}
                    type="file"
                    accept=".zip"
                    onChange={(e) => e.target.files?.[0] && onScanZip(e.target.files[0])}
                    className="hidden"
                  />
                  <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-400 mx-auto flex items-center justify-center">
                    <FileArchive className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-white">Click to select ZIP or drag & drop</p>
                    <p className="text-xs text-slate-500 font-mono">Unpacked and parsed 100% in memory inside your browser</p>
                  </div>
                </div>
              )}

              {/* TAB 4: FOLDER UPLOAD */}
              {activeScanTab === 'folder' && (
                <div
                  onClick={() => folderInputRef.current?.click()}
                  className="p-10 rounded-2xl border-2 border-dashed border-slate-800 hover:border-slate-700 bg-slate-950/50 text-center transition cursor-pointer space-y-3"
                >
                  <input
                    ref={folderInputRef}
                    type="file"
                    {...({ webkitdirectory: '', directory: '' } as any)}
                    onChange={(e) => e.target.files && onScanFolder(e.target.files)}
                    className="hidden"
                  />
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 mx-auto flex items-center justify-center">
                    <FolderUp className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-white">Select local repository folder</p>
                    <p className="text-xs text-slate-500 font-mono">Processes source files (.py, .ts, .js, .json) directly in browser</p>
                  </div>
                </div>
              )}

              {/* Live Scanner Progress Bar */}
              {isScanning && (
                <div className="p-4 rounded-2xl bg-slate-950 border border-sky-500/30 space-y-2 animate-fadeIn">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-sky-400 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 animate-spin text-sky-400" />
                      <span>{scanProgress.message || 'Extracting AST & capabilities...'}</span>
                    </span>
                    <span className="text-white font-bold">{scanProgress.percent}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 transition-all duration-300"
                      style={{ width: `${scanProgress.percent}%` }}
                    />
                  </div>
                </div>
              )}

            </div>
          )}

        </section>

        {/* ========================================================================= */}
        {/* 3. THE AUTONOMOUS AI REALITY CRISIS (THE CORE MESSAGE) */}
        {/* ========================================================================= */}
        <section id="discovery" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
          
          <div className="max-w-3xl mx-auto text-center space-y-3">
            <span className="text-xs font-mono font-bold tracking-widest text-sky-400 uppercase">
              THE CORE PROBLEM
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              The Illusion of AI Autonomy
            </h2>
            <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
              Knowing the agent's name or prompt is not compliance. In autonomous architectures, agents can execute arbitrary database queries, invoke cloud storage, call shell commands, and exfiltrate records without formal authorization.
            </p>
          </div>

          {/* Contrast Cards: Illusion vs Reality */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                <AlertTriangle className="w-5 h-5" />
                <span>The Traditional Surface (Questionnaires)</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-400 space-y-2">
                <p className="text-slate-300 font-bold">Agent: "CreditUnderwriterAgent"</p>
                <p>Prompt: "You are a helpful assistant for loan reviews."</p>
                <p>Status: "Declared safe by product manager"</p>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Relies on self-declarations and static documentation. Completely blind to what the code actually does at runtime.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-gradient-to-br from-sky-950/40 via-slate-900 to-indigo-950/40 border border-sky-500/40 space-y-4">
              <div className="flex items-center gap-2 text-sky-400 font-bold text-sm">
                <Sparkles className="w-5 h-5" />
                <span>The CG-AG Technical Reality (AST Discovery)</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950 border border-sky-500/30 font-mono text-xs text-slate-300 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-sky-300 font-bold">Agent → PostgreSQL → customer_invoices</span>
                  <span className="text-rose-400 font-bold">UNKNOWN_AUTHORIZATION</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-sky-300 font-bold">Action: DELETE FROM records</span>
                  <span className="text-amber-400 font-bold">⚠️ DESTRUCTIVE (NO HITL)</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-sky-300 font-bold">Identity: unassigned</span>
                  <span className="text-rose-400 font-bold">ROLE: UNKNOWN</span>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Dissects the canonical chain: <strong className="text-white">Agent → Identity → Role → System → Resource → Action → Authorization</strong>.
              </p>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 4. THE GOVERNANCE TRIAD (INDUSTRY + ROLE + CAPABILITY) */}
        {/* ========================================================================= */}
        <section id="triad" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
          
          <div className="max-w-3xl mx-auto text-center space-y-3">
            <span className="text-xs font-mono font-bold tracking-widest text-indigo-400 uppercase">
              THE TRIAD ARCHITECTURE
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              Three Dimensions of Enterprise Oversight
            </h2>
            <p className="text-sm sm:text-base text-slate-400">
              Governance without friction: technical ground truth contextualized for your industry and filtered for each executive persona.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Dimension 1: Industry Lens */}
            <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-sky-500/40 transition space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
                <Building2 className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  DIMENSION 1
                </span>
                <h3 className="text-lg font-bold text-white">Industry Governance Lens</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Contextualizes risks for your sector: <strong>Financial Services</strong> (DORA, BCB 4.893), <strong>Healthcare</strong> (HIPAA, ANVISA), <strong>Energy</strong> (NIS2), and <strong>Enterprise SaaS</strong> (SOC 2, OWASP).
                </p>
              </div>
            </div>

            {/* Dimension 2: Role Lens */}
            <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/40 transition space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <UserCheck className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  DIMENSION 2
                </span>
                <h3 className="text-lg font-bold text-white">Role-Based Lenses</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  8 dedicated personas: <strong>CISO</strong> (Vulnerabilities & IAM), <strong>DPO</strong> (PII & RIPD), <strong>AI Office</strong> (Inventory & ROI), <strong>Auditor</strong> (Immutable Evidence), and <strong>Board</strong> (Executive Readiness).
                </p>
              </div>
            </div>

            {/* Dimension 3: Capability Boundaries */}
            <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 transition space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                <Layers className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  DIMENSION 3
                </span>
                <h3 className="text-lg font-bold text-white">Capability Boundaries & SIPOC</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Integrates business value (Supplier → Input → Process → Output → Customer) with rigorous technical permission boundaries and cryptographic AI Passports.
                </p>
              </div>
            </div>

          </div>
        </section>

        {/* ========================================================================= */}
        {/* 5. THE 12 CANONICAL CG-AG CONTROLS */}
        {/* ========================================================================= */}
        <section id="controls" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
          
          <div className="max-w-3xl mx-auto text-center space-y-3">
            <span className="text-xs font-mono font-bold tracking-widest text-sky-400 uppercase">
              CANONICAL CONTROL PLANE
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              The 12 Canonical CG-AG Controls
            </h2>
            <p className="text-sm sm:text-base text-slate-400">
              An exhaustive normative framework spanning the entire lifecycle of autonomous AI agents.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { id: 'CG-AG-01', title: 'Asset Registry & Identity', desc: 'Every agent has a verified digital Passport and accountable owner.' },
              { id: 'CG-AG-02', title: 'Tool & Boundary Constraints', desc: 'Least privilege enforcement across databases, S3, APIs, and tools.' },
              { id: 'CG-AG-03', title: 'Human-in-the-Loop Gates', desc: 'Mandatory human approval checkpoints for destructive or high-risk actions.' },
              { id: 'CG-AG-04', title: 'Finite Autonomy Bounds', desc: 'Execution loop circuit breakers and instantaneous kill switches.' },
              { id: 'CG-AG-05', title: 'Prompt & Guardrail Defense', desc: 'Real-time defense against prompt injection, jailbreaks, and toxic output.' },
              { id: 'CG-AG-06', title: 'Data Minimization & Privacy', desc: 'De-identification and strict PII hygiene across context windows.' },
              { id: 'CG-AG-07', title: 'Cryptographic Audit Ledger', desc: 'RFC 8785 canonical JSON sealed with SHA-256 chained blocks.' },
              { id: 'CG-AG-08', title: 'Model Evaluation & Drift', desc: 'Continuous evaluation of hallucination, benchmark drift, and safety.' },
              { id: 'CG-AG-09', title: 'Runtime FinOps & Spend', desc: 'Token usage velocity limits, cost quotas, and budget throttling.' },
              { id: 'CG-AG-10', title: 'Incident Response & Rollback', desc: 'Fail-safe containment and automated rollback protocols.' },
              { id: 'CG-AG-11', title: 'Multi-Tenant Isolation', desc: 'Strict database and memory tenant isolation via Row Level Security.' },
              { id: 'CG-AG-12', title: 'Continuous Verification', desc: 'Zero-trust verification of agent permissions on every deployment.' },
            ].map((ctrl) => (
              <div key={ctrl.id} className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition space-y-2">
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  {ctrl.id}
                </span>
                <h4 className="text-sm font-bold text-white">{ctrl.title}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{ctrl.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 6. GLOBAL COMPLIANCE & CRYPTOGRAPHIC EVIDENCE */}
        {/* ========================================================================= */}
        <section id="compliance" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
          
          <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-sky-950/40 border border-slate-800 space-y-8">
            <div className="max-w-3xl space-y-3">
              <span className="text-xs font-mono font-bold tracking-widest text-emerald-400 uppercase">
                ENTERPRISE ASSURANCE
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                Built for Regulators, Auditors & Boardrooms
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Generate auditable regulatory dossiers, automated RIPD (DPIA) compliance reports, and cryptographically verified evidence packages ready for external inspection.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { name: 'EU AI Act', scope: 'Annex III & Art. 60' },
                { name: 'ISO/IEC 42001', scope: 'AI Management SGA' },
                { name: 'NIST AI RMF', scope: 'Govern & Map' },
                { name: 'LGPD Art. 38', scope: 'Automated RIPD/DPIA' },
                { name: 'DORA (EU)', scope: 'ICT Resilience' },
                { name: 'BCB Res. 4893', scope: 'Banking Cyber' },
              ].map((fw, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-center space-y-1">
                  <p className="text-xs font-bold text-white">{fw.name}</p>
                  <p className="text-[10px] text-slate-400 font-mono">{fw.scope}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 7. FINAL CONVERSION BANNER */}
        {/* ========================================================================= */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="p-10 sm:p-16 rounded-3xl bg-gradient-to-r from-sky-950 via-indigo-950 to-slate-950 border-2 border-sky-500/40 text-center space-y-6 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="max-w-3xl mx-auto space-y-3 relative z-10">
              <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
                Ready to Govern Your Enterprise AI Fleet?
              </h2>
              <p className="text-sm sm:text-base text-slate-300">
                Run a free scan now or create an organization to unlock immutable ledger auditability, role-based lenses, and automatic RIPD dossiers.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10 pt-2">
              <button
                onClick={scrollToScanner}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-extrabold text-sm shadow-xl shadow-sky-500/25 flex items-center justify-center gap-2 cursor-pointer transition transform hover:-translate-y-0.5"
              >
                <Sparkles className="w-4 h-4" />
                <span>Run Free AI Scan</span>
              </button>

              <button
                onClick={() => onOpenAuth('signup')}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-white border border-slate-700 font-bold text-sm transition cursor-pointer"
              >
                Create Free Workspace
              </button>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-10 px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-400 font-bold">
            <Shield className="w-4 h-4 text-sky-400" />
            <span>CG-AG Governance OS</span>
            <span className="text-slate-600 font-normal">| Commercial AI Agent Control Plane</span>
          </div>
          <p>© 2026 CG-AG Governance OS. All rights reserved. Zero code storage. Air-Gapped Ready.</p>
        </div>
      </footer>

    </div>
  );
};
