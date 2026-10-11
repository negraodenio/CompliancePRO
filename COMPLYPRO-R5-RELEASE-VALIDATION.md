# COMPLYPRO — R5 Release Validation Report

Mission: Reproducible CI, Local E2E & Release Validation
Date: 2026-10-11 · Branch: `main` · HEAD: `cece04a` (unchanged — no commits made)

---

## 1. Starting State

| Item | Value |
|---|---|
| Branch / HEAD | `main` @ `cece04a` — matches the R5 expected baseline |
| Remote | `origin/main` @ `6a429dc` (1 commit behind local; remote CI status not observable from this environment) |
| Staged files | none |
| Stash | `stash@{0}: On main: wip-truth-tuning-seo` — intact |
| Env files | `.env` / `.env.test.local` untouched |
| Working tree | 75 modified + several untracked files **pre-existing from earlier missions** (R3/R4 web surfaces, stores, FINAL-*.md reports). R5 changes are listed in §5 and are strictly separated from that pre-existing state. |
| Node / tooling | Node v22.19.0, npm, tsx; Playwright `@playwright/test@1.63.0` present in node_modules (extraneous — not in package.json; no install performed, per mission rules) |

**Material reproducibility finding:** the green working tree depends on uncommitted files (e.g. `src/web/navigation/`, `src/web/components/InlineStatus.tsx`, `src/web/services/evidence-digest.ts` and ~70 modified files). A clean checkout of `cece04a` alone would **not** contain the full application. All gates below were run against the working tree; this limitation is called out in §8.

## 2. Test & CI Configuration Inventory

- `npm test` → `node tests/run-governance-suites.mjs` — **33 suites** (was 32; + `academy-module`):
  - **31 isolated** (no DB): compliance-compiler, guardian-evaluation, governed-capability-gateway, evidence-ledger, agent-provisioning, isolated-runtime, crewai-runtime-adapter, agent-studio-api, governance-cockpit, model-gateway, tool-gateway, data-gateway, gateway-failure-closed, data-hitl-revalidation, r3-evidence-honesty, r4-digest-integrity, hardening-integrity, scan-governance-bridge, governance-simulator, security-remediation, academy-module, model-gateway-real-provider, s8-1-security, s8-2-persistence, s8-2-real-restart, s8-3-container-audit, s8-4-worker-sandbox, s8-5-active-governance, s8-remediation-security, real-agent-inventory, nat-governance-poc
  - **2 DB-backed `[DB]`**: s8-2b-rls-real, end-to-end-governed-agent
- Runner prints tier summary (`Suites: 33 total (31 isolated + 2 DB-backed)`) and tags DB suites; child env contract unchanged (NODE_ENV=test, bootstrap fixtures, env validation, prod-ref/network guards, exit 86 semantics).
- `.github/workflows/ci.yml`: added **Provision TEST Environment File** step before `npm test` — writes `.env.test.local` at runtime from `secrets.TEST_SUPABASE_URL` / `TEST_SUPABASE_ANON_KEY` / `TEST_SUPABASE_SERVICE_ROLE_KEY` (`umask 077`, values never echoed, clear `::error::` if secrets are missing). No lint step exists in CI. Local vs remote: **local npm test verified; CI execution not triggered or observed from here.**

## 3. Configuration / Tooling Findings

| # | Finding | Status |
|---|---|---|
| F1 | `academy-module.test.ts` depended on undeclared `vitest` → failed with "Vitest failed to access its internal state" | **Fixed** — converted to the dependency-free local harness (assertions verbatim), 8/8 pass, wired into runner |
| F2 | eslint binary absent (`node_modules/.bin/eslint.cmd` missing, `npm ls eslint` empty); no lint step in CI | **Documented only** — fixing requires installing a new dependency, which the mission forbids |
| F3 | UI login (`AuthContext.login` → `POST /api/v1/auth/login`) has **no matching route** anywhere in this server (`src/server`, `api/server.ts`) | **Documented** — Sign In can never succeed against this backend; authenticated app-mode E2E is blocked, not bypassed |
| F4 | App-mode is session-gated by design: `initialRouteState(pathname, hasSavedSession())` + `AuthSessionGuard` force the landing view for unauthenticated deep-links (URL keeps the path) | Verified by test S2 — intended behavior, not a routing bug |
| F5 | CI TEST secrets are not configured yet; the new provisioning step will fail fast with an actionable error until the operator adds them | Operator action required |
| F6 | A wedged leftover node server (PID from 2026-10-10) occupies port 3000 (returns 500 on `/health`); left untouched | Noted; local E2E used API port 3010 instead |

## 4. Suite Outcomes (final gate run)

**`npm test` → 33 PASS / 0 FAIL (exit 0)** — includes both `[DB]` suites against the local TEST Supabase project.

Unwired (informational, not part of `npm test`): `final-forensic-audit` (fresh-tenant isolation sentinel, kept unwired), `data-gateway-real-db`, `blocker-remediation`, `production-authority-remediation` (local fixture; 23/23 verified earlier), D1/D2/D4 remediation tests (committed in `cece04a`), `universal-mcp-*` (`npm run test:mcp`), `tests/production-e2e.spec.ts` (**forbidden — not run**).

## 5. Files Changed in R5 (root causes)

| File | Change | Root cause |
|---|---|---|
| `tests/academy-module.test.ts` | vitest → local harness | undeclared vitest dependency (F1) |
| `tests/run-governance-suites.mjs` | tiered `isolatedSuites` + `dbSuites` (33 total), `[DB]` tagging, tier summary | mixed DB/non-DB suites, observability |
| `.github/workflows/ci.yml` | runtime provisioning of `.env.test.local` from CI secrets | gitignored env file made CI `npm test` unreproducible |
| `tests/local-e2e-smoke.spec.ts` | **new** — 7 bounded localhost-only browser journeys | no E2E coverage existed (§7) |
| `src/web/services/dossier-store.ts` | baseline `packageHash` now a **genuine recomputable SHA-256** via `computeEvidenceDigest` (was static fake hex strings) | Phase F found fabricated "Package Cryptographic Integrity Digest" values |
| `src/web/views/RegulatoryDossiersView.tsx` | removed false claims: static "Cryptographically Sealed" label → "Reference (verify in Evidence view)"; 3× "RFC 8785" labels on non-canonical JSON → accurate wording | same audit; RFC 8785 *is* genuinely implemented (`canonicalizeJson`, evidence-ledger.ts:105) for ledger digests, but this view never used it |

No security assertions were weakened; no env/stash/HEAD changes; no commits made.

## 6. Commands & Exit Codes (final)

| Command | Result |
|---|---|
| `npm test` | **33/33 PASS, exit 0** |
| `npm run typecheck` | exit 0 |
| `npm run build` | exit 0 |
| `git diff --check` | exit 0 (only pre-existing LF→CRLF warnings) |
| `npm run lint` | **UNRUNNABLE** — eslint not installed (F2); CI has no lint step |
| `npx playwright test tests/local-e2e-smoke.spec.ts` (against local API:3010 + vite:3001) | **7/7 PASS, exit 0** |
| `node --import tsx --import ./tests/bootstrap-provider-fixtures.ts tests/hardening-integrity.test.ts` (after §5 source fixes) | 9/9 invariant groups PASS, exit 0 |

## 7. Browser E2E Evidence

Automated (`tests/local-e2e-smoke.spec.ts`, Chromium via existing browsers, `COMPLYPRO_BASE_URL=http://localhost:3001`, fail-safe production guard intact):

- **S1** boots and renders the public landing view ("Build with your framework")
- **S2** unauthenticated deep-links `/agents`, `/discover`, `/evidence`, `/settings` fall back to landing (URL preserved, Sign In visible) — safe protected-route behavior
- **S3** Sign In opens the real auth modal (email/password + "Sign In to Workspace")
- **S4** no fabricated session/user claims while unauthenticated
- **S5** proof surface explicitly marked DEMO with the full honesty notice
- **S6** landing runtime-proof copy carries DEMO/fixture honesty markers
- **S7** zero critical browser console (page) errors across the session

**Manual browser checklist — blocked / not automated** (preconditions: a real session token from a working auth backend — F3 — or operator credentials; steps are click-through in the running app; expected = as stated; evidence to capture = screenshot + ledger state):

1. **Authenticated navigation** — Sign In (needs backend route) → sidebar AI Agents / Discover / Evidence / Settings; expected: each view renders with role-appropriate data; blocked by F3.
2. **Scan success journey** — Discover → run a scan against an authorized local fixture repo; expected: governed promotion panel with tenant-checked scan result; blocked (requires auth + fixture target endpoint).
3. **Scan failure honesty** — same form with an invalid/unreachable target; expected: honest error state, no fabricated success; partially covered by gateway failure-closed suites (automated) — UI pass blocked by F3.
4. **Evidence verification flow** — Evidence view → verify a sealed record; expected: "Payload digest and local hash-chain linkage verified." backed by server verification; blocked by F3 (logic covered by wired suites).
5. **HITL demo run** — landing "Run the Governed Agent" demo (automated-serverless, already marked DEMO — optional visual check).
6. **Dossier integrity tab** — open a dossier → Integrity tab shows a recomputable `SHA256:<64hex>` (R5 fix); Evidence tab shows ledger presence/absence per block ref; blocked by F3 for app entry.

## 8. Release / Pilot Readiness Matrix

| Area | Status |
|---|---|
| Unit/governance regression (33 suites) | **VERIFIED BY TEST** (local) |
| Typecheck / production build | **VERIFIED LOCALLY** |
| CI reproducibility (workflow + secrets step) | **VERIFIED LOCALLY** — remote run pending operator secrets (F5); remote status not observed |
| Local browser smoke (unauthenticated) | **VERIFIED LOCALLY** (7/7) |
| Authenticated app E2E / real login | **BLOCKED** (F3 — no login route on this server) |
| Lint gate | **BLOCKED** (F2 — eslint not installed; not in CI) |
| Evidence integrity claims (UI honesty) | **VERIFIED LOCALLY** (R5 fixes + hardening 9/9; RFC 8785 backed by `canonicalizeJson`) |
| TEST Supabase (RLS + e2e suites) | **VERIFIED LOCALLY** (2/2 `[DB]` suites) |
| Production acceptance / production E2E | **NOT ASSESSED** (forbidden by mission) |
| Salesforce / SCHUFA / core-banking integrations | **BLOCKED** (external systems — out of scope) |
| Clean-checkout build reproducibility | **BLOCKED** (§1 — green state depends on uncommitted files; operator commit decision required) |

## 9. Verdict

**PASS (local validation)** — R5 gates are green on the working tree: 33/33 suites, typecheck, build, whitespace check, and a 7/7 local browser smoke. Three classes of work remain operator-owned: (1) commit or otherwise preserve the uncommitted working tree (§1), (2) provision CI TEST secrets (F5), (3) decide how Sign In should authenticate (F3). Lint remains unrunnable until eslint is intentionally installed (F2).
