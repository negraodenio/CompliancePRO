/**
 * UX BATCH 4 — FEEDBACK & ACTION CLARITY (F5, F8, F9) REGRESSION TEST
 *
 * F5 (Feedback): in-scope browser alert() calls gave failures/success a
 * jarring, inconsistent surface. They are replaced with one shared inline
 * status component (InlineStatus) rendered next to the action that produced
 * it, with stale feedback cleared when a new operation starts. Error text
 * stays byte-for-byte identical to the original alert messages; the passport
 * "verified" claim (which had no backend implementation) becomes an honest
 * limitation notice; the audit-pack alert becomes a collapsible viewer while
 * the real EXPORT download stays untouched. The two window.confirm
 * safeguards (course-progress reset, member removal) are deliberately out of
 * scope — replacing them would require building confirmation UI, which the
 * brief excludes.
 *
 * F8 (Action labels): the AgentDetailView status button used Play/Pause
 * icons implying a pause/resume operation that does not exist — the handler
 * only opens the Governance Cockpit. Both branches now show one explicit,
 * honest label ("Review Runtime Controls") with a neutral Cpu icon and an
 * unchanged handler.
 *
 * F9 (Tab labels & CTAs): raw tab ids (overview, provenance, …) and an
 * emoji-led tab are replaced by human-readable labels via module-level
 * label maps (IDs, state and callbacks unchanged), and navigation CTAs use
 * the canonical sidebar names ("Discover", "View Evidence").
 *
 * Strategy: source assertions over the exact strings the brief requires
 * (no jsdom available), one react-dom/server render of InlineStatus, and
 * execution of the Batch 1–3 suites to prove they remain intact. No
 * network, no backend, no browser.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert';
import React from 'react';

const root = join(import.meta.dirname, '..');
const webRoot = join(root, 'src', 'web');

const read = (...parts: string[]) => readFileSync(join(root, ...parts), 'utf8');
const appSource = read('src', 'web', 'App.tsx');
const shellSource = read('src', 'web', 'components', 'AppShell.tsx');
const landingSource = read('src', 'web', 'views', 'CommercialLandingView.tsx');
const addModalSource = read('src', 'web', 'components', 'AddAgentModal.tsx');
const bannerSource = read('src', 'web', 'components', 'DiscoveredAgentsBanner.tsx');
const agentsTeamsSource = read('src', 'web', 'views', 'AgentsTeamsView.tsx');
const cockpitSource = read('src', 'web', 'views', 'GovernanceCockpitView.tsx');
const execSummarySource = read('src', 'web', 'components', 'ExecutiveSummary.tsx');
const playgroundSource = read('src', 'web', 'components', 'CodePlayground.tsx');
const academyModalSource = read('src', 'web', 'components', 'AcademyModal.tsx');
const detailSource = read('src', 'web', 'views', 'AgentDetailView.tsx');
const evidenceSource = read('src', 'web', 'views', 'ProtectedEvidenceView.tsx');
const inventorySource = read('src', 'web', 'views', 'AiInventoryView.tsx');
const inventoryPageSource = read('src', 'web', 'views', 'AgentInventoryPageView.tsx');
const academyViewSource = read('src', 'web', 'views', 'AcademyView.tsx');
const teamSource = read('src', 'web', 'views', 'TeamManagementView.tsx');

let passed = 0;
const pass = (label: string) => {
  passed += 1;
  console.log(`  [UX-B4 PASS ${passed}]: ${label}`);
};

const webFiles = (readdirSync(webRoot, { recursive: true }) as string[])
  .filter((f) => f.endsWith('.ts') || f.endsWith('.tsx'));
const sourcesOf = (filter: (f: string) => boolean): Array<{ file: string; src: string }> =>
  webFiles.filter(filter).map((f) => ({ file: f, src: readFileSync(join(webRoot, f), 'utf8') }));

// ===========================================================================
// 1. F5 — no browser alert()/window.alert() remains anywhere under src/web
// ===========================================================================
const alertSites = sourcesOf(() => true)
  .filter(({ src }) => /(^|[^.\w])alert\(/m.test(src) || src.includes('window.alert('))
  .map(({ file }) => file);
assert.deepStrictEqual(alertSites, [], `alert() still present in: ${alertSites.join(', ')}`);
pass('Zero alert()/window.alert() calls remain under src/web');

// ===========================================================================
// 2. F5 — the two window.confirm safeguards stay exactly where they were
// ===========================================================================
assert.ok(academyViewSource.includes('window.confirm('), 'AcademyView progress-reset confirm must remain');
assert.ok(teamSource.includes('window.confirm('), 'TeamManagementView removal confirm must remain');
const promptSites = sourcesOf(() => true).filter(({ src }) => src.includes('window.prompt('));
assert.deepStrictEqual(promptSites.map(({ file }) => file), [], 'No window.prompt was introduced');
pass('Deliberate window.confirm safeguards (progress reset, member removal) untouched; no prompts added');

// ===========================================================================
// 3. F5 — App.tsx scan errors: verbatim messages, state + both surfaces
// ===========================================================================
for (const msg of ['`GitHub Scan Error: ${err.message}`', '`ZIP Scan Error: ${err.message}`', '`Folder Scan Error: ${err.message}`']) {
  assert.ok(appSource.includes(`setScanError(${msg})`), `Missing setScanError(${msg})`);
}
assert.ok(appSource.includes('const [scanError, setScanError] = useState<string | null>(null);'), 'scanError state missing');
assert.strictEqual((appSource.match(/\{scanError && \(/g) || []).length, 1, 'App must render the scan error on the Discover surface');
assert.ok(landingSource.includes('{scanError && ('), 'Landing scan panel must render the scan error too');
assert.ok(appSource.includes('scanError={scanError}'), 'CommercialLandingView must receive scanError');
assert.ok(appSource.includes('onDismissScanError={() => setScanError(null)}'), 'Landing scan error must be dismissible');
assert.ok(landingSource.includes('<InlineStatus'), 'Landing scan panel must render the inline status');
assert.strictEqual((appSource.match(/setScanError\(null\);/g) || []).length, 4, 'Every scan handler (incl. demo) must clear stale errors at start');
pass('Scan failures surface verbatim errors inline on Discover and the landing panel (cleared at start)');

// ===========================================================================
// 4. F5 — modal/banner import errors: verbatim text, inline, dismissible
// ===========================================================================
assert.ok(addModalSource.includes("setSubmitError('Agent import could not be confirmed. Please retry when the backend is available.')"));
assert.ok(addModalSource.includes('setSubmitError(null)') && addModalSource.includes('<InlineStatus'));
assert.ok(bannerSource.includes("setImportError('Agent import could not be confirmed. Please retry when the backend is available.')"));
assert.ok(bannerSource.includes("setImportError('Inventory import could not be confirmed. Please retry; confirmed records will not be duplicated.')"));
assert.strictEqual((bannerSource.match(/setImportError\(null\);/g) || []).length, 2, 'Both import handlers must clear stale errors at start');
assert.ok(bannerSource.includes('<InlineStatus'));
pass('Add-agent and inventory import failures render the original messages inline, cleared per operation');

// ===========================================================================
// 5. F5 — passport verification claim is honest (no fake crypto claim)
// ===========================================================================
assert.ok(!agentsTeamsSource.includes('Verified against tamper-evident root'), 'Fake verification claim must be gone');
assert.ok(
  agentsTeamsSource.includes('has not been independently verified against a tamper-evident root'),
  'Honest limitation text missing'
);
assert.ok(agentsTeamsSource.includes('const PASSPORT_VERIFICATION_UNAVAILABLE'));
assert.ok(agentsTeamsSource.includes('setVerifyFeedback(') && agentsTeamsSource.includes('verifyFeedback.message'));
pass('Passport hash action reports the honest backend limitation instead of a fake verification');

// ===========================================================================
// 6. F5 — audit pack: collapsible viewer panel, EXPORT download untouched
// ===========================================================================
assert.ok(cockpitSource.includes('const [showAuditPack, setShowAuditPack]'), 'showAuditPack state missing');
assert.ok(cockpitSource.includes('data-testid="audit-pack-viewer"'), 'Viewer panel missing');
assert.ok(cockpitSource.includes('[ HIDE AUDIT PACK ]'), 'Toggle must offer a hide state');
assert.ok(cockpitSource.includes('[ VIEW AUDIT PACK ]'), 'Toggle must keep its view state');
assert.ok(cockpitSource.includes('downloadAnchor.click()'), 'EXPORT download flow must remain');
assert.ok(cockpitSource.includes('[ EXPORT ]'), 'EXPORT button must remain');
assert.ok(!cockpitSource.includes('alert('), 'Audit pack alert must be gone');
pass('Audit pack opens in a collapsible viewer panel; the real EXPORT download is unchanged');

// ===========================================================================
// 7. F5 — AI report / code audit / academy handouts keep their messages
// ===========================================================================
assert.ok(execSummarySource.includes('setReportError(`Falha ao gerar parecer: ${e.message}`)'));
assert.ok(execSummarySource.includes('setReportError(null)') && execSummarySource.includes('<InlineStatus'));
assert.ok(!execSummarySource.includes('alert('));
assert.ok(playgroundSource.includes('setAuditError(`Erro na auditoria: ${e.message}`)'));
assert.ok(playgroundSource.includes('setAuditError(null)') && playgroundSource.includes('<InlineStatus'));
assert.ok(!playgroundSource.includes('alert('));
assert.ok(academyModalSource.includes("setHandoutsInfo('Kit do Aluno indisponível: nenhum arquivo foi gerado nesta build — download não habilitado.')"));
assert.ok(!academyModalSource.includes('gerados com sucesso'), 'R3-A: handout button must never claim files were generated successfully');
assert.ok(!academyModalSource.includes('Kit do Aluno Completo Disponível'), 'R3-A: unavailable kit must not be labeled as available');
assert.ok(academyModalSource.includes('<InlineStatus'));
assert.ok(!academyModalSource.includes('alert('));
pass('Report, audit and handout messages are truthful on inline surfaces (handout = explicit unavailable)');

// ===========================================================================
// 8. F5 — shared InlineStatus renders correct semantics (react-dom/server)
// ===========================================================================
const { InlineStatus } = await import('../src/web/components/InlineStatus');
const { renderToStaticMarkup } = await import('react-dom/server');
const errHtml = renderToStaticMarkup(React.createElement(InlineStatus, { tone: 'error', message: 'boom happened' }));
assert.ok(errHtml.includes('role="alert"') && errHtml.includes('boom happened'), 'Error status must be an alert region');
const okHtml = renderToStaticMarkup(React.createElement(InlineStatus, { tone: 'success', message: 'all good' }));
assert.ok(okHtml.includes('role="status"') && okHtml.includes('all good'), 'Success status must be a polite status region');
pass('InlineStatus is a shared, dismissible component with correct alert/status roles');

// ===========================================================================
// 9. F8 — explicit, honest runtime action label; handler untouched
// ===========================================================================
assert.strictEqual(
  (detailSource.match(/Review Runtime Controls/g) || []).length,
  1,
  'Exactly one explicit runtime label expected'
);
assert.ok(!detailSource.includes('<Play '), 'Play icon removed (no resume operation exists)');
assert.ok(!detailSource.includes('<Pause '), 'Pause icon removed (no pause operation exists)');
assert.ok(!detailSource.includes('Pause runtime') && !detailSource.includes('Resume runtime'), 'Must not claim pause/resume');
assert.ok(detailSource.includes('<Cpu className="w-3.5 h-3.5" />'), 'Neutral Cpu icon expected');
const toggleStart = detailSource.indexOf('const handleToggleStatus = () => {');
assert.ok(toggleStart >= 0, 'handleToggleStatus missing');
const toggleBody = detailSource.slice(toggleStart, detailSource.indexOf('\n  };', toggleStart));
assert.ok(toggleBody.includes('onOpenCockpit?.(agent.id)'), 'Handler must still open the Governance Cockpit');
assert.ok(!toggleBody.includes('status ='), 'Handler must not mutate status (no pause/resume implemented)');
pass('Runtime button uses one honest label + neutral icon with an unchanged handler');

// ===========================================================================
// 10. F8 — other action labels stay accurate
// ===========================================================================
for (const label of ['Review Approvals', 'Open in Governance Cockpit', 'Open in Agent Studio', 'View Evidence']) {
  assert.ok(detailSource.includes(label), `Action label missing/changed: ${label}`);
}
assert.ok(!detailSource.includes('View audit evidence'), 'Old evidence CTA label must be gone');
pass('Remaining action labels unchanged and evidence CTA aligned to canonical naming');

// ===========================================================================
// 11. F9 — evidence drawer tabs use human-readable labels
// ===========================================================================
for (const label of ['Overview', 'Provenance & Lineage', 'Evidence Payload', 'Integrity Verification', 'Retention & Custody', 'Audit Link']) {
  assert.ok(evidenceSource.includes(`'${label}'`), `Evidence tab label missing: ${label}`);
}
assert.ok(!/(?<![\w.=])\{\s*tab\s*\}/.test(evidenceSource), 'Raw tab id render must be gone');
assert.ok(!evidenceSource.includes("tab === '"), 'Nested ternary label logic must be gone');
pass('Evidence drawer: all six tab labels human-readable via one label map');

// ===========================================================================
// 12. F9 — AI inventory drawer tabs use human-readable labels
// ===========================================================================
for (const label of ['Overview', 'Ownership & RACI', 'Controls Coverage', 'Evidence', 'Incidents']) {
  assert.ok(inventorySource.includes(`'${label}'`), `Inventory tab label missing: ${label}`);
}
assert.ok(!/(?<![\w.=])\{\s*tab\s*\}/.test(inventorySource), 'Raw tab id render must be gone in inventory');
pass('AI inventory drawer: all five tab labels human-readable via one label map');

// ===========================================================================
// 13. F9 — agent drawer tabs: no emoji-led label, canonical passport name
// ===========================================================================
for (const label of ['Topology', 'Autonomy', 'Tools', 'HITL Gates', 'Controls', 'Governance Passport']) {
  assert.ok(agentsTeamsSource.includes(`'${label}'`), `Drawer tab label missing: ${label}`);
}
assert.ok(!agentsTeamsSource.includes('🪪'), 'Emoji-led tab label must be gone');
assert.ok(!/(?<![\w.=])\{\s*tab\s*\}/.test(agentsTeamsSource), 'Raw tab id render must be gone in agents view');
pass('Agents drawer: six tab labels human-readable, emoji-led label removed');

// ===========================================================================
// 14. F9 — canonical navigation CTA names; sidebar untouched
// ===========================================================================
assert.ok(!inventoryPageSource.includes('Discover Agents'), 'CTA must use the canonical Discover name');
assert.ok(inventoryPageSource.includes('Discover'), 'Canonical Discover CTA missing');
assert.ok(shellSource.includes("label: 'AI Agents'") && shellSource.includes("label: 'Discover'") && shellSource.includes("label: 'Evidence'"), 'Canonical sidebar labels changed');
assert.ok(shellSource.includes('Canonical 4 Destinations'), 'Canonical sidebar structure comment changed');
pass('Navigation CTAs use canonical names while the sidebar stays exactly as it was');

// ===========================================================================
// 15. Batch 1–3 remain intact (executed, not just asserted)
// ===========================================================================
const runSuite = (file: string) =>
  execFileSync(process.execPath, ['--import', 'tsx', file], {
    cwd: root,
    encoding: 'utf8',
    stdio: 'pipe'
  });
const b1Output = runSuite(join('tests', 'ux-home-screen-fallback.test.ts'));
const b2Output = runSuite(join('tests', 'ux-wayfinding-discover.test.ts'));
const b3Output = runSuite(join('tests', 'ux-url-persistence.test.ts'));
assert.ok(b1Output.includes('ALL CHECKS PASSED'), 'Batch 1 fallback suite failed');
assert.ok(b2Output.includes('17 CHECKS PASSED'), 'Batch 2 wayfinding suite failed');
assert.ok(b3Output.includes('13 CHECKS PASSED'), 'Batch 3 URL persistence suite failed');
pass('Batch 1, Batch 2 and Batch 3 suites all still pass');

console.log('==================================================================');
console.log(`>>> UX BATCH 4 — FEEDBACK & ACTION CLARITY: ${passed} CHECKS PASSED <<<`);
console.log('==================================================================');
