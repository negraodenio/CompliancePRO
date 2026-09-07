import { describe, it, expect, beforeAll } from 'vitest';

/**
 * COMPLYPRO — Production Backend & Service Verification (Vitest)
 * 
 * Safety & Security Rules:
 * - Requires COMPLYPRO_E2E_TARGET=production.
 * - Requires COMPLYPRO_E2E_EMAIL and COMPLYPRO_E2E_PASSWORD for authenticated test.
 * - Zero hardcoded credentials or secrets.
 * - All tests execute against real production endpoints in read-only / non-destructive mode.
 */

describe('ComplyPRO — Production Backend & Service Verification (Vitest)', () => {
  const target = process.env.COMPLYPRO_E2E_TARGET;
  const email = process.env.COMPLYPRO_E2E_EMAIL;
  const password = process.env.COMPLYPRO_E2E_PASSWORD;

  beforeAll(() => {
    if (target !== 'production') {
      throw new Error(
        "PRODUCTION SAFETY GATE: Vitest execution blocked. " +
        "You must explicitly set COMPLYPRO_E2E_TARGET=production to run tests against live production endpoints. " +
        "Silent fallback to production is strictly forbidden."
      );
    }
  });

  it('FASE 2: Production Vercel Domain resolves with 200 OK', async () => {
    const res = await fetch('https://www.complypro.pt/');
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('ComplyPRO');
    expect(html).not.toContain('localhost');
  }, 30000);

  it('FASE 3: FastAPI Health responds operational 200 OK', async () => {
    const res = await fetch('https://compliancepro-h6xb.onrender.com/health');
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.status).toBe('ok');
    expect(json.version).toBe('1.1.0');
    expect(json.engine).toContain('CG-AG Multi-Tenant SaaS');
  }, 30000);

  it('FASE 4: FastAPI OpenAPI specification exposes all key routes', async () => {
    const res = await fetch('https://compliancepro-h6xb.onrender.com/openapi.json');
    expect(res.status).toBe(200);
    const spec = await res.json();
    expect(spec.paths['/api/v1/auth/login']).toBeDefined();
    expect(spec.paths['/api/v1/auth/signup']).toBeDefined();
    expect(spec.paths['/api/v1/auth/me']).toBeDefined();
    expect(spec.paths['/api/v1/scans/run']).toBeDefined();
    expect(spec.paths['/api/v1/scans']).toBeDefined();
    expect(spec.paths['/api/v1/scans/{scan_id}']).toBeDefined();
  }, 30000);

  it('FASE 5: Universal Remote MCP Health responds operational', async () => {
    const res = await fetch('https://compliancepro-mcp.onrender.com/mcp/health');
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.status).toBe('operational');
    expect(json.server).toBe('complypro-universal-mcp');
    expect(json.toolsCount).toBe(14);
    expect(json.resourcesCount).toBe(7);
    expect(json.promptsCount).toBe(4);
  }, 30000);

  it('FASE 6: MCP Streamable HTTP Protocol Handshake', async () => {
    const res = await fetch('https://compliancepro-mcp.onrender.com/mcp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
        'Authorization': 'Bearer unauthenticated-handshake-probe'
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'vitest-runner', version: '1.0.0' }
        }
      })
    });
    expect(res.status).toBe(200);
    const reader = res.body?.getReader();
    const { value } = await reader!.read();
    await reader?.cancel();
    const text = new TextDecoder().decode(value);
    expect(text).toContain('complypro-universal-mcp');
  }, 30000);

  it('FASE 7: Super Admin Production Authentication via API', async () => {
    if (!email || !password) {
      throw new Error(
        "CREDENTIAL SECURITY GATE: Missing environment variables. " +
        "COMPLYPRO_E2E_EMAIL and COMPLYPRO_E2E_PASSWORD must be provided via the environment."
      );
    }

    const res = await fetch('https://compliancepro-h6xb.onrender.com/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    expect(res.status).toBe(200);
    const authData = await res.json();
    expect(authData.email).toBe(email);
    expect(authData.enterprise_role).toBe('CISO');
    expect(authData.admin_role).toBe('owner');
    expect(authData.plan_tier).toBe('enterprise');
    expect(authData.organization_name).toBe('CompliancePRO Master HQ (Full Access)');
    expect(typeof authData.access_token).toBe('string');
  }, 30000);
});
