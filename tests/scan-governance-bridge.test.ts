import { describe, it, expect, beforeEach } from 'vitest';
import { ScanGovernanceBridge } from '../src/web/services/scan-governance-bridge';
import { DecisionStore } from '../src/web/services/decision-store';
import { HitlStore } from '../src/web/services/hitl-store';
import { RemediationStore } from '../src/web/services/remediation-store';
import { EvidenceStore } from '../src/web/services/evidence-store';
import { AuditLedgerStore } from '../src/web/services/audit-ledger-store';
import { FinOpsStore } from '../src/web/services/finops-store';
import type { ScannerResult } from '../src/core/types';

describe('Phase 10-Light: ScanGovernanceBridge (Maximum Coverage - Zero Redundancy)', () => {
  beforeEach(() => {
    ScanGovernanceBridge.clearIngestedData();
  });

  const sampleMockResult: ScannerResult = {
    repo: {
      name: 'financial-trading-copilot',
      fullName: 'enterprise-org/financial-trading-copilot',
      fileCount: 42
    },
    owner: {
      label: 'Quantitative AI Engineering',
      role: 'Chief AI Architect',
      teams: ['Trading Algorithmic Systems']
    },
    source: {
      agents: [
        {
          name: 'TradingExecutionAgent',
          role: 'Autonomous Trade Placement and Liquidity Routing',
          framework: 'LangGraph',
          autonomyLevel: 'L4_HIGH_AUTONOMY',
          tools: [
            { name: 'DirectMarketOrderTool', permission: 'EXECUTE_HIGH_PRIVILEGE', boundary: 'Exchange FIX Protocol' },
            { name: 'PortfolioBalanceReader', permission: 'READ_ONLY', boundary: 'Internal Ledger' }
          ],
          model: 'gpt-4o',
          temperature: 0.1
        },
        {
          name: 'MarketSentimentAnalyzer',
          role: 'Social Sentiment and News Ingestion',
          framework: 'CrewAI',
          autonomyLevel: 'L2_SUPERVISED',
          tools: [
            { name: 'TwitterFeedScraper', permission: 'READ_ONLY', boundary: 'Public Internet' }
          ],
          model: 'claude-3-5-sonnet',
          temperature: 0.3
        }
      ],
      aiModels: [
        { modelId: 'gpt-4o', provider: 'openai', totalOccurrences: 8 },
        { modelId: 'claude-3-5-sonnet', provider: 'anthropic', totalOccurrences: 4 }
      ]
    },
    risks: [
      {
        id: 'RISK-01',
        title: 'Unbounded High-Privilege Execution in Trade Execution Loop',
        category: 'security',
        severity: 'critical',
        file: 'src/agents/trading_executor.py',
        line: 142,
        recommendation: 'Add HITL authorization gate before executing orders exceeding 100,000 USD'
      },
      {
        id: 'RISK-02',
        title: 'Hardcoded API Key In Prompt Template',
        category: 'compliance',
        severity: 'high',
        file: 'src/prompts/sentiment.ts',
        line: 23,
        recommendation: 'Migrate secret to Azure Key Vault or AWS Secrets Manager'
      }
    ],
    violations: [
      {
        rule: 'CG-AG-RULE-005',
        category: 'AI_SECURITY',
        severity: 'HIGH',
        message: 'Prompt injection vulnerability in unsanitized input stream',
        file: 'src/connectors/news.py',
        line: 58,
        recommendation: 'Apply NeMo Guardrails or Llama Guard filter'
      }
    ],
    shadowAI: [
      {
        file: 'src/utils/experimental_helper.py',
        provider: 'Mistral-Local',
        modelId: 'mixtral-8x7b-instruct',
        usage: 'Direct raw HTTP call to unapproved endpoint',
        governed: false,
        reason: 'Unmonitored LLM gateway call bypassing security proxy'
      }
    ],
    enrichment: {
      pii: {
        totalFindings: 3,
        findings: [
          { type: 'CPF / SSN', file: 'src/data/customer_stream.py', count: 3 }
        ]
      }
    },
    compliance: {
      overallScore: 82,
      regulations: [
        { name: 'EU AI Act', score: 79, status: 'PARTIAL', gapsCount: 2 },
        { name: 'LGPD Art. 38', score: 85, status: 'COMPLIANT', gapsCount: 0 }
      ]
    },
    _costEstimate: {
      totalMonthlyUsd: 450,
      estimatedMonthlyTokens: 2500000,
      providerSummary: {
        openai: 300,
        anthropic: 150
      }
    }
  } as any;

  it('1. Ingests full ScannerResult and populates all domain entities with exact counts', () => {
    const result = ScanGovernanceBridge.ingestScan(sampleMockResult, {
      tenantId: 'tenant-acme-corp',
      workspaceId: 'ws-algorithmic-trading'
    });

    expect(result.entitiesIngested).toBe(2);
    expect(result.findingsIngested).toBe(4);
    expect(result.gatesIngested).toBe(4);
    expect(result.actionsIngested).toBe(4);
    expect(result.evidenceCreated).toBe(1);
    expect(result.ledgerBlockHeight).toBeGreaterThan(0);
    expect(result.isIdempotentReplay).toBe(false);
    expect(result.finOpsEstimatedMonthlyUsd).toBe(450);
  });

  it('2. Properly extracts AI Agents with Autonomy, Passports, and Tool Boundaries', () => {
    ScanGovernanceBridge.ingestScan(sampleMockResult);
    const agents = ScanGovernanceBridge.getIngestedAgents();

    expect(agents.length).toBe(2);
    const tradingAgent = agents.find(a => a.name === 'TradingExecutionAgent');
    expect(tradingAgent).toBeDefined();
    expect(tradingAgent?.autonomyLevel).toBe('L4_HIGH_AUTONOMY');
    expect(tradingAgent?.governanceStatus).toBe('CONDITIONAL');
    expect(tradingAgent?.riskClassification).toBe('HIGH_RISK_ART6');
    expect(tradingAgent?.tools.length).toBe(2);
    expect(tradingAgent?.passport.passportId).toContain('PASSPORT-AGT-SCAN');
    expect(tradingAgent?.passport.digitalSignature).toBeDefined();
    expect(tradingAgent?.sourceType).toBe('REAL_SCAN');
    expect(tradingAgent?.createdFromScan).toBe(true);
  });

  it('3. Populates DecisionStore with real Operational Findings and preserves file/line metadata', () => {
    ScanGovernanceBridge.ingestScan(sampleMockResult);
    const findings = DecisionStore.getFindings();

    expect(findings.length).toBe(4);
    const risk1 = findings.find(f => f.sourceTarget === 'src/agents/trading_executor.py:142');
    expect(risk1).toBeDefined();
    expect(risk1?.severity).toBe('CRITICAL');
    expect(risk1?.category).toBe('AI_SECURITY');
    expect(risk1?.sourceType).toBe('REAL_SCAN');
    expect(risk1?.controlId).toBe('CG-AG-05');
  });

  it('4. Automatically generates HITL Approval Requests in HitlStore for Critical/High findings', () => {
    ScanGovernanceBridge.ingestScan(sampleMockResult);
    const gates = HitlStore.getGates();

    expect(gates.length).toBe(4);
    expect(gates.every(g => g.status === 'PENDING_APPROVAL')).toBe(true);
    expect(gates.every(g => g.sourceType === 'REAL_SCAN')).toBe(true);
  });

  it('5. Automatically generates Remediation Actions in RemediationStore with owners and due dates', () => {
    ScanGovernanceBridge.ingestScan(sampleMockResult);
    const actions = RemediationStore.getActions();

    expect(actions.length).toBe(4);
    expect(actions.every(a => a.status === 'OPEN')).toBe(true);
    expect(actions.every(a => a.sourceType === 'REAL_SCAN')).toBe(true);
    expect(actions.some(a => a.description.includes('Azure Key Vault'))).toBe(true);
  });

  it('6. Updates FinOpsStore with real cost, token usage, and provider breakdown', () => {
    ScanGovernanceBridge.ingestScan(sampleMockResult);
    ScanGovernanceBridge.ingestScan(sampleMockResult);
    const finops = FinOpsStore.getUsage();

    expect(finops.length).toBe(1);
    expect(finops[0].currentSpendUSD).toBe(450);
    expect(finops[0].totalTokens).toBe(2500000);
    expect(finops[0].status).toBe('WITHIN_LIMIT');
  });

  it('7. Creates tamper-evident RFC 8785 Canonical Evidence record in EvidenceStore', () => {
    ScanGovernanceBridge.ingestScan(sampleMockResult);
    const records = EvidenceStore.getEvidenceRecords();
    const scanEvidence = records.find(r => (r.evidenceType as string) === 'SCAN_INGESTION_EVIDENCE');

    expect(scanEvidence).toBeDefined();
    expect(scanEvidence?.canonicalizationStatus).toBe('CANONICAL_JSON_RFC8785');
    expect(scanEvidence?.integrityDigest).toContain('SHA256:');
    expect(scanEvidence?.status).toBe('SEALED_IN_LEDGER');
    expect(scanEvidence?.createdFromScan).toBe(true);
  });

  it('8. Appends Block to AuditLedgerStore maintaining cryptographic hash chain', () => {
    const blocksBefore = AuditLedgerStore.getBlocks().length;
    ScanGovernanceBridge.ingestScan(sampleMockResult);
    const blocksAfter = AuditLedgerStore.getBlocks();

    expect(blocksAfter.length).toBe(blocksBefore + 1);
    const latestBlock = blocksAfter[blocksAfter.length - 1];
    expect(latestBlock.actor).toBe('AST Ingestion Scanner');
    expect(latestBlock.eventType).toBe('PASSPORT_ISSUED');
    expect(latestBlock.blockHash).toContain('SHA256:');

    const auditVerification = AuditLedgerStore.verifyEntireLedger();
    expect(auditVerification.isChainValid).toBe(true);
  });

  it('9. Enforces Idempotency when scanning the exact same repository state', () => {
    const firstRun = ScanGovernanceBridge.ingestScan(sampleMockResult);
    expect(firstRun.isIdempotentReplay).toBe(false);

    const secondRun = ScanGovernanceBridge.ingestScan(sampleMockResult);
    expect(secondRun.isIdempotentReplay).toBe(true);
  });

  it('10. Resets cleanly to CANONICAL_BASELINE when cleared, preventing mock data pollution', () => {
    ScanGovernanceBridge.ingestScan(sampleMockResult);
    expect(ScanGovernanceBridge.getIngestedAgents().length).toBe(2);
    expect(DecisionStore.getFindings().length).toBe(4);

    ScanGovernanceBridge.clearIngestedData();
    expect(ScanGovernanceBridge.getIngestedAgents().length).toBe(0);
    expect(DecisionStore.getFindings().length).toBeGreaterThan(0);
    expect(DecisionStore.getFindings()[0].sourceType).toBeUndefined();
  });

  it('11. Handles Empty Scans gracefully (0 agents -> 0 artificial entities created)', () => {
    const emptyResult: ScannerResult = {
      repo: { name: 'empty-repo', fullName: 'org/empty-repo', fileCount: 2 },
      owner: { label: 'Security', role: 'DevSecOps', teams: ['AppSec'] },
      source: { agents: [], aiModels: [] },
      risks: [],
      violations: [],
      shadowAI: []
    } as any;

    const res = ScanGovernanceBridge.ingestScan(emptyResult);
    expect(res.entitiesIngested).toBe(0);
    expect(res.findingsIngested).toBe(0);
    expect(res.gatesIngested).toBe(0);
    expect(res.actionsIngested).toBe(0);
    expect(ScanGovernanceBridge.getIngestedAgents().length).toBe(0);
  });
});
