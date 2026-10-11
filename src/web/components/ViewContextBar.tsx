import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { CANONICAL_NAV_LABELS, type ViewContextEntry } from '../navigation/view-context';

interface ViewContextBarProps {
  context: ViewContextEntry;
  onReturn: () => void;
}

/**
 * Compact contextual navigation for internal views without a canonical
 * sidebar destination (UX audit F2): shows the current-view title plus a
 * single "Back to <canonical destination>" action. Rendered above the view
 * content by App.tsx — the four-item canonical sidebar is untouched.
 */
export const ViewContextBar: React.FC<ViewContextBarProps> = ({ context, onReturn }) => (
  <nav
    data-testid="view-context-bar"
    aria-label="Current view navigation"
    className="flex items-center justify-between gap-3 px-3.5 py-2 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 elevation-card text-xs"
  >
    <span className="font-semibold text-slate-500 dark:text-slate-400 truncate">
      {context.title}
    </span>
    <button
      onClick={onReturn}
      data-testid="view-context-return"
      className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg font-semibold text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/50 transition shrink-0 cursor-pointer"
    >
      <ChevronLeft className="w-3.5 h-3.5" />
      <span>Back to {CANONICAL_NAV_LABELS[context.returnTo]}</span>
    </button>
  </nav>
);

export default ViewContextBar;
