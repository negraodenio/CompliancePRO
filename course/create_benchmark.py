import os

benchmark_code = """/**
 * CG-AG GOVERNANCE OS — OFFICIAL CAPABILITY CALIBRATION BENCHMARK SUITE
 * Permanent Reference Benchmark & Regression Suite for Capability Discovery
 * 
 * Invariants Tested & Enforced:
 * 1. REAL OPERATIONAL CAPABILITY != AST / JSON SCHEMA NODE
 * 2. OBSERVED_CAPABILITY != AUTHORIZED_CAPABILITY
 * 3. DECLARED_CAPABILITY != AUTHORIZED_CAPABILITY
 * 4. Absence of Authorization Evidence != Authorized
 * 5. Deduplication preserves evidence without losing provenance
 * 
 * 18 Official Benchmark Cases:
 * 01 — OpenAI Function Schema
 * 02 — Anthropic/Bedrock Tool Schema
 * 03 — LangChain @tool
 * 04 — CrewAI Tool
 * 05 — AutoGen Tool
 * 06 — MCP Tool
 * 07 — PostgreSQL capability
 * 08 — S3 / Cloud Storage capability
 * 09 — Shell / system execution
 * 10 — OAuth scope evidence
 * 11 — IAM policy evidence
 * 12 — Database GRANT evidence
 * 13 — Duplicate Tool References
 * 14 — Nested JSON Schema
 * 15 — Mixed Framework Repository
 * 16 — Multiple Agents Sharing Tools
 * 17 — Tool Alias Resolution
 * 18 — Large/Mixed Repository
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
console.log(">>> CG-AG CAPABILITY DISCOVERY OFFICIAL BENCHMARK SUITE (18 CASES) <<<");
console.log("==================================================================\\n");

const baseSource: SourceAnalysis = {
  agents: [],
  aiModels: [],
  dataAssets: [],
  externalServices: [],
  memorySystems: [],
  frameworks: [],
  apiRoutes: [],
  authPatterns: [],
  databaseTables: [],
  notebooks: []
};

// ==============================================================================
// CASE 01: OpenAI Function Schema
// ==============================================================================
console.log("[CASE 01] OpenAI Function Schema with multi-level parameters...");
const case01Code = `
import { OpenAI } from "openai";
const client = new OpenAI();
const assistant = await client.beta.assistants.create({
  name: "MeetingScheduler",
  model: "gpt-4o",
  tools: [
    {
      type: "function",
      function: {
        name: "check_calendar_availability",
        description: "Check calendar for available time slots across timezones",
        parameters: {
          type: "object",
          properties: {
            date: { type: "string", description: "Date in YYYY-MM-DD" },
            duration_minutes: { type: "integer", description: "Meeting duration" },
            timezone: { type: "string" }
          },
          required: ["date", "duration_minutes"]
        }
      }
    }
  ]
});
`;
const res01 = detectCapabilities(new Map([['assistant.ts', case01Code]]), baseSource);
assert(res01.capabilities.length === 1, `Expected exactly 1 capability, got ${res01.capabilities.length}`);
assert(res01.capabilities[0].resourceTarget === 'check_calendar_availability', "Resolved operational tool name");
assert(res01.capabilities[0].action === 'EXECUTE', "Action is EXECUTE");
assert(res01.capabilities[0].state === 'DECLARED_CAPABILITY', "State is DECLARED_CAPABILITY");

// ==============================================================================
// CASE 02: Anthropic / Bedrock Tool Schema
// ==============================================================================
console.log("\\n[CASE 02] Anthropic/Bedrock Tool Schema with input_schema...");
const case02Code = `
const tools = [
  {
    name: "get_market_ticker",
    description: "Fetch live ticker data",
    input_schema: {
      type: "object",
      properties: {
        ticker: { type: "string" },
        interval: { type: "string", enum: ["1m", "5m", "1d"] }
      },
      required: ["ticker"]
    }
  }
];
`;
const res02 = detectCapabilities(new Map([['anthropic_agent.ts', case02Code]]), baseSource);
assert(res02.capabilities.length === 1, `Expected 1 capability, got ${res02.capabilities.length}`);
assert(res02.capabilities[0].resourceTarget === 'get_market_ticker', "Discovered get_market_ticker");

// ==============================================================================
// CASE 03: LangChain @tool
// ==============================================================================
console.log("\\n[CASE 03] LangChain @tool decorator...");
const case03Code = `
from langchain_core.tools import tool

@tool
def calculate_vat_tax(amount: float, country_code: str) -> float:
    \"\"\"Calculates VAT tax based on country code\"\"\"
    return amount * 0.23
`;
const res03 = detectCapabilities(new Map([['vat_tool.py', case03Code]]), baseSource);
assert(res03.capabilities.length === 1, `Expected 1 capability, got ${res03.capabilities.length}`);
assert(res03.capabilities[0].resourceTarget === 'calculate_vat_tax', "Discovered calculate_vat_tax");

// ==============================================================================
// CASE 04: CrewAI Tool
// ==============================================================================
console.log("\\n[CASE 04] CrewAI Tool decorator & agent assignment...");
const case04Code = `
from crewai import Agent, Task
from crewai.tools import tool

@tool("web_intelligence_search")
def search_web_intelligence(query: str) -> str:
    \"\"\"Search deep intelligence sources\"\"\"
    return "Intel"

researcher = Agent(role="Intel Lead", tools=[search_web_intelligence])
`;
const res04 = detectCapabilities(new Map([['crew_agent.py', case04Code]]), baseSource);
assert(res04.capabilities.length === 1, `Expected 1 capability, got ${res04.capabilities.length}`);
assert(res04.capabilities[0].resourceTarget === 'web_intelligence_search', "Discovered web_intelligence_search");

// ==============================================================================
// CASE 05: AutoGen Tool
// ==============================================================================
console.log("\\n[CASE 05] AutoGen Tool registration...");
const case05Code = `
from autogen import register_function

def execute_sql_query(query: str) -> list:
    return []

register_function(execute_sql_query, caller=assistant, executor=user_proxy, name="sql_query_tool")
`;
const res05 = detectCapabilities(new Map([['autogen_agent.py', case05Code]]), baseSource);
assert(res05.capabilities.length === 1, `Expected 1 capability, got ${res05.capabilities.length}`);
assert(res05.capabilities[0].resourceTarget === 'sql_query_tool' || res05.capabilities[0].resourceTarget === 'execute_sql_query', "Discovered AutoGen tool");

// ==============================================================================
// CASE 06: MCP Tool (Model Context Protocol)
// ==============================================================================
console.log("\\n[CASE 06] MCP Tool discovery...");
const case06Code = `
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
const server = new Server({ name: "postgres-mcp", version: "1.0.0" });
server.tool("mcp_postgres_query", { sql: z.string() }, async ({ sql }) => {});
`;
const res06 = detectCapabilities(new Map([['mcp_server.ts', case06Code]]), baseSource);
assert(res06.capabilities.length === 1, `Expected 1 MCP capability, got ${res06.capabilities.length}`);
assert(res06.capabilities[0].systemType === 'mcp_server', "System type is mcp_server");
assert(res06.capabilities[0].resourceTarget === 'mcp_postgres_query', "Target is mcp_postgres_query");

// ==============================================================================
// CASE 07: PostgreSQL capability
// ==============================================================================
console.log("\\n[CASE 07] PostgreSQL write capability...");
const case07Code = `
import { db } from './db';
await db.from('customer_ledger').insert({ customer_id: '123', amount: 500 });
`;
const res07 = detectCapabilities(new Map([['ledger.ts', case07Code]]), baseSource);
assert(res07.capabilities.length === 1, `Expected 1 DB capability, got ${res07.capabilities.length}`);
assert(res07.capabilities[0].systemType === 'database', "System type is database");
assert(res07.capabilities[0].action === 'WRITE', "Action is WRITE");
assert(res07.capabilities[0].resourceTarget === 'customer_ledger', "Target is customer_ledger");

// ==============================================================================
// CASE 08: S3 / Cloud Storage capability
// ==============================================================================
console.log("\\n[CASE 08] AWS S3 Cloud Storage delete capability...");
const case08Code = `
import boto3
s3 = boto3.client('s3')
s3.delete_object(Bucket='confidential-bucket', Key='data.csv')
`;
const res08 = detectCapabilities(new Map([['s3_cleaner.py', case08Code]]), baseSource);
const s3Cap = res08.capabilities.find(c => c.action === 'DELETE');
assert(Boolean(s3Cap), "Discovered S3 DELETE capability");
assert(s3Cap?.isDestructive === true, "isDestructive is true");
assert(s3Cap?.systemType === 'cloud_storage', "System type is cloud_storage");

// ==============================================================================
// CASE 09: Shell / System Execution capability
// ==============================================================================
console.log("\\n[CASE 09] Shell / OS Command Execution...");
const case09Code = `
import subprocess
subprocess.run(['rm', '-rf', '/var/log/app'])
`;
const res09 = detectCapabilities(new Map([['cleanup.py', case09Code]]), baseSource);
assert(res09.capabilities.length === 1, `Expected 1 shell capability, got ${res09.capabilities.length}`);
assert(res09.capabilities[0].systemType === 'system_exec', "System type is system_exec");
assert(res09.capabilities[0].action === 'EXECUTE', "Action is EXECUTE");
assert(res09.capabilities[0].isDestructive === true, "isDestructive is true");

// ==============================================================================
// CASE 10: OAuth Scope Evidence Matching
// ==============================================================================
console.log("\\n[CASE 10] OAuth Scope Grant Matching...");
const case10Grant = `scope = "https://graph.microsoft.com/Mail.Read"`;
const case10Code = `fetch("https://graph.microsoft.com/v1.0/me/messages")`;
const res10 = detectCapabilities(new Map([['auth.py', case10Grant], ['mail.ts', case10Code]]), baseSource);
const officeCap = res10.capabilities.find(c => c.systemType === 'office_365');
assert(Boolean(officeCap), "Discovered Microsoft 365 capability");
assert(officeCap?.state === 'AUTHORIZED_CAPABILITY', "Authorized via OAuth scope grant");
assert(officeCap?.authorizationEvidence?.type === 'oauth_scope', "Evidence type is oauth_scope");

// ==============================================================================
// CASE 11: IAM Policy Evidence Matching & Wildcard Anomaly
// ==============================================================================
console.log("\\n[CASE 11] IAM Policy Evidence & Wildcard Anomaly...");
const case11Tf = `
resource "aws_iam_role_policy" "s3_full" {
  name = "s3_full_access"
  policy = jsonencode({
    Statement = [{
      Action = ["*"]
      Resource = ["*"]
      Effect = "Allow"
    }]
  })
}
`;
const case11Code = `import boto3\ns3 = boto3.client('s3')\ns3.delete_object(Bucket='b', Key='k')`;
const res11 = detectCapabilities(new Map([['main.tf', case11Tf], ['agent.py', case11Code]]), baseSource);
const wildcardS3 = res11.capabilities.find(c => c.systemType === 'cloud_storage');
assert(Boolean(wildcardS3), "S3 capability detected");
assert(wildcardS3?.state === 'AUTHORIZED_CAPABILITY', "State is AUTHORIZED_CAPABILITY");
assert(wildcardS3?.anomalies.includes('EXCESSIVE_WILDCARD_PERMISSION'), "Flagged EXCESSIVE_WILDCARD_PERMISSION anomaly");

// ==============================================================================
// CASE 12: Database GRANT Evidence Matching
// ==============================================================================
console.log("\\n[CASE 12] Database SQL GRANT Matching...");
const case12Sql = `GRANT SELECT ON orders TO app_user;`;
const case12Code = `db.from('orders').select('*')`;
const res12 = detectCapabilities(new Map([['schema.sql', case12Sql], ['query.ts', case12Code]]), baseSource);
const dbCap = res12.capabilities.find(c => c.resourceTarget === 'orders');
assert(Boolean(dbCap), "Discovered orders DB capability");
assert(dbCap?.state === 'AUTHORIZED_CAPABILITY', "State is AUTHORIZED_CAPABILITY");
assert(dbCap?.authorizationEvidence?.type === 'db_grant', "Evidence type is db_grant");

// ==============================================================================
// CASE 13: Duplicate Tool References Deduplication
// ==============================================================================
console.log("\\n[CASE 13] Duplicate Tool References Deduplication...");
const case13Code = `
from crewai import Agent
tools = [search_tool, search_tool, search_tool]
agent = Agent(role="Searcher", tools=[search_tool])
`;
const res13 = detectCapabilities(new Map([['search.py', case13Code]]), baseSource);
assert(res13.capabilities.filter(c => c.resourceTarget === 'search_tool').length === 1, "Duplicate tool references resolved to 1 record");

// ==============================================================================
// CASE 14: Deeply Nested JSON Schema
// ==============================================================================
console.log("\\n[CASE 14] Deeply Nested JSON Schema without node pollution...");
const case14Code = `
tools = [{
  "type": "function",
  "function": {
    "name": "complex_nested_tool",
    "parameters": {
      "type": "object",
      "properties": {
        "level1": {
          "type": "object",
          "properties": {
            "level2": {
              "type": "object",
              "properties": {
                "level3": { "type": "string" }
              }
            }
          }
        }
      }
    }
  }
}]
`;
const res14 = detectCapabilities(new Map([['nested.py', case14Code]]), baseSource);
assert(res14.capabilities.length === 1, `Expected 1 capability, got ${res14.capabilities.length}`);
assert(res14.capabilities[0].resourceTarget === 'complex_nested_tool', "Target is complex_nested_tool");

// ==============================================================================
// CASE 15: Mixed Framework Repository
// ==============================================================================
console.log("\\n[CASE 15] Mixed Framework Repository (LangChain + CrewAI + S3 + SQL)...");
const res15 = detectCapabilities(new Map([
  ['crew.py', case04Code],
  ['langchain.py', case03Code],
  ['storage.py', case08Code],
  ['db.ts', case07Code]
]), baseSource);
assert(res15.capabilities.length >= 4, `Expected at least 4 capabilities, got ${res15.capabilities.length}`);
const systemTypes = new Set(res15.capabilities.map(c => c.systemType));
assert(systemTypes.has('llm_service'), "Discovered llm_service");
assert(systemTypes.has('cloud_storage'), "Discovered cloud_storage");
assert(systemTypes.has('database'), "Discovered database");

// ==============================================================================
// CASE 16: Multiple Agents Sharing Tools
// ==============================================================================
console.log("\\n[CASE 16] Multiple Agents Sharing Tools...");
const sourceWithAgents: SourceAnalysis = {
  ...baseSource,
  agents: [
    { name: 'AgentAlpha', type: 'ai_persona', tools: [], models: [], riskLevel: 'medium', critical: false, framework: 'CrewAI', oversightLevel: 'l2', isAutonomous: false, confidence: 90, filePath: 'alpha.py' },
    { name: 'AgentBeta', type: 'ai_persona', tools: [], models: [], riskLevel: 'medium', critical: false, framework: 'CrewAI', oversightLevel: 'l2', isAutonomous: false, confidence: 90, filePath: 'beta.py' }
  ]
};
const res16 = detectCapabilities(new Map([
  ['alpha.py', 'tools = [shared_calculator]'],
  ['beta.py', 'tools = [shared_calculator]']
]), sourceWithAgents);
assert(res16.capabilities.length === 2, `Expected 2 capabilities (1 per agent), got ${res16.capabilities.length}`);
assert(res16.capabilities.some(c => c.agentName === 'AgentAlpha'), "Bound to AgentAlpha");
assert(res16.capabilities.some(c => c.agentName === 'AgentBeta'), "Bound to AgentBeta");

// ==============================================================================
// CASE 17: Tool Alias Resolution
// ==============================================================================
console.log("\\n[CASE 17] Tool Alias Resolution...");
const case17Code = `
@tool("enterprise_payment_gateway")
def process_charge(card_id: str, amount: float):
    pass

agent = Agent(tools=[process_charge])
`;
const res17 = detectCapabilities(new Map([['pay.py', case17Code]]), baseSource);
assert(res17.capabilities.length === 1, "Expected 1 capability");
assert(res17.capabilities[0].resourceTarget === 'enterprise_payment_gateway', "Resolved to alias enterprise_payment_gateway");

// ==============================================================================
// CASE 18: Large / Complex Repository Performance & Precision
// ==============================================================================
console.log("\\n[CASE 18] Large / Complex Repository Precision...");
const largeMap = new Map<string, string>();
for (let i = 0; i < 25; i++) {
  largeMap.set(`module_${i}.py`, `
from crewai import Agent
from langchain_core.tools import tool

@tool("tool_service_${i}")
def execute_service_${i}():
    pass

agent = Agent(role="Agent_${i}", tools=[execute_service_${i}])
`);
}
const res18 = detectCapabilities(largeMap, baseSource);
assert(res18.capabilities.length === 25, `Expected exactly 25 capabilities, got ${res18.capabilities.length}`);
assert(res18.summary.totalCapabilities === 25, "Summary total matches 25");
assert(res18.summary.unknownAuthorizationCount === 25, "Unverified auth counter reflects all 25 unverified tools");

console.log("\\n==================================================================");
console.log("🟢 ALL 18 OFFICIAL CAPABILITY BENCHMARK CASES PASSED PERFECTLY!");
console.log("==================================================================\\n");
"""

with open('../tests/capability-calibration-benchmark.test.ts', 'w', encoding='utf-8') as f:
    f.write(benchmark_code)

print('Created tests/capability-calibration-benchmark.test.ts')
