import subprocess

# Get the original file from git
git_content = subprocess.check_output(['git', 'show', 'HEAD:src/web/services/agent-sipoc-mapper.ts'], cwd='..').decode('utf-8')

new_function = """

import type { 
  ScannerResult, 
  SystemBusinessXRay, 
  BusinessXRayFlowStage, 
  BusinessImpactSummary, 
  AgentPassportPreviewData 
} from '../../core/types';

/**
 * Extracts a structured, epistemically-grounded Business & Governance X-Ray from a ScannerResult.
 * Translates low-level AST/database/capability discoveries into a 4-stage business process chain,
 * a business impact summary, and an Agent Passport Preview.
 */
export function extractSystemBusinessXRay(result: ScannerResult): SystemBusinessXRay {
  const agents: DetectedAgent[] = result.source?.agents || [];
  const capabilities = result.agentCapabilities || [];
  const identities = result.agentIdentities || [];
  const repoName = result.repo?.name || 'Scanned System';

  // 1. STAGE 1: Customer / Source Data (SUPPLIERS & INPUTS)
  const readCaps = capabilities.filter(c => c.action === 'READ');
  const readResources = Array.from(new Set(readCaps.map(c => c.resourceTarget))).filter(Boolean);
  const stage1Items = readResources.length > 0
    ? readResources.map(r => 'Database Resource: ' + r)
    : (agents.length > 0 ? ['API Ingestion / Natural Language Prompts', 'Contextual Model Payloads'] : ['Scanned Source Code Input']);
  const stage1Confidence = readResources.length > 0 ? 'DIRECTLY_DERIVED' : 'INFERRED';

  // 2. STAGE 2: AI Assessment & Reasoning (PROCESS & DECISION)
  const agentNames = Array.from(new Set(agents.map(a => a.name))).slice(0, 6);
  const stage2Items = agentNames.length > 0
    ? agentNames.map(name => 'Autonomous Agent: ' + name)
    : ['Heuristic & Algorithmic Decision Engine'];
  const stage2Confidence = agentNames.length > 0 ? 'DIRECTLY_DERIVED' : 'INFERRED';

  // 3. STAGE 3: Decision & Execution (OUTPUTS & ACTIONS)
  const writeCaps = capabilities.filter(c => c.action === 'WRITE' || c.action === 'EXECUTE' || c.action === 'DELETE');
  const writeResources = Array.from(new Set(writeCaps.map(c => c.resourceTarget + ' (' + c.action + ')'))).filter(Boolean);
  const stage3Items = writeResources.length > 0
    ? writeResources.map(r => 'Direct Execution Target: ' + r)
    : (capabilities.length > 0 
        ? Array.from(new Set(capabilities.map(c => c.resourceTarget + ' (' + c.action + ')')))
        : ['Model Response Generation', 'Downstream State Update']);
  const stage3Confidence = writeResources.length > 0 ? 'DIRECTLY_DERIVED' : 'INFERRED';

  // 4. STAGE 4: Business Outcome & Stakeholders (CUSTOMERS & OUTCOMES)
  const primaryAgent = agents[0];
  let outcomeDesc = 'Operational Business Pipeline / Downstream Consumers';
  if (primaryAgent) {
    const { sipoc } = getAgentBusinessAndSipoc(primaryAgent);
    if (sipoc.customer) {
      outcomeDesc = sipoc.customer;
    }
  }
  const stage4Items = [
    'Impacted Domain: ' + outcomeDesc,
    'Governance Target: Production AI Asset Catalog'
  ];
  const stage4Confidence = 'INFERRED';

  const stages: BusinessXRayFlowStage[] = [
    {
      stageNumber: 1,
      stageName: 'Customer / Source Data',
      technicalSipocRole: 'SUPPLIERS & INPUTS',
      description: 'Data assets, tables, and ingestion sources fed into the autonomous components.',
      items: stage1Items,
      confidence: stage1Confidence,
      sourceEvidence: readResources.length > 0 ? readResources.length + ' tables accessed via SQL/ORM READ' : 'AST Inferred'
    },
    {
      stageNumber: 2,
      stageName: 'AI Assessment & Reasoning',
      technicalSipocRole: 'PROCESS & DECISION',
      description: 'Discovered agents, orchestrators, and prompt-driven reasoning workflows.',
      items: stage2Items,
      confidence: stage2Confidence,
      sourceEvidence: agents.length + ' agents detected in AST'
    },
    {
      stageNumber: 3,
      stageName: 'Decision & System Actions',
      technicalSipocRole: 'OUTPUTS & ACTIONS',
      description: 'Coded mutations, database writes, external tool invocations, and shell actions.',
      items: stage3Items,
      confidence: stage3Confidence,
      sourceEvidence: capabilities.length + ' operational capabilities discovered'
    },
    {
      stageNumber: 4,
      stageName: 'Business Outcome & Impact',
      technicalSipocRole: 'CUSTOMERS & OUTCOMES',
      description: 'Downstream business consumers, production environments, and regulatory scope.',
      items: stage4Items,
      confidence: stage4Confidence,
      sourceEvidence: 'Contextual Architecture Derivation'
    }
  ];

  // 5. BUSINESS IMPACT SUMMARY
  let primaryProcessName = 'General Automated Operations';
  if (primaryAgent) {
    const { sipoc } = getAgentBusinessAndSipoc(primaryAgent);
    primaryProcessName = sipoc.businessRole || primaryAgent.name;
  } else if (capabilities.some(c => c.resourceTarget.includes('patch') || c.resourceTarget.includes('repo'))) {
    primaryProcessName = 'Automated Code Remediation & Patching';
  } else if (capabilities.some(c => c.resourceTarget.includes('credit') || c.resourceTarget.includes('loan'))) {
    primaryProcessName = 'Autonomous Credit Underwriting';
  }

  const allAffectedResources = Array.from(new Set(capabilities.map(c => c.resourceTarget + ' (' + c.systemType + ')'))).slice(0, 5);
  const distinctActions = Array.from(new Set(capabilities.map(c => c.action + ' on ' + c.resourceTarget))).slice(0, 5);

  const impact: BusinessImpactSummary = {
    primaryProcess: primaryProcessName,
    resourcesAffected: allAffectedResources.length > 0 ? allAffectedResources : ['Application Memory / Prompt Context'],
    potentialBusinessActions: distinctActions.length > 0 ? distinctActions : ['LLM Inference Execution'],
    governanceStatus: 'Evidence Not Verified in Scanned Scope'
  };

  // 6. AGENT PASSPORT PREVIEW DATA
  const unverifiedCount = result.capabilitiesSummary?.unknownAuthorizationCount 
    ?? capabilities.filter(c => !c.authorizationEvidence || c.state === 'UNKNOWN_AUTHORIZATION').length;

  const assignedIdentity = identities.find(id => id.identityType !== 'unassigned');

  const passportPreview: AgentPassportPreviewData = {
    aiAsset: primaryAgent?.name || repoName,
    businessProcess: primaryProcessName,
    owner: 'UNKNOWN (Unassigned Business Owner)',
    identityBinding: assignedIdentity 
      ? assignedIdentity.agentName + ' -> ' + (assignedIdentity.roleMapped || assignedIdentity.identityType)
      : 'UNASSIGNED (No IAM / Service Account Binding Verified)',
    autonomyLevel: 'NOT VERIFIED IN SCANNED SCOPE',
    capabilitiesCount: capabilities.length,
    unverifiedAuthCount: unverifiedCount,
    verifiedHitl: 'NOT VERIFIED IN SCANNED SCOPE'
  };

  // 7. INDUSTRY CONTEXT (INFERRED)
  const fullText = (repoName + ' ' + capabilities.map(c => c.resourceTarget).join(' ') + ' ' + agents.map(a => a.name).join(' ')).toLowerCase();
  let industrySector: string | undefined;
  let industryEvidence: string | undefined;

  if (/credit|loan|bank|fraud|fintech|payment|underwriting|invest/i.test(fullText)) {
    industrySector = 'FinTech & Financial Services';
    industryEvidence = 'Keywords and resource targets related to credit, transactions, or financial ledger';
  } else if (/patient|health|clinical|doctor|hipaa|medical|hospital/i.test(fullText)) {
    industrySector = 'Healthcare & Life Sciences';
    industryEvidence = 'Keywords and resource targets related to clinical, medical, or patient data';
  } else if (/patch|code|repo|git|deploy|ci|cd|build|test/i.test(fullText)) {
    industrySector = 'Software Engineering & Autonomous DevOps';
    industryEvidence = 'Keywords and capabilities related to repository files, code patches, and execution';
  }

  return {
    stages,
    impact,
    passportPreview,
    industryContext: industrySector ? {
      sector: industrySector,
      evidence: industryEvidence!,
      confidence: 'INFERRED_FROM_EVIDENCE'
    } : undefined
  };
}
"""

with open('../src/web/services/agent-sipoc-mapper.ts', 'w', encoding='utf-8') as f:
    f.write(git_content.strip() + '\n' + new_function)

print('Assembled complete agent-sipoc-mapper.ts successfully')
