-- ============================================================================
-- COMPLYPRO.PT — DATABASE MIGRATION
-- Migration: 002_durable_runtime_and_rls.sql
-- Description: Durable persistence tables for Governed Agents, Passports,
--              Runtime Instances, Execution Sessions, HITL Gates, and
--              database-enforced Row Level Security (RLS) with tenant claims.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. AGENTS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS agents (
    agent_id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL,
    name VARCHAR(255) NOT NULL,
    framework_name VARCHAR(64) NOT NULL,
    framework_version VARCHAR(32) NOT NULL,
    compliance_profile VARCHAR(128) NOT NULL,
    capabilities JSONB NOT NULL DEFAULT '[]'::jsonb,
    budget JSONB NOT NULL DEFAULT '{"maxCostPerRunEur": 10.0}'::jsonb,
    status VARCHAR(32) NOT NULL DEFAULT 'PROVISIONED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agents_tenant ON agents (tenant_id);
CREATE INDEX IF NOT EXISTS idx_agents_profile ON agents (compliance_profile);

-- ----------------------------------------------------------------------------
-- 2. AGENT PASSPORTS (Cryptographic operational contract)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS agent_passports (
    passport_id VARCHAR(64) PRIMARY KEY,
    agent_id VARCHAR(64) NOT NULL REFERENCES agents(agent_id) ON DELETE CASCADE,
    tenant_id VARCHAR(64) NOT NULL,
    passport_fingerprint VARCHAR(128) NOT NULL,
    compliance_profile_checksum VARCHAR(128) NOT NULL,
    tool_manifest_hash VARCHAR(128) NOT NULL,
    declared_tools JSONB NOT NULL DEFAULT '[]'::jsonb,
    governed_capabilities JSONB NOT NULL DEFAULT '[]'::jsonb,
    runtime_spec JSONB NOT NULL DEFAULT '{}'::jsonb,
    risk_tier VARCHAR(32) NOT NULL DEFAULT 'MEDIUM',
    status VARCHAR(32) NOT NULL DEFAULT 'GOVERNED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_passports_tenant ON agent_passports (tenant_id);
CREATE INDEX IF NOT EXISTS idx_passports_agent ON agent_passports (agent_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_passports_fingerprint ON agent_passports (passport_fingerprint);

-- ----------------------------------------------------------------------------
-- 3. RUNTIME INSTANCES (Isolated Worker lifecycle)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS runtime_instances (
    runtime_id VARCHAR(64) PRIMARY KEY,
    agent_id VARCHAR(64) NOT NULL REFERENCES agents(agent_id) ON DELETE CASCADE,
    tenant_id VARCHAR(64) NOT NULL,
    passport_id VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'PROVISIONED', -- PROVISIONED, STARTING, RUNNING, STOPPED, FAILED, REVOKED
    isolation JSONB NOT NULL DEFAULT '{"network": "DENY", "secrets": "DENY", "filesystem": "RESTRICTED"}'::jsonb,
    resources JSONB NOT NULL DEFAULT '{"cpu": 1, "memoryMb": 512, "maxExecutionSeconds": 300}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    stopped_at TIMESTAMPTZ,
    error TEXT
);

CREATE INDEX IF NOT EXISTS idx_runtime_tenant ON runtime_instances (tenant_id);
CREATE INDEX IF NOT EXISTS idx_runtime_status ON runtime_instances (tenant_id, status);

-- ----------------------------------------------------------------------------
-- 4. EXECUTION SESSIONS (Framework-agnostic task lifecycle)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS execution_sessions (
    execution_id VARCHAR(64) PRIMARY KEY,
    agent_id VARCHAR(64) NOT NULL REFERENCES agents(agent_id) ON DELETE CASCADE,
    runtime_id VARCHAR(64) NOT NULL REFERENCES runtime_instances(runtime_id) ON DELETE CASCADE,
    tenant_id VARCHAR(64) NOT NULL,
    passport_id VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'CREATED', -- CREATED, RUNNING, PAUSED, COMPLETED, BLOCKED, FAILED
    tool_execution_count INT NOT NULL DEFAULT 0,
    gate_id VARCHAR(64),
    pending_capability VARCHAR(128),
    pending_context JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exec_tenant ON execution_sessions (tenant_id);
CREATE INDEX IF NOT EXISTS idx_exec_runtime ON execution_sessions (runtime_id);
CREATE INDEX IF NOT EXISTS idx_exec_status ON execution_sessions (tenant_id, status);

-- ----------------------------------------------------------------------------
-- 5. HITL REQUESTS (Human-in-the-Loop pending approval gates)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hitl_requests (
    hitl_request_id VARCHAR(64) PRIMARY KEY,
    gate_id VARCHAR(64) NOT NULL UNIQUE,
    execution_id VARCHAR(64) NOT NULL REFERENCES execution_sessions(execution_id) ON DELETE CASCADE,
    tenant_id VARCHAR(64) NOT NULL,
    agent_id VARCHAR(64) NOT NULL,
    capability VARCHAR(128) NOT NULL,
    action_type VARCHAR(32) NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hitl_req_tenant ON hitl_requests (tenant_id);
CREATE INDEX IF NOT EXISTS idx_hitl_req_gate ON hitl_requests (gate_id);
CREATE INDEX IF NOT EXISTS idx_hitl_req_status ON hitl_requests (tenant_id, status);

-- ----------------------------------------------------------------------------
-- 6. HITL DECISIONS (Human Supervisor audit attestation)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hitl_decisions (
    decision_id VARCHAR(64) PRIMARY KEY,
    gate_id VARCHAR(64) NOT NULL REFERENCES hitl_requests(gate_id) ON DELETE CASCADE,
    execution_id VARCHAR(64) NOT NULL REFERENCES execution_sessions(execution_id) ON DELETE CASCADE,
    tenant_id VARCHAR(64) NOT NULL,
    decided_by VARCHAR(128) NOT NULL,
    decision VARCHAR(32) NOT NULL, -- APPROVED, REJECTED
    notes TEXT,
    decided_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hitl_dec_tenant ON hitl_decisions (tenant_id);
CREATE INDEX IF NOT EXISTS idx_hitl_dec_gate ON hitl_decisions (gate_id);

-- ============================================================================
-- 7. DATABASE-ENFORCED ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS across all tables
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_passports ENABLE ROW LEVEL SECURITY;
ALTER TABLE runtime_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE execution_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE hitl_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE hitl_decisions ENABLE ROW LEVEL SECURITY;

-- Force RLS even for table owners (prevents accidental bypass)
ALTER TABLE agents FORCE ROW LEVEL SECURITY;
ALTER TABLE agent_passports FORCE ROW LEVEL SECURITY;
ALTER TABLE runtime_instances FORCE ROW LEVEL SECURITY;
ALTER TABLE execution_sessions FORCE ROW LEVEL SECURITY;
ALTER TABLE hitl_requests FORCE ROW LEVEL SECURITY;
ALTER TABLE hitl_decisions FORCE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 8. TENANT ISOLATION POLICIES (Supporting PostgreSQL Session & PostgREST JWT)
-- ----------------------------------------------------------------------------

-- Policy for agents
DROP POLICY IF EXISTS tenant_isolation_agents ON agents;
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

-- Policy for agent_passports
DROP POLICY IF EXISTS tenant_isolation_passports ON agent_passports;
CREATE POLICY tenant_isolation_passports ON agent_passports
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

-- Policy for runtime_instances
DROP POLICY IF EXISTS tenant_isolation_runtimes ON runtime_instances;
CREATE POLICY tenant_isolation_runtimes ON runtime_instances
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

-- Policy for execution_sessions
DROP POLICY IF EXISTS tenant_isolation_executions ON execution_sessions;
CREATE POLICY tenant_isolation_executions ON execution_sessions
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

-- Policy for hitl_requests
DROP POLICY IF EXISTS tenant_isolation_hitl_requests ON hitl_requests;
CREATE POLICY tenant_isolation_hitl_requests ON hitl_requests
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

-- Policy for hitl_decisions
DROP POLICY IF EXISTS tenant_isolation_hitl_decisions ON hitl_decisions;
CREATE POLICY tenant_isolation_hitl_decisions ON hitl_decisions
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
