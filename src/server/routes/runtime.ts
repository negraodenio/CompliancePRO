/**
 * ComplyPRO.pt — REST Router for Isolated Runtime Operations
 * 
 * Endpoints:
 * - POST /api/v1/runtimes/start: Starts an isolated worker runtime for an agent (Developer role, Rate-limited).
 * - POST /api/v1/runtimes/stop: Stops an active isolated worker (Developer role, Rate-limited).
 * - GET  /api/v1/runtimes/:runtimeId: Inspects runtime state (Owner tenant only).
 * - GET  /api/v1/runtimes: Lists all provisioned/running runtimes (Scoped to caller tenant).
 */

import { Router, Request, Response } from 'express';
import { RuntimeManager } from '../../core/runtime-manager';
import { requireRoles, defaultRateLimiter } from '../security/auth-middleware';

export const runtimeRouter = Router();

// POST /api/v1/runtimes/start - Developer only, Rate-limited
runtimeRouter.post('/start', requireRoles('developer'), defaultRateLimiter.middleware(), (req: Request, res: Response) => {
  try {
    const { runtimeId } = req.body;
    const tenantId = req.tenantId || req.principal?.tenantId || (req.headers['x-tenant-id'] as string) || req.body?.tenantId;

    if (!runtimeId) {
      return res.status(400).json({
        ok: false,
        error: { code: 'INVALID_REQUEST', message: 'runtimeId is required in request body.' }
      });
    }

    const instance = RuntimeManager.startRuntime(runtimeId, tenantId);
    return res.status(200).json({ ok: true, runtime: instance });
  } catch (error: any) {
    const msg = error.message || 'Failed to start runtime';
    const isCrossTenant = msg.startsWith('CROSS_TENANT_ACCESS_DENIED');
    const isClientError = msg.startsWith('RUNTIME_START_DENIED') || msg.startsWith('RUNTIME_NOT_FOUND');
    return res.status(isCrossTenant ? 403 : (isClientError ? 400 : 500)).json({
      ok: false,
      error: {
        code: isCrossTenant ? 'CROSS_TENANT_ACCESS_DENIED' : (isClientError ? msg.split(':')[0] : 'RUNTIME_ERROR'),
        message: msg
      }
    });
  }
});

// POST /api/v1/runtimes/stop - Developer only, Rate-limited
runtimeRouter.post('/stop', requireRoles('developer'), defaultRateLimiter.middleware(), (req: Request, res: Response) => {
  try {
    const { runtimeId } = req.body;
    const tenantId = req.tenantId || req.principal?.tenantId || (req.headers['x-tenant-id'] as string) || req.body?.tenantId;

    if (!runtimeId) {
      return res.status(400).json({
        ok: false,
        error: { code: 'INVALID_REQUEST', message: 'runtimeId is required in request body.' }
      });
    }

    const instance = RuntimeManager.stopRuntime(runtimeId, tenantId);
    return res.status(200).json({ ok: true, runtime: instance });
  } catch (error: any) {
    const msg = error.message || 'Failed to stop runtime';
    const isCrossTenant = msg.startsWith('CROSS_TENANT_ACCESS_DENIED');
    return res.status(isCrossTenant ? 403 : 500).json({
      ok: false,
      error: { code: isCrossTenant ? 'CROSS_TENANT_ACCESS_DENIED' : 'RUNTIME_ERROR', message: msg }
    });
  }
});

// GET /api/v1/runtimes/:runtimeId - Owner tenant only
runtimeRouter.get('/:runtimeId', requireRoles('developer', 'compliance_officer', 'auditor'), (req: Request, res: Response) => {
  const instance = RuntimeManager.getInstance(req.params.runtimeId);
  if (!instance) {
    return res.status(404).json({
      ok: false,
      error: { code: 'RUNTIME_NOT_FOUND', message: `Runtime "${req.params.runtimeId}" not found.` }
    });
  }

  // Cross-tenant boundary check
  const callerTenant = req.tenantId || req.principal?.tenantId;
  if (callerTenant && instance.tenantId && instance.tenantId !== callerTenant) {
    return res.status(403).json({
      ok: false,
      error: {
        code: 'CROSS_TENANT_ACCESS_DENIED',
        message: `Tenant [${callerTenant}] cannot access runtime belonging to [${instance.tenantId}].`
      }
    });
  }

  return res.status(200).json(instance);
});

// GET /api/v1/runtimes - Scoped to caller tenant
runtimeRouter.get('/', requireRoles('developer', 'compliance_officer', 'auditor'), (req: Request, res: Response) => {
  const callerTenant = req.tenantId || req.principal?.tenantId;
  const allRuntimes = RuntimeManager.listInstances();
  const runtimes = callerTenant
    ? allRuntimes.filter(r => (r.tenantId || 'TENANT-DEFAULT') === callerTenant)
    : allRuntimes;

  return res.status(200).json({
    total: runtimes.length,
    runtimes
  });
});
