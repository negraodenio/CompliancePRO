# COMPLYPRO.PT — S8-5
## ACTIVE GOVERNANCE & CONTINUOUS GUARDIAN VALIDATION REPORT

**Motto**: *"Build with your framework. Govern with ComplyPRO."*  
**Date**: October 2, 2026  
**Status**: **A — S8-5 ACTIVE GOVERNANCE VALIDATED**  
**Guiding Principle**: *"ADD, DON'T BREAK."*

---

### 1. Executive Summary

Sprint S8-5 marks the definitive transition of ComplyPRO from a primarily consultative/passive scanner into an **Active AI Governance Platform**.

While maintaining the scanner as the core component for discovery and analysis, ComplyPRO now actively observes, evaluates, intercepts, and enforces compliance policies throughout the runtime lifecycle of autonomous agents.

Key achievements in S8-5:
- **Runtime Event Stream**: Implemented `ActiveGovernanceBus` for tenant-isolated pub/sub of lifecycle, policy, model, tool, data, and risk events.
- **Continuous Guardian**: Extended `GuardianService` in `src/core/guardian-service.ts` with `evaluateActiveCapability` and `verifyPassportCompliance` without creating secondary/divergent guardians.
- **Active Passport Enforcement**: Direct detection of discrepancies between runtime requests and declared passports (Tool, Model, Data Scope, and Tenant bindings).
- **Continuous Risk Detection**: Implemented `ContinuousRiskDetector` to track dynamic anomaly scores, escalating dynamically from `ALLOW` to `ALERT`, `CIRCUIT_BREAK`, and `SUSPEND`.
- **Scanner-to-Governance Bridge**: Created `ScannerPolicyBridge` translating passive `ScannerResult` AST findings directly into contextual `ComplianceProfile` contracts and provisioned `AgentPassport` entities.
- **Execute Exactly Once Invariance**: Guaranteed through state transition locking (`session.status = 'COMPLETED'`) in `ToolGateway`.
- **Full Suite Regression**: **513/513 assertions PASS** across 21 test suites (488 baseline + 25 new S8-5 tests). Zero regressions.

---

### 2. Baseline

Prior to starting S8-5, the codebase underwent strict pre-flight audit:

```text
BASELINE BEFORE S8-5
- Total Assertions: 488/488 PASS
- Total Test Suites: 20/20 PASS
- TypeScript: PASS (0 errors)
- Production Build: PASS (Client bundle + SSR Server bundle + Worker Runner)
- Previous Sprints Closed: S8-1 (A), S8-2A (A), S8-2B (A), S8-2 (A), S8-3 (B), S8-4 (B)
```

Baseline integrity was verified before any changes were introduced.

---

### 3. Architecture Audit

Before adding capabilities, the architecture was audited:
1. `src/core/types.ts` & Scanner findings: rich detection of agent capabilities, risks, and frameworks.
2. `src/core/guardian-service.ts`: robust core engine for local policy evaluation, fast-path (<2ms) forbidden checks, and evidence emission.
3. `src/core/agent-provisioner.ts`: authoritative creator of immutable `AgentPassport` bindings.
4. `src/core/tool-gateway.ts`, `src/core/model-gateway.ts`, `src/core/data-gateway.ts`: enforcement perimeters for capability invocation.
5. `src/server/db/durable-store.ts`: authoritative PostgreSQL / Supabase write-through with RLS.
6. `src/core/evidence-ledger.ts`: tamper-evident cryptographic Merkle chain.

---

### 4. Existing Capabilities Preserved

Following the strict rule **"ADD, DON'T BREAK"**:
- **Scanner**: Unmodified. Continues to discover tools, models, frameworks, and compliance risks.
- **Guardian Core APIs**: `evaluate`, `evaluateToolExecution`, `evaluateModelInvocation`, `evaluateDataEgress` remain 100% backward compatible.
- **Gateways**: `ToolGateway`, `ModelGateway`, and `DataGateway` maintain identical public contracts.
- **Durable Persistence**: `DurableStore` and Supabase RLS continue to guard relational entities.
- **Zero Test Removals**: Not a single assertion was deleted or loosened.

---

### 5. Active Governance Architecture

ComplyPRO now operates a dual-engine architecture:

```text
                         COMPLYPRO
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
       SCANNER           GOVERNANCE          GUARDIAN
          │                  │                  │
      Discovery          Policies           Runtime
      Analysis           Contracts          Monitoring
      Findings           Controls           Interception
          │                  │                  │
          └──────────────────┼──────────────────┘
                             │
                     ACTIVE CONTROL
                             │
                  ┌──────────┼──────────┐
                  ↓          ↓          ↓
                ALLOW      BLOCK       HITL
                             │
                             ↓
                         EVIDENCE
```

- **Scanner**: "What exists and what compliance issues were detected in code/specs?"
- **Governance**: "What rules, contracts, and passports define acceptable agent behavior?"
- **Guardian**: "What is the agent attempting to do RIGHT NOW, and what must ComplyPRO do?"

---

### 6. Continuous Guardian

The Continuous Guardian extends `GuardianService` directly:
- **Pre-Execution Interception**: Inspects capability requests before dispatching to external providers.
- **Suspension Enforcement**: Rejects requests immediately if the agent is in a `SUSPENDED` state due to prior critical violations.
- **Deterministic Policy Evaluation**: Evaluates compliance contracts and produces deterministic verdicts: `ALLOW`, `BLOCK`, `REQUIRE_HITL`, `CIRCUIT_BREAK`.
- **Dynamic Reinstatement**: Authorized operators can reinstate suspended agents after investigation via `GuardianService.reinstateAgent`.

---

### 7. Runtime Event Model

Defined and implemented in `src/core/active-governance-bus.ts` and `src/core/evidence-ledger.ts`:

```typescript
export type EvidenceEventType =
  | 'AGENT_STARTED' | 'AGENT_STOPPED'
  | 'MODEL_REQUESTED' | 'MODEL_ALLOWED' | 'MODEL_BLOCKED'
  | 'TOOL_REQUESTED' | 'TOOL_ALLOWED' | 'TOOL_BLOCKED'
  | 'DATA_REQUESTED' | 'DATA_ALLOWED' | 'DATA_BLOCKED'
  | 'POLICY_EVALUATED'
  | 'HITL_REQUIRED' | 'HITL_APPROVED' | 'HITL_REJECTED'
  | 'CAPABILITY_DENIED'
  | 'RISK_DETECTED'
  | 'PASSPORT_VIOLATION' | 'PASSPORT_COMPLIANT'
  | 'TENANT_VIOLATION'
  | 'EXECUTION_STARTED' | 'EXECUTION_PAUSED' | 'EXECUTION_RESUMED'
  | 'EXECUTION_COMPLETED' | 'EXECUTION_FAILED';
```

Events are published asynchronously to `ActiveGovernanceBus` with automatic mirror recording into `EvidenceLedger`.

---

### 8. Policy Enforcement (Scenarios A, B, C)

1. **Scenario A — ALLOW**:
   - Authorized capability (`fx_rate_lookup`) evaluated against `ComplianceProfile`.
   - Verdict: `ALLOW`. Emits `TOOL_REQUESTED` and `TOOL_ALLOWED`. Tool executes.
2. **Scenario B — BLOCK**:
   - Unauthorized capability (`unauthorized_arbitrary_shell_tool`) requested.
   - Verdict: `BLOCK`. Emits `TOOL_BLOCKED`. Tool executions = 0.
3. **Scenario C — REQUIRE_HITL**:
   - High-risk financial transaction (`credit.approve €25,000`) requested.
   - Verdict: `REQUIRE_HITL`. Execution transitions to `PAUSED`. Emits `HITL_REQUIRED`. Tool executions = 0.

---

### 9. Passport Enforcement

`GuardianService.verifyPassportCompliance` enforces zero-drift least privilege:
- **Declared Tool vs. Requested Tool**: Undeclared tools trigger `UNDECLARED_TOOL` and `BLOCK`.
- **Declared Model vs. Requested Model**: Undeclared models trigger `UNDECLARED_MODEL` and `BLOCK`.
- **Declared Data Scope vs. Requested Data Scope**: Undeclared table/resource reads trigger `UNDECLARED_DATA_SCOPE` and `BLOCK`.
- **Declared Tenant vs. Runtime Tenant**: Cross-tenant tenant injections trigger `TENANT_MISMATCH` and `BLOCK`.

---

### 10. Scanner Integration (`ScannerPolicyBridge`)

`ScannerPolicyBridge` implements the bridge from discovery to active control:
1. Ingests static/dynamic `ScannerResult`.
2. Infers risk posture: High-risk AI Act categorization, critical security findings, or missing human oversight triggers mandatory controls `CG-AG-01`, `CG-AG-02`, `CG-AG-03`, `CG-AG-04`, `CG-AG-07`.
3. Compiles a verified `ComplianceProfile` using `PolicyCompiler`.
4. Provisions an active `AgentPassport` via `AgentProvisioner`.
5. Binds the passport to `GuardianService` for continuous runtime enforcement.

---

### 11. Human-in-the-Loop (HITL)

- High-impact capability requests pause atomically with `status: 'PAUSED'`.
- Provider executions remain **0** while waiting for human decision.
- Operators review the gate in `HitlStore` / Cockpit API.
- Upon approval (`APPROVED`), `ToolGateway.resumeExecution` resumes the task and executes exactly once.
- Once completed, `session.status = 'COMPLETED'`. Subsequent duplicate resume attempts are strictly rejected (`ILLEGAL_SESSION_STATE`).

---

### 12. Durable State

Active governance state survives process crashes and cold restarts:
- Paused execution sessions and gate links persist to `execution_sessions` via `DurableStore`.
- On cold start, `RuntimeManager.reset()` is called, and `DurableStore.getExecutionSession` successfully rehydrates session state and parameters.

---

### 13. Evidence Ledger

Every active decision, runtime event, and HITL transition appends an immutable entry to the `EvidenceLedger`:
- Chained cryptographically with SHA-256 event digests.
- `EvidenceLedger.verifyChain()` verified across all entries with `valid: true`.

---

### 14. Tenant Isolation

Tenant boundary enforcement verified on both layers:
1. **Application Layer**: `ActiveGovernanceBus.subscribe` and `getEvents` partition events by `tenantId`. Tenant Beta listeners receive 0 events from Tenant Alpha.
2. **Database Layer**: Cross-tenant attempts trigger `TENANT_VIOLATION` in Guardian and HTTP 401 in PostgREST RLS.

---

### 15. Adversarial Crucibles (Crucibles A through E)

| Crucible | Attack Vector / Scenario | Observed Result | Verdict |
|---|---|---|---|
| **Crucible A** | Agent requests prohibited tool (`drop_production_tables_sql`) | **BLOCK**; 0 provider executions; `TOOL_BLOCKED` recorded | **PASS** |
| **Crucible B** | Agent requests unauthorized shadow model (`unauthorized-shadow-llm-v99`) | **BLOCK**; 0 model inferences; `MODEL_BLOCKED` recorded | **PASS** |
| **Crucible C** | Agent attempts unauthorized data scope (`confidential_payroll_salaries`) | **BLOCK**; 0 data reads; `DATA_BLOCKED` recorded | **PASS** |
| **Crucible D** | Agent attempts cross-tenant impersonation (`TENANT-MALICIOUS-IMPERSONATOR`) | **BLOCK**; `TENANT_VIOLATION` recorded; Agent flagged | **PASS** |
| **Crucible E** | High-risk action (`credit.approve €25,000`) | **REQUIRE_HITL** → Paused (0 exec) → Human `APPROVED` → Resumed (1 exec exactly) | **PASS** |

---

### 16. Test Results

`tests/s8-5-active-governance.test.ts`:
- **Total Tests**: 25/25 PASS
- **Crucibles**: 5/5 PASS
- **Execution Time**: ~1.8s
- **Status**: 100% PASS

---

### 17. Regression Results

Full regression run across all 21 test suites (`npm test`):
- `tests/compliance-compiler.test.ts`: PASS
- `tests/guardian-evaluation.test.ts`: PASS
- `tests/governed-capability-gateway.test.ts`: PASS
- `tests/evidence-ledger.test.ts`: PASS
- `tests/agent-provisioning.test.ts`: PASS
- `tests/isolated-runtime.test.ts`: PASS
- `tests/crewai-runtime-adapter.test.ts`: PASS
- `tests/agent-studio-api.test.ts`: PASS
- `tests/governance-cockpit.test.ts`: PASS
- `tests/model-gateway.test.ts`: PASS
- `tests/tool-gateway.test.ts`: PASS
- `tests/data-gateway.test.ts`: PASS
- `tests/end-to-end-governed-agent.test.ts`: PASS
- `tests/model-gateway-real-provider.test.ts`: PASS
- `tests/s8-1-security.test.ts`: PASS
- `tests/s8-2-persistence.test.ts`: PASS
- `tests/s8-2-real-restart.test.ts`: PASS
- `tests/s8-2b-rls-real.test.ts`: PASS
- `tests/s8-3-container-audit.test.ts`: PASS
- `tests/s8-4-worker-sandbox.test.ts`: PASS
- `tests/s8-5-active-governance.test.ts`: PASS

**Total Assertions**: **513 PASS**, **0 FAIL**.

---

### 18. Known Gaps

1. **Host Docker Daemon Inactivity**: The local host Windows Docker Desktop service (`com.docker.service`) remains inactive on this machine. While the active software governance, policies, and continuous monitoring are fully proven, physical Linux kernel container enforcement remains classified under S8-3/S8-4 until run inside CI or on a host with an active Docker daemon.
2. **Autonomous Remediation**: Autonomous hot-patching of agent source code is intentionally omitted in S8-5 (least privilege; human oversight required for production code modifications).

---

### 19. Evidence Chain Status

- Genesis previous hash: `0000000000000000000000000000000000000000000000000000000000000000`
- SHA-256 Merkle root verification: **VALID**
- Tamper detection: Verified active (any simulated digest modification is flagged immediately).

---

### 20. Final Classification

```text
==================================================================
>>> CLASSIFICATION: A — S8-5 ACTIVE GOVERNANCE VALIDATED       <<<
==================================================================
- Active Governance Runtime: VALIDATED (Grade A)
- Continuous Guardian: VALIDATED (Grade A)
- Active Passport Enforcement: VALIDATED (Grade A)
- Continuous Risk Detection: VALIDATED (Grade A)
- Scanner Integration Bridge: VALIDATED (Grade A)
- HITL & Exactly Once Invariance: VALIDATED (Grade A)
- Durable Persistence & Recovery: VALIDATED (Grade A)
- Regression Suite: 513/513 PASS (Grade A)
```
