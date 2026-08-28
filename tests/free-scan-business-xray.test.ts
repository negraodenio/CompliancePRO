import { extractSystemBusinessXRay } from '../src/web/services/agent-sipoc-mapper';
import { classifyScopeFromPath } from '../src/core/capability-detector';
import type { ScannerResult, AgentCapability, DetectedAgent, CodeViolation } from '../src/core/types';

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error('Assertion failed: ' + msg);
}

console.log('🏛️ CG-AG TEST: Free Scan Executive Provenance, Governance Audit & Scope Priority');

// ============================================================================
// TEST CASE 1: text2future/flowix Regression Simulation
// ============================================================================
const mockFlowixAgents: DetectedAgent[] = [
  {
    name: 'agent_migrations',
    type: 'service',
    tools: ['db_migrate'],
    models: ['gpt-4o'],
    riskLevel: 'low',
    critical: false,
    filePath: 'src/migrations/agent_migrations.ts'
  },
  {
    name: 'agent-window-effects.test',
    type: 'ai_persona',
    tools: ['render_window'],
    models: ['gpt-4o'],
    riskLevel: 'high',
    critical: false,
    filePath: 'tests/unit/agent-window-effects.test.ts'
  },
  {
    name: 'agent_background_terminals',
    type: 'service',
    tools: ['spawn_terminal', 'run_command'],
    models: ['gpt-4o'],
    riskLevel: 'medium',
    critical: false,
    filePath: 'src/infrastructure/agent_background_terminals.ts'
  },
  {
    name: 'flowix_core_agent',
    type: 'ai_persona',
    tools: ['code_patch_generator', 'ast_analyzer'],
    models: ['gpt-4o'],
    riskLevel: 'high',
    critical: true,
    filePath: 'src/core/agents/flowix_core_agent.ts'
  }
];

const mockFlowixCaps: AgentCapability[] = [
  // 1. Production-scope capability
  {
    id: 'cap-1',
    agentName: 'flowix_core_agent',
    systemType: 'database',
    systemName: 'PostgreSQL',
    resourceTarget: 'repo_files',
    action: 'WRITE',
    state: 'OBSERVED_CAPABILITY',
    filePath: 'src/core/agents/flowix_core_agent.ts',
    scope: 'production',
    anomalies: ['OBSERVED_WITHOUT_VERIFIED_AUTH'],
    isDestructive: false,
    accessesSensitiveData: false
  },
  // 2. Migration / Infrastructure capability
  {
    id: 'cap-2',
    agentName: 'agent_migrations',
    systemType: 'database',
    systemName: 'SQLite',
    resourceTarget: 'pragma_table_info',
    action: 'READ',
    state: 'OBSERVED_CAPABILITY',
    filePath: 'src/migrations/agent_migrations.ts',
    scope: 'infrastructure',
    anomalies: ['OBSERVED_WITHOUT_VERIFIED_AUTH'],
    isDestructive: false,
    accessesSensitiveData: false
  },
  // 3. Test-scope capability (DELETE action in test suite)
  {
    id: 'cap-3',
    agentName: 'agent-window-effects.test',
    systemType: 'database',
    systemName: 'SQLite',
    resourceTarget: 'test_fixtures_table',
    action: 'DELETE',
    state: 'OBSERVED_CAPABILITY',
    filePath: 'tests/unit/agent-window-effects.test.ts',
    scope: 'test',
    anomalies: ['OBSERVED_WITHOUT_VERIFIED_AUTH'],
    isDestructive: true,
    accessesSensitiveData: false
  },
  // 4. Supporting / Example capability
  {
    id: 'cap-4',
    agentName: 'example_flow',
    systemType: 'llm_service',
    systemName: 'OpenAI',
    resourceTarget: 'sample_session_alias',
    action: 'READ',
    state: 'DECLARED_CAPABILITY',
    filePath: 'examples/flow_demo.ts',
    scope: 'example',
    anomalies: [],
    isDestructive: false,
    accessesSensitiveData: false
  }
];

// Mock 330 raw technical regex violations (e.g. static code hits)
const mock330Violations: CodeViolation[] = Array.from({ length: 330 }, (_, idx) => ({
  rule: idx < 12 ? 'HARDCODED_SECRET_OR_UNBOUND_CAPABILITY' : 'GENERAL_STATIC_AST_NOTICE',
  severity: idx < 12 ? 'high' : 'low',
  category: 'security',
  message: 'Technical pattern discovered in source line',
  file: idx < 5 ? 'src/core/agents/flowix_core_agent.ts' : 'tests/fixtures/mock_file.ts',
  line: idx + 1
}));

const mockFlowixResult: ScannerResult = {
  repo: { name: 'text2future/flowix' },
  source: {
    agents: mockFlowixAgents,
    aiModels: ['gpt-4o'],
    dataAssets: [],
    externalServices: [],
    memorySystems: [],
    frameworks: ['custom'],
    apiRoutes: [],
    authPatterns: [],
    databaseTables: ['repo_files', 'pragma_table_info'],
    notebooks: []
  },
  agentCapabilities: mockFlowixCaps,
  agentIdentities: [
    {
      agentName: 'flowix_core_agent',
      identityType: 'unassigned',
      roleMapped: 'UNKNOWN'
    }
  ],
  violations: mock330Violations,
  compliance: {
    overallScore: 28,
    categories: {} as any
  },
  score: 28
};

const flowixXray = extractSystemBusinessXRay(mockFlowixResult);

// --- RULE 1 & 4: Scope Decomposition (Separates Prod vs Non-Prod vs Infra) ---
assert(flowixXray.scopeDecomposition !== undefined, 'Must compute scopeDecomposition');
assert(flowixXray.scopeDecomposition?.productionCount === 1, 'Exactly 1 capability must be production scope');
assert(flowixXray.scopeDecomposition?.nonProductionCount === 2, '2 capabilities must be non-production scope (test + example)');
assert(flowixXray.scopeDecomposition?.infrastructureCount === 1, '1 capability must be infrastructure scope');

// --- RULE 2 & 9: Total Capabilities Count is Preserved Unaltered ---
assert(flowixXray.stages[2].sourceEvidence?.includes('4 operational capabilities'), 'Total capability count must be preserved (4 caps)');

// --- RULE 6 & 8: Findings Audit (330 Technical vs 1 High-Priority Governance in this mock) ---
assert(flowixXray.findingsDecomposition !== undefined, 'Must compute findingsDecomposition');
assert(flowixXray.findingsDecomposition?.totalTechnicalFindings === 330, 'Total technical findings must be 330');
assert(flowixXray.findingsDecomposition?.highPriorityGovernanceFindings >= 1, 'High-priority governance findings must be calibrated');
assert(flowixXray.findingsDecomposition?.highPriorityGovernanceFindings !== 330, 'High-priority governance findings must NEVER equal raw 330 regex hits');

// --- RULE 8: Passport Asset Selection Hierarchy ---
// flowix_core_agent is in 'production', so it MUST be chosen over agent-window-effects.test
assert(flowixXray.passportPreview.aiAsset === 'flowix core agent', 'Passport MUST select the production asset, NOT the test asset');
assert(!flowixXray.passportPreview.aiAsset.includes('.test'), 'Passport asset must NEVER be a test file');

// --- RULE 9 & 10: Inferred Domain & Process for Flowix ---
assert(flowixXray.domainContext !== undefined, 'Must provide domainContext');
assert(flowixXray.domainContext?.domain === 'Software Engineering & Autonomous DevOps', 'Must infer Software Engineering domain');
assert(flowixXray.domainContext?.confidence === 'MEDIUM', 'Domain confidence must be MEDIUM');
assert(flowixXray.impact.primaryProcess === 'AI-Assisted Software Development & Workflow Automation', 'Primary process must be AI-Assisted Software Development');

// --- Migration Scope Classification Check ---
assert(classifyScopeFromPath('src/migrations/001_create_tables.sql') === 'infrastructure', 'Migrations must classify as infrastructure');
assert(classifyScopeFromPath('src/infrastructure/docker.ts') === 'infrastructure', 'Infrastructure files must classify as infrastructure');

console.log('✅ ALL AUDITED PROVENANCE, GOVERNANCE AUDIT & SCOPE PRIORITY INVARIANTS PASSED!');
