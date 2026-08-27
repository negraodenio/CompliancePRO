/**
 * ComplyPRO Comprehensive Regression & Parity Test Suite
 * Validates Core Scanning, CG-AG Controls, Control Plane Mappings, Passports, Agentic Light, SecurityGuard, and MCP.
 */

import { CodebaseAnalyzer } from '../src/core/analyzer';
import { buildCGAGSpecification, cgagSpecificationToMarkdown, isCGAGImplemented, getCGAGScore, AGENTIC_CORE_PRINCIPLE } from '../src/core/cg-ag-controls';
import { SecurityGuard } from '../src/core/security';
import { GovernanceReportGenerator } from '../src/core/report-generator';
import { GraphOSMapper } from '../src/core/graphos-mapper';
import { AgenticLightAssessment } from '../src/core/agentic-light';
import { AgentPassportGenerator } from '../src/core/agent-passport';
import { AgenticLifecycleEngine } from '../src/core/agentic-lifecycle';
import { GovernanceControlPlane } from '../src/core/governance-control-plane';
import { executeMcpTool } from '../src/mcp/tools';

async function runTests() {
  console.log('==================================================================');
  console.log('>>> RUNNING COMPLYPRO LIGHT REGRESSION & PARITY TEST SUITE <<<');
  console.log('==================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`  [PASS] ${msg}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${msg}`);
      failed++;
    }
  }

  // -------------------------------------------------------------
  // TEST 1: CORE SCANNER ENGINE & AGENT DETECTION
  // -------------------------------------------------------------
  console.log('[TEST 1/9] Testing Core Scanner & Agent/Shadow AI Detection...');
  const sampleFiles: Record<string, string> = {
    'agents/credit_agent.py': `
from crewai import Agent, Task, Crew
import openai

credit_evaluator = Agent(
    role="Analista de Credito",
    goal="Avaliar solvabilidade e risco de inadimplencia",
    backstory="Decide autonomamente se concede emprestimo bancario",
    verbose=True,
    memory=True
)

def direct_llm_call(prompt):
    # Shadow AI: Chamada direta sem guardrail ou anonimizacao de PII
    return openai.ChatCompletion.create(model="gpt-4", messages=[{"role": "user", "content": prompt}])
`,
    'package.json': JSON.stringify({
      name: 'fintech-credit-pipeline',
      dependencies: {
        'openai': '^4.0.0',
        'crewai': '^0.1.0'
      }
    })
  };

  const analyzer = new CodebaseAnalyzer();
  const scanResult = await analyzer.analyze(sampleFiles, 'FinTech-Credit-Pipeline');

  assert(scanResult.repo.name === 'FinTech-Credit-Pipeline', 'Repository name mapped correctly');
  assert(scanResult.source.agents.length >= 1, `Detected ${scanResult.source.agents.length} agent(s)`);
  assert(scanResult.compliance.overallScore > 0, `Compliance overall score computed: ${scanResult.compliance.overallScore}%`);
  assert(scanResult.violations.length >= 1, `Detected ${scanResult.violations.length} violation(s)`);
  assert(scanResult.shadowAI.length >= 1, `Detected ${scanResult.shadowAI.length} Shadow AI call(s)`);

  // -------------------------------------------------------------
  // TEST 2: CG-AG CONTROLS & TRACEABILITY MATRIX
  // -------------------------------------------------------------
  console.log('\n[TEST 2/9] Testing CG-AG 24/12 Controls & Regulatory Traceability...');
  const spec = buildCGAGSpecification();
  assert(spec.controls.length === 12, 'Exposed all 12 CG-AG standard controls');
  assert(spec.principle === AGENTIC_CORE_PRINCIPLE, 'Asserted core principle: "Every Agent Action Must Be Governable and Evidenced."');
  assert(spec.mappedFrameworks.includes('EU AI Act 2024/1689'), 'Mapped to EU AI Act');
  assert(spec.mappedFrameworks.includes('LGPD Lei 13.709/2018'), 'Mapped to LGPD');
  assert(spec.mappedFrameworks.includes('NIST AI RMF 1.0'), 'Mapped to NIST AI RMF');

  const mdSpec = cgagSpecificationToMarkdown(spec);
  assert(mdSpec.includes('Regulatory Traceability Matrix'), 'Generated Markdown Traceability Matrix');

  const sampleFlags = {
    cg_ag_001_registered: true,
    cg_ag_002_owner: true,
    cg_ag_003_model_reg: true,
    cg_ag_004_compliant: true,
    cg_ag_005_compliant: false
  };
  const cgagScore = getCGAGScore(sampleFlags);
  assert(cgagScore > 0 && cgagScore <= 100, `Calculated CG-AG score: ${cgagScore}%`);

  // -------------------------------------------------------------
  // TEST 3: GOVERNANCE CONTROL PLANE & 12 CONTROLS MAPPING
  // -------------------------------------------------------------
  console.log('\n[TEST 3/9] Testing Governance Control Plane & 12 Controls Engine...');
  const mappings = GovernanceControlPlane.getControlEngineMappings();
  assert(mappings.length === 12, 'Mapped all 12 controls to Control Plane modules');
  assert(mappings.some(m => m.controlPlaneModule === 'AI_AGENT_REGISTRY'), 'AI_AGENT_REGISTRY mapped to CG-AG-01');
  assert(mappings.some(m => m.controlPlaneModule === 'AUDIT_LEDGER_EVIDENCE'), 'AUDIT_LEDGER_EVIDENCE mapped to CG-AG-08');

  const pipeline = GovernanceControlPlane.resolveGovernancePipeline('HIGH', 'Implement HITL validation checkpoint', {
    name: 'CISO Officer',
    role: 'Security & Governance Lead',
    stakeholderGroup: 'CISO'
  });
  assert(pipeline.decision.decision === 'MITIGATE', 'Resolved Decision -> Action pipeline');
  assert(pipeline.evidenceRequired === true, 'Protected Evidence requirement asserted');

  // -------------------------------------------------------------
  // TEST 4: AGENTIC GOVERNANCE LIFECYCLE (5 STAGES)
  // -------------------------------------------------------------
  console.log('\n[TEST 4/9] Testing Agentic Governance Lifecycle (5 Stages)...');
  const agent = scanResult.source.agents[0];
  const lifecycleAudit = AgenticLifecycleEngine.auditAgent(agent, scanResult.violations, scanResult.risks);
  assert(lifecycleAudit.stages.DEFINE !== undefined, 'Stage DEFINE evaluated');
  assert(lifecycleAudit.stages.BUILD !== undefined, 'Stage BUILD evaluated');
  assert(lifecycleAudit.stages.GOVERN !== undefined, 'Stage GOVERN evaluated');
  assert(lifecycleAudit.stages.OBSERVE !== undefined, 'Stage OBSERVE evaluated');
  assert(lifecycleAudit.stages.RESPOND !== undefined, 'Stage RESPOND evaluated');
  assert(lifecycleAudit.closedLoopVerified === true, 'Closed loop DEFINE->BUILD->GOVERN->OBSERVE->RESPOND verified');

  // -------------------------------------------------------------
  // TEST 5: AGENT GOVERNANCE PASSPORT
  // -------------------------------------------------------------
  console.log('\n[TEST 5/9] Testing Agent Governance Passport Generation...');
  const passport = AgentPassportGenerator.generatePassport(agent, 'FinTech-Credit-Pipeline', scanResult.violations);
  assert(passport.agentId.startsWith('CG-AG-'), `Passport ID generated: ${passport.agentId}`);
  assert(passport.owner.role.includes('Deployer'), 'Accountable owner assigned');
  assert(passport.passportHash.startsWith('HASH-'), 'Digital cryptographic signature generated');
  assert(passport.executionStatus === 'CONDITIONAL_APPROVAL' || passport.executionStatus === 'ACTIVE_GOVERNED', 'Governance execution status assigned');

  const mdPassport = AgentPassportGenerator.toMarkdown(passport);
  assert(mdPassport.includes('AGENT GOVERNANCE PASSPORT'), 'Markdown Passport rendering verified');

  // -------------------------------------------------------------
  // TEST 6: CG-AG AGENTIC LIGHT (10 DIMENSIONS)
  // -------------------------------------------------------------
  console.log('\n[TEST 6/9] Testing CG-AG Agentic Light (10 Dimensions Assessment)...');
  const lightAssessment = AgenticLightAssessment.assess(scanResult);
  assert(lightAssessment.dimensions.length === 10, 'Evaluated all 10 dimensions');
  assert(lightAssessment.agenticGovernanceScore > 0, `Agentic Governance Score: ${lightAssessment.agenticGovernanceScore}% (${lightAssessment.ratingEmoji} ${lightAssessment.rating})`);
  assert(lightAssessment.passports.length === scanResult.source.agents.length, `Generated ${lightAssessment.passports.length} Agent Passports`);
  assert(lightAssessment.correctivePriorities.length > 0, 'Prioritized corrective actions produced');

  const mdLight = AgenticLightAssessment.toMarkdown(lightAssessment);
  assert(mdLight.includes('10-DIMENSION SCORECARD'), 'Agentic Light Markdown Brief generated');

  // -------------------------------------------------------------
  // TEST 7: IN-MEMORY GRAPHOS & RIPD REPORT
  // -------------------------------------------------------------
  console.log('\n[TEST 7/9] Testing In-Memory GraphOS & RIPD Report...');
  const mapper = new GraphOSMapper();
  const graph = mapper.mapScanResult(scanResult);
  assert(graph.entities.length > 0, `Generated ${graph.entities.length} GraphOS entity nodes`);

  const ripd = GovernanceReportGenerator.generateRIPD(scanResult, {
    organizationName: 'Banco Digital S.A.',
    projectName: 'Credit Scoring Agent'
  });
  assert(ripd.includes('RELATORIO DE IMPACTO A PROTECAO DE DADOS PESSOAIS'), 'Generated formal RIPD (Art. 38 LGPD)');

  // -------------------------------------------------------------
  // TEST 8: SECURITYGUARD SANDBOXING
  // -------------------------------------------------------------
  console.log('\n[TEST 8/9] Testing SecurityGuard Sandboxing & Secret Redaction...');
  const safeRoot = process.cwd();
  const safePath = SecurityGuard.resolveSafePath('src', safeRoot);
  assert(safePath.startsWith(safeRoot), 'Resolved safe relative path within workspace');

  let blocked = false;
  try {
    SecurityGuard.resolveSafePath('../../../etc/passwd', safeRoot);
  } catch (err: any) {
    blocked = true;
    assert(err.message.includes('SECURITY ALERT'), 'Blocked directory traversal attempt');
  }
  assert(blocked, 'Path traversal attack successfully prevented');

  // -------------------------------------------------------------
  // TEST 9: MCP TOOLS EXECUTION
  // -------------------------------------------------------------
  console.log('\n[TEST 9/9] Testing Universal MCP Server Tool Handlers...');
  const mcpStatus = await executeMcpTool('scanner_status', {});
  assert(mcpStatus.status === 'operational', 'MCP scanner_status returned operational');
  assert(mcpStatus.capabilities.agenticLightAssessment !== undefined, 'MCP agentic light capability confirmed');

  const mcpLight = await executeMcpTool('agentic_light_assessment', { filePath: process.cwd() });
  assert(mcpLight.agenticGovernanceScore !== undefined, `MCP agentic_light_assessment executed (Score: ${mcpLight.agenticGovernanceScore}%)`);

  const mcpPassports = await executeMcpTool('get_agent_passports', { filePath: process.cwd() });
  assert(Array.isArray(mcpPassports), `MCP get_agent_passports returned ${mcpPassports.length} passport(s)`);

  // -------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------
  console.log('\n==================================================================');
  console.log(`>>> REGRESSION TEST RESULTS: ${passed} PASSED | ${failed} FAILED <<<`);
  console.log('==================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
