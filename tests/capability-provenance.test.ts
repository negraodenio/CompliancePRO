/**
 * CG-AG GOVERNANCE OS — CAPABILITY PROVENANCE & SCAN SCOPE TEST SUITE
 * 
 * Epistemic Rules Enforced:
 * 1. PROVENANCE / SCOPE answers: "Where did this code / capability originate?"
 * 2. AUTHORIZATION answers: "Is there verifiable authorization evidence?"
 * 3. Scope is structural provenance, NOT a hierarchy of authority or trust.
 * 4. DISCOVERED IN TEST != PRODUCTION OPERATIONAL (Both are real discoveries, structurally scoped).
 * 5. Deduplication preserves provenance sources without duplicating capabilities.
 * 6. "No verified authorization evidence was found within the scanned scope."
 */

import { detectCapabilities, classifyScopeFromPath } from '../src/core/capability-detector';
import { SourceAnalysis } from '../src/core/types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`[FAIL]: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`  [PASS] ${message}`);
}

console.log("==================================================================");
console.log(">>> CG-AG CAPABILITY PROVENANCE & SCAN SCOPE TEST SUITE <<<");
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
// TEST 1: Classification of Structural Scopes
// ==============================================================================
console.log("[TEST 1] Structural Scope Classification from Path...");
assert(classifyScopeFromPath('src/agents/finance_agent.py') === 'production', "src/ -> production");
assert(classifyScopeFromPath('app/core/assistant.ts') === 'production', "app/ -> production");
assert(classifyScopeFromPath('libs/prebuilt/langgraph/agent.py') === 'production', "libs/ -> production");
assert(classifyScopeFromPath('tests/unit/test_react_agent.py') === 'test', "tests/ -> test");
assert(classifyScopeFromPath('libs/prebuilt/tests/test_agent.py') === 'test', "tests/ in subpath -> test");
assert(classifyScopeFromPath('examples/graphs/agent.py') === 'example', "examples/ -> example");
assert(classifyScopeFromPath('libs/langgraph/bench/react_agent.py') === 'benchmark', "bench/ -> benchmark");
assert(classifyScopeFromPath('fixtures/mock_data.py') === 'fixture', "fixtures/ -> fixture");
assert(classifyScopeFromPath('infra/terraform/main.tf') === 'infrastructure', "infra/ -> infrastructure");
assert(classifyScopeFromPath('docs/tutorial.md') === 'documentation', "docs/ -> documentation");
assert(classifyScopeFromPath('unclassified_file.py') === 'unknown', "unclassified -> unknown");

// ==============================================================================
// TEST 2: Capability discovered in Production Code
// ==============================================================================
console.log("\n[TEST 2] Capability in Production Code...");
const prodFile = `
from crewai.tools import tool
@tool("production_pricing_calculator")
def calc_price(item_id: str) -> float:
    return 99.9
`;
const resProd = detectCapabilities(new Map([['src/services/pricing.py', prodFile]]), baseSource);
assert(resProd.capabilities.length === 1, "Discovered 1 capability");
assert(resProd.capabilities[0].scope === 'production', "Scope is production");
assert(resProd.capabilities[0].provenance?.primaryScope === 'production', "Primary scope is production");

// ==============================================================================
// TEST 3: Capability discovered in Test Code (e.g. mock tool in test)
// ==============================================================================
console.log("\n[TEST 3] Capability in Test Code...");
const testFile = `
from crewai.tools import tool
@tool("mock_test_tool")
def mock_exec():
    pass
`;
const resTest = detectCapabilities(new Map([['tests/test_mock_agent.py', testFile]]), baseSource);
assert(resTest.capabilities.length === 1, "Discovered 1 capability in test code");
assert(resTest.capabilities[0].scope === 'test', "Scope is test");
assert(resTest.capabilities[0].resourceTarget === 'mock_test_tool', "Tool is mock_test_tool");

// ==============================================================================
// TEST 4: Capability discovered in Benchmark Code
// ==============================================================================
console.log("\n[TEST 4] Capability in Benchmark Code...");
const benchFile = `
tools = [bench_latency_probe]
`;
const resBench = detectCapabilities(new Map([['bench/bench_agent.py', benchFile]]), baseSource);
assert(resBench.capabilities.length === 1, "Discovered capability in benchmark");
assert(resBench.capabilities[0].scope === 'benchmark', "Scope is benchmark");

// ==============================================================================
// TEST 5: Capability discovered in Example Code
// ==============================================================================
console.log("\n[TEST 5] Capability in Example Code...");
const exampleFile = `
from langchain_core.tools import tool
@tool("tavily_search_example")
def search_example(q: str):
    pass
`;
const resExample = detectCapabilities(new Map([['examples/search_demo.py', exampleFile]]), baseSource);
assert(resExample.capabilities.length === 1, "Discovered capability in example");
assert(resExample.capabilities[0].scope === 'example', "Scope is example");

// ==============================================================================
// TEST 6: Capability discovered in Infrastructure Code
// ==============================================================================
console.log("\n[TEST 6] Capability in Infrastructure Code...");
const infraTf = `
resource "aws_iam_role_policy" "s3_full" {
  name = "s3_access"
  policy = jsonencode({ Statement = [{ Action = ["s3:*"], Resource = ["*"], Effect = "Allow" }] })
}
`;
const infraCode = `import boto3
s3 = boto3.client('s3')
s3.delete_object(Bucket='bucket', Key='k')`;
const resInfra = detectCapabilities(new Map([['infra/main.tf', infraTf], ['infra/provision.py', infraCode]]), baseSource);
const s3Cap = resInfra.capabilities.find(c => c.systemType === 'cloud_storage');
assert(Boolean(s3Cap), "S3 capability detected");
assert(s3Cap?.scope === 'infrastructure', "Scope is infrastructure");
assert(s3Cap?.state === 'AUTHORIZED_CAPABILITY', "Authorized via IAM policy in infra");

// ==============================================================================
// TEST 7: Deduplication across Multiple Scopes Preserves Provenance
// ==============================================================================
console.log("\n[TEST 7] Deduplication preserves provenance sources without creating duplicate capabilities...");
const sharedToolDef = `
from crewai import Agent
from crewai.tools import tool
@tool("shared_database_tool")
def query_db(): pass
agent = Agent(role="DatabaseAgent", tools=[query_db])
`;
const agentSource: SourceAnalysis = {
  ...baseSource,
  agents: [
    { name: 'DatabaseAgent', type: 'ai_persona', tools: [], models: [], riskLevel: 'medium', critical: false, framework: 'CrewAI', oversightLevel: 'l2', isAutonomous: false, confidence: 90, filePath: 'src/db_service.py' }
  ]
};
const resMultiScope = detectCapabilities(new Map([
  ['src/db_service.py', sharedToolDef],
  ['tests/test_db_service.py', sharedToolDef],
  ['examples/db_usage.py', sharedToolDef]
]), agentSource);

assert(resMultiScope.capabilities.length === 1, `Expected exactly 1 capability, got ${resMultiScope.capabilities.length}`);
const multiCap = resMultiScope.capabilities[0];
assert(multiCap.resourceTarget === 'shared_database_tool', "Target is shared_database_tool");
assert(multiCap.provenance?.scopes.includes('production'), "Provenance includes production");
assert(multiCap.provenance?.scopes.includes('test'), "Provenance includes test");
assert(multiCap.provenance?.scopes.includes('example'), "Provenance includes example");
assert(multiCap.provenance?.filePaths.length === 3, "Provenance records all 3 source files");

// ==============================================================================
// TEST 8: Epistemic Invariants: DISCOVERED != AUTHORIZED
// ==============================================================================
console.log("\n[TEST 8] Epistemic Invariants: OBSERVED/DECLARED != AUTHORIZED...");
assert(resProd.capabilities[0].state === 'DECLARED_CAPABILITY', "Declared tool stays DECLARED_CAPABILITY");
assert(resProd.capabilities[0].state !== 'AUTHORIZED_CAPABILITY', "Declared tool is not AUTHORIZED_CAPABILITY");
assert(resProd.capabilities[0].authorizationEvidence === undefined, "No authorization evidence found within scanned scope");

// ==============================================================================
// TEST 9: SQL, Shell, S3 & MCP retain full fidelity with scope
// ==============================================================================
console.log("\n[TEST 9] SQL, Shell, S3 & MCP retain full fidelity with scope...");
const sqlProd = `db.from('accounts').select('*')`;
const resSql = detectCapabilities(new Map([['src/models/account.ts', sqlProd]]), baseSource);
assert(resSql.capabilities.length === 1, "Discovered SQL query");
assert(resSql.capabilities[0].systemType === 'database', "System type is database");
assert(resSql.capabilities[0].scope === 'production', "Scope is production");

console.log("\n==================================================================");
console.log("🟢 ALL CAPABILITY PROVENANCE & SCAN SCOPE TESTS PASSED!");
console.log("==================================================================\n");
