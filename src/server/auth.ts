import { Request, Response, NextFunction } from 'express';
import { SecurityGuard } from '../core/security';

/**
 * Lightweight Authenticator for REST API & SSE
 * Supports unauthenticated local mode (development only) or API Key / Bearer token enforcement.
 * Enforces fail-closed in production mode (SEC-P3-01).
 */
export function requireApiKey(req: Request, res: Response, next: NextFunction) {
  const isProd = process.env.NODE_ENV === 'production';
  const configuredKeys = process.env.CODEGUARD_API_KEYS;

  // In production, requireApiKey fails closed if CODEGUARD_API_KEYS is missing or empty
  if (isProd && (!configuredKeys || configuredKeys.trim() === '')) {
    return res.status(500).json({
      ok: false,
      error: 'SERVER_CONFIGURATION_ERROR',
      message: 'Authentication enforcement failure: CODEGUARD_API_KEYS is required in production.'
    });
  }

  // In development / test mode, if no keys configured, allow local open mode
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
