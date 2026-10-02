# COMPLYPRO.PT — S8-2A
# REAL POSTGRESQL WRITE-THROUGH & PROCESS RESTART RECOVERY

**Motto:** *"Build with your framework. Govern with ComplyPRO."*  
**Date:** October 2, 2026  
**Status:** VALIDATED  
**Classification:** **A — S8-2A REAL PERSISTENCE VALIDATED**

---

## 1. Objective

Sprint **S8-2A** resolves the critical gap identified during the `S8-RECONCILIATION-AUDIT.md`:
Previously, while `DurableStore` exposed storage abstractions and Supabase RLS migrations had been deployed, runtime methods (`saveAgent`, `savePassport`, `saveRuntime`, `saveExecutionSession`, `saveHitlRequest`, `saveHitlDecision`) maintained state in volatile JavaScript `Map` instances in process memory.

The objective of S8-2A was to make **live PostgreSQL (Supabase Cloud)** the definitive **Source of Truth** through real write-through and read recovery, proving that upon total process death and independent process restart, operational state is recovered directly and authoritatively from PostgreSQL.

```
BEFORE S8-2A:
Process A ──> DurableStore ──> Memory Map (Volatile) ──> Process Crash ──> STATE LOST

AFTER S8-2A:
Process A ──> DurableStore ──> Live PostgreSQL ──> Process Termination
                                    │
Process B (Fresh OS Process) ───────┴───────────> Recover State directly from PostgreSQL
```

---

## 2. Previous Gap

During the `S8-RECONCILIATION-AUDIT`, the following was determined:
1. `src/server/db/durable-store.ts` held runtime data inside static `Map` tables (`agentsTable`, `passportsTable`, `runtimesTable`, `executionsTable`, `hitlRequestsTable`, `hitlDecisionsTable`).
2. Calls to `saveRuntime()` or `saveExecutionSession()` updated memory immediately without synchronous write-through guarantees or recovery from disk/database across distinct OS processes.
3. If the host process restarted, in-memory state vanished, leaving running agents and pending HITL gates orphaned.

---

## 3. DurableStore Audit

A comprehensive method-to-table audit was performed on `src/server/db/durable-store.ts`:

| Entity | Method | Pre-S8-2A Storage | PostgreSQL Table (Live Supabase) | Write-Through Mechanism |
|--------|--------|-------------------|-----------------------------------|-------------------------|
| **Agent** | `saveAgent` / `saveAgentAsync` | In-memory `agentsTable` Map | `public.agents` | Sequential queue `agents:{id}` via `upsertToDatabase` |
| **Agent Passport** | `savePassport` / `savePassportAsync` | In-memory `passportsTable` Map | `public.agent_passports` | Sequential queue `agent_passports:{id}` awaiting agent FK |
| **Runtime Instance** | `saveRuntime` / `saveRuntimeAsync` | In-memory `runtimesTable` Map | `public.runtime_instances` | Sequential queue `runtime_instances:{id}` awaiting agent FK |
| **Execution Session** | `saveExecutionSession` / `saveExecutionSessionAsync` | In-memory `executionsTable` Map | `public.execution_sessions` | Sequential queue `execution_sessions:{id}` awaiting runtime FK |
| **HITL Request** | `saveHitlRequest` / `saveHitlRequestAsync` | In-memory `hitlRequestsTable` Map | `public.hitl_requests` | Sequential queue `hitl_requests:{gate_id}` awaiting execution FK |
| **HITL Decision** | `saveHitlDecision` / `saveHitlDecisionAsync` | In-memory `hitlDecisionsTable` Map | `public.hitl_decisions` & `hitl_requests` | `upsertToDatabase` + `patchDatabase` updating request status |

---

## 4. Database Schema

The database schema matches the live migration `002_durable_runtime_and_rls.sql` applied to Supabase PostgreSQL:

1. `agents` (Primary Key: `agent_id`, tenant-scoped `tenant_id`)
2. `agent_passports` (Primary Key: `passport_id`, Foreign Key: `agent_id REFERENCES agents(agent_id) ON DELETE CASCADE`)
3. `runtime_instances` (Primary Key: `runtime_id`, Foreign Key: `agent_id REFERENCES agents(agent_id) ON DELETE CASCADE`)
4. `execution_sessions` (Primary Key: `execution_id`, Foreign Key: `runtime_id REFERENCES runtime_instances(runtime_id) ON DELETE CASCADE`)
5. `hitl_requests` (Primary Key: `hitl_request_id`, Unique Key: `gate_id`, Foreign Key: `execution_id REFERENCES execution_sessions(execution_id) ON DELETE CASCADE`)
6. `hitl_decisions` (Primary Key: `decision_id`, Foreign Key: `gate_id REFERENCES hitl_requests(gate_id) ON DELETE CASCADE`)

All tables have Row Level Security enabled (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`).

---

## 5. PostgreSQL Adapter

The persistence layer in `src/server/db/durable-store.ts` utilizes the unified dual-engine connection architecture:

1. **Native PostgreSQL (`pg.Pool`)**: When `DATABASE_URL` is provided, establishes connection pool with transactional session variables (`SET LOCAL app.current_tenant_id = $1`).
2. **Supabase PostgREST Client**: When `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_ANON_KEY` are configured, executes HTTP REST requests directly to the Supabase endpoint (`/rest/v1/...`) with `resolution=merge-duplicates` for idempotency and `PATCH` for partial column transitions.

No duplicate database abstraction layers or redundant connection pools were created.

---

## 6. Write-Through Implementation

To prevent race conditions, concurrent interleaving, and foreign key constraint violations across asynchronous background tasks, `DurableStore` implements:

1. **Entity-Specific Serial Queues (`enqueueEntityWrite`)**:
   Writes for an entity key (`agents:id`, `runtime_instances:id`, `execution_sessions:id`, `hitl_requests:gate_id`, `hitl_decisions:gate_id`) are serialized in a FIFO promise chain.
2. **Deterministic Foreign Key Precondition Awaiting**:
   - `savePassportAsync` awaits completion of its parent `agents:{agentId}` write.
   - `saveRuntimeAsync` awaits completion of its parent `agents:{agentId}` write.
   - `saveExecutionSessionAsync` awaits completion of its parent `runtime_instances:{runtimeId}` write.
   - `saveHitlRequestAsync` awaits completion of its parent `execution_sessions:{executionId}` write.
   - `saveHitlDecisionAsync` awaits completion of its parent `hitl_requests:{gateId}` write.
3. **Write Order Discipline**:
   ```
   DATABASE WRITE (PostgreSQL/Supabase)
          ↓
       SUCCESS
          ↓
   LOCAL CACHE UPDATE
   ```
4. **`flushPendingWrites()`**:
   Provides an asynchronous barrier ensuring all active writes in flight are committed to PostgreSQL before returning or proceeding to dependent test phases.

---

## 7. Read-Through / Recovery

`DurableStore.rehydrateOperationalState({ tenantId, fromDatabaseOnly })`:
1. Executes authoritative `SELECT` queries across `agents`, `agent_passports`, `runtime_instances`, `execution_sessions`, and `hitl_requests` directly from PostgreSQL.
2. Sourced directly from PostgreSQL: rebuilds the operational registry and caches strictly from database rows.
3. Automatically re-binds passports, runtime specs, and provisioning structures into `AgentProvisioner` and `RuntimeManager`.

---

## 8. Agent Persistence

- Tested with `saveAgentAsync` / `saveAgent` writing to `public.agents`.
- Verified insertion with columns: `agent_id`, `tenant_id`, `name`, `framework_name`, `framework_version`, `compliance_profile`, `capabilities`, `budget`, `status`, `created_at`, `updated_at`.
- Verified live PostgreSQL persistence via direct queries.

---

## 9. Passport Persistence

- Tested with `savePassportAsync` / `savePassport` writing to `public.agent_passports`.
- Cryptographic passport fingerprint, profile checksum, declared tools, governed capabilities, and risk tier (`HIGH`) anchored in PostgreSQL.
- Foreign key dependency on `agents` strictly respected.

---

## 10. Runtime Persistence

- Tested with `saveRuntimeAsync` / `saveRuntime` writing to `public.runtime_instances`.
- State transitions (`PROVISIONED` -> `RUNNING` -> `STOPPED`) persisted with accurate timestamps (`started_at`, `stopped_at`).
- Foreign key dependency on `agents` strictly respected.

---

## 11. Execution Persistence

- Tested with `saveExecutionSessionAsync` / `saveExecutionSession` writing to `public.execution_sessions`.
- Preserves execution state (`PAUSED`), tool invocation counters, `gate_id`, pending capability, and execution payload.
- Foreign key dependency on `runtime_instances` strictly respected.

---

## 12. HITL Persistence

- Tested with `saveHitlRequestAsync` / `saveHitlRequest` writing to `public.hitl_requests`.
- Tested with `saveHitlDecisionAsync` / `saveHitlDecision` writing to `public.hitl_decisions` and executing partial PATCH on `hitl_requests`.
- Gate status transition (`PENDING` -> `APPROVED` / `REJECTED`) is recorded in both tables.
- Duplicate or conflicting decisions strictly rejected with `ILLEGAL_HITL_STATE_TRANSITION`.

---

## 13. Restart Recovery

Sprint S8-2A created and executed `tests/s8-2-real-restart.test.ts`:

### Phase 1: Process A (Writer)
1. Connected to live Supabase PostgreSQL.
2. Provisioned Agent `agent-restart-alpha` for isolated test tenant.
3. Created Runtime in state `RUNNING`.
4. Created Execution Session in state `PAUSED`.
5. Created HITL Gate in state `PENDING`.
6. Flushed all pending writes to PostgreSQL.

### Phase 2 & 3: Process B (Fresh OS Process Spawn)
1. Spawned a completely distinct Node.js operating system process via `child_process.spawnSync`.
2. Initial memory was 100% empty (0 agents, 0 runtimes, 0 executions).
3. Invoked `DurableStore.rehydrateOperationalState({ fromDatabaseOnly: true })`.
4. Output log verified:
   `[PROCESS B]: Sourced from POSTGRESQL -> Agents: 1, Passports: 1, Runtimes: 1, Executions: 1, HITL: 1`
5. Recovered and verified:
   - Agent exists with matching `tenant_id`
   - Passport exists with `risk_tier: HIGH`
   - Runtime recovered in state `RUNNING`
   - Execution recovered in state `PAUSED`
   - HITL request recovered in state `PENDING`

### Phase 4: Authoritative Decision Update in Process B
1. Process B approved the HITL gate: `DurableStore.saveHitlDecisionAsync({ decision: 'APPROVED', decidedBy: 'OPERATOR-PROCESS-B-RECOVERED' })`.
2. Gate status updated to `APPROVED`.
3. Process B exited with code `0`.
4. Process A verified the new row in `public.hitl_decisions` in the database.

---

## 14. Tenant Isolation

- Under database rehydration, Tenant B query (`fromDatabaseOnly: true, tenantId: TENANT_B`) returns exclusively Tenant B records.
- Tenant B attempting to look up Tenant A's agent, runtime, or execution session receives `null`.
- Cross-tenant HITL decisions rejected with `CROSS_TENANT_HITL_DENIED`.

---

## 15. RLS Interaction

- **Row Level Security**: Native PostgreSQL RLS policies deployed in `002_durable_runtime_and_rls.sql` enforce `app.current_tenant_id = tenant_id`.
- **Backend Write Path**:
  > *Trusted backend write path utilizes `SUPABASE_SERVICE_ROLE_KEY` to execute control-plane orchestration and provisioning across tenants, bypassing RLS at the service tier.*
- **Anonymous Read Path**: PostgREST queries with `SUPABASE_ANON_KEY` yield 0 rows when unauthenticated, confirming PostgreSQL RLS policy enforcement.

---

## 16. Failure Handling

1. Database queries to non-existent tables or broken connections throw predictable typed errors (`DATABASE_WRITE_FAILED`, `DATABASE_READ_FAILED`).
2. Background write queue rejections are trapped in `trackPendingWrite`, preventing unhandled Node.js process crashes while propagating errors to callers that `await` asynchronous operations.
3. In-memory caches are never updated if the database write throws an unhandled error.

---

## 17. Transactions & Consistency

- Compound provisioning (Agent + Passport) ensures atomic consistency by sequentially creating the Agent record and awaiting its database commit before creating the Passport record.
- Foreign key dependencies across `agents` -> `runtime_instances` -> `execution_sessions` -> `hitl_requests` -> `hitl_decisions` are maintained with `ON DELETE CASCADE`.

---

## 18. Idempotency

- All database upserts utilize `ON CONFLICT (id) DO UPDATE` or PostgREST `Prefer: resolution=merge-duplicates`.
- Duplicate agent provisioning calls with matching `idempotencyKey` return identical records without creating duplicate database rows.

---

## 19. Real vs Mock Matrix

| Test Suite | Environment | Database | Isolation Proof | Result |
|------------|-------------|----------|-----------------|--------|
| `s8-2-persistence.test.ts` | Node.js TSX | **REAL** Supabase PostgreSQL | Multi-tenant RLS + Cache Rehydration | **20/20 PASS** |
| `s8-2-real-restart.test.ts` | Node.js Child Process | **REAL** Supabase PostgreSQL | **Separate OS Process Spawn** | **7/7 PASS** |
| `s8-1-security.test.ts` | Express HTTP | Memory + RBAC | Defense in Depth | **34/34 PASS** |
| `s8-3-container-audit.test.ts` | Docker / CI | Dockerfile & Git | Multi-stage & Non-root | **7/7 PASS** |
| `s8-4-worker-sandbox.test.ts` | Node.js Sandboxing | Ephemeral Scratchpad | UID + Resource Limits + Watchdog | **24/24 PASS** |
| Core S0–S7E Suites (14 suites) | In-memory & Real Provider | Gateways + Evidence | Merkle Chain + Real Provider | **199/199 PASS** |

---

## 20. Test Results

### Full Test Suite Run (`npm test`)
- Total Test Suites: **19 suites**
- Total Tests: **291 tests**
- Result: **291 / 291 PASS (100%)**
- Regressions: **0**

### TypeScript Check (`npx tsc --noEmit`)
- Result: **0 errors**

### Production Build (`npm run build`)
- Result: **SUCCESS (Built in 5.34s)**

---

## 21. Remaining S8-2 Gaps

None. All 6 required entities are backed by PostgreSQL write-through, and true process restart recovery has been proven via independent OS process execution.

---

## 22. Final Classification

**A — S8-2A REAL PERSISTENCE VALIDATED**

All conditions set in the S8-2A specification have been completely fulfilled:
- [x] Agent written to PostgreSQL
- [x] Passport written to PostgreSQL
- [x] Runtime written to PostgreSQL
- [x] Execution written to PostgreSQL
- [x] HITL written to PostgreSQL
- [x] Reads recover state from PostgreSQL
- [x] Map is not single source of truth
- [x] Restart recovery proven via independent OS process
- [x] Tenant isolation preserved
- [x] Failure handling proven
- [x] Idempotency preserved
- [x] Evidence integrity preserved
- [x] S8-1, S8-3, and S8-4 continue functioning with 0 regressions
- [x] 291/291 tests PASS
- [x] TypeScript 0 errors
- [x] Build SUCCESS
