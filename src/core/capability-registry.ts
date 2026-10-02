/**
 * ComplyPRO.pt — Sprint 3: Governed Capability Registry
 * 
 * Formalizes Governed Capabilities as first-class policy objects.
 * Capabilities define what an agent is permitted to request across TOOL, MODEL, and DATA channels,
 * along with their inherent risk level, data classifications, rate limits, budget boundaries, and HITL oversight rules.
 */

import { GovernanceChannel } from './guardian-service';

export type CapabilityRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type CapabilityAction = 'READ' | 'WRITE' | 'EXECUTE' | 'DELETE' | 'ADMIN';
export type DataClassification = 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED';

export type DataMaskingStrategy = 'REDACT' | 'MASK' | 'DIGEST' | 'DROP';

export interface GovernedCapability {
  id: string;
  name: string;
  description: string;
  channel: GovernanceChannel;
  riskLevel: CapabilityRiskLevel;
  allowedActions: CapabilityAction[];
  dataClassification: DataClassification;
  provider: string;
  rateLimit?: {
    requestsPerMinute: number;
  };
  budget?: {
    maxCostPerInvocationEur?: number;
  };
  hitl?: {
    required: boolean;
    condition?: string;
  };
  evidence?: {
    requiredFields: string[];
  };
  maskingRules?: Record<string, DataMaskingStrategy>;
  egressPolicy?: {
    externalModels?: 'ALLOW' | 'DENY' | 'REQUIRE_HITL';
  };
}

export class CapabilityRegistry {
  private static capabilities: Map<string, GovernedCapability> = new Map();
  private static isInitialized = false;

  private static initDefaults() {
    if (this.isInitialized) return;

    const defaultCapabilities: GovernedCapability[] = [
      {
        id: 'crm.read_customer',
        name: 'CRM Read Customer Profile',
        description: 'Read customer account metadata and public KYC records',
        channel: 'TOOL',
        riskLevel: 'LOW',
        allowedActions: ['READ'],
        dataClassification: 'CONFIDENTIAL',
        provider: 'salesforce-mcp-server',
        rateLimit: { requestsPerMinute: 60 },
        budget: { maxCostPerInvocationEur: 0.05 },
        hitl: { required: false },
        evidence: { requiredFields: ['customerId', 'operatorId'] }
      },
      {
        id: 'crm.update_customer',
        name: 'CRM Update Customer Details',
        description: 'Modify customer contact and address data in CRM',
        channel: 'TOOL',
        riskLevel: 'MEDIUM',
        allowedActions: ['WRITE'],
        dataClassification: 'CONFIDENTIAL',
        provider: 'salesforce-mcp-server',
        rateLimit: { requestsPerMinute: 30 },
        budget: { maxCostPerInvocationEur: 0.10 },
        hitl: { required: false },
        evidence: { requiredFields: ['customerId', 'changedFields'] }
      },
      {
        id: 'credit_bureau_query',
        name: 'Credit Bureau External Query',
        description: 'Queries national and international credit scoring bureaus',
        channel: 'TOOL',
        riskLevel: 'LOW',
        allowedActions: ['READ'],
        dataClassification: 'CONFIDENTIAL',
        provider: 'schufa-experian-gateway',
        rateLimit: { requestsPerMinute: 30 },
        budget: { maxCostPerInvocationEur: 0.50 },
        hitl: { required: false },
        evidence: { requiredFields: ['bureauQueryId', 'scoreDigest'] }
      },
      {
        id: 'credit_bureau.query',
        name: 'Credit Bureau Query (Alias)',
        description: 'Queries national and international credit scoring bureaus',
        channel: 'TOOL',
        riskLevel: 'LOW',
        allowedActions: ['READ'],
        dataClassification: 'CONFIDENTIAL',
        provider: 'schufa-experian-gateway',
        rateLimit: { requestsPerMinute: 30 },
        budget: { maxCostPerInvocationEur: 0.50 },
        hitl: { required: false },
        evidence: { requiredFields: ['bureauQueryId', 'scoreDigest'] }
      },
      {
        id: 'credit.approve',
        name: 'Credit Decision Approval',
        description: 'Approve or increase customer credit lines and overdraft limits',
        channel: 'TOOL',
        riskLevel: 'HIGH',
        allowedActions: ['WRITE', 'EXECUTE'],
        dataClassification: 'CONFIDENTIAL',
        provider: 'core-banking-system',
        rateLimit: { requestsPerMinute: 10 },
        budget: { maxCostPerInvocationEur: 1.00 },
        hitl: { required: true, condition: 'amount > 10000' },
        evidence: { requiredFields: ['customerId', 'approvedLimit', 'approverSignature'] }
      },
      {
        id: 'approve_credit_limit',
        name: 'Approve Credit Limit (Alias)',
        description: 'Formal sign-off on customer credit limit changes',
        channel: 'TOOL',
        riskLevel: 'HIGH',
        allowedActions: ['WRITE', 'EXECUTE'],
        dataClassification: 'CONFIDENTIAL',
        provider: 'core-banking-system',
        rateLimit: { requestsPerMinute: 10 },
        budget: { maxCostPerInvocationEur: 1.00 },
        hitl: { required: true, condition: 'amount > 10000' },
        evidence: { requiredFields: ['customerId', 'approvedLimit', 'approverSignature'] }
      },
      {
        id: 'transfer_funds',
        name: 'Discretionary Wire Transfer',
        description: 'Initiate external wire transfer to beneficiary accounts',
        channel: 'TOOL',
        riskLevel: 'HIGH',
        allowedActions: ['EXECUTE'],
        dataClassification: 'RESTRICTED',
        provider: 'swift-sepa-gateway',
        rateLimit: { requestsPerMinute: 5 },
        budget: { maxCostPerInvocationEur: 2.50 },
        hitl: { required: true },
        evidence: { requiredFields: ['transferId', 'amount', 'beneficiaryIban', 'approverId'] }
      },
      {
        id: 'storage.customer_dossier',
        name: 'Customer Dossier Archive',
        description: 'Access document archives and internal customer dossiers',
        channel: 'DATA',
        riskLevel: 'LOW',
        allowedActions: ['READ'],
        dataClassification: 'INTERNAL',
        provider: 's3-enterprise-archive',
        rateLimit: { requestsPerMinute: 100 },
        budget: { maxCostPerInvocationEur: 0.01 },
        hitl: { required: false },
        evidence: { requiredFields: ['dossierId', 'accessedSection'] }
      },
      {
        id: 'gpt-4o',
        name: 'OpenAI GPT-4o Model Inference',
        description: 'Approved enterprise general-purpose foundation model',
        channel: 'MODEL',
        riskLevel: 'MEDIUM',
        allowedActions: ['EXECUTE'],
        dataClassification: 'CONFIDENTIAL',
        provider: 'openai-azure-eu',
        rateLimit: { requestsPerMinute: 120 },
        budget: { maxCostPerInvocationEur: 0.03 },
        hitl: { required: false },
        evidence: { requiredFields: ['model', 'promptTokens', 'completionTokens'] }
      },
      {
        id: 'DIRECT_DB_DDL',
        name: 'Direct Database Schema Alteration',
        description: 'Arbitrary SQL DDL commands (ALTER, DROP, CREATE TABLE)',
        channel: 'TOOL',
        riskLevel: 'CRITICAL',
        allowedActions: ['DELETE', 'ADMIN'],
        dataClassification: 'RESTRICTED',
        provider: 'direct-postgresql-pool',
        rateLimit: { requestsPerMinute: 1 },
        budget: { maxCostPerInvocationEur: 10.00 },
        hitl: { required: true, condition: 'always' },
        evidence: { requiredFields: ['sqlQuery', 'dbaApprovalToken'] }
      },
      {
        id: 'compliance.scan',
        name: 'CompliancePRO Remote AST Scanner',
        description: 'Execute remote AST and compliance analysis on target codebase',
        channel: 'TOOL',
        riskLevel: 'MEDIUM',
        allowedActions: ['EXECUTE'],
        dataClassification: 'INTERNAL',
        provider: 'compliancepro-api',
        rateLimit: { requestsPerMinute: 20 },
        budget: { maxCostPerInvocationEur: 0.15 },
        hitl: { required: false },
        evidence: { requiredFields: ['scanId', 'targetRepo', 'complianceScore'] }
      },
      {
        id: 'customer.read',
        name: 'Governed Customer Data Read',
        description: 'Read customer profiles and financial records with strict PII masking',
        channel: 'DATA',
        riskLevel: 'HIGH',
        allowedActions: ['READ'],
        dataClassification: 'CONFIDENTIAL',
        provider: 'postgresql',
        rateLimit: { requestsPerMinute: 60 },
        budget: { maxCostPerInvocationEur: 0.05 },
        hitl: { required: false },
        evidence: { requiredFields: ['customerId', 'accessedFields'] },
        maskingRules: {
          full_name: 'REDACT',
          tax_number: 'DIGEST'
        },
        egressPolicy: {
          externalModels: 'DENY'
        }
      },
      {
        id: 'customer.export',
        name: 'Customer Data Bulk Export',
        description: 'Bulk extract of sensitive customer records requiring compliance officer approval',
        channel: 'DATA',
        riskLevel: 'CRITICAL',
        allowedActions: ['READ', 'EXECUTE'],
        dataClassification: 'RESTRICTED',
        provider: 'postgresql',
        rateLimit: { requestsPerMinute: 5 },
        budget: { maxCostPerInvocationEur: 5.00 },
        hitl: { required: true, condition: 'Bulk customer export requires human approval' },
        evidence: { requiredFields: ['batchId', 'approverId', 'recordCount'] },
        maskingRules: {
          full_name: 'REDACT',
          tax_number: 'DIGEST'
        }
      }
    ];

    for (const cap of defaultCapabilities) {
      this.capabilities.set(cap.id, cap);
    }
    this.isInitialized = true;
  }

  public static register(capability: GovernedCapability): void {
    this.initDefaults();
    this.capabilities.set(capability.id, capability);
  }

  public static get(id: string): GovernedCapability | undefined {
    this.initDefaults();
    return this.capabilities.get(id);
  }

  public static exists(id: string): boolean {
    this.initDefaults();
    return this.capabilities.has(id);
  }

  public static getAll(): GovernedCapability[] {
    this.initDefaults();
    return Array.from(this.capabilities.values());
  }
}
