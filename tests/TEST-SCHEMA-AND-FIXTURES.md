# ComplyPRO TEST SaaS prerequisites and controlled fixtures

Target Supabase project: **wabfvgyvjeilfirumclf**.

## Schema source and boundary

`test-saas-prerequisites.sql` contains verbatim statements from `course/schema_supabase.sql` for:

- UUID extension declaration;
- `organizations`, `organization_members`, `entitlements`;
- their existing RLS declarations and organization/member SELECT policies;
- `handle_new_user_signup()` and the existing Auth signup trigger.

Supabase supplies the parent `auth.users` table and `auth.uid()`. Existing runtime migrations 001–004 remain separate. Repositories, stored scans/findings, leads and demo baseline seeds are outside this prerequisite subset.

The application's migration runner executes every SQL file in `src/server/db/migrations/` without an environment boundary. This TEST-only subset is therefore intentionally under `tests/`, where that runner cannot pick it up for production.

## Initialize and verify

From the project ROOT:

```powershell
node tests/initialize-test-saas.mjs --source-check
```

This compares the subset's statements with the original source, allowing only header comments in addition. It executes no SQL.

In the Supabase SQL Editor for **wabfvgyvjeilfirumclf**, execute `tests/test-saas-prerequisites.sql` as one complete file. The statements are the existing idempotent definitions; existing runtime migrations are not part of this operation.

Then verify through the authenticated TEST API:

```powershell
node tests/initialize-test-saas.mjs
```

The verifier validates the target and credential project/roles, table/column presence, UUID identity types and continued availability of the runtime schema. Missing/incompatible prerequisites produce a nonzero exit. PostgREST metadata does not expose full policy/catalog definitions; unchanged SQL and the real RLS tests are separate evidence.

## Test credentials and providers

`.env.test.local` is the sole database configuration source and stays ignored by Git. Configure `SUPABASE_URL`, `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` for this TEST project. Secret values must remain local.

For live MODEL execution, configure a TEST `OPENROUTER_API_KEY` or `OPENAI_API_KEY` in that same ignored file. The E2E, sandbox integration and existing real-model proof require explicit test-provider credentials and do not fall back to production `.env` credentials.

The multi-channel E2E uses:

- real Supabase/PostgREST DATA queries scoped to its explicitly prepared organization;
- the existing real HTTP model dispatcher;
- the existing HTTP tool provider against the real `scanRouter` on loopback, protected by native JWT authentication, tenant context and role checks.

The scanner receives a supplied synthetic source file and computes its own result. No published production scanner endpoint is involved.

## Fixture ownership and durability

`test-supabase-fixtures.ts` creates/reuses only its namespaced, tagged Auth fixture users. Organizations are selected by the signup trigger's deterministic slug for that known user, not by an arbitrary UUID or the first database record. Memberships and entitlements are persisted and verified. On newly created users, the existing signup trigger must establish those prerequisites; failure is fatal.

Service-role use is limited to controlled setup and persistence inspection. The scanner authorization uses a normal fixture-user token obtained through Supabase Auth. Fixture passwords and tokens remain in process memory.

CrewAI's negative passport case uses the already provisioned runtime. Sandbox HITL uses a real provisioned agent/passport/runtime with distinct identities. Affected scenarios await background writes and verify the persisted parents/sessions; missing parents or failed HTTP writes are not successful test states.

The entitlement RLS check keeps the existing anon-zero/service-visible assertions, scopes them to its fixture, and propagates persistence failures instead of warning and exiting successfully.

## Validation sequence

The existing runner now explicitly loads and validates `.env.test.local` before spawning application imports. It also accepts registered suite names/paths for the required first gate:

```powershell
node tests/run-governance-suites.mjs tests/end-to-end-governed-agent.test.ts tests/s8-2-persistence.test.ts tests/crewai-runtime-adapter.test.ts tests/s8-4-worker-sandbox.test.ts
```

After all four pass:

```powershell
npm test
npm run typecheck
npm run build
```

The Supabase target is fixed to TEST, direct PostgreSQL fallback is disabled for this harness, and production network destinations are blocked. No application code, runtime RLS/FORCE RLS, FKs or migration 001–004 changes are required by this fixture remediation.
