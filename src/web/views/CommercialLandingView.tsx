import React, { useState, useRef } from 'react';
import { 
  Shield, 
  Sparkles, 
  ArrowRight, 
  Bot, 
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
  Zap, 
  KeyRound, 
  Radio,
  Calendar,
  X,
  HelpCircle,
  Cpu,
  ChevronDown
} from 'lucide-react';
import { FunnelAnalytics } from '../services/funnel-analytics';
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
  const [activeScanTab, setActiveScanTab] = useState<'github' | 'demo' | 'zip' | 'folder'>('github');
  const [gitUrl, setGitUrl] = useState('https://github.com/negraodenio/CompliancePRO');
  const [isDragOver, setIsDragOver] = useState(false);
  
  // Enterprise Briefing Modal State
  const [isBriefingModalOpen, setIsBriefingModalOpen] = useState(false);
  const [briefingForm, setBriefingForm] = useState({
    fullName: '',
    email: '',
    company: '',
    role: 'CISO',
    notes: ''
  });
  const [briefingSubmitted, setBriefingSubmitted] = useState(false);

  // FAQ Accordion State
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  React.useEffect(() => {
    FunnelAnalytics.track('VISIT');
  }, []);

  const zipInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const scannerSectionRef = useRef<HTMLDivElement>(null);

  const scrollToScanner = () => {
    FunnelAnalytics.track('FREE_SCAN_CLICK');
    FunnelAnalytics.track('lp_hero_scan_click');
    scannerSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const openBriefingModal = () => {
    FunnelAnalytics.track('lp_hero_expert_click');
    FunnelAnalytics.track('enterprise_cta_click');
    setIsBriefingModalOpen(true);
    setBriefingSubmitted(false);
  };

  const handleBriefingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setBriefingSubmitted(true);
  };

  const handleGitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (gitUrl.trim()) {
      FunnelAnalytics.track('free_scan_started', { inputType: 'github' });
      onScanGitHub(gitUrl.trim());
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.zip')) {
        FunnelAnalytics.track('free_scan_started', { inputType: 'zip' });
        onScanZip(file);
      } else {
        FunnelAnalytics.track('free_scan_started', { inputType: 'folder' });
        onScanFolder(e.dataTransfer.files);
      }
    }
  };

  const toggleFaq = (idx: number) => {
    setOpenFaqIndex(openFaqIndex === idx ? null : idx);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-sky-500 selection:text-white font-sans antialiased">
      
      {/* Background Subtle Tech Gradients */}
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
                <span>ComplyPRO</span>
              </span>
              <span className="block text-[9px] font-mono text-slate-400 tracking-wider uppercase">
                AI Governance Platform · Built on CG-AG
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-6 text-xs font-semibold text-slate-300">
            <a href="#how-it-works" className="hover:text-sky-400 transition">How It Works</a>
            <a href="#capabilities" className="hover:text-sky-400 transition">Capabilities</a>
            <a href="#scanner-console" className="hover:text-sky-400 transition flex items-center gap-1 text-sky-400">
              <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
              <span>Free Scan</span>
            </a>
            <a href="#enterprise" className="hover:text-sky-400 transition">Enterprise</a>
            <a href="#mcp" className="hover:text-sky-400 transition flex items-center gap-1">
              <Terminal className="w-3 h-3" />
              <span>Universal MCP</span>
            </a>
            <a href="#faq" className="hover:text-sky-400 transition">FAQ</a>
          </nav>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => onOpenAuth('login')}
              className="text-xs font-semibold text-slate-300 hover:text-white px-3 py-2 rounded-lg hover:bg-slate-900 transition cursor-pointer"
            >
              Sign In
            </button>
            <button
              onClick={scrollToScanner}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-sky-500/25 flex items-center gap-1.5 transition transform hover:-translate-y-0.5 cursor-pointer"
            >
              <span>Run Free Scan</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="relative z-10">
        
        {/* ========================================================================= */}
        {/* 1. HERO SECTION */}
        {/* ========================================================================= */}
        <section className="pt-14 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center space-y-6">
          
          {/* Executive Pill Badge */}
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-sky-500/10 via-indigo-500/10 to-cyan-500/10 border border-sky-500/30 text-sky-300 text-xs font-mono font-semibold backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
            <span>ENTERPRISE AI GOVERNANCE PLATFORM · POWERED BY CG-AG</span>
          </div>

          {/* Main Headline */}
          <div className="max-w-4xl mx-auto space-y-4">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1]">
              Know What Your AI Can Do. <br />
              <span className="bg-gradient-to-r from-sky-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">
                Govern What It Is Allowed to Do.
              </span>
            </h1>
            
            <p className="text-base sm:text-xl text-slate-300 max-w-3xl mx-auto font-normal leading-relaxed">
              ComplyPRO discovers AI agents, capabilities and governance gaps — then turns technical findings into structured governance evidence.
            </p>

            {/* Central Thesis Box */}
            <div className="pt-2 max-w-2xl mx-auto">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-950/60 via-indigo-950/40 to-slate-950/80 border border-sky-500/30 text-center space-y-1.5 backdrop-blur-sm">
                <div className="font-mono text-xs sm:text-sm font-bold text-sky-400 tracking-wider">
                  CODED CAPABILITY ≠ AUTHORIZED CAPABILITY
                </div>
                <p className="text-xs text-slate-300 leading-relaxed max-w-xl mx-auto">
                  Just because an AI system can perform an action doesn't mean it should be authorized to perform it.
                </p>
                <div className="flex items-center justify-center gap-2 pt-1 text-[11px] font-mono text-slate-400">
                  <span className="text-sky-300">CAPABILITY</span>
                  <span>→</span>
                  <span className="text-indigo-300">AUTHORIZATION</span>
                  <span>→</span>
                  <span className="text-cyan-300">GOVERNANCE</span>
                  <span>→</span>
                  <span className="text-emerald-300">EVIDENCE</span>
                </div>
              </div>
            </div>
          </div>

          {/* Clean Dual CTAs */}
          <div className="space-y-3 pt-2">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={scrollToScanner}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-sky-500 via-indigo-600 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 text-white font-extrabold text-sm shadow-xl shadow-sky-500/25 flex items-center justify-center gap-2 transition transform hover:-translate-y-0.5 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-sky-200" />
                <span>Run Free AI Governance Scan</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={openBriefingModal}
                className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 font-semibold text-sm shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>Talk to an AI Governance Expert</span>
              </button>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              No code upload · Runs in your browser · Instant report
            </p>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 2. THE BUSINESS REALITY */}
        {/* ========================================================================= */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
          <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-6">
            <div className="text-center space-y-2">
              <span className="text-xs font-mono font-bold tracking-widest text-sky-400 uppercase">
                THE GOVERNANCE GAP
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                Your AI may be capable of more than you think.
              </h2>
              <p className="text-sm text-slate-300 max-w-2xl mx-auto leading-relaxed">
                AI agents can access tools, APIs, databases and business processes. But capability is not authorization. Organizations need objective technical clarity:
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
              {[
                { title: 'Resource Access', q: 'What can this AI actually access and execute?' },
                { title: 'Verified Permissions', q: 'Which capabilities are formally authorized?' },
                { title: 'Governance Signals', q: 'Where are oversight controls and ownership missing?' },
                { title: 'Evidence Trail', q: 'What auditable technical records exist?' },
                { title: 'Regulatory Position', q: 'Can we demonstrate our governance posture?' },
                { title: 'Business Lineage', q: 'Which business operations are affected?' },
              ].map((item, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-1">
                  <span className="text-[10px] font-mono font-bold text-sky-400 uppercase">{item.title}</span>
                  <p className="text-xs text-slate-300 font-medium">{item.q}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 3. THE 3-STEP GOVERNANCE MODEL */}
        {/* ========================================================================= */}
        <section id="how-it-works" className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-mono font-bold tracking-widest text-indigo-400 uppercase">
              THE GOVERNANCE CYCLE
            </span>
            <h2 className="text-3xl font-extrabold text-white">
              Discover. Govern. Prove.
            </h2>
            <p className="text-sm text-slate-400 max-w-xl mx-auto">
              How ComplyPRO moves organizations from unknown code exposure to auditable operational control.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-7 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center font-mono font-bold text-sm">
                01
              </div>
              <h3 className="text-lg font-bold text-white">DISCOVER</h3>
              <p className="text-xs font-semibold text-sky-300">Know what your AI can actually do.</p>
              <p className="text-xs text-slate-400 leading-relaxed">
                Scan your code to identify autonomous agents, tool invocations, database connections, and operational capabilities before deployment.
              </p>
            </div>

            <div className="p-7 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-mono font-bold text-sm">
                02
              </div>
              <h3 className="text-lg font-bold text-white">GOVERN</h3>
              <p className="text-xs font-semibold text-indigo-300">Understand what it is allowed to do.</p>
              <p className="text-xs text-slate-400 leading-relaxed">
                Assign accountable business owners, define permission boundaries, enforce human oversight (HITL), and organize governed assets.
              </p>
            </div>

            <div className="p-7 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-mono font-bold text-sm">
                03
              </div>
              <h3 className="text-lg font-bold text-white">PROVE</h3>
              <p className="text-xs font-semibold text-emerald-300">Create evidence of your governance posture.</p>
              <p className="text-xs text-slate-400 leading-relaxed">
                Maintain tamper-evident audit records and structured evidence packages to demonstrate responsible AI oversight to boards and regulators.
              </p>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 4. LIVE FREE SCAN CONSOLE & SNAPSHOT (COMPACT NESTED PRODUCT CONSOLE) */}
        {/* ========================================================================= */}
        <section ref={scannerSectionRef} id="scanner-console" className="py-8 sm:py-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
          
          {/* UNIFIED COMPACT NESTED PRODUCT CONSOLE SURFACE */}
          <div className="p-4 sm:p-6 rounded-2xl bg-[#0A1628] border border-[#1e3a5f]/60 shadow-[0_16px_40px_rgba(2,16,36,0.45)] relative overflow-hidden space-y-4">
            
            {/* Subtle ambient light gradient at the top of the panel */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-sky-500/5 rounded-full blur-2xl pointer-events-none" />

            {/* Compact Integrated Header / Title inside the panel */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-sky-500/15 pb-3 relative z-10">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/25 text-sky-300 text-[10px] font-mono font-bold uppercase tracking-wider">
                    <Sparkles className="w-3 h-3 text-sky-400" />
                    <span>Free AI Governance Scan</span>
                  </span>
                  <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
                    Air-Gapped In-Memory Analysis
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                  See Your AI Governance Posture in Minutes
                </h2>
                <p className="text-xs text-slate-300">
                  Scan your AI project and discover agents, capabilities, governance signals and potential gaps — directly in your browser.
                </p>
              </div>

              <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 shrink-0">
                <span className="flex items-center gap-1 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>No Code Upload</span>
                </span>
                <span className="text-slate-600">•</span>
                <span className="flex items-center gap-1 text-sky-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Instant Report</span>
                </span>
              </div>
            </div>

            {/* LEVEL 2: COMPACT INPUT / SENSOR SURFACE */}
            <div className="p-3.5 sm:p-4 rounded-xl bg-[#060F1D] border border-slate-800/80 shadow-inner space-y-3 relative z-10">
              {/* Horizontal Source Selector Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider">
                    Input Source:
                  </span>
                </div>

                {/* Compact Segmented Switcher */}
                <div className="flex items-center p-0.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-semibold">
                  <button
                    onClick={() => setActiveScanTab('github')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition cursor-pointer ${
                      activeScanTab === 'github' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Github className="w-3.5 h-3.5" />
                    <span>GitHub URL</span>
                  </button>
                  <button
                    onClick={() => setActiveScanTab('demo')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition cursor-pointer ${
                      activeScanTab === 'demo' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Enterprise Demos</span>
                  </button>
                  <button
                    onClick={() => setActiveScanTab('zip')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition cursor-pointer ${
                      activeScanTab === 'zip' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <FileArchive className="w-3.5 h-3.5" />
                    <span>ZIP File</span>
                  </button>
                  <button
                    onClick={() => setActiveScanTab('folder')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition cursor-pointer ${
                      activeScanTab === 'folder' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <FolderUp className="w-3.5 h-3.5" />
                    <span>Local Folder</span>
                  </button>
                </div>
              </div>

              {/* TAB 1: DEMO SWITCHER */}
              {activeScanTab === 'demo' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {DEMO_PROJECTS.map((demo) => (
                    <div
                      key={demo.id}
                      onClick={() => {
                        FunnelAnalytics.track('free_scan_started', { inputType: 'demo', demoId: demo.id });
                        onSelectDemo(demo);
                      }}
                      className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 hover:border-sky-500/50 hover:bg-slate-900 transition cursor-pointer flex items-center justify-between gap-2 group"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 truncate block w-fit">
                          {demo.category}
                        </span>
                        <h4 className="text-xs font-bold text-white group-hover:text-sky-300 transition truncate">
                          {demo.name}
                        </h4>
                      </div>
                      <button className="px-2.5 py-1 rounded bg-slate-800 group-hover:bg-sky-600 text-[10px] font-bold text-white transition shrink-0">
                        Scan
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 2: GITHUB URL */}
              {activeScanTab === 'github' && (
                <div className="space-y-2">
                  <form onSubmit={handleGitSubmit} className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <Github className="w-4 h-4 text-slate-500 absolute left-3.5 top-2.5" />
                      <input
                        type="text"
                        value={gitUrl}
                        onChange={(e) => setGitUrl(e.target.value)}
                        placeholder="https://github.com/org/your-ai-agent-repo"
                        className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-sky-500 font-mono"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isScanning}
                      className="px-5 py-2 rounded-lg bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-sky-500/25 transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{isScanning ? 'Scanning...' : 'Run Free Scan'}</span>
                    </button>
                  </form>

                  {/* Quick 1-Click Suggestions — Inline & Compact */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
                    <span className="font-semibold text-slate-500 text-[10px] uppercase font-mono">Quick Try:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setGitUrl('https://github.com/negraodenio/CompliancePRO');
                        onScanGitHub('https://github.com/negraodenio/CompliancePRO');
                      }}
                      className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 hover:border-sky-500/50 text-slate-300 hover:text-sky-400 font-mono text-[11px] transition cursor-pointer"
                    >
                      CompliancePRO (Core Repo)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (DEMO_PROJECTS[0]) onSelectDemo(DEMO_PROJECTS[0]);
                      }}
                      className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 hover:border-indigo-500/50 text-slate-300 hover:text-indigo-400 font-mono text-[11px] transition cursor-pointer"
                    >
                      FinTech Credit CrewAI
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 3: ZIP */}
              {activeScanTab === 'zip' && (
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => zipInputRef.current?.click()}
                  className={`p-3.5 rounded-lg border-2 border-dashed text-center transition cursor-pointer flex items-center justify-center gap-3 ${
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
                  <FileArchive className="w-5 h-5 text-sky-400 shrink-0" />
                  <div className="text-left">
                    <p className="text-xs font-bold text-white">Click or drag & drop ZIP project</p>
                    <p className="text-[10px] text-slate-400 font-mono">Processed in local browser memory</p>
                  </div>
                </div>
              )}

              {/* TAB 4: FOLDER */}
              {activeScanTab === 'folder' && (
                <div
                  onClick={() => folderInputRef.current?.click()}
                  className="p-3.5 rounded-lg border-2 border-dashed border-slate-800 hover:border-slate-700 bg-slate-950/50 text-center transition cursor-pointer flex items-center justify-center gap-3"
                >
                  <input
                    ref={folderInputRef}
                    type="file"
                    {...({ webkitdirectory: '', directory: '' } as any)}
                    onChange={(e) => e.target.files && onScanFolder(e.target.files)}
                    className="hidden"
                  />
                  <FolderUp className="w-5 h-5 text-indigo-400 shrink-0" />
                  <div className="text-left">
                    <p className="text-xs font-bold text-white">Select local project folder</p>
                    <p className="text-[10px] text-slate-400 font-mono">Processed in local browser memory</p>
                  </div>
                </div>
              )}

              {/* Scanning Progress Banner */}
              {isScanning && (
                <div className="p-2.5 rounded-lg bg-slate-950 border border-sky-500/30 space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-sky-400 flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 animate-spin text-sky-400" />
                      <span>{scanProgress.message || 'Extracting AST & capabilities...'}</span>
                    </span>
                    <span className="text-white font-bold">{scanProgress.percent}%</span>
                  </div>
                  <div className="w-full h-1 rounded-full bg-slate-800 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 transition-all duration-300"
                      style={{ width: `${scanProgress.percent}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* LEVEL 3: OPEN LIVE SNAPSHOT VIEW & TRANSITION (DENTRO DO MESMO PAINEL DO FREE SCAN) */}
            {scanResult && (
              <div className="space-y-6 pt-3 relative z-10 border-t border-[#1e3a5f]/40">
                <FreeScanSnapshotView 
                  result={scanResult}
                  onGovernFindings={() => {
                    FunnelAnalytics.track('free_scan_governance_cta');
                    FunnelAnalytics.track('workspace_signup_started');
                    onOpenAuth('signup');
                  }}
                  onExploreGovernanceOs={() => {
                    FunnelAnalytics.track('GOVERNANCE_ENTERED');
                    onEnterApp();
                  }}
                  onResetScan={onResetScan}
                />

                {/* COMPACT POST-SCAN TRANSITION CARD */}
                <div className="p-5 sm:p-6 rounded-xl bg-[#060F1D] border border-sky-500/25 space-y-4 shadow-xl">
                  <div className="space-y-1 text-center max-w-2xl mx-auto">
                    <span className="text-[10px] font-mono font-bold tracking-widest text-sky-400 uppercase">
                      NEXT STEP
                    </span>
                    <h3 className="text-lg sm:text-xl font-extrabold text-white">
                      Discovery is only the first step.
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Finding capabilities is useful. Governing them is what turns discovery into organizational control.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-left">
                    <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 space-y-0.5">
                      <span className="text-[9px] font-mono font-bold text-sky-400">01 — DISCOVER</span>
                      <h4 className="text-xs font-bold text-white">Identify Assets & Tools</h4>
                      <p className="text-[10px] text-slate-400">Identify agents, capabilities and AI components.</p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 space-y-0.5">
                      <span className="text-[9px] font-mono font-bold text-indigo-400">02 — GOVERN</span>
                      <h4 className="text-xs font-bold text-white">Establish Control</h4>
                      <p className="text-[10px] text-slate-400">Apply governance controls, ownership, risk classification and oversight.</p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 space-y-0.5">
                      <span className="text-[9px] font-mono font-bold text-emerald-400">03 — PROVE</span>
                      <h4 className="text-xs font-bold text-white">Produce Records</h4>
                      <p className="text-[10px] text-slate-400">Maintain structured evidence and governance records.</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-slate-950/90 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="space-y-0.5 text-center sm:text-left">
                      <h4 className="text-xs font-bold text-white">Keep your governance work organized</h4>
                      <p className="text-[11px] text-slate-300">
                        Create a free workspace to preserve findings, organize governed assets, issue AI Passports, and build your governance posture over time.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        FunnelAnalytics.track('workspace_signup_started');
                        onOpenAuth('signup');
                      }}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-extrabold text-xs transition shadow-md shrink-0 cursor-pointer"
                    >
                      Create Free Workspace
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </section>

        {/* ========================================================================= */}
        {/* 5. BUSINESS IMPACT / SIPOC (FROM CODE TO BUSINESS) */}
        {/* ========================================================================= */}
        <section className="py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
          <div className="max-w-3xl mx-auto text-center space-y-2">
            <span className="text-xs font-mono font-bold tracking-widest text-sky-400 uppercase">
              OPERATIONAL CONTEXT
            </span>
            <h2 className="text-3xl font-extrabold text-white">
              From Code to Business Impact
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Connect technical AI capabilities to the business processes they affect.
            </p>
            <p className="text-xs text-slate-400">
              Governance becomes more useful when technical findings can be understood in business context.
            </p>
          </div>

          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-slate-300">
              <span className="font-bold text-white">SIPOC AI LINEAGE:</span>
              <span className="text-slate-400 text-[11px]">Derived from static AST evidence</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              {[
                { stage: 'SUPPLIER', desc: 'Code repositories, APIs & data providers feeding the model', color: 'text-sky-400', border: 'border-sky-500/20' },
                { stage: 'INPUT', desc: 'Context windows, user prompts & database inputs', color: 'text-indigo-400', border: 'border-indigo-500/20' },
                { stage: 'PROCESS', desc: 'Autonomous agent decision routines & tool calls', color: 'text-cyan-400', border: 'border-cyan-500/20' },
                { stage: 'OUTPUT', desc: 'Generated artifacts, DB mutations & API executions', color: 'text-amber-400', border: 'border-amber-500/20' },
                { stage: 'CUSTOMER', desc: 'End users, internal business units & downstream systems', color: 'text-emerald-400', border: 'border-emerald-500/20' },
              ].map((s, idx) => (
                <div key={idx} className={`p-4 rounded-2xl bg-slate-950/80 border ${s.border} space-y-1.5`}>
                  <div className={`text-xs font-mono font-bold ${s.color}`}>{s.stage}</div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 6. GOVERNANCE CAPABILITIES */}
        {/* ========================================================================= */}
        <section id="capabilities" className="py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
          <div className="max-w-3xl mx-auto text-center space-y-2">
            <span className="text-xs font-mono font-bold tracking-widest text-indigo-400 uppercase">
              PLATFORM CAPABILITIES
            </span>
            <h2 className="text-3xl font-extrabold text-white">
              Engineered for Real Governance Work
            </h2>
            <p className="text-sm text-slate-400">
              Each capability answers a concrete organizational requirement.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                icon: <Eye className="w-5 h-5 text-sky-400" />,
                title: 'AI Discovery',
                value: 'Know what agents and capabilities exist.',
                why: 'Eliminates unknown AI exposure across repos and tool definitions.'
              },
              {
                icon: <Shield className="w-5 h-5 text-indigo-400" />,
                title: 'Governance Controls',
                value: 'Define ownership and permission boundaries.',
                why: 'Prevents unverified capabilities from operating without legal and technical bounds.'
              },
              {
                icon: <UserCheck className="w-5 h-5 text-amber-400" />,
                title: 'Human Oversight',
                value: 'Identify where human approval (HITL) matters.',
                why: 'Enforces human sign-off gates on high-risk, financial or destructive operations.'
              },
              {
                icon: <FileBadge className="w-5 h-5 text-emerald-400" />,
                title: 'Structured Evidence',
                value: 'Turn governance activity into audit records.',
                why: 'Provides verifiable documentation for boards, auditors and compliance teams.'
              },
              {
                icon: <KeyRound className="w-5 h-5 text-cyan-400" />,
                title: 'AI Passports',
                value: 'Give every governed AI asset an identity.',
                why: 'Establishes clear ownership, autonomy bounds, and authorized roles.'
              },
              {
                icon: <Layers className="w-5 h-5 text-indigo-400" />,
                title: 'Business X-Ray',
                value: 'Connect technical AI to business impact.',
                why: 'Translates technical AST calls into operational SIPOC risk comprehension.'
              },
              {
                icon: <Lock className="w-5 h-5 text-sky-400" />,
                title: 'Audit Integrity',
                value: 'Preserve records with cryptographic hashing.',
                why: 'Guarantees that historical audit entries cannot be quietly altered or forged.'
              },
              {
                icon: <Terminal className="w-5 h-5 text-emerald-400" />,
                title: 'MCP Governance',
                value: 'Bring governance into agent workflows.',
                why: 'Governs AI where the work actually happens — in IDEs and compatible agents.'
              },
            ].map((cap, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition space-y-2.5">
                <div className="w-9 h-9 rounded-xl bg-slate-950 flex items-center justify-center border border-slate-800">
                  {cap.icon}
                </div>
                <h4 className="text-sm font-bold text-white">{cap.title}</h4>
                <p className="text-xs font-semibold text-slate-200">{cap.value}</p>
                <p className="text-[11px] text-slate-400 leading-relaxed">{cap.why}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 7. AI PASSPORT & AUDIT INTEGRITY */}
        {/* ========================================================================= */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* AI Passport Feature */}
            <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
              <div className="space-y-1">
                <span className="text-xs font-mono font-bold text-cyan-400 uppercase">ASSET IDENTITY</span>
                <h3 className="text-xl font-bold text-white">Give Every Governed AI Asset an Identity</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  AI Passports provide a structured way to capture governance information about AI assets:
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-xs space-y-2">
                <div className="flex items-center justify-between border-b border-slate-900 pb-1.5">
                  <span className="text-slate-400">Asset Identity:</span>
                  <span className="text-white font-bold">CreditRiskAssessmentAgent</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-900 pb-1.5">
                  <span className="text-slate-400">Business Process:</span>
                  <span className="text-sky-300">Underwriting & Loan Decisioning</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-900 pb-1.5">
                  <span className="text-slate-400">Accountable Owner:</span>
                  <span className="text-amber-300">Assigned Compliance Owner</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-900 pb-1.5">
                  <span className="text-slate-400">Autonomy Level:</span>
                  <span className="text-cyan-300">Assisted (HITL Mandatory)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Oversight Gate:</span>
                  <span className="text-emerald-400">Enforced Verification</span>
                </div>
              </div>
            </div>

            {/* Evidence & Cryptographic Integrity */}
            <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
              <div className="space-y-1">
                <span className="text-xs font-mono font-bold text-emerald-400 uppercase">TAMPER-EVIDENT RECORDS</span>
                <h3 className="text-xl font-bold text-white">Governance You Can Demonstrate</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Preserve structured governance evidence with cryptographic integrity:
                </p>
              </div>

              <div className="space-y-3 pt-1 text-xs text-slate-300 leading-relaxed">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                  <div>
                    <strong className="text-white">Deterministic Hashing:</strong> Every governance decision, scan snapshot and policy change is serialized using canonical RFC 8785 JSON.
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                  <div>
                    <strong className="text-white">Hash-Chained Sequence:</strong> Blocks link to previous entries via SHA-256 hashes, creating an immutable audit trail.
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                  <div>
                    <strong className="text-white">Auditable Proof:</strong> Generate technical evidence packages that auditors and regulators can independently verify.
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ========================================================================= */}
        {/* 8. SECURITY & PRIVACY */}
        {/* ========================================================================= */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="p-8 rounded-3xl bg-slate-900/50 border border-slate-800 space-y-6">
            <div className="text-center space-y-2 max-w-2xl mx-auto">
              <span className="text-xs font-mono font-bold tracking-widest text-sky-400 uppercase">
                SECURITY & ARCHITECTURE
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                Your Code Stays Yours
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                The Free Scan analyzes your code in the browser. Source code is not uploaded to ComplyPRO for the scan.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                <span className="text-xs font-bold text-white block">In-Browser Analysis</span>
                <p className="text-[11px] text-slate-400">AST parsing and capability extraction execute in local browser memory.</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                <span className="text-xs font-bold text-white block">Zero Source Upload</span>
                <p className="text-[11px] text-slate-400">We do not store your repository code during the Free Scan.</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                <span className="text-xs font-bold text-white block">Multi-Tenant Isolation</span>
                <p className="text-[11px] text-slate-400">Workspace data is defended with PostgreSQL Row Level Security (RLS).</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                <span className="text-xs font-bold text-white block">Enterprise Deployment</span>
                <p className="text-[11px] text-slate-400">Dedicated POD deployments available for VPC and air-gapped perimeters.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 9. BUILT ON CG-AG */}
        {/* ========================================================================= */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <span className="text-xs font-mono font-bold tracking-widest text-indigo-400 uppercase">
              NORMATIVE FRAMEWORK
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Built on CG-AG
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              ComplyPRO applies the CG-AG governance model across AI agents, capabilities, controls, evidence and organizational responsibility.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { id: 'CG-AG-01', title: 'Asset Identity' },
              { id: 'CG-AG-02', title: 'Tool Constraints' },
              { id: 'CG-AG-03', title: 'HITL Gates' },
              { id: 'CG-AG-04', title: 'Autonomy Bounds' },
              { id: 'CG-AG-05', title: 'Security Defenses' },
              { id: 'CG-AG-06', title: 'Data Minimization' },
              { id: 'CG-AG-07', title: 'Audit Ledger' },
              { id: 'CG-AG-08', title: 'Drift Monitoring' },
              { id: 'CG-AG-09', title: 'Spend Quotas' },
              { id: 'CG-AG-10', title: 'Fail-Safe Control' },
              { id: 'CG-AG-11', title: 'Tenant Isolation' },
              { id: 'CG-AG-12', title: 'Continuous Checks' },
            ].map((c) => (
              <div key={c.id} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-center space-y-0.5">
                <span className="text-[10px] font-mono text-sky-400 font-bold">{c.id}</span>
                <p className="text-xs font-bold text-white truncate">{c.title}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 10. UNIVERSAL MCP */}
        {/* ========================================================================= */}
        <section id="mcp" className="py-14 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-6">
          <div className="p-8 rounded-3xl bg-slate-900/70 border border-slate-800 space-y-6">
            <div className="text-center space-y-2 max-w-2xl mx-auto">
              <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold tracking-widest text-sky-400 uppercase">
                <Terminal className="w-3.5 h-3.5" />
                AGENT-NATIVE INTERFACE
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                Bring AI Governance Into Your AI Agents
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Access ComplyPRO governance capabilities directly from MCP-compatible AI agents and development environments.
              </p>
              <p className="text-xs font-semibold text-emerald-400">
                Governance where AI work actually happens.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              {['Claude', 'Cursor', 'Gemini', 'VS Code (MCP)', 'Custom AI Agents'].map((env) => (
                <span key={env} className="px-3.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300">
                  {env}
                </span>
              ))}
            </div>

            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-2">
              <span className="text-xs font-mono text-sky-400 font-bold">
                Universal MCP Integration Layer
              </span>
              <p className="text-xs text-slate-400 max-w-lg mx-auto leading-relaxed">
                Exposes 14 governance tools, 7 resources, and 4 guided prompts directly over stdio and SSE transport protocols.
              </p>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 11. ENTERPRISE OPTIONS & BRIEFING */}
        {/* ========================================================================= */}
        <section id="enterprise" className="py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
          <div className="max-w-3xl mx-auto text-center space-y-2">
            <span className="text-xs font-mono font-bold tracking-widest text-emerald-400 uppercase">
              DEPLOYMENT & ACCESS
            </span>
            <h2 className="text-3xl font-extrabold text-white">
              Ready for Enterprise AI Governance?
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Bring AI governance into your organization's operating model with ComplyPRO SaaS or dedicated enterprise deployment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* SaaS Path */}
            <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-mono font-bold">
                  MANAGED WORKSPACE
                </div>
                <h3 className="text-xl font-bold text-white">ComplyPRO SaaS</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  For organizations that want a managed AI governance workspace. Discover assets, organize findings, track authorization posture, and access role-based lenses.
                </p>
                <ul className="space-y-1.5 text-xs text-slate-400 pt-2">
                  <li className="flex items-center gap-2">✓ Multi-tenant isolated workspace</li>
                  <li className="flex items-center gap-2">✓ Role-based access control (CISO, DPO, AI Office)</li>
                  <li className="flex items-center gap-2">✓ Structured evidence repository</li>
                </ul>
              </div>
              <button
                onClick={() => {
                  FunnelAnalytics.track('workspace_signup_started');
                  onOpenAuth('signup');
                }}
                className="w-full py-3.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-extrabold text-xs transition shadow-lg cursor-pointer"
              >
                Create Free Workspace
              </button>
            </div>

            {/* Enterprise POD Path */}
            <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-mono font-bold">
                  DEDICATED INFRASTRUCTURE
                </div>
                <h3 className="text-xl font-bold text-white">Enterprise / POD Deployment</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  For organizations requiring dedicated deployment, custom perimeter controls, and specific enterprise governance requirements.
                </p>
                <ul className="space-y-1.5 text-xs text-slate-400 pt-2">
                  <li className="flex items-center gap-2">✓ Dedicated VPC or air-gapped container</li>
                  <li className="flex items-center gap-2">✓ Organization-specific data isolation</li>
                  <li className="flex items-center gap-2">✓ Custom governance baseline support</li>
                </ul>
              </div>
              <button
                onClick={openBriefingModal}
                className="w-full py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition border border-slate-700 cursor-pointer"
              >
                Talk to an Expert
              </button>
            </div>

          </div>

          {/* 15-Minute Briefing Box */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40 border border-indigo-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <Calendar className="w-4 h-4 text-indigo-400" />
                <h4 className="text-sm font-bold text-white">Book an AI Governance Briefing</h4>
              </div>
              <p className="text-xs text-slate-300">
                A focused 15-minute conversation about your AI governance posture, deployment model and next steps.
              </p>
            </div>
            <button
              onClick={openBriefingModal}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition shadow-lg shrink-0 cursor-pointer"
            >
              Schedule 15-Min Briefing
            </button>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 12. COMPREHENSIVE FAQ */}
        {/* ========================================================================= */}
        <section id="faq" className="py-14 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <span className="text-xs font-mono font-bold tracking-widest text-sky-400 uppercase">
              CLARIFICATIONS
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Frequently Asked Questions
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Clear, factual answers regarding capabilities, architecture and security.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            {[
              {
                q: 'What is ComplyPRO?',
                a: 'ComplyPRO is an enterprise AI governance platform that helps organizations discover what their AI code actually can do, establish authorized permission boundaries, and maintain structured, verifiable evidence of their governance posture.'
              },
              {
                q: 'Who is ComplyPRO for?',
                a: 'ComplyPRO is built for CISOs, DPOs, AI Governance Leads, CTOs, and compliance teams responsible for deploying and overseeing AI agents and LLM applications in enterprise environments.'
              },
              {
                q: 'Does ComplyPRO upload my source code?',
                a: 'No. The Free Scan executes static AST analysis directly in your local browser memory. Source code is never uploaded to or stored on ComplyPRO servers during the scan.'
              },
              {
                q: 'What does the Free AI Governance Scan analyze?',
                a: 'It analyzes project files and AST structures to discover autonomous agents, tool invocations, database connections, shell actions, model providers, and scope decomposition (production vs. infrastructure vs. test files).'
              },
              {
                q: 'Is ComplyPRO a code scanner or an AI governance platform?',
                a: 'ComplyPRO is a complete AI governance platform. The static code scanner is an entry point designed to establish technical ground truth; the platform provides workspaces, role-based lenses, policy management, AI Passports, and audit ledgers.'
              },
              {
                q: 'What is CG-AG?',
                a: 'CG-AG is the normative governance methodology and 12-control framework that structures how ComplyPRO analyzes, classifies, and verifies AI capabilities and compliance requirements.'
              },
              {
                q: 'What is Universal MCP?',
                a: 'Universal MCP is an interface layer that exposes ComplyPRO governance tools, resources and prompts directly to Model Context Protocol (MCP) clients like Claude, Cursor, and custom agents.'
              },
              {
                q: 'Can ComplyPRO support enterprise deployments?',
                a: 'Yes. In addition to managed SaaS workspaces, ComplyPRO offers dedicated POD deployments for organizations with custom VPC or air-gapped infrastructure requirements.'
              },
              {
                q: 'What is the difference between SaaS and POD?',
                a: 'SaaS provides a fully managed multi-tenant workspace hosted in our cloud. POD provides a dedicated instance deployed inside your own perimeter or isolated virtual private cloud.'
              },
              {
                q: 'Does ComplyPRO automatically certify compliance?',
                a: 'No. ComplyPRO provides governance assessment, controls and structured evidence to support organizational AI governance. It does not replace legal, regulatory or independent certification processes.'
              },
            ].map((faq, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 transition">
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full flex items-center justify-between text-left gap-3 cursor-pointer"
                >
                  <span className="text-xs sm:text-sm font-bold text-white">{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${openFaqIndex === idx ? 'rotate-180 text-sky-400' : ''}`} />
                </button>
                {openFaqIndex === idx && (
                  <p className="text-xs text-slate-300 leading-relaxed pt-2.5 border-t border-slate-800/80 mt-2.5">
                    {faq.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 13. FINAL CONVERSION BANNER */}
        {/* ========================================================================= */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="p-10 sm:p-14 rounded-3xl bg-gradient-to-r from-sky-950 via-indigo-950 to-slate-950 border-2 border-sky-500/40 text-center space-y-5 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="max-w-3xl mx-auto space-y-3 relative z-10">
              <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
                Know Your AI. <br className="hidden sm:block" />
                Govern Your AI. <br className="hidden sm:block" />
                Prove Your Governance.
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
                Start with a free AI Governance Scan or talk to our team about enterprise deployment.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 relative z-10 pt-2">
              <button
                onClick={scrollToScanner}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-sky-500 via-indigo-600 to-cyan-500 hover:from-sky-400 hover:to-cyan-400 text-white font-extrabold text-sm shadow-xl shadow-sky-500/25 flex items-center justify-center gap-2 cursor-pointer transition transform hover:-translate-y-0.5"
              >
                <Sparkles className="w-4 h-4" />
                <span>Run Free AI Governance Scan</span>
              </button>

              <button
                onClick={openBriefingModal}
                className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-white border border-slate-700 font-semibold text-sm transition cursor-pointer flex items-center justify-center gap-2"
              >
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>Talk to an AI Governance Expert</span>
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
            <span>ComplyPRO</span>
            <span className="text-slate-600 font-normal">| AI Governance Platform · Built on CG-AG</span>
          </div>
          <p>© 2026 ComplyPRO. All rights reserved. Zero code storage. Air-Gapped Ready.</p>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* 14. ENTERPRISE BRIEFING MODAL */}
      {/* ========================================================================= */}
      {isBriefingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-lg p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-5">
            <button
              onClick={() => setIsBriefingModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {!briefingSubmitted ? (
              <>
                <div className="space-y-1">
                  <span className="text-xs font-mono font-bold text-sky-400 uppercase">15-MINUTE BRIEFING</span>
                  <h3 className="text-xl font-bold text-white">Book an AI Governance Briefing</h3>
                  <p className="text-xs text-slate-300">
                    A focused conversation with our team regarding your AI architecture, governance controls, and deployment requirements.
                  </p>
                </div>

                <form onSubmit={handleBriefingSubmit} className="space-y-3.5 pt-1">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-300 block">Full Name</label>
                    <input
                      type="text"
                      required
                      value={briefingForm.fullName}
                      onChange={(e) => setBriefingForm({ ...briefingForm, fullName: e.target.value })}
                      placeholder="Jane Doe"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-sky-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-300 block">Work Email</label>
                    <input
                      type="email"
                      required
                      value={briefingForm.email}
                      onChange={(e) => setBriefingForm({ ...briefingForm, email: e.target.value })}
                      placeholder="jane@company.com"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-sky-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-300 block">Company</label>
                      <input
                        type="text"
                        required
                        value={briefingForm.company}
                        onChange={(e) => setBriefingForm({ ...briefingForm, company: e.target.value })}
                        placeholder="Acme Corp"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-sky-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-300 block">Role</label>
                      <select
                        value={briefingForm.role}
                        onChange={(e) => setBriefingForm({ ...briefingForm, role: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-hidden focus:border-sky-500"
                      >
                        <option value="CISO">CISO / Security</option>
                        <option value="DPO">DPO / Privacy</option>
                        <option value="AI_OFFICE">AI Governance / Head of AI</option>
                        <option value="CTO">CTO / Engineering</option>
                        <option value="AUDITOR">Auditor / GRC</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-300 block">Specific Objectives (Optional)</label>
                    <textarea
                      rows={2}
                      value={briefingForm.notes}
                      onChange={(e) => setBriefingForm({ ...briefingForm, notes: e.target.value })}
                      placeholder="e.g. EU AI Act readiness, internal agent permission auditing, dedicated POD deployment..."
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-sky-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs shadow-lg transition cursor-pointer"
                  >
                    Request Briefing
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center py-6 space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">Briefing Request Received</h3>
                <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                  Thank you, <strong className="text-white">{briefingForm.fullName}</strong>. Our AI Governance Specialist will contact you at <strong className="text-white">{briefingForm.email}</strong> within 24 hours to schedule your 15-minute briefing.
                </p>
                <button
                  onClick={() => setIsBriefingModalOpen(false)}
                  className="mt-2 px-6 py-2.5 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-700 transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
