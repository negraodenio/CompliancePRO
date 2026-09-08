/**
 * ComplyPRO SEO Content Data Model (V3)
 * P0 Topical Authority & High-Intent Commercial Pages
 * 
 * Strict Technical Truth:
 * - Browser-based static AST analysis (no code upload)
 * - 5-State Epistemic Capability Model
 * - 12 CG-AG Governance Controls across 4 Pillars
 * - Tamper-evident hash-chained audit ledgers
 * - Universal MCP (14 tools, 7 resources, 4 prompts, fail-closed RBAC)
 * - Regulatory mapping (not certification or guaranteed compliance)
 */

export interface SeoSection {
  heading: string;
  subheading?: string;
  paragraphs: string[];
  bulletPoints?: string[];
  callout?: {
    type: 'epistemic' | 'security' | 'framework' | 'compliance';
    title: string;
    text: string;
  };
}

export interface SeoFaqItem {
  question: string;
  answer: string;
}

export interface SeoRelatedPage {
  slug: string;
  title: string;
  relationship: string;
}

export interface SeoPageData {
  slug: string;
  title: string;
  metaDescription: string;
  canonical: string;
  h1: string;
  badge: string;
  subtitle: string;
  searchIntent: 'informational' | 'commercial' | 'transactional';
  primaryKeyword: string;
  secondaryKeywords: string[];
  readingTimeMinutes: number;
  sections: SeoSection[];
  faq: SeoFaqItem[];
  relatedPages: SeoRelatedPage[];
  cta: {
    primaryText: string;
    primaryAction: 'scan' | 'briefing';
    secondaryText: string;
    secondaryAction: 'briefing' | 'scan';
  };
  schemaType: 'Article' | 'SoftwareApplication' | 'WebPage';
}

export const SEO_PAGES: Record<string, SeoPageData> = {
  '/ai-governance': {
    slug: '/ai-governance',
    title: 'Enterprise AI Governance: Ground Truth, Risk & Controls | ComplyPRO',
    metaDescription: 'Understand what enterprise AI governance requires in practice. Bridge the gap between static policy and source-code reality with technical AST discovery, 12 controls, and verifiable evidence.',
    canonical: 'https://www.complypro.pt/ai-governance',
    h1: 'Enterprise AI Governance: From Policy Declarations to Technical Ground Truth',
    badge: 'TECHNICAL GROUND TRUTH',
    subtitle: 'Why traditional compliance checklists fail with autonomous AI agents, and how to establish an evidence-based governance posture anchored in what your code actually executes.',
    searchIntent: 'informational',
    primaryKeyword: 'AI governance',
    secondaryKeywords: ['enterprise AI governance', 'AI governance framework', 'AI compliance', 'AI risk management'],
    readingTimeMinutes: 7,
    sections: [
      {
        heading: 'The Governance Gap: Why Policies Do Not Match Code Reality',
        paragraphs: [
          'Most enterprise AI governance programs operate on high-level declarations: ethics guidelines, vendor questionnaire forms, and acceptable-use policies. However, engineering teams deploy AI agents, tools, and LLM orchestration layers directly into codebases using libraries such as LangGraph, CrewAI, AutoGen, and custom Python scripts.',
          'A fundamental governance gap emerges: the compliance team writes policies regarding data protection and human oversight, while the codebase quietly instantiates external API connections, filesystem accesses, database mutations, and prompt execution loops that no governance team has reviewed or authorized.',
          'Bridging this gap requires technical discovery at the code level. Governance cannot depend on self-reported developer surveys; it must inspect the abstract syntax tree (AST) of the software to establish empirical ground truth before policies can be evaluated.'
        ],
        callout: {
          type: 'epistemic',
          title: 'The Ground-Truth Principle',
          text: 'Governance without technical verification is an assumption. An organization cannot govern what it has not empirically discovered in its repositories.'
        }
      },
      {
        heading: 'The Four Operational Pillars of AI Governance',
        paragraphs: [
          'Effective AI governance is not a single one-time audit; it is a structured operational lifecycle structured across four foundational pillars: DISCOVER, GOVERN, OPERATE, and ASSURE.',
          'Each pillar addresses a specific operational requirement in the lifecycle of an AI system:'
        ],
        bulletPoints: [
          'DISCOVER: Statically analyze repositories to catalog every agent, model provider, tool invocation, database connection, and shell execution.',
          'GOVERN: Evaluate discovered capabilities against 12 core controls (identity boundaries, tool scope, memory isolation, human oversight gates).',
          'OPERATE: Manage runtime human-in-the-loop approvals, exception queues, decision persistence, and incident failsafe protocols.',
          'ASSURE: Generate cryptographically verifiable AI Passports and maintain tamper-evident, hash-chained audit ledgers for internal and regulatory assurance.'
        ]
      },
      {
        heading: 'Regulatory Mapping: Navigating Global AI Mandates',
        paragraphs: [
          'Global regulatory frameworks—including the EU AI Act, ISO/IEC 42001, Brazil’s LGPD, and GDPR—require organizations to maintain detailed technical documentation, risk management systems, and proof of human oversight.',
          'It is critical to distinguish regulatory mapping from certified compliance. ComplyPRO maps discovered AST capabilities and gap findings directly to regulatory articles (e.g., EU AI Act Article 9 risk management, LGPD Article 38 RIPD requirements), equipping DPOs and CISOs with technical evidence without making unsubstantiated guarantees of legal certification.'
        ]
      }
    ],
    faq: [
      {
        question: 'What is the primary difference between AI security and AI governance?',
        answer: 'AI security focuses on defending against active adversarial attacks (prompt injection, model inversion, jailbreaking). AI governance encompasses technical discovery, permission boundaries, organizational accountability, regulatory mapping, and verifiable evidence generation.'
      },
      {
        question: 'How does ComplyPRO verify AI governance without executing code?',
        answer: 'ComplyPRO uses static AST (Abstract Syntax Tree) analysis performed locally in your browser. It parses code structure to detect autonomous agent frameworks, tool functions, and external connections without running untrusted code or transmitting your source code to external servers.'
      }
    ],
    relatedPages: [
      { slug: '/ai-capability-discovery', title: 'AI Capability Discovery', relationship: 'Foundational Discovery Layer' },
      { slug: '/ai-governance-framework', title: 'CG-AG Governance Framework', relationship: 'The 12 Operational Controls' },
      { slug: '/ai-agent-governance', title: 'AI Agent Governance', relationship: 'Autonomous Agent Focus' }
    ],
    cta: {
      primaryText: 'Run Free AI Governance Scan',
      primaryAction: 'scan',
      secondaryText: 'Book 15-Min Briefing',
      secondaryAction: 'briefing'
    },
    schemaType: 'Article'
  },

  '/ai-governance-platform': {
    slug: '/ai-governance-platform',
    title: 'ComplyPRO AI Governance Platform | Architecture & Controls',
    metaDescription: 'Explore the ComplyPRO AI Governance Platform architecture: browser-based static AST sensor, 12 CG-AG controls, AI Passports, tamper-evident audit ledgers, and Universal MCP.',
    canonical: 'https://www.complypro.pt/ai-governance-platform',
    h1: 'ComplyPRO AI Governance Platform Architecture',
    badge: 'ENTERPRISE PLATFORM',
    subtitle: 'A purpose-built governance operating system uniting static code analysis, policy verification, evidence ledgers, and MCP interoperability for modern AI agent systems.',
    searchIntent: 'commercial',
    primaryKeyword: 'AI governance platform',
    secondaryKeywords: ['AI governance software', 'enterprise AI governance', 'AI risk management platform', 'AI compliance platform'],
    readingTimeMinutes: 8,
    sections: [
      {
        heading: 'Purpose-Built for the Agentic Era',
        paragraphs: [
          'Enterprise software architecture has fundamentally changed with the advent of agentic frameworks. Unlike traditional deterministic software, AI agents dynamically choose tools, formulate queries, and chain operations. Traditional GRC software cannot parse code, while traditional static code analyzers (SAST) do not understand AI agent architectures.',
          'ComplyPRO is built specifically for this intersection. It parses multi-agent architectures (CrewAI, LangGraph, AutoGen, OpenAI Swarm), extracts tool decorators and functions, decomposes scopes (production vs. infrastructure vs. test), and correlates observed capabilities against strict governance baselines.'
        ]
      },
      {
        heading: 'Core Platform Capabilities',
        paragraphs: [
          'The platform delivers five integrated subsystems that operate collaboratively across the AI lifecycle:'
        ],
        bulletPoints: [
          'Client-Side Static AST Sensor: Inspects Python and TypeScript repositories directly in the browser with zero source code upload.',
          '5-State Epistemic Engine: Classifies discovered capabilities into verified safe, observed without authorization, or heuristically derived states.',
          'Cryptographic AI Passports: Generates structured, versioned asset passports detailing identity boundaries, authorized tools, and business lineage (SIPOC).',
          'Tamper-Evident Audit Ledger: Records governance decisions and finding snapshots using SHA-256 hash chaining for defensible assurance.',
          'Universal MCP Server: Exposes 14 canonical tools, 7 resources, and 4 prompts over Stdio and Streamable HTTP/SSE with fail-closed RBAC.'
        ],
        callout: {
          type: 'framework',
          title: 'Architectural Parity',
          text: 'The platform offers identical governance evaluation whether deployed on multi-tenant SaaS with PostgreSQL Row-Level Security (RLS) or within private, air-gapped enterprise POD environments.'
        }
      },
      {
        heading: 'Deployment Models: SaaS and Private POD',
        paragraphs: [
          'Enterprise security postures differ across industries. Financial institutions, healthcare systems, and defense contractors often require strict data residency and isolation.',
          'ComplyPRO supports both multi-tenant SaaS with database-enforced tenant isolation (PostgreSQL RLS) and dedicated Private POD deployments (VPC or air-gapped Docker containers) where all telemetry and storage remain entirely within the customer perimeter.'
        ]
      }
    ],
    faq: [
      {
        question: 'Does the platform require access to our live production database?',
        answer: 'No. The static scanner operates on code repositories. For operational decision tracking and ledger persistence, ComplyPRO uses its own database (Supabase multi-tenant or private PostgreSQL in POD deployments).'
      },
      {
        question: 'How does the Universal MCP server integrate with our IDEs?',
        answer: 'ComplyPRO Universal MCP provides a stdio transport for local IDEs (Cursor, Claude Desktop, VS Code) and a Streamable HTTP/SSE transport for enterprise workflow engines, secured by Bearer token authentication and role-based permissions.'
      }
    ],
    relatedPages: [
      { slug: '/ai-governance', title: 'Enterprise AI Governance', relationship: 'Methodological Foundation' },
      { slug: '/mcp-governance', title: 'Universal MCP Governance', relationship: 'Integration Layer' },
      { slug: '/ai-governance-assessment', title: 'AI Governance Assessment', relationship: 'Operational Workflow' }
    ],
    cta: {
      primaryText: 'Run Free AI Governance Scan',
      primaryAction: 'scan',
      secondaryText: 'Request Architecture Briefing',
      secondaryAction: 'briefing'
    },
    schemaType: 'SoftwareApplication'
  },

  '/ai-governance-assessment': {
    slug: '/ai-governance-assessment',
    title: 'AI Governance Assessment: Discovering Gaps in Code | ComplyPRO',
    metaDescription: 'Perform an evidence-based AI governance assessment. Detect unverified capabilities, missing human oversight gates, and regulatory exposure across agentic repositories.',
    canonical: 'https://www.complypro.pt/ai-governance-assessment',
    h1: 'Evidence-Based AI Governance Assessment',
    badge: 'AUDIT & DIAGNOSTIC',
    subtitle: 'How to replace subjective compliance questionnaires with automated, empirical gap analysis based on static source-code inspection.',
    searchIntent: 'commercial',
    primaryKeyword: 'AI governance assessment',
    secondaryKeywords: ['AI risk assessment', 'AI compliance audit', 'AI readiness assessment', 'AI agent audit'],
    readingTimeMinutes: 6,
    sections: [
      {
        heading: 'The Failure of Self-Reported AI Risk Questionnaires',
        paragraphs: [
          'When internal audit or compliance teams send questionnaires asking, "Does your AI system store PII or access external APIs?", developers frequently respond based on their intended design rather than actual code reality.',
          'In practice, developers import third-party libraries, configure logging handlers that output prompt transcripts, or equip agents with general-purpose shell tools for debugging. A valid assessment must inspect the codebase to verify what capabilities actually exist in the code.'
        ]
      },
      {
        heading: 'The Assessment Methodology: 4-Stage Verification',
        paragraphs: [
          'A ComplyPRO AI Governance Assessment follows a rigorous, four-stage technical process:'
        ],
        bulletPoints: [
          'Stage 1: Repository Scope Parsing — Separates production application logic from test fixtures, infrastructure scripts, and documentation.',
          'Stage 2: AST Extraction — Identifies agent definitions, system prompts, tool decorators, LLM API calls, and external protocol connectors.',
          'Stage 3: Epistemic Gap Analysis — Compares discovered capabilities against authorized baselines to flag unauthorized database writes, unverified network egress, and missing human gates.',
          'Stage 4: Evidence & Dossier Generation — Compiles findings into an executive governance summary, 12-control scorecard, and RIPD/DPIA regulatory dossier.'
        ],
        callout: {
          type: 'compliance',
          title: 'Audit-Proof Traceability',
          text: 'Every assessment finding is linked to specific file paths, line numbers, and AST node types, providing engineering and compliance teams with unambiguous, actionable facts.'
        }
      }
    ],
    faq: [
      {
        question: 'How long does an automated Free AI Governance Scan take?',
        answer: 'The scan executes locally in your browser in under 15 seconds for most repositories, immediately generating the Live AI Discovery Snapshot.'
      },
      {
        question: 'Can the assessment export formal regulatory documentation?',
        answer: 'Yes. Within the workspace, teams can export complete Markdown and PDF dossiers structured according to LGPD Article 38 (RIPD) and EU AI Act technical documentation guidelines.'
      }
    ],
    relatedPages: [
      { slug: '/ai-capability-discovery', title: 'AI Capability Discovery', relationship: 'Technical Mechanism' },
      { slug: '/free-ai-governance-scan', title: 'Free AI Governance Scan', relationship: 'Interactive Assessment' },
      { slug: '/ai-agent-security', title: 'AI Agent Security', relationship: 'Risk & Threat Scope' }
    ],
    cta: {
      primaryText: 'Start Free Assessment Scan',
      primaryAction: 'scan',
      secondaryText: 'Schedule Audit Review',
      secondaryAction: 'briefing'
    },
    schemaType: 'Article'
  },

  '/ai-agent-governance': {
    slug: '/ai-agent-governance',
    title: 'AI Agent Governance: Frameworks, Teams & Lifecycle | ComplyPRO',
    metaDescription: 'Govern autonomous AI agents and multi-agent teams. Establish tool permission boundaries, human sign-off gates, and cryptographic AI Passports with ComplyPRO.',
    canonical: 'https://www.complypro.pt/ai-agent-governance',
    h1: 'AI Agent Governance: Managing Autonomous Capabilities',
    badge: 'AUTONOMOUS SYSTEMS',
    subtitle: 'Establishing organizational control over agents that plan, select tools, and interact with production environments autonomously.',
    searchIntent: 'informational',
    primaryKeyword: 'AI agent governance',
    secondaryKeywords: ['agentic AI governance', 'autonomous agent security', 'multi-agent governance', 'AI agent lifecycle'],
    readingTimeMinutes: 7,
    sections: [
      {
        heading: 'Why Agents Represent a Paradigm Shift in AI Oversight',
        paragraphs: [
          'Simple LLM chatbots generate text outputs based on user prompts. In contrast, autonomous AI agents operate with goal-directed agency: they maintain scratchpads, formulate sub-tasks, select external tools, read databases, and execute actions with minimal intervention.',
          'Governing agents requires treating them not as static models, but as autonomous digital workers with designated roles, tool allowances, and operational perimeters. Without clear boundaries, an agent intended to summarize financial tickets can be prompted or chained into modifying balances.'
        ]
      },
      {
        heading: 'The Three Pillars of Agent Governance',
        paragraphs: [
          'ComplyPRO operationalizes agent governance around three structural requirements:'
        ],
        bulletPoints: [
          'Identity & Role Boundaries: Assigning explicit enterprise personas (e.g., Credit Analyst vs. Payment Disburser) and restricting cross-role capability inheritance.',
          'Explicit Tool Allowances: Mapping each agent to an authorized tool whitelist and flagging general-purpose execution tools (e.g., Python REPL, bash execution) as high-risk gaps.',
          'Human-in-the-Loop (HITL) Gates: Identifying where automated execution must halt until authorized personnel (CISO, DPO, or Operations Lead) review and sign off on privileged actions.'
        ],
        callout: {
          type: 'security',
          title: 'The Multi-Agent Delegation Risk',
          text: 'In multi-agent systems (e.g., CrewAI supervisor patterns), a low-privileged agent can delegate tasks to a high-privileged agent. Governance must verify the entire delegation graph, not just individual agent nodes.'
        }
      }
    ],
    faq: [
      {
        question: 'Which agent frameworks does ComplyPRO detect automatically?',
        answer: 'ComplyPRO includes detection patterns for LangGraph, CrewAI, AutoGen, OpenAI Swarm, Semantic Kernel, and generic custom agent classes defined in Python and TypeScript.'
      },
      {
        question: 'What is an AI Governance Passport?',
        answer: 'An AI Passport is a verifiable record documenting an agent’s verified capabilities, authorized tool whitelist, business purpose (SIPOC), regulatory classifications, and SHA-256 integrity hash.'
      }
    ],
    relatedPages: [
      { slug: '/ai-agent-security', title: 'AI Agent Security', relationship: 'Security Enforcement' },
      { slug: '/ai-capability-discovery', title: 'Capability vs Authorization', relationship: 'Permission Modeling' },
      { slug: '/mcp-governance', title: 'MCP Governance', relationship: 'Tool Protocol Standard' }
    ],
    cta: {
      primaryText: 'Scan Agents in Your Codebase',
      primaryAction: 'scan',
      secondaryText: 'Book Enterprise Briefing',
      secondaryAction: 'briefing'
    },
    schemaType: 'Article'
  },

  '/ai-agent-security': {
    slug: '/ai-agent-security',
    title: 'AI Agent Security: Tool Execution, Credential & Boundary Defense | ComplyPRO',
    metaDescription: 'Mitigate AI agent security vulnerabilities. Prevent unauthorized tool execution, credential leakage, and unverified data egress with static AST capability auditing.',
    canonical: 'https://www.complypro.pt/ai-agent-security',
    h1: 'AI Agent Security: Defending the Execution Boundary',
    badge: 'SECURITY ARCHITECTURE',
    subtitle: 'Technical security controls for agentic systems: identifying dangerous tools, credential exposure, and privilege escalation pathways in source code.',
    searchIntent: 'informational',
    primaryKeyword: 'AI agent security',
    secondaryKeywords: ['AI agent authorization', 'agentic security controls', 'AI agent threat modeling', 'AI tool permissions'],
    readingTimeMinutes: 8,
    sections: [
      {
        heading: 'The Attack Surface of Agentic Workflows',
        paragraphs: [
          'Autonomous agents introduce threat vectors that traditional web application firewalls and API gateways cannot intercept. When an LLM interprets untrusted data (indirect prompt injection) and subsequently invokes internal tools, the agent acts as a confused deputy with the credentials of its runtime environment.',
          'Common security failures discovered in enterprise repositories include:'
        ],
        bulletPoints: [
          'Arbitrary Tool Execution: Equipping agents with unrestricted shell, subprocess, or eval tools that allow remote code execution.',
          'Hardcoded Credentials & Environment Bleed: Agents reading broad process environment blocks, exposing cloud secrets and database keys to LLM context windows.',
          'Unverified Egress Channels: Tools connecting to external third-party webhook endpoints without TLS certificate pinning or domain allowlists.',
          'Absence of Fail-Closed Guards: Agent failure handlers falling back to permissive defaults rather than terminating execution.'
        ],
        callout: {
          type: 'security',
          title: 'Defense-in-Depth Principle',
          text: 'Never rely on natural language system prompts to enforce security boundaries. Security must be enforced structurally through static AST tool whitelisting and authenticated gateway controls.'
        }
      },
      {
        heading: 'The 10-Point Agent Security Checklist',
        paragraphs: [
          'ComplyPRO’s static analyzer evaluates codebases against ten critical agentic security invariants:'
        ],
        bulletPoints: [
          '1. Explicit Tool Scope — No general-purpose eval/exec tools in production agents.',
          '2. Input Schema Validation — All tool parameters validated with strict Pydantic/Zod schemas.',
          '3. Tenant Context Propagation — Isolation tokens passed through every multi-agent call.',
          '4. Credential Sanitization — Secrets scrubbed from agent memory and scratchpad logs.',
          '5. Egress Allowlisting — Outbound API calls restricted to verified corporate endpoints.',
          '6. Human Sign-Off Gates — Destructive, financial, or PII operations require explicit human confirmation.',
          '7. Memory Partitioning — Vector store embeddings separated by tenant boundaries.',
          '8. Fail-Closed Error Handlers — Network or LLM timeout defaults to terminating the workflow.',
          '9. Model Context Protocol Authentication — Remote MCP endpoints require cryptographic token validation.',
          '10. Tamper-Evident Logging — All tool invocations recorded in hash-chained audit ledgers.'
        ]
      }
    ],
    faq: [
      {
        question: 'Does ComplyPRO perform runtime blocking of malicious prompts?',
        answer: 'No. ComplyPRO focuses on static AST capability discovery and governance control verification before deployment. It identifies architectural vulnerabilities and governance gaps in code rather than acting as a runtime proxy.'
      },
      {
        question: 'How does ComplyPRO detect hardcoded credentials?',
        answer: 'The scanner combines AST pattern matching with Shannon entropy analysis to detect high-entropy string literals, API key patterns, and unverified environment variable assignments.'
      }
    ],
    relatedPages: [
      { slug: '/ai-agent-governance', title: 'AI Agent Governance', relationship: 'Operational Context' },
      { slug: '/mcp-governance', title: 'MCP Governance & Security', relationship: 'Protocol Security' },
      { slug: '/ai-governance-assessment', title: 'AI Governance Assessment', relationship: 'Gap Auditing' }
    ],
    cta: {
      primaryText: 'Audit Agent Security in Your Code',
      primaryAction: 'scan',
      secondaryText: 'Request Security Architecture Review',
      secondaryAction: 'briefing'
    },
    schemaType: 'Article'
  },

  '/ai-capability-discovery': {
    slug: '/ai-capability-discovery',
    title: 'AI Capability Discovery: Capability ≠ Authorization | ComplyPRO',
    metaDescription: 'Discover what your AI code can actually do vs. what was intended. ComplyPRO uses static AST analysis and a 5-state epistemic model to uncover hidden agent capabilities.',
    canonical: 'https://www.complypro.pt/ai-capability-discovery',
    h1: 'AI Capability Discovery: Capability Does Not Equal Authorization',
    badge: 'CORE EPISTEMIC THESIS',
    subtitle: 'The foundational intellectual principle of modern AI governance: an AI agent can execute operations that nobody in the organization explicitly authorized.',
    searchIntent: 'informational',
    primaryKeyword: 'AI capability discovery',
    secondaryKeywords: ['capability vs authorization', 'discover AI capabilities in source code', 'hidden AI agent capabilities', 'AST static AI analysis'],
    readingTimeMinutes: 7,
    sections: [
      {
        heading: 'The Foundational Thesis: Capability vs. Authorization',
        paragraphs: [
          'In traditional software, features are carefully engineered, tested, and granted specific role permissions. In modern generative and agentic systems, capabilities frequently outpace governance.',
          'An engineer imports a multi-agent framework and grants an agent access to a "utilities" module. That module contains helper functions for database queries, file writing, and HTTP requests. Although the system prompt instructs the agent to "only summarize customer feedback," the technical capability to write to the production database exists in the code.',
          'This establishes the central thesis of ComplyPRO: Capability is an empirical fact encoded in the repository. Authorization is an explicit, verified governance decision. When capability exists without verified authorization, governance risk is guaranteed.'
        ],
        callout: {
          type: 'epistemic',
          title: 'The First Law of AI Governance',
          text: 'Know What Your AI Can Do. Govern What It Is Allowed to Do. Never assume that prompt instructions restrict technical code capabilities.'
        }
      },
      {
        heading: 'The 5-State Epistemic Model',
        paragraphs: [
          'To represent governance realities truthfully without false dichotomies, ComplyPRO models all discovered capabilities across five distinct epistemic states:'
        ],
        bulletPoints: [
          '1. VERIFIED_SAFE: Discovered capability has documented business purpose, explicit authorization record, and valid structural safeguards.',
          '2. OBSERVED_WITHOUT_VERIFIED_AUTH: Technical code capability detected by AST analysis (e.g. tool execution, database write) without corresponding verified authorization record.',
          '3. ATTESTED_WITHOUT_AST_EVIDENCE: Capability declared in documentation or policy questionnaires but not confirmed by static code inspection.',
          '4. HEURISTICALLY_DERIVED: Capability inferred through naming conventions or import contexts, requiring manual verification.',
          '5. INSUFFICIENT_EVIDENCE: Ambiguous code pattern where AST data is incomplete to confirm or deny the capability.'
        ]
      },
      {
        heading: 'How Static AST Analysis Uncovers Hidden Capabilities',
        paragraphs: [
          'ComplyPRO parses the repository’s Abstract Syntax Tree (AST) client-side in browser memory. It identifies class instantiations, function decorators (e.g., `@tool`), argument type annotations, and module imports.',
          'Because this analysis happens at the syntax tree level, it is immune to string-obfuscation and requires zero code execution, zero container spins, and zero source code upload to external servers.'
        ]
      }
    ],
    faq: [
      {
        question: 'Why not simply test agent capabilities dynamically in a sandbox?',
        answer: 'Dynamic sandboxes can only test scenarios the tester conceives. An agent may only invoke a dangerous tool under specific multi-turn conditions. Static AST analysis reveals all registered tools and execution paths regardless of runtime prompt sequences.'
      },
      {
        question: 'What is an example of an "Observed Without Verified Auth" finding?',
        answer: 'An agent equipped with a `send_wire_transfer` tool function that has no recorded CISO sign-off gate, financial ceiling limit, or human-in-the-loop approval mechanism.'
      }
    ],
    relatedPages: [
      { slug: '/ai-governance', title: 'Enterprise AI Governance', relationship: 'Methodological Application' },
      { slug: '/ai-agent-security', title: 'AI Agent Security', relationship: 'Security Implications' },
      { slug: '/free-ai-governance-scan', title: 'Free AI Governance Scan', relationship: 'Live Demonstration' }
    ],
    cta: {
      primaryText: 'Discover Capabilities in Your Code',
      primaryAction: 'scan',
      secondaryText: 'Request Technical Briefing',
      secondaryAction: 'briefing'
    },
    schemaType: 'Article'
  },

  '/ai-governance-framework': {
    slug: '/ai-governance-framework',
    title: 'CG-AG Governance Framework: 12 Controls & 4 Pillars | ComplyPRO',
    metaDescription: 'The CodeGuard AI Governance (CG-AG) framework: 12 operational controls across Discover, Govern, Operate, and Assure. Aligned with EU AI Act, ISO 42001, and NIST AI RMF.',
    canonical: 'https://www.complypro.pt/ai-governance-framework',
    h1: 'The CG-AG AI Governance Framework',
    badge: 'GOVERNANCE SPECIFICATION',
    subtitle: 'An open, operational framework defining 12 discrete controls for governing AI systems and autonomous agents from source code to production.',
    searchIntent: 'informational',
    primaryKeyword: 'AI governance framework',
    secondaryKeywords: ['CG-AG framework', 'AI governance controls', 'ISO 42001 alignment', 'EU AI Act controls'],
    readingTimeMinutes: 9,
    sections: [
      {
        heading: 'Architectural Overview of CG-AG',
        paragraphs: [
          'The CodeGuard AI Governance (CG-AG) framework was engineered to provide security and compliance teams with a rigorous, operational model tailored specifically to generative models, autonomous agents, and multi-agent systems.',
          'CG-AG organizes governance across four lifecycle pillars (Discover, Govern, Operate, Assure), encompassing 12 discrete, auditable controls:'
        ],
        bulletPoints: [
          'CG-AG-01 (Identity & Boundary): Verification of agent identity, role scopes, and separation of duties.',
          'CG-AG-02 (Tool & Capability Scope): Explicit whitelisting of tool functions, schemas, and parameters.',
          'CG-AG-03 (Model & Provider Transparency): Documentation of model versions, temperatures, and provider boundaries.',
          'CG-AG-04 (Memory & Context Isolation): Separation of vector embeddings and conversation state across tenants.',
          'CG-AG-05 (Human-in-the-Loop Gates): Mandatory human sign-off on destructive, financial, or privileged actions.',
          'CG-AG-06 (Data Egress & Lineage): Tracking sensitive data flow and outbound API connections.',
          'CG-AG-07 (Prompt & Instruction Integrity): Safeguards against instruction override and prompt drift.',
          'CG-AG-08 (Exception & Failsafe Protocols): Deterministic, fail-closed handling of agent loop errors.',
          'CG-AG-09 (Decision Record Persistence): Unambiguous capture of rationale and inputs for automated decisions.',
          'CG-AG-10 (Cryptographic Asset Passports): Versioned, tamper-evident asset passports for every agent.',
          'CG-AG-11 (Hash-Chained Audit Ledger): Immutable SHA-256 event chaining for complete audit defense.',
          'CG-AG-12 (Regulatory Crosswalk): Direct bidirectional mapping to EU AI Act, ISO 42001, and LGPD/GDPR.'
        ],
        callout: {
          type: 'framework',
          title: 'Regulatory Crosswalk Principle',
          text: 'CG-AG maps technical code discoveries to regulatory obligations without claiming legal certification, providing compliance teams with empirical evidence packages.'
        }
      },
      {
        heading: 'Mapping CG-AG to Global AI Standards',
        paragraphs: [
          'The framework maps cleanly to major international standards:',
          '• ISO/IEC 42001 (AI Management System): Aligns with Clause 6 (Planning & Risk Assessment) and Clause 8 (Operation of AI Systems).',
          '• EU AI Act: Aligns with Article 9 (Risk Management System), Article 12 (Record-Keeping & Logging), and Article 14 (Human Oversight).',
          '• Brazil LGPD / GDPR: Maps directly to Article 38 (Relatório de Impacto à Proteção de Dados - RIPD) and DPIA automated processing requirements.'
        ]
      }
    ],
    faq: [
      {
        question: 'Is CG-AG proprietary to ComplyPRO?',
        answer: 'The CG-AG control definitions and framework architecture are published as an open reference standard (see docs/CG_AG_FRAMEWORK_SPECIFICATION.md). ComplyPRO serves as the commercial Governance OS implementing the framework.'
      },
      {
        question: 'Can an organization adopt CG-AG alongside NIST AI RMF?',
        answer: 'Yes. CG-AG operationalizes the high-level recommendations of NIST AI RMF (Govern, Map, Measure, Manage) into concrete code-level controls and verifiable evidence records.'
      }
    ],
    relatedPages: [
      { slug: '/ai-governance', title: 'Enterprise AI Governance', relationship: 'Executive Summary' },
      { slug: '/ai-governance-platform', title: 'ComplyPRO Platform', relationship: 'Platform Implementation' },
      { slug: '/ai-capability-discovery', title: 'Capability Discovery', relationship: 'Discovery Control Basis' }
    ],
    cta: {
      primaryText: 'Benchmark Your Code Against CG-AG',
      primaryAction: 'scan',
      secondaryText: 'Download Framework Spec',
      secondaryAction: 'briefing'
    },
    schemaType: 'Article'
  },

  '/mcp-governance': {
    slug: '/mcp-governance',
    title: 'Model Context Protocol (MCP) Governance & Security | ComplyPRO',
    metaDescription: 'Secure and govern Model Context Protocol (MCP) servers. Authenticated remote endpoints, 14 canonical tools, fail-closed RBAC, and Stdio/SSE transport governance.',
    canonical: 'https://www.complypro.pt/mcp-governance',
    h1: 'Model Context Protocol (MCP) Governance and Security',
    badge: 'PROTOCOL GOVERNANCE',
    subtitle: 'Bringing enterprise authentication, role-based access control, and tamper-evident audit logging to Anthropic’s Model Context Protocol.',
    searchIntent: 'informational',
    primaryKeyword: 'MCP governance',
    secondaryKeywords: ['MCP security', 'Model Context Protocol security', 'MCP server governance', 'MCP tool authorization'],
    readingTimeMinutes: 8,
    sections: [
      {
        heading: 'The Rapid Rise and Security Realities of MCP',
        paragraphs: [
          'Anthropic’s Model Context Protocol (MCP) has rapidly become the open standard for connecting LLMs and IDEs (Cursor, Claude Desktop, VS Code) to external data sources, developer tools, and operational workflows.',
          'While MCP standardizes the communication protocol, it explicitly delegates authentication, access control, and auditing to the server implementer. In default configurations, MCP servers execute with the local user’s permissions over unauthenticated stdio or unencrypted local HTTP.'
        ]
      },
      {
        heading: 'ComplyPRO Universal MCP Architecture',
        paragraphs: [
          'ComplyPRO provides a production-grade Universal MCP Server engineered specifically to resolve enterprise security and governance requirements:'
        ],
        bulletPoints: [
          '14 Canonical Tools: Covering discovery (`scan_repository`, `discover_agents`), governance (`list_controls`, `get_policy`), evidence (`get_evidence_ledger`), and operations (`get_hitl_gates`).',
          '7 Resources & 4 Prompts: Providing deterministic governance context and system prompts directly to connected IDE agents.',
          'Dual Transports: Stdio transport for local development and Streamable HTTP/SSE for remote, cloud-hosted enterprise deployments.',
          'Fail-Closed RBAC: Every tool invocation checks the caller’s token against enterprise roles (CISO, DPO, AI_OFFICE, ENGINEER, AUDITOR, VIEWER).',
          'Tenant Isolation: Enforces multi-tenant boundaries preventing cross-tenant information disclosure (IDOR/BOLA defense).'
        ],
        callout: {
          type: 'security',
          title: 'Authenticated Remote Transport',
          text: 'ComplyPRO Universal MCP rejects unauthenticated requests with 401 Unauthorized and enforces cryptographic timing-safe token validation on all remote SSE endpoints.'
        }
      }
    ],
    faq: [
      {
        question: 'Can ComplyPRO Universal MCP be used directly from Cursor or Claude Desktop?',
        answer: 'Yes. You can connect Claude Desktop or Cursor locally using `npx tsx src/mcp/server.ts` via stdio, or connect to your cloud instance via SSE using your organization bearer token.'
      },
      {
        question: 'Are tool calls through MCP logged in the audit ledger?',
        answer: 'Yes. When configured in connected mode, tool executions and evidence queries are written to the tamper-evident hash-chained ledger with SHA-256 integrity.'
      }
    ],
    relatedPages: [
      { slug: '/ai-agent-security', title: 'AI Agent Security', relationship: 'Underlying Threat Model' },
      { slug: '/ai-governance-platform', title: 'Platform Overview', relationship: 'Platform Ecosystem' },
      { slug: '/ai-capability-discovery', title: 'Capability Discovery', relationship: 'AST Discovery Tooling' }
    ],
    cta: {
      primaryText: 'Scan MCP Tools in Your Code',
      primaryAction: 'scan',
      secondaryText: 'Request MCP Deployment Guide',
      secondaryAction: 'briefing'
    },
    schemaType: 'Article'
  },

  '/free-ai-governance-scan': {
    slug: '/free-ai-governance-scan',
    title: 'Free AI Governance Scan: Browser-Based Code Analysis | ComplyPRO',
    metaDescription: 'Analyze your AI codebase in under 15 seconds. 100% browser-based static AST analysis. Zero code upload. Discover agents, capabilities, and governance gaps instantly.',
    canonical: 'https://www.complypro.pt/free-ai-governance-scan',
    h1: 'Free AI Governance Scan: Technical Discovery in Your Browser',
    badge: 'ZERO CODE STORAGE',
    subtitle: 'Evaluate your AI agents, tool invocations, and governance posture locally in memory with zero source code upload.',
    searchIntent: 'transactional',
    primaryKeyword: 'free AI governance scan',
    secondaryKeywords: ['AI compliance scan', 'AI code security scanner', 'free AI risk assessment', 'AI agent discovery tool'],
    readingTimeMinutes: 5,
    sections: [
      {
        heading: 'Why We Built a Zero-Upload Client-Side Scanner',
        paragraphs: [
          'Enterprise security teams frequently forbid uploading intellectual property and proprietary source code to third-party SaaS platforms for scanning.',
          'ComplyPRO solves this by executing 100% of its static AST parsing directly inside your browser using WebAssembly and modern JavaScript. When you provide a public GitHub URL, upload a repository ZIP, or select a local folder, the code is parsed entirely in your browser’s volatile memory.',
          'Your source code is never sent to, processed by, or stored on ComplyPRO servers.'
        ],
        callout: {
          type: 'security',
          title: 'Client-Side Security Boundary',
          text: 'Verified by automated boundary tests: source code text is strictly sanitized and discarded. Only structured, non-sensitive telemetry (agent counts, risk levels, framework names) can be promoted to a persistent workspace.'
        }
      },
      {
        heading: 'What the Free Scan Discovers in Seconds',
        paragraphs: [
          'The Free AI Governance Scan parses your project tree and produces a complete Live AI Discovery Snapshot:'
        ],
        bulletPoints: [
          'Agent Inventory: Identifies autonomous agents, multi-agent orchestrators, and framework types (CrewAI, LangGraph, AutoGen).',
          'Tool Capabilities: Catalogs database mutations, shell invocations, HTTP endpoints, and third-party APIs.',
          'Scope Decomposition: Isolates production application code from test mocks and infrastructure scripts to prevent false positives.',
          '5-State Epistemic Audit: Flags unverified capabilities and missing human-in-the-loop oversight gates.',
          'Governance Score & Passports: Computes a baseline compliance score and generates verifiable AI Passports.'
        ]
      }
    ],
    faq: [
      {
        question: 'Do I need to enter a credit card or create an account to run the scan?',
        answer: 'No. The Free AI Governance Scan runs immediately in your browser without requiring account creation, credentials, or billing information.'
      },
      {
        question: 'What happens if I want to save my scan results for internal audit?',
        answer: 'You can create a free workspace account at any time. When you promote your scan to a workspace, only structured metadata and finding summaries are saved to your private tenant repository.'
      }
    ],
    relatedPages: [
      { slug: '/ai-capability-discovery', title: 'AI Capability Discovery', relationship: 'Underlying Technology' },
      { slug: '/ai-governance-assessment', title: 'AI Governance Assessment', relationship: 'Comprehensive Audit' },
      { slug: '/ai-governance-platform', title: 'ComplyPRO Platform', relationship: 'Full Enterprise System' }
    ],
    cta: {
      primaryText: 'Run Free Scan on Your Repo',
      primaryAction: 'scan',
      secondaryText: 'Schedule Technical Briefing',
      secondaryAction: 'briefing'
    },
    schemaType: 'SoftwareApplication'
  }
};
