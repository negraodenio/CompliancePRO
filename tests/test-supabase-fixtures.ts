import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { loadTestEnvironment, requireTestSaasSchema } from './test-supabase-environment.mjs';

// Runs before application imports in the affected suites. No production .env fallback.
export const testSupabase = loadTestEnvironment();

async function request(path: string, method = 'GET', body?: unknown, anon = false): Promise<any> {
  assert(path.startsWith('/rest/v1/') || path.startsWith('/auth/v1/admin/users') ||
    path === '/auth/v1/token?grant_type=password', 'Only fixture endpoints are permitted');
  const key = anon ? testSupabase.SUPABASE_ANON_KEY : testSupabase.SUPABASE_SERVICE_ROLE_KEY;
  const response = await fetch(`${testSupabase.SUPABASE_URL}${path}`, {
    method, headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json',
      Prefer: 'return=representation' },
    body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(30000)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(`TEST_FIXTURE_PERSISTENCE_FAILED: ${method} ${path.split('?')[0]} HTTP ${response.status} (${data?.code || 'unknown'})`);
  return data;
}

export async function readTestRows(table: string, filter: Record<string, string>, anon = false): Promise<any[]> {
  assert(/^[a-z_]+$/.test(table), 'Fixture table must be a plain identifier');
  const params = new URLSearchParams({ select: '*' });
  for (const [column, value] of Object.entries(filter)) {
    assert(/^[a-z_]+$/.test(column), 'Fixture column must be a plain identifier');
    params.set(column, `eq.${value}`);
  }
  const rows = await request(`/rest/v1/${table}?${params}`, 'GET', undefined, anon);
  assert(Array.isArray(rows), `Real ${table} query must return an array`);
  return rows;
}

async function findFixtureUser(email: string): Promise<any | undefined> {
  for (let page = 1; page <= 100; page++) {
    const data = await request(`/auth/v1/admin/users?page=${page}&per_page=200`);
    assert(Array.isArray(data.users), 'Supabase Auth must return a real user list');
    const user = data.users.find((entry: any) => entry.email?.toLowerCase() === email);
    if (user) return user;
    if (data.users.length < 200) return undefined;
  }
  throw new Error('TEST_FIXTURE_AUTH_LOOKUP_LIMIT');
}

export async function ensureSaasFixture(scenario: string): Promise<{
  organizationId: string; userId: string; entitlementId: string; slug: string; accessToken: string;
}> {
  assert(/^[a-z0-9-]+$/.test(scenario) && scenario.length <= 40, 'Scenario must be an explicit fixture namespace');
  await requireTestSaasSchema(testSupabase);
  const email = `complypro-${scenario}@example.com`;
  const displayName = `ComplyPRO ${scenario} Fixture`;
  const password = crypto.randomBytes(32).toString('base64url');
  let user = await findFixtureUser(email);
  const newlyCreated = !user;
  if (!user) {
    const created = await request('/auth/v1/admin/users', 'POST', {
      email, password, email_confirm: true,
      user_metadata: { full_name: displayName, complypro_test_fixture: scenario }
    });
    user = created.user || created;
  }
  assert(user?.id && user.user_metadata?.complypro_test_fixture === scenario,
    'Fixture may only reuse its own explicitly tagged Auth user');
  if (!newlyCreated) await request(`/auth/v1/admin/users/${user.id}`, 'PUT', { password, email_confirm: true });
  // Same slug rule as handle_new_user_signup; no arbitrary UUID / first-organization discovery.
  const slug = `${displayName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-${user.id.slice(0, 8)}`;
  let organizations = await readTestRows('organizations', { slug });
  if (newlyCreated) {
    assert.equal(organizations.length, 1, 'Existing onboarding trigger must create this fixture organization');
  } else if (organizations.length === 0) {
    organizations = await request('/rest/v1/organizations', 'POST', {
      name: `${displayName}'s Workspace`, slug, plan_tier: 'free'
    });
  }
  assert.equal(organizations.length, 1, 'Deterministic fixture slug must identify exactly one organization');
  const organizationId = organizations[0].id;
  let members = await readTestRows('organization_members', { organization_id: organizationId, user_id: user.id });
  if (members.length === 0 && !newlyCreated) {
    members = await request('/rest/v1/organization_members', 'POST', {
      organization_id: organizationId, user_id: user.id, role: 'owner'
    });
  }
  assert.equal(members.length, 1, 'Fixture Auth user must have a durable membership in its own organization');
  assert.equal(members[0].role, 'owner');
  let entitlements = await readTestRows('entitlements', { organization_id: organizationId });
  if (entitlements.length === 0 && !newlyCreated) {
    entitlements = await request('/rest/v1/entitlements', 'POST', {
      organization_id: organizationId, monthly_scan_quota: 5, used_scans_period: 0,
      has_cg_ag_deep_scan: true, has_ripd_export: true, has_api_access: true, is_active: true
    });
  }
  assert.equal(entitlements.length, 1, 'Fixture must have exactly one durable entitlement');
  assert.equal(entitlements[0].organization_id, organizationId);
  assert.equal(entitlements[0].is_active, true);
  const login = await request('/auth/v1/token?grant_type=password', 'POST', { email, password }, true);
  assert(login.access_token && login.user?.id === user.id, 'Fixture must have a normal authenticated user, not service_role authorization');
  return { organizationId, userId: user.id, entitlementId: entitlements[0].id, slug, accessToken: login.access_token };
}

export async function assertRuntimeParents(input: { agentId: string; passportId: string; runtimeId: string; tenantId: string }): Promise<void> {
  const [agents, passports, runtimes] = await Promise.all([
    readTestRows('agents', { agent_id: input.agentId, tenant_id: input.tenantId }),
    readTestRows('agent_passports', { passport_id: input.passportId, tenant_id: input.tenantId }),
    readTestRows('runtime_instances', { runtime_id: input.runtimeId, tenant_id: input.tenantId })
  ]);
  assert.equal(agents.length, 1, 'Parent agent must exist in the real TEST database');
  assert.equal(passports.length, 1, 'Parent passport must exist in the real TEST database');
  assert.equal(runtimes.length, 1, 'Parent runtime must exist in the real TEST database');
  assert.notEqual(input.agentId, input.passportId, 'Agent identity is distinct from passport identity');
  assert.equal(passports[0].agent_id, input.agentId);
  assert.equal(runtimes[0].agent_id, input.agentId);
  assert.equal(runtimes[0].passport_id, input.passportId);
}

export async function assertStoredSession(session: {
  executionId: string; agentId: string; runtimeId: string; tenantId?: string; status: string;
}): Promise<void> {
  const rows = await readTestRows('execution_sessions', {
    execution_id: session.executionId, tenant_id: session.tenantId || 'TENANT-DEFAULT'
  });
  assert.equal(rows.length, 1, 'Execution session must really persist; memory is not persistence proof');
  assert.equal(rows[0].agent_id, session.agentId);
  assert.equal(rows[0].runtime_id, session.runtimeId);
  assert.equal(rows[0].status, session.status);
}

export function testLiveModelCredentials(): { provider: 'openrouter' | 'openai'; apiKey: string; endpoint: string } {
  if (testSupabase.OPENROUTER_API_KEY) return {
    provider: 'openrouter', apiKey: testSupabase.OPENROUTER_API_KEY, endpoint: 'https://openrouter.ai/api/v1'
  };
  if (testSupabase.OPENAI_API_KEY) return {
    provider: 'openai', apiKey: testSupabase.OPENAI_API_KEY, endpoint: 'https://api.openai.com/v1'
  };
  throw new Error('TEST_MODEL_CREDENTIALS_REQUIRED: configure OPENROUTER_API_KEY or OPENAI_API_KEY in .env.test.local; no production credential fallback');
}
