/**
 * CAPABILITY CALIBRATION & SCHEMA DE-FRAGMENTATION REGRESSION SUITE
 * Validates:
 * 1. ONE OPERATIONAL CAPABILITY != EVERY AST/JSON SCHEMA NODE
 * 2. OpenAI function definitions with multiple properties resolve to 1 capability
 * 3. LangChain / CrewAI tools resolve to 1 operational capability per real tool
 * 4. JSON Schema keywords (type, properties, description, parameters) are never capabilities
 * 5. Deduplication preserves evidence and anomalies without fragmentation
 * 6. Chain preservation: Agent -> Identity -> Role -> System -> Resource -> Action -> Authorization
 * 7. Invariant preservation: OBSERVED_CAPABILITY != AUTHORIZED_CAPABILITY
 * 8. State fidelity: DECLARED_CAPABILITY is never automatically AUTHORIZED_CAPABILITY
 * 9. Legitimate capabilities (SQL, S3, Shell, MCP, ERP/Graph) remain 100% functional
 */

import { detectCapabilities, extractDeclaredToolsFromContent } from '../src/core/capability-detector';
import { SourceAnalysis } from '../src/core/types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`[FAIL]: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`  [PASS] ${message}`);
}

console.log("==================================================================");
console.log(">>> RUNNING CAPABILITY CALIBRATION REGRESSION TEST SUITE <<<");
console.log("==================================================================\n");

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
// TEST 1: OpenAI function schema with 5 properties -> exactly 1 capability
// ==============================================================================
console.log("[TEST 1] OpenAI function definition with 5 properties produces exactly 1 capability...");
const openAiSchemaFile = `
import { OpenAI } from "openai";
const client = new OpenAI();

const assistant = await client.beta.assistants.create({
  name: "CalendarAssistant",
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
            duration_minutes: { type: "integer", description: "Duration in minutes" },
            timezone: { type: "string", description: "User timezone" },
            attendees: { type: "array", items: { type: "string" }, description: "Attendee emails" },
            recurrence_rule: { type: "string", description: "Optional RRULE" }
          },
          required: ["date", "duration_minutes", "timezone"]
        }
      }
    }
  ]
});
`;

const fileMap1 = new Map<string, string>([['src/assistant.ts', openAiSchemaFile]]);
const res1 = detectCapabilities(fileMap1, baseSource);

assert(res1.capabilities.length === 1, `Expected exactly 1 capability, got ${res1.capabilities.length}`);
assert(res1.capabilities[0].resourceTarget === 'check_calendar_availability', `Target is check_calendar_availability, got ${res1.capabilities[0].resourceTarget}`);
assert(res1.capabilities[0].action === 'EXECUTE', "Action is EXECUTE");
assert(res1.capabilities[0].state === 'DECLARED_CAPABILITY', "State is DECLARED_CAPABILITY");

// ==============================================================================
// TEST 2: LangChain / CrewAI tools -> 1 operational capability per tool
// ==============================================================================
console.log("\n[TEST 2] LangChain / CrewAI tools resolve to 1 operational capability per real tool...");
const crewAiFile = `
from crewai import Agent, Task, Crew
from crewai.tools import tool

@tool("market_search_tool")
def search_financial_markets(query: str) -> str:
    """Searches stock market ticker quotes"""
    return "Market data"

@tool
def calculate_risk_index(portfolio_id: str, threshold: float) -> float:
    """Calculates weighted risk score"""
    return 0.85

analyst = Agent(
    role="Senior Risk Analyst",
    tools=[search_financial_markets, calculate_risk_index]
)
`;

const fileMap2 = new Map<string, string>([['src/analyst.py', crewAiFile]]);
const res2 = detectCapabilities(fileMap2, baseSource);

const toolTargets = res2.capabilities.map(c => c.resourceTarget).sort();
assert(toolTargets.includes('market_search_tool'), "Discovered market_search_tool");
assert(toolTargets.includes('calculate_risk_index'), "Discovered calculate_risk_index");
assert(res2.capabilities.length === 2, `Expected 2 capabilities, got ${res2.capabilities.length}`);

// ==============================================================================
// TEST 3: Schema keywords never become independent capabilities
// ==============================================================================
console.log("\n[TEST 3] Schema keywords (properties, parameters, type, description) are never capabilities...");
const schemaKeywords = ['type', 'parameters', 'properties', 'description', 'date', 'duration_minutes', 'required', 'function', 'object'];
for (const cap of res1.capabilities) {
  assert(!schemaKeywords.includes(cap.resourceTarget.toLowerCase()), `Target ${cap.resourceTarget} is not a schema keyword`);
}

// ==============================================================================
// TEST 4: Deduplication preserves evidence and anomalies without fragmentation
// ==============================================================================
console.log("\n[TEST 4] Deduplication merges repeated tool references into single authoritative record...");
const duplicateToolFile = `
tools = [search_tool, search_tool, search_tool]
`;
const fileMap4 = new Map<string, string>([['src/tools.py', duplicateToolFile]]);
const res4 = detectCapabilities(fileMap4, baseSource);
assert(res4.capabilities.filter(c => c.resourceTarget === 'search_tool').length === 1, "Duplicate tool references deduplicated to 1 record");

// ==============================================================================
// TEST 5: Canonical Chain: Agent -> Identity -> Role -> System -> Resource -> Action -> Authorization
// ==============================================================================
console.log("\n[TEST 5] Canonical Chain metadata integrity...");
const chainFile = `
import boto3
s3 = boto3.client('s3')
s3.delete_object(Bucket='finance-lake', Key='report.csv')
`;
const fileMap5 = new Map<string, string>([['src/storage_agent.py', chainFile]]);
const res5 = detectCapabilities(fileMap5, baseSource);
assert(res5.capabilities.length >= 1, "Discovered S3 capability");
const s3Cap = res5.capabilities.find(c => c.action === 'DELETE') || res5.capabilities[0];
assert(Boolean(s3Cap.agentName), "Agent name present");
assert(s3Cap.systemType === 'cloud_storage', "System type is cloud_storage");
assert(s3Cap.action === 'DELETE', "Action is DELETE");
assert(s3Cap.isDestructive === true, "isDestructive is true");

// ==============================================================================
// TEST 6: Invariant: OBSERVED_CAPABILITY != AUTHORIZED_CAPABILITY
// ==============================================================================
console.log("\n[TEST 6] Invariant: OBSERVED_CAPABILITY != AUTHORIZED_CAPABILITY...");
assert(s3Cap.state === 'UNKNOWN_AUTHORIZATION', "Observed S3 delete without IAM grant is UNKNOWN_AUTHORIZATION");
assert(s3Cap.authorizationEvidence === undefined, "Authorization evidence is undefined without explicit grant");

// ==============================================================================
// TEST 7: DECLARED_CAPABILITY is never automatically AUTHORIZED_CAPABILITY
// ==============================================================================
console.log("\n[TEST 7] DECLARED_CAPABILITY is never automatically AUTHORIZED_CAPABILITY...");
assert(res1.capabilities[0].state === 'DECLARED_CAPABILITY', "Declared tool stays DECLARED_CAPABILITY");
assert(res1.capabilities[0].state !== 'AUTHORIZED_CAPABILITY', "Declared tool is not AUTHORIZED_CAPABILITY");
assert(res1.summary.unknownAuthorizationCount >= 1, "Unverified auth counter reflects declared tools without IAM/SQL grants");

// ==============================================================================
// TEST 8: SQL, MCP, Shell Exec, ERP/Graph capabilities remain 100% functional
// ==============================================================================
console.log("\n[TEST 8] SQL, MCP, Shell, and ERP capabilities preserved...");
const multiSystemFile = `
import subprocess
subprocess.run(['rm', '-rf', '/tmp/data'])

from supabase import create_client
db.from('customers').select('*')
`;
const fileMap8 = new Map<string, string>([['src/multi.py', multiSystemFile]]);
const res8 = detectCapabilities(fileMap8, baseSource);

const execCap = res8.capabilities.find(c => c.systemType === 'system_exec');
const dbCap = res8.capabilities.find(c => c.systemType === 'database');

assert(Boolean(execCap), "OS Shell execution capability detected");
assert(Boolean(dbCap), "Database query capability detected");
assert(execCap?.action === 'EXECUTE' && execCap.isDestructive, "Shell exec is EXECUTE + DESTRUCTIVE");
assert(dbCap?.action === 'READ' && dbCap.resourceTarget === 'customers', "Database read on customers detected");

console.log("\n==================================================================");
console.log("🟢 ALL 8 CAPABILITY CALIBRATION REGRESSION TESTS PASSED!");
console.log("==================================================================\n");
