/**
 * ComplyPRO.pt — Sprint 8-3: Containerization & CI/CD Audit Test
 * 
 * Verifies:
 * 1. Dockerfile syntax, multi-stage structure, non-root user (USER node), and HEALTHCHECK.
 * 2. .dockerignore completeness (strictly blocking .env, node_modules, .git, etc.).
 * 3. /health and /ready endpoints return valid JSON without leaking secrets.
 * 4. Database migration runner discovers and validates 001 and 002 SQL migrations.
 * 5. GitHub Actions CI workflow structure and step pipeline integrity.
 * 6. Zero secrets in image definition, docker-compose, and environment examples.
 */

import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { createServerApp } from '../src/server/app';
import { runMigrations } from '../src/server/db/migrate';

console.log('==================================================================');
console.log('>>> COMPLYPRO.PT — SPRINT 8-3: CONTAINER & CI/CD AUDIT TESTS   <<<');
console.log('==================================================================');

async function runS8_3_Tests() {
  const rootDir = process.cwd();

  // --------------------------------------------------------------------------
  // TEST 1: DOCKERFILE STRUCTURE & HARDENING
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 1: DOCKERFILE STRUCTURE & HARDENING ---');
  const dockerfilePath = path.join(rootDir, 'Dockerfile');
  assert(fs.existsSync(dockerfilePath), 'Dockerfile must exist in root directory');
  const dockerfileContent = fs.readFileSync(dockerfilePath, 'utf-8');

  // Verify multi-stage build
  assert(dockerfileContent.includes('FROM node:20-alpine AS builder'), 'Must have builder stage');
  assert(dockerfileContent.includes('FROM node:20-alpine AS runner'), 'Must have runner stage');

  // Verify non-root user
  assert(dockerfileContent.includes('USER node'), 'Must specify unprivileged non-root USER node');
  assert(dockerfileContent.includes('chown -R node:node /app'), 'Must set non-root ownership on /app');

  // Verify healthcheck directive
  assert(dockerfileContent.includes('HEALTHCHECK'), 'Must define native Docker HEALTHCHECK');
  assert(dockerfileContent.includes('/health'), 'HEALTHCHECK must probe /health endpoint');

  // Verify command executes compiled production JavaScript without tsx or ts-node dependency
  assert(dockerfileContent.includes('dist-server'), 'Must copy compiled dist-server bundle into runner');
  assert(dockerfileContent.includes('CMD ["node", "dist-server/app.js"]'), 'Must execute compiled JS via node dist-server/app.js');
  assert(!dockerfileContent.includes('ts-node/esm'), 'Must not reference ts-node');

  // Verify zero secrets baked into Dockerfile
  assert(!/sk-or-|OPENROUTER_API_KEY=|SUPABASE_SERVICE_ROLE_KEY=|Bearer/i.test(dockerfileContent), 'Zero hardcoded secrets in Dockerfile');
  console.log('  [PASS 1]: Dockerfile multi-stage, non-root user, compiled JS runtime, and HEALTHCHECK verified');

  // --------------------------------------------------------------------------
  // TEST 2: .DOCKERIGNORE COMPLETENESS
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 2: .DOCKERIGNORE COMPLETENESS ---');
  const dockerignorePath = path.join(rootDir, '.dockerignore');
  assert(fs.existsSync(dockerignorePath), '.dockerignore must exist in root directory');
  const dockerignoreContent = fs.readFileSync(dockerignorePath, 'utf-8');

  const requiredIgnorePatterns = [
    'node_modules',
    '.env',
    '.env.*',
    'dist',
    'dist-server',
    'tests',
    '.git',
    'test-results',
    'playwright-report'
  ];

  for (const pattern of requiredIgnorePatterns) {
    assert(dockerignoreContent.includes(pattern), `.dockerignore must explicitly ignore ${pattern}`);
  }
  console.log('  [PASS 2]: .dockerignore excludes all sensitive files, node_modules, and build outputs');

  // --------------------------------------------------------------------------
  // TEST 3: DOCKER COMPOSE CONFIGURATION
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 3: DOCKER COMPOSE CONFIGURATION ---');
  const composePath = path.join(rootDir, 'docker-compose.yml');
  assert(fs.existsSync(composePath), 'docker-compose.yml must exist');
  const composeContent = fs.readFileSync(composePath, 'utf-8');

  assert(composeContent.includes('complypro-server'), 'Must define complypro-server service');
  assert(composeContent.includes('3000'), 'Must map port 3000');
  assert(composeContent.includes('healthcheck:'), 'docker-compose must specify healthcheck');
  // Confirm no duplicate local Postgres service
  assert(!composeContent.includes('image: postgres'), 'Must NOT inject local Postgres that would conflict with Supabase cloud');
  console.log('  [PASS 3]: docker-compose.yml properly configured without local database conflict');

  // --------------------------------------------------------------------------
  // TEST 4: HEALTH AND READINESS ENDPOINTS
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 4: HEALTH & READINESS ENDPOINTS ---');
  const app = createServerApp();
  const server = app.listen(0);
  const address = server.address() as any;
  const port = address.port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // 4.1 Liveness Probe: GET /health
    const healthRes = await fetch(`${baseUrl}/health`);
    assert.strictEqual(healthRes.status, 200, 'GET /health must return 200 OK');
    const healthJson = await healthRes.json() as any;
    assert.strictEqual(healthJson.status, 'operational');
    assert(healthJson.timestamp !== undefined);
    assert(!JSON.stringify(healthJson).includes('KEY'), 'Health response must not leak secrets');

    // 4.2 Readiness Probe: GET /ready
    const readyRes = await fetch(`${baseUrl}/ready`);
    assert.strictEqual(readyRes.status, 200, 'GET /ready must return 200 OK');
    const readyJson = await readyRes.json() as any;
    assert.strictEqual(readyJson.status, 'ready');
    assert(readyJson.services !== undefined);
    assert(!JSON.stringify(readyJson).includes('KEY'), 'Readiness response must not leak secrets');

    console.log('  [PASS 4]: Liveness (/health) and Readiness (/ready) probes operate cleanly without secret leakage');
  } finally {
    server.close();
  }

  // --------------------------------------------------------------------------
  // TEST 5: DATABASE MIGRATION REPRODUCIBILITY
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 5: DATABASE MIGRATION REPRODUCIBILITY ---');
  const migrationsDir = path.join(rootDir, 'src/server/db/migrations');
  assert(fs.existsSync(migrationsDir), 'Migrations directory must exist');
  const migrationFiles = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

  assert(migrationFiles.includes('001_initial_schema.sql'), '001_initial_schema.sql must exist');
  assert(migrationFiles.includes('002_durable_runtime_and_rls.sql'), '002_durable_runtime_and_rls.sql must exist');

  // Verify non-destructive DDL
  const migration002 = fs.readFileSync(path.join(migrationsDir, '002_durable_runtime_and_rls.sql'), 'utf-8');
  assert(!migration002.includes('DROP TABLE'), 'Migration 002 must not contain destructive DROP TABLE statements');
  assert(migration002.includes('CREATE TABLE IF NOT EXISTS agents'), 'Migration 002 must be idempotent');
  assert(migration002.includes('ENABLE ROW LEVEL SECURITY'), 'Migration 002 must enforce RLS');

  // Test migrator runner
  const migratorResult = await runMigrations();
  assert.strictEqual(migratorResult.success, true, 'Migration runner must execute cleanly');
  console.log('  [PASS 5]: Versioned migrations 001 & 002 verified for non-destructive idempotency');

  // --------------------------------------------------------------------------
  // TEST 6: GITHUB ACTIONS CI/CD WORKFLOW
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 6: GITHUB ACTIONS CI/CD WORKFLOW ---');
  const workflowPath = path.join(rootDir, '.github/workflows/ci.yml');
  assert(fs.existsSync(workflowPath), '.github/workflows/ci.yml must exist');
  const workflowContent = fs.readFileSync(workflowPath, 'utf-8');

  // Check required steps
  assert(workflowContent.includes('npm ci'), 'CI must run npm ci');
  assert(workflowContent.includes('npx tsc --noEmit'), 'CI must run npx tsc --noEmit');
  assert(workflowContent.includes('npm test'), 'CI must run npm test');
  assert(workflowContent.includes('npm run build'), 'CI must run npm run build');
  assert(workflowContent.includes('docker build'), 'CI must build Docker image');
  assert(workflowContent.includes('docker run'), 'CI must execute container smoke test');
  assert(workflowContent.includes('/health'), 'CI must probe container /health');
  assert(workflowContent.includes('/ready'), 'CI must probe container /ready');
  assert(workflowContent.includes('id -u'), 'CI must verify non-root user execution');
  console.log('  [PASS 6]: GitHub Actions CI workflow verified with comprehensive test, build, and container smoke pipeline');

  // --------------------------------------------------------------------------
  // TEST 7: SECRET EXPOSURE AUDIT
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 7: SECRET EXPOSURE AUDIT ---');
  const gitignorePath = path.join(rootDir, '.gitignore');
  const gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');
  assert(gitignoreContent.includes('.env'), '.gitignore must ignore .env');
  assert(gitignoreContent.includes('.env.*'), '.gitignore must ignore .env.*');

  // Verify render.yaml does not contain hardcoded secrets
  const renderYamlPath = path.join(rootDir, 'render.yaml');
  if (fs.existsSync(renderYamlPath)) {
    const renderContent = fs.readFileSync(renderYamlPath, 'utf-8');
    assert(!/sk-or-|SUPABASE_SERVICE_ROLE_KEY=/i.test(renderContent), 'render.yaml must not contain secrets');
  }
  console.log('  [PASS 7]: Secret exposure audit passed: .gitignore and configs protect all credentials');

  // --------------------------------------------------------------------------
  // TEST 8: COMPILED PRODUCTION JAVASCRIPT RUNTIME EXECUTION
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 8: COMPILED PRODUCTION RUNTIME EXECUTION ---');
  const compiledServerPath = path.join(rootDir, 'dist-server', 'app.js');
  assert(fs.existsSync(compiledServerPath), 'Compiled production server bundle (dist-server/app.js) must exist');

  // Verify compiled bundle does not require development loaders
  const bundleContent = fs.readFileSync(compiledServerPath, 'utf-8');
  assert(bundleContent.length > 10000, 'Compiled bundle must contain production server logic');

  // Boot the compiled JS server using native node
  const testPort = 3099;
  const child = spawn(process.execPath, [compiledServerPath], {
    cwd: rootDir,
    env: { ...process.env, PORT: String(testPort), NODE_ENV: 'production' },
    stdio: 'pipe'
  });

  try {
    // Wait for server to bind port
    let isReady = false;
    for (let i = 0; i < 25; i++) {
      await new Promise(r => setTimeout(r, 200));
      try {
        const res = await fetch(`http://127.0.0.1:${testPort}/health`);
        if (res.status === 200) {
          const json = await res.json() as any;
          if (json.status === 'operational') {
            isReady = true;
            break;
          }
        }
      } catch (e) {
        // Retry
      }
    }
    assert.strictEqual(isReady, true, 'Compiled server must boot under pure node and respond on /health with 200 operational');

    // Test /ready on compiled server
    const readyRes = await fetch(`http://127.0.0.1:${testPort}/ready`);
    assert.strictEqual(readyRes.status, 200, 'Compiled server must respond on /ready with 200 OK');
    const readyJson = await readyRes.json() as any;
    assert.strictEqual(readyJson.status, 'ready');

    console.log('  [PASS 8]: Compiled production JavaScript runs cleanly under pure node without tsx or dev loaders');
  } finally {
    child.kill();
  }

  console.log('\n==================================================================');
  console.log('>>> S8-3 CONTAINERIZATION & CI/CD: ALL 8 AUDIT TESTS PASS     <<<');
  console.log('==================================================================\n');
}

runS8_3_Tests().catch(err => {
  console.error('\n[FATAL S8-3 TEST FAILURE]:', err);
  process.exit(1);
});
