/**
 * REST Router for Guardian Runtime Enforcement Engine
 * 
 * Endpoints:
 * - POST /api/v1/guardian/evaluate: Synchronous evaluation of agent tool calls.
 * - GET  /api/v1/guardian/health: Lightweight health and operational readiness status (Intentionally Public).
 */

import { Router, Request, Response } from 'express';
import { GuardianService, GuardianEvaluationInput } from '../../core/guardian-service';
import { ComplianceProfileRegistry } from '../../core/compliance-compiler';

export const guardianRouter = Router();

// GET /api/v1/guardian/health (Public health check)
guardianRouter.get('/health', (_req: Request, res: Response) => {
  return res.status(200).json({
    status: 'operational',
    service: 'CodeGuard Guardian Runtime Enforcement Engine',
    version: '3.1.0',
    mode: 'protocol-agnostic',
    timestamp: new Date().toISOString()
  });
});

// POST /api/v1/guardian/evaluate
guardianRouter.post('/evaluate', (req: Request, res: Response) => {
  try {
    const input: GuardianEvaluationInput = req.body;

    if (!input || !input.agent || !input.toolCall || !input.passport) {
      return res.status(400).json({
        ok: false,
        error: {
          code: 'INVALID_GUARDIAN_REQUEST',
          message: 'Missing required parameters: agent, passport and toolCall must be provided.'
        }
      });
    }

    const callerTenant = req.principal?.tenantId;
    // Application authentication lives in app.ts. Preserve the standalone,
    // non-production policy evaluator contract while sealing authenticated RPCs.
    if (!callerTenant && process.env.NODE_ENV === 'production') {
      return res.status(401).json({ ok: false, error: 'UNAUTHORIZED' });
    }
    if (callerTenant) {
      if ((input.passport.tenantId && input.passport.tenantId !== callerTenant) ||
          (input.context?.tenantId && input.context.tenantId !== callerTenant)) {
        return res.status(403).json({ ok: false, error: 'CROSS_TENANT_ACCESS_DENIED' });
      }
      const profile = ComplianceProfileRegistry.getAllProfiles().find(
        p => p.checksum === input.passport.complianceProfileChecksum
      );
      if (!profile) return res.status(400).json({ ok: false, error: 'UNKNOWN_COMPLIANCE_PROFILE' });
      input.complianceProfile = profile;
      input.context = { ...input.context, tenantId: callerTenant, callerId: req.principal!.userId };
    }

    const response = GuardianService.evaluate(input);
    return res.status(200).json(response);
  } catch (error: any) {
    return res.status(500).json({
      ok: false,
      error: {
        code: 'GUARDIAN_INTERNAL_ERROR',
        message: error.message || 'An unexpected error occurred during Guardian evaluation.'
      }
    });
  }
});
