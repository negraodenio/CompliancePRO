"""
Phase 4.4 — Assessments Enterprise View.
Connects 12 CG-AG Controls Full Assessment and 10 Dimensions Agentic Light.
Polishes AgentsTeamsView with 'CG-AG Autonomy Tier' and 'Integrity Hash: SHA-256'.
"""
import os

base_dir = r"C:\Users\denio\Documents\Denio\PluginVIbeCOde\standalone-compliance-scanner\src\web"

files = {}

# -----------------------------------------------------------------------------
# 1. Update src/web/views/AgentsTeamsView.tsx (Autonomy label & Hash precision)
# -----------------------------------------------------------------------------
p_agt = os.path.join(base_dir, "views", "AgentsTeamsView.tsx")
with open(p_agt, 'r', encoding='utf-8') as f:
    text_agt = f.read()

# Replace with exact precision
text_agt = text_agt.replace('Autonomy Tier', 'CG-AG Autonomy Tier')
text_agt = text_agt.replace('Digital Signature:</span>', 'Integrity Hash (SHA-256):</span>')
text_agt = text_agt.replace('Digital Signature SHA-256', 'Integrity Hash: SHA-256')
text_agt = text_agt.replace('Verify Cryptographic Signature', 'Verify Tamper-Evident Hash')
files[p_agt] = text_agt

# -----------------------------------------------------------------------------
# 2. src/web/views/AssessmentsView.tsx (Enterprise Assessments Central)
# -----------------------------------------------------------------------------
files[os.path.join(base_dir, "views", "AssessmentsView.tsx")] = '''import React, { useState, useMemo } from 'react';
import { 
  ClipboardCheck, 
  CheckSquare, 
  Sparkles, 
  Layers, 
  Bot, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  ExternalLink, 
  ChevronRight, 
  X, 
  Search, 
  Calendar, 
  UserCheck, 
  FileBadge, 
  Lock, 
  Activity, 
  ArrowUpRight,
  Zap,
  Play
} from 'lucide-react';
import type { ScannerResult } from '../../core/types';
import { CONTROL_LIST } from '../../core/cg-ag-controls';
import { DIMENSION_DEFINITIONS } from '../../core/agentic-light';

export interface AssessmentRecord {
  id: string;
  name: string;
  scope: 'ORGANIZATION' | 'MULTI_AGENT_TEAM' | 'SPECIFIC_AGENT';
  scopeTarget: string;
  frameworkType: 'CG_AG_FULL_12' | 'AGENTIC_LIGHT_10';
  score: number;
  status: 'GOVERNED' | 'ATTENTION' | 'IN_PROGRESS';
  owner: {
    name: string;
    role: string;
  };
  lastRunDate: string;
  nextScheduledDate: string;
  findingsCount: number;
  decisionsRequired: number;
  evidenceDigest: string;
  description: string;
}

const INITIAL_ASSESSMENTS: AssessmentRecord[] = [
  {
    id: 'ASM-2026-001',
    name: 'Enterprise AI Governance Posture Assessment',
    scope: 'ORGANIZATION',
    scopeTarget: 'Acme Financial Group (All 142 AI Entities)',
    frameworkType: 'CG_AG_FULL_12',
    score: 84,
    status: 'GOVERNED',
    owner: { name: 'Roberto Silva', role: 'CISO & AI Office Lead' },
    lastRunDate: '2026-08-27',
    nextScheduledDate: '2026-09-27',
    findingsCount: 3,
    decisionsRequired: 1,
    evidenceDigest: 'DIGEST-84A1-12CTRL-SHA256',
    description: 'Comprehensive audit evaluating all 12 CG-AG Controls across Discover, Govern, Operate, and Assure.'
  },
  {
    id: 'ASM-2026-002',
    name: 'Credit Risk Evaluator Agentic Review',
    scope: 'SPECIFIC_AGENT',
    scopeTarget: 'AGT-CREDIT-911E (Credit Underwriting)',
    frameworkType: 'AGENTIC_LIGHT_10',
    score: 76,
    status: 'ATTENTION',
    owner: { name: 'Carlos DPO', role: 'Data Protection Officer' },
    lastRunDate: '2026-08-26',
    nextScheduledDate: '2026-09-10',
    findingsCount: 2,
    decisionsRequired: 2,
    evidenceDigest: 'DIGEST-76F2-10DIM-SHA256',
    description: 'Rapid Agentic Governance Assessment evaluating 10 critical operational dimensions and HITL triggers.'
  },
  {
    id: 'ASM-2026-003',
    name: 'OmniChannel CX Copilot Readiness',
    scope: 'SPECIFIC_AGENT',
    scopeTarget: 'AGT-SUPPORT-49F1 (Customer CX)',
    frameworkType: 'AGENTIC_LIGHT_10',
    score: 95,
    status: 'GOVERNED',
    owner: { name: 'Juliana Lima', role: 'CX Operations Head' },
    lastRunDate: '2026-08-25',
    nextScheduledDate: '2026-11-25',
    findingsCount: 0,
    decisionsRequired: 0,
    evidenceDigest: 'DIGEST-95C4-10DIM-SHA256',
    description: 'Automated Agentic Light evaluation verifying PII de-identification and tool bounds.'
  },
  {
    id: 'ASM-2026-004',
    name: 'Multi-Agent Wealth Management Group Review',
    scope: 'MULTI_AGENT_TEAM',
    scopeTarget: 'Wealth Management AI Team (3 Agents)',
    frameworkType: 'CG_AG_FULL_12',
    score: 91,
    status: 'GOVERNED',
    owner: { name: 'Mariana Duarte', role: 'Asset Management VP' },
    lastRunDate: '2026-08-24',
    nextScheduledDate: '2026-09-24',
    findingsCount: 1,
    decisionsRequired: 0,
    evidenceDigest: 'DIGEST-91D0-12CTRL-SHA256',
    description: 'Quarterly compliance assessment on automated rebalancing, circuit breakers, and FinOps quotas.'
  }
];

export const AssessmentsView: React.FC<{ result?: ScannerResult | null }> = ({ result }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFramework, setFilterFramework] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [selectedAssessment, setSelectedAssessment] = useState<AssessmentRecord | null>(null);
  const [activeTab, setActiveTab] = useState<'matrix' | 'findings' | 'pipeline' | 'evidence'>('matrix');

  const filteredAssessments = useMemo(() => {
    return INITIAL_ASSESSMENTS.filter(a => {
      const matchSearch = a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          a.scopeTarget.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          a.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          a.owner.name.toLowerCase().includes(searchTerm.toLowerCase());

      const matchFramework = filterFramework === 'ALL' || a.frameworkType === filterFramework;
      const matchStatus = filterStatus === 'ALL' || a.status === filterStatus;

      return matchSearch && matchFramework && matchStatus;
    });
  }, [searchTerm, filterFramework, filterStatus]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
            <span>Discover Pillar</span>
            <span>·</span>
            <span>Enterprise Assessment Hub</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5 flex items-center gap-2">
            <span>Governance & Agentic Assessments</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold font-mono-code">
              {filteredAssessments.length} Completed
            </span>
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            System of assessment unifying the <strong>12 CG-AG Governance Controls</strong> (Systemic Model) and <strong>10 Agentic Light Dimensions</strong> (Agent Assessment).
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setSelectedAssessment(INITIAL_ASSESSMENTS[0])}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold shadow-xs transition"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Launch New Assessment</span>
          </button>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="p-3 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl elevation-card flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search assessment name, target scope, owner, or digest..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-sky-500 transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Framework Filter */}
          <select
            value={filterFramework}
            onChange={(e) => setFilterFramework(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-sky-500"
          >
            <option value="ALL">All Frameworks</option>
            <option value="CG_AG_FULL_12">12 Controls (CG-AG Full)</option>
            <option value="AGENTIC_LIGHT_10">10 Dimensions (Agentic Light)</option>
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-sky-500"
          >
            <option value="ALL">All Status</option>
            <option value="GOVERNED">🟢 Governed</option>
            <option value="ATTENTION">🟡 Attention Required</option>
          </select>
        </div>
      </div>

      {/* ASSESSMENTS DATA TABLE */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl elevation-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold">
              <tr>
                <th className="py-3 px-4">Assessment Name / ID</th>
                <th className="py-3 px-4">Scope Target</th>
                <th className="py-3 px-4">Framework</th>
                <th className="py-3 px-4">Score</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Accountable Owner</th>
                <th className="py-3 px-4">Last Run</th>
                <th className="py-3 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredAssessments.map((item) => {
                const isGoverned = item.status === 'GOVERNED';
                const isFull = item.frameworkType === 'CG_AG_FULL_12';

                return (
                  <tr
                    key={item.id}
                    onClick={() => setSelectedAssessment(item)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition cursor-pointer group"
                  >
                    {/* Name & ID */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors flex items-center gap-1.5">
                        <ClipboardCheck className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                        <span>{item.name}</span>
                      </div>
                      <div className="font-mono-code text-[10px] text-slate-400 mt-0.5">{item.id}</div>
                    </td>

                    {/* Scope Target */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-medium text-slate-800 dark:text-slate-200">{item.scopeTarget}</div>
                      <div className="text-[10px] text-slate-400">{item.scope.replace('_', ' ')}</div>
                    </td>

                    {/* Framework Badge */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isFull 
                          ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                          : 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                      }`}>
                        {isFull ? '12 Controls Full' : '10 Dims Light'}
                      </span>
                    </td>

                    {/* Score */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-bold text-slate-900 dark:text-white text-sm">{item.score}%</div>
                      <div className="text-[10px] text-slate-400">{item.findingsCount} findings</div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                        isGoverned
                          ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          : 'bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isGoverned ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        {item.status}
                      </span>
                    </td>

                    {/* Owner */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-medium text-slate-800 dark:text-slate-200">{item.owner.name}</div>
                      <div className="text-[10px] text-slate-400">{item.owner.role}</div>
                    </td>

                    {/* Last Run */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 dark:text-slate-400 font-mono-code text-[11px]">
                      {item.lastRunDate}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedAssessment(item);
                        }}
                        className="text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 font-semibold text-xs inline-flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform"
                      >
                        Inspect <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* RIGHT-SIDE SLIDE-OVER DETAIL & EXECUTION DRAWER */}
      {selectedAssessment && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-xs flex justify-end animate-fadeIn">
          <div className="w-full max-w-2xl bg-white dark:bg-[#0f172a] border-l border-slate-200 dark:border-slate-800 h-full shadow-2xl flex flex-col justify-between overflow-y-auto">
            <div>
              {/* Drawer Top */}
              <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between bg-slate-50/50 dark:bg-slate-900/40">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono-code text-xs font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950 px-2 py-0.5 rounded border border-sky-200 dark:border-sky-800">
                      {selectedAssessment.id}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {selectedAssessment.frameworkType === 'CG_AG_FULL_12' ? '12 CG-AG Controls' : '10 Agentic Light Dimensions'}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-2">
                    {selectedAssessment.name}
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    {selectedAssessment.description}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedAssessment(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Tabs */}
              <div className="flex border-b border-slate-200 dark:border-slate-800 px-5 text-xs font-semibold">
                {(['matrix', 'findings', 'pipeline', 'evidence'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`py-3 px-3 border-b-2 capitalize transition ${
                      activeTab === tab
                        ? 'border-sky-600 text-sky-600 dark:text-sky-400 font-bold'
                        : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    {tab === 'matrix' ? (selectedAssessment.frameworkType === 'CG_AG_FULL_12' ? '12 Controls Matrix' : '10 Dimensions Matrix') : tab}
                  </button>
                ))}
              </div>

              {/* Drawer Tab Contents */}
              <div className="p-6 space-y-5 text-xs">
                {/* 1. MATRIX (Controls or Dimensions) */}
                {activeTab === 'matrix' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white">
                        Evaluation Breakdown ({selectedAssessment.score}%)
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono-code">Scope: {selectedAssessment.scopeTarget}</span>
                    </div>

                    {selectedAssessment.frameworkType === 'CG_AG_FULL_12' ? (
                      <div className="grid grid-cols-2 gap-2">
                        {CONTROL_LIST.map((ctrl) => (
                          <div key={ctrl.id} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex justify-between items-center">
                            <div>
                              <div className="font-mono-code text-[10px] text-sky-600 dark:text-sky-400 font-bold">{ctrl.id}</div>
                              <div className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[170px]">{ctrl.name}</div>
                            </div>
                            <span className="text-[10px] font-bold text-emerald-500">✓ Effective</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {DIMENSION_DEFINITIONS.map((dim) => (
                          <div key={dim.id} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex justify-between items-center">
                            <div>
                              <div className="font-mono-code text-[10px] text-sky-600 dark:text-sky-400 font-bold">DIM-{dim.id}</div>
                              <div className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[170px]">{dim.name}</div>
                            </div>
                            <span className="text-[10px] font-bold text-emerald-500">✓ Verified</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 2. FINDINGS */}
                {activeTab === 'findings' && (
                  <div className="space-y-3">
                    <div className="font-bold text-slate-800 dark:text-slate-200">Assessment Findings & Exposure Gaps</div>
                    {selectedAssessment.findingsCount > 0 ? (
                      <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                            🟡 CONDITIONAL FINDING
                          </span>
                          <span className="font-mono-code text-slate-400">CG-AG-03</span>
                        </div>
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          Autonomous execution threshold lacks Tier-2 HITL fallback confirmation.
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Recommended Action: Enforce mandatory escalation trigger for loan approvals over R$ 50,000.
                        </p>
                      </div>
                    ) : (
                      <div className="p-6 text-center text-slate-400 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800">
                        ✓ 0 Exposure Gaps or non-compliant controls detected during this assessment run.
                      </div>
                    )}
                  </div>
                )}

                {/* 3. CAUSAL PIPELINE */}
                {activeTab === 'pipeline' && (
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="font-bold text-slate-800 dark:text-slate-200">Governance Causal Pipeline Alignment</div>
                    <div className="space-y-2 font-mono-code text-[11px] text-slate-700 dark:text-slate-300">
                      <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded">1. Assessment Scope: {selectedAssessment.scopeTarget}</div>
                      <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded">2. Controls Evaluated: {selectedAssessment.frameworkType}</div>
                      <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded">3. Human Accountable Lead: {selectedAssessment.owner.name} ({selectedAssessment.owner.role})</div>
                      <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded">4. Computed Governance Score: {selectedAssessment.score}%</div>
                    </div>
                  </div>
                )}

                {/* 4. EVIDENCE */}
                {activeTab === 'evidence' && (
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Lock className="w-4 h-4 text-emerald-500" />
                      <span>Tamper-Evident Assessment Digest</span>
                    </div>
                    <div className="font-mono-code text-[11px] p-2.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-700 dark:text-slate-300">
                      Digest: {selectedAssessment.evidenceDigest}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      This assessment is cryptographically sealed and chained into the Tamper-Evident Audit Ledger.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-mono-code">Next Run: {selectedAssessment.nextScheduledDate}</span>
              <button
                onClick={() => setSelectedAssessment(null)}
                className="px-4 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-semibold transition"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
'''

# -----------------------------------------------------------------------------
# 3. Update src/web/App.tsx to wire up AssessmentsView
# -----------------------------------------------------------------------------
p_app = os.path.join(base_dir, "App.tsx")
with open(p_app, 'r', encoding='utf-8') as f:
    text_app = f.read()

# Add import
if 'AssessmentsView' not in text_app:
    text_app = text_app.replace("import { AgentsTeamsView } from './views/AgentsTeamsView';", "import { AgentsTeamsView } from './views/AgentsTeamsView';\nimport { AssessmentsView } from './views/AssessmentsView';")

# Add route
if 'activeView === \'discover-assessments\'' not in text_app:
    text_app = text_app.replace("{activeView === 'discover-passports' && (", "{activeView === 'discover-assessments' && (\n            <AssessmentsView \n              result={scanResult}\n            />\n          )}\n\n          {activeView === 'discover-passports' && (")

# Update fallback condition
text_app = text_app.replace("!['overview-center', 'discover-inventory', 'discover-agents', 'discover-passports', 'tools-scanner', 'govern-controls'].includes(activeView)", "!['overview-center', 'discover-inventory', 'discover-agents', 'discover-passports', 'discover-assessments', 'tools-scanner', 'govern-controls'].includes(activeView)")

files[p_app] = text_app

# Write all files
for file_path, content in files.items():
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"UPDATED: {file_path}")

print("PHASE 4.4 ASSESSMENTS VIEW ASSEMBLED!")
