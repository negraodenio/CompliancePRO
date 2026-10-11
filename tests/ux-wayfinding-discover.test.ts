/**
 * UX BATCH 2 — WAYFINDING (F2) & DISCOVER SUCCESS FLOW (F6) REGRESSION TEST
 *
 * F6 (Discover scan success): scan-success handlers used to redirect the user
 * to 'overview-center' while the success surface only renders under
 * 'tools-scanner' — the success confirmation was never visible. The fix keeps
 * the user in Discover, clears stale results at scan start, and renders one
 * success surface with one deliberate CTA ("Review in AI Agents").
 *
 * F2 (Wayfinding): internal views outside the four canonical sidebar
 * destinations showed no active navigation. The fix adds a small contextual
 * navigation bar driven by the view-context mapping in
 * src/web/navigation/view-context.ts.
 *
 * Strategy: exercise the real modules directly (mapping + components rendered
 * via react-dom/server) and use focused source assertions only for the App.tsx
 * handler wiring that cannot be mounted without a DOM. No network, no backend,
 * no browser.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert';
import React from 'react';

const root = join(import.meta.dirname, '..');
const appSource = readFileSync(join(root, 'src', 'web', 'App.tsx'), 'utf8');
const shellSource = readFileSync(join(root, 'src', 'web', 'components', 'AppShell.tsx'), 'utf8');
const successPanelSource = readFileSync(join(root, 'src', 'web', 'components', 'ScanSuccessPanel.tsx'), 'utf8');

let passed = 0;
const pass = (label: string) => {
  passed += 1;
  console.log(`  [UX-B2 PASS ${passed}]: ${label}`);
};

// ---------------------------------------------------------------------------
// Shared fixtures: canonical nav views + ActiveNavView union
// ---------------------------------------------------------------------------
const typeMatch = shellSource.match(/export type ActiveNavView =([\s\S]*?);/);
assert.ok(typeMatch, 'ActiveNavView type not found in AppShell.tsx');
const navViews = [...typeMatch[1].matchAll(/'([a-z-]+)'/g)].map(m => m[1]);

const {
  VIEW_CONTEXT,
  CANONICAL_NAV_LABELS,
  CANONICAL_NAV_VIEWS,
  getViewContext
} = await import('../src/web/navigation/view-context');

const { renderToStaticMarkup } = await import('react-dom/server');
const { ScanSuccessPanel } = await import('../src/web/components/ScanSuccessPanel');
const { ViewContextBar } = await import('../src/web/components/ViewContextBar');

// Extract a top-level App.tsx handler body (from `const <name> =` to its `};`)
const handlerBody = (name: string): string => {
  const start = appSource.indexOf(`const ${name} =`);
  assert.ok(start >= 0, `${name} not found in App.tsx`);
  const end = appSource.indexOf('\n  };', start);
  assert.ok(end > start, `${name} body end not found`);
  return appSource.slice(start, end);
};

const SCAN_HANDLERS = ['handleScanGitHub', 'handleScanZip', 'handleScanFolder', 'handleSelectDemo'];

// ===========================================================================
// 1. Successful scans remain in Discover (no auto redirect on success)
// ===========================================================================
for (const name of SCAN_HANDLERS) {
  const body = handlerBody(name);
  assert.ok(
    !body.includes('setActiveView'),
    `F6 REGRESSION: ${name} changes the active view on scan success — the user is taken out of Discover`
  );
  assert.ok(body.includes('runLocalScan'), `${name} no longer executes the real scan`);
  assert.ok(body.includes('ingestScan'), `${name} no longer preserves scan results`);
  pass(`${name}: success keeps the current view (no redirect) and still scans + stores results`);
}

// ===========================================================================
// 2 + 3. Real successful result => exactly one success surface;
//        failed/cleared scans => no success surface
// ===========================================================================
const scanFixture = {
  repo: { name: 'acme/scanner' },
  source: { agents: [{ name: 'agent-a' }, { name: 'agent-b' }] }
} as any;

const successMarkup = renderToStaticMarkup(
  React.createElement(ScanSuccessPanel, { scanResult: scanFixture, onReviewAgents: () => {} })
);
assert.strictEqual(
  (successMarkup.match(/data-testid="scan-success-panel"/g) || []).length, 1,
  'A successful scan must render exactly one success surface'
);
assert.strictEqual(
  (successMarkup.match(/data-testid="scan-success-cta"/g) || []).length, 1,
  'A successful scan must expose exactly one primary CTA'
);
assert.ok(successMarkup.includes('Scan complete'), 'Success message missing');
assert.ok(successMarkup.includes('acme/scanner'), 'Success message does not identify the scanned repository');
assert.ok(successMarkup.includes('<strong>2</strong>'), 'Success message does not report the discovered agent count');
assert.ok(successMarkup.includes('Review in AI Agents'), 'Primary CTA must be "Review in AI Agents"');
pass('Real scan result renders one success surface, one message, one "Review in AI Agents" CTA');

const emptyMarkup = renderToStaticMarkup(
  React.createElement(ScanSuccessPanel, { scanResult: null, onReviewAgents: () => {} })
);
assert.strictEqual(emptyMarkup, '', 'No scan result must render NO success surface');
pass('No scan result (failed/cleared scan) renders no success surface');

// Failed scans must clear any previous result before attempting a new one,
// so a failure can never surface a stale success message or stale results.
for (const name of SCAN_HANDLERS) {
  const body = handlerBody(name);
  const clearIdx = body.indexOf('setScanResult(null)');
  const tryIdx = body.indexOf('try {');
  assert.ok(clearIdx >= 0, `${name} does not clear stale scan results before a new attempt`);
  assert.ok(clearIdx < tryIdx, `${name} clears results only after the attempt — failures keep stale results`);
  pass(`${name}: stale results cleared before the attempt (failed scans show no success banner)`);
}

// App must gate the success surface on a real result
const scannerBlockStart = appSource.indexOf("{activeView === 'tools-scanner' && (");
const nextViewBlock = appSource.indexOf("{activeView === 'govern-controls' && (");
assert.ok(scannerBlockStart > 0 && nextViewBlock > scannerBlockStart, 'Discover (tools-scanner) block not found');
const scannerBlock = appSource.slice(scannerBlockStart, nextViewBlock);
assert.ok(scannerBlock.includes('{scanResult && ('), 'Success surface is not gated on a scan result');
assert.ok(
  scannerBlock.indexOf('{scanResult && (') < scannerBlock.indexOf('<ScanSuccessPanel'),
  'Success surface renders outside the scan-result gate'
);
assert.ok(scannerBlock.includes('<ScanSuccessPanel'), 'Discover view does not render the success surface');
assert.ok(scannerBlock.includes('<HeroScanner'), 'Discover view no longer renders the scanner');
assert.ok(!appSource.includes('mapped to Agent Inventory'), 'Old contradictory success message still present');
assert.ok(!appSource.includes('View in AI Agents →'), 'Old CTA label still present — must be "Review in AI Agents"');
pass('App renders the success surface inside the Discover view, gated on a real scan result');

// ===========================================================================
// 4. The CTA navigates to AI Agents (deliberate, not automatic)
// ===========================================================================
assert.ok(
  successPanelSource.includes('onClick={onReviewAgents}'),
  'ScanSuccessPanel CTA does not invoke the onReviewAgents callback'
);
const ctaIdx = appSource.indexOf('<ScanSuccessPanel');
assert.ok(ctaIdx > 0, 'ScanSuccessPanel is not used in App.tsx');
const ctaUsage = appSource.slice(ctaIdx, ctaIdx + 400);
assert.ok(
  ctaUsage.includes("setActiveView('ai-agents')"),
  'The success CTA must navigate to AI Agents when deliberately clicked'
);
pass('CTA callback is wired to navigate to AI Agents on click (never automatically)');

// ===========================================================================
// 5. Contextual navigation appears only where needed
// ===========================================================================
const canonical = ['ai-agents', 'tools-scanner', 'assure-evidence', 'settings'];
const mappedViews = Object.keys(VIEW_CONTEXT);

for (const view of mappedViews) {
  assert.ok(navViews.includes(view), `Mapped view '${view}' is not part of ActiveNavView`);
}
for (const view of canonical) {
  assert.ok(!mappedViews.includes(view), `Canonical view '${view}' must not render a redundant context bar`);
}
const unmappedViews = ['discover-passports', 'discover-assessments', 'assure-simulator', 'assure-readiness', 'tools-operations', 'tools-deployment'];
for (const view of unmappedViews) {
  assert.ok(!mappedViews.includes(view), `'${view}' has no verified return destination and must not be mapped`);
}
assert.ok(appSource.includes('const viewContext = getViewContext(activeView);'), 'App does not resolve the view context');
assert.ok(
  appSource.includes('!selectedAgentId && viewContext &&'),
  'Context bar is not conditionally rendered (must be hidden on Agent Detail, which has its own back link)'
);
assert.ok(
  readFileSync(join(root, 'src', 'web', 'views', 'AgentDetailView.tsx'), 'utf8').includes('Back to AI Agents'),
  'Agent Detail lost its existing back navigation'
);
pass(`Context bar mapped for ${mappedViews.length} internal views only (canonical + Agent Detail excluded)`);

// ===========================================================================
// 6. Return destinations follow the navigation mapping
// ===========================================================================
assert.deepStrictEqual(
  [...CANONICAL_NAV_VIEWS].sort(), [...canonical].sort(),
  'Canonical navigation set changed'
);
assert.deepStrictEqual(
  CANONICAL_NAV_LABELS,
  { 'ai-agents': 'AI Agents', 'tools-scanner': 'Discover', 'assure-evidence': 'Evidence', 'settings': 'Settings' },
  'Canonical navigation labels changed'
);
for (const entry of Object.values(VIEW_CONTEXT)) {
  assert.ok(
    canonical.includes(entry.returnTo as string),
    `Return destination '${entry.returnTo}' is not a canonical destination`
  );
}
const destinationsUsed = new Set(Object.values(VIEW_CONTEXT).map(e => e.returnTo));
assert.strictEqual(destinationsUsed.size, 4, 'All internal views must not redirect to the same destination');

const expectedReturns: Record<string, string> = {
  'overview-center': 'ai-agents',
  'studio-builder': 'ai-agents',
  'cockpit-control': 'ai-agents',
  'discover-inventory': 'tools-scanner',
  'discover-agents': 'tools-scanner',
  'assure-audit': 'assure-evidence',
  'assure-reports': 'assure-evidence',
  'tools-integrations': 'settings',
  'manage-team': 'settings',
  'learn-academy': 'settings'
};
for (const [view, returnTo] of Object.entries(expectedReturns)) {
  assert.strictEqual(getViewContext(view as any)?.returnTo, returnTo, `${view} return destination drifted`);
}
for (const view of ['govern-controls', 'govern-risk', 'govern-policies', 'govern-compliance', 'operate-decisions', 'operate-approvals', 'operate-actions', 'operate-incidents', 'operate-runtime']) {
  assert.strictEqual(getViewContext(view as any)?.returnTo, 'settings', `${view} return destination drifted`);
}
pass('Every mapped return destination is canonical, follows the navigation flow, and spans all 4 destinations');

// Real component: every mapped context renders one bar with the correct action
const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
for (const [view, entry] of Object.entries(VIEW_CONTEXT)) {
  const html = renderToStaticMarkup(
    React.createElement(ViewContextBar, { context: entry as any, onReturn: () => {} })
  );
  assert.strictEqual(
    (html.match(/data-testid="view-context-return"/g) || []).length, 1,
    `Context bar for '${view}' must expose exactly one action`
  );
  assert.ok(html.includes(escapeHtml((entry as any).title)), `Context bar for '${view}' missing its current-view title`);
  assert.ok(
    html.includes(escapeHtml(`Back to ${CANONICAL_NAV_LABELS[(entry as any).returnTo]}`)),
    `Context bar for '${view}' action does not match the mapping`
  );
}
pass(`ViewContextBar renders title + single correct "Back to …" action for all ${mappedViews.length} contexts`);

// ===========================================================================
// 7. Canonical navigation remains exactly four items
// ===========================================================================
const topMatch = shellSource.match(/const topLevelItems = \[([\s\S]*?)\];/);
assert.ok(topMatch, 'topLevelItems not found in AppShell.tsx');
const topIds = [...topMatch[1].matchAll(/id: '([a-z-]+)' as ActiveNavView/g)].map(m => m[1]);
const topLabels = [...topMatch[1].matchAll(/label: '([^']+)'/g)].map(m => m[1]);
assert.deepStrictEqual(topIds, ['ai-agents', 'tools-scanner', 'assure-evidence'], 'Sidebar primary destinations changed');
assert.deepStrictEqual(topLabels, ['AI Agents', 'Discover', 'Evidence'], 'Sidebar primary labels changed');
assert.ok(
  shellSource.includes("setActiveView('settings')"),
  'Settings destination missing from the sidebar'
);
pass('Canonical sidebar remains exactly 4 items: AI Agents, Discover, Evidence, Settings');

// ===========================================================================
// 8. Batch 1 fallback regression fix remains intact
// ===========================================================================
const guardMatch = appSource.match(/!\[([^\]]+)\]\.includes\(activeView\)/);
assert.ok(guardMatch, 'Batch 1 fallback guard not found');
const guardViews = [...guardMatch[1].matchAll(/'([a-z-]+)'/g)].map(m => m[1]);
assert.ok(guardViews.includes('ai-agents'), "Batch 1 REGRESSION: 'ai-agents' missing from fallback guard");
const b1Test = readFileSync(join(root, 'tests', 'ux-home-screen-fallback.test.ts'), 'utf8');
assert.ok(b1Test.includes('UX-FALLBACK PASS 6'), 'Batch 1 regression test file missing or truncated');
pass("Batch 1 intact: 'ai-agents' fallback guard present and Batch 1 test file preserved");

console.log('==================================================================');
console.log(`>>> UX BATCH 2 — WAYFINDING & DISCOVER FLOW: ${passed} CHECKS PASSED <<<`);
console.log('==================================================================');
