/**
 * REST Router for Guardian Runtime Enforcement Engine
 * 
 * Endpoints:
 * - POST /api/v1/guardian/evaluate: Synchronous sub-10ms evaluation of agent tool calls.
 * - GET  /api/v1/guardian/health: Lightweight health and operational readiness status.
 */

import { Router, Request, Response } from 'express';
import { GuardianService, GuardianEvaluationInput } from '../../core/guardian-service';

export const guardianRouter = Router();

// GET /api/v1/guardian/health
guardianRouter.get('/health', (req: Request, res: Response) => {
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

    if (!input || !input.agent || !input.toolCall) {
      return res.status(400).json({
        ok: false,
        error: {
          code: 'INVALID_GUARDIAN_REQUEST',
          message: 'Missing required parameters: agent and toolCall must be provided.'
        }
      });
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
