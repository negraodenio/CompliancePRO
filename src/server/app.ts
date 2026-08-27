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

export function createServerApp() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '50mb' }));

  // Health check endpoint
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

  // REST API Endpoints with optional authentication
  app.use('/api/v1/scan', requireApiKey, scanRouter);
  app.use('/api/v1/standard', standardRouter);
  app.use('/api/v1/report', requireApiKey, reportRouter);
  app.use('/api/v1/graph', requireApiKey, graphRouter);
  app.use('/api/v1/patch', requireApiKey, patchRouter);
  app.use('/api/v1/webhook', webhookRouter);
  app.use('/api/v1/agentic', requireApiKey, agenticRouter);

  return app;
}

if (process.env.NODE_ENV !== 'test' && !process.env.TRANSPORT_MODE?.includes('stdio')) {
  const app = createServerApp();
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.error(`[ComplyPRO API] Server listening on port ${PORT}`);
  });
}
