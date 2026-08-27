import React, { useState, useMemo, useEffect } from 'react';
import { 
  BookOpen, 
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
  Link,
  ShieldX,
  RefreshCw,
  Binary,
  GitCommit,
  Flame,
  Check
} from 'lucide-react';
import type { ScannerResult } from '../../core/types';
import { useIndustry } from '../context/IndustryContext';
import { AuditLedgerStore, AuditBlock, ChainVerificationResult } from '../services/audit-ledger-store';

export const AuditLedgerView: React.FC<{ result?: ScannerResult | null }> = ({ result }) => {
  const { activeProfile, environment } = useIndustry();
  const [blocks, setBlocks] = useState<AuditBlock[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterModule, setFilterModule] = useState<string>('ALL');
  const [selectedBlock, setSelectedBlock] = useState<AuditBlock | null>(null);
  const [activeDrawerTab, setActiveDrawerTab] = useState<'header' | 'proof' | 'payload' | 'lineage' | 'tamper' | 'certificate'>('header');
  const [verificationResult, setVerificationResult] = useState<ChainVerificationResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const refreshState = () => {
    const list = AuditLedgerStore.getBlocks();
    setBlocks(list);
    const verif = AuditLedgerStore.verifyEntireLedger();
    setVerificationResult(verif);

    if (selectedBlock) {
      const updated = list.find(b => b.blockId === selectedBlock.blockId);
      if (updated) setSelectedBlock(updated);
    }
  };

  useEffect(() => {
    refreshState();
    return AuditLedgerStore.subscribe(refreshState);
  }, []);

  const handleVerifyChain = () => {
    setIsVerifying(true);
    setTimeout(() => {
      const res = AuditLedgerStore.verifyEntireLedger();
      setVerificationResult(res);
      setIsVerifying(false);
    }, 600);
  };

  const handleSimulateTamper = (blockId: string) => {
    AuditLedgerStore.simulateTamper(blockId);
  };

  const handleRestoreLedger = () => {
    AuditLedgerStore.restoreCanonicalLedger();
  };

  const filteredBlocks = useMemo(() => {
    return blocks.filter((b) => {
      const matchSearch = b.blockId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          b.actor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          b.eventType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          b.blockHash.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (b.evidenceRef && b.evidenceRef.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchModule = filterModule === 'ALL' || b.sourceModule === filterModule;

      return matchSearch && matchModule;
    });
  }, [blocks, searchTerm, filterModule]);

  const isValid = verificationResult?.isChainValid ?? true;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
            <span>Assure Pillar</span>
            <span>·</span>
            <span>Verifiable Audit Ledger & Chained Blocks</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5 flex items-center gap-2">
            <span>Audit Ledger</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold font-mono-code ${
              isValid 
                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' 
                : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 animate-pulse'
            }`}>
              {isValid ? `${blocks.length} Blocks Chained & Verified` : '⚠️ Chain Broken / Compromised'}
            </span>
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Answers: <strong>"Can we mathematically prove that the historical sequence of governance events was not altered?"</strong>
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <button
            onClick={handleVerifyChain}
            disabled={isVerifying}
            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold shadow-xs transition flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
            <span>Verify Entire Ledger</span>
          </button>
        </div>
      </div>

      {/* CHAIN STATUS BANNER */}
      {isValid ? (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-xl flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            <div>
              <div className="font-bold text-xs text-emerald-900 dark:text-emerald-200">
                LEDGER INTEGRITY: 100% CRYPTOGRAPHICALLY VERIFIED
              </div>
              <div className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-0.5 font-mono-code">
                {verificationResult?.blocksVerified} Blocks Checked · 0 Broken Links · 0 Hash Mismatches · SHA-256 & RFC 8785 Canonical
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-3.5 bg-rose-50 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-800 rounded-xl flex items-center justify-between shadow-xs animate-fadeIn">
          <div className="flex items-center space-x-3">
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
            <div>
              <div className="font-bold text-xs text-rose-900 dark:text-rose-100 flex items-center gap-2">
                <span>CHAIN INTEGRITY COMPROMISED: TAMPER DETECTED</span>
              </div>
              <div className="text-[11px] text-rose-700 dark:text-rose-300 mt-0.5 font-mono-code">
                Corrupted Block: <strong>{verificationResult?.tamperedBlockId}</strong> · Hash Mismatches: {verificationResult?.hashMismatches} · Previous Hash Link Invalid
              </div>
            </div>
          </div>
          <button
            onClick={handleRestoreLedger}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition shadow-xs"
          >
            Restore Canonical Ledger
          </button>
        </div>
      )}

      {/* SUMMARY STATS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 elevation-card">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Total Chained Blocks</span>
            <Layers className="w-4 h-4 text-purple-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{blocks.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">Height 0 (Genesis) to Head</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 elevation-card">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Current Head Block</span>
            <GitCommit className="w-4 h-4 text-sky-500" />
          </div>
          <div className="mt-2 text-base font-bold text-sky-600 dark:text-sky-400 font-mono-code">
            {blocks[blocks.length - 1]?.blockId || 'N/A'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Latest Sealed Governance Event</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 elevation-card">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Chain Broken Links</span>
            <Link className="w-4 h-4 text-emerald-500" />
          </div>
          <div className={`mt-2 text-2xl font-bold ${isValid ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {verificationResult?.brokenLinks ?? 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Cryptographic Hash Continuity</div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 elevation-card">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Genesis Anchor</span>
            <Lock className="w-4 h-4 text-purple-500" />
          </div>
          <div className="mt-2 text-base font-bold text-purple-600 dark:text-purple-400 font-mono-code">BLK-0000</div>
          <div className="text-[11px] text-slate-500 mt-1">2026-08-25T00:00:00Z</div>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="p-3 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl elevation-card flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search block ID, actor, event type, evidence ref, or block hash..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Module Filter */}
          <select
            value={filterModule}
            onChange={(e) => setFilterModule(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-purple-500"
          >
            <option value="ALL">All Source Pillars</option>
            <option value="DISCOVER">🔍 DISCOVER</option>
            <option value="GOVERN">⚖️ GOVERN</option>
            <option value="OPERATE">⚡ OPERATE</option>
            <option value="ASSURE">🛡️ ASSURE</option>
          </select>
        </div>
      </div>

      {/* MASTER AUDIT BLOCKS TABLE */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl elevation-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold">
              <tr>
                <th className="py-3 px-4">Height & Block ID</th>
                <th className="py-3 px-4">Event Type</th>
                <th className="py-3 px-4">Actor / Signatory</th>
                <th className="py-3 px-4">Source Pillar</th>
                <th className="py-3 px-4">Evidence Ref</th>
                <th className="py-3 px-4">Previous Block Hash</th>
                <th className="py-3 px-4">Current Block Hash</th>
                <th className="py-3 px-4 text-right">Inspect Block</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredBlocks.map((b) => {
                const isTampered = b.isTampered;

                return (
                  <tr
                    key={b.blockId}
                    onClick={() => setSelectedBlock(b)}
                    className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition cursor-pointer group ${
                      isTampered ? 'bg-rose-50/70 dark:bg-rose-950/40' : ''
                    }`}
                  >
                    {/* Height & ID */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors flex items-center gap-1.5 font-mono-code">
                        <Link className={`w-3.5 h-3.5 ${isTampered ? 'text-rose-500' : 'text-purple-500'}`} />
                        <span>{b.blockId}</span>
                        <span className="text-[10px] text-slate-400 font-normal">#{b.blockHeight}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono-code mt-0.5">{new Date(b.timestamp).toLocaleTimeString()}</div>
                    </td>

                    {/* Event Type */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{b.eventType.replace(/_/g, ' ')}</span>
                      <div className="text-[10px] text-slate-400 font-mono-code">{b.controlId}</div>
                    </td>

                    {/* Actor */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-medium text-slate-800 dark:text-slate-200">{b.actor}</div>
                      <div className="text-[10px] text-slate-400">{b.actorRole}</div>
                    </td>

                    {/* Source Pillar */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-mono-code text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {b.sourceModule}
                      </span>
                    </td>

                    {/* Evidence Ref */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {b.evidenceRef ? (
                        <span className="font-mono-code font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                          {b.evidenceRef}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[10px]">Genesis Anchor</span>
                      )}
                    </td>

                    {/* Prev Hash */}
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono-code text-[10px] text-slate-500">
                      {b.previousHash.substring(0, 14)}...
                    </td>

                    {/* Block Hash */}
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono-code text-[10px] font-bold text-purple-600 dark:text-purple-400">
                      {b.blockHash.substring(0, 14)}...
                    </td>

                    {/* Action Button */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedBlock(b);
                        }}
                        className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-semibold text-xs inline-flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform"
                      >
                        Inspect Block <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* RIGHT-SIDE AUDIT BLOCK DRAWER */}
      {selectedBlock && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-xs flex justify-end animate-fadeIn">
          <div className="w-full max-w-2xl bg-white dark:bg-[#0f172a] border-l border-slate-200 dark:border-slate-800 h-full shadow-2xl flex flex-col justify-between overflow-y-auto">
            <div>
              {/* Drawer Top */}
              <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between bg-slate-50/50 dark:bg-slate-900/40">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono-code text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-800">
                      {selectedBlock.blockId}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      Height #{selectedBlock.blockHeight}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                      {selectedBlock.eventType.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-2">
                    Sealed Audit Block #{selectedBlock.blockHeight}
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    Signatory: {selectedBlock.actor} ({selectedBlock.actorRole}) · Module: {selectedBlock.sourceModule}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedBlock(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Tabs */}
              <div className="flex border-b border-slate-200 dark:border-slate-800 px-5 text-xs font-semibold overflow-x-auto">
                {(['header', 'proof', 'payload', 'lineage', 'tamper', 'certificate'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveDrawerTab(tab)}
                    className={`py-3 px-3 border-b-2 capitalize whitespace-nowrap transition ${
                      activeDrawerTab === tab
                        ? 'border-purple-600 text-purple-600 dark:text-purple-400 font-bold'
                        : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    {tab === 'header' ? 'Block Header' : (tab === 'proof' ? 'Cryptographic Proof' : (tab === 'tamper' ? 'Tamper Test' : (tab === 'certificate' ? 'Certificate' : tab)))}
                  </button>
                ))}
              </div>

              {/* Drawer Tab Content */}
              <div className="p-6 space-y-5 text-xs">
                {/* 1. HEADER */}
                {activeDrawerTab === 'header' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 text-slate-700 dark:text-slate-300">
                      <div className="font-bold text-slate-800 dark:text-slate-200">Block Header Structure</div>
                      <div className="space-y-2 pt-1 text-[11px]">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Block Sequence:</span>
                          <span className="font-mono-code font-bold text-purple-600 dark:text-purple-400">Height #{selectedBlock.blockHeight}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Timestamp:</span>
                          <span className="font-mono-code">{new Date(selectedBlock.timestamp).toISOString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Signatory Actor:</span>
                          <span className="font-semibold text-slate-900 dark:text-slate-100">{selectedBlock.actor}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Pillar & Control:</span>
                          <span className="font-mono-code">{selectedBlock.sourceModule} · {selectedBlock.controlId}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. PROOF */}
                {activeDrawerTab === 'proof' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                      <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Lock className="w-4 h-4 text-purple-500" />
                        <span>Hash Chaining Continuity</span>
                      </div>
                      <div className="space-y-2 text-[11px]">
                        <div>
                          <span className="text-slate-400">Previous Block Hash (H_{'{n-1}'}):</span>
                          <div className="font-mono-code text-[10px] p-2 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded mt-1 break-all text-slate-700 dark:text-slate-300">
                            {selectedBlock.previousHash}
                          </div>
                        </div>

                        <div>
                          <span className="text-slate-400">Payload Hash (RFC 8785 Canonical Digest):</span>
                          <div className="font-mono-code text-[10px] p-2 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded mt-1 break-all text-emerald-600 dark:text-emerald-400">
                            {selectedBlock.payloadHash}
                          </div>
                        </div>

                        <div>
                          <span className="text-slate-400">Current Block Hash (H_{'{n}'}):</span>
                          <div className="font-mono-code text-[10px] p-2 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded mt-1 break-all font-bold text-purple-600 dark:text-purple-400">
                            {selectedBlock.blockHash}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. PAYLOAD */}
                {activeDrawerTab === 'payload' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="font-bold text-slate-800 dark:text-slate-200">Canonical Event Data (JSON)</div>
                      <pre className="p-3 bg-slate-900 text-slate-200 font-mono-code text-[11px] rounded-lg overflow-x-auto">
                        {JSON.stringify(selectedBlock.payloadData, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                {/* 4. LINEAGE */}
                {activeDrawerTab === 'lineage' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                      <div className="font-bold text-slate-800 dark:text-slate-200">Provenance & Evidence Link</div>
                      <div className="space-y-2 text-[11px] text-slate-700 dark:text-slate-300">
                        {selectedBlock.evidenceRef && (
                          <div className="flex justify-between">
                            <span className="text-slate-400">Linked Evidence Record:</span>
                            <span className="font-mono-code font-bold text-emerald-600 dark:text-emerald-400">{selectedBlock.evidenceRef}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-slate-400">Governing Control:</span>
                          <span className="font-mono-code font-bold text-sky-600 dark:text-sky-400">{selectedBlock.controlId}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Source Pillar:</span>
                          <span>{selectedBlock.sourceModule}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. TAMPER TEST */}
                {activeDrawerTab === 'tamper' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                      <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Flame className="w-4 h-4 text-amber-500" />
                        <span>Interactive Tamper Simulation Engine</span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                        Demonstrates the mathematical integrity of the ledger. Injecting a single unauthorized change into this historical block will immediately break the SHA-256 cryptographic chain.
                      </p>

                      <div className="pt-2">
                        {selectedBlock.isTampered ? (
                          <button
                            type="button"
                            onClick={handleRestoreLedger}
                            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5"
                          >
                            <ShieldCheck className="w-4 h-4" />
                            <span>Restore Canonical Ledger</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSimulateTamper(selectedBlock.blockId)}
                            className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5"
                          >
                            <AlertTriangle className="w-4 h-4" />
                            <span>Simulate Tamper Attack on Block #{selectedBlock.blockHeight}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* 6. CERTIFICATE */}
                {activeDrawerTab === 'certificate' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-xl space-y-3">
                      <div className="font-bold text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-purple-600" />
                        <span>Cryptographic Inclusion Certificate</span>
                      </div>
                      <div className="font-mono-code text-[10px] space-y-1 text-slate-700 dark:text-slate-300">
                        <div>Certificate ID: CERT-{selectedBlock.blockId}-SHA256</div>
                        <div>Block Height: #{selectedBlock.blockHeight}</div>
                        <div>Sealed Hash: {selectedBlock.blockHash}</div>
                        <div>Standard: ISO/IEC 42001 & EU AI Act Art. 12 Compliant</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-mono-code">Block: {selectedBlock.blockId}</span>
              <button
                onClick={() => setSelectedBlock(null)}
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
