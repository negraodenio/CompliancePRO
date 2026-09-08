import React, { useState } from 'react';
import { SeoPageData, SEO_PAGES } from '../data/seo-pages';
import { 
  Shield, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  Calendar, 
  FileText, 
  ChevronRight, 
  Layers, 
  Lock, 
  Terminal, 
  ChevronDown
} from 'lucide-react';

interface SeoPageViewProps {
  page: SeoPageData;
  onNavigate: (path: string) => void;
  onLaunchScan: () => void;
  onOpenBriefing: () => void;
}

export const SeoPageView: React.FC<SeoPageViewProps> = ({
  page,
  onNavigate,
  onLaunchScan,
  onOpenBriefing
}) => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-sky-500 selection:text-white flex flex-col justify-between font-sans antialiased">
      {/* Header / Nav */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div 
            onClick={() => onNavigate('/')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 via-indigo-600 to-cyan-400 p-[1.5px] shadow-lg shadow-sky-500/20 group-hover:scale-105 transition duration-300">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Shield className="w-5 h-5 text-sky-400" />
              </div>
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight text-white flex items-center gap-1.5">
                Comply<span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-cyan-400">PRO</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-500/10 border border-sky-500/30 text-sky-400 font-mono font-medium">
                  CG-AG
                </span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('/')}
              className="text-xs font-semibold text-slate-300 hover:text-white transition px-3 py-2 cursor-pointer hidden sm:block"
            >
              Overview
            </button>
            <button
              onClick={onOpenBriefing}
              className="text-xs font-semibold text-slate-300 hover:text-white transition px-3 py-2 cursor-pointer hidden md:block"
            >
              Book Briefing
            </button>
            <button
              onClick={onLaunchScan}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-sky-500/20 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Free Scan</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-12 flex-1 w-full">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-400 font-mono">
          <span 
            onClick={() => onNavigate('/')}
            className="hover:text-sky-400 cursor-pointer transition"
          >
            ComplyPRO
          </span>
          <ChevronRight className="w-3 h-3 text-slate-600" />
          <span 
            onClick={() => onNavigate('/ai-governance')}
            className="hover:text-sky-400 cursor-pointer transition"
          >
            Resources
          </span>
          <ChevronRight className="w-3 h-3 text-slate-600" />
          <span className="text-slate-300 truncate max-w-[200px] sm:max-w-none">
            {page.primaryKeyword}
          </span>
        </nav>

        {/* Hero Area */}
        <article className="space-y-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/25 text-sky-300 text-xs font-mono font-bold tracking-wide uppercase">
              <span>{page.badge}</span>
              <span>•</span>
              <span>{page.readingTimeMinutes} MIN READ</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
              {page.h1}
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal pt-1">
              {page.subtitle}
            </p>
          </div>

          {/* Quick Action Box */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-indigo-950/40 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <div className="text-xs font-mono font-bold text-sky-400 flex items-center gap-1.5 justify-center sm:justify-start">
                <Terminal className="w-3.5 h-3.5" />
                <span>TECHNICAL GROUND TRUTH SENSOR</span>
              </div>
              <p className="text-xs text-slate-300">
                Audit your repository against these controls in seconds. Zero source code upload.
              </p>
            </div>
            <button
              onClick={onLaunchScan}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition shadow-md flex items-center justify-center gap-2 shrink-0 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Launch Free Scan</span>
            </button>
          </div>

          {/* Substantive Sections */}
          <div className="space-y-10 pt-4">
            {page.sections.map((section, idx) => (
              <section key={idx} className="space-y-4">
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight border-b border-slate-800/80 pb-2">
                  {section.heading}
                </h2>
                {section.subheading && (
                  <h3 className="text-sm font-semibold text-slate-300">
                    {section.subheading}
                  </h3>
                )}
                {section.paragraphs.map((p, pIdx) => (
                  <p key={pIdx} className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {p}
                  </p>
                ))}

                {section.bulletPoints && section.bulletPoints.length > 0 && (
                  <ul className="space-y-2.5 pt-1 pl-1">
                    {section.bulletPoints.map((bp, bpIdx) => (
                      <li key={bpIdx} className="text-xs sm:text-sm text-slate-300 flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                        <span>{bp}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {section.callout && (
                  <div className={`p-4 rounded-xl border my-4 ${
                    section.callout.type === 'epistemic'
                      ? 'bg-sky-950/20 border-sky-800/40 text-sky-200'
                      : section.callout.type === 'security'
                      ? 'bg-rose-950/20 border-rose-800/40 text-rose-200'
                      : section.callout.type === 'framework'
                      ? 'bg-indigo-950/20 border-indigo-800/40 text-indigo-200'
                      : 'bg-emerald-950/20 border-emerald-800/40 text-emerald-200'
                  }`}>
                    <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider mb-1">
                      {section.callout.type === 'epistemic' && <Layers className="w-4 h-4 text-sky-400" />}
                      {section.callout.type === 'security' && <AlertTriangle className="w-4 h-4 text-rose-400" />}
                      {section.callout.type === 'framework' && <Terminal className="w-4 h-4 text-indigo-400" />}
                      {section.callout.type === 'compliance' && <Shield className="w-4 h-4 text-emerald-400" />}
                      <span>{section.callout.title}</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans">
                      {section.callout.text}
                    </p>
                  </div>
                )}
              </section>
            ))}
          </div>

          {/* FAQ Section */}
          {page.faq.length > 0 && (
            <section className="space-y-4 pt-8 border-t border-slate-800/80">
              <div className="space-y-1">
                <span className="text-xs font-mono font-bold text-sky-400 uppercase">KNOWLEDGE & AUDIT QUESTIONS</span>
                <h2 className="text-xl sm:text-2xl font-bold text-white">Frequently Asked Questions</h2>
              </div>
              <div className="space-y-3 pt-2">
                {page.faq.map((item, fIdx) => (
                  <div 
                    key={fIdx}
                    className="rounded-xl bg-slate-900/60 border border-slate-800 overflow-hidden transition"
                  >
                    <button
                      onClick={() => toggleFaq(fIdx)}
                      className="w-full px-5 py-3.5 flex items-center justify-between text-left text-xs sm:text-sm font-semibold text-white hover:text-sky-300 transition cursor-pointer"
                    >
                      <span>{item.question}</span>
                      <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ml-2 ${openFaqIndex === fIdx ? 'rotate-180 text-sky-400' : ''}`} />
                    </button>
                    {openFaqIndex === fIdx && (
                      <div className="px-5 pb-4 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-slate-800/40 pt-3">
                        {item.answer}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Internal Linking / Topical Cluster */}
          {page.relatedPages.length > 0 && (
            <section className="space-y-4 pt-8 border-t border-slate-800/80">
              <div className="space-y-1">
                <span className="text-xs font-mono font-bold text-indigo-400 uppercase">CONNECTED GOVERNANCE TOPICS</span>
                <h3 className="text-lg font-bold text-white">Explore Related AI Governance Frameworks</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                {page.relatedPages.map((rel, rIdx) => (
                  <div
                    key={rIdx}
                    onClick={() => onNavigate(rel.slug)}
                    className="p-4 rounded-xl bg-slate-900/40 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 transition cursor-pointer flex flex-col justify-between space-y-2 group"
                  >
                    <div>
                      <span className="text-[10px] font-mono font-bold text-sky-400 uppercase tracking-wider block mb-1">
                        {rel.relationship}
                      </span>
                      <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-sky-300 transition">
                        {rel.title}
                      </h4>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 group-hover:text-white transition pt-1">
                      <span>Read Briefing</span>
                      <ArrowRight className="w-3 h-3 text-sky-400 group-hover:translate-x-0.5 transition" />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Bottom Conversion Banner */}
          <div className="p-8 rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/60 border border-sky-500/30 text-center space-y-5 my-10 shadow-2xl">
            <div className="space-y-2 max-w-xl mx-auto">
              <span className="text-xs font-mono font-bold text-sky-400 uppercase tracking-widest">
                AUTOMATED DISCOVERY
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                Discover What Your AI Can Do
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Scan your repository in under 15 seconds. Browser-based AST analysis. Zero code upload.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
              <button
                onClick={onLaunchScan}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-sky-500/25 transition cursor-pointer flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>{page.cta.primaryText}</span>
              </button>
              <button
                onClick={onOpenBriefing}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 font-semibold text-xs transition cursor-pointer flex items-center justify-center gap-2"
              >
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>{page.cta.secondaryText}</span>
              </button>
            </div>
          </div>
        </article>
      </main>

      {/* Footer Navigation Cluster */}
      <footer className="border-t border-slate-800 bg-slate-950 py-12 px-4 sm:px-6 lg:px-8 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
            <div className="space-y-3">
              <span className="text-xs font-bold text-white font-mono uppercase tracking-wider block">
                Platform
              </span>
              <ul className="space-y-2 text-xs">
                <li>
                  <span onClick={() => onNavigate('/')} className="hover:text-sky-400 cursor-pointer transition">
                    Commercial Overview
                  </span>
                </li>
                <li>
                  <span onClick={() => onNavigate('/ai-governance-platform')} className="hover:text-sky-400 cursor-pointer transition">
                    Platform Architecture
                  </span>
                </li>
                <li>
                  <span onClick={() => onNavigate('/free-ai-governance-scan')} className="hover:text-sky-400 cursor-pointer transition">
                    Free AI Scan
                  </span>
                </li>
                <li>
                  <span onClick={() => onNavigate('/mcp-governance')} className="hover:text-sky-400 cursor-pointer transition">
                    Universal MCP
                  </span>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <span className="text-xs font-bold text-white font-mono uppercase tracking-wider block">
                Framework & Controls
              </span>
              <ul className="space-y-2 text-xs">
                <li>
                  <span onClick={() => onNavigate('/ai-governance')} className="hover:text-sky-400 cursor-pointer transition">
                    Enterprise AI Governance
                  </span>
                </li>
                <li>
                  <span onClick={() => onNavigate('/ai-governance-framework')} className="hover:text-sky-400 cursor-pointer transition">
                    CG-AG Framework (12 Controls)
                  </span>
                </li>
                <li>
                  <span onClick={() => onNavigate('/ai-governance-assessment')} className="hover:text-sky-400 cursor-pointer transition">
                    Governance Assessment
                  </span>
                </li>
                <li>
                  <span onClick={() => onNavigate('/ai-capability-discovery')} className="hover:text-sky-400 cursor-pointer transition">
                    Capability Discovery
                  </span>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <span className="text-xs font-bold text-white font-mono uppercase tracking-wider block">
                Agent Security
              </span>
              <ul className="space-y-2 text-xs">
                <li>
                  <span onClick={() => onNavigate('/ai-agent-governance')} className="hover:text-sky-400 cursor-pointer transition">
                    AI Agent Governance
                  </span>
                </li>
                <li>
                  <span onClick={() => onNavigate('/ai-agent-security')} className="hover:text-sky-400 cursor-pointer transition">
                    AI Agent Security
                  </span>
                </li>
                <li>
                  <span onClick={() => onNavigate('/ai-capability-discovery')} className="hover:text-sky-400 cursor-pointer transition">
                    5-State Epistemic Model
                  </span>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <span className="text-xs font-bold text-white font-mono uppercase tracking-wider block">
                Enterprise & Trust
              </span>
              <ul className="space-y-2 text-xs">
                <li>
                  <span onClick={onOpenBriefing} className="hover:text-sky-400 cursor-pointer transition">
                    15-Minute Briefing
                  </span>
                </li>
                <li>
                  <span onClick={onOpenBriefing} className="hover:text-sky-400 cursor-pointer transition">
                    Private POD Deployment
                  </span>
                </li>
                <li className="pt-2 text-[11px] text-slate-400 font-mono">
                  Zero Code Storage • Client-Side AST
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
            <div className="flex items-center gap-2 font-bold text-slate-300">
              <Shield className="w-4 h-4 text-sky-400" />
              <span>ComplyPRO</span>
              <span className="font-normal text-slate-400">| Know What Your AI Can Do. Govern What It Is Allowed to Do.</span>
            </div>
            <p>© 2026 ComplyPRO. All rights reserved. Built on CG-AG Architecture.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
