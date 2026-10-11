/**
 * UX BATCH 3 — URL PERSISTENCE & DEEP-LINK RESTORATION (F3) REGRESSION TEST
 *
 * F3: internal section changes never touched the pathname, so refresh lost
 * the current section and Back/Forward did nothing. The fix maps the four
 * canonical sidebar destinations to /agents, /discover, /evidence, /settings
 * (plus /agents/:id for existing agent detail URLs), initializes view state
 * from the pathname on load, applies popstate for Back/Forward, and pushes
 * the pathname on section change — all as pure functions in
 * src/web/navigation/routes.ts (no routing framework, no new dependency).
 *
 * Authentication contract: protected initialization requires a saved session
 * (same localStorage key AuthContext uses); unauthenticated visitors stay on
 * the public landing experience and AuthSessionGuard still enforces expiry.
 *
 * Strategy: exercise the extracted route/state functions directly and use
 * focused source assertions for the App.tsx history wiring that cannot be
 * mounted without a DOM. Batch 1 + Batch 2 suites are executed from this
 * test to prove both remain intact. No network, no backend, no browser.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert';

const root = join(import.meta.dirname, '..');
const appSource = readFileSync(join(root, 'src', 'web', 'App.tsx'), 'utf8');
const shellSource = readFileSync(join(root, 'src', 'web', 'components', 'AppShell.tsx'), 'utf8');
const routesSource = readFileSync(join(root, 'src', 'web', 'navigation', 'routes.ts'), 'utf8');
const packageJson = readFileSync(join(root, 'package.json'), 'utf8');

let passed = 0;
const pass = (label: string) => {
  passed += 1;
  console.log(`  [UX-B3 PASS ${passed}]: ${label}`);
};

const {
  parseRoute,
  initialRouteState,
  nextUrlForState,
  shouldPushPath,
  normalizePath,
  VIEW_BY_PATH
} = await import('../src/web/navigation/routes');

const CANONICAL: Array<[string, string]> = [
  ['/agents', 'ai-agents'],
  ['/discover', 'tools-scanner'],
  ['/evidence', 'assure-evidence'],
  ['/settings', 'settings']
];

// ===========================================================================
// 1–4. Refresh/deep-link: canonical pathname initializes the right view
// ===========================================================================
const initFor = (path: string) => initialRouteState(path, true);
const expect1 = initFor('/agents');
assert.strictEqual(expect1.pageMode, 'app');
assert.strictEqual(expect1.activeView, 'ai-agents');
assert.strictEqual(expect1.selectedAgentId, null);
assert.strictEqual(expect1.currentPath, '/agents');
pass('Refresh/deep-link on /agents initializes the AI Agents view');

const expect2 = initFor('/discover');
assert.strictEqual(expect2.pageMode, 'app');
assert.strictEqual(expect2.activeView, 'tools-scanner');
assert.strictEqual(expect2.currentPath, '/discover');
pass('Refresh/deep-link on /discover initializes the Discover view');

const expect3 = initFor('/evidence');
assert.strictEqual(expect3.pageMode, 'app');
assert.strictEqual(expect3.activeView, 'assure-evidence');
assert.strictEqual(expect3.currentPath, '/evidence');
pass('Refresh/deep-link on /evidence initializes the Evidence view');

const expect4 = initFor('/settings');
assert.strictEqual(expect4.pageMode, 'app');
assert.strictEqual(expect4.activeView, 'settings');
assert.strictEqual(expect4.currentPath, '/settings');
pass('Refresh/deep-link on /settings initializes the Settings view');

// ===========================================================================
// 5. Section navigation updates the URL without any page reload
// ===========================================================================
assert.strictEqual(
  nextUrlForState({ pageMode: 'app', activeView: 'tools-scanner', selectedAgentId: null, pathname: '/agents' }),
  '/discover',
  'Navigating to Discover must push /discover'
);
assert.strictEqual(
  nextUrlForState({ pageMode: 'app', activeView: 'assure-evidence', selectedAgentId: null, pathname: '/agents' }),
  '/evidence',
  'Navigating to Evidence must push /evidence'
);
assert.strictEqual(
  nextUrlForState({ pageMode: 'app', activeView: 'settings', selectedAgentId: null, pathname: '/agents' }),
  '/settings',
  'Navigating to Settings must push /settings'
);
assert.strictEqual(
  nextUrlForState({ pageMode: 'app', activeView: 'ai-agents', selectedAgentId: null, pathname: '/discover' }),
  '/agents',
  'Navigating to AI Agents must push /agents'
);
assert.ok(!appSource.includes('location.reload'), 'Section navigation must never reload the page');
assert.ok(!appSource.includes('location.assign'), 'Section navigation must never perform a full navigation');
assert.ok(!appSource.includes('location.href'), 'Section navigation must never assign location.href');
assert.ok(appSource.includes('window.history.pushState'), 'Client-side pushState is required for URL updates');
assert.ok(
  shellSource.includes('onClick={() => setActiveView(item.id)}'),
  'Sidebar items must navigate through the state setter (URL sync applies)'
);
assert.ok(
  appSource.includes('setActiveView={(view) => {'),
  'App must wrap the shell setter so every sidebar change flows through URL sync'
);
pass('Sidebar/section changes push the canonical URL client-side (no reload anywhere)');

// ===========================================================================
// 6. Back/Forward restores the matching section (popstate, no loops)
// ===========================================================================
assert.ok(
  appSource.includes("window.addEventListener('popstate', handlePopState)"),
  'popstate listener missing — Back/Forward cannot restore sections'
);
assert.ok(
  appSource.includes('const next = initialRouteState(window.location.pathname, hasSavedSession());'),
  'popstate must reuse the page-load state machine (single source of truth)'
);
const popStart = appSource.indexOf('const handlePopState = () => {');
assert.ok(popStart > 0, 'popstate handler not found');
const popBody = appSource.slice(popStart, appSource.indexOf('window.addEventListener', popStart));
assert.ok(!popBody.includes('pushState'), 'popstate must never write history — that creates navigation loops');
assert.strictEqual(
  nextUrlForState({ pageMode: 'app', activeView: 'tools-scanner', selectedAgentId: null, pathname: '/discover' }),
  null,
  'After popstate the sync effect must not push the path it already sits on (loop guard)'
);
assert.strictEqual(
  shouldPushPath('/evidence', '/evidence/'),
  false,
  'Trailing-slash variants must not create duplicate history entries'
);
pass('Back/Forward handled via popstate with loop-safe, duplicate-free pushes');

// ===========================================================================
// 7. Refresh restores the correct view (App initializes from the route module)
// ===========================================================================
assert.ok(
  appSource.includes('const INITIAL_ROUTE_STATE = initialRouteState('),
  'App must not hardcode default view state — initialization must come from the URL'
);
assert.ok(
  appSource.includes("useState<'landing' | 'app'>(INITIAL_ROUTE_STATE.pageMode)"),
  'pageMode must be derived from the loaded pathname'
);
assert.ok(
  appSource.includes('useState<ActiveNavView>(INITIAL_ROUTE_STATE.activeView)'),
  'activeView must be derived from the loaded pathname'
);
assert.ok(
  appSource.includes('useState<string | null>(INITIAL_ROUTE_STATE.selectedAgentId)'),
  'agent detail id must be derived from the loaded pathname'
);
pass('Page-load state (mode, view, agent, path) is initialized from the URL');

// ===========================================================================
// 8. /agents/:id deep links restore the agent detail view
// ===========================================================================
assert.deepStrictEqual(parseRoute('/agents/agt_9'), { view: 'ai-agents', agentId: 'agt_9' });
assert.strictEqual(normalizePath('/agents/agt_9/'), '/agents/agt_9');
const detailInit = initialRouteState('/agents/agt_9', true);
assert.strictEqual(detailInit.pageMode, 'app');
assert.strictEqual(detailInit.activeView, 'ai-agents');
assert.strictEqual(detailInit.selectedAgentId, 'agt_9');
assert.strictEqual(
  nextUrlForState({ pageMode: 'app', activeView: 'ai-agents', selectedAgentId: 'agt_9', pathname: '/agents/agt_9' }),
  null,
  'An open agent detail owns its URL — the sync effect must never overwrite /agents/:id'
);
const syncStart = appSource.indexOf('const next = nextUrlForState({');
assert.ok(syncStart > 0, 'URL synchronization effect missing');
const syncBody = appSource.slice(syncStart, appSource.indexOf('}, [pageMode, activeView, selectedAgentId]);', syncStart));
assert.ok(
  syncBody.includes('selectedAgentId'),
  'URL sync must consider the open agent detail before pushing'
);
const navStart = appSource.indexOf('const handleNavigate = (path: string) => {');
assert.ok(navStart > 0, 'handleNavigate missing');
const navBody = appSource.slice(navStart, appSource.indexOf('\n  };', navStart));
assert.ok(navBody.includes('parseRoute(normalized)'), 'Agent-detail navigation must go through the route parser');
assert.ok(navBody.includes('shouldPushPath'), 'handleNavigate must guard against duplicate history entries');
assert.ok(
  !navBody.includes("pushState({}, '', path)"),
  'handleNavigate must not push the raw path unconditionally'
);
pass('/agents/:id deep link restores Agent Detail and is never clobbered by URL sync');

// ===========================================================================
// 9. Unknown routes fall back predictably and non-destructively
// ===========================================================================
assert.strictEqual(parseRoute('/not-a-real-page'), null, 'Unknown path must not map to any view');
const unknownInit = initialRouteState('/not-a-real-page', true);
assert.strictEqual(unknownInit.pageMode, 'landing', 'Unknown path must fall back to the public landing');
assert.strictEqual(unknownInit.activeView, 'ai-agents');
assert.strictEqual(unknownInit.currentPath, '/not-a-real-page', 'The entered URL must not be rewritten');
assert.strictEqual(
  nextUrlForState({ pageMode: 'landing', activeView: 'ai-agents', selectedAgentId: null, pathname: '/not-a-real-page' }),
  null,
  'Landing fallback must not touch history (non-destructive)'
);
assert.strictEqual(parseRoute('/'), null, 'The public home route stays a landing route');
pass('Unknown routes fall back to landing without rewriting the URL');

// ===========================================================================
// 10. Unauthenticated visitors are never granted protected content
// ===========================================================================
for (const [path] of CANONICAL) {
  const init = initialRouteState(path, false);
  assert.strictEqual(
    init.pageMode,
    'landing',
    `${path} must not enter protected app state without a saved session`
  );
}
assert.ok(
  appSource.includes("pageMode === 'app' && !isAuthenticated && !isLoading"),
  'AuthSessionGuard session enforcement missing'
);
assert.ok(
  appSource.includes('hasSavedSession()'),
  'Protected initialization and popstate app-entry must check the saved session'
);
assert.strictEqual(
  nextUrlForState({ pageMode: 'landing', activeView: 'tools-scanner', selectedAgentId: null, pathname: '/discover' }),
  null,
  'Landing mode must never claim a canonical section URL'
);
pass('Unauthenticated deep links stay on the public landing; AuthSessionGuard still enforces expiry');

// ===========================================================================
// 11. Batch 1 + Batch 2 remain intact (executed, not just asserted)
// ===========================================================================
const runSuite = (file: string) =>
  execFileSync(process.execPath, ['--import', 'tsx', file], {
    cwd: root,
    encoding: 'utf8',
    stdio: 'pipe'
  });
const b1Output = runSuite(join('tests', 'ux-home-screen-fallback.test.ts'));
const b2Output = runSuite(join('tests', 'ux-wayfinding-discover.test.ts'));
assert.ok(b1Output.includes('ALL CHECKS PASSED'), 'Batch 1 fallback suite failed');
assert.ok(b2Output.includes('17 CHECKS PASSED'), 'Batch 2 wayfinding/discover suite failed');
pass('Batch 1 (F1 fallback guard) and Batch 2 (F2/F6) suites both still pass');

// ===========================================================================
// 12. Refresh contract holds for all four routes with zero history writes
// ===========================================================================
for (const [path, view] of Object.entries(VIEW_BY_PATH)) {
  const init = initialRouteState(path, true);
  assert.strictEqual(init.pageMode, 'app', `${path}: session refresh must restore app mode`);
  assert.strictEqual(init.activeView, view, `${path}: session refresh must restore the view`);
  assert.strictEqual(init.currentPath, path, `${path}: current path must stay canonical`);
  assert.strictEqual(
    nextUrlForState({
      pageMode: init.pageMode,
      activeView: init.activeView,
      selectedAgentId: init.selectedAgentId,
      pathname: path
    }),
    null,
    `${path}: initialization must not rewrite history (req: no default-route overwrite)`
  );
  assert.strictEqual(normalizePath(`${path}/`), path, `${path}: trailing slash must resolve to the same route`);
}
pass('Refresh covered for /agents, /discover, /evidence, /settings with zero history writes');

// ===========================================================================
// 13. No routing framework, no new dependency, no value imports in routes.ts
// ===========================================================================
for (const forbidden of ['"react-router"', '"react-router-dom"', '"wouter"', '"jsdom"', '"@testing-library/react"', '"vitest"']) {
  assert.ok(!packageJson.includes(forbidden), `Forbidden dependency introduced: ${forbidden}`);
}
const valueImports = routesSource.match(/^import (?!type)/gm) || [];
assert.strictEqual(valueImports.length, 0, 'routes.ts must stay dependency-free (type-only imports allowed)');
pass('URL persistence implemented with zero new dependencies or routing framework');

console.log('==================================================================');
console.log(`>>> UX BATCH 3 — URL PERSISTENCE & DEEP-LINK RESTORATION: ${passed} CHECKS PASSED <<<`);
console.log('==================================================================');
