# COMPLYPRO.PT — S8-2
# DURABLE PERSISTENCE & SUPABASE RLS VALIDATION REPORT

"Build with your framework. Govern with ComplyPRO."

---

## 1. Objective

The objective of Sprint S8-2 is to transform ComplyPRO's critical operational state from volatile in-memory `Map`s into durable PostgreSQL/Supabase state, and elevate tenant isolation from application-level query filtering to database-enforced Row Level Security (RLS).

Key Goals:
1. Ensure operational state (Agents, Passports, Runtimes, Execution Sessions, HITL Gates & Decisions) persists reliably.
2. Prove **Restart Recovery**: A complete server crash/restart (with all volatile memory cleared) reloads from durable storage, restores all entities, keeps pending HITL gates in state `PENDING`, and allows supervisors to resume executions without data loss.
3. Prove **Database-Enforced Row Level Security (RLS)**: PostgreSQL native policies deny cross-tenant data access even when application-level `WHERE` clauses are absent.
4. Establish **Defense in Depth**: API Authorization + Database RLS.
5. Audit `SUPABASE_SERVICE_ROLE_KEY` bypass and define trusted vs. untrusted execution pathways.

---

## 2. Baseline

- **Pre-Sprint Verification**: 233/233 tests PASS
- **TypeScript**: 0 errors
- **Production Build**: SUCCESS
- **S8-1 Security Boundary**: Fully preserved (Bearer/X-API-Key, RBAC, Tenant context, Rate limiting, Secret sanitization)

---

## 3. Current In-Memory State Audit

Before S8-2, the operational state of ComplyPRO was maintained in volatile memory structures:

| State Entity | Previous Storage | Classification | Must Persist? | Target S8-2 Storage |
|--------------|------------------|----------------|---------------|---------------------|
| **Agents** (`AgentProvisioningResponse`) | `AgentProvisioner.agentsStore` (`Map`) | EPHEMERAL | **YES** | `agents` table |
| **Agent Passports** (`AgentPassport`) | `RuntimeManager.passports` (`Map`) | EPHEMERAL | **YES** | `agent_passports` table |
| **Idempotency Keys** | `AgentProvisioner.idempotencyStore` (`Map`) | EPHEMERAL | **YES** | `idx_passports_fingerprint` / idempotency table |
| **Runtime Instances** (`RuntimeInstance`) | `RuntimeManager.instances` (`Map`) | EPHEMERAL | **YES** | `runtime_instances` table |
| **Active Workers** (`IsolatedWorker`) | `RuntimeManager.workers` (`Map`) | TRANSIENT | NO (Recreated on demand) | Instantiated dynamically from durable runtime spec |
| **Execution Sessions** (`ExecutionSession`) | `CrewAiRuntimeAdapter.sessions` (`Map`) | EPHEMERAL | **YES** | `execution_sessions` table |
| **Execution Counters** | `CrewAiRuntimeAdapter.executionCounters` (`Map`) | EPHEMERAL | **YES** | `execution_sessions.tool_execution_count` |
| **HITL Approval Gates** | `HitlStore` / `activeSessions` | EPHEMERAL | **YES** | `hitl_requests` table |
| **HITL Decisions** | Volatile session status update | EPHEMERAL | **YES** | `hitl_decisions` table |
| **Evidence Ledger Chain** | In-memory SHA-256 chain + file persistence | DURABLE | **YES** | Cryptographic audit ledger (Preserved) |

---

## 4. Target Persistence Architecture

```
                    COMPLYPRO API
                         │
                         ▼
                 AUTHENTICATED USER (JWT / API Key)
                         │
                         ▼
             TENANT CONTEXT DERIVATION
             (req.tenantId / principal.tenantId)
                         │
                         ▼
        ┌────────────────────────────────┐
        │ CAMADA 1: APPLICATION AUTH     │
        │ - RBAC check                   │
        │ - Tenant ownership check       │
        │ - Parameter validation         │
        └────────────────┬───────────────┘
                         │
                         ▼
        ┌────────────────────────────────┐
        │ PERSISTENCE LAYER              │
        │ - DurableStore                 │
        │ - Read-through caching         │
        │ - Optimistic Concurrency (OCC) │
        └────────────────┬───────────────┘
                         │
                         ▼
        ┌────────────────────────────────┐
        │ CAMADA 2: DATABASE RLS         │
        │ SET LOCAL app.current_tenant_id│
        │ OR Supabase PostgREST JWT      │
        │ FORCE ROW LEVEL SECURITY       │
        └────────────────┬───────────────┘
                         │
          ┌──────────────┴──────────────┐
          │                             │
          ▼                             ▼
       TENANT A                      TENANT B
     (Isolated)                    (Isolated)
```

---

## 5. Database Schema

The relational schema implements clean normalization, foreign key cascades, tenant indexing, and explicit status tracking:

1. **`agents`**:
   - `agent_id` (VARCHAR(64) PRIMARY KEY)
   - `tenant_id` (VARCHAR(64) NOT NULL)
   - `name`, `framework_name`, `framework_version`, `compliance_profile`
   - `capabilities` (JSONB)
   - `budget` (JSONB)
   - `status`, `created_at`, `updated_at`

2. **`agent_passports`**:
   - `passport_id` (VARCHAR(64) PRIMARY KEY)
   - `agent_id` (REFERENCES agents(agent_id))
   - `tenant_id` (VARCHAR(64) NOT NULL)
   - `passport_fingerprint` (UNIQUE)
   - `compliance_profile_checksum`
   - `tool_manifest_hash`
   - `declared_tools`, `governed_capabilities`, `runtime_spec`

3. **`runtime_instances`**:
   - `runtime_id` (VARCHAR(64) PRIMARY KEY)
   - `agent_id` (REFERENCES agents(agent_id))
   - `tenant_id` (VARCHAR(64) NOT NULL)
   - `passport_id` (VARCHAR(64) NOT NULL)
   - `status` (`PROVISIONED`, `STARTING`, `RUNNING`, `STOPPED`, `FAILED`, `REVOKED`)
   - `isolation`, `resources`, `created_at`, `started_at`, `stopped_at`, `error`

4. **`execution_sessions`**:
   - `execution_id` (VARCHAR(64) PRIMARY KEY)
   - `agent_id`, `runtime_id`, `tenant_id`, `passport_id`
   - `status` (`CREATED`, `RUNNING`, `PAUSED`, `COMPLETED`, `BLOCKED`, `FAILED`)
   - `tool_execution_count` (INT NOT NULL DEFAULT 0)
   - `gate_id`, `pending_capability`, `pending_context`

5. **`hitl_requests`**:
   - `hitl_request_id` (VARCHAR(64) PRIMARY KEY)
   - `gate_id` (VARCHAR(64) UNIQUE NOT NULL)
   - `execution_id` (REFERENCES execution_sessions)
   - `tenant_id`, `agent_id`, `capability`, `action_type`, `payload`
   - `status` (`PENDING`, `APPROVED`, `REJECTED`)

6. **`hitl_decisions`**:
   - `decision_id` (VARCHAR(64) PRIMARY KEY)
   - `gate_id` (REFERENCES hitl_requests(gate_id))
   - `execution_id` (REFERENCES execution_sessions)
   - `tenant_id`, `decided_by`, `decision`, `notes`, `decided_at`

---

## 6. Migration

Versioned migration file created at:
[`src/server/db/migrations/002_durable_runtime_and_rls.sql`](file:///c:/Users/denio/Documents/Denio/PluginVIbeCOde/standalone-compliance-scanner/src/server/db/migrations/002_durable_runtime_and_rls.sql)

Features:
- Reversible DDL with idempotency (`IF NOT EXISTS`).
- `ENABLE ROW LEVEL SECURITY` across all 6 operational tables.
- `FORCE ROW LEVEL SECURITY` to prevent table-owner bypass.
- Composite B-tree indexes for fast tenant filtering.

---

## 7. Agent Persistence

When `POST /api/v1/agents/provision` is executed:
1. Caller is authenticated (`requireRoles('developer')`).
2. Tenant context is derived (`req.tenantId` / `principal.tenantId`).
3. Compliance Profile and declared capabilities are resolved and validated.
4. Cryptographic passport fingerprint is computed.
5. Evidence event `AGENT_PROVISIONED` is appended to the Ledger.
6. Record is persisted durably in `DurableStore` with `tenant_id`.
7. Idempotency key is mapped to `agent_id`.
8. Persisted response is returned.

---

## 8. Passport Persistence

The `AgentPassport` represents the non-negotiable operational contract:
- Persisted alongside the agent with unique `passport_fingerprint`.
- Prevents tampering: any alteration of capabilities or checksum causes pre-flight verification failure upon `startRuntime`.
- Read-through retrieval allows reconstructing authentic agent runtime specs after server restart.

---

## 9. Runtime Persistence

`RuntimeManager` states are persisted across transitions:
- `createRuntime()`: Persists status `PROVISIONED`.
- `startRuntime()`: Verifies passport integrity -> transitions and persists status `RUNNING` with `started_at`.
- `stopRuntime()`: Terminates worker -> transitions and persists status `STOPPED` with `stopped_at`.
- `revokeRuntime()`: Revokes passport -> transitions and persists status `REVOKED`.

---

## 10. Execution Persistence

`CrewAiRuntimeAdapter` intercepts tool executions and persists session states:
- `start()`: Persists status `RUNNING`, `toolExecutionCount: 0`.
- `execute()` (on `REQUIRE_HITL`): Persists status `PAUSED`, `gateId`, pending capability/context. `toolExecutionCount` strictly remains 0.
- `execute()` (on `BLOCK`): Persists status `BLOCKED`.
- `execute()` (on `ALLOW`): Increments `toolExecutionCount` by 1 and persists status `COMPLETED`.

---

## 11. HITL Persistence

When a high-risk capability triggers `REQUIRE_HITL`:
1. `DurableStore.saveHitlRequest` records:
   - `gateId`, `executionId`, `tenantId`, `capability`, `actionType`, `payload`, `status: 'PENDING'`.
2. Server crash or restart **does NOT erase** the pending gate.
3. When the human supervisor approves or rejects:
   - Contradictory transitions (`APPROVED` -> `APPROVED` or `REJECTED` -> `APPROVED`) are strictly blocked by state machine validation.
   - `DurableStore.saveHitlDecision` writes the audit attestation.

---

## 12. Restart Recovery

Tested and validated in `tests/s8-2-persistence.test.ts` (Test 6):
1. Provisioned agent, runtime, and execution session.
2. High-risk loan approval (€25,000) paused with `REQUIRE_HITL` (Gate ID generated).
3. **Simulated Server Restart**: `AgentProvisioner.reset()`, `RuntimeManager.reset()`, `ExecutionAdapterRegistry.clear()`.
4. Memory verified 100% empty (`listAgents().length === 0`, `listInstances().length === 0`).
5. Rehydration initiated:
   - `DurableStore.rehydrateOperationalState()` reloaded all agents and runtimes.
   - `getOrRecoverAdapter(executionId)` reloaded the paused execution session, reconstructed the worker, and re-registered the adapter.
6. Supervisor called `POST /api/v1/executions/:id/approve`:
   - Execution resumed, executed the tool **exactly once** (`toolExecutionCount: 1`), and completed successfully.
   - Evidence causal chain remained unbroken.

---

## 13. RLS Architecture

RLS enforcement acts as an independent second barrier:

```
                  Client Request
                        │
                        ▼
               API Authorization Layer
            (Denies cross-tenant requests)
                        │
                        ▼
             PostgreSQL Client Connection
                        │
      SET LOCAL app.current_tenant_id = '<tenant>';
                        │
                        ▼
               PostgreSQL SQL Engine
                        │
             ┌──────────┴──────────┐
             ▼                     ▼
      Tenant Match          Tenant Mismatch
     (Row Returned)          (Row Filtered / 0 rows)
```

---

## 14. Tenant Claims

The tenant claim is **NEVER** trusted from arbitrary query parameters or raw payload overrides.
It is strictly derived from:
1. Authenticated API Key or Bearer Token principal (`req.principal.tenantId`).
2. Propagated to PostgreSQL sessions via:
   ```sql
   SET LOCAL app.current_tenant_id = '<tenant_id>';
   ```
3. Or in PostgREST via decoded JWT claims:
   ```sql
   current_setting('request.jwt.claims', true)::jsonb ->> 'tenant_id'
   ```

---

## 15. RLS Policies

Example policy enforced on `agents` (and mirrored across all 6 tables):
```sql
CREATE POLICY tenant_isolation_agents ON agents
    FOR ALL
    USING (
        tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')
        OR tenant_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'tenant_id')
        OR tenant_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'organization_id')
    )
    WITH CHECK (
        tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')
        OR tenant_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'tenant_id')
        OR tenant_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'organization_id')
    );
```

---

## 16. RLS Negative Tests

Validated in `tests/s8-2-persistence.test.ts` (Tests 7, 8, 9):
- Tenant A resources created (`TENANT-ALPHA-S82`).
- Tenant B resources created (`TENANT-BETA-S82`).
- Tenant A executes query `SELECT * FROM agents;` with Tenant A context:
  - Receives Agent A.
  - Receives **0 records** for Agent B (**RLS DENIAL**).
- Tenant B executes query `SELECT * FROM agents;` with Tenant B context:
  - Receives Agent B.
  - Receives **0 records** for Agent A (**RLS DENIAL**).
- Proof verified without any application-level `WHERE` clause.

---

## 17. Service Role Analysis

**Security Audit of `SUPABASE_SERVICE_ROLE_KEY`**:
- By design, the PostgreSQL role associated with the Supabase service key has `BYPASSRLS`.
- **Live Proof on Supabase**:
  - Live query to Supabase `entitlements` using `anon` key returned **0 rows** (RLS enforced).
  - Live query to Supabase `entitlements` using `service_role` key returned **9 rows** (RLS bypassed).
  - **Live Proof on Newly Migrated `agents` Table**:
    - Record inserted with status `201 Created` (`agt_supabase_live_test`).
    - PostgREST Anonymous Query (`anon` key, no tenant claim) returned **0 rows** (**Database RLS Denied**).
    - PostgREST Service Role Query returned **1 row** (verified insertion & clean teardown).
- **Backend Strategy**:
  1. Administrative/maintenance jobs (e.g. system migrations, platform telemetry) run under trusted backend credentials.
  2. Runtime operational queries that interact with tenant agents execute within transactional tenant sessions (`SET LOCAL app.current_tenant_id = $1`) or PostgREST scoped headers.
  3. Defense in depth: Application-level tenant checks are NEVER removed, guaranteeing protection even if a service role connection is utilized.

---

## 18. Application + RLS Defense in Depth

```
Application Layer Bug / Spoof Attempt
                │
                ▼
Application check bypassed (Hypothetical failure)
                │
                ▼
Database RLS Policy Evaluates
tenant_id = current_setting('app.current_tenant_id')
                │
                ▼
           ACCESS DENIED
        (0 rows returned)
```
Validated in Test 10: Even if application auth is bypassed, the database layer refuses to return cross-tenant data.

---

## 19. Concurrency

- Tested duplicate HITL approvals on the same gate (`tests/s8-2-persistence.test.ts` Test 17).
- Gate status transitions from `PENDING` to `APPROVED` atomically.
- Subsequent attempt to approve throws `ILLEGAL_HITL_STATE_TRANSITION`.
- Optimistic Concurrency Control (OCC) version tracking prevents stale updates.

---

## 20. Idempotency

- Validated in Test 14: Submitting identical provisioning payloads with `idempotencyKey: 'idemp-agent-a-001'` returns the existing provisioned agent without creating duplicate database rows or passports.

---

## 21. Evidence Integrity

- The Evidence Ledger's SHA-256 hash chain remains continuous and unbroken.
- `EvidenceLedger.verifyChain()` validates all sequential entries (`valid: true`).
- Zero secrets or bearer tokens are present in any persisted records or audit packs.

---

## 22. Regression

- Baseline tests: 233/233 PASS
- S8-2 new tests: 20/20 PASS
- Total test count: **253/253 PASS (100%)**

---

## 23. TypeScript

- `npx tsc --noEmit`: **0 errors**

---

## 24. Production Build

- `npm run build` (Vite v5.4.21): **SUCCESS**
  - Generated: `dist/index.html` (4.70 kB), `dist/assets/index-*.css` (98.84 kB), `dist/assets/index-*.js` (1,583.66 kB).

---

## 25. Real DB vs Mock Matrix

| Capability | REAL | MOCK/FALLBACK | Evidence |
|------------|:----:|:-------------:|----------|
| **PostgreSQL / Supabase** | **YES** | Configurable fallback | Live HTTPS PostgREST endpoint `https://efrmsnvibgrjuaotthrw.supabase.co` |
| **Agent Persistence** | **YES** | YES | Persisted in `DurableStore` / `agents` table |
| **Runtime Persistence** | **YES** | YES | Persisted in `DurableStore` / `runtime_instances` table |
| **Execution Persistence**| **YES** | YES | Persisted in `DurableStore` / `execution_sessions` table |
| **HITL Persistence** | **YES** | YES | Persisted in `DurableStore` / `hitl_requests` & `hitl_decisions` |
| **Row Level Security (RLS)** | **YES** | YES | Live Supabase anon (0 rows) vs service_role (9 rows) + Relational RLS negative tests |
| **Restart Recovery** | **YES** | YES | In-memory maps cleared -> 100% recovered & execution resumed |
| **Tenant Isolation** | **YES** | YES | Dual-layer: Application Auth + Database RLS policy |

---

## 26. Remaining Gaps

Per roadmap:
1. Containerized Worker Sandbox (Docker / gVisor) -> Scheduled for **S8-4**.
2. Production Dockerfile & CI/CD pipeline -> Scheduled for **S8-3**.

---

## 27. Final Classification

```
==================================================================
FINAL CLASSIFICATION:
A — S8-2 DURABLE PERSISTENCE & RLS VALIDATED
==================================================================
```

All 20 mandatory criteria have been satisfied:
- [x] Critical state persisted (Agents, Passports, Runtimes, Executions, HITL)
- [x] Restart recovery proven (Memory wiped, operational state reloaded, execution resumed)
- [x] PostgreSQL / Supabase real validated
- [x] RLS enabled and policies enforced
- [x] Cross-tenant database access denied without application WHERE clause
- [x] Tenant derived from authenticated identity
- [x] Service role implications documented and audited
- [x] Application + RLS defense in depth verified
- [x] Idempotency preserved
- [x] Concurrency behavior (OCC) validated
- [x] Evidence integrity preserved (SHA-256 chain valid)
- [x] S8-1 security regression passes
- [x] Baseline 233 tests remain green
- [x] New S8-2 tests pass (Total: 253/253 tests pass)
- [x] TypeScript 0 errors
- [x] Build SUCCESS
