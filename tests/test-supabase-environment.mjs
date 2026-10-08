import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

export const TEST_PROJECT_REF = 'wabfvgyvjeilfirumclf';
export const PRODUCTION_PROJECT_REF = 'efrmsnvibgrjuaotthrw';
export const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function installTestNetworkGuard() {
  const installed = Symbol.for('complypro.test.network.guard');
  if (globalThis[installed]) return;
  globalThis[installed] = true;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input, options) => {
    const address = input instanceof Request ? input.url : String(input);
    const host = new URL(address).hostname.toLowerCase();
    if ((host.endsWith('.supabase.co') && host !== `${TEST_PROJECT_REF}.supabase.co`) ||
        host.includes(PRODUCTION_PROJECT_REF) || host === 'api.supabase.com' ||
        host === 'complypro.pt' || host.endsWith('.complypro.pt') ||
        host === 'compliancepro-h6xb.onrender.com' ||
        (host.includes('standalone-compliance-scanner') && host.endsWith('.vercel.app'))) {
      console.error('COMPLYPRO_PRODUCTION_NETWORK_BLOCKED');
      process.exit(86);
    }
    return originalFetch(input, options);
  };
}

export function readTestEnvironment() {
  if (path.resolve(process.cwd()) !== PROJECT_ROOT) throw new Error('TEST_ROOT_MISMATCH');
  const filename = path.join(PROJECT_ROOT, '.env.test.local');
  if (!fs.existsSync(filename)) throw new Error('TEST_DATABASE_CREDENTIALS_REQUIRED');
  const config = dotenv.parse(fs.readFileSync(filename, 'utf8'));
  for (const name of ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY']) {
    if (!config[name]?.trim()) throw new Error(`TEST_CONFIGURATION_MISSING: ${name}`);
  }
  let url;
  try { url = new URL(config.SUPABASE_URL.trim()); } catch { throw new Error('TEST_SUPABASE_URL_INVALID'); }
  if (url.href !== `https://${TEST_PROJECT_REF}.supabase.co/`) throw new Error('TEST_SUPABASE_PROJECT_MISMATCH');
  if (Object.values(config).some(value => value.includes(PRODUCTION_PROJECT_REF))) {
    throw new Error('PRODUCTION_CONFIGURATION_FORBIDDEN_IN_TEST');
  }
  for (const name of ['SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY']) {
    let claims;
    try { claims = JSON.parse(Buffer.from(config[name].split('.')[1], 'base64url').toString()); }
    catch { throw new Error(`TEST_KEY_PROJECT_NOT_VERIFIABLE: ${name}`); }
    if (claims.ref !== TEST_PROJECT_REF || claims.role !== (name === 'SUPABASE_ANON_KEY' ? 'anon' : 'service_role')) {
      throw new Error(`TEST_KEY_PROJECT_OR_ROLE_MISMATCH: ${name}`);
    }
  }
  if (config.DATABASE_URL) throw new Error('TEST_POSTGRES_CONNECTION_REQUIRES_SEPARATE_TARGET_VALIDATION');
  return { ...config, SUPABASE_URL: url.origin, DATABASE_URL: '' };
}

export function loadTestEnvironment() {
  if (process.env.NODE_ENV === 'production') throw new Error('TEST_ENVIRONMENT_FORBIDDEN_IN_PRODUCTION');
  const config = readTestEnvironment();
  const signingSecret = config.COMPLYPRO_PASSPORT_SECRET || process.env.COMPLYPRO_TEST_SIGNING_SECRET || crypto.randomBytes(32).toString('hex');
  Object.assign(process.env, config, {
    NODE_ENV: 'test', DATABASE_URL: '', CODEGUARD_API_KEYS: config.CODEGUARD_API_KEYS || '',
    COMPLYPRO_PASSPORT_SECRET: signingSecret, COMPLYPRO_TEST_SIGNING_SECRET: signingSecret,
    OPENROUTER_API_KEY: config.OPENROUTER_API_KEY || '', OPENAI_API_KEY: config.OPENAI_API_KEY || '',
    AZURE_OPENAI_API_KEY: config.AZURE_OPENAI_API_KEY || ''
  });
  installTestNetworkGuard();
  return config;
}

export async function readTestSchema(config = readTestEnvironment()) {
  const response = await fetch(`${config.SUPABASE_URL}/rest/v1/`, {
    headers: { apikey: config.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${config.SUPABASE_SERVICE_ROLE_KEY}` },
    signal: AbortSignal.timeout(30000)
  });
  if (!response.ok) throw new Error(`TEST_SCHEMA_READ_FAILED: HTTP ${response.status}`);
  return response.json();
}

export async function requireTestSaasSchema(config = readTestEnvironment()) {
  const schema = await readTestSchema(config);
  const expected = {
    organizations: ['id', 'name', 'slug', 'plan_tier'],
    organization_members: ['id', 'organization_id', 'user_id', 'role'],
    entitlements: ['id', 'organization_id', 'monthly_scan_quota', 'used_scans_period', 'has_cg_ag_deep_scan',
      'has_ripd_export', 'has_api_access', 'is_active']
  };
  for (const [table, columns] of Object.entries(expected)) {
    if (!schema.paths?.[`/${table}`]) {
      throw new Error(`TEST_SAAS_SCHEMA_REQUIRED: ${table}; apply tests/test-saas-prerequisites.sql only to ${TEST_PROJECT_REF}`);
    }
    if (columns.some(column => !schema.definitions?.[table]?.properties?.[column])) {
      throw new Error(`TEST_SAAS_SCHEMA_INCOMPATIBLE: ${table}`);
    }
    for (const column of ['id', 'organization_id', 'user_id'].filter(column => columns.includes(column))) {
      if (schema.definitions[table].properties[column].format !== 'uuid') {
        throw new Error(`TEST_SAAS_SCHEMA_INCOMPATIBLE: ${table}.${column} must retain UUID type`);
      }
    }
  }
  return schema;
}
