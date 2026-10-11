# ComplyPRO — Final Readiness Audit, Phase 1

**Date:** 2026-10-10 · **Auditor role:** senior software architect / release-readiness auditor
**Repository:** `C:\Users\denio\Documents\Denio\PluginVIbeCOde\standalone-compliance-scanner`
**Scope:** READ-ONLY audit after UX Batches 1–4. No fixes implemented. No source, test, config, dependency, migration or environment files modified. No staging, commit, push, deploy, or production access. No browser test was executed during this audit.

---

## 1. Executive readiness verdict

**NOT RELEASE-READY.** The engineering foundation is real and partially proven; the product is not yet demonstrable in a browser by this audit, not reproducibly testable in clean CI, and has **no real external integrations** behind its three headline provider claims.

| Dimension | Verdict |
|---|---|
| Governance engine (HITL, evidence chain, fail-closed, tenant checks) | **Conditionally sound** — implemented and green in 24 CI suites executed this audit, with caveats (§5) |
| UX Batches 1–4 | **Green** — 6 + 17 + 13 + 15 checks all exit 0; source-verified only, no DOM/browser |
| Authentication end-to-end | **Unverified** — login/signup/me are served by a separate FastAPI service (`course/main_api.py`), not the Express app; the only stored E2E auth run is a **failure** |
| Pilot integrations (Salesforce, Schufa/Experian, core banking) | **Absent** — string labels only; demo-live correctly fails closed with `PROVIDER_CONFIGURATION_MISSING` |
| Honesty of user-facing success states | **Mixed** — key crypto claims fixed in B4, but 3 known fake-success/misleading surfaces remain (§6) |
| Test/CI reproducibility | **Broken on clean checkout** — `npm test` requires a gitignored `.env.test.local`; `npm run lint` is broken (eslint not installed); 64 of 90 test files reachable from no npm script |
| Browser validation | **None exists** — no jsdom/testing-library in the repo (explicitly forbidden by UX tests); Playwright run artifacts record a **failed** last run |

A green build (client + SSR + worker) was observed this audit; **build success is not evidence of production readiness.**

---

## 2. Git and change-integrity status

Verified by direct inspection (no destructive commands used at any point):

| Item | Observed value |
|---|---|
| Branch | `main` |
| HEAD | `cece04aacd495eb168c743452d135ddec3adfe17` (`cece04a`) — **matches expected** |
| Upstream | `main...origin/main [ahead 1]` — **matches expected** (commit `cece04a fix(governance): consolidate D1 D2 recovery and D4 regression tests`) |
| Staged changes | **None** (`git diff --cached --stat` empty) |
| Stash | `stash@{0}: On main: wip-truth-tuning-seo` — **intact** |

**Tracked modifications (13)** — all belong to UX Batches 1–4:

```
src/web/App.tsx (cumulative B1–B4, 172 changed lines)
src/web/components/{AcademyModal,AddAgentModal,CodePlayground,DiscoveredAgentsBanner,ExecutiveSummary}.tsx
src/web/views/{AgentDetailView,AgentInventoryPageView,AgentsTeamsView,AiInventoryView,CommercialLandingView,GovernanceCockpitView,ProtectedEvidenceView}.tsx
```

**Untracked (19)** — two distinct groups:

- **Batch 1–4 artifacts (must be committed eventually):** `src/web/components/{InlineStatus,ScanSuccessPanel,ViewContextBar}.tsx`, `src/web/navigation/` (routes.ts + view-context.ts), `tests/ux-{home-screen-fallback,wayfinding-discover,url-persistence,feedback-clarity}.test.ts`
- **Pre-existing, UNRELATED work (must NOT be swept into a UX commit):** `FINAL-*.md` (6 docs), `COMPLYPRO-TEST-MIGRATIONS.sql`, `tests/{deployment-gate-preflight.mjs,deployment-source-verification.mjs,final-forensic-live-readonly.ts,test-database-inspection.mjs}`

**Batch presence check:** B1 (`App.tsx` fallback guard + test), B2 (`navigation/view-context.ts`, `ViewContextBar`, `ScanSuccessPanel` + test), B3 (`navigation/routes.ts` + test), B4 (`InlineStatus` + 13 edited files + test) — all present and passing (§3).

**Accidental-commit risk:** HIGH if `git add -A` / `git add .` is ever used — it would stage 8 unrelated files. Any future commit must use explicit paths. `git diff --check` exit 0 (only benign LF→CRLF autocrlf notices on 8 edited files).

---

## 3. Automated test results

All commands run from the repository root during this audit. Exact commands, exit codes, results:

| # | Command | Exit | Result |
|---|---|---|---|
| 1 | `node --import tsx tests/ux-home-screen-fallback.test.ts` | 0 | `UX BATCH 1 FALLBACK GUARD: ALL CHECKS PASSED` (6 checks) |
| 2 | `node --import tsx tests/ux-wayfinding-discover.test.ts` | 0 | `UX BATCH 2 — WAYFINDING & DISCOVER FLOW: 17 CHECKS PASSED` |
| 3 | `node --import tsx tests/ux-url-persistence.test.ts` | 0 | `UX BATCH 3 — URL PERSISTENCE & DEEP-LINK RESTORATION: 13 CHECKS PASSED` |
| 4 | `node --import tsx tests/ux-feedback-clarity.test.ts` | 0 | `UX BATCH 4 — FEEDBACK & ACTION CLARITY: 15 CHECKS PASSED` |
| 5 | `npm test` | 0 | `Governance suite summary: 24 PASS / 0 FAIL` (includes `nat-governance-poc` 14/14) |
| 6 | `npm run typecheck` (`tsc --noEmit`) | 0 | no errors |
| 7 | `npm run build` (client + SSR app + worker) | 0 | vite builds complete |
| 8 | `git diff --check` | 0 | no whitespace errors (LF/CRLF notices only) |

**What `npm test` actually runs** (`tests/run-governance-suites.mjs`): 24 suites — compliance-compiler, guardian-evaluation, governed-capability-gateway, evidence-ledger, agent-provisioning, isolated-runtime, crewai-runtime-adapter, agent-studio-api, governance-cockpit, model-gateway, tool-gateway, data-gateway, end-to-end-governed-agent, model-gateway-real-provider, s8-1-security, s8-2-persistence, s8-2-real-restart, s8-2b-rls-real, s8-3-container-audit, s8-4-worker-sandbox, s8-5-active-governance, s8-remediation-security, real-agent-inventory, nat-governance-poc. Each runs with `NODE_ENV=test`, `DATABASE_URL=''`, test-Supabase env from gitignored `.env.test.local`, provider fixtures injected via `--import tests/bootstrap-provider-fixtures.ts`, and a network guard that `exit(86)`s on any production endpoint (complypro.pt, compliancepro-h6xb.onrender.com, vercel.app, api.supabase.com).

**Not run (deliberately):**
- `npm run lint` — **broken by configuration**: the script exists (`package.json:16`) but eslint is not in dependencies, not in the lockfile, not on disk, and no eslint config file exists anywhere. Not executed (it cannot pass; installing tools is out of scope).
- `tests/production-acceptance.test.ts`, `tests/production-e2e.spec.ts` — hit production; forbidden by audit constraints; gated behind `COMPLYPRO_E2E_TARGET=production` anyway. **Not executed.** Stored artifact `test-results/.last-run.json` records their last (Playwright) run as **failed** (5 failures, leakage check).
- 64 dormant test files reachable from no npm script (including the strongest fail-closed proofs: `production-authority-remediation`, `d2-runtime-timeout-remediation`, `d4-metrics-503-forensic`, and all four `ux-*` suites).
- `vitest`/`@playwright/test`-based suites — both packages are **undeclared** in `package.json`/lockfile (present only as ad-hoc `node_modules` installs that `npm ci` would remove).

**Interpretation:** every check the repository can run locally passed. These are unit/integration tests over Node modules plus source-string assertions — **none render the app in a browser** (jsdom/testing-library absent and explicitly forbidden by `tests/ux-url-persistence.test.ts:282`).

---

## 4. Manual browser checklist

**Status: NOTHING in this section has been executed.** No browser validation was performed during this audit. Each check must be run manually before release sign-off. Preconditions common to all: `npm run dev` (or a deployed preview), browser DevTools open, a clean profile.

### M1 — Initial AI Agents screen; no roadmap fallback card
- **Preconditions:** No saved session (`localStorage` cleared of `cgag_auth_token`).
- **Steps:** 1) Open `http://localhost:5173/`. 2) Log in (or seed a session). 3) Navigate to AI Agents.
- **Expected:** AI Agents workspace renders as home; the legacy "roadmap fallback" card does **not** appear for any supported view; unsupported view IDs still fall back per B1 rules.
- **Evidence:** Screenshot of initial screen; screenshot showing absence of fallback card; console log free of errors.

### M2 — Four primary navigation items + contextual wayfinding
- **Preconditions:** Authenticated session.
- **Steps:** 1) Click **AI Agents**, **Discover**, **Evidence**, **Settings** in the sidebar. 2) Enter an internal view (Agent Studio, Governance Cockpit, AI Systems Inventory, Controls Matrix, Academy, Team).
- **Expected:** The 4 canonical items show correct active state; every internal view shows the contextual bar (`ViewContextBar`) with its title and the correct return destination (e.g., Agent Studio → "Back to AI Agents"; Controls Matrix → "Back to Settings").
- **Evidence:** Screenshots of each canonical item active; screenshots of ≥3 internal views showing the contextual bar.

### M3 — Direct navigation, refresh, Back/Forward
- **Preconditions:** Authenticated session.
- **Steps:** 1) Visit `/agents`, `/discover`, `/evidence`, `/settings`, `/agents/<id>` directly. 2) Refresh each page. 3) Use browser Back/Forward across section changes. 4) Visit an unknown path (e.g. `/nope`).
- **Expected:** Each canonical URL restores the matching view on load and on refresh; Back/Forward moves between sections without reload or loops; unknown paths fall back to landing without rewriting the URL; unauthenticated visit to any protected URL lands on the public experience (see M9).
- **Evidence:** Screen recording of the Back/Forward sequence; screenshots of refreshed `/evidence` and `/agents/<id>`.

### M4 — Scan flows: GitHub, ZIP, folder, demo (success and failure)
- **Preconditions:** Authenticated, on Discover.
- **Steps:** 1) Scan a public GitHub repo (success). 2) Scan an invalid/nonexistent GitHub URL (failure). 3) Upload a ZIP. 4) Select a local folder. 5) Load a demo project. 6) After a failure, immediately start a demo scan.
- **Expected:** Success shows the scan progress → success panel with "Review in AI Agents" CTA and stays on Discover; failure shows an **inline** red error with the verbatim message (`GitHub Scan Error: …` / `ZIP Scan Error: …` / `Folder Scan Error: …`), dismissible; no browser `alert()` dialogs at any point; starting a new scan clears the previous error and result (no stale success/error next to a new result).
- **Evidence:** Screenshots of one success, one failure, and the cleared state after starting scan #2; screen recording if possible.

### M5 — Stale feedback clearing and accuracy
- **Preconditions:** Trigger a failed scan (M4 step 2) or failed agent import.
- **Steps:** 1) Observe the inline error. 2) Dismiss it (X). 3) Start a new operation. 4) Force an import failure (backend down) in Add Agent and in the Discovered-Agents banner.
- **Expected:** Errors appear only after failure, never before; dismiss works; new operations clear old feedback; error text matches the original messages exactly; success feedback appears only after the operation truly succeeds (e.g., add-agent modal closes only on real success).
- **Evidence:** Screenshots before/after dismiss; screenshots of import-failure inline messages.

### M6 — Runtime controls actions and their real effects
- **Preconditions:** Authenticated; open an agent's detail view.
- **Steps:** 1) Locate the header action button (label **"Review Runtime Controls"**). 2) Click it. 3) Attempt to find any pause/resume control in the Governance Cockpit. 4) Open Settings → Advanced Governance → HITL approvals view if reachable, and approve an item; compare with approving via the Governance Cockpit.
- **Expected (current truth):** The button **only opens the Governance Cockpit — no pause or resume operation exists anywhere in the UI**; clicking it must not change agent status. If a pause/resume control is found during testing, that is a finding to report. Note: the HITL Approvals view uses a client-side approval path (`src/web/services/hitl-store.ts`) that mints a fabricated digest and does **not** call the server — approvals made there must be treated as cosmetic unless server state changes (verify via Cockpit/API).
- **Evidence:** Screenshots before/after clicking (status unchanged); screenshot proving whether any pause control exists; server/API response for an approval from each UI path.

### M7 — Evidence navigation, feedback, audit-pack inspection
- **Preconditions:** Completed at least one scan; authenticated.
- **Steps:** 1) Go to Evidence from the sidebar and via ScanSuccessPanel's "Review in AI Agents"→Evidence path. 2) Open a record drawer; cycle all six tabs (Overview, Provenance & Lineage, Evidence Payload, Integrity Verification, Retention & Custody, Audit Link). 3) Use the record verification control and observe feedback. 4) In Governance Cockpit (Auditor perspective), click **[ VIEW AUDIT PACK ]**, then **[ EXPORT ]**, then **[ HIDE AUDIT PACK ]**.
- **Expected:** Human-readable tab labels (not raw ids); verification feedback matches actual backend response (honest failure if backend unavailable); audit-pack panel expands inline with JSON (no browser alert); EXPORT downloads a real JSON file only when data was verified (`Not verified`/`Not loaded` states shown honestly otherwise).
- **Evidence:** Screenshots of each tab label; screenshot of audit-pack panel open; the exported JSON file; screenshot of a verification failure path if backend is down.

### M8 — Governance Passport verification messaging
- **Preconditions:** Agents & Teams view open; drawer → Passport tab.
- **Steps:** 1) Click **Verify Tamper-Evident Hash**. 2) Read the feedback. 3) Switch to another agent's passport.
- **Expected:** Inline message states verification is **unavailable** and the hash is the stored signature, **not independently verified** — no "Verified" claim; feedback from agent A must not appear on agent B's passport; feedback is dismissible.
- **Evidence:** Screenshot of the honesty message; screenshot showing no carry-over between agents.

### M9 — Authentication behaviour for protected deep links
- **Preconditions:** Clean profile, no session.
- **Steps:** 1) Visit `/evidence`, `/agents`, `/settings` logged out. 2) Log in via the UI. 3) Revisit the deep links. 4) Expire/clear the token and refresh. 5) Log out.
- **Expected:** Logged out → public landing (never protected content); login → session restored and deep links work; expired/removed token → guard returns to landing (401 from `/api/v1/auth/me` must log out; network errors preserve session per current design); logout clears `cgag_auth_token` and hits `/api/v1/auth/logout`.
- **Evidence:** Screenshots for each state; DevTools network capture of login, me, logout calls (redact tokens).

### M10 — Responsive layout and dark mode (manual checks, NOT implemented fixes)
- **Preconditions:** All above screens.
- **Steps:** 1) At 1440px, 1024px, 768px, 390px widths, walk Discover, AI Agents, Evidence, the audit-pack panel and modals. 2) Toggle light/dark on each.
- **Expected:** No horizontal overflow, no overlapping/clipped controls, readable contrast; dark mode consistent (remember: **F10 responsive work and F4 translation were deferred — defects here are known backlog, not regressions**).
- **Evidence:** Screenshot matrix (4 widths × 2 themes) of the three main screens.

---

## 5. Security and technical findings

Classification per required buckets. Citations verified during this audit unless noted as "subagent-cited".

### Verified (directly confirmed this audit)
- Working-tree integrity, stash, ahead-1 state; all 8 automated checks exit 0 (§2, §3).
- Zero `alert(` in `src/web`; only two deliberate `window.confirm` safeguards remain (`AcademyView.tsx:109`, `TeamManagementView.tsx:158`).
- Honest passport message present (`AgentsTeamsView.tsx:231`); audit-pack export gated on verified data (`GovernanceCockpitView.tsx` disabled-when-empty + real anchor download).
- Express app defines **no** login/signup/me routes (`src/server/app.ts` has only `POST /api/v1/auth/logout`) — client login calls `VITE_API_URL` (default `http://localhost:8000`) served by the separate FastAPI `course/main_api.py`.
- Webhook HMAC depends on an **optional** `GITHUB_WEBHOOK_SECRET` (`src/server/routes/webhook.ts:11`).
- Env-file hygiene: `.env*` gitignored; no values printed anywhere in this audit.
- Production-hitting tests are present but hard-gated (`COMPLYPRO_E2E_TARGET=production`) and were **not** executed; the test runner itself exit(86)s on any production host.
- Pilot providers are labels only: `capability-registry.ts:61,75` (salesforce-mcp-server), `:89,103` (schufa-experian-gateway), `:117,131,145` (core-banking/swift-sepa); demo-live returns `PROVIDER_CONFIGURATION_MISSING` (`src/server/routes/execution.ts:107,128`).

### Verified only by automated tests (green here; no runtime/browser proof)
- **Server authN/authZ:** 401 anonymous/expired/revoked, 403 cross-tenant & RBAC (`s8-1-security` in CI). Supabase-JWT path, identity-outage 503, dev fixture API keys exist only when `NODE_ENV !== 'production'` (`auth-middleware.ts:93-149` — subagent-cited).
- **Tenant isolation:** app-layer `WHERE tenant_id` filters on every read/mutation route + SQL `FORCE ROW LEVEL SECURITY` policies in migration 002 validated against a test Supabase (`s8-2-persistence`, `s8-2b-rls-real`). **Caveat:** no request path sets `app.current_tenant_id`; live isolation rests on app-layer filters + service-role credentials, RLS is defense-in-depth exercised by tests only.
- **Fail-closed:** `/ready` 503 without durable authority (`s8-3`), HITL exactly-once with 0 provider calls while paused (`s8-5`), revocation/unknown-profile blocking (`s8-remediation`). **Caveats:** `requireExecutionAuthority` is a no-op unless `NODE_ENV==='production'` (never exercised by these tests); gateway catch-blocks record `verdict:'ALLOW'` for non-authority failures (operation does not complete, but telemetry says ALLOW); the strongest persistence-failure proofs live in suites wired to no npm script.
- **Evidence integrity:** SHA-256 hash chain with recompute-on-verify, Merkle proofs, DB-side chain-conflict rejection (`append_runtime_evidence`), causal-chain checks (`evidence-ledger`, `governance-cockpit`, `nat-governance-poc` in CI).
- **HITL control:** pause returns `providerCallCount: 0` (adapter never reached), resume requires atomic durable CAS + role `compliance_officer` + tenant check (`crewai-runtime-adapter`, `s8-5`, `s8-1`).
- **UX batches 1–4:** source-string assertions + one `react-dom/server` render — **no DOM, no interaction**.

### Requires manual browser verification
- All checklist items M1–M10 (§4). Nothing in §4 has been run.
- Client auth UX (M9): the client-side tests re-implement logout/guard logic instead of importing the real components (subagent-cited).
- Inline feedback rendering, dismiss behaviour, audit-pack panel UX, dark mode/responsive (F10/F4 deferred by design).

### Requires a safe TEST-environment integration test
- Full login/signup/me flow against the FastAPI service + Supabase token issuance, and Express accepting that token (`course/main_api.py` ↔ `auth-middleware.ts`) — the only end-to-end auth artifacts are simulations and a **failed** stored Playwright run.
- Session durability: identity sessions live in an in-process `Map` — behaviour across restart/multi-instance needs a test.
- Durable evidence write round-trip through PostgREST (`append_runtime_evidence` conflict rejection + tamper round-trip) — proven mainly by non-CI suites.
- GitHub webhook with `GITHUB_WEBHOOK_SECRET` set (HMAC enforced) vs unset (verification skipped) — document/verify intended policy.
- Client `governance-fetch` 401/expiry handling (currently none — relies on AuthContext mount probe).

### Blocked by missing external systems, credentials or configuration
- Salesforce MCP, Schufa/Experian, core-banking/SWIFT-SEPA providers (§6).
- Real model providers (`OPENAI_API_KEY`, `AZURE_OPENAI_*`, `OPENROUTER_API_KEY`, `SILICONFLOW_API_KEY` — optional) and `COMPLIANCEPRO_API_KEY` for the real tool provider (`tool-gateway.ts:99` throws without it).
- Production E2E: needs `COMPLYPRO_E2E_TARGET=production` + credentials; forbidden here.
- Clean-clone CI: needs gitignored `.env.test.local` (test Supabase `SUPABASE_URL`/`SUPABASE_*_KEY`, `OPENROUTER_API_KEY`) provisioned; `tests/test-supabase-environment.mjs:34` throws otherwise.

### Not assessed
- Dependency CVEs (`npm audit` not run), performance/load, accessibility beyond ARIA attributes present in code, legal correctness of compliance mappings, `course/` Python subtree internals, Vercel/Render deployment configuration beyond source reading, MCP remote transport behaviour at runtime.

---

## 6. Confirmed blockers and limitations

### Pilot integration blockers (verified absent — do not claim otherwise)
| Provider claim | Reality | Evidence |
|---|---|---|
| **Salesforce MCP server** | **ABSENT (label-only).** No connector, no OAuth/credentials flow, no Salesforce tools in the MCP server (which is a real but unrelated *generic* governance MCP server, `src/mcp/server.ts`). `ToolGateway` registers exactly one provider: `compliancepro-api`. | `capability-registry.ts:61,75`; no `src/connectors/salesforce.ts`; `execution.ts:128` → 503 `PROVIDER_CONFIGURATION_MISSING` |
| **Schufa/Experian gateway** | **ABSENT (label-only).** 5 repo matches total, none an API client; a fabricated bureau score appears in a demo surface. | `capability-registry.ts:89,103`; `GovernedAgentProofSurface.tsx:50` |
| **Core banking / SWIFT-SEPA** | **ABSENT (label-only).** No Plaid/open-banking/banking client exists. | `capability-registry.ts:117,131,145` |
| Tests for the above | **Fixtures fabricate their own success** — `tests/bootstrap-provider-fixtures.ts` force-loaded into every `npm test` suite registers fake providers for all three names. | `run-governance-suites.mjs` (`--import ./tests/bootstrap-provider-fixtures.ts`) |

### Confirmed non-integration blockers
1. **Auth E2E unverified** — split architecture (FastAPI login vs Express API), client tests are simulations, stored Playwright run = failed.
2. **Misleading success surfaces remain** (security-relevant for a compliance product):
   - `AcademyModal.tsx:237` — "Baixar Pacote do Aluno" claims files "generated successfully" with **zero I/O**; the fake string is **locked in place by a Batch-4 test** (`ux-feedback-clarity.test.ts:147`).
   - `hitl-store.ts:249` — client HITL approval mints a **fabricated digest** (`DIGEST-HITL-…`) with no server call; server-side HITL (Cockpit/AgentStudio → `/api/v1/executions/:id/approve`) is real.
   - `GovernedAgentProofSurface.tsx` — **"LIVE" badge** over a hardcoded timeline containing SCHUFA/core-banking "SUCCESS" rows (mitigated by adjacent "sandbox/simulate" copy, still a mixed signal).
3. **CI not reproducible:** `.env.test.local` gitignored but required; `vitest`/`@playwright/test` undeclared (dropped by `npm ci`); CI step label "253 Tests" not derived from the 24-suite runner.
4. **`npm run lint` broken** (eslint absent, no config).
5. **No browser validation exists** (§4 all pending).
6. **Webhook HMAC optional** — unset `GITHUB_WEBHOOK_SECRET` skips signature verification.
7. **Latent honesty defects reported in code review:** gateway failures recorded as `verdict:'ALLOW'`; RLS not on the live query path; `VITE_API_URL` falls back to `http://localhost:8000` in production bundles if unset; in-process session store not restart-safe.

### Honest workflows demonstrable TODAY
Local repository scans (ZIP/folder/demo/GitHub) through the governance engine; evidence hash-chain + Merkle verification and audit-pack export against a configured test DB; governance cockpit; **API-driven** HITL pause/resume (fixture providers); settings/team/Academy content browsing; the generic MCP governance server; fail-closed demo-live (honest 503).

### Must remain EXCLUDED from a pilot
Any workflow implying real CRM (Salesforce), credit-bureau (SCHUFA/Experian), or banking actions; the "LIVE" governed-agent proof surface as a real-time claim; the Academy handout download as a generated artifact; client-side HITL Approvals as authoritative; production E2E sign-off until a real browser run exists.

---

## 7. Prioritized next actions

### Release blockers (must complete before any pilot/release)
1. **Execute the manual browser checklist (M1–M10)** — no browser evidence exists; this is the largest evidence gap.
2. **Resolve the auth architecture gap:** verify login/signup/me end-to-end in a TEST environment (FastAPI ↔ Express ↔ Supabase), investigate the failed stored Playwright run, and decide which service owns auth.
3. **Remove or clearly quarantine the three misleading success surfaces** (AcademyModal fake handout + its enforcing test, `HitlStore` fabricated digest, GovernedAgentProofSurface "LIVE" framing) — for a compliance product, false success states are release-blocking.
4. **Make CI reproducible:** provision documented test secrets or change the runner to skip DB suites gracefully; declare or remove `vitest`/`@playwright/test`; correct the "253 Tests" workflow label.
5. **Fix or remove `npm run lint`** (install eslint + config, or delete the script) — a permanently failing script hides real regressions.
6. **Decide webhook policy:** require `GITHUB_WEBHOOK_SECRET` in production (fail closed) or document the bypass.
7. **Keep pilot scope honest:** exclude Salesforce/SCHUFA/core-banking claims from all demos until real adapters + credentials exist (§6).

### Non-blocking improvements (schedule, don't gate release)
8. Record gateway non-authority failures as `DENY/ERROR`, not `verdict:'ALLOW'` (`tool/data/model-gateway` catch blocks).
9. Wire the dormant fail-closed proof suites (`production-authority-remediation`, `d2-*`, `d4-*`) into `npm test`; wire the four `ux-*` suites in too.
10. Harden client session handling: 401 handling in `governance-fetch`; validate `VITE_API_URL` at build time (no `localhost` fallback in production bundles).
11. Consider setting `app.current_tenant_id` on the live query path (or document app-layer-only isolation as the accepted design).
12. Durable identity sessions (DB-backed) instead of an in-process `Map`.
13. Commit Batch 1–4 with **explicit paths** (13 modified + 9 UX artifacts) — never `git add -A` (8 unrelated files at risk); preserve `stash@{0}`.
14. Documentation backlog: F4 (translation), F10 (responsive), F7, F11 from the UX brief.

---

*Prepared under read-only constraints. Every claim above is tied to code/test evidence gathered in this audit; no browser, production, or integration behaviour was executed or implied.*
