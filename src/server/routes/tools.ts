/**
 * ComplyPRO.pt — Sprint 7-B: Tool Gateway REST Router
 * 
 * Endpoints:
 * - POST /api/v1/tools/invoke: Governed Tool invocation through ComplyPRO Tool Gateway (Developer only, Rate-limited).
 * - GET  /api/v1/tools/catalog: Read-only projection of registered governed tool capabilities.
 */

import { Router, Request, Response } from 'express';
import { ToolGateway, ToolInvocationContext } from '../../core/tool-gateway';
import { CapabilityRegistry } from '../../core/capability-registry';
import { requireRoles, defaultRateLimiter } from '../security/auth-middleware';

export const toolRouter = Router();

/**
 * POST /api/v1/tools/invoke
 * Dispatches a governed tool execution through Guardian and Tool Gateway.
 */
toolRouter.post('/invoke', requireRoles('developer'), defaultRateLimiter.middleware(), async (req: Request, res: Response) => {
  try {
    const context: ToolInvocationContext = req.body;

    if (!context.agentId || !context.capability || !context.passport || !context.action) {
      return res.status(400).json({
        ok: false,
        error: 'INVALID_REQUEST: agentId, capability, action, and passport are required'
      });
    }

    // Cross-tenant passport check
    const callerTenant = req.tenantId || req.principal?.tenantId;
    const passportTenant = (context.passport as any).tenantId;
    if (callerTenant && passportTenant && passportTenant !== callerTenant) {
      return res.status(403).json({
        ok: false,
        error: 'CROSS_TENANT_ACCESS_DENIED: Cannot invoke tool with passport belonging to another tenant'
      });
    }

    const response = await ToolGateway.invokeTool(context);

    if (response.status === 'BLOCKED') {
      return res.status(403).json({
        ok: false,
        status: 'BLOCKED',
        verdict: response.verdict,
        reason: response.error,
        executionId: response.executionId,
        decisionLatencyMs: response.decisionLatencyMs
      });
    }

    if (response.status === 'PAUSED') {
      return res.status(202).json({
        ok: true,
        status: 'PAUSED',
        verdict: response.verdict,
        gateId: response.gateId,
        executionId: response.executionId,
        decisionLatencyMs: response.decisionLatencyMs
      });
    }

    return res.status(200).json({
      ok: true,
      ...response
    });
  } catch (err: any) {
    return res.status(500).json({
      ok: false,
      error: err.message || 'Internal Tool Gateway execution failure'
    });
  }
});

/**
 * GET /api/v1/tools/catalog
 * Returns list of all registered governed tools.
 */
toolRouter.get('/catalog', requireRoles('developer', 'compliance_officer', 'auditor'), (_req: Request, res: Response) => {
  const tools = CapabilityRegistry.getAll()
    .filter(c => c.channel === 'TOOL')
    .map(c => ({
      id: c.id,
      name: c.name,
      description: c.description,
      riskLevel: c.riskLevel,
      allowedActions: c.allowedActions,
      provider: c.provider,
      hitlRequired: c.hitl?.required || false,
      budget: c.budget
    }));

  res.status(200).json({
    total: tools.length,
    tools
  });
});
