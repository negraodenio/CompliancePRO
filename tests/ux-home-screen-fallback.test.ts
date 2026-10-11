/**
 * UX BATCH 1 — HOME SCREEN FALLBACK GUARD REGRESSION TEST
 *
 * Root cause (F1, UX Clarity Audit): src/web/App.tsx renders a
 * "roadmap / coming-soon" fallback card for every activeView NOT listed in
 * its exclusion guard. The guard was missing 'ai-agents', so the default
 * home screen rendered the real agent inventory PLUS the misleading
 * fallback card ("part of the CG-AG Enterprise SaaS roadmap").
 *
 * This test statically verifies, straight from source, that:
 *   1. The ActiveNavView union (AppShell.tsx) and the fallback guard
 *      (App.tsx) stay in sync — every canonical view is guarded.
 *   2. 'ai-agents' specifically is guarded (the reported regression).
 *   3. The legitimate fallback card still exists for genuinely
 *      unsupported views (it must NOT be deleted, only guarded).
 *
 * Local source assertions only. No network, no backend, no browser.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert';

const root = join(import.meta.dirname, '..');
const appSource = readFileSync(join(root, 'src', 'web', 'App.tsx'), 'utf8');
const shellSource = readFileSync(join(root, 'src', 'web', 'components', 'AppShell.tsx'), 'utf8');

// 1. Parse the canonical ActiveNavView union from AppShell.tsx
const typeMatch = shellSource.match(/export type ActiveNavView =([\s\S]*?);/);
assert.ok(typeMatch, 'ActiveNavView type not found in AppShell.tsx');
const navViews = [...typeMatch[1].matchAll(/'([a-z-]+)'/g)].map(m => m[1]);
assert.ok(navViews.length >= 4, `Expected >= 4 canonical nav views, found ${navViews.length}`);

// 2. Parse the fallback exclusion guard from App.tsx
const guardMatch = appSource.match(/!\[([^\]]+)\]\.includes\(activeView\)/);
assert.ok(guardMatch, 'Fallback guard array not found in App.tsx');
const guardViews = [...guardMatch[1].matchAll(/'([a-z-]+)'/g)].map(m => m[1]);

// 3. Every canonical view must be guarded — no view may render the roadmap card
const unguarded = navViews.filter(v => !guardViews.includes(v));
assert.deepStrictEqual(
  unguarded, [],
  `Views rendering the roadmap fallback card on their own screen: ${JSON.stringify(unguarded)}`
);

// 4. Explicit regression check for the reported defect
assert.ok(
  guardViews.includes('ai-agents'),
  "F1 REGRESSION: 'ai-agents' is missing from the fallback guard — the home screen shows the roadmap card"
);

// 5. Guard must not contain stale views outside the type (keeps lists in sync)
const unknown = guardViews.filter(v => !navViews.includes(v));
assert.deepStrictEqual(unknown, [], `Stale guard entries not in ActiveNavView: ${JSON.stringify(unknown)}`);

// 6. The legitimate fallback for genuinely unsupported views must still exist
assert.ok(
  appSource.includes('part of the CG-AG Enterprise SaaS roadmap'),
  'Legitimate fallback card for unsupported views was removed — it must be preserved and only guarded'
);
assert.ok(
  appSource.includes('.includes(activeView)'),
  'Fallback guard condition was removed — it must render only for unsupported views'
);

console.log('==================================================================');
console.log('>>> UX BATCH 1 — HOME SCREEN FALLBACK GUARD: 6 CHECKS PASSED  <<<');
console.log('==================================================================');
console.log(`  [UX-FALLBACK PASS 1]: ActiveNavView parsed (${navViews.length} canonical views)`);
console.log(`  [UX-FALLBACK PASS 2]: Fallback guard parsed (${guardViews.length} guarded views)`);
console.log('  [UX-FALLBACK PASS 3]: All canonical views are guarded (no roadmap card on any primary screen)');
console.log("  [UX-FALLBACK PASS 4]: 'ai-agents' home screen explicitly guarded (F1 regression)");
console.log('  [UX-FALLBACK PASS 5]: No stale guard entries');
console.log('  [UX-FALLBACK PASS 6]: Legitimate fallback for unsupported views preserved');
console.log('>>> UX BATCH 1 FALLBACK GUARD: ALL CHECKS PASSED <<<');
