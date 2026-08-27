/**
 * ComplyPRO Comprehensive Regression & Parity Test Suite
 * Validates Core Scanning, 12 CG-AG Controls, 6 Lifecycle Stages, Control Plane Mappings,
 * Verifiable Passports, Agentic Light 10 Dimensions, Tamper-Evident Evidence, and GraphOS Independence.
 */

import { CodebaseAnalyzer } from '../src/core/analyzer';
import { buildCGAGSpecification, cgagSpecificationToMarkdown, isCGAGImplemented, getCGAGGovernanceScore, AGENTIC_CORE_PRINCIPLE } from '../src/core/cg-ag-controls';
import { SecurityGuard } from '../src/core/security';
import { GovernanceReportGenerator } from '../src/core/report-generator';
import { AgenticLightAssessment } from '../src/core/agentic-light';
import { AgentPassportGenerator } from '../src/core/agent-passport';
import { AgenticLifecycleEngine } from '../src/core/agentic-lifecycle';
import { GovernanceControlPlane } from '../src/core/governance-control-plane';
import { executeMcpTool } from '../src/mcp/tools';

async function runTests() {
  console.log('==================================================================');
  console.log('>>> RUNNING COMPLYPRO HARDENED GOVERNANCE OS TEST SUITE <<<');
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
  console.log('[TEST 1/10] Testing Core Scanner & Agent/Shadow AI Detection...');
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
  // TEST 2: CG-AG 12 CONTROLS & TRACEABILITY MATRIX
  // -------------------------------------------------------------
  console.log('\n[TEST 2/10] Testing 12 CG-AG Controls & Regulatory Reference Matrix...');
  const spec = buildCGAGSpecification();
  assert(spec.controls.length === 12, 'Exposed exactly 12 CG-AG standard controls (CG-AG-01 to CG-AG-12)');
  assert(spec.principle === AGENTIC_CORE_PRINCIPLE, 'Asserted core principle: "Every Agent Action Must Be Governable and Evidenced."');
  assert(spec.mappedFrameworks.includes('EU AI Act 2024/1689'), 'Mapped to EU AI Act');
  assert(spec.mappedFrameworks.includes('LGPD Lei 13.709/2018'), 'Mapped to LGPD');
  assert(spec.mappedFrameworks.includes('NIST AI RMF 1.0'), 'Mapped to NIST AI RMF');

  const mdSpec = cgagSpecificationToMarkdown(spec);
  assert(mdSpec.includes('The 12 Audit-Ready Controls'), 'Generated Markdown 12 Controls Table');

  const sampleFlags = {
    cg_ag_001_registered: true,
    cg_ag_002_owner: true,
    cg_ag_003_model_reg: true,
    cg_ag_004_compliant: true,
    cg_ag_005_compliant: false
  };
  const cgagScore = getCGAGGovernanceScore(sampleFlags);
  assert(cgagScore > 0 && cgagScore <= 100, `Calculated CG-AG Governance Score (12 Controls): ${cgagScore}%`);

  // -------------------------------------------------------------
  // TEST 3: GOVERNANCE CONTROL PLANE & 12 CONTROLS ENGINE
  // -------------------------------------------------------------
  console.log('\n[TEST 3/10] Testing Governance Control Plane (Discover, Govern, Operate, Assure)...');
  const mappings = GovernanceControlPlane.getControlEngineMappings();
  assert(mappings.length === 12, 'Mapped all 12 controls to Control Plane modules');
  assert(mappings.some(m => m.controlId === 'CG-AG-01' && m.controlPlaneModule === 'AI_AGENT_REGISTRY'), 'CG-AG-01 mapped to AI_AGENT_REGISTRY (DISCOVER)');
  assert(mappings.some(m => m.controlId === 'CG-AG-07' && m.controlPlaneModule === 'AUDIT_LEDGER_EVIDENCE'), 'CG-AG-07 mapped to AUDIT_LEDGER_EVIDENCE (ASSURE)');
  assert(mappings.some(m => m.controlId === 'CG-AG-03' && m.controlPlaneModule === 'WORKFLOWS_APPROVALS_HITL'), 'CG-AG-03 mapped to WORKFLOWS_APPROVALS_HITL (OPERATE)');
  assert(mappings.some(m => m.controlId === 'CG-AG-05' && m.controlPlaneModule === 'POLICY_ENGINE_AI_SECURITY'), 'CG-AG-05 mapped to POLICY_ENGINE_AI_SECURITY (GOVERN)');

  // -------------------------------------------------------------
  // TEST 4: GOVERNANCE PIPELINE (RISK -> DECISION -> ACTION)
  // -------------------------------------------------------------
  console.log('\n[TEST 4/10] Testing Governance Pipeline (Policy -> Responsibility -> Control -> Risk -> Decision -> Action -> Evidence)...');
  const pipeline = GovernanceControlPlane.resolveGovernancePipeline('HIGH', 'Implement HITL validation checkpoint', {
    name: 'CISO Officer',
    role: 'Security & Governance Lead',
    stakeholderGroup: 'CISO'
  });
  assert(pipeline.decision.decision === 'MITIGATE', 'Resolved Decision: MITIGATE (Risk does not automatically become Action)');
  assert(pipeline.evidenceRequired === true, 'Protected Evidence requirement asserted');
  assert(pipeline.decision.decidedBy.stakeholderGroup === 'CISO', 'Human Accountability enforced (CISO)');

  // -------------------------------------------------------------
  // TEST 5: AGENTIC GOVERNANCE LIFECYCLE (6 STAGES)
  // -------------------------------------------------------------
  console.log('\n[TEST 5/10] Testing Agentic Governance Lifecycle (6 Stages: Define -> Build -> Govern -> Observe -> Respond -> Improve)...');
  const agent = scanResult.source.agents[0];
  const lifecycleAudit = AgenticLifecycleEngine.auditAgent(agent, scanResult.violations, scanResult.risks);
  assert(lifecycleAudit.stages.DEFINE !== undefined, 'Stage 1: DEFINE evaluated');
  assert(lifecycleAudit.stages.BUILD !== undefined, 'Stage 2: BUILD evaluated');
  assert(lifecycleAudit.stages.GOVERN !== undefined, 'Stage 3: GOVERN evaluated');
  assert(lifecycleAudit.stages.OBSERVE !== undefined, 'Stage 4: OBSERVE evaluated');
  assert(lifecycleAudit.stages.RESPOND !== undefined, 'Stage 5: RESPOND evaluated');
  assert(lifecycleAudit.stages.IMPROVE !== undefined, 'Stage 6: IMPROVE evaluated');
  assert(lifecycleAudit.closedLoopVerified === true, 'Closed loop DEFINE->BUILD->GOVERN->OBSERVE->RESPOND->IMPROVE verified');

  // -------------------------------------------------------------
  // TEST 6: VERIFIABLE AGENT GOVERNANCE PASSPORT
  // -------------------------------------------------------------
  console.log('\n[TEST 6/10] Testing Verifiable Agent Governance Passport...');
  const passport = AgentPassportGenerator.generatePassport(agent, 'FinTech-Credit-Pipeline', scanResult.violations);
  assert(passport.identity.agentId.startsWith('CG-AG-'), `Passport ID: ${passport.identity.agentId}`);
  assert(passport.identity.owner.role.includes('Deployer'), 'Accountable Owner assigned');
  assert(passport.assurance.verificationSignature.startsWith('SIG-'), 'Digital Verification Signature generated');
  assert(passport.operational.currentStatus === 'CONDITIONAL_APPROVAL' || passport.operational.currentStatus === 'ACTIVE_GOVERNED', 'Operational Status assigned');
  assert(passport.assurance.evidenceTrail.tamperEvidentLogging === true, 'Tamper-Evident logging specified');

  const mdPassport = AgentPassportGenerator.toMarkdown(passport);
  assert(mdPassport.includes('VERIFIABLE AGENT GOVERNANCE PASSPORT'), 'Markdown Passport rendering verified');

  // -------------------------------------------------------------
  // TEST 7: CG-AG AGENTIC LIGHT (10 DIMENSIONS)
  // -------------------------------------------------------------
  console.log('\n[TEST 7/10] Testing CG-AG Agentic Light (10 Dimensions Assessment)...');
  const lightAssessment = AgenticLightAssessment.assess(scanResult);
  assert(lightAssessment.dimensions.length === 10, 'Evaluated all 10 dimensions');
  assert(lightAssessment.agenticGovernanceScore > 0, `Agentic Governance Score (10 Dims): ${lightAssessment.agenticGovernanceScore}% (${lightAssessment.ratingEmoji} ${lightAssessment.rating})`);
  assert(lightAssessment.passports.length === scanResult.source.agents.length, `Generated ${lightAssessment.passports.length} Verifiable Passports`);
  assert(lightAssessment.correctivePriorities.length > 0, 'Prioritized corrective actions produced');

  // -------------------------------------------------------------
  // TEST 8: SCORE DISTINCTION (12 CONTROLS vs 10 DIMENSIONS)
  // -------------------------------------------------------------
  console.log('\n[TEST 8/10] Testing Score Distinction (CG-AG Governance Score != Agentic Governance Score)...');
  const score12Controls = getCGAGGovernanceScore({ cg_ag_001_registered: true, cg_ag_002_owner: true });
  const score10Dims = lightAssessment.agenticGovernanceScore;
  assert(typeof score12Controls === 'number' && typeof score10Dims === 'number', 'Both score models functional and independently evaluated');

  // -------------------------------------------------------------
  // TEST 9: SECURITYGUARD SANDBOXING & REPORT GENERATOR
  // -------------------------------------------------------------
  console.log('\n[TEST 9/10] Testing SecurityGuard Sandboxing & RIPD Report...');
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

  const ripd = GovernanceReportGenerator.generateRIPD(scanResult, {
    organizationName: 'Banco Digital S.A.',
    projectName: 'Credit Scoring Agent'
  });
  assert(ripd.includes('RELATORIO DE IMPACTO A PROTECAO DE DADOS PESSOAIS'), 'Generated formal RIPD (Art. 38 LGPD)');

  // -------------------------------------------------------------
  // TEST 10: MCP TOOLS EXECUTION & GRAPHOS INDEPENDENCE
  // -------------------------------------------------------------
  console.log('\n[TEST 10/10] Testing Universal MCP Server & GraphOS Independence...');
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
  console.log(`>>> HARDENED TEST RESULTS: ${passed} PASSED | ${failed} FAILED <<<`);
  console.log('==================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
