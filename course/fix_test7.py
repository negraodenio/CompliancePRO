import os

with open('../tests/capability-provenance.test.ts', 'r', encoding='utf-8') as f:
    text = f.read()

old_test_7 = """// ==============================================================================
// TEST 7: Deduplication across Multiple Scopes Preserves Provenance
// ==============================================================================
console.log("\\n[TEST 7] Deduplication preserves provenance sources without creating duplicate capabilities...");
const sharedToolDef = `
from crewai.tools import tool
@tool("shared_database_tool")
def query_db(): pass
`;
const resMultiScope = detectCapabilities(new Map([
  ['src/db_service.py', sharedToolDef],
  ['tests/test_db_service.py', sharedToolDef],
  ['examples/db_usage.py', sharedToolDef]
]), baseSource);

assert(resMultiScope.capabilities.length === 1, `Expected exactly 1 capability, got ${resMultiScope.capabilities.length}`);"""

new_test_7 = """// ==============================================================================
// TEST 7: Deduplication across Multiple Scopes Preserves Provenance
// ==============================================================================
console.log("\\n[TEST 7] Deduplication preserves provenance sources without creating duplicate capabilities...");
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

assert(resMultiScope.capabilities.length === 1, `Expected exactly 1 capability, got ${resMultiScope.capabilities.length}`);"""

text = text.replace(old_test_7, new_test_7)

with open('../tests/capability-provenance.test.ts', 'w', encoding='utf-8') as f:
    f.write(text)

print('Updated Test 7 in tests/capability-provenance.test.ts')
