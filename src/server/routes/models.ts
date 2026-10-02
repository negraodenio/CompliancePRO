/**
 * ComplyPRO.pt — Sprint 7-A: Model Gateway REST Router
 * 
 * Endpoints:
 * - POST /api/v1/models/invoke: Governed LLM invocation through ComplyPRO Model Gateway (Developer only, Rate-limited).
 * - GET  /api/v1/models/catalog: Read-only projection of supported providers and pricing tiers.
 */

import { Router, Request, Response } from 'express';
import { ModelGateway, ModelInvocationRequest } from '../../core/model-gateway';
import { requireRoles, defaultRateLimiter } from '../security/auth-middleware';

export const modelRouter = Router();

/**
 * POST /api/v1/models/invoke
 * Dispatches a governed model call through Guardian and Model Gateway.
 */
modelRouter.post('/invoke', requireRoles('developer'), defaultRateLimiter.middleware(), async (req: Request, res: Response) => {
  try {
    const requestData: ModelInvocationRequest = req.body;
    
    if (!requestData.agentId || !requestData.model || !requestData.passport) {
      return res.status(400).json({
        ok: false,
        error: 'INVALID_REQUEST: agentId, model, and passport are required'
      });
    }

    // Cross-tenant passport check
    const callerTenant = req.tenantId || req.principal?.tenantId;
    const passportTenant = (requestData.passport as any).tenantId;
    if (callerTenant && passportTenant && passportTenant !== callerTenant) {
      return res.status(403).json({
        ok: false,
        error: 'CROSS_TENANT_ACCESS_DENIED: Cannot invoke model with passport belonging to another tenant'
      });
    }

    const response = await ModelGateway.invokeModel(requestData);

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
      error: err.message || 'Internal Model Gateway execution failure'
    });
  }
});

/**
 * GET /api/v1/models/catalog
 * Returns list of supported providers and operational models.
 */
modelRouter.get('/catalog', requireRoles('developer', 'compliance_officer', 'auditor'), (_req: Request, res: Response) => {
  res.status(200).json({
    providers: [
      {
        provider: 'openai',
        status: 'ACTIVE',
        models: [
          { id: 'gpt-4o', tier: 'HIGH_INTELLIGENCE', estimatedCostPer1M: { promptEur: 2.50, completionEur: 10.00 } },
          { id: 'gpt-4o-mini', tier: 'FAST_EFFICIENT', estimatedCostPer1M: { promptEur: 0.15, completionEur: 0.60 } },
          { id: 'gpt-3.5-turbo', tier: 'LEGACY', estimatedCostPer1M: { promptEur: 0.50, completionEur: 1.50 } }
        ]
      },
      {
        provider: 'azure-openai',
        status: 'ACTIVE',
        models: [
          { id: 'gpt-4o', tier: 'ENTERPRISE_SECURE', estimatedCostPer1M: { promptEur: 2.50, completionEur: 10.00 } },
          { id: 'gpt-4o-mini', tier: 'ENTERPRISE_FAST', estimatedCostPer1M: { promptEur: 0.15, completionEur: 0.60 } }
        ]
      }
    ]
  });
});
