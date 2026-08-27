import { Request, Response, NextFunction } from 'express';
import { SecurityGuard } from '../core/security';

/**
 * Lightweight Authenticator for REST API & SSE
 * Supports unauthenticated local mode (default) or API Key / Bearer token enforcement.
 */
export function requireApiKey(req: Request, res: Response, next: NextFunction) {
  const configuredKeys = process.env.CODEGUARD_API_KEYS;

  // If no keys configured, run in local open mode
  if (!configuredKeys || configuredKeys.trim() === '') {
    return next();
  }

  const allowed = configuredKeys.split(',').map(k => k.trim()).filter(Boolean);
  const authHeader = req.headers.authorization || (req.headers['x-api-key'] as string);

  if (!authHeader) {
    return res.status(401).json({
      ok: false,
      error: 'Unauthorized',
      message: 'API Key or Bearer token is required to access this endpoint.'
    });
  }

  const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;

  if (allowed.includes(token)) {
    (req as any).authFingerprint = SecurityGuard.fingerprint(token);
    return next();
  }

  return res.status(403).json({
    ok: false,
    error: 'Forbidden',
    message: 'Invalid API Key provided.'
  });
}
