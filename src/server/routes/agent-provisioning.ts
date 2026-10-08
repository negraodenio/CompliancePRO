/**
 * ComplyPRO.pt — REST Router for Active Governed Agent Provisioning
 * 
 * Endpoints:
 * - POST /api/v1/agents/provision: Active agent unit provisioning from definition (Developer role).
 * - GET  /api/v1/agents/:agentId: Retrieve provisioned agent passport and runtime spec (Owner tenant only).
 * - GET  /api/v1/agents: List all provisioned governed agents (Scoped to caller tenant).
 */

import { Router, Request, Response, NextFunction } from 'express';
import { AgentProvisioner, AgentDefinition } from '../../core/agent-provisioner';
import { RuntimeManager } from '../../core/runtime-manager';
import { requireRoles, defaultRateLimiter } from '../security/auth-middleware';
import { DurableStore, StoredAgentRecord } from '../db/durable-store';
import { EvidenceLedger } from '../../core/evidence-ledger';
import { PassportSigner } from '../../core/passport-signer';
import { ComplianceProfileRegistry } from '../../core/compliance-compiler';

function importedProjection(row: StoredAgentRecord) {
  const discovery = row.metadata?.discovery || {};
  return { agentId: row.agent_id, tenantId: row.tenant_id, name: row.name,
    framework: { name: row.framework_name, version: row.framework_version }, status: row.status,
    createdAt: row.created_at, owner: discovery.owner, description: discovery.description,
    discovery, passport: null, passportId: null, passportVerified:false, guardianStatus: 'MONITOR_ONLY' };
}

function provisionedProjection(agent: ReturnType<typeof AgentProvisioner.provision>, row?: StoredAgentRecord) {
  const profile=ComplianceProfileRegistry.getAllProfiles().find(profile=>profile.checksum===agent.passport.complianceProfileChecksum);
  const passportVerified=Boolean(profile && PassportSigner.verify(agent.passport.passportFingerprint,
    PassportSigner.toSignInput(agent.passport,agent.agentId,profile.version)).valid);
  return {...agent,passportVerified,guardianStatus:passportVerified && agent.passport.status==='GOVERNED' ? agent.guardianStatus : 'MONITOR_ONLY',
    owner:row?.metadata?.discovery?.owner,description:row?.metadata?.discovery?.description,discovery:row?.metadata?.discovery};
}

function asyncRoute(handler: (req: Request, res: Response) => Promise<any>) {
  return (req: Request, res: Response, next: NextFunction) => { Promise.resolve(handler(req,res)).catch(next); };
}

async function tenantAgents(tenantId: string): Promise<any[]> {
  await DurableStore.hydrateTenantCache(tenantId);
  const rows = process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'test'
    ? DurableStore.listAgents(tenantId) : await DurableStore.listAgentRecordsAsync(tenantId);
  const agents: any[] = process.env.NODE_ENV === 'production' ? [] : [...AgentProvisioner.listAgents(tenantId)];
  for (const row of rows) {
    const provisioned = row.status === 'IMPORTED' ? undefined : AgentProvisioner.getAgent(row.agent_id, tenantId);
    const projection = provisioned ? provisionedProjection(provisioned,row) : importedProjection(row);
    const index = agents.findIndex(agent => agent.agentId === row.agent_id);
    if (index >= 0) agents[index] = projection;
    else agents.push(projection);
  }
  return agents;
}

export const agentProvisioningRouter = Router();

// POST /api/v1/agents/provision - Developer only, Rate-limited
agentProvisioningRouter.post('/provision', requireRoles('developer'), defaultRateLimiter.middleware(), async (req: Request, res: Response) => {
  try {
    const definition: AgentDefinition = req.body;
    const idempotencyKey = (req.headers['idempotency-key'] as string) || req.body?.idempotencyKey;
    const tenantId = req.tenantId || req.principal?.tenantId || (req.headers['x-tenant-id'] as string) || req.body?.tenantId;

    if (!definition || !definition.name || !definition.framework || !definition.complianceProfile) {
      return res.status(400).json({
        ok: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Missing required parameters: name, framework, and complianceProfile are required.'
        }
      });
    }

    const response = AgentProvisioner.provision(definition, { idempotencyKey, tenantId });
    if (process.env.NODE_ENV === 'production') await DurableStore.saveAgentAsync(response, tenantId!, idempotencyKey);

    // Instantiate runtime in RuntimeManager so it is immediately operational
    try {
      const runtime = RuntimeManager.getInstance(response.runtimeId,tenantId) ||
        RuntimeManager.createRuntime(response.runtimeSpec, response.passport, tenantId);
      if (process.env.NODE_ENV === 'production') await DurableStore.saveRuntimeAsync(runtime, tenantId!);
    } catch (error) {
      if (process.env.NODE_ENV === 'production') throw error;
      // Runtime might already exist on idempotent replay
    }

    await EvidenceLedger.flushPendingWrites(tenantId!);
    return res.status(201).json(response);
  } catch (error: any) {
    const msg = error.message || 'Internal provisioning error';
    const isClientError = 
      msg.startsWith('UNKNOWN_COMPLIANCE_PROFILE') ||
      msg.startsWith('UNKNOWN_CAPABILITY') ||
      msg.startsWith('CAPABILITY_NOT_ALLOWED') ||
      msg.startsWith('INVALID_BUDGET') ||
      msg.startsWith('INVALID_AGENT_DEFINITION') ||
      msg.startsWith('INVALID_CAPABILITIES');

    return res.status(isClientError ? 400 : 500).json({
      ok: false,
      error: {
        code: isClientError ? msg.split(':')[0] : 'PROVISIONING_INTERNAL_ERROR',
        message: msg
      }
    });
  }
});

agentProvisioningRouter.post('/import', requireRoles('developer'), defaultRateLimiter.middleware(), async (req, res) => {
  try {
    const tenant = req.principal!.tenantId;
    const record = await DurableStore.importAgentAsync(req.body, tenant, req.principal!.userId);
    return res.status(201).json(importedProjection(record));
  } catch (error: any) {
    return res.status(error.message === 'INVALID_IMPORT' ? 400 : 503).json({ ok: false, error: error.message });
  }
});

agentProvisioningRouter.patch('/:agentId',requireRoles('developer'),asyncRoute(async (req,res)=>{
  const tenant=req.principal!.tenantId;
  const record=await DurableStore.getAgentAsync(req.params.agentId,tenant);
  if(!record) return res.status(404).json({ok:false,error:'AGENT_NOT_FOUND'});
  if(req.body.status && req.body.status!==record.status) return res.status(409).json({ok:false,error:'PROVISIONING_REQUIRED_FOR_STATUS_CHANGE'});
  const metadata={...record.metadata,discovery:{...record.metadata?.discovery,...(req.body.owner ? {owner:req.body.owner} : {})}};
  if(process.env.NODE_ENV!=='test') await DurableStore.patchDatabase('agents',{agent_id:record.agent_id,tenant_id:tenant},{metadata});
  record.metadata=metadata;
  const provisioned=record.status==='IMPORTED' ? undefined : AgentProvisioner.getAgent(record.agent_id,tenant);
  return res.status(200).json(provisioned ? provisionedProjection(provisioned,record) : importedProjection(record));
}));

// GET /api/v1/agents/metrics - Scoped to caller tenant
agentProvisioningRouter.get('/metrics', requireRoles('developer', 'compliance_officer', 'auditor'), asyncRoute(async (req: Request, res: Response) => {
  const callerTenant = req.tenantId || req.principal?.tenantId || 'TENANT-DEFAULT';
  const agents = await tenantAgents(callerTenant);

  const total = agents.length;
  const governed = agents.filter(a => a.passport?.status === 'GOVERNED' && a.passportVerified).length;
  const unknown = agents.filter(a => !a.passport || !a.passport.passportFingerprint).length;
  const needAttention = total - governed;
  const highRisk = agents.filter(a => ['HIGH','CRITICAL'].includes(a.passport?.riskTier || a.discovery?.risk)).length;

  // Real blocked actions from EvidenceLedger for this tenant
  await EvidenceLedger.reloadTenant(callerTenant);
  const tenantEntries = EvidenceLedger.getEntries(undefined, callerTenant);
  const blockedActions = tenantEntries.filter(e =>
      e.verdict === 'BLOCK' || 
      e.eventType === 'AGENT_EXECUTION_BLOCKED' || 
      e.eventType === 'TOOL_BLOCKED' ||
      e.eventType === 'MODEL_BLOCKED' ||
      e.eventType === 'DATA_BLOCKED' ||
      e.executionResult === 'BLOCKED'
    ).length;

  // Real pending HITL requests from DurableStore / memory for this tenant
  const executions = DurableStore.listExecutionSessions(callerTenant);
  const hitlPending = executions.filter(e => e.status === 'PAUSED').length;

  return res.status(200).json({
    totalAgents: total,
    governedAgents: governed,
    needAttentionAgents: needAttention,
    unknownAgents: unknown,
    highRiskAgents: highRisk,
    blockedActions,
    hitlPending
  });
}));

// GET /api/v1/agents - Scoped to caller tenant
agentProvisioningRouter.get('/', requireRoles('developer', 'compliance_officer', 'auditor'), asyncRoute(async (req: Request, res: Response) => {
  const callerTenant = req.tenantId || req.principal?.tenantId;
  const combined = await tenantAgents(callerTenant!);
  return res.status(200).json({
    total: combined.length,
    agents: combined
  });
}));

// GET /api/v1/agents/:agentId - Scoped to owner tenant
agentProvisioningRouter.get('/:agentId', requireRoles('developer', 'compliance_officer', 'auditor'), asyncRoute(async (req: Request, res: Response) => {
  const tenant = req.principal!.tenantId;
  await DurableStore.hydrateTenantCache(tenant);
  const imported = DurableStore.getAgent(req.params.agentId,tenant);
  if (imported?.status === 'IMPORTED') return res.status(200).json(importedProjection(imported));
  const agent = AgentProvisioner.getAgent(req.params.agentId);
  if (!agent) {
    return res.status(404).json({
      ok: false,
      error: {
        code: 'AGENT_NOT_FOUND',
        message: `Agent "${req.params.agentId}" was not found.`
      }
    });
  }

  // Cross-tenant boundary check
  const callerTenant = req.tenantId || req.principal?.tenantId;
  const agentTenant = agent.tenantId || agent.passport?.tenantId;
  if (callerTenant && agentTenant && agentTenant !== callerTenant) {
    return res.status(403).json({
      ok: false,
      error: {
        code: 'CROSS_TENANT_ACCESS_DENIED',
        message: `Tenant [${callerTenant}] cannot access agent belonging to [${agentTenant}].`
      }
    });
  }

  return res.status(200).json(provisionedProjection(agent,imported || undefined));
}));
