# 🏛️ PHASE 9.2 — ENTERPRISE IDENTITY & ACCESS CONTROL SPECIFICATION

## Overview
This document specifies the Enterprise Identity, RBAC, ABAC, and Privileged Action architecture for the CG-AG Governance OS.

$$\text{Identity (IdP)} \longrightarrow \text{Session (JWT/OIDC)} \longrightarrow \text{Authorization Engine (RBAC+ABAC)} \longrightarrow \text{Governance Action} \longrightarrow \text{Evidence Digest} \longrightarrow \text{Audit Ledger}$$

## Roles & Permissions Matrix
* **CISO:** Full authority across Decisions, HITL Gates, Policies, Remediations, Failsafes, Dossiers.
* **DPO:** Authority over Privacy Policies, Data Decisions, RIPD Dossiers, Audit Ledger.
* **AI_OFFICE:** Authority over AI Entity Registry, Guardrail Policies, HITL Gates.
* **AUDITOR:** Read-only access to Findings, Controls, Protected Evidence, and Audit Ledger blocks.
* **ENGINEER:** Scoped execution of assigned Remediation Actions.

## Backend Invariant
All authorization checks are executed at the service boundary. UI elements reflect authorization state but are not the enforcement mechanism.
