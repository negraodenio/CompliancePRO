import type { ActiveNavView } from '../components/AppShell';

/**
 * Canonical primary navigation (must match AppShell topLevelItems + Settings footer).
 * Internal views outside this set have no active sidebar destination (UX audit F2).
 */
export type CanonicalNavView = 'ai-agents' | 'tools-scanner' | 'assure-evidence' | 'settings';

export const CANONICAL_NAV_VIEWS: readonly CanonicalNavView[] = [
  'ai-agents',
  'tools-scanner',
  'assure-evidence',
  'settings'
];

export const CANONICAL_NAV_LABELS: Record<CanonicalNavView, string> = {
  'ai-agents': 'AI Agents',
  'tools-scanner': 'Discover',
  'assure-evidence': 'Evidence',
  'settings': 'Settings'
};

export interface ViewContextEntry {
  /** Human-readable current-view title shown in the contextual navigation. */
  title: string;
  /** Canonical return destination selected from the verified navigation flow. */
  returnTo: CanonicalNavView;
}

/**
 * Contextual navigation for internal views that are reachable in the product
 * but do not match any of the four canonical sidebar destinations.
 *
 * Return destinations were derived from the actual navigation flows in code:
 * - studio-builder / cockpit-control / overview-center: entered from the AI
 *   Agents workspace (Agent Detail "Back to AI Agents" precedent, inventory
 *   CTAs) — return to AI Agents.
 * - discover-*: entered from the Academy discovery track; views declare the
 *   "Discover Pillar" eyebrow — return to Discover (tools-scanner).
 * - govern-* / operate-*: entered from Settings > Advanced Governance &
 *   Workspaces (static launchpad in SettingsView) with secondary entries via
 *   Role Lens switches and Academy steps — return to Settings.
 * - assure-audit / assure-reports: entered from the Academy verification
 *   track; views declare the "Assure Pillar" eyebrow — return to Evidence
 *   (assure-evidence).
 * - tools-integrations / manage-team / learn-academy: entered from Settings
 *   workspaces (manage-team also from the user menu) — return to Settings.
 *
 * Views deliberately NOT mapped (no verified entry path in the current
 * navigation flow — documented instead of guessed):
 * discover-passports, discover-assessments, assure-simulator,
 * assure-readiness, tools-operations, tools-deployment.
 */
export const VIEW_CONTEXT: Partial<Record<ActiveNavView, ViewContextEntry>> = {
  'overview-center': { title: 'Governance Center', returnTo: 'ai-agents' },
  'studio-builder': { title: 'Agent Studio', returnTo: 'ai-agents' },
  'cockpit-control': { title: 'Governance Cockpit', returnTo: 'ai-agents' },
  'discover-inventory': { title: 'AI Systems Inventory', returnTo: 'tools-scanner' },
  'discover-agents': { title: 'Agents & Teams Registry', returnTo: 'tools-scanner' },
  'govern-controls': { title: 'Controls Matrix', returnTo: 'settings' },
  'govern-risk': { title: 'Risk Engine', returnTo: 'settings' },
  'govern-policies': { title: 'Policy Engine', returnTo: 'settings' },
  'govern-compliance': { title: 'Compliance Frameworks', returnTo: 'settings' },
  'operate-decisions': { title: 'Decisions Pipeline', returnTo: 'settings' },
  'operate-approvals': { title: 'Human Approvals (HITL)', returnTo: 'settings' },
  'operate-actions': { title: 'Remediation Actions', returnTo: 'settings' },
  'operate-incidents': { title: 'Failsafe & Incidents', returnTo: 'settings' },
  'operate-runtime': { title: 'Runtime FinOps', returnTo: 'settings' },
  'assure-audit': { title: 'Audit Ledger', returnTo: 'assure-evidence' },
  'assure-reports': { title: 'Regulatory Dossiers', returnTo: 'assure-evidence' },
  'tools-integrations': { title: 'Universal MCP', returnTo: 'settings' },
  'manage-team': { title: 'Team & Access', returnTo: 'settings' },
  'learn-academy': { title: 'Governance Academy', returnTo: 'settings' }
};

export function getViewContext(view: ActiveNavView): ViewContextEntry | null {
  return VIEW_CONTEXT[view] ?? null;
}
