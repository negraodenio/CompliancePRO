# Changelog — CG-AG Governance OS

All notable changes to the CG-AG Governance OS are documented in this file.

## [1.0.0] — 2026-08-27 (Production Readiness Release)

### DISCOVER (Pillar 1)
- **AI Inventory**: Multi-tier cataloging of AI systems, models, agents, tools, databases, and external endpoints.
- **Agents & Teams**: Squad-level hierarchy, accountable engineering owners, and tool access graph.
- **Agent Passports**: Verifiable identity passports with SHA-256 signatures, autonomy caps, and permission boundaries.
- **Assessments (Agentic Light)**: 10-dimension evaluation engine with distinct Agentic Governance Scores.

### GOVERN (Pillar 2)
- **12 CG-AG Controls**: Full governance engine covering Registry, Access, Auditing, Data Protection, Telemetry, and Resilience.
- **Risk Engine**: Multi-dimensional risk taxonomy distinguishing Finding from Risk Exposure from Strategic Decision.
- **Policy Engine**: Versioned guardrails, evaluation rules, and runtime enforcement modes (STRICT_BLOCK, HITL_GATE, AUDIT_LOG).
- **Compliance Overlays**: Mapping crosswalks for EU AI Act (High-Risk Annex IV), LGPD (Art. 38 RIPD), and NIST AI RMF 1.0.

### OPERATE (Pillar 3)
- **Decisions Pipeline**: Formal operational pipeline (`Finding -> Risk -> Decision -> Action -> Evidence`) with CISO signing.
- **HITL Approvals**: Real-time Human-in-the-Loop runtime interceptor with zero unauthorized bypass.
- **Remediation Actions**: Engineering action tickets with mandatory `PENDING_VERIFICATION` before closure.
- **Incidents & Circuit Breakers**: Automated trip triggers (`HARD_KILL`, `SAFE_FALLBACK`, `RATE_THROTTLE`) with AppSec unfreeze gates.
- **Runtime FinOps**: Multi-tier cost attribution, token velocity limits, and automated budget anomaly containment.

### ASSURE (Pillar 4)
- **Protected Evidence Center**: RFC 8785 canonical JSON evidence records with SHA-256 digests and ledger linkages.
- **Audit Ledger**: Cryptographically chained blocks ($H_{n-1} ightarrow H_n$) from Genesis to Head with live tamper verification.
- **Regulatory Dossiers & Export Hub**: Technical compilation packs with JSON manifests and Markdown technical files.
- **Governance Simulator**: 10 adversarial abuse scenarios, live stress testing (50-100 ev/s), and isolated simulation namespaces.

### HARDENING & PERSISTENCE
- **Persistence Adapter**: Application-level atomic batch commit (`atomicStoreBatchCommit`) with automatic rollback and journal recovery.
- **Optimistic Concurrency Control**: Monotonic versioning and conflict detection (`CONCURRENT_MODIFICATION`).
- **Multi-Tenant Boundary**: Scoped storage keys (`cgag:{tenantId}:{workspaceId}`) and tenant isolation.
