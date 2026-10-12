/**
 * UX BATCH 5 — ACADEMY DISCOVERABILITY & RENDERABILITY REGRESSION TEST
 *
 * Guards the Academy entry points and the read-only render path of the
 * in-product training experience:
 *
 * 1. The sidebar exposes an Academia entry wired to 'learn-academy'
 *    (Academy was previously reachable only via Settings and a modal —
 *    the mission required a first-class sidebar destination).
 * 2. App.tsx routes 'learn-academy' to AcademyView and treats the view as
 *    a known internal destination (fallback logic must not fire).
 * 3. AcademyView renders standalone (no context providers) with its
 *    curriculum home: heading, both tabs and all 6 level headings, without
 *    legacy CG-AG branding.
 * 4. Every navigation target referenced by curriculum content (module
 *    relatedNavView, exercise targetNavView) is a real ActiveNavView value.
 *
 * Strategy: source assertions for App wiring + react-dom/server render of
 * the real component + module-level curriculum checks. No network, no
 * backend, no browser. App-mode journeys remain manual (documented caveat:
 * no /auth/login route exists locally).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert';

const root = join(import.meta.dirname, '..');
const shellSource = readFileSync(join(root, 'src', 'web', 'components', 'AppShell.tsx'), 'utf8');
const appSource = readFileSync(join(root, 'src', 'web', 'App.tsx'), 'utf8');
const settingsSource = readFileSync(join(root, 'src', 'web', 'views', 'SettingsView.tsx'), 'utf8');

let passed = 0;
const pass = (label: string) => {
  passed += 1;
  console.log(`  [UX-B5 PASS ${passed}]: ${label}`);
};

// ---------------------------------------------------------------------------
// 1. Sidebar entry (AppShell) — Academia button -> 'learn-academy'
// ---------------------------------------------------------------------------
{
  const sidebarStart = shellSource.indexOf("setActiveView('learn-academy')");
  assert.ok(sidebarStart > 0, 'AppShell sidebar has no setActiveView("learn-academy") button');
  const block = shellSource.slice(sidebarStart - 400, sidebarStart + 1000);
  assert.ok(block.includes('GraduationCap'), 'Academia sidebar entry must use the GraduationCap icon');
  assert.ok(block.includes('Academia'), 'Academia sidebar entry must be labelled "Academia"');
  pass('Sidebar exposes the Academia entry (GraduationCap -> learn-academy)');

  const typeMatch = shellSource.match(/export type ActiveNavView =([\s\S]*?);/);
  assert.ok(typeMatch, 'ActiveNavView type not found in AppShell.tsx');
  assert.ok(typeMatch[1].includes("'learn-academy'"), 'ActiveNavView union must include learn-academy');
  pass('ActiveNavView union includes learn-academy');
}

// ---------------------------------------------------------------------------
// 2. App routing (App.tsx) — view renders AcademyView, known to fallback logic
// ---------------------------------------------------------------------------
{
  const route = appSource.match(/\{activeView === 'learn-academy' && <AcademyView[^}]*\}/);
  assert.ok(route, 'App.tsx must render AcademyView for learn-academy');
  assert.ok(route![0].includes('onNavigate'), 'AcademyView must receive onNavigate for cross-view CTAs');
  pass('App.tsx routes learn-academy to AcademyView with onNavigate wiring');

  const fallbackLine = appSource.split('\n').find((l) => l.includes('.includes(activeView)'));
  assert.ok(fallbackLine, 'App.tsx fallback guard not found');
  assert.ok(fallbackLine!.includes("'learn-academy'"), 'learn-academy must be listed in the known-views guard (no fallback)');
  pass('learn-academy is a known internal destination (no home-screen fallback)');

  assert.ok(settingsSource.includes("id: 'learn-academy'"), 'SettingsView must keep its Academy entry (existing entry point)');
  pass('SettingsView knowledge entry for Academy preserved');
}

// ---------------------------------------------------------------------------
// 3. view-context — title & return path for the Academy destination
// ---------------------------------------------------------------------------
{
  const { VIEW_CONTEXT } = await import('../src/web/navigation/view-context');
  const ctx = (VIEW_CONTEXT as Record<string, { title: string; returnTo?: string }>)['learn-academy'];
  assert.ok(ctx, 'view-context must define learn-academy');
  assert.ok(ctx.title.length > 0, 'learn-academy context must expose a title');
  pass(`view-context defines learn-academy (title: "${ctx.title}", returnTo: ${ctx.returnTo ?? '—'})`);
}

// ---------------------------------------------------------------------------
// 4. AcademyView renders standalone: heading, tabs, all 6 levels, no legacy brand
// ---------------------------------------------------------------------------
{
  const { renderToStaticMarkup } = await import('react-dom/server');
  const React = (await import('react')).default;
  const { AcademyView } = await import('../src/web/views/AcademyView');

  const html = renderToStaticMarkup(
    React.createElement(AcademyView, { onNavigate: () => {} })
  );

  assert.ok(html.includes('Academia de Governação de Agentes de IA'), 'Academy heading missing from render');
  pass('AcademyView renders its PT-PT heading without context providers');

  assert.ok(html.includes('Percurso de aprendizagem'), 'Percurso tab missing');
  assert.ok(html.includes('Glossário técnico'), 'Glossário tab missing');
  pass('Both top-level tabs (Percurso, Glossário) present in the default view');

  for (let level = 1; level <= 6; level++) {
    assert.ok(html.includes(`Nível ${level} —`), `Level ${level} heading missing from render`);
  }
  pass('All 6 level headings (Nível 1..6) render on the curriculum home');

  assert.ok(!html.includes('CG-AG Governance OS'), 'Legacy CG-AG branding leaked into the Academy render');
  assert.ok(html.includes('Certificado'), 'Certificate entry point missing from header');
  pass('No legacy CG-AG branding; certificate entry point present in header');
}

// ---------------------------------------------------------------------------
// 5. Curriculum navigation targets are real ActiveNavView values
// ---------------------------------------------------------------------------
{
  const typeMatch = shellSource.match(/export type ActiveNavView =([\s\S]*?);/);
  const navViews = new Set([...typeMatch![1].matchAll(/'([a-z-]+)'/g)].map((m) => m[1]));

  const { ACADEMY_MODULES } = await import('../src/web/data/academy');
  let checked = 0;
  for (const mod of ACADEMY_MODULES) {
    if (mod.relatedNavView) {
      assert.ok(navViews.has(mod.relatedNavView), `${mod.id}: relatedNavView "${mod.relatedNavView}" not in ActiveNavView`);
      checked++;
    }
    assert.ok(navViews.has(mod.exercise.targetNavView), `${mod.id}: exercise targetNavView "${mod.exercise.targetNavView}" not in ActiveNavView`);
    checked++;
  }
  assert.ok(checked >= 40, `expected >=40 navigation targets, checked ${checked}`);
  pass(`All ${checked} curriculum navigation targets resolve to real ActiveNavView values`);
}

console.log(`\nUX Batch 5 — Academy discoverability: ${passed} CHECKS PASSED`);
