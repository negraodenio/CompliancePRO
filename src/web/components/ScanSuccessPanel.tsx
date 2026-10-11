import React from 'react';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import type { ScannerResult } from '../../core/types';

interface ScanSuccessPanelProps {
  scanResult: ScannerResult | null;
  onReviewAgents: () => void;
}

/**
 * Single success surface for a genuinely completed scan (UX audit F6).
 *
 * - Renders nothing when there is no scan result, so failed or cleared
 *   scans never display a success message.
 * - Displays exactly one success message and one primary CTA
 *   ("Review in AI Agents"); navigation is deliberate — no auto redirect.
 */
export const ScanSuccessPanel: React.FC<ScanSuccessPanelProps> = ({ scanResult, onReviewAgents }) => {
  if (!scanResult) return null;

  const repoName = scanResult.repo?.name || 'Local Repository';
  const agentCount = scanResult.source?.agents?.length || 0;

  return (
    <div
      data-testid="scan-success-panel"
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs animate-fadeIn"
    >
      <div className="flex items-center space-x-2">
        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
        <span>
          Scan complete — <strong>{agentCount}</strong> agent{agentCount === 1 ? '' : 's'}{' '}
          discovered in <strong>{repoName}</strong>.
        </span>
      </div>
      <button
        onClick={onReviewAgents}
        data-testid="scan-success-cta"
        className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition shrink-0 cursor-pointer shadow-xs"
      >
        <span>Review in AI Agents</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

export default ScanSuccessPanel;
