import React from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export type InlineStatusTone = 'success' | 'error' | 'info';

interface InlineStatusProps {
  tone: InlineStatusTone;
  message: string;
  onDismiss?: () => void;
}

/**
 * Small inline feedback surface (UX audit F5), following the existing
 * ProtectedEvidenceView toast styling: icon + message + dismiss, rendered
 * next to the action that produced it. Success must only ever be shown
 * after the operation actually succeeded.
 */
export const InlineStatus: React.FC<InlineStatusProps> = ({ tone, message, onDismiss }) => {
  const toneClasses: Record<InlineStatusTone, string> = {
    success: 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300',
    error: 'border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300',
    info: 'border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300'
  };
  const Icon = tone === 'success' ? CheckCircle2 : tone === 'error' ? AlertTriangle : Info;

  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      data-testid="inline-status"
      data-tone={tone}
      className={`p-3 border rounded-xl text-xs flex items-start justify-between gap-3 shadow-sm animate-fadeIn ${toneClasses[tone]}`}
    >
      <div className="flex items-start space-x-2 min-w-0">
        <Icon className="w-4 h-4 shrink-0 mt-0.5" />
        <span className="leading-relaxed break-words">{message}</span>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss message"
          className="opacity-60 hover:opacity-100 transition shrink-0 cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
