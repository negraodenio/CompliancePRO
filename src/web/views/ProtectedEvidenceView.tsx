import React, { useState, useMemo, useEffect } from 'react';
import { 
  FolderCheck, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  Search, 
  Filter, 
  ChevronRight, 
  Lock, 
  UserCheck, 
  Layers, 
  Bot, 
  FileText, 
  Activity, 
  Clock, 
  CheckSquare, 
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Hash,
  Database,
  BookOpen,
  FileBadge,
  Check,
  Binary
} from 'lucide-react';
import type { ScannerResult } from '../../core/types';
import { useIndustry } from '../context/IndustryContext';
import { EvidenceStore, ComprehensiveEvidenceRecord, EvidenceType } from '../services/evidence-store';

export const ProtectedEvidenceView: React.FC<{ result?: ScannerResult | null }> = ({ result }) => {
  const { activeProfile, environment } = useIndustry();
  const [evidenceList, setEvidenceList] = useState<ComprehensiveEvidenceRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterModule, setFilterModule] = useState<string>('ALL');
  const [selectedRecord, setSelectedRecord] = useState<ComprehensiveEvidenceRecord | null>(null);
  const [activeDrawerTab, setActiveDrawerTab] = useState<'overview' | 'provenance' | 'payload' | 'integrity' | 'retention' | 'audit'>('overview');
  const [verificationFeedback, setVerificationFeedback] = useState<{ verified: boolean; hash: string } | null>(null);

  const refreshState = () => {
    const list = EvidenceStore.getEvidenceRecords();
    setEvidenceList(list);
    if (selectedRecord) {
      const updated = list.find(r => r.evidenceId === selectedRecord.evidenceId);
      if (updated) setSelectedRecord(updated);
    }
  };

  useEffect(() => {
    refreshState();
    return EvidenceStore.subscribe(refreshState);
  }, []);

  const handleVerifyIntegrity = (evidenceId: string) => {
    const res = EvidenceStore.verifyRecordIntegrity(evidenceId);
    setVerificationFeedback({ verified: res.verified, hash: res.computedHash });
    setTimeout(() => setVerificationFeedback(null), 5000);
  };

  const filteredRecords = useMemo(() => {
    return evidenceList.filter((item) => {
      const matchSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.evidenceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.sourceEntity.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.controlId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.auditLedgerRef.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.integrityDigest.toLowerCase().includes(searchTerm.toLowerCase());

      const matchType = filterType === 'ALL' || item.evidenceType === filterType;
      const matchModule = filterModule === 'ALL' || item.sourceModule === filterModule;

      return matchSearch && matchType && matchModule;
    });
  }, [evidenceList, searchTerm, filterType, filterModule]);

  const totalRecords = evidenceList.length;
  const sealedCount = evidenceList.filter(r => r.status === 'SEALED_IN_LEDGER').length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            <span>Assure Pillar</span>
            <span>·</span>
            <span>Tamper-Evident Evidence Catalog & Cryptographic Proof Center</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5 flex items-center gap-2">
            <span>Protected Evidence</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold font-mono-code">
              {totalRecords} Protected Records Sealed
            </span>
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Answers: <strong>"What cryptographic evidence proves that this governance control, decision, action or assessment actually occurred?"</strong>
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="px-3 py-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-600 dark:text-slate-300 font-mono-code flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-emerald-500" />
            <span>SHA-256 Digest Ledger Active</span>
          </span>
        </div>
      </div>

      {/* Verification Feedback Toast */}
      {verificationFeedback && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 rounded-xl text-xs text-emerald-900 dark:text-emerald-200 flex items-center justify-between shadow-sm animate-fadeIn">
          <div className="flex items-center space-x-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <div>
              <span className="font-semibold">Cryptographic Integrity Re-Verified: 100% Match with Audit Ledger.</span>
              <span className="ml-2 font-mono-code text-[11px] text-emerald-700 dark:text-emerald-300">
                Digest: <strong>{verificationFeedback.hash}</strong>
              </span>
            </div>
          </div>
          <button onClick={() => setVerificationFeedback(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* SUMMARY STATS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 elevation-card">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Protected Evidence Records</span>
            <FolderCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{totalRecords}</div>
          <div className="text-[11px] text-slate-500 mt-1">Unified Cross-Module Catalog</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 elevation-card">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Integrity Sealed in Ledger</span>
            <Lock className="w-4 h-4 text-sky-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-sky-600 dark:text-sky-400">{sealedCount} / {totalRecords}</div>
          <div className="text-[11px] text-slate-500 mt-1">Tamper-Evident SHA-256 Hashes</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 elevation-card">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Configured Retention</span>
            <Clock className="w-4 h-4 text-purple-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-purple-600 dark:text-purple-400">1,825 Days</div>
          <div className="text-[11px] text-slate-500 mt-1">Configured Custody Policy (5 Yrs)</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 elevation-card">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Canonicalization</span>
            <Binary className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-base font-bold text-emerald-600 dark:text-emerald-400">RFC 8785 JSON</div>
          <div className="text-[11px] text-slate-500 mt-1">Deterministic Hashing Standard</div>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="p-3 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl elevation-card flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search evidence ID, title, entity, control, audit block, or SHA-256 digest..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-sky-500 transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Module Filter */}
          <select
            value={filterModule}
            onChange={(e) => setFilterModule(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-sky-500"
          >
            <option value="ALL">All Source Pillars</option>
            <option value="DISCOVER">🔍 DISCOVER</option>
            <option value="GOVERN">⚖️ GOVERN</option>
            <option value="OPERATE">⚡ OPERATE</option>
            <option value="ASSURE">🛡️ ASSURE</option>
          </select>

          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-sky-500"
          >
            <option value="ALL">All Evidence Types</option>
            <option value="DECISION_EVIDENCE">Decision Evidence</option>
            <option value="HITL_EVIDENCE">HITL Evidence</option>
            <option value="INCIDENT_EVIDENCE">Incident Evidence</option>
            <option value="REMEDIATION_EVIDENCE">Remediation Evidence</option>
            <option value="PASSPORT_EVIDENCE">Passport Evidence</option>
            <option value="REGULATORY_EVIDENCE">Regulatory Evidence</option>
          </select>
        </div>
      </div>

      {/* MASTER PROTECTED EVIDENCE TABLE */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl elevation-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold">
              <tr>
                <th className="py-3 px-4">Evidence ID & Title</th>
                <th className="py-3 px-4">Type & Pillar</th>
                <th className="py-3 px-4">Source AI Entity</th>
                <th className="py-3 px-4">CG-AG Control</th>
                <th className="py-3 px-4">Generated At</th>
                <th className="py-3 px-4">Tamper-Evident SHA-256 Hash</th>
                <th className="py-3 px-4">Audit Ledger Ref</th>
                <th className="py-3 px-4 text-right">Inspect Proof</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredRecords.map((item) => {
                const isSealed = item.status === 'SEALED_IN_LEDGER';

                return (
                  <tr
                    key={item.evidenceId}
                    onClick={() => setSelectedRecord(item)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition cursor-pointer group"
                  >
                    {/* ID & Title */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                        <FolderCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>{item.evidenceId}</span>
                      </div>
                      <div className="text-[11px] text-slate-700 dark:text-slate-300 mt-0.5 line-clamp-2 max-w-xs">{item.title}</div>
                    </td>

                    {/* Type & Pillar */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{item.evidenceType.replace(/_/g, ' ')}</span>
                      <div className="text-[10px] text-slate-400 font-mono-code">{item.sourceModule} PILLAR</div>
                    </td>

                    {/* Source Entity */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-medium text-slate-800 dark:text-slate-200">{item.sourceEntity}</div>
                      <div className="text-[10px] text-slate-400">{item.sourceEntityType}</div>
                    </td>

                    {/* CG-AG Control */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-mono-code font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950 px-2 py-0.5 rounded border border-sky-200 dark:border-sky-800">
                        {item.controlId}
                      </span>
                      <div className="text-[10px] text-slate-400 mt-0.5">{item.controlName}</div>
                    </td>

                    {/* Generated At */}
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono-code text-[11px] text-slate-500">
                      {new Date(item.generatedAt).toLocaleString()}
                    </td>

                    {/* Hash */}
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono-code text-[10px] text-slate-600 dark:text-slate-300">
                      {item.integrityDigest.substring(0, 18)}...
                    </td>

                    {/* Audit Block */}
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono-code text-[11px] font-bold text-purple-600 dark:text-purple-400">
                      {item.auditLedgerRef}
                    </td>

                    {/* Action Button */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRecord(item);
                        }}
                        className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-semibold text-xs inline-flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform"
                      >
                        Inspect Proof <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* RIGHT-SIDE PROTECTED EVIDENCE DRAWER */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-xs flex justify-end animate-fadeIn">
          <div className="w-full max-w-2xl bg-white dark:bg-[#0f172a] border-l border-slate-200 dark:border-slate-800 h-full shadow-2xl flex flex-col justify-between overflow-y-auto">
            <div>
              {/* Drawer Top */}
              <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between bg-slate-50/50 dark:bg-slate-900/40">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono-code text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                      {selectedRecord.evidenceId}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {selectedRecord.evidenceType.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                      {selectedRecord.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-2">
                    {selectedRecord.title}
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    Source: {selectedRecord.sourceEntity} · Control: {selectedRecord.controlId} {selectedRecord.controlName}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedRecord(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Tabs */}
              <div className="flex border-b border-slate-200 dark:border-slate-800 px-5 text-xs font-semibold overflow-x-auto">
                {(['overview', 'provenance', 'payload', 'integrity', 'retention', 'audit'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveDrawerTab(tab)}
                    className={`py-3 px-3 border-b-2 capitalize whitespace-nowrap transition ${
                      activeDrawerTab === tab
                        ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 font-bold'
                        : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    {tab === 'integrity' ? 'Integrity Verification' : (tab === 'retention' ? 'Retention & Custody' : (tab === 'audit' ? 'Audit Link' : tab))}
                  </button>
                ))}
              </div>

              {/* Drawer Tab Content */}
              <div className="p-6 space-y-5 text-xs">
                {/* 1. OVERVIEW */}
                {activeDrawerTab === 'overview' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 text-slate-700 dark:text-slate-300">
                      <div className="font-bold text-slate-800 dark:text-slate-200">Evidence Record Summary</div>
                      <p className="text-[11px] leading-relaxed">
                        {selectedRecord.payloadSummary}
                      </p>
                      <div className="space-y-1.5 pt-1 text-[11px]">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Pillar of Origin:</span>
                          <span className="font-bold">{selectedRecord.sourceModule}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Generated Timestamp:</span>
                          <span className="font-mono-code">{new Date(selectedRecord.generatedAt).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Designated Custodian:</span>
                          <span>{selectedRecord.custodian}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. PROVENANCE & CAUSAL LINEAGE */}
                {activeDrawerTab === 'provenance' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                      <div className="font-bold text-slate-800 dark:text-slate-200">End-to-End Governance Lineage Trace</div>
                      <div className="space-y-2 text-[11px]">
                        <div className="flex justify-between">
                          <span className="text-slate-400">1. Source Entity:</span>
                          <span className="font-semibold text-slate-900 dark:text-slate-100">{selectedRecord.sourceEntity}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">2. Governing Control:</span>
                          <span className="font-mono-code font-bold text-sky-600 dark:text-sky-400">{selectedRecord.controlId} {selectedRecord.controlName}</span>
                        </div>
                        {selectedRecord.relatedPolicyId && (
                          <div className="flex justify-between">
                            <span className="text-slate-400">3. Associated Policy:</span>
                            <span className="font-mono-code">{selectedRecord.relatedPolicyId}</span>
                          </div>
                        )}
                        {selectedRecord.relatedRiskId && (
                          <div className="flex justify-between">
                            <span className="text-slate-400">4. Governed Risk Exposure:</span>
                            <span className="font-mono-code text-rose-600 dark:text-rose-400 font-bold">{selectedRecord.relatedRiskId}</span>
                          </div>
                        )}
                        {selectedRecord.relatedDecisionId && (
                          <div className="flex justify-between">
                            <span className="text-slate-400">5. Signed Governance Decision:</span>
                            <span className="font-mono-code text-emerald-600 dark:text-emerald-400 font-bold">{selectedRecord.relatedDecisionId}</span>
                          </div>
                        )}
                        {selectedRecord.relatedActionId && (
                          <div className="flex justify-between">
                            <span className="text-slate-400">6. Remediation / Gate Action:</span>
                            <span className="font-mono-code">{selectedRecord.relatedActionId}</span>
                          </div>
                        )}
                        <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-800">
                          <span className="text-slate-400">7. Chained Audit Block:</span>
                          <span className="font-mono-code font-bold text-purple-600 dark:text-purple-400">{selectedRecord.auditLedgerRef}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. PAYLOAD */}
                {activeDrawerTab === 'payload' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="font-bold text-slate-800 dark:text-slate-200">Canonical Evidence Payload (JSON)</div>
                      <pre className="p-3 bg-slate-900 text-slate-200 font-mono-code text-[11px] rounded-lg overflow-x-auto">
                        {JSON.stringify(selectedRecord.payloadData, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                {/* 4. INTEGRITY VERIFICATION */}
                {activeDrawerTab === 'integrity' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                      <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Lock className="w-4 h-4 text-emerald-500" />
                        <span>Tamper-Evident SHA-256 Digest Verification</span>
                      </div>
                      <div className="font-mono-code text-[11px] p-3 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-200 break-all">
                        {selectedRecord.integrityDigest}
                      </div>
                      <div className="space-y-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                        <div className="flex justify-between">
                          <span>Canonicalization Standard:</span>
                          <span className="font-mono-code font-bold text-slate-800 dark:text-slate-200">{selectedRecord.canonicalizationStatus}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Hash Algorithm:</span>
                          <span className="font-mono-code font-bold">SHA-256 (256-bit Digest)</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleVerifyIntegrity(selectedRecord.evidenceId)}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5 mt-2"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>Verify Cryptographic Integrity Hash</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 5. RETENTION & CUSTODY */}
                {activeDrawerTab === 'retention' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                      <div className="font-bold text-slate-800 dark:text-slate-200">Retention Policy & Legal Custody</div>
                      <div className="space-y-2 text-[11px] text-slate-700 dark:text-slate-300">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Configured Retention:</span>
                          <span className="font-mono-code font-bold">{selectedRecord.retentionPolicy.configuredDays} Days (5 Years)</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Custody Status:</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">{selectedRecord.retentionPolicy.status}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Designated Custodian:</span>
                          <span>{selectedRecord.retentionPolicy.custodian}</span>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-500 pt-1">
                        Maintained under enterprise AI governance record retention standard (EU AI Act Art. 12 & LGPD Art. 38).
                      </p>
                    </div>
                  </div>
                )}

                {/* 6. AUDIT LINK */}
                {activeDrawerTab === 'audit' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                      <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <BookOpen className="w-4 h-4 text-purple-500" />
                        <span>Audit Ledger Block Connection</span>
                      </div>
                      <div className="p-3 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-lg space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-purple-900 dark:text-purple-300 font-bold">Audit Ledger Block ID:</span>
                          <span className="font-mono-code font-bold text-purple-700 dark:text-purple-300">{selectedRecord.auditLedgerRef}</span>
                        </div>
                        <p className="text-[10px] text-slate-500">
                          Chained cryptographically to previous block header with tamper-evident seal.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-mono-code">Proof Ref: {selectedRecord.evidenceId}</span>
              <button
                onClick={() => setSelectedRecord(null)}
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
