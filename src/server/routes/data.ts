/**
 * ComplyPRO.pt — Sprint 7-C: Data Gateway REST Router
 * 
 * Endpoints:
 * - POST /api/v1/data/query: Governed Data query through ComplyPRO Data Gateway (Developer only, Rate-limited).
 * - GET  /api/v1/data/catalog: Read-only projection of registered governed data capabilities.
 */

import { Router, Request, Response } from 'express';
import { DataGateway, DataInvocationContext } from '../../core/data-gateway';
import { CapabilityRegistry } from '../../core/capability-registry';
import { requireRoles, defaultRateLimiter } from '../security/auth-middleware';

export const dataRouter = Router();

/**
 * POST /api/v1/data/query
 * Dispatches a governed data access operation through Guardian and Data Gateway.
 */
dataRouter.post('/query', requireRoles('developer'), defaultRateLimiter.middleware(), async (req: Request, res: Response) => {
  try {
    const context: DataInvocationContext = req.body;

    if (!context.agentId || !context.capability || !context.passport || !context.action || !context.targetResource) {
      return res.status(400).json({
        ok: false,
        error: 'INVALID_REQUEST: agentId, capability, action, targetResource, and passport are required'
      });
    }

    // Cross-tenant passport check
    const callerTenant = req.tenantId || req.principal?.tenantId;
    const passportTenant = (context.passport as any).tenantId;
    if (callerTenant && passportTenant && passportTenant !== callerTenant) {
      return res.status(403).json({
        ok: false,
        error: 'CROSS_TENANT_ACCESS_DENIED: Cannot query data with passport belonging to another tenant'
      });
    }

    const response = await DataGateway.invokeData(context);

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

    if (response.status === 'FAILED') {
      return res.status(500).json({
        ok: false,
        status: response.status,
        verdict: response.verdict,
        error: response.error,
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
      error: `DATA_GATEWAY_INTERNAL_ERROR: ${err.message}`
    });
  }
});

/**
 * GET /api/v1/data/catalog
 * Returns list of registered DATA capabilities.
 */
dataRouter.get('/catalog', requireRoles('developer', 'compliance_officer', 'auditor'), (_req: Request, res: Response) => {
  try {
    const all = CapabilityRegistry.getAll();
    const dataCapabilities = all.filter(c => c.channel === 'DATA');

    return res.status(200).json({
      ok: true,
      count: dataCapabilities.length,
      capabilities: dataCapabilities
    });
  } catch (err: any) {
    return res.status(500).json({
      ok: false,
      error: err.message
    });
  }
});
