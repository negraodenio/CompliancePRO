-- Concrete remediation: runtime EvidenceLedger had no durable append path.
-- Uses the existing audit_ledger_blocks table; no second ledger/engine.
-- Apply after 001/002. This audit/remediation does not automatically apply SQL.
CREATE OR REPLACE FUNCTION append_runtime_evidence(p_tenant_id text, p_entry jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE head audit_ledger_blocks%ROWTYPE; prior jsonb;
BEGIN
  IF p_tenant_id IS NULL OR p_tenant_id = '' THEN RAISE EXCEPTION 'tenant required'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(p_tenant_id || ':WS-RUNTIME', 0));
  SELECT payload_data INTO prior FROM audit_ledger_blocks
    WHERE tenant_id = p_tenant_id AND workspace_id = 'WS-RUNTIME' AND block_id = p_entry->>'evidenceId';
  IF FOUND THEN
    IF prior <> p_entry THEN RAISE EXCEPTION 'evidence id collision'; END IF;
    RETURN;
  END IF;
  SELECT * INTO head FROM audit_ledger_blocks WHERE tenant_id = p_tenant_id AND workspace_id = 'WS-RUNTIME'
    ORDER BY block_height DESC LIMIT 1;
  IF (p_entry->>'sequence')::integer <> COALESCE(head.block_height, 0) + 1 OR
     p_entry->>'previousHash' <> COALESCE(head.block_hash, repeat('0',64)) OR
     p_entry->>'eventHash' !~ '^[a-f0-9]{64}$' THEN RAISE EXCEPTION 'evidence chain conflict'; END IF;
  INSERT INTO tenants(tenant_id,name) VALUES(p_tenant_id,p_tenant_id) ON CONFLICT DO NOTHING;
  INSERT INTO workspaces(tenant_id,workspace_id,name) VALUES(p_tenant_id,'WS-RUNTIME','Runtime evidence') ON CONFLICT DO NOTHING;
  INSERT INTO audit_ledger_blocks(block_id,tenant_id,workspace_id,block_height,block_timestamp,previous_hash,
    payload_hash,block_hash,actor,actor_role,event_type,source_module,evidence_ref,payload_data)
  VALUES(p_entry->>'evidenceId',p_tenant_id,'WS-RUNTIME',(p_entry->>'sequence')::integer,
    (p_entry->>'timestamp')::timestamptz,p_entry->>'previousHash',p_entry->>'eventHash',p_entry->>'eventHash',
    p_entry->>'agentId','RUNTIME',p_entry->>'eventType','OPERATE',p_entry->>'evidenceId',p_entry);
END $$;
REVOKE ALL ON FUNCTION append_runtime_evidence(text,jsonb) FROM PUBLIC;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='service_role') THEN
    GRANT EXECUTE ON FUNCTION append_runtime_evidence(text,jsonb) TO service_role;
  END IF;
END $$;
ALTER TABLE audit_ledger_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_ledger_blocks FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS runtime_evidence_read ON audit_ledger_blocks;
CREATE POLICY runtime_evidence_read ON audit_ledger_blocks FOR SELECT USING (
  tenant_id = NULLIF(current_setting('app.current_tenant_id',true),'') OR
  tenant_id = NULLIF(current_setting('request.jwt.claims',true),'')::jsonb->>'tenant_id' OR
  tenant_id = NULLIF(current_setting('request.jwt.claims',true),'')::jsonb->>'organization_id'
);
