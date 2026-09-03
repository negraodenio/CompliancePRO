import os

section_code = '''import React, { useState } from 'react';
import { 
  Bot, 
  Layers, 
  Shield, 
  Terminal, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight, 
  Code2, 
  Database, 
  FileBadge, 
  ShieldAlert, 
  Server, 
  Globe, 
  Building2, 
  Check 
} from 'lucide-react';

interface UniversalMcpSectionProps {
  onOpenAuth: (mode?: 'login' | 'signup') => void;
  onExploreMcp?: () => void;
}

export const UniversalMcpSection: React.FC<UniversalMcpSectionProps> = ({
  onOpenAuth,
  onExploreMcp
}) => {
  const [activeTab, setActiveTab] = useState<'tools' | 'resources' | 'prompts'>('tools');
  const [activeToolCategory, setActiveToolCategory] = useState<'all' | 'discovery' | 'governance' | 'evidence' | 'security'>('all');
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  const mcpConfigSnippet = `{
  "mcpServers": {
    "cgag-governance": {
      "command": "npx",
      "args": ["-y", "tsx", "src/mcp/server.ts"],
      "env": {
        "CGAG_MCP_AUTH_TOKEN": "sk-your-enterprise-token"
      }
    }
  }
}`;

  const copyConfig = () => {
    navigator.clipboard.writeText(mcpConfigSnippet);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2500);
  };

  const toolCategories = [
    { id: 'all', label: 'All 14 Tools', count: 14 },
    { id: 'discovery', label: 'Discovery (5)', count: 5 },
    { id: 'governance', label: 'Governance (4)', count: 4 },
    { id: 'evidence', label: 'Evidence & Audit (3)', count: 3 },
    { id: 'security', label: 'Security & Ops (2)', count: 2 },
  ];

  const toolsList = [
    {
      name: 'scan_repository',
      category: 'discovery',
      risk: 'EXECUTE',
      riskColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      description: 'Executes comprehensive static AST analysis across all agent definitions, capabilities, and dependencies.',
      params: 'targetDir: string, options?: object'
    },
    {
      name: 'get_scan_summary',
      category: 'discovery',
      risk: 'READ',
      riskColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      description: 'Retrieves high-level compliance score, risk level, agent counts, and violation breakdown.',
      params: 'targetDir?: string'
    },
    {
      name: 'discover_agents',
      category: 'discovery',
      risk: 'READ',
      riskColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      description: 'Discovers all autonomous AI agents (CrewAI, LangChain, AutoGen, OpenAI Assistants, Anthropic).',
      params: 'targetDir?: string'
    },
    {
      name: 'discover_capabilities',
      category: 'discovery',
      risk: 'READ',
      riskColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      description: 'Identifies capabilities with 5-state epistemic classification (OBSERVED vs DECLARED) and 10 anomaly tags.',
      params: 'targetDir?: string'
    },
    {
      name: 'detect_shadow_apis',
      category: 'discovery',
      risk: 'READ',
      riskColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      description: 'Flags undeclared outbound REST endpoints, LLM API calls, and third-party SaaS invocations.',
      params: 'targetDir?: string'
    },
    {
      name: 'get_agent_passport',
      category: 'governance',
      risk: 'READ',
      riskColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      description: 'Generates an immutable Verifiable Agent Governance Passport with digital signature and accountability chain.',
      params: 'agentName?: string, targetDir?: string'
    },
    {
      name: 'get_business_xray',
      category: 'governance',
      risk: 'READ',
      riskColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      description: 'Extracts end-to-end SIPOC business architecture with per-stage DerivationConfidence scoring.',
      params: 'agentName?: string, targetDir?: string'
    },
    {
      name: 'get_governance_controls',
      category: 'governance',
      risk: 'READ',
      riskColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      description: 'Returns the 12 canonical CG-AG Controls and active organizational governance policies.',
      params: 'none'
    },
    {
      name: 'get_governance_snapshot',
      category: 'governance',
      risk: 'READ',
      riskColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      description: 'Returns a complete 4-pillar snapshot (Discover, Govern, Operate, Assure) with system health metrics.',
      params: 'none'
    },
    {
      name: 'get_audit_ledger',
      category: 'evidence',
      risk: 'READ',
      riskColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      description: 'Retrieves chronological cryptographic audit blocks sealed with real FIPS 180-4 SHA-256 standard.',
      params: 'limit?: number, blockHeight?: number'
    },
    {
      name: 'verify_audit_ledger',
      category: 'evidence',
      risk: 'READ',
      riskColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      description: 'Cryptographically verifies the entire SHA-256 ledger block chain from Genesis to current tip.',
      params: 'none'
    },
    {
      name: 'get_evidence_records',
      category: 'evidence',
      risk: 'READ',
      riskColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      description: 'Retrieves RFC 8785 Canonical JSON protected evidence records and integrity digests.',
      params: 'limit?: number, evidenceType?: string'
    },
    {
      name: 'get_tenant_context',
      category: 'security',
      risk: 'READ',
      riskColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      description: 'Returns the session-bound tenant, workspace, user ID, active roles, and authorization matrix.',
      params: 'none'
    },
    {
      name: 'get_mcp_server_info',
      category: 'security',
      risk: 'READ',
      riskColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      description: 'Returns server metadata, capability registry, cryptographic standards, and governance invariants.',
      params: 'none'
    }
  ];

  const filteredTools = activeToolCategory === 'all' 
    ? toolsList 
    : toolsList.filter(t => t.category === activeToolCategory);

  const resourcesList = [
    { uri: 'cgag://controls', title: 'Canonical 12 Controls', scope: 'Global Standard', desc: 'The normative 12 CG-AG controls and regulatory mappings (EU AI Act, LGPD, NIST AI RMF, ISO 42001, DORA).' },
    { uri: 'cgag://policies', title: 'Governance Policies', scope: 'Tenant Scoped', desc: 'Active organizational guardrails, runtime rules, enforcement modes, and recorded policy exceptions.' },
    { uri: 'cgag://ledger', title: 'Audit Ledger Chain', scope: 'Tenant Scoped', desc: 'Immutable chronological audit trail sealed with standard SHA-256 chained hashes.' },
    { uri: 'cgag://ledger/{blockHeight}', title: 'Single Audit Block', scope: 'Block Query', desc: 'Direct lookup of a specific ledger block by height with transaction digests and parent hashes.' },
    { uri: 'cgag://evidence', title: 'Protected Evidence Records', scope: 'Tenant Scoped', desc: 'Cryptographically sealed evidence records with RFC 8785 Canonical JSON formatting.' },
    { uri: 'cgag://evidence/{id}', title: 'Evidence by ID', scope: 'Record Query', desc: 'Direct retrieval of individual evidence records with source provenance and verification signatures.' },
    { uri: 'cgag://tenant', title: 'Tenant Session Context', scope: 'Session Bound', desc: 'Authenticated organization identity, workspace binding, and effective RBAC role matrix.' }
  ];

  const promptsList = [
    {
      id: 'executive_governance_review',
      name: 'Executive Governance Review',
      lens: 'Boardroom / Executive',
      desc: 'Guides the AI agent to summarize overall compliance posture, critical risk exposures, and strategic governance health.',
      args: 'targetDir: string, includeScorecard?: boolean'
    },
    {
      id: 'ciso_security_review',
      name: 'CISO Security Review',
      lens: 'Security & AppSec',
      desc: 'Directs the agent to inspect Shadow AI, unauthenticated outbound APIs, excessive tool permissions, and destructive capability flags.',
      args: 'targetDir: string, checkDestructiveActions?: boolean'
    },
    {
      id: 'dpo_privacy_review',
      name: 'DPO Privacy Review',
      lens: 'Legal & Data Protection',
      desc: 'Conducts automated PII discovery, LGPD Art. 38 RIPD conformity evaluation, and EU AI Act Annex III data minimization audits.',
      args: 'targetDir: string, regulation?: string'
    },
    {
      id: 'vendor_risk_assessment',
      name: 'Vendor Risk Assessment',
      lens: 'Third-Party AI & M&A',
      desc: 'Generates vendor AI risk scorecards based on observed vs declared capabilities, external model dependencies, and license boundaries.',
      args: 'targetDir: string, vendorName: string'
    }
  ];

  const supportedClients = [
    { name: 'Claude Desktop', type: 'Native Stdio' },
    { name: 'Claude Code', type: 'CLI / Stdio' },
    { name: 'Gemini / Antigravity', type: 'Agent Native' },
    { name: 'Cursor IDE', type: 'IDE Stdio' },
    { name: 'VS Code (MCP)', type: 'Plugin Stdio' },
    { name: 'OpenCode / Custom Agents', type: 'Stdio & SSE' }
  ];

  return (
    <section id="universal-mcp" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-16">
      
      {/* 1. SECTION HEADER */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-indigo-500/10 to-sky-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-mono font-bold tracking-wider uppercase">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Universal MCP Architecture</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          ONE GOVERNANCE ENGINE. <br className="hidden sm:inline" />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-sky-400 via-indigo-400 to-cyan-300">
            THREE WAYS TO CONSUME IT.
          </span>
        </h2>
        <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
          The same CG-AG platform your teams use in the browser can now be consumed natively by AI agents and IDEs through the Model Context Protocol.
        </p>
      </div>

      {/* 2. THE THREE DELIVERY SURFACES (SaaS, POD, MCP) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Surface 1: SaaS */}
        <div className="p-7 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <Globe className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <span className="text-[11px] font-mono font-bold text-sky-400 uppercase tracking-wider">Delivery Surface 1</span>
              <h3 className="text-xl font-bold text-white">CG-AG SaaS</h3>
              <p className="text-xs font-medium text-slate-400">Human Governance Workspace</p>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Multi-tenant web interface for CISO, DPO, AI Office, Security and Governance teams. Interactive dashboards, policy configuration, and visual audit ledgers.
            </p>
          </div>
          <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-1">
            <span className="font-semibold text-slate-300">Primary Users:</span>
            <p>CISO • DPO • Compliance • AI Governance Lead</p>
          </div>
        </div>

        {/* Surface 2: POD */}
        <div className="p-7 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Building2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <span className="text-[11px] font-mono font-bold text-indigo-400 uppercase tracking-wider">Delivery Surface 2</span>
              <h3 className="text-xl font-bold text-white">CG-AG POD</h3>
              <p className="text-xs font-medium text-slate-400">Dedicated Enterprise Deployment</p>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Isolated enterprise instance for tier-1 banks, healthcare organizations, and regulated institutions requiring air-gapped or private cloud sovereignty.
            </p>
          </div>
          <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-1">
            <span className="font-semibold text-slate-300">Target Environments:</span>
            <p>Air-Gapped • Private VPC • Sovereign On-Prem</p>
          </div>
        </div>

        {/* Surface 3: MCP */}
        <div className="p-7 rounded-2xl bg-gradient-to-b from-indigo-950/40 via-slate-900/80 to-slate-900/60 border-2 border-indigo-500/40 hover:border-indigo-500/60 transition space-y-4 flex flex-col justify-between shadow-xl shadow-indigo-500/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 px-3 py-1 bg-indigo-600 text-white font-mono text-[10px] font-bold rounded-bl-xl uppercase tracking-wider">
            Agent-Native
          </div>
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300">
              <Bot className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <span className="text-[11px] font-mono font-bold text-indigo-300 uppercase tracking-wider">Delivery Surface 3</span>
              <h3 className="text-xl font-bold text-white">Universal MCP</h3>
              <p className="text-xs font-medium text-indigo-200">Agent-Native Governance Interface</p>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed">
              Standardized Model Context Protocol interface exposing the entire CG-AG engine directly to Claude, Cursor, Gemini, VS Code, and autonomous AI agents.
            </p>
          </div>
          <div className="pt-3 border-t border-indigo-500/30 text-[11px] text-slate-300 space-y-1">
            <span className="font-semibold text-indigo-200">Supported Consumers:</span>
            <p>Claude • Gemini • Cursor • VS Code • OpenCode</p>
          </div>
        </div>

      </div>

      {/* 3. INTERACTIVE ARCHITECTURE DIAGRAM */}
      <div className="p-8 sm:p-12 rounded-3xl bg-slate-950 border border-slate-800 space-y-8 relative overflow-hidden">
        <div className="max-w-3xl space-y-2">
          <span className="text-xs font-mono font-bold tracking-widest text-indigo-400 uppercase">
            AGENT-NATIVE CONTROL PLANE
          </span>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
            Make Your AI Agents Governance-Aware
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            AI agents no longer need to operate outside the governance perimeter. With CG-AG Universal MCP, compatible agents can discover systems, inspect capabilities, evaluate controls, and verify evidence through a standard interface.
          </p>
        </div>

        {/* Visual Architecture Flow */}
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-center">
            
            {/* Box 1: Agent */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-2">
              <Bot className="w-6 h-6 text-indigo-400 mx-auto" />
              <div className="text-xs font-bold text-white">AI Agent / IDE</div>
              <p className="text-[10px] text-slate-400">Claude, Cursor, Gemini, VS Code</p>
            </div>

            {/* Connection Arrow 1 */}
            <div className="flex flex-col items-center justify-center text-slate-500 text-xs font-mono">
              <span className="hidden lg:inline text-[11px] text-indigo-400 font-bold mb-1">MCP Protocol</span>
              <ArrowRight className="w-5 h-5 hidden lg:block text-indigo-400" />
              <span className="lg:hidden text-[10px] text-indigo-400">↓ MCP Protocol ↓</span>
            </div>

            {/* Box 2: Universal MCP */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-950/80 to-slate-950 border-2 border-indigo-500/50 text-center space-y-2 shadow-lg">
              <Server className="w-6 h-6 text-indigo-300 mx-auto" />
              <div className="text-xs font-extrabold text-white">CG-AG Universal MCP</div>
              <p className="text-[10px] text-indigo-300">14 Tools • 7 Resources • 4 Prompts</p>
            </div>

            {/* Connection Arrow 2 */}
            <div className="flex flex-col items-center justify-center text-slate-500 text-xs font-mono">
              <span className="hidden lg:inline text-[11px] text-sky-400 font-bold mb-1">Fail-Closed RBAC</span>
              <ArrowRight className="w-5 h-5 hidden lg:block text-sky-400" />
              <span className="lg:hidden text-[10px] text-sky-400">↓ Fail-Closed RBAC ↓</span>
            </div>

            {/* Box 3: Engine */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-2">
              <Shield className="w-6 h-6 text-sky-400 mx-auto" />
              <div className="text-xs font-bold text-white">CG-AG Platform Core</div>
              <p className="text-[10px] text-slate-400">Discovery • Passports • SHA-256 Ledger</p>
            </div>

          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-center text-xs">
            <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <span className="text-[10px] font-mono text-slate-400 block">Discovery Engine</span>
              <span className="font-bold text-white text-xs">5-State AST Scanning</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <span className="text-[10px] font-mono text-slate-400 block">Governance Triad</span>
              <span className="font-bold text-white text-xs">Passports & SIPOC X-Ray</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <span className="text-[10px] font-mono text-slate-400 block">Assurance Layer</span>
              <span className="font-bold text-white text-xs">Real SHA-256 Ledger</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <span className="text-[10px] font-mono text-slate-400 block">Security Gates</span>
              <span className="font-bold text-white text-xs">Session RBAC + Multi-Tenant</span>
            </div>
          </div>
        </div>

      </div>

      {/* 4. MCP SURFACE EXPLORER: 14 TOOLS, 7 RESOURCES, 4 PROMPTS */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-mono font-bold tracking-widest text-indigo-400 uppercase">
              STANDARDIZED MCP INTERFACE
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
              Complete CG-AG Capability Surface
            </h3>
          </div>

          {/* Tab Selector */}
          <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold">
            <button
              onClick={() => setActiveTab('tools')}
              className={`px-4 py-2 rounded-lg transition cursor-pointer ${
                activeTab === 'tools' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              14 Tools
            </button>
            <button
              onClick={() => setActiveTab('resources')}
              className={`px-4 py-2 rounded-lg transition cursor-pointer ${
                activeTab === 'resources' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              7 Resources
            </button>
            <button
              onClick={() => setActiveTab('prompts')}
              className={`px-4 py-2 rounded-lg transition cursor-pointer ${
                activeTab === 'prompts' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              4 Guided Prompts
            </button>
          </div>
        </div>

        {/* VIEW 1: TOOLS */}
        {activeTab === 'tools' && (
          <div className="space-y-4 animate-fadeIn">
            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              {toolCategories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveToolCategory(cat.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    activeToolCategory === cat.id 
                      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40' 
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Tool Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredTools.map((tool, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/40 transition space-y-2 group">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-white group-hover:text-indigo-300 transition truncate">
                      {tool.name}
                    </span>
                    <span className={`text-[10px] font-mono font-extrabold px-2 py-0.5 rounded border ${tool.riskColor}`}>
                      {tool.risk}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {tool.description}
                  </p>
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span className="truncate">params: {tool.params}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 2: RESOURCES */}
        {activeTab === 'resources' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/20 text-xs text-indigo-200">
              <span className="font-bold">GOVERNANCE DATA, NOT JUST TOOL CALLS:</span> AI agents can directly resolve structured governance resources preserving session boundaries, tenant isolation, and cryptographic integrity.
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {resourcesList.map((res, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/40 transition space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
                      {res.uri}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
                      {res.scope}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white">{res.title}</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">{res.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 3: PROMPTS */}
        {activeTab === 'prompts' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/20 text-xs text-indigo-200">
              <span className="font-bold">GIVE EVERY AI AGENT A GOVERNANCE LENS:</span> Guided multi-turn prompts instruct external LLMs to systematically inspect codebases while strictly preserving epistemic boundaries.
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {promptsList.map((prompt, idx) => (
                <div key={idx} className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/40 transition space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-indigo-300">{prompt.id}</span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                      {prompt.lens}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white">{prompt.name}</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">{prompt.desc}</p>
                  <div className="pt-2 border-t border-slate-800/80 text-[10px] font-mono text-slate-400">
                    arguments: {prompt.args}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* 5. EPISTEMIC DIFFERENTIATOR & SECURITY GATES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Epistemic Differentiator */}
        <div className="p-8 rounded-3xl bg-slate-950 border border-slate-800 space-y-5">
          <div className="space-y-2">
            <span className="text-xs font-mono font-bold tracking-widest text-amber-400 uppercase">
              EPISTEMIC RIGOR
            </span>
            <h3 className="text-xl sm:text-2xl font-extrabold text-white">
              Your Agent Should Know What Is Observed. <br />
              And What Is Not Verified.
            </h3>
          </div>

          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 font-mono text-xs font-bold flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>OBSERVED_CAPABILITY ≠ AUTHORIZED_CAPABILITY</span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            CG-AG enforces a strict epistemological model in every MCP response. When an agent discovers an API key or an SDK import, it classifies what was detected versus what was formally authorized.
          </p>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
              <span className="text-emerald-400 block font-bold">DIRECTLY_DERIVED</span>
              <span className="text-[10px] text-slate-400">Concrete AST evidence</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
              <span className="text-sky-400 block font-bold">INFERRED</span>
              <span className="text-[10px] text-slate-400">Probabilistic context</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
              <span className="text-amber-400 block font-bold">NOT_VERIFIED</span>
              <span className="text-[10px] text-slate-400">Unattested capability</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
              <span className="text-rose-400 block font-bold">UNKNOWN_AUTH</span>
              <span className="text-[10px] text-slate-400">Missing policy proof</span>
            </div>
          </div>
        </div>

        {/* Governed Access Security Strip */}
        <div className="p-8 rounded-3xl bg-slate-950 border border-slate-800 space-y-5 flex flex-col justify-between">
          <div className="space-y-2">
            <span className="text-xs font-mono font-bold tracking-widest text-emerald-400 uppercase">
              ENTERPRISE SECURITY MODEL
            </span>
            <h3 className="text-xl sm:text-2xl font-extrabold text-white">
              Governed Access. Not Blind Access.
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Connecting an AI agent to CG-AG does not grant unrestricted access. All interactions execute through authenticated session context, tenant isolation boundaries, and RBAC authorization matrices.
            </p>
          </div>

          <div className="space-y-2.5 text-xs text-slate-300">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Fail-Closed Authentication:</strong> Unauthenticated production requests fail immediately with zero privilege escalation.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Strict Multi-Tenant Isolation:</strong> Tenant context derived from cryptographic token; tool arguments cannot override tenant.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Zero Secret Leakage:</strong> Credentials, raw tokens, and environment values are systematically masked before serialization.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Path Traversal Protection:</strong> All file queries sandboxed within project workspace boundaries.</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400 font-mono">
            Cryptographic Integrity: FIPS 180-4 Standard Real SHA-256 Chained Blocks
          </div>
        </div>

      </div>

      {/* 6. CLIENT COMPATIBILITY & CONFIGURATION SNIPPET */}
      <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950/30 border border-slate-800 space-y-8">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <span className="text-xs font-mono font-bold tracking-widest text-indigo-400 uppercase">
              AGENT STACK INTEGRATION
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
              Your AI Stack. Governance Connected.
            </h3>
            <p className="text-xs sm:text-sm text-slate-300">
              Compatible with standards-based Model Context Protocol clients and tested agent development environments.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {supportedClients.map((client, idx) => (
              <div key={idx} className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center gap-2 text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-bold text-white">{client.name}</span>
                <span className="text-[10px] text-slate-400 font-mono">({client.type})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Config Snippet Box */}
        <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <Terminal className="w-4 h-4 text-indigo-400" />
              <span>mcp_config.json / claude_desktop_config.json</span>
            </div>
            <button
              onClick={copyConfig}
              className="px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs font-mono text-indigo-300 border border-slate-700 flex items-center gap-1.5 cursor-pointer transition"
            >
              {copiedSnippet ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Code2 className="w-3.5 h-3.5" />}
              <span>{copiedSnippet ? 'Copied to Clipboard!' : 'Copy Config'}</span>
            </button>
          </div>
          <pre className="p-4 rounded-xl bg-slate-900/90 text-xs font-mono text-sky-300 overflow-x-auto border border-slate-800/80">
            {mcpConfigSnippet}
          </pre>
        </div>

      </div>

      {/* 7. SECTION CTA BANNER */}
      <div className="p-8 sm:p-10 rounded-2xl bg-gradient-to-r from-indigo-950 via-slate-900 to-sky-950 border border-indigo-500/30 text-center space-y-4">
        <h3 className="text-xl sm:text-2xl font-extrabold text-white">
          Connect Your AI Stack to Governance.
        </h3>
        <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mx-auto">
          Start with a free repository scan or deploy the Universal MCP in your dedicated environment.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => {
              if (onExploreMcp) onExploreMcp();
              else window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-sky-500 hover:from-indigo-400 hover:to-sky-400 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 cursor-pointer transition"
          >
            <Sparkles className="w-4 h-4" />
            <span>Explore CG-AG MCP</span>
          </button>
          <button
            onClick={() => onOpenAuth('signup')}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white border border-slate-700 font-bold text-xs transition cursor-pointer"
          >
            Request Enterprise Access
          </button>
        </div>
      </div>

    </section>
  );
};
'''

target = r'c:\Users\denio\Documents\Denio\PluginVIbeCOde\standalone-compliance-scanner\src\web\components\UniversalMcpSection.tsx'
with open(target, 'w', encoding='utf-8') as f:
    f.write(section_code)
print('[SUCCESS] Generated UniversalMcpSection.tsx')

# Now update CommercialLandingView.tsx to import and include UniversalMcpSection
lp_file = r'c:\Users\denio\Documents\Denio\PluginVIbeCOde\standalone-compliance-scanner\src\web\views\CommercialLandingView.tsx'
with open(lp_file, 'r', encoding='utf-8') as f:
    lp_content = f.read()

# Add import
if 'UniversalMcpSection' not in lp_content:
    import_stmt = "import { UniversalMcpSection } from '../components/UniversalMcpSection';"
    lp_content = lp_content.replace(
        "import { FreeScanSnapshotView } from '../components/FreeScanSnapshotView';",
        "import { FreeScanSnapshotView } from '../components/FreeScanSnapshotView';\n" + import_stmt
    )

# Add nav link if not present
if 'href="#universal-mcp"' not in lp_content:
    old_nav = '<a href="#compliance" className="hover:text-sky-400 transition">Global Frameworks</a>'
    new_nav = old_nav + '\n            <a href="#universal-mcp" className="hover:text-indigo-400 text-indigo-300 font-bold transition flex items-center gap-1"><Sparkles className="w-3.5 h-3.5 text-indigo-400" /><span>Universal MCP</span></a>'
    lp_content = lp_content.replace(old_nav, new_nav)

# Add UniversalMcpSection above the final conversion banner or after compliance section
if '<UniversalMcpSection' not in lp_content:
    old_section_insertion = '{/* ========================================================================= */}\n        {/* 7. FINAL CONVERSION BANNER */}'
    new_section_insertion = '{/* ========================================================================= */}\n        {/* UNIVERSAL MCP ENTERPRISE INTEGRATION */}\n        {/* ========================================================================= */}\n        <UniversalMcpSection onOpenAuth={onOpenAuth} onExploreMcp={scrollToScanner} />\n\n        ' + old_section_insertion
    lp_content = lp_content.replace(old_section_insertion, new_section_insertion)

with open(lp_file, 'w', encoding='utf-8') as f:
    f.write(lp_content)
print('[SUCCESS] Updated CommercialLandingView.tsx with UniversalMcpSection')
