/**
 * ComplyPRO.pt — REST Router for Active Governed Agent Provisioning
 * 
 * Endpoints:
 * - POST /api/v1/agents/provision: Active agent unit provisioning from definition (Developer role).
 * - GET  /api/v1/agents/:agentId: Retrieve provisioned agent passport and runtime spec (Owner tenant only).
 * - GET  /api/v1/agents: List all provisioned governed agents (Scoped to caller tenant).
 */

import { Router, Request, Response } from 'express';
import { AgentProvisioner, AgentDefinition } from '../../core/agent-provisioner';
import { RuntimeManager } from '../../core/runtime-manager';
import { requireRoles, defaultRateLimiter } from '../security/auth-middleware';

export const agentProvisioningRouter = Router();

// POST /api/v1/agents/provision - Developer only, Rate-limited
agentProvisioningRouter.post('/provision', requireRoles('developer'), defaultRateLimiter.middleware(), (req: Request, res: Response) => {
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

    // Instantiate runtime in RuntimeManager so it is immediately operational
    try {
      RuntimeManager.createRuntime(response.runtimeSpec, response.passport, tenantId);
    } catch {
      // Runtime might already exist on idempotent replay
    }

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

// GET /api/v1/agents/metrics - Scoped to caller tenant
agentProvisioningRouter.get('/metrics', requireRoles('developer', 'compliance_officer', 'auditor'), async (req: Request, res: Response) => {
  const callerTenant = req.tenantId || req.principal?.tenantId || 'TENANT-DEFAULT';
  const allAgents = AgentProvisioner.listAgents();
  const agents = allAgents.filter(a => (a.tenantId || a.passport?.tenantId || 'TENANT-DEFAULT') === callerTenant);

  const total = agents.length;
  const governed = agents.filter(a => a.status === 'PROVISIONED' || a.passport?.status === 'GOVERNED').length;
  const unknown = agents.filter(a => !a.passport || !a.passport.passportFingerprint).length;
  const needAttention = total - governed;
  const highRisk = agents.filter(a => a.passport?.riskTier === 'HIGH' || a.passport?.riskTier === 'CRITICAL').length;

  // Real blocked actions from EvidenceLedger for this tenant
  let blockedActions = 0;
  try {
    const { EvidenceLedger } = await import('../../core/evidence-ledger');
    const tenantEntries = EvidenceLedger.getEntries(undefined, callerTenant);
    blockedActions = tenantEntries.filter(e => 
      e.verdict === 'BLOCK' || 
      e.eventType === 'AGENT_EXECUTION_BLOCKED' || 
      e.eventType === 'TOOL_BLOCKED' ||
      e.eventType === 'MODEL_BLOCKED' ||
      e.eventType === 'DATA_BLOCKED' ||
      e.executionResult === 'BLOCKED'
    ).length;
  } catch {
    blockedActions = 0;
  }

  // Real pending HITL requests from DurableStore / memory for this tenant
  let hitlPending = 0;
  try {
    const { DurableStore } = await import('../db/durable-store');
    const executions = DurableStore.listExecutionSessions(callerTenant);
    hitlPending = executions.filter(e => e.status === 'PAUSED').length;
  } catch {
    hitlPending = 0;
  }

  return res.status(200).json({
    totalAgents: total,
    governedAgents: governed,
    needAttentionAgents: needAttention,
    unknownAgents: unknown,
    highRiskAgents: highRisk,
    blockedActions,
    hitlPending
  });
});

// GET /api/v1/agents - Scoped to caller tenant
agentProvisioningRouter.get('/', requireRoles('developer', 'compliance_officer', 'auditor'), (req: Request, res: Response) => {
  const callerTenant = req.tenantId || req.principal?.tenantId;
  const allAgents = AgentProvisioner.listAgents();
  const agents = callerTenant 
    ? allAgents.filter(a => (a.tenantId || a.passport?.tenantId || 'TENANT-DEFAULT') === callerTenant)
    : allAgents;

  return res.status(200).json({
    total: agents.length,
    agents
  });
});

// GET /api/v1/agents/:agentId - Scoped to owner tenant
agentProvisioningRouter.get('/:agentId', requireRoles('developer', 'compliance_officer', 'auditor'), (req: Request, res: Response) => {
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

  return res.status(200).json(agent);
});
