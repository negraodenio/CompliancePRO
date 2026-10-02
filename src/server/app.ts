import express from 'express';
import cors from 'cors';
import { requireApiKey } from './auth';
import { scanRouter } from './routes/scan';
import { standardRouter } from './routes/standard';
import { reportRouter } from './routes/report';
import { graphRouter } from './routes/graph';
import { patchRouter } from './routes/patch';
import { webhookRouter } from './routes/webhook';
import { agenticRouter } from './routes/agentic';
import { aiRouter } from './routes/ai';
import { IdentityProvider } from './security/identity-provider';
import { createMcpHttpRouter } from '../mcp/server';
import { guardianRouter } from './routes/guardian';
import { agentProvisioningRouter } from './routes/agent-provisioning';
import { runtimeRouter } from './routes/runtime';
import { executionRouter } from './routes/execution';
import { metadataRouter } from './routes/metadata';
import { modelRouter } from './routes/models';
import { toolRouter } from './routes/tools';
import { dataRouter } from './routes/data';
import {
  authenticateTokenOrKey,
  enforceTenantContext,
  applySecurityHeaders,
  requireRoles,
  defaultRateLimiter
} from './security/auth-middleware';

export function createServerApp() {
  const app = express();

  // SEC-P8-01: Apply Standard Security Headers
  app.use(applySecurityHeaders);

  // SEC-P2-01: Configurable CORS policy (disallows wildcard * in production)
  const isProd = process.env.NODE_ENV === 'production';
  const defaultAllowed = isProd
    ? ['https://standalone-compliance-scanner.vercel.app', 'https://complypro.ai']
    : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001', 'http://127.0.0.1:5173'];

  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : defaultAllowed;

  app.use(cors({
    origin: (origin, callback) => {
      // Allow non-browser calls (like curl, stdio, server-to-server) with no origin header
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || (!isProd && origin.startsWith('http://localhost:'))) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key', 'x-session-id', 'x-tenant-id', 'idempotency-key']
  }));

  app.use(express.json({ limit: '50mb' }));

  // Health check endpoint (Public Liveness)
  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'operational',
      engine: 'ComplyPRO Governance Engine v1.1.0',
      mode: 'lightweight-standalone',
      airGapped: true,
      principle: 'Every Agent Action Must Be Governable and Evidenced.',
      timestamp: new Date().toISOString()
    });
  });

  // Readiness check endpoint (Public Readiness for Container Orchestrators)
  app.get('/ready', (req, res) => {
    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString(),
      services: {
        guardian: 'ready',
        gateways: 'ready',
        persistence: 'ready'
      }
    });
  });

  // SEC-P2-02: Server-side session revocation endpoint
  app.post('/api/v1/auth/logout', (req, res) => {
    const authHeader = req.headers.authorization || (req.headers['x-api-key'] as string);
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
    if (token) {
      IdentityProvider.revokeSession(token);
    }
    return res.status(200).json({ ok: true, message: 'Sessão revogada com sucesso no servidor.' });
  });

  // Legacy scanner REST API Endpoints with API Key authentication
  app.use('/api/v1/scan', requireApiKey, scanRouter);
  app.use('/api/v1/standard', standardRouter);
  app.use('/api/v1/report', requireApiKey, reportRouter);
  app.use('/api/v1/graph', requireApiKey, graphRouter);
  app.use('/api/v1/patch', requireApiKey, patchRouter);
  app.use('/api/v1/webhook', webhookRouter);
  app.use('/api/v1/agentic', requireApiKey, agenticRouter);
  app.use('/api/v1/ai', requireApiKey, aiRouter);

  // Sprint 8-1: Governed Agent Operating System Protected Endpoints
  // All Execution, Agent, Runtime, and Gateway endpoints require authenticated identity & tenant scoping
  app.use('/api/v1/guardian/evaluate', authenticateTokenOrKey, enforceTenantContext, requireRoles('developer'), defaultRateLimiter.middleware());
  app.use('/api/v1/guardian', guardianRouter);
  app.use('/api/v1/agents', authenticateTokenOrKey, enforceTenantContext, agentProvisioningRouter);
  app.use('/api/v1/runtimes', authenticateTokenOrKey, enforceTenantContext, runtimeRouter);
  app.use('/api/v1/executions', authenticateTokenOrKey, enforceTenantContext, executionRouter);
  app.use('/api/v1/models', authenticateTokenOrKey, enforceTenantContext, modelRouter);
  app.use('/api/v1/tools', authenticateTokenOrKey, enforceTenantContext, toolRouter);
  app.use('/api/v1/data', authenticateTokenOrKey, enforceTenantContext, dataRouter);
  app.use('/api/v1', authenticateTokenOrKey, enforceTenantContext, metadataRouter);
  
  // Universal Remote MCP Endpoints (Streamable HTTP on /mcp, SSE on /sse, /mcp/health)
  app.use(createMcpHttpRouter());

  return app;
}

if (process.env.NODE_ENV !== 'test' && !process.env.VITEST && !process.env.TRANSPORT_MODE?.includes('stdio') && !process.argv.some(a => a.includes('test'))) {
  const app = createServerApp();
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.error(`[ComplyPRO API] Server listening on port ${PORT}`);
  });
}
