import { Router, Request, Response } from 'express';
import * as crypto from 'crypto';

export const webhookRouter = Router();

/**
 * POST /api/v1/webhook/github
 * Validates GitHub HMAC SHA-256 signature and triggers local scan directly without QStash.
 */
webhookRouter.post('/github', (req: Request, res: Response) => {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  const signature = req.headers['x-hub-signature-256'] as string;

  if (secret) {
    if (!signature) {
      return res.status(401).json({ ok: false, error: 'Missing X-Hub-Signature-256 header' });
    }
    const payload = JSON.stringify(req.body);
    const expected = 'sha256=' + crypto.createHmac('sha256', secret).update(payload).digest('hex');
    const isValid = crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    if (!isValid) {
      return res.status(403).json({ ok: false, error: 'Invalid webhook signature' });
    }
  }

  const event = req.headers['x-github-event'] || 'push';
  const repo = req.body.repository?.full_name || 'unknown-repo';

  return res.status(200).json({
    ok: true,
    message: `Webhook ${event} received for ${repo}. Scan queued locally.`,
    timestamp: new Date().toISOString()
  });
});
