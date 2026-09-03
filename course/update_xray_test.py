test_code = """import { extractSystemBusinessXRay } from '../src/web/services/agent-sipoc-mapper';
import type { ScannerResult } from '../src/core/types';

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error('Assertion failed: ' + msg);
}

console.log('🏛️ CG-AG TEST: Free Scan Business & Governance X-Ray (Senior Clustered)');

// 1. Mock a real-world multi-agent scanner result (like crewAIInc/crewAI-examples)
const mockCrewAiResult: ScannerResult = {
  repo: { name: 'crewAIInc/crewAI-examples' },
  source: {
    agents: [
      {
        name: 'trip_agents',
        type: 'ai_persona',
        tools: ['BrowserTools.scrape_and_summarize_website', 'SearchTools.search_internet', 'SearchTools.search_instagram'],
        models: ['gpt-4o'],
        riskLevel: 'high',
        critical: true
      },
      {
        name: 'simple_qa_agentic_flow:Router',
        type: 'ai_persona',
        tools: ['web_search_tool', 'file_read_tool'],
        models: ['gpt-4o'],
        riskLevel: 'medium',
        critical: false
      }
    ],
    aiModels: ['gpt-4o'],
    dataAssets: [],
    externalServices: [],
    memorySystems: [],
    frameworks: ['crewai'],
    apiRoutes: [],
    authPatterns: [],
    databaseTables: [],
    notebooks: []
  },
  agentCapabilities: [
    {
      agentName: 'trip_agents',
      systemType: 'llm_service',
      resourceTarget: 'BrowserTools.scrape_and_summarize_website',
      action: 'EXECUTE',
      state: 'DECLARED_CAPABILITY',
      scope: 'example',
      anomalies: [],
      isDestructive: false
    },
    {
      agentName: 'trip_agents',
      systemType: 'llm_service',
      resourceTarget: 'SearchTools.search_internet',
      action: 'EXECUTE',
      state: 'DECLARED_CAPABILITY',
      scope: 'example',
      anomalies: [],
      isDestructive: false
    },
    {
      agentName: 'trip_agents',
      systemType: 'llm_service',
      resourceTarget: 'SearchTools.search_instagram',
      action: 'EXECUTE',
      state: 'DECLARED_CAPABILITY',
      scope: 'example',
      anomalies: [],
      isDestructive: false
    }
  ],
  agentIdentities: [
    {
      agentName: 'trip_agents',
      identityType: 'unassigned',
      roleMapped: 'UNKNOWN'
    }
  ],
  compliance: {
    overallScore: 28,
    categories: {} as any
  },
  violations: [],
  score: 28
};

const xray = extractSystemBusinessXRay(mockCrewAiResult);

// Test 1: 4 Stages with clean items (no 29-line wall of text)
assert(xray.stages.length === 4, 'Must produce exactly 4 business process stages');
assert(xray.stages[2].items.length <= 4, 'Stage 3 must be clustered into max 4 high-level categories');
assert(!JSON.stringify(xray).includes('Processamento do Nó'), 'Zero legacy Portuguese fallback in output');
assert(!JSON.stringify(xray).includes('Próximo Nó'), 'Zero Portuguese destination in output');

// Test 2: Executive Process Name
assert(xray.impact.primaryProcess.includes('Research') || xray.impact.primaryProcess.includes('Intelligence') || xray.impact.primaryProcess.includes('Workflow'), 'Process name must be executive');

// Test 3: Clean Passport Preview
assert(xray.passportPreview.aiAsset === 'trip agents', 'AI Asset name must be formatted cleanly');
assert(xray.passportPreview.owner === 'UNKNOWN (Unassigned Business Owner)', 'Owner must be UNKNOWN');
assert(xray.passportPreview.capabilitiesCount === 3, 'Capabilities count must match');

console.log('✅ ALL SENIOR FREE SCAN X-RAY INVARIANTS PASSED!');
"""

with open('../tests/free-scan-business-xray.test.ts', 'w', encoding='utf-8') as f:
    f.write(test_code)

print('Updated tests/free-scan-business-xray.test.ts')
