import { extractSystemBusinessXRay } from '../src/web/services/agent-sipoc-mapper';
import type { ScannerResult } from '../src/core/types';

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error('Assertion failed: ' + msg);
}

console.log('🏛️ CG-AG TEST: Free Scan Business & Governance X-Ray');

// 1. Mock a real-world multi-agent scanner result (like councilIA or Credit System)
const mockResult: ScannerResult = {
  repo: { name: 'FinTech Credit Assessment System' },
  source: {
    agents: [
      {
        name: 'credit_underwriting_agent',
        type: 'ai_persona',
        tools: ['calculate_risk', 'fetch_bureau_score'],
        models: ['gpt-4o'],
        riskLevel: 'high',
        critical: true
      },
      {
        name: 'document_verifier_agent',
        type: 'ai_persona',
        tools: ['parse_pdf'],
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
    databaseTables: ['customer_profiles', 'credit_applications', 'audit_ledger'],
    notebooks: []
  },
  agentCapabilities: [
    {
      agentName: 'credit_underwriting_agent',
      systemType: 'database',
      resourceTarget: 'customer_profiles',
      action: 'READ',
      state: 'OBSERVED_CAPABILITY',
      scope: 'production',
      anomalies: ['OBSERVED_WITHOUT_VERIFIED_AUTH'],
      isDestructive: false
    },
    {
      agentName: 'credit_underwriting_agent',
      systemType: 'database',
      resourceTarget: 'credit_applications',
      action: 'WRITE',
      state: 'OBSERVED_CAPABILITY',
      scope: 'production',
      anomalies: ['OBSERVED_WITHOUT_VERIFIED_AUTH'],
      isDestructive: false
    },
    {
      agentName: 'credit_underwriting_agent',
      systemType: 'cloud_storage',
      resourceTarget: 's3://credit-bucket/reports',
      action: 'DELETE',
      state: 'OBSERVED_CAPABILITY',
      scope: 'production',
      anomalies: ['OBSERVED_WITHOUT_VERIFIED_AUTH', 'DESTRUCTIVE_ACTION_WITHOUT_VERIFIED_HITL'],
      isDestructive: true
    }
  ],
  agentIdentities: [
    {
      agentName: 'credit_underwriting_agent',
      identityType: 'unassigned',
      roleMapped: 'UNKNOWN'
    }
  ],
  compliance: {
    overallScore: 65,
    categories: {} as any
  },
  violations: [],
  score: 65
};

const xray = extractSystemBusinessXRay(mockResult);

// Test 1: 4 Stages of Business Process Flow
assert(xray.stages.length === 4, 'Must produce exactly 4 business process stages');
assert(xray.stages[0].stageName === 'Customer / Source Data', 'Stage 1 must be Customer / Source Data');
assert(xray.stages[1].stageName === 'AI Assessment & Reasoning', 'Stage 2 must be AI Assessment & Reasoning');
assert(xray.stages[2].stageName === 'Decision & System Actions', 'Stage 3 must be Decision & System Actions');
assert(xray.stages[3].stageName === 'Business Outcome & Impact', 'Stage 4 must be Business Outcome & Impact');

// Test 2: Epistemic Confidence Tags
assert(xray.stages[0].confidence === 'DIRECTLY_DERIVED', 'Stage 1 with database tables must be DIRECTLY_DERIVED');
assert(xray.stages[0].items.some(i => i.includes('customer_profiles')), 'Stage 1 must contain customer_profiles');
assert(xray.stages[2].confidence === 'DIRECTLY_DERIVED', 'Stage 2 with write caps must be DIRECTLY_DERIVED');
assert(xray.stages[3].confidence === 'INFERRED', 'Stage 4 outcome must be INFERRED');

// Test 3: Business Impact Summary
assert(xray.impact.primaryProcess.length > 0, 'Primary process must be identified');
assert(xray.impact.resourcesAffected.length > 0, 'Resources affected must be cataloged');
assert(xray.impact.governanceStatus === 'Evidence Not Verified in Scanned Scope', 'Governance status must be honest and verified');

// Test 4: Passport Preview Invariants
assert(xray.passportPreview.aiAsset === 'credit_underwriting_agent', 'AI Asset name must match primary agent');
assert(xray.passportPreview.owner === 'UNKNOWN (Unassigned Business Owner)', 'Owner must be UNKNOWN');
assert(xray.passportPreview.identityBinding.includes('UNASSIGNED'), 'Identity binding must be UNASSIGNED');
assert(xray.passportPreview.autonomyLevel === 'NOT VERIFIED IN SCANNED SCOPE', 'Autonomy level must be NOT VERIFIED');
assert(xray.passportPreview.verifiedHitl === 'NOT VERIFIED IN SCANNED SCOPE', 'HITL must be NOT VERIFIED');
assert(xray.passportPreview.capabilitiesCount === 3, 'Capabilities count must be 3');
assert(xray.passportPreview.unverifiedAuthCount === 3, 'Unverified auth count must be 3');

// Test 5: Inferred Industry Context
assert(xray.industryContext !== undefined, 'Must infer industry context for credit repo');
assert(xray.industryContext?.sector.includes('FinTech'), 'Must classify as FinTech');
assert(xray.industryContext?.confidence === 'INFERRED_FROM_EVIDENCE', 'Must mark as INFERRED_FROM_EVIDENCE');

console.log('✅ ALL FREE SCAN BUSINESS & GOVERNANCE X-RAY INVARIANTS PASSED!');
