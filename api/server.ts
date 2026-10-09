// Routing adapter for the existing Express server; Vercel does not supervise long-lived workers.
import type { Request, Response } from 'express';
type ServerRuntime = Pick<typeof import('../src/server/app'), 'createServerApp' | 'healthResponse' | 'readinessResponse'>;
let runtime: Promise<ServerRuntime> | undefined;
let application: ReturnType<ServerRuntime['createServerApp']> | undefined;
function loadRuntime(): Promise<ServerRuntime> {
  // Use the existing Vite SSR output, whose imports are valid native Node ESM.
  // Do not ask the deployed Node loader to resolve extensionless TypeScript sources.
  const entrypoint = '../dist-server/app.js';
  return runtime ||= import(entrypoint);
}
export default async function handler(req: Request, res: Response) {
  const original = new URL(req.url || '/', 'http://internal.invalid');
  const route = String(req.query?.route || original.pathname);
  original.searchParams.delete('route');
  if (route !== '/health' && route !== '/ready' &&
      !/^\/api\/v1\/(agents|runtimes|executions|models|tools|data|evidence|compliance-profiles|capabilities|guardian)(\/|$)/.test(route))
    return res.status(404).json({ok:false,error:'NOT_FOUND'});
  try {
    const server = await loadRuntime();
    if (route === '/health') return res.status(200).json(server.healthResponse());
    if (route === '/ready') {
      const ready = await server.readinessResponse();
      return res.status(ready.statusCode).json(ready.body);
    }
    application ||= server.createServerApp();
    req.url = route + original.search;
    // Vercel's Node.js runtime (VERCEL=1) always pre-parses the request body before the handler runs.
    // Accessing req.body in Vercel triggers their body parser which has a bug with JSON objects (D1).
    // In non-Vercel environments, Express handles body parsing via express.json() middleware.
    if (process.env.VERCEL) {
      try { void req.body; } catch {}
      (req as any)._body = true;
    } else if (req.body !== undefined) {
      (req as any)._body = true;
    }
    return application(req,res);
  } catch { return res.status(503).json({ok:false,error:'SERVER_CONFIGURATION_UNAVAILABLE'}); }
}
