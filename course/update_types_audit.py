with open('../src/core/types.ts', 'r', encoding='utf-8', errors='ignore') as f:
    text = f.read()

# Replace types around FreeScan Business & Governance X-Ray
old_types = """// ============================================================================
// CG-AG FREE SCAN BUSINESS & GOVERNANCE X-RAY TYPES
// ============================================================================

export type DerivationConfidence = 'DIRECTLY_DERIVED' | 'INFERRED' | 'UNKNOWN';

export interface BusinessXRayFlowStage {
  stageNumber: number;
  stageName: string;
  technicalSipocRole: string;
  description: string;
  items: string[];
  confidence: DerivationConfidence;
  sourceEvidence?: string;
}

export interface BusinessImpactSummary {
  primaryProcess: string;
  resourcesAffected: string[];
  potentialBusinessActions: string[];
  governanceStatus: string;
}

export interface AgentPassportPreviewData {
  aiAsset: string;
  businessProcess: string;
  owner: string;
  identityBinding: string;
  autonomyLevel: string;
  capabilitiesCount: number;
  unverifiedAuthCount: number;
  verifiedHitl: string;
}

export interface SystemBusinessXRay {
  stages: BusinessXRayFlowStage[];
  impact: BusinessImpactSummary;
  passportPreview: AgentPassportPreviewData;
  industryContext?: {
    sector: string;
    evidence: string;
    confidence: 'INFERRED_FROM_EVIDENCE';
  };
}"""

new_types = """// ============================================================================
// CG-AG FREE SCAN BUSINESS & GOVERNANCE X-RAY TYPES
// ============================================================================

export type DerivationConfidence = 'DIRECTLY_DERIVED' | 'INFERRED' | 'NOT_VERIFIED' | 'UNKNOWN';

export interface BusinessXRayFlowStage {
  stageNumber: number;
  stageName: string;
  technicalSipocRole: string;
  description: string;
  items: string[];
  confidence: DerivationConfidence;
  sourceEvidence?: string;
}

export interface BusinessImpactSummary {
  primaryProcess: string;
  resourcesAffected: string[];
  potentialBusinessActions: string[];
  governanceStatus: string;
  productionExposureSummary?: string;
}

export interface AgentPassportPreviewData {
  aiAsset: string;
  businessProcess: string;
  owner: string;
  identityBinding: string;
  autonomyLevel: string;
  capabilitiesCount: number;
  unverifiedAuthCount: number;
  verifiedHitl: string;
  isProductionAsset?: boolean;
}

export interface InferredDomainContext {
  domain: string;
  evidence: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface ScopeDecomposition {
  productionCount: number;
  nonProductionCount: number; // test, example, benchmark, fixture
  infrastructureCount: number;
  unknownCount: number;
}

export interface FindingsAuditDecomposition {
  totalTechnicalFindings: number;
  highPriorityGovernanceFindings: number;
  productionScopeHighRiskFindings: number;
}

export interface SystemBusinessXRay {
  stages: BusinessXRayFlowStage[];
  impact: BusinessImpactSummary;
  passportPreview: AgentPassportPreviewData;
  domainContext?: InferredDomainContext;
  industryContext?: {
    sector: string;
    evidence: string;
    confidence: 'INFERRED_FROM_EVIDENCE';
  };
  scopeDecomposition?: ScopeDecomposition;
  findingsDecomposition?: FindingsAuditDecomposition;
}"""

if old_types in text:
    text = text.replace(old_types, new_types)
    with open('../src/core/types.ts', 'w', encoding='utf-8') as f:
        f.write(text)
    print('Updated types.ts with executive scope and findings decomposition')
else:
    print('Could not find old_types in types.ts')
