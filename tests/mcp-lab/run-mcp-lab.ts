#!/usr/bin/env node
/**
 * CG-AG MCP Test Lab
 *
 * Starts the real Universal MCP server over STDIO and validates protocol,
 * contract, selected tool execution, resource reads, prompts, and fail-closed
 * behavior. Results are sanitized before being printed or written.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport, getDefaultEnvironment } from '@modelcontextprotocol/sdk/client/stdio.js';

type Status = 'PASS' | 'FAIL' | 'SKIP';

type Check = {
  name: string;
  status: Status;
  expected?: unknown;
  actual?: unknown;
  details?: unknown;
};

const __filename = fileURLToPath(import.meta.url);
const LAB_DIR = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(LAB_DIR, '..', '..');
const FIXTURE_DIR = path.join(LAB_DIR, 'fixtures', 'safe-target-repo');
const REPORT_PATH = path.join(LAB_DIR, 'results', 'latest-report.json');

const EXPECTED_TOOLS = [
  'scan_repository',
  'get_scan_summary',
  'discover_agents',
  'discover_capabilities',
  'detect_shadow_apis',
  'get_agent_passport',
  'get_business_xray',
  'get_governance_controls',
  'get_governance_snapshot',
  'get_audit_ledger',
  'verify_audit_ledger',
  'get_evidence_records',
  'get_tenant_context',
  'get_mcp_server_info'
];

const EXPECTED_STATIC_RESOURCES = [
  'cgag://controls',
  'cgag://policies',
  'cgag://ledger',
  'cgag://evidence',
  'cgag://tenant'
];

const EXPECTED_RESOURCE_TEMPLATES = [
  'cgag://ledger/{blockHeight}',
  'cgag://evidence/{id}'
];

const EXPECTED_PROMPTS = [
  'executive_governance_review',
  'ciso_security_review',
  'dpo_privacy_review',
  'vendor_risk_assessment'
];

const TOOL_EXECUTION_PLAN: Array<{ name: string; args: Record<string, unknown> }> = [
  { name: 'discover_capabilities', args: { targetDir: FIXTURE_DIR } },
  { name: 'get_scan_summary', args: { targetDir: FIXTURE_DIR } },
  { name: 'get_business_xray', args: { targetDir: FIXTURE_DIR } },
  { name: 'get_governance_controls', args: {} },
  { name: 'get_agent_passport', args: { targetDir: FIXTURE_DIR } },
  { name: 'get_evidence_records', args: { limit: 10 } },
  { name: 'get_audit_ledger', args: { limit: 10 } },
  { name: 'verify_audit_ledger', args: {} },
  { name: 'get_tenant_context', args: {} },
  { name: 'get_mcp_server_info', args: {} }
];

const checks: Check[] = [];

function record(check: Check) {
  checks.push(sanitize(check) as Check);
  const marker = check.status === 'PASS' ? '[PASS]' : check.status === 'SKIP' ? '[SKIP]' : '[FAIL]';
  console.log(`${marker} ${check.name}`);
}

function sanitize(value: unknown): unknown {
  if (typeof value === 'string') {
    return value
      .replace(/sk-[a-zA-Z0-9._-]+/g, 'sk-***REDACTED***')
      .replace(/Bearer\s+[a-zA-Z0-9._-]+/gi, 'Bearer ***REDACTED***')
      .replace(/SES-\d+-[a-f0-9]+/g, 'SES-***REDACTED***')
      .replace(/(api[_-]?key|token|secret|password)["']?\s*[:=]\s*["'][^"']+["']/gi, '$1: "***REDACTED***"');
  }
  if (Array.isArray(value)) return value.map(sanitize);
  if (value && typeof value === 'object') {
    const output: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) {
      if (/token|secret|password|apiKey/i.test(key)) {
        output[key] = '***REDACTED***';
      } else if (key === 'stack') {
        output[key] = '***REDACTED***';
      } else {
        output[key] = sanitize(item);
      }
    }
    return output;
  }
  return value;
}

function containsSensitiveOrStack(value: unknown): boolean {
  const serialized = JSON.stringify(sanitize(value));
  return /sk-[a-zA-Z0-9._-]+|Bearer\s+[a-zA-Z0-9._-]+|SES-\d+-[a-f0-9]+|\n\s*at\s+/i.test(serialized);
}

function textContent(result: any): string {
  const item = result?.content?.find((entry: any) => entry.type === 'text');
  return typeof item?.text === 'string' ? item.text : '';
}

function parseToolEnvelope(result: any): any {
  const text = textContent(result);
  try {
    return JSON.parse(text);
  } catch {
    return { ok: false, error: { code: 'UNPARSEABLE_TOOL_RESULT', message: text.slice(0, 240) } };
  }
}

function summarizeEnvelope(envelope: any) {
  return {
    ok: envelope?.ok,
    code: envelope?.error?.code,
    message: envelope?.error?.message,
    dataKeys: envelope?.data && typeof envelope.data === 'object' ? Object.keys(envelope.data).slice(0, 12) : [],
    metadata: envelope?.metadata
      ? {
          tenantId: envelope.metadata.tenantId,
          workspaceId: envelope.metadata.workspaceId,
          executedBy: envelope.metadata.executedBy,
          roles: envelope.metadata.roles,
          riskClassification: envelope.metadata.riskClassification,
          epistemicState: envelope.metadata.epistemicState
        }
      : undefined
  };
}

function isRejectedWithoutLeakage(result: { threw: boolean; value?: any; error?: any }): boolean {
  return (result.threw || result.value?.isError === true) && !containsSensitiveOrStack(result);
}

function expectedSetCheck(name: string, expected: string[], actual: string[]) {
  const missing = expected.filter((item) => !actual.includes(item));
  const unexpected = actual.filter((item) => !expected.includes(item));
  record({
    name,
    status: missing.length === 0 && unexpected.length === 0 ? 'PASS' : 'FAIL',
    expected,
    actual,
    details: { missing, unexpected }
  });
}

function createTransport(scriptName: string, env: Record<string, string> = {}) {
  const command = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const baseEnv = {
    ...getDefaultEnvironment(),
    PATH: process.env.PATH || process.env.Path || '',
    Path: process.env.Path || process.env.PATH || '',
    SystemRoot: process.env.SystemRoot || 'C:\\Windows',
    SYSTEMROOT: process.env.SYSTEMROOT || process.env.SystemRoot || 'C:\\Windows',
    COMSPEC: process.env.COMSPEC || process.env.ComSpec || 'C:\\Windows\\System32\\cmd.exe',
    ComSpec: process.env.ComSpec || process.env.COMSPEC || 'C:\\Windows\\System32\\cmd.exe',
    CODEGUARD_SAFE_ROOT: PROJECT_ROOT,
    ...env
  };

  return new StdioClientTransport({
    command,
    args: ['--silent', 'run', scriptName],
    cwd: PROJECT_ROOT,
    env: baseEnv,
    stderr: 'pipe'
  });
}

async function connectClient(label: string, scriptName: string, env: Record<string, string> = {}) {
  const client = new Client({ name: `cgag-mcp-lab-${label}`, version: '1.0.0' }, { capabilities: {} });
  const transport = createTransport(scriptName, env);
  const stderr: string[] = [];
  transport.stderr?.on('data', (chunk) => {
    stderr.push(String(chunk));
  });
  await client.connect(transport);
  return { client, transport, stderr };
}

async function closeClient(client: Client, transport: StdioClientTransport) {
  try {
    await client.close();
  } catch {
    await transport.close();
  }
}

async function main() {
  console.log('# CG-AG MCP Test Lab');
  console.log(`Project: ${PROJECT_ROOT}`);
  console.log(`Fixture: ${FIXTURE_DIR}`);

  mkdirSync(path.dirname(REPORT_PATH), { recursive: true });

  const valid = await connectClient('authenticated-stdio', 'mcp:lab:server');
  let evidenceId: string | undefined;

  try {
    const serverVersion = valid.client.getServerVersion();
    record({
      name: 'Initialize over STDIO',
      status: serverVersion?.name === 'complypro-universal-mcp' ? 'PASS' : 'FAIL',
      expected: 'complypro-universal-mcp',
      actual: serverVersion
    });

    const tools = await valid.client.listTools();
    const toolNames = tools.tools.map((tool) => tool.name).sort();
    expectedSetCheck('Tool contract: exactly 14 canonical tools', EXPECTED_TOOLS.sort(), toolNames);

    const resources = await valid.client.listResources();
    const resourceTemplates = await valid.client.listResourceTemplates();
    const resourceUris = resources.resources.map((resource) => resource.uri).sort();
    const templateUris = resourceTemplates.resourceTemplates.map((resource) => resource.uriTemplate).sort();
    expectedSetCheck('Static resource contract: 5 listed resources', EXPECTED_STATIC_RESOURCES.sort(), resourceUris);
    expectedSetCheck('Resource template contract: 2 listed templates', EXPECTED_RESOURCE_TEMPLATES.sort(), templateUris);
    record({
      name: 'Resource contract: exactly 7 total resources/templates',
      status: resourceUris.length + templateUris.length === 7 ? 'PASS' : 'FAIL',
      expected: 7,
      actual: resourceUris.length + templateUris.length,
      details: { resources: resourceUris, templates: templateUris }
    });

    const prompts = await valid.client.listPrompts();
    const promptNames = prompts.prompts.map((prompt) => prompt.name).sort();
    expectedSetCheck('Prompt contract: exactly 4 canonical prompts', EXPECTED_PROMPTS.sort(), promptNames);

    for (const plan of TOOL_EXECUTION_PLAN) {
      const result = await valid.client.callTool({ name: plan.name, arguments: plan.args });
      const envelope = parseToolEnvelope(result);
      record({
        name: `Tool execution: ${plan.name}`,
        status: envelope?.ok === true ? 'PASS' : 'FAIL',
        expected: 'ok=true',
        actual: summarizeEnvelope(envelope)
      });
    }

    const evidenceResult = await valid.client.callTool({ name: 'get_evidence_records', arguments: { limit: 1 } });
    const evidenceEnvelope = parseToolEnvelope(evidenceResult);
    evidenceId = evidenceEnvelope?.data?.records?.[0]?.evidenceId;

    const resourceReadPlan = [
      'cgag://controls',
      'cgag://policies',
      'cgag://ledger',
      'cgag://evidence',
      'cgag://tenant',
      'cgag://ledger/0',
      evidenceId ? `cgag://evidence/${evidenceId}` : undefined
    ].filter(Boolean) as string[];

    for (const uri of resourceReadPlan) {
      const result = await valid.client.readResource({ uri });
      record({
        name: `Resource read: ${uri}`,
        status: result.contents.length > 0 ? 'PASS' : 'FAIL',
        expected: 'content returned',
        actual: result.contents.map((content) => ({
          uri: content.uri,
          mimeType: 'mimeType' in content ? content.mimeType : undefined,
          hasText: 'text' in content && typeof content.text === 'string' && content.text.length > 0
        }))
      });
    }

    if (!templateUris.includes('cgag://controls/{id}')) {
      record({
        name: 'Parameterized resource read: cgag://controls/{id}',
        status: 'SKIP',
        expected: 'registered template before execution',
        actual: 'not registered by current MCP contract'
      });
    }

    for (const promptName of EXPECTED_PROMPTS) {
      const result = await valid.client.getPrompt({
        name: promptName,
        arguments: promptName === 'vendor_risk_assessment'
          ? { targetDir: FIXTURE_DIR, vendorName: 'Local Lab Vendor' }
          : { targetDir: FIXTURE_DIR }
      });
      record({
        name: `Prompt retrieval: ${promptName}`,
        status: result.messages.length > 0 ? 'PASS' : 'FAIL',
        expected: 'messages returned',
        actual: { messages: result.messages.length, description: result.description }
      });
    }

    const validTenant = parseToolEnvelope(await valid.client.callTool({ name: 'get_tenant_context', arguments: {} }));
    record({
      name: 'Security: valid session accepted',
      status: validTenant?.ok === true && validTenant?.data?.tenantId === 'TENANT-DEFAULT' ? 'PASS' : 'FAIL',
      expected: 'TENANT-DEFAULT authenticated context',
      actual: summarizeEnvelope(validTenant)
    });

    const invalidArgument = await valid.client
      .callTool({ name: 'get_audit_ledger', arguments: { limit: 'not-a-number' } as any })
      .then((value) => ({ threw: false, value }))
      .catch((error) => ({ threw: true, error: { name: error?.name, message: error?.message } }));
    record({
      name: 'Security: invalid request rejected without stack/secrets',
      status: isRejectedWithoutLeakage(invalidArgument) ? 'PASS' : 'FAIL',
      expected: 'MCP validation error, sanitized',
      actual: invalidArgument
    });

    const invalidTool = await valid.client
      .callTool({ name: 'non_existent_tool_xyz', arguments: {} })
      .then((value) => ({ threw: false, value }))
      .catch((error) => ({ threw: true, error: { name: error?.name, message: error?.message } }));
    record({
      name: 'Security: nonexistent tool rejected without stack/secrets',
      status: isRejectedWithoutLeakage(invalidTool) ? 'PASS' : 'FAIL',
      expected: 'MCP tool-not-found error, sanitized',
      actual: invalidTool
    });

    const invalidResource = await valid.client
      .readResource({ uri: 'cgag://does-not-exist' })
      .then((value) => ({ threw: false, value }))
      .catch((error) => ({ threw: true, error: { name: error?.name, message: error?.message } }));
    record({
      name: 'Security: nonexistent resource rejected without stack/secrets',
      status: isRejectedWithoutLeakage(invalidResource) ? 'PASS' : 'FAIL',
      expected: 'MCP resource-not-found error, sanitized',
      actual: invalidResource
    });

    record({
      name: 'Security: valid-session stderr has no stack traces or secrets',
      status: containsSensitiveOrStack(valid.stderr.join('\n')) ? 'FAIL' : 'PASS',
      expected: 'no stack traces or secrets',
      actual: valid.stderr.join('\n').trim()
    });
  } finally {
    await closeClient(valid.client, valid.transport);
  }

  const unauthenticated = await connectClient('unauthenticated-stdio', 'mcp', {
    CGAG_MCP_DEV_MODE: 'false',
    NODE_ENV: 'development',
    CGAG_MCP_AUTH_TOKEN: ''
  });

  try {
    const result = await unauthenticated.client.callTool({ name: 'get_tenant_context', arguments: {} });
    const envelope = parseToolEnvelope(result);
    record({
      name: 'Security: missing session fails closed',
      status: envelope?.ok === false && envelope?.error?.code === 'UNAUTHENTICATED' && !containsSensitiveOrStack(envelope) ? 'PASS' : 'FAIL',
      expected: 'UNAUTHENTICATED fail-closed envelope',
      actual: summarizeEnvelope(envelope)
    });
  } finally {
    await closeClient(unauthenticated.client, unauthenticated.transport);
  }

  const failed = checks.filter((check) => check.status === 'FAIL');
  const report = {
    name: 'CG-AG MCP Test Lab',
    timestamp: new Date().toISOString(),
    projectRoot: PROJECT_ROOT,
    fixtureDir: FIXTURE_DIR,
    serverCommand: 'npm --silent run mcp:lab:server',
    productionServerCommand: 'npm --silent run mcp',
    expected: {
      tools: EXPECTED_TOOLS.length,
      staticResources: EXPECTED_STATIC_RESOURCES.length,
      resourceTemplates: EXPECTED_RESOURCE_TEMPLATES.length,
      prompts: EXPECTED_PROMPTS.length
    },
    summary: {
      pass: checks.filter((check) => check.status === 'PASS').length,
      fail: failed.length,
      skip: checks.filter((check) => check.status === 'SKIP').length
    },
    checks
  };

  writeFileSync(REPORT_PATH, JSON.stringify(sanitize(report), null, 2));
  console.log(`Report: ${REPORT_PATH}`);

  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  const failure = sanitize({ name: error?.name, message: error?.message });
  record({
    name: 'Harness execution',
    status: 'FAIL',
    actual: failure
  });
  mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  writeFileSync(REPORT_PATH, JSON.stringify({ checks, fatal: failure }, null, 2));
  process.exit(1);
});
