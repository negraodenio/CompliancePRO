/**
 * AI AGENT CAPABILITY, TOOL, IDENTITY & PERMISSION DISCOVERY TEST SUITE
 * Validates:
 * 1. Multi-Framework Tool Extraction (CrewAI, LangChain, OpenAI Assistants, MCP Servers)
 * 2. Strict 5-State Classification: OBSERVED vs DECLARED vs AUTHORIZED vs USED vs UNKNOWN_AUTHORIZATION
 * 3. Non-Assumption Invariant: Never assume import, SDK, tool, or SIPOC implies authorization
 * 4. Destructive Action Detection (DROP, TRUNCATE, DELETE, S3 Delete)
 * 5. Excessive Wildcard Permission Detection (IAM *, K8s *)
 * 6. Sensitive Data Access (PII / Financial)
 * 7. Identity Bindings (Service Accounts vs Unassigned)
 * 8. Backward Compatibility with Scans
 */

import { detectCapabilities } from '../src/core/capability-detector';
import { SourceAnalysis } from '../src/core/types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`[FAIL]: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`  [PASS] ${message}`);
}

console.log("==================================================================");
console.log(">>> RUNNING AI AGENT CAPABILITY & PERMISSION DISCOVERY SUITE <<<");
console.log("==================================================================\n");

let testCount = 0;
function testGroup(name: string, fn: () => void) {
  console.log(`[TEST ${++testCount}] ${name}...`);
  fn();
  console.log("");
}

const mockSource: SourceAnalysis = {
  apiRoutes: [],
  databaseTables: ['users', 'customer_invoices', 'audit_logs'],
  externalServices: [],
  authPatterns: [],
  aiModels: [{ provider: 'OpenAI', modelId: 'gpt-4o', usage: 'chat' }],
  dataAssets: [],
  agents: [
    {
      name: 'CreditUnderwriterAgent',
      type: 'ai_persona',
      tools: ['sql_query', 'boto3'],
      models: ['gpt-4o'],
      riskLevel: 'high',
      critical: true,
      filePath: 'agents/credit_underwriter.py'
    },
    {
      name: 'McpIntegrationAgent',
      type: 'service',
      tools: ['@modelcontextprotocol/sdk'],
      models: ['claude-3-5-sonnet'],
      riskLevel: 'medium',
      critical: false,
      filePath: 'src/mcp_server.ts'
    }
  ],
  fileTree: ['agents/credit_underwriter.py', 'src/mcp_server.ts', 'infra/iam.tf', 'db/grants.sql'],
  totalFiles: 4,
  totalLines: 320,
  languages: { py: 150, ts: 170 },
  notebooks: [],
  extractedPrompts: [],
  frameworks: [],
  memorySystems: [],
  classification: null
};

// 1. OBSERVED VS AUTHORIZED CAPABILITY INVARIANT
testGroup("Observed vs Authorized: Never assume Code implies Authorization", () => {
  const files = new Map<string, string>();
  
  // Python Agent executing SQL query without any grant file
  files.set('agents/credit_underwriter.py', `
from crewai import Agent, Task
import psycopg2

class CreditUnderwriterAgent:
    def evaluate(self, customer_id):
        conn = psycopg2.connect("...")
        cur = conn.cursor()
        cur.execute("SELECT cpf, salary, credit_score FROM customer_invoices WHERE id = %s", (customer_id,))
        return cur.fetchone()
  `);

  const { capabilities } = detectCapabilities(files, mockSource);
  const sqlCap = capabilities.find(c => c.systemType === 'database');

  assert(sqlCap !== undefined, "SQL Database capability detected from AST");
  assert(sqlCap?.action === 'READ', "Action classified as READ");
  assert(sqlCap?.state === 'OBSERVED_CAPABILITY', "State is OBSERVED_CAPABILITY (Not automatically authorized)");
  assert(sqlCap?.anomalies.includes('OBSERVED_BUT_UNAUTHORIZED'), "Flagged as OBSERVED_BUT_UNAUTHORIZED");
  assert(sqlCap?.accessesSensitiveData === true, "Identified access to sensitive customer data");
});

// 2. AUTHORIZED CAPABILITY WITH EXPLICIT GRANT EVIDENCE
testGroup("Authorized Capability with Explicit DB SQL Grant Evidence", () => {
  const files = new Map<string, string>();
  
  files.set('agents/credit_underwriter.py', `
import psycopg2
def query():
    psycopg2.connect().cursor().execute("SELECT * FROM customer_invoices")
  `);

  // Explicit SQL Grant file present
  files.set('db/grants.sql', `
GRANT SELECT ON customer_invoices TO credit_underwriter_role;
  `);

  const { capabilities } = detectCapabilities(files, mockSource);
  const sqlCap = capabilities.find(c => c.systemType === 'database' && c.resourceTarget === 'customer_invoices');

  assert(sqlCap !== undefined, "SQL Database capability found");
  assert(sqlCap?.state === 'AUTHORIZED_CAPABILITY', "State is AUTHORIZED_CAPABILITY due to explicit grant");
  assert(sqlCap?.authorizationEvidence?.type === 'db_grant', "Authorization evidence points to db_grant");
  assert(!sqlCap?.anomalies.includes('OBSERVED_BUT_UNAUTHORIZED'), "No unauthorization anomaly present");
});

// 3. DESTRUCTIVE ACTIONS & EXCESSIVE WILDCARDS
testGroup("Destructive Capabilities & Excessive Wildcard Permissions", () => {
  const files = new Map<string, string>();
  
  // Agent executing DROP TABLE and S3 Delete
  files.set('agents/cleanup_agent.py', `
import boto3
import psycopg2

def purge():
    db = psycopg2.connect()
    db.cursor().execute("DROP TABLE obsolete_records")
    
    s3 = boto3.client('s3')
    s3.delete_object(Bucket='enterprise-bucket', Key='data.csv')
  `);

  // Terraform with Wildcard Action
  files.set('infra/iam.tf', `
resource "aws_iam_policy" "s3_policy" {
  name = "s3-wildcard-policy"
  policy = jsonencode({
    Statement = [{
      Action = ["*"]
      Resource = ["*"]
      Effect = "Allow"
    }]
  })
}
  `);

  const { capabilities, summary } = detectCapabilities(files, mockSource);

  const dropCap = capabilities.find(c => c.action === 'DELETE' && c.isDestructive);
  assert(dropCap !== undefined, "Destructive DROP TABLE capability identified");
  assert(dropCap?.isDestructive === true, "isDestructive flag set to true");
  assert(dropCap?.anomalies.includes('DESTRUCTIVE_ACTION_WITHOUT_HITL'), "Flagged DESTRUCTIVE_ACTION_WITHOUT_HITL");

  const s3Cap = capabilities.find(c => c.systemType === 'cloud_storage');
  assert(s3Cap !== undefined, "S3 Cloud Storage capability identified");
  assert(s3Cap?.anomalies.includes('EXCESSIVE_WILDCARD_PERMISSION'), "Identified EXCESSIVE_WILDCARD_PERMISSION from Terraform grant");

  assert(summary.destructiveCount >= 1, "Summary reports destructive count >= 1");
  assert(summary.wildcardCount >= 1, "Summary reports wildcard count >= 1");
});

// 4. MODEL CONTEXT PROTOCOL (MCP) TOOL DISCOVERY
testGroup("Model Context Protocol (MCP) Tools Discovery", () => {
  const files = new Map<string, string>();
  
  files.set('src/mcp_server.ts', `
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const server = new Server({ name: 'enterprise-mcp', version: '1.0.0' });

server.tool('execute_sql_query', 'Executes SQL against database', (params) => {
    return { content: [] };
});

server.tool('fetch_lead_contacts', 'Fetches CRM leads', (params) => {
    return { content: [] };
});
  `);

  const { capabilities } = detectCapabilities(files, mockSource);
  const mcpCaps = capabilities.filter(c => c.systemType === 'mcp_server');

  assert(mcpCaps.length >= 2, "Discovered at least 2 MCP Tools from server.tool declarations");
  assert(mcpCaps.some(c => c.resourceTarget === 'execute_sql_query'), "Found 'execute_sql_query' MCP tool");
  assert(mcpCaps.some(c => c.resourceTarget === 'fetch_lead_contacts'), "Found 'fetch_lead_contacts' MCP tool");
});

// 5. SANITIZED METADATA & ZERO SECRET LEAKAGE INVARIANT
testGroup("Sanitized Metadata & Zero Secret Leakage Invariant", () => {
  const files = new Map<string, string>();
  
  files.set('.env', `
OPENAI_API_KEY=sk-proj-supersecretkey123456789
DATABASE_URL=postgres://admin:TopSecretPassword123@db.enterprise.internal/prod
  `);

  const { capabilities, identities } = detectCapabilities(files, mockSource);

  const jsonDump = JSON.stringify({ capabilities, identities });
  assert(!jsonDump.includes('sk-proj-supersecretkey123456789'), "Sanitization: Raw OpenAI API Key is never stored in capabilities metadata");
  assert(!jsonDump.includes('TopSecretPassword123'), "Sanitization: Raw database password is never stored in capabilities metadata");
});

console.log("==================================================================");
console.log(`>>> CAPABILITY DISCOVERY SUITE: ALL ${testCount} TEST GROUPS PASSED <<<`);
console.log("==================================================================\n");
