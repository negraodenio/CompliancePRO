# 🏛️ PRODUCTION ACTIVATION & DISASTER RECOVERY RUNBOOK
## CG-AG Governance OS Data Plane (v1.0.0 / Phase 9.1)

---

## 1. 📋 OPERATIONAL ARCHITECTURE
The CG-AG Governance OS Data Plane integrates a Pluggable Dual-Mode persistence engine:
$$\text{Domain Stores} \longrightarrow \text{PersistenceAdapter} \longrightarrow \begin{cases} \text{MemoryPersistenceAdapter} & \text{(Local Dev / CI / Sandboxes)} \\ \text{PostgresPersistenceAdapter} & \text{(Enterprise Staging / Production)} \end{cases}$$

---

## 2. 🚀 STAGING CUTOVER PROCEDURE
1. Provision PostgreSQL 15+ instance with TLS 1.3 enforced.
2. Store `DATABASE_URL` in Enterprise Secret Manager (AWS Secrets Manager / HashiCorp Vault).
3. Set environment variable: `PERSISTENCE_BACKEND=postgres`.
4. Execute migration dry-run:
   ```bash
   npm run db:migrate -- --dry-run
   ```
5. Apply versioned schema and canonical seed:
   ```bash
   npm run db:migrate
   npm run db:seed
   ```
6. Execute canonical reconciliation:
   ```bash
   npm run db:reconcile
   ```

---

## 3. 💾 BACKUP & DISASTER RECOVERY SOP
* **Recovery Point Objective (RPO):** $\le 15\text{ minutes}$ (Continuous WAL archiving).
* **Recovery Time Objective (RTO):** $\le 30\text{ minutes}$ (Automated snapshot restore).
* **Backup Schedule:** Daily full snapshot + Continuous transaction log streaming.
* **Integrity Validation:** Every restore must run `DatabaseReconciler.reconcileBaseline()` to verify zero orphan records and zero cryptographic hash mismatches.

---

## 4. 🔒 DATABASE SECURITY HARDENING CHECKLIST
* [x] Parametrized queries enforced across all tables (0 SQL injection vectors).
* [x] Multi-tenant context scoping required on every query (`WHERE tenant_id = $1 AND workspace_id = $2`).
* [x] Optimistic Concurrency Control (`version` column) prevents stale overwrites.
* [x] Zero hardcoded secrets in source code, tests, or frontend bundle.
* [ ] Enterprise Secret Manager integration configured in target environment.
* [ ] Least privilege DB user role (`cgag_app`) configured with `SELECT, INSERT, UPDATE` on application tables.
