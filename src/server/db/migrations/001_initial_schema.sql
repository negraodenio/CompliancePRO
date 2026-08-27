-- ============================================================================
-- CG-AG GOVERNANCE OS — POSTGRESQL DATA PLANE
-- Migration: 001_initial_schema.sql
-- Description: Normalized tables, foreign keys, OCC versioning, tenant scoping,
--              cryptographic audit ledger and evidence catalog.
-- ============================================================================

-- 1. MULTI-TENANCY & WORKSPACES
CREATE TABLE IF NOT EXISTS tenants (
    tenant_id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workspaces (
    workspace_id VARCHAR(64) NOT NULL,
    tenant_id VARCHAR(64) NOT NULL REFERENCES tenants(tenant_id) ON DELETE RESTRICT,
    name VARCHAR(255) NOT NULL,
    environment VARCHAR(32) NOT NULL DEFAULT 'production',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (tenant_id, workspace_id)
);

-- 2. DISCOVER: AI ENTITIES, AGENTS & SYSTEMS
CREATE TABLE IF NOT EXISTS ai_entities (
    entity_id VARCHAR(64) NOT NULL,
    tenant_id VARCHAR(64) NOT NULL,
    workspace_id VARCHAR(64) NOT NULL,
    name VARCHAR(255) NOT NULL,
    entity_type VARCHAR(32) NOT NULL, -- AGENT, MODEL, TOOL, AI_SYSTEM, PIPELINE
    system_id VARCHAR(64) NOT NULL,
    system_name VARCHAR(255) NOT NULL,
    department VARCHAR(255) NOT NULL,
    assigned_squad VARCHAR(255) NOT NULL,
    owner_name VARCHAR(255) NOT NULL,
    owner_role VARCHAR(255) NOT NULL,
    risk_tier VARCHAR(32) NOT NULL, -- CRITICAL, HIGH, MEDIUM, LOW
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (tenant_id, workspace_id, entity_id),
    FOREIGN KEY (tenant_id, workspace_id) REFERENCES workspaces(tenant_id, workspace_id) ON DELETE RESTRICT
);

-- 3. GOVERN: 12 CG-AG CONTROLS & POLICIES
CREATE TABLE IF NOT EXISTS cg_ag_controls (
    control_id VARCHAR(32) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    pillar VARCHAR(32) NOT NULL, -- DISCOVER, GOVERN, OPERATE, ASSURE
    description TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS governance_policies (
    policy_id VARCHAR(64) NOT NULL,
    tenant_id VARCHAR(64) NOT NULL,
    workspace_id VARCHAR(64) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    policy_type VARCHAR(64) NOT NULL, -- OPERATIONAL, DATA_PRIVACY, SECURITY, FINOPS, MODEL_USAGE
    status VARCHAR(32) NOT NULL, -- ACTIVE, DRAFT, ARCHIVED
    current_version VARCHAR(32) NOT NULL DEFAULT 'v1.0.0',
    version_history JSONB NOT NULL DEFAULT '[]'::jsonb,
    owner_name VARCHAR(255) NOT NULL,
    owner_role VARCHAR(255) NOT NULL,
    owner_department VARCHAR(255) NOT NULL,
    supported_controls TEXT[] NOT NULL DEFAULT '{}',
    exceptions JSONB NOT NULL DEFAULT '[]'::jsonb,
    guardrails JSONB NOT NULL DEFAULT '[]'::jsonb,
    enforcement_mode VARCHAR(32) NOT NULL, -- STRICT_BLOCK, HITL_GATE, AUDIT_LOG
    applicability VARCHAR(32) NOT NULL DEFAULT 'MANDATORY',
    version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (tenant_id, workspace_id, policy_id),
    FOREIGN KEY (tenant_id, workspace_id) REFERENCES workspaces(tenant_id, workspace_id) ON DELETE RESTRICT
);

-- 4. OPERATE: FINDINGS, RISKS & HUMAN DECISIONS
CREATE TABLE IF NOT EXISTS operational_findings (
    finding_id VARCHAR(64) NOT NULL,
    tenant_id VARCHAR(64) NOT NULL,
    workspace_id VARCHAR(64) NOT NULL,
    risk_id VARCHAR(64) NOT NULL,
    finding TEXT NOT NULL,
    source_target VARCHAR(255) NOT NULL,
    system_id VARCHAR(64) NOT NULL,
    agent_id VARCHAR(64),
    agent_name VARCHAR(255),
    team VARCHAR(255),
    model VARCHAR(255),
    tools_affected TEXT[] NOT NULL DEFAULT '{}',
    severity VARCHAR(32) NOT NULL, -- CRITICAL, HIGH, MEDIUM, LOW
    likelihood VARCHAR(32) NOT NULL,
    impact VARCHAR(32) NOT NULL,
    category VARCHAR(64) NOT NULL,
    owner_name VARCHAR(255) NOT NULL,
    owner_role VARCHAR(255) NOT NULL,
    owner_department VARCHAR(255) NOT NULL,
    status VARCHAR(32) NOT NULL, -- PENDING_DECISION, IN_TREATMENT, ACCEPTED, ESCALATED, RESOLVED
    decision_type VARCHAR(32) NOT NULL, -- MITIGATE, ACCEPT, TRANSFER, AVOID, ESCALATE, PENDING_DECISION
    decision_rationale TEXT,
    decision_date TIMESTAMPTZ,
    accountable_lead VARCHAR(255),
    treatment_action TEXT,
    effective_date TIMESTAMPTZ,
    expiration_date TIMESTAMPTZ,
    evidence_digest VARCHAR(71),
    control_id VARCHAR(32) NOT NULL REFERENCES cg_ag_controls(control_id),
    version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (tenant_id, workspace_id, finding_id),
    UNIQUE (tenant_id, workspace_id, risk_id),
    FOREIGN KEY (tenant_id, workspace_id) REFERENCES workspaces(tenant_id, workspace_id) ON DELETE RESTRICT
);

-- 5. OPERATE: HITL APPROVAL GATES
CREATE TABLE IF NOT EXISTS hitl_approval_gates (
    gate_id VARCHAR(64) NOT NULL,
    tenant_id VARCHAR(64) NOT NULL,
    workspace_id VARCHAR(64) NOT NULL,
    action_title VARCHAR(255) NOT NULL,
    agent_id VARCHAR(64) NOT NULL,
    agent_name VARCHAR(255) NOT NULL,
    system_id VARCHAR(64) NOT NULL,
    system_name VARCHAR(255) NOT NULL,
    requested_action_type VARCHAR(64) NOT NULL,
    action_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    policy_id VARCHAR(64) NOT NULL,
    policy_name VARCHAR(255) NOT NULL,
    control_id VARCHAR(32) NOT NULL REFERENCES cg_ag_controls(control_id),
    control_name VARCHAR(255) NOT NULL,
    risk_tier VARCHAR(32) NOT NULL,
    trigger_reason TEXT NOT NULL,
    threshold_applied VARCHAR(255) NOT NULL,
    requested_at TIMESTAMPTZ NOT NULL,
    sla_deadline TIMESTAMPTZ NOT NULL,
    status VARCHAR(32) NOT NULL, -- PENDING_REVIEW, AUTHORIZED, REJECTED, EXPIRED_BLOCKED
    approval_outcome JSONB,
    version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (tenant_id, workspace_id, gate_id),
    FOREIGN KEY (tenant_id, workspace_id) REFERENCES workspaces(tenant_id, workspace_id) ON DELETE RESTRICT
);

-- 6. OPERATE: REMEDIATION ACTIONS
CREATE TABLE IF NOT EXISTS remediation_actions (
    action_id VARCHAR(64) NOT NULL,
    tenant_id VARCHAR(64) NOT NULL,
    workspace_id VARCHAR(64) NOT NULL,
    title VARCHAR(255) NOT NULL,
    finding_id VARCHAR(64) NOT NULL,
    risk_id VARCHAR(64) NOT NULL,
    decision_id VARCHAR(64) NOT NULL,
    control_id VARCHAR(32) NOT NULL REFERENCES cg_ag_controls(control_id),
    control_name VARCHAR(255) NOT NULL,
    affected_entity VARCHAR(255) NOT NULL,
    entity_type VARCHAR(32) NOT NULL, -- AGENT, AI_SYSTEM, ACTION
    severity VARCHAR(32) NOT NULL,
    assigned_squad VARCHAR(255) NOT NULL,
    assigned_lead VARCHAR(255) NOT NULL,
    lead_role VARCHAR(255) NOT NULL,
    sla_days INT NOT NULL,
    due_date TIMESTAMPTZ NOT NULL,
    status VARCHAR(32) NOT NULL, -- OPEN, IN_PROGRESS, PENDING_VERIFICATION, VERIFIED_CLOSED
    technical_scope TEXT NOT NULL,
    target_repository VARCHAR(255) NOT NULL,
    pull_request_ref VARCHAR(255),
    verification_method VARCHAR(64) NOT NULL,
    verification_details JSONB,
    version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (tenant_id, workspace_id, action_id),
    FOREIGN KEY (tenant_id, workspace_id, finding_id) REFERENCES operational_findings(tenant_id, workspace_id, finding_id) ON DELETE RESTRICT
);

-- 7. OPERATE: INCIDENTS & CIRCUIT BREAKERS
CREATE TABLE IF NOT EXISTS ai_incidents (
    incident_id VARCHAR(64) NOT NULL,
    tenant_id VARCHAR(64) NOT NULL,
    workspace_id VARCHAR(64) NOT NULL,
    title VARCHAR(255) NOT NULL,
    incident_timestamp TIMESTAMPTZ NOT NULL,
    affected_entity VARCHAR(255) NOT NULL,
    entity_id VARCHAR(64) NOT NULL,
    system_id VARCHAR(64) NOT NULL,
    system_name VARCHAR(255) NOT NULL,
    incident_type VARCHAR(64) NOT NULL,
    severity VARCHAR(32) NOT NULL,
    trigger_signal TEXT NOT NULL,
    observed_metric VARCHAR(255) NOT NULL,
    threshold_breached VARCHAR(255) NOT NULL,
    control_id VARCHAR(32) NOT NULL REFERENCES cg_ag_controls(control_id),
    control_name VARCHAR(255) NOT NULL,
    circuit_breaker JSONB NOT NULL,
    containment_status VARCHAR(32) NOT NULL, -- DETECTED, CONTAINED, RECOVERY_PENDING, RECOVERED, CLOSED
    root_cause_analysis TEXT NOT NULL,
    evidence_digest VARCHAR(71) NOT NULL,
    version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (tenant_id, workspace_id, incident_id),
    FOREIGN KEY (tenant_id, workspace_id) REFERENCES workspaces(tenant_id, workspace_id) ON DELETE RESTRICT
);

-- 8. OPERATE: RUNTIME FINOPS
CREATE TABLE IF NOT EXISTS finops_entity_usage (
    entity_id VARCHAR(64) NOT NULL,
    tenant_id VARCHAR(64) NOT NULL,
    workspace_id VARCHAR(64) NOT NULL,
    entity_name VARCHAR(255) NOT NULL,
    system_id VARCHAR(64) NOT NULL,
    system_name VARCHAR(255) NOT NULL,
    department VARCHAR(255) NOT NULL,
    assigned_squad VARCHAR(255) NOT NULL,
    primary_model VARCHAR(255) NOT NULL,
    model_provider VARCHAR(64) NOT NULL,
    monthly_budget_usd NUMERIC(12, 2) NOT NULL,
    current_spend_usd NUMERIC(12, 2) NOT NULL,
    prompt_tokens BIGINT NOT NULL DEFAULT 0,
    completion_tokens BIGINT NOT NULL DEFAULT 0,
    total_tokens BIGINT NOT NULL DEFAULT 0,
    total_requests BIGINT NOT NULL DEFAULT 0,
    avg_latency_ms INT NOT NULL DEFAULT 0,
    token_quota_monthly BIGINT NOT NULL,
    rate_limit_rpm INT NOT NULL,
    status VARCHAR(32) NOT NULL, -- WITHIN_LIMIT, APPROACHING_LIMIT, LIMIT_EXCEEDED, THROTTLED, FALLBACK_ACTIVE
    enforcement_mode VARCHAR(32) NOT NULL, -- RUNTIME_ENFORCED, MONITORING_ONLY, HYBRID
    governing_policy_id VARCHAR(64) NOT NULL,
    governing_policy_name VARCHAR(255) NOT NULL,
    control_id VARCHAR(32) NOT NULL REFERENCES cg_ag_controls(control_id),
    control_name VARCHAR(255) NOT NULL,
    linked_incident_id VARCHAR(64),
    cost_per_thousand_tokens NUMERIC(8, 4) NOT NULL,
    anomaly_observed TEXT,
    version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (tenant_id, workspace_id, entity_id),
    FOREIGN KEY (tenant_id, workspace_id) REFERENCES workspaces(tenant_id, workspace_id) ON DELETE RESTRICT
);

-- 9. ASSURE: PROTECTED EVIDENCE CATALOG
CREATE TABLE IF NOT EXISTS protected_evidence (
    evidence_id VARCHAR(64) NOT NULL,
    tenant_id VARCHAR(64) NOT NULL,
    workspace_id VARCHAR(64) NOT NULL,
    title VARCHAR(255) NOT NULL,
    evidence_type VARCHAR(64) NOT NULL,
    source_entity VARCHAR(255) NOT NULL,
    source_entity_type VARCHAR(32) NOT NULL,
    source_module VARCHAR(32) NOT NULL, -- DISCOVER, GOVERN, OPERATE, ASSURE
    control_id VARCHAR(32) NOT NULL REFERENCES cg_ag_controls(control_id),
    control_name VARCHAR(255) NOT NULL,
    related_policy_id VARCHAR(64),
    related_risk_id VARCHAR(64),
    related_finding_id VARCHAR(64),
    related_decision_id VARCHAR(64),
    related_action_id VARCHAR(64),
    related_incident_id VARCHAR(64),
    generated_at TIMESTAMPTZ NOT NULL,
    status VARCHAR(32) NOT NULL, -- VERIFIED_AUTHENTIC, PENDING_ATTESTATION, SEALED_IN_LEDGER
    integrity_digest VARCHAR(71) NOT NULL, -- SHA256:<hex>
    canonicalization_status VARCHAR(64) NOT NULL DEFAULT 'CANONICAL_JSON_RFC8785',
    retention_policy JSONB NOT NULL DEFAULT '{"configuredDays": 365, "status": "ACTIVE", "custodian": "CISO"}'::jsonb,
    audit_ledger_ref VARCHAR(64),
    payload_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (tenant_id, workspace_id, evidence_id),
    FOREIGN KEY (tenant_id, workspace_id) REFERENCES workspaces(tenant_id, workspace_id) ON DELETE RESTRICT
);

-- 10. ASSURE: AUDIT LEDGER BLOCKS (CHAINED SHA-256)
CREATE TABLE IF NOT EXISTS audit_ledger_blocks (
    block_id VARCHAR(64) NOT NULL,
    tenant_id VARCHAR(64) NOT NULL,
    workspace_id VARCHAR(64) NOT NULL,
    block_height INT NOT NULL,
    block_timestamp TIMESTAMPTZ NOT NULL,
    previous_hash VARCHAR(64) NOT NULL,
    payload_hash VARCHAR(71) NOT NULL,
    block_hash VARCHAR(64) NOT NULL,
    actor VARCHAR(255) NOT NULL,
    actor_role VARCHAR(255) NOT NULL,
    event_type VARCHAR(64) NOT NULL,
    source_module VARCHAR(32) NOT NULL,
    evidence_ref VARCHAR(64),
    control_id VARCHAR(32) REFERENCES cg_ag_controls(control_id),
    payload_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_tampered BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (tenant_id, workspace_id, block_id),
    UNIQUE (tenant_id, workspace_id, block_height),
    UNIQUE (tenant_id, workspace_id, block_hash),
    FOREIGN KEY (tenant_id, workspace_id) REFERENCES workspaces(tenant_id, workspace_id) ON DELETE RESTRICT
);

-- 11. ASSURE: REGULATORY DOSSIERS & EXPORT PACKAGES
CREATE TABLE IF NOT EXISTS regulatory_dossiers (
    dossier_id VARCHAR(64) NOT NULL,
    tenant_id VARCHAR(64) NOT NULL,
    workspace_id VARCHAR(64) NOT NULL,
    title VARCHAR(255) NOT NULL,
    framework VARCHAR(64) NOT NULL,
    framework_standard VARCHAR(255) NOT NULL,
    target_scope VARCHAR(255) NOT NULL,
    target_entity_id VARCHAR(64) NOT NULL,
    version VARCHAR(32) NOT NULL DEFAULT '1.0',
    generated_at TIMESTAMPTZ NOT NULL,
    custodian VARCHAR(255) NOT NULL,
    status VARCHAR(32) NOT NULL, -- DRAFT, GENERATED, INTEGRITY_VERIFIED, EXPORTED
    package_hash VARCHAR(71) NOT NULL,
    evidence_refs TEXT[] NOT NULL DEFAULT '{}',
    ledger_block_refs TEXT[] NOT NULL DEFAULT '{}',
    controls_covered TEXT[] NOT NULL DEFAULT '{}',
    executive_summary TEXT NOT NULL,
    sections JSONB NOT NULL DEFAULT '[]'::jsonb,
    dossier_version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (tenant_id, workspace_id, dossier_id),
    FOREIGN KEY (tenant_id, workspace_id) REFERENCES workspaces(tenant_id, workspace_id) ON DELETE RESTRICT
);

-- 12. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_findings_status ON operational_findings (tenant_id, workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_hitl_status ON hitl_approval_gates (tenant_id, workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_remediations_status ON remediation_actions (tenant_id, workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON ai_incidents (tenant_id, workspace_id, containment_status);
CREATE INDEX IF NOT EXISTS idx_evidence_control ON protected_evidence (tenant_id, workspace_id, control_id);
CREATE INDEX IF NOT EXISTS idx_ledger_height ON audit_ledger_blocks (tenant_id, workspace_id, block_height);
CREATE INDEX IF NOT EXISTS idx_dossiers_framework ON regulatory_dossiers (tenant_id, workspace_id, framework);
