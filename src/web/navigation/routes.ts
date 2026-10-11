import type { ActiveNavView } from '../components/AppShell';

/**
 * URL persistence for the four canonical sidebar destinations (UX audit F3).
 *
 * Deliberately framework-free: pathname <-> view mapping and history
 * decisions are pure functions so page-load initialization, Back/Forward
 * (popstate) handling, and duplicate-entry rules are all testable without a
 * DOM. App.tsx is the only place that touches window.history.
 */

export type PageMode = 'landing' | 'app';

export interface ParsedRoute {
  view: ActiveNavView;
  agentId: string | null;
}

export interface RouteInit {
  pageMode: PageMode;
  activeView: ActiveNavView;
  selectedAgentId: string | null;
  currentPath: string;
}

export interface UrlSyncState {
  pageMode: PageMode;
  activeView: ActiveNavView;
  selectedAgentId: string | null;
  pathname: string;
}

/** Canonical pathname for each sidebar destination. Internal views have no public URL. */
export const PATH_BY_VIEW: Partial<Record<ActiveNavView, string>> = {
  'ai-agents': '/agents',
  'tools-scanner': '/discover',
  'assure-evidence': '/evidence',
  'settings': '/settings'
};

/** Canonical sidebar pathname -> view. Must match AppShell topLevelItems + Settings footer. */
export const VIEW_BY_PATH: Record<string, ActiveNavView> = {
  '/agents': 'ai-agents',
  '/discover': 'tools-scanner',
  '/evidence': 'assure-evidence',
  '/settings': 'settings'
};

export function normalizePath(path: string): string {
  return path.replace(/\/+$/, '') || '/';
}

/** Maps a pathname to its view, or null for public/unknown paths (landing fallback). */
export function parseRoute(path: string): ParsedRoute | null {
  const p = normalizePath(path);
  if (p.startsWith('/agents/')) {
    const agentId = p.slice('/agents/'.length);
    if (agentId) {
      return { view: 'ai-agents', agentId };
    }
    return null;
  }
  const view = VIEW_BY_PATH[p];
  return view ? { view, agentId: null } : null;
}

/** Canonical pathname for a view, or null when the view has no public URL. */
export function pathForView(view: ActiveNavView): string | null {
  return PATH_BY_VIEW[view] ?? null;
}

/** Duplicate-entry rule: never push a pathname that is already the current one. */
export function shouldPushPath(currentPath: string, nextPath: string): boolean {
  return normalizePath(currentPath) !== normalizePath(nextPath);
}

/**
 * Reads the same session key AuthContext uses (cgag_auth_token).
 * Kept here so protected initialization and popstate app-entry can be
 * gated synchronously on an existing session.
 */
export function hasSavedSession(): boolean {
  try {
    return typeof window !== 'undefined' && Boolean(window.localStorage.getItem('cgag_auth_token'));
  } catch {
    return false;
  }
}

/**
 * Initial application state for a page load / refresh and for popstate.
 *
 * - Canonical path + saved session -> protected app opens on that view.
 * - Canonical path without a session -> public landing (unauthenticated
 *   visitors never enter protected state; AuthSessionGuard still enforces
 *   expiry while the app is open).
 * - Public or unknown path -> landing with the default view; the URL is left
 *   untouched (non-destructive fallback).
 */
export function initialRouteState(pathname: string, hasSession: boolean): RouteInit {
  const currentPath = normalizePath(pathname);
  const route = parseRoute(currentPath);
  return {
    pageMode: route && hasSession ? 'app' : 'landing',
    activeView: route?.view ?? 'ai-agents',
    selectedAgentId: route?.agentId ?? null,
    currentPath
  };
}

/**
 * Returns the pathname history must push for the given state, or null when
 * the URL must be left untouched:
 *
 * - landing mode never rewrites the public URL (initialization safety),
 * - an open agent detail (/agents/:id) owns the URL,
 * - internal views keep the current canonical URL (no public URL per view),
 * - an already-matching pathname is never pushed again (no duplicate
 *   entries and no pushState loop around popstate).
 */
export function nextUrlForState(state: UrlSyncState): string | null {
  if (state.pageMode !== 'app') {
    return null;
  }
  if (state.selectedAgentId) {
    return null;
  }
  const target = pathForView(state.activeView);
  if (!target) {
    return null;
  }
  if (!shouldPushPath(state.pathname, target)) {
    return null;
  }
  return target;
}
