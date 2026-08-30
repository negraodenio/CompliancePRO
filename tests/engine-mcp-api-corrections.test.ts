/**
 * CG-AG ENGINE - MCP / API GOVERNANCE ENGINE HARDENING TEST SUITE
 * Validates all 18 correction requirements:
 * 1. REST inbound routes -> AgentCapability(rest_api)
 * 2. REST outbound calls -> AgentCapability(rest_api)
 * 3. LLM API calls -> AgentCapability(llm_service)
 * 4. API key identity detection -> AgentIdentityBinding(api_key)
 * 5. API secret non-leakage invariant (never store key values)
 * 6. OAuth evidence correlation beyond ERP/Office 365
 * 7. MCP server identity extraction
 * 8. MCP registration = DECLARED_CAPABILITY
 * 9. MCP invocation = OBSERVED_CAPABILITY
 * 10. MCP client detection -> AgentIdentityBinding(unassigned)
 * 11. MCP resources -> AgentCapability(mcp_server, READ)
 * 12. MCP prompts -> AgentCapability(mcp_server, EXECUTE)
 * 13. MCP tool schema extraction (static boundary assessment)
 * 14. Python MCP SDK detection (FastMCP, @mcp.tool, @mcp.resource, @mcp.prompt)
 * 15. MCP SSE transport detection
 * 16. SHA-256 known-vector verification (FIPS 180-4 standard)
 * 17. Complete provenance preservation (filePath, lineNumber, scope, provenance object)
 * 18. Epistemic invariants (OBSERVED != AUTHORIZED, no manufactured permissions)
 */

import { detectCapabilities } from '../src/core/capability-detector';
import { SourceAnalysis } from '../src/core/types';
import { sha256Digest, computeDeterministicHash } from '../src/web/services/audit-ledger-store';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`[FAIL]: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`  [PASS] ${message}`);
}

console.log("==================================================================");
console.log(">>> CG-AG ENGINE: MCP, REST & LLM CAPABILITY CORRECTIONS SUITE <<<");
console.log("==================================================================\n");

let testCount = 0;
function testGroup(name: string, fn: () => void) {
  console.log(`[TEST ${++testCount}] ${name}...`);
  fn();
  console.log("");
}

const baseMockSource: SourceAnalysis = {
  apiRoutes: [],
  databaseTables: [],
  externalServices: [],
  authPatterns: [],
  aiModels: [],
  dataAssets: [],
  agents: [],
  fileTree: [],
  totalFiles: 0,
  totalLines: 0,
  languages: {},
  notebooks: [],
  extractedPrompts: [],
  frameworks: [],
  memorySystems: [],
  classification: null
};

// 1. REST INBOUND ROUTES -> AgentCapability(rest_api)
testGroup("1. REST Inbound Routes: Promoted into canonical AgentCapability pipeline", () => {
  const files = new Map<string, string>();
  const mockSource: SourceAnalysis = {
    ...baseMockSource,
    apiRoutes: [
      { path: '/api/v1/orders', method: 'POST', authRequired: true, description: 'Create order' },
      { path: '/api/v1/accounts', method: 'GET', authRequired: false, description: 'Get accounts' },
      { path: '/api/v1/customers/:id', method: 'DELETE', authRequired: false, description: 'Delete customer' }
    ]
  };

  const { capabilities } = detectCapabilities(files, mockSource);
  const restCaps = capabilities.filter(c => c.systemType === 'rest_api' && c.systemName === 'Inbound REST API');

  assert(restCaps.length === 3, `Expected 3 inbound REST capabilities, found ${restCaps.length}`);
  
  const postOrder = restCaps.find(c => c.resourceTarget.includes('POST /api/v1/orders'));
  assert(postOrder !== undefined, "Found POST /api/v1/orders capability");
  assert(postOrder?.action === 'WRITE', "POST mapped to WRITE action");
  assert(postOrder?.state === 'OBSERVED_CAPABILITY', "State is OBSERVED_CAPABILITY");
  assert(postOrder?.provenance?.primaryScope === 'production', "Scope is production");

  const deleteCust = restCaps.find(c => c.resourceTarget.includes('DELETE /api/v1/customers/:id'));
  assert(deleteCust !== undefined, "Found DELETE /api/v1/customers/:id capability");
  assert(deleteCust?.action === 'DELETE', "DELETE mapped to DELETE action");
  assert(deleteCust?.isDestructive === true, "Marked as destructive");
  assert(deleteCust?.anomalies.includes('OBSERVED_WITHOUT_VERIFIED_AUTH'), "Unauthenticated route has anomaly");
});

// 2. REST OUTBOUND CALLS -> AgentCapability(rest_api)
testGroup("2. REST Outbound Calls: fetch, axios, requests detected as AgentCapability", () => {
  const files = new Map<string, string>();
  files.set('src/services/api_client.ts', `
import axios from 'axios';

export async function syncData() {
  const res = await fetch('https://api.external-partner.com/v1/sync');
  const postRes = await axios.post('https://api.payment-gateway.com/charge', { amount: 100 });
  return { res, postRes };
}
  `);

  const { capabilities } = detectCapabilities(files, baseMockSource);
  const restCaps = capabilities.filter(c => c.systemType === 'rest_api' && c.systemName === 'Outbound REST API');

  assert(restCaps.length >= 2, `Expected at least 2 outbound REST capabilities, found ${restCaps.length}`);
  assert(restCaps.some(c => c.resourceTarget.includes('external-partner.com')), "Found external-partner fetch capability");
  assert(restCaps.some(c => c.resourceTarget.includes('payment-gateway.com')), "Found payment-gateway axios capability");
  assert(restCaps.every(c => c.state === 'OBSERVED_CAPABILITY'), "Outbound calls without grants are OBSERVED_CAPABILITY");
});

// 3. LLM API CALLS -> AgentCapability(llm_service)
testGroup("3. LLM API Calls: Real SDK invocations promoted into AgentCapability", () => {
  const files = new Map<string, string>();
  files.set('src/agents/researcher.ts', `
import OpenAI from 'openai';
import { Anthropic } from '@anthropic-ai/sdk';

const openai = new OpenAI();
const anthropic = new Anthropic();

export async function runReasoning(prompt: string) {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }]
  });
  const msg = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }]
  });
  return { completion, msg };
}
  `);

  const { capabilities } = detectCapabilities(files, baseMockSource);
  const llmCaps = capabilities.filter(c => c.systemType === 'llm_service' && c.systemName.includes('LLM API'));

  assert(llmCaps.length >= 2, `Expected at least 2 LLM API capabilities, found ${llmCaps.length}`);
  assert(llmCaps.some(c => c.systemName.includes('Openai')), "Found OpenAI LLM API capability");
  assert(llmCaps.some(c => c.systemName.includes('Anthropic')), "Found Anthropic LLM API capability");
  assert(llmCaps.every(c => c.state === 'OBSERVED_CAPABILITY'), "Invocations are OBSERVED_CAPABILITY");
  assert(llmCaps.every(c => c.anomalies.includes('OBSERVED_WITHOUT_VERIFIED_AUTH')), "Flagged OBSERVED_WITHOUT_VERIFIED_AUTH");
});

// 4 & 5. API KEY IDENTITY DETECTION & ZERO SECRET LEAKAGE
testGroup("4 & 5. API Key Identity: Detected as identity binding with ZERO secret leakage", () => {
  const files = new Map<string, string>();
  files.set('src/config/keys.ts', `
const apiKey = process.env.OPENAI_API_KEY;
const anthropicKey = process.env.ANTHROPIC_API_KEY;
const token = process.env.GITHUB_TOKEN;
const rawHardcoded = 'sk-live-1234567890abcdef1234567890';
  `);

  const { identities } = detectCapabilities(files, baseMockSource);
  const apiKeyIdentities = identities.filter(id => id.identityType === 'api_key');

  assert(apiKeyIdentities.length >= 3, `Expected at least 3 API key identity bindings, found ${apiKeyIdentities.length}`);
  assert(apiKeyIdentities.some(id => id.identityName === 'env:OPENAI_API_KEY'), "Captured env:OPENAI_API_KEY identifier");
  assert(apiKeyIdentities.some(id => id.identityName === 'env:ANTHROPIC_API_KEY'), "Captured env:ANTHROPIC_API_KEY identifier");
  assert(apiKeyIdentities.some(id => id.identityName === 'env:GITHUB_TOKEN'), "Captured env:GITHUB_TOKEN identifier");

  // Zero Secret Leakage Invariant
  const serialized = JSON.stringify(identities);
  assert(!serialized.includes('sk-live-1234567890abcdef1234567890'), "INVARIANT: Raw secret material is NEVER stored in identity bindings");
});

// 6. OAUTH EVIDENCE CORRELATION
testGroup("6. OAuth Correlation: Generalized to GitHub, Google, Slack, etc.", () => {
  const files = new Map<string, string>();
  files.set('config/oauth.json', `
{
  "scopes": ["repo", "read:user", "https://www.googleapis.com/auth/drive.readonly"]
}
  `);
  files.set('src/integrations/github.ts', `
import axios from 'axios';
export async function getRepos() {
  return axios.get('https://api.github.com/user/repos');
}
  `);

  const { capabilities } = detectCapabilities(files, baseMockSource);
  const githubCap = capabilities.find(c => c.systemType === 'rest_api' && c.resourceTarget.includes('github.com'));

  assert(githubCap !== undefined, "Found GitHub REST API capability");
  assert(githubCap?.authorizationEvidence?.type === 'oauth_scope', "Correlated OAuth scope evidence");
  assert(githubCap?.state === 'AUTHORIZED_CAPABILITY', "Elevated to AUTHORIZED_CAPABILITY with grant");
});

// 7, 8, 9, 10. MCP TYPESCRIPT: Identity, Registration vs Invocation, Client
testGroup("7-10. MCP TypeScript: Server Identity, Registration vs Invocation, Client Detection", () => {
  const files = new Map<string, string>();
  files.set('src/mcp_server.ts', `
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const server = new McpServer({ name: 'ComplianceAuditServer', version: '1.0.0' });

server.tool('audit_agent_permissions', { agentId: 'string' }, async (args) => {
  return { content: [{ type: 'text', text: 'ok' }] };
});
  `);

  files.set('src/mcp_client.ts', `
import { McpClient } from '@modelcontextprotocol/sdk/client/mcp.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const client = new McpClient({ name: 'AppClient' });
await client.connect(new StdioClientTransport());
await client.callTool({ name: 'audit_agent_permissions' });
  `);

  const { capabilities, identities } = detectCapabilities(files, baseMockSource);

  // Server Identity
  const serverToolCap = capabilities.find(c => c.systemType === 'mcp_server' && c.resourceTarget === 'audit_agent_permissions' && c.state === 'DECLARED_CAPABILITY');
  assert(serverToolCap !== undefined, "Found registered tool capability");
  assert(serverToolCap?.systemName === 'ComplianceAuditServer', `Server identity extracted: '${serverToolCap?.systemName}'`);

  // Registration = DECLARED_CAPABILITY
  assert(serverToolCap?.state === 'DECLARED_CAPABILITY', "MCP tool registration is DECLARED_CAPABILITY");

  // Invocation = OBSERVED_CAPABILITY
  const invokedCap = capabilities.find(c => c.systemType === 'mcp_server' && c.resourceTarget === 'audit_agent_permissions' && c.state === 'OBSERVED_CAPABILITY');
  assert(invokedCap !== undefined, "Found invoked tool capability");
  assert(invokedCap?.state === 'OBSERVED_CAPABILITY', "MCP tool invocation is OBSERVED_CAPABILITY");

  // Client Detection
  const clientIdentity = identities.find(id => id.identityName.startsWith('mcp_client:'));
  assert(clientIdentity !== undefined, "MCP client detected in identities");
  assert(clientIdentity?.identityType === 'unassigned', "Client identity type is unassigned");
});

// 11 & 12. MCP RESOURCES & PROMPTS
testGroup("11 & 12. MCP Resources & Prompts: Detected as AgentCapability", () => {
  const files = new Map<string, string>();
  files.set('src/mcp_features.ts', `
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
const server = new Server({ name: 'EnterpriseHub' });

server.resource('enterprise_policies', 'policy://all', async () => {});
server.prompt('compliance_review_prompt', 'Generates compliance report', () => {});
  `);

  const { capabilities } = detectCapabilities(files, baseMockSource);
  
  const resourceCap = capabilities.find(c => c.systemType === 'mcp_server' && c.resourceTarget === 'resource:enterprise_policies');
  assert(resourceCap !== undefined, "Found MCP resource capability");
  assert(resourceCap?.action === 'READ', "Resource action is READ");
  assert(resourceCap?.state === 'DECLARED_CAPABILITY', "Resource state is DECLARED_CAPABILITY");

  const promptCap = capabilities.find(c => c.systemType === 'mcp_server' && c.resourceTarget === 'prompt:compliance_review_prompt');
  assert(promptCap !== undefined, "Found MCP prompt capability");
  assert(promptCap?.action === 'EXECUTE', "Prompt action is EXECUTE");
  assert(promptCap?.state === 'DECLARED_CAPABILITY', "Prompt state is DECLARED_CAPABILITY");
});

// 13. MCP TOOL SCHEMA EXTRACTION
testGroup("13. MCP Tool Schema: Statically extracted without arbitrary code execution", () => {
  const files = new Map<string, string>();
  files.set('src/mcp_schema.ts', `
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
const server = new McpServer({ name: 'SchemaServer' });

server.tool('execute_query', { query: 'string', limit: 'number' }, async () => {});
  `);

  const { capabilities } = detectCapabilities(files, baseMockSource);
  const toolCap = capabilities.find(c => c.systemType === 'mcp_server' && c.resourceTarget === 'execute_query');

  assert(toolCap !== undefined, "Found execute_query tool");
  assert(toolCap?.codeSnippet?.includes('schema_keys'), `Schema keys extracted: '${toolCap?.codeSnippet}'`);
  assert(toolCap?.codeSnippet?.includes('query') && toolCap?.codeSnippet?.includes('limit'), "Schema contains 'query' and 'limit'");
});

// 14. PYTHON MCP SDK
testGroup("14. Python MCP SDK: FastMCP, @mcp.tool, @mcp.resource, @mcp.prompt detected", () => {
  const files = new Map<string, string>();
  files.set('server.py', `
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("PythonEnterpriseServer")

@mcp.tool()
def calculate_vat(amount: float, country: str) -> float:
    return amount * 0.20

@mcp.resource("schema://users")
def get_user_schema() -> str:
    return "{}"

@mcp.prompt("audit_prompt")
def generate_audit_prompt() -> str:
    return "Perform audit"
  `);

  const { capabilities } = detectCapabilities(files, baseMockSource);
  const pyMcpCaps = capabilities.filter(c => c.systemType === 'mcp_server');

  assert(pyMcpCaps.length >= 3, `Expected at least 3 Python MCP capabilities, found ${pyMcpCaps.length}`);
  
  const toolCap = pyMcpCaps.find(c => c.resourceTarget === 'calculate_vat');
  assert(toolCap !== undefined, "Found Python @mcp.tool 'calculate_vat'");
  assert(toolCap?.systemName === 'PythonEnterpriseServer', "Python FastMCP server identity captured");
  assert(toolCap?.state === 'DECLARED_CAPABILITY', "Python tool state is DECLARED_CAPABILITY");

  const resCap = pyMcpCaps.find(c => c.resourceTarget === 'resource:schema://users');
  assert(resCap !== undefined, "Found Python @mcp.resource 'schema://users'");

  const promptCap = pyMcpCaps.find(c => c.resourceTarget === 'prompt:audit_prompt');
  assert(promptCap !== undefined, "Found Python @mcp.prompt 'audit_prompt'");
});

// 15. MCP SSE TRANSPORT DETECTION
testGroup("15. MCP SSE Transport: Detected and classified", () => {
  const files = new Map<string, string>();
  files.set('src/mcp_sse.ts', `
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
const server = new McpServer({ name: 'SSEServer' });
  `);

  const { identities } = detectCapabilities(files, baseMockSource);
  const sseIdentity = identities.find(id => id.identityName.startsWith('mcp_transport:sse:'));

  assert(sseIdentity !== undefined, "SSE transport detected in identities");
});

// 16. SHA-256 KNOWN-VECTOR TEST (P0 MANDATORY)
testGroup("16. SHA-256 Known-Vector Verification: Real cryptographic FIPS 180-4 standard", () => {
  // Known vector 1: Empty string ""
  const digestEmpty = sha256Digest("");
  const expectedEmpty = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
  assert(digestEmpty === expectedEmpty, `SHA256("") = ${digestEmpty} (matches ${expectedEmpty})`);

  // Known vector 2: "The quick brown fox jumps over the lazy dog"
  const digestFox = sha256Digest("The quick brown fox jumps over the lazy dog");
  const expectedFox = "d7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592";
  assert(digestFox === expectedFox, `SHA256(fox) = ${digestFox} (matches NIST vector)`);

  // Prefixed output format
  const prefixedHash = computeDeterministicHash("");
  assert(prefixedHash === `SHA256:${expectedEmpty}`, `computeDeterministicHash("") = ${prefixedHash}`);
});

// 17. PROVENANCE PRESERVATION
testGroup("17. Provenance Preservation: Complete file path, line number and scope traceability", () => {
  const files = new Map<string, string>();
  files.set('src/routes/billing.ts', `
import fetch from 'node-fetch';
export async function getInvoice() {
  return fetch('https://api.stripe.com/v1/invoices');
}
  `);

  const { capabilities } = detectCapabilities(files, baseMockSource);
  const stripeCap = capabilities.find(c => c.resourceTarget.includes('stripe.com'));

  assert(stripeCap !== undefined, "Found Stripe capability");
  assert(stripeCap?.filePath === 'src/routes/billing.ts', "filePath preserved");
  assert(stripeCap?.lineNumber !== undefined && stripeCap.lineNumber > 0, `lineNumber preserved (${stripeCap?.lineNumber})`);
  assert(stripeCap?.scope === 'production', "scope preserved as production");
  assert(stripeCap?.provenance?.primaryScope === 'production', "provenance.primaryScope preserved");
  assert(stripeCap?.provenance?.filePaths.includes('src/routes/billing.ts') === true, "provenance.filePaths includes source file");
});

// 18. EPISTEMIC INVARIANTS: OBSERVED != AUTHORIZED
testGroup("18. Epistemic Invariants: Discovery never manufactures authorization", () => {
  const files = new Map<string, string>();
  files.set('src/test_agent.ts', `
import fetch from 'node-fetch';
import OpenAI from 'openai';

const openai = new OpenAI();
fetch('https://api.internal.bank.com/transfer');
openai.chat.completions.create({ model: 'gpt-4o', messages: [] });
  `);

  const { capabilities } = detectCapabilities(files, baseMockSource);

  // Invariant: Unauthenticated calls are OBSERVED_CAPABILITY, never AUTHORIZED_CAPABILITY
  const unauthCaps = capabilities.filter(c => c.state === 'OBSERVED_CAPABILITY');
  assert(unauthCaps.length >= 2, "Unauthenticated calls preserved as OBSERVED_CAPABILITY");
  assert(unauthCaps.every(c => c.authorizationEvidence === undefined), "No authorization evidence manufactured");
  assert(unauthCaps.every(c => c.anomalies.includes('OBSERVED_WITHOUT_VERIFIED_AUTH')), "Explicitly marked OBSERVED_WITHOUT_VERIFIED_AUTH");
});

console.log("==================================================================");
console.log(`>>> ALL ${testCount} TEST GROUPS PASSED WITH ZERO REGRESSIONS <<<`);
console.log("==================================================================");
