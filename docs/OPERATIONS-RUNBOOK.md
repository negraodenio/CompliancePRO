# 🏛️ CG-AG GOVERNANCE OS — ENTERPRISE OPERATIONS & RUNBOOK SOP
## Production Incident Response, Disaster Recovery & Governance Control Plane SOP

---

## 1. 🚨 INCIDENT CLASSIFICATION & ESCALATION MATRIX

| Severity | Event Type | Detection Trigger | Target SLA | Escalation Path |
| :--- | :--- | :--- | :--- | :--- |
| **CRITICAL** | `DATABASE_DOWN` | DB health check fails, query timeout | $\le 15\text{ min}$ | Platform Lead, DevOps On-Call, CISO |
| **CRITICAL** | `LEDGER_INTEGRITY_FAILURE` | Broken hash link $H_n \neq H_{n-1}$ | $\le 10\text{ min}$ | CISO, AppSec Lead, Lead Auditor |
| **CRITICAL** | `TENANT_ISOLATION_VIOLATION` | Cross-tenant access attempt intercepted | $\le 5\text{ min}$ | CISO, DPO, Platform Security |
| **HIGH** | `CIRCUIT_BREAKER_ACTIVE` | Failsafe trip (`HARD_KILL` on loop) | $\le 30\text{ min}$ | AI Squad Lead, AppSec Champion |
| **HIGH** | `HITL_QUEUE_OVERFLOW` | Pending approvals approaching SLA | $\le 45\text{ min}$ | Accountable Risk Officer |
| **MEDIUM** | `FINOPS_QUOTA_BREACH` | Monthly spend ceiling $> 90\%$ | $\le 2\text{ hours}$ | FinOps Controller |

---

## 2. 📘 STANDARD OPERATING PROCEDURES (SOP)

### SOP-01: Database Outage (`DATABASE_DOWN`)
1. **Detection:** Telemetry reports `DATABASE_UNAVAILABLE` via `/health/database`.
2. **Containment:** Control Plane retains transactional journal in safe recovery journal (`cgag:sys:transaction_journal_v1`).
3. **Recovery:** Verify RDS/PostgreSQL connectivity, restart connection pool, execute `recoverPendingTransactions()`.
4. **Evidence:** Generate attestation record anchored to next ledger block.

### SOP-02: Cryptographic Ledger Corruption (`LEDGER_INTEGRITY_FAILURE`)
1. **Detection:** `AuditLedgerStore.verifyEntireLedger()` returns `isChainValid: false`.
2. **Containment:** Freeze new automated dossier exports.
3. **Investigation:** Identify corrupted `blockId` and compare against cold immutable snapshot.
4. **Recovery:** Restore canonical block hash from point-in-time backup and re-execute chain verification.

### SOP-03: Tenant Isolation Boundary Breach Attempt (`TENANT_ISOLATION_VIOLATION`)
1. **Detection:** Authorization Engine intercepts cross-tenant query (`TENANT_VIOLATION`).
2. **Containment:** Immediately revoke active user session (`IdentityProvider.revokeSession()`).
3. **Evidence:** Emit SHA-256 Security Evidence Digest and notify Security Operations.
