import type { 
  DetectedAgent, 
  AgentSipoc, 
  ScannerResult, 
  SystemBusinessXRay, 
  BusinessXRayFlowStage, 
  BusinessImpactSummary, 
  AgentPassportPreviewData,
  InferredDomainContext,
  ScopeDecomposition,
  FindingsAuditDecomposition,
  CapabilityScope
} from '../../core/types';
import { classifyScopeFromPath } from '../../core/capability-detector';

/**
 * Maps an agent name, framework, tools, and context to a clear business role
 * and structured SIPOC (Supplier, Input, Process, Output, Customer) chain in professional English.
 */
export function getAgentBusinessAndSipoc(agent: DetectedAgent): {
  businessPurpose: string;
  sipoc: AgentSipoc;
} {
  const name = (agent.name || '').toLowerCase();
  const tools = agent.tools || [];
  const toolsStr = tools.join(' ').toLowerCase();
  const filePath = (agent.filePath || '').toLowerCase();

  // 1. Reviewer / Evaluator / Quality Gate
  if (name.includes('review') || name.includes('evaluat') || name.includes('critique') || name.includes('judge') || name.includes('validator')) {
    return {
      businessPurpose: 'Quality assurance, policy compliance verification, and response validation prior to customer dispatch.',
      sipoc: {
        businessRole: 'Quality Assurance & Compliance Oversight',
        supplier: 'Upstream Reasoning Pipeline / RAG Subsystem',
        input: 'Candidate agent response & validation criteria',
        process: 'Hallucination verification, tone alignment, and guardrail enforcement',
        output: 'Conformity verdict (Pass/Fail) with structured remediation feedback',
        customer: 'Downstream Delivery Gateway / Requesting User',
        processOwner: 'AI Quality, Ethics & Risk Governance Committee',
        technicalCustodian: 'Model Evaluation & MLOps Engineering',
        governanceStatus: 'PENDENTE_COMITE',
      },
    };
  }

  // 2. Router / Orchestrator / Dispatcher
  if (name.includes('router') || name.includes('orchestrat') || name.includes('dispatch') || name.includes('supervisor')) {
    return {
      businessPurpose: 'Semantic triage of inbound customer inquiries and dynamic routing to specialized domain agents.',
      sipoc: {
        businessRole: 'Semantic Request Triage & Intelligent Dispatch',
        supplier: 'API Gateway / User Interface Endpoint',
        input: 'Inbound natural language query / customer prompt',
        process: 'Intent classification via vector embeddings and deterministic business rules',
        output: 'Structured execution dispatch to designated specialist agent',
        customer: 'Specialist Domain Agents in Execution Graph',
        processOwner: 'Customer Experience (CX) & Operations Leadership',
        technicalCustodian: 'Systems Architecture & Graph Orchestration Team',
        governanceStatus: 'HOMOLOGADO',
      },
    };
  }

  // 3. Memory / Context / State Store
  if (name.includes('memory') || name.includes('state') || name.includes('context') || name.includes('history')) {
    return {
      businessPurpose: 'Short and long-term session memory management, context retention, and multi-turn state persistence.',
      sipoc: {
        businessRole: 'Session Memory & Context Governance',
        supplier: 'Interaction Event Stream / Session Store',
        input: 'User session identifier & historical conversation logs',
        process: 'Semantic context retrieval from vector cache and state hydration',
        output: 'Structured contextual prompt payload for decision engine',
        customer: 'Reasoning & Autonomous Decision Agents',
        processOwner: 'Data Protection Officer (DPO) & Privacy Leadership',
        technicalCustodian: 'Data Engineering & Vector Cache Operations',
        governanceStatus: 'PENDENTE_COMITE',
      },
    };
  }

  // 4. Research / RAG / Document Search / Web Scraping
  if (name.includes('research') || name.includes('rag') || name.includes('search') || name.includes('retriev') || name.includes('doc') || toolsStr.includes('scrape') || toolsStr.includes('search')) {
    return {
      businessPurpose: 'Autonomous information discovery, unstructured data retrieval, web scraping, and factual grounding.',
      sipoc: {
        businessRole: 'Autonomous Research & Factual Grounding',
        supplier: 'External Web APIs / Corporate Document Repositories',
        input: 'Research objective, search queries, and source parameters',
        process: 'Web indexing, vector similarity search, and automated content summarization',
        output: 'Verified factual citations, structured research briefs, and summarized data',
        customer: 'Downstream Synthesis & Content Generation Agents',
        processOwner: 'Knowledge Management & Enterprise Intelligence Unit',
        technicalCustodian: 'MLOps & Information Retrieval Engineering',
        governanceStatus: 'PENDENTE_COMITE',
      },
    };
  }

  // 5. Tool / Function Execution / Data Transformation
  if (name.includes('tool') || name.includes('execut') || name.includes('action') || name.includes('transform')) {
    const hasDb = toolsStr.includes('database') || toolsStr.includes('sql') || toolsStr.includes('postgres');
    return {
      businessPurpose: 'Enterprise tool execution, schema payload transformations, and external API system synchronization.',
      sipoc: {
        businessRole: 'System Integration & Action Execution',
        supplier: 'Decision Engine / Task Scheduling Queue',
        input: 'Structured execution command with parameter schema payload',
        process: hasDb 
          ? 'Relational query execution, schema mapping, and transactional mutation' 
          : 'External API invocation, response parsing, and error handling',
        output: 'Execution status telemetry and synchronized transaction state',
        customer: 'Enterprise Production Database / Target Business System',
        processOwner: 'Chief Information Security Officer (CISO) & Infrastructure Team',
        technicalCustodian: 'Backend Engineering & Integrations Squad',
        governanceStatus: 'HOMOLOGADO',
      },
    };
  }

  // 6. Credit / Finance / Risk Agent
  if (name.includes('credit') || name.includes('financ') || name.includes('risk') || name.includes('scoring') || name.includes('underwrit')) {
    return {
      businessPurpose: 'Financial profile evaluation, credit risk computation, and policy-governed loan recommendations.',
      sipoc: {
        businessRole: 'Credit Risk Modeling & Underwriting Assessment',
        supplier: 'Customer Onboarding Portals & Credit Bureaus',
        input: 'Income declarations, transaction histories, and requested limits',
        process: 'Predictive risk modeling, solvency verification, and rule evaluation',
        output: 'Credit assessment report with interest rate and limit recommendation',
        customer: 'Credit Committee (Human-in-the-Loop) & Core Banking Platform',
        processOwner: 'Chief Risk Officer (CRO) & Regulatory Compliance',
        technicalCustodian: 'Quantitative Risk Modeling & Financial Engineering',
        governanceStatus: 'PENDENTE_COMITE',
      },
    };
  }

  // 7. Communications / Drafting / Email Agent
  if (name.includes('mail') || name.includes('draft') || name.includes('slack') || name.includes('message') || toolsStr.includes('draft') || toolsStr.includes('mail')) {
    return {
      businessPurpose: 'Automated communication drafting, thread synthesis, and contextual outreach orchestration.',
      sipoc: {
        businessRole: 'Communication Drafting & Workflow Automation',
        supplier: 'Inbound Communication Triggers / Notification Queue',
        input: 'Context thread history, communication objective, and recipient metadata',
        process: 'Context synthesis, tone calibration, and draft generation',
        output: 'Communication drafts ready for review or automated dispatch',
        customer: 'Business Stakeholders & Customer Communication Channels',
        processOwner: 'Communications & Business Operations Management',
        technicalCustodian: 'Enterprise Application Integration Team',
        governanceStatus: 'HOMOLOGADO',
      },
    };
  }

  // 8. Software Development / Code Patching / DevOps
  if (name.includes('patch') || name.includes('flowix') || name.includes('code') || name.includes('devops') || name.includes('terminal') || filePath.includes('patch') || filePath.includes('terminal')) {
    return {
      businessPurpose: 'AI-assisted code analysis, automated patch generation, and development workflow orchestration.',
      sipoc: {
        businessRole: 'AI-Assisted Software Development & Workflow Automation',
        supplier: 'Source Code Repositories & CI/CD Pipelines',
        input: 'Code files, defect descriptions, and test logs',
        process: 'AST inspection, automated patch synthesis, and regression verification',
        output: 'Verified code modifications and automated patch proposals',
        customer: 'Software Engineering Teams & Release Gateways',
        processOwner: 'VP of Engineering & Software Architecture Committee',
        technicalCustodian: 'DevOps & Developer Productivity Engineering',
        governanceStatus: 'PENDENTE_COMITE',
      },
    };
  }

  // 9. ReAct / Conversational Agent
  if (name.includes('react') || name.includes('chat') || name.includes('convers') || name.includes('assistant')) {
    return {
      businessPurpose: 'Interactive customer dialog, query resolution, and multi-step ReAct autonomous problem solving.',
      sipoc: {
        businessRole: 'Conversational Support & Autonomous Reasoning',
        supplier: 'End User Interface / Digital Interaction Channels',
        input: 'Natural language dialogue & customer requests',
        process: 'ReAct reasoning loop (Thought ➔ Action ➔ Observation)',
        output: 'Accurate natural language response & triggered operational actions',
        customer: 'End Customer / Digital Channel Consumer',
        processOwner: 'Digital Channels & Customer Experience Leadership',
        technicalCustodian: 'Conversational AI Engineering Squad',
        governanceStatus: 'HOMOLOGADO',
      },
    };
  }

  // 10. Intelligent Contextual Inference from Tools (if name is generic like 'agents', 'trip_agents', etc.)
  let inferredRole = 'Autonomous Workflow Orchestration';
  let inferredPurpose = 'Automated multi-step reasoning and system execution across enterprise services.';
  let inferredCustomer = 'Enterprise Application Pipeline & Business Stakeholders';

  if (toolsStr.includes('scrape') || toolsStr.includes('search') || toolsStr.includes('browser')) {
    inferredRole = 'Web Intelligence & Automated Research';
    inferredPurpose = 'Automated data gathering, external web search, and market intelligence synthesis.';
    inferredCustomer = 'Business Intelligence & Operations Teams';
  } else if (toolsStr.includes('file') || toolsStr.includes('write') || toolsStr.includes('template')) {
    inferredRole = 'Automated Content & Document Generation';
    inferredPurpose = 'Template rendering, document assembly, and structured file generation.';
    inferredCustomer = 'Enterprise Content & Publishing Systems';
  } else if (toolsStr.includes('calc') || toolsStr.includes('math')) {
    inferredRole = 'Quantitative Analysis & Calculation';
    inferredPurpose = 'Mathematical modeling, algorithmic evaluation, and metric calculation.';
    inferredCustomer = 'Decision Support & Analytics Subsystems';
  }

  const cleanName = agent.name.replace(/^lang(chain|graph)_/i, '').replace(/_/g, ' ');
  const detectedFw = inferAgentFramework(agent);

  return {
    businessPurpose: inferredPurpose,
    sipoc: {
      businessRole: inferredRole,
      supplier: 'Workflow Orchestration Graph / Task Queue',
      input: 'Task execution parameters and operational state',
      process: `Multi-step agentic execution via ${detectedFw} with tool invocations`,
      output: 'Completed task payload and state synchronization telemetry',
      customer: inferredCustomer,
      processOwner: 'AI Systems Product & Engineering Leadership',
      technicalCustodian: 'Enterprise AI Development Squad',
      governanceStatus: 'PENDENTE_COMITE',
    },
  };
}

/**
 * Accurately infers framework from agent name, tools, and path.
 */
export function inferAgentFramework(agent: DetectedAgent): string {
  if (agent.framework && 
      agent.framework !== 'Framework Genérico' && 
      agent.framework !== 'Generic' && 
      agent.framework !== 'Custom Agent') {
    return agent.framework;
  }
  const name = (agent.name || '').toLowerCase();
  const filePath = (agent.filePath || '').toLowerCase();
  const tools = (agent.tools || []).join(' ').toLowerCase();

  if (name.includes('langgraph') || filePath.includes('langgraph') || tools.includes('langgraph') || filePath.includes('multi_agent')) {
    return 'LangGraph';
  }
  if (name.includes('crewai') || filePath.includes('crewai') || tools.includes('crewai')) {
    return 'CrewAI';
  }
  if (name.includes('autogen') || filePath.includes('autogen') || tools.includes('autogen')) {
    return 'AutoGen';
  }
  if (name.includes('langchain') || filePath.includes('langchain') || tools.includes('langchain')) {
    return 'LangChain';
  }
  if (name.includes('dify') || filePath.includes('dify') || tools.includes('dify')) {
    return 'Dify';
  }
  if (name.includes('llama_index') || name.includes('llamaindex') || filePath.includes('llama')) {
    return 'LlamaIndex';
  }
  if (name.includes('claude') || name.includes('anthropic') || filePath.includes('claude')) {
    return 'Anthropic Claude';
  }
  if (name.includes('openai') || filePath.includes('openai') || tools.includes('openai')) {
    return 'OpenAI Agents SDK';
  }
  if (name.includes('mcp') || filePath.includes('mcp') || tools.includes('mcp')) {
    return 'Model Context Protocol (MCP)';
  }
  if (name.includes('rag') || name.includes('retriev')) {
    return 'Agentic RAG Engine';
  }
  if (name.includes('react') || name.includes('executor')) {
    return 'ReAct Agent Pipeline';
  }
  return 'Python AI Workflow';
}

/**
 * Categorizes a list of raw capability targets into clean, executive clusters.
 */
function clusterCapabilities(capabilities: Array<{ resourceTarget: string; action: string; systemType: string }>): {
  categories: string[];
  totalActionsCount: number;
  distinctTargetsCount: number;
} {
  const categories = new Set<string>();
  const allTargets = new Set<string>();

  for (const cap of capabilities) {
    allTargets.add(cap.resourceTarget);
    const target = cap.resourceTarget.toLowerCase();
    const sys = cap.systemType.toLowerCase();

    if (target.includes('search') || target.includes('scrape') || target.includes('browser') || target.includes('tavily') || target.includes('serper') || target.includes('website')) {
      categories.add('Web Intelligence & Scraping Tools');
    } else if (target.includes('mail') || target.includes('draft') || target.includes('slack') || target.includes('message')) {
      categories.add('Communication & Messaging Gateways');
    } else if (target.includes('file') || target.includes('write') || target.includes('read') || target.includes('template') || target.includes('markdown') || target.includes('dir')) {
      categories.add('File System & Document Generation');
    } else if (sys === 'database' || target.includes('profile') || target.includes('patch') || target.includes('user') || target.includes('order') || target.includes('repo') || target.includes('table') || target.includes('alias') || target.includes('thread')) {
      categories.add('Database Records & Schema Entities');
    } else if (sys === 'cloud_storage' || target.includes('s3') || target.includes('bucket')) {
      categories.add('Cloud Object Storage Buckets');
    } else if (target.includes('calc') || target.includes('math') || target.includes('tool_')) {
      categories.add('Analytical & Computational Utilities');
    } else {
      categories.add('Specialized Function Call Schemas');
    }
  }

  return {
    categories: Array.from(categories),
    totalActionsCount: capabilities.length,
    distinctTargetsCount: allTargets.size
  };
}

/**
 * Evaluates scope ranking for selecting representative AI Asset in Passport.
 * Priority: production -> infrastructure -> example -> benchmark -> test -> fixture -> unknown
 */
function getScopeRank(scope: CapabilityScope): number {
  switch (scope) {
    case 'production': return 1;
    case 'infrastructure': return 2;
    case 'example': return 3;
    case 'benchmark': return 4;
    case 'test': return 5;
    case 'fixture': return 6;
    case 'unknown':
    default: return 7;
  }
}

/**
 * Extracts a structured, executive-grade Business & Governance X-Ray from a ScannerResult.
 * Implements strict scope decomposition, findings audit, and asset selection hierarchy.
 */
export function extractSystemBusinessXRay(result: ScannerResult): SystemBusinessXRay {
  const agents: DetectedAgent[] = result.source?.agents || [];
  const capabilities = result.agentCapabilities || [];
  const identities = result.agentIdentities || [];
  const violations = result.violations || [];
  const repoName = result.repo?.name || 'Scanned AI System';

  // 1. SCOPE DECOMPOSITION
  let prodCapCount = 0;
  let nonProdCapCount = 0;
  let infraCapCount = 0;
  let unknownCapCount = 0;

  for (const cap of capabilities) {
    const s = cap.scope || (cap.filePath ? classifyScopeFromPath(cap.filePath) : 'unknown');
    if (s === 'production') {
      prodCapCount++;
    } else if (s === 'test' || s === 'example' || s === 'benchmark' || s === 'fixture') {
      nonProdCapCount++;
    } else if (s === 'infrastructure') {
      infraCapCount++;
    } else {
      unknownCapCount++;
    }
  }

  const scopeDecomposition: ScopeDecomposition = {
    productionCount: prodCapCount,
    nonProductionCount: nonProdCapCount,
    infrastructureCount: infraCapCount,
    unknownCount: unknownCapCount
  };

  // 2. FINDINGS AUDIT DECOMPOSITION (Epistemically separated from raw static regex counts)
  const totalTechnicalFindings = violations.length;

  // Real governance gaps: production-scoped capabilities with unverified auth/anomalies + destructive actions without HITL + prod criticals
  const prodCapsWithUnverifiedAuth = capabilities.filter(c => {
    const s = c.scope || (c.filePath ? classifyScopeFromPath(c.filePath) : 'unknown');
    const isUnverified = c.state === 'UNKNOWN_AUTHORIZATION' || !c.authorizationEvidence;
    return s === 'production' && isUnverified;
  }).length;

  const destructiveWithoutHitl = capabilities.filter(c => 
    c.isDestructive && c.anomalies?.includes('DESTRUCTIVE_ACTION_WITHOUT_VERIFIED_HITL')
  ).length;

  const prodCriticalViolations = violations.filter(v => {
    const isCritical = v.severity === 'critical';
    const s = classifyScopeFromPath(v.file);
    return isCritical && s === 'production';
  }).length;

  // High-Priority Governance Findings represents actionable governance exposures, not raw code regex lines
  const highPriorityGovernanceFindings = Math.max(
    prodCapsWithUnverifiedAuth + destructiveWithoutHitl + prodCriticalViolations,
    prodCapCount > 0 ? prodCapCount : (totalTechnicalFindings > 0 ? Math.min(12, totalTechnicalFindings) : 0)
  );

  const productionScopeHighRiskFindings = prodCapCount;

  const findingsDecomposition: FindingsAuditDecomposition = {
    totalTechnicalFindings,
    highPriorityGovernanceFindings,
    productionScopeHighRiskFindings
  };

  // 3. REPRESENTATIVE AI ASSET SELECTION FOR PASSPORT PREVIEW
  // Priority: production -> infrastructure -> example -> benchmark -> test -> fixture -> unknown
  // Secondary: Core operational persona / backend service > UI widget / modal / detail view
  let selectedAgent: DetectedAgent | undefined;
  let selectedAgentScope: CapabilityScope = 'unknown';

  if (agents.length > 0) {
    const scoredAgents = agents.map(agent => {
      const scope = agent.filePath ? classifyScopeFromPath(agent.filePath) : classifyScopeFromPath(agent.name);
      let preferenceScore = 0;

      // Bonus for operational attributes
      if (agent.tools && agent.tools.length > 0) preferenceScore += 20;
      if (agent.models && agent.models.length > 0) preferenceScore += 10;
      if (agent.critical) preferenceScore += 15;

      const name = agent.name.toLowerCase();
      // Bonus for core/service/engine keywords
      if (/core|engine|orchestrat|service|worker|pipeline|remediat|underwrit|process|assistant|backend|agent/i.test(name)) {
        preferenceScore += 10;
      }

      // Penalty for pure UI screens, dialogs, widgets, buttons
      if (/detail|submit|button|modal|dialog|view|screen|window|form|css|style|widget|effect/i.test(name)) {
        preferenceScore -= 30;
      }

      return { agent, scope, rank: getScopeRank(scope), preferenceScore };
    });

    // Sort by primary scope rank, then by operational preference score
    scoredAgents.sort((a, b) => {
      if (a.rank !== b.rank) return a.rank - b.rank;
      return b.preferenceScore - a.preferenceScore;
    });

    selectedAgent = scoredAgents[0].agent;
    selectedAgentScope = scoredAgents[0].scope;
  }

  const hasProductionAgent = selectedAgentScope === 'production';
  const { sipoc } = selectedAgent 
    ? getAgentBusinessAndSipoc(selectedAgent) 
    : { sipoc: { businessRole: 'Autonomous AI Workflow', customer: 'Enterprise Consumers' } as any };

  // 4. INFERRED DOMAIN & BUSINESS PROCESS CONTEXT
  const fullText = (repoName + ' ' + capabilities.map(c => c.resourceTarget).join(' ') + ' ' + agents.map(a => a.name).join(' ')).toLowerCase();
  
  let domain = 'General Enterprise Automation';
  let domainEvidence = 'Detected multi-step autonomous workflows and task orchestration.';
  let domainConfidence: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
  let primaryProcessName = sipoc.businessRole || 'Autonomous Workflow Orchestration';

  if (/flowix|patch|repo|code|git|devops|build|ci|cd|terminal/i.test(fullText)) {
    domain = 'Software Engineering & Autonomous DevOps';
    domainEvidence = 'Keywords and capabilities related to repository files, code patches, terminals, and development workflows.';
    domainConfidence = 'MEDIUM';
    primaryProcessName = 'AI-Assisted Software Development & Workflow Automation';
  } else if (/credit|loan|bank|fraud|fintech|payment|underwriting|invest/i.test(fullText)) {
    domain = 'FinTech & Financial Services';
    domainEvidence = 'Keywords and resource targets related to credit, transactions, or financial ledger.';
    domainConfidence = 'MEDIUM';
    primaryProcessName = 'Autonomous Credit Underwriting & Risk Modeling';
  } else if (/patient|health|clinical|doctor|hipaa|medical|hospital/i.test(fullText)) {
    domain = 'Healthcare & Life Sciences';
    domainEvidence = 'Keywords and resource targets related to clinical, medical, or patient data.';
    domainConfidence = 'MEDIUM';
    primaryProcessName = 'Clinical Data Ingestion & Decision Support';
  } else if (/scrape|search|instagram|trip|travel|content/i.test(fullText)) {
    domain = 'Digital Media & Web Intelligence';
    domainEvidence = 'Keywords and tool schemas related to web scraping, social search, and content synthesis.';
    domainConfidence = 'MEDIUM';
    primaryProcessName = 'Web Intelligence & Automated Research';
  }

  const domainContext: InferredDomainContext = {
    domain,
    evidence: domainEvidence,
    confidence: domainConfidence
  };

  // 5. STAGE 1: Customer / Source Data (SUPPLIERS & INPUTS)
  const readCaps = capabilities.filter(c => c.action === 'READ');
  const readResources = Array.from(new Set(readCaps.map(c => c.resourceTarget))).filter(Boolean);
  
  let stage1Items: string[];
  let stage1Confidence: 'DIRECTLY_DERIVED' | 'INFERRED' | 'NOT_VERIFIED';
  
  if (readResources.length > 0) {
    stage1Confidence = 'DIRECTLY_DERIVED';
    stage1Items = readResources.slice(0, 3).map(r => `Database Table: ${r}`);
    if (readResources.length > 3) {
      stage1Items.push(`+ ${readResources.length - 3} additional data tables`);
    }
  } else {
    stage1Confidence = 'INFERRED';
    stage1Items = [
      'Inbound Prompts & API Payloads',
      'Contextual User Inputs'
    ];
  }

  // 6. STAGE 2: AI Assessment & Reasoning (PROCESS & DECISION)
  const agentNames = Array.from(new Set(agents.map(a => a.name))).slice(0, 3);
  let stage2Items: string[];
  let stage2Confidence: 'DIRECTLY_DERIVED' | 'INFERRED' | 'NOT_VERIFIED';

  if (agentNames.length > 0) {
    stage2Confidence = 'DIRECTLY_DERIVED';
    stage2Items = agentNames.map(name => `Agent: ${name.replace(/_/g, ' ')}`);
    if (agents.length > 3) {
      stage2Items.push(`+ ${agents.length - 3} additional agent components`);
    }
  } else {
    stage2Confidence = 'INFERRED';
    stage2Items = ['Algorithmic Reasoning Engine'];
  }

  // 7. STAGE 3: Decision & Execution (OUTPUTS & ACTIONS)
  const cluster = clusterCapabilities(capabilities);
  let stage3Items: string[];
  let stage3Confidence: 'DIRECTLY_DERIVED' | 'INFERRED' | 'NOT_VERIFIED';

  if (cluster.categories.length > 0) {
    stage3Confidence = 'DIRECTLY_DERIVED';
    stage3Items = cluster.categories.slice(0, 3);
    if (cluster.totalActionsCount > 3) {
      stage3Items.push(`(${cluster.totalActionsCount} operational capabilities mapped)`);
    }
  } else {
    stage3Confidence = 'INFERRED';
    stage3Items = ['LLM Model Inference & Text Generation'];
  }

  // 8. STAGE 4: Business Outcome & Stakeholders (CUSTOMERS & OUTCOMES)
  const stage4Items = [
    `Impacted Domain: ${sipoc.customer || 'Enterprise Business Pipeline'}`,
    'Governance Target: Production Asset Registry'
  ];
  const stage4Confidence = 'INFERRED';

  const stages: BusinessXRayFlowStage[] = [
    {
      stageNumber: 1,
      stageName: 'Customer / Source Data',
      technicalSipocRole: 'SUPPLIERS & INPUTS',
      description: 'Data assets, tables, and ingestion sources fed into autonomous components.',
      items: stage1Items,
      confidence: stage1Confidence,
      sourceEvidence: readResources.length > 0 ? `${readResources.length} tables accessed via SQL/ORM READ` : 'AST Inferred'
    },
    {
      stageNumber: 2,
      stageName: 'AI Assessment & Reasoning',
      technicalSipocRole: 'PROCESS & DECISION',
      description: 'Discovered agent workflows, multi-step ReAct graphs, and prompt pipelines.',
      items: stage2Items,
      confidence: stage2Confidence,
      sourceEvidence: `${agents.length} agents detected in AST`
    },
    {
      stageNumber: 3,
      stageName: 'Decision & System Actions',
      technicalSipocRole: 'OUTPUTS & ACTIONS',
      description: 'Coded mutations, external tool invocations, and direct service executions.',
      items: stage3Items,
      confidence: stage3Confidence,
      sourceEvidence: `${capabilities.length} operational capabilities discovered`
    },
    {
      stageNumber: 4,
      stageName: 'Business Outcome & Impact',
      technicalSipocRole: 'CUSTOMERS & OUTCOMES',
      description: 'Downstream business stakeholders, production environments, and regulatory scope.',
      items: stage4Items,
      confidence: stage4Confidence,
      sourceEvidence: 'Contextual Architecture Derivation'
    }
  ];

  // 9. BUSINESS IMPACT SUMMARY (CLEAN & EXECUTIVE)
  const resourcesAffected = cluster.categories.length > 0 
    ? cluster.categories.slice(0, 3) 
    : ['In-Memory Prompt Context & LLM Service'];

  const distinctActions: string[] = [];
  if (capabilities.some(c => c.action === 'WRITE')) distinctActions.push('State Mutation & Record Insertion');
  if (capabilities.some(c => c.action === 'EXECUTE')) distinctActions.push('External Tool & API Invocations');
  if (capabilities.some(c => c.action === 'READ')) distinctActions.push('Structured Data Querying & Inspection');
  if (capabilities.some(c => c.action === 'DELETE')) distinctActions.push('⚠️ Destructive Record Deletion');

  const impact: BusinessImpactSummary = {
    primaryProcess: primaryProcessName,
    resourcesAffected: resourcesAffected,
    potentialBusinessActions: distinctActions.length > 0 ? distinctActions : ['Natural Language Generation'],
    governanceStatus: 'Evidence Not Verified in Scanned Scope',
    productionExposureSummary: prodCapCount > 0 
      ? `${prodCapCount} capabilities identified in production-scoped code`
      : 'No production-scoped operational capabilities identified in current scan'
  };

  // 10. AGENT PASSPORT PREVIEW DATA
  const unverifiedCount = result.capabilitiesSummary?.unknownAuthorizationCount 
    ?? capabilities.filter(c => !c.authorizationEvidence || c.state === 'UNKNOWN_AUTHORIZATION').length;

  const assignedIdentity = identities.find(id => id.identityType !== 'unassigned');

  let passportAssetName: string;
  if (hasProductionAgent && selectedAgent) {
    passportAssetName = selectedAgent.name.replace(/_/g, ' ');
  } else if (prodCapCount > 0) {
    passportAssetName = repoName.split('/').pop() || repoName;
  } else {
    passportAssetName = 'NO PRODUCTION AI ASSET IDENTIFIED IN SCANNED SCOPE';
  }

  const passportPreview: AgentPassportPreviewData = {
    aiAsset: passportAssetName,
    businessProcess: hasProductionAgent ? primaryProcessName : 'Non-Production / Supporting Test Pipeline',
    owner: 'UNKNOWN (Unassigned Business Owner)',
    identityBinding: assignedIdentity 
      ? `${assignedIdentity.agentName} -> ${assignedIdentity.roleMapped || assignedIdentity.identityType}`
      : 'UNASSIGNED (No IAM / Service Account Binding Verified)',
    autonomyLevel: 'NOT VERIFIED IN SCANNED SCOPE',
    capabilitiesCount: capabilities.length,
    unverifiedAuthCount: unverifiedCount,
    verifiedHitl: 'NOT VERIFIED IN SCANNED SCOPE',
    isProductionAsset: hasProductionAgent || prodCapCount > 0
  };

  return {
    stages,
    impact,
    passportPreview,
    domainContext,
    industryContext: {
      sector: domain,
      evidence: domainEvidence,
      confidence: 'INFERRED_FROM_EVIDENCE'
    },
    scopeDecomposition,
    findingsDecomposition
  };
}
