/**
 * CodeGuard v3.1 — Executable AI Compliance Contract
 * 
 * Normative definitions for Regulatory Requirements, CG-AG Operational Controls,
 * Machine-Executable Policies, and Deterministic Compliance Profiles.
 * 
 * Fundamental Principle:
 * "The Compliance Engine decides what should be permitted. The Guardian only enforces it."
 */

import crypto from 'crypto';

export type RegulationId = 
  | 'EU_AI_ACT' 
  | 'GDPR' 
  | 'LGPD'
  | 'ISO_42001' 
  | 'NIST_AI_RMF' 
  | 'DORA' 
  | 'BCB_4893';

export type CgAgControlId =
  | 'CG-AG-01'  // Inventory & Registration
  | 'CG-AG-02'  // Tool Scoping & Authorization
  | 'CG-AG-03'  // Human-in-the-Loop
  | 'CG-AG-04'  // Circuit Breaker / Timeout / Anti-Loop
  | 'CG-AG-05'  // Prompt Security / Injection Protection
  | 'CG-AG-06'  // PII Protection & De-identification
  | 'CG-AG-07'  // Audit Trail & Decision Trace
  | 'CG-AG-08'  // Secrets & Credentials Management
  | 'CG-AG-09'  // Drift / Hallucination / Bias Monitoring
  | 'CG-AG-10'  // FinOps / Token Budget / Rate Limiting
  | 'CG-AG-11'  // Resilience / Fallback / Graceful Degradation
  | 'CG-AG-12'; // Third-Party AI / Supply Chain Governance

export interface SourceReference {
  regulation: RegulationId;
  section: string;
  sourceUri?: string;
  effectiveFrom?: string;
  title?: string;
}

export type EnforcementMode = 
  | 'HARD_BLOCK' 
  | 'REQUIRE_HITL' 
  | 'MANDATORY_EVIDENCE' 
  | 'CIRCUIT_BREAK';

export interface ComplianceRequirement {
  id: string;
  regulation: RegulationId;
  articleOrSection: string;
  title: string;
  mappedControl: CgAgControlId;
  description: string;
  enforcementMode: EnforcementMode;
  sourceReference: SourceReference;
  /**
   * Defensible contextual rationale.
   * Clarifies why this requirement was selected for the given context
   * without claiming statutory legal omniscience.
   */
  rationale: string;
}

export type PolicyActionType = 'READ' | 'WRITE' | 'EXECUTE' | 'DELETE' | 'ADMIN';
export type PolicyDataClassification = 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED';

export interface CompliancePolicyCondition {
  toolNames?: string[];
  actionTypes?: PolicyActionType[];
  dataClassifications?: PolicyDataClassification[];
  payloadConditions?: Record<string, any>;
}

export interface CompliancePolicy {
  policyId: string;
  policyVersion: string;
  controlId: CgAgControlId;
  requirementId?: string;
  title: string;
  description: string;
  condition: CompliancePolicyCondition;
  verdict: 'ALLOW' | 'BLOCK' | 'REQUIRE_HITL' | 'CIRCUIT_BREAK';
  reasonTemplate: string;
}

export interface ComplianceProfileContext {
  jurisdiction: string[];
  industries: string[];
  dataClassifications: string[];
  autonomyLevels?: string[];
}

export interface ComplianceProfile {
  profileId: string;
  version: string;
  name: string;
  description: string;
  compilerVersion: string; // e.g. "CG-COMPILER-1.0.0"
  applicableRegulations: RegulationId[];
  mandatoryControls: CgAgControlId[];
  requirements: ComplianceRequirement[];
  executablePolicies: CompliancePolicy[];
  forbiddenActions: string[];
  requireHumanApproval: string[];
  evidenceRequirements: string[];
  applicabilityContext: ComplianceProfileContext;
  sourceReferences: SourceReference[];
  createdAt: string;
  checksum: string; // Deterministic SHA-256 of canonical payload
}

// --------------------------------------------------------------------------
// Deterministic Canonicalization & Checksumming
// --------------------------------------------------------------------------

/**
 * Recursively canonicalizes an object or array by sorting all object keys
 * and normalizing structures for stable JSON serialization.
 */
export function canonicalizeValue(value: any): any {
  if (value === null || typeof value !== 'object') {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(canonicalizeValue);
  }
  const sortedKeys = Object.keys(value).sort();
  const result: Record<string, any> = {};
  for (const key of sortedKeys) {
    result[key] = canonicalizeValue(value[key]);
  }
  return result;
}

/**
 * Generates the canonical JSON representation of a profile for checksum calculation.
 * 
 * Strict Invariants:
 * 1. Excludes 'checksum' itself (prevent circularity).
 * 2. Excludes 'createdAt' (prevent volatile timestamp divergence).
 * 3. Normalizes and sorts string arrays representing sets:
 *    - applicableRegulations
 *    - mandatoryControls
 *    - forbiddenActions
 *    - requireHumanApproval
 *    - evidenceRequirements
 * 4. Deterministically serializes all objects with sorted keys.
 */
export function canonicalizeProfileForChecksum(profile: Partial<ComplianceProfile>): string {
  // Strip volatile and circular fields
  const { checksum, createdAt, ...corePayload } = profile;

  // Normalize set-like array ordering
  const normalizedPayload: Record<string, any> = {
    ...corePayload,
    applicableRegulations: corePayload.applicableRegulations ? [...corePayload.applicableRegulations].sort() : [],
    mandatoryControls: corePayload.mandatoryControls ? [...corePayload.mandatoryControls].sort() : [],
    forbiddenActions: corePayload.forbiddenActions ? [...corePayload.forbiddenActions].sort() : [],
    requireHumanApproval: corePayload.requireHumanApproval ? [...corePayload.requireHumanApproval].sort() : [],
    evidenceRequirements: corePayload.evidenceRequirements ? [...corePayload.evidenceRequirements].sort() : [],
  };

  const canonicalObj = canonicalizeValue(normalizedPayload);
  return JSON.stringify(canonicalObj);
}

/**
 * Computes a deterministic SHA-256 checksum for a compliance profile.
 */
export function calculateProfileChecksum(profile: Partial<ComplianceProfile>): string {
  const canonicalJson = canonicalizeProfileForChecksum(profile);
  return crypto.createHash('sha256').update(canonicalJson, 'utf8').digest('hex');
}

/**
 * Validates that a compliance profile's checksum truthfully matches its content.
 */
export function verifyProfileChecksum(profile: ComplianceProfile): boolean {
  if (!profile.checksum) return false;
  const recalculated = calculateProfileChecksum(profile);
  return profile.checksum === recalculated;
}
