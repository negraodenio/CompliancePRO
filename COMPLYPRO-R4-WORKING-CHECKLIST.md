# ComplyPRO R4 — Overnight Mission Working Checklist

> Working checklist only. Not a report. Final results go to `COMPLYPRO-R4-OVERNIGHT-REPORT.md`.
> Created: R4 session start. Baseline verified: HEAD `cece04a`, main ahead 1, nothing staged, `stash@{0}` intact.

## Phase A — Baseline
- [x] Git state read-only audit (23 modified, all untracked preserved, stash preserved)
- [x] package.json scripts, runner suites, ci.yml inspected
- [x] Lint diagnosis: `eslint` script exists but eslint is NOT in devDeps and no config file → broken (C4)
- [x] Playwright: `playwright.config.ts` exists; `@playwright`/`vitest` present in node_modules but undeclared in package.json (C2/F)
- [x] Baseline `npm test` run (27/27 PASS, tsc 0, build 0)

## Phase B — Digest/signature audit
- [x] B1 inventory all DIGEST-/SHA256/signature/verification claims; classify 1-6
- [x] B2 inspect computeDeterministicHash guarantees + verification paths
- [x] B3 fix confirmed false claims (minimum safe change)
- [x] B4 regression tests for confirmed defects

## Phase C — Test pipeline
- [x] C1 hardening-integrity root cause (BASELINE_EVIDENCE never returned)
- [x] C2 scan-governance-bridge vitest import
- [x] C3 CI reproducibility (env var names only, no values)
- [x] C4 lint config diagnosis (fix only if trivial/no deps)
- [x] C5 runner integration proof (30 suites, no removals) (no double-run, no removals)

## Phase D — Security regression review
- [x] Gateways/routes/guardian/HITL/evidence-failure invariants rechecked (report-only unless new defect)

## Phase E — Evidence consumers / UI truthfulness
- [x] Recheck consumers post-R3; fix only confirmed misleading claims

## Phase F — Browser readiness
- [x] Inspect playwright.config.ts + scripts; run safe local smoke IF usable, else manual checklist

## Phase G — Pilot scope
- [x] Salesforce/Schufa-Experian/core-banking presentation audit
- [x] Pilot capability matrix with honest statuses

## Phase H — Report
- [x] `COMPLYPRO-R4-OVERNIGHT-REPORT.md` (only because it does not exist yet)
- [x] Final validation: focused tests + npm test + typecheck + build + diff-check
- [x] Final git status + stash verification
