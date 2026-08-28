import {
  AgentCapability,
  AgentIdentityBinding,
  CapabilitiesSummary,
  CapabilityActionType,
  CapabilityAnomaly,
  CapabilityProvenance,
  CapabilityScope,
  CapabilityState,
  CapabilitySystemType,
  DetectedAgent,
  SourceAnalysis
} from './types';

interface RawGrant {
  type: 'iam_policy' | 'oauth_scope' | 'db_grant' | 'rbac_role' | 'k8s_role';
  systemName: string;
  resourceTarget: string;
  actions: string[];
  file: string;
  snippet: string;
  isWildcard: boolean;
  roleOrUser?: string;
}


export function classifyScopeFromPath(filePath: string): CapabilityScope {
  if (!filePath) return 'unknown';
  const normalized = filePath.replace(/\\/g, '/').toLowerCase();
  const segments = normalized.split('/');
  const filename = segments[segments.length - 1] || '';

  // 1. Tests & Specifications
  if (
    segments.some(s => s === 'tests' || s === 'test' || s === '__tests__' || s === 'spec' || s === 'specs') ||
    filename.startsWith('test_') ||
    filename.endsWith('.test.ts') ||
    filename.endsWith('.test.tsx') ||
    filename.endsWith('.test.js') ||
    filename.endsWith('.test.py') ||
    filename.endsWith('.spec.ts') ||
    filename.endsWith('.spec.js') ||
    filename.endsWith('_test.py') ||
    filename.endsWith('_spec.rb')
  ) {
    return 'test';
  }

  // 2. Benchmarks & Performance Suites
  if (
    segments.some(s => s === 'bench' || s === 'benchmarks' || s === 'benchmark' || s === 'perf') ||
    filename.startsWith('bench_') ||
    filename.includes('.bench.') ||
    filename.includes('_benchmark.')
  ) {
    return 'benchmark';
  }

  // 3. Examples, Demos & Samples
  if (
    segments.some(s => s === 'examples' || s === 'example' || s === 'samples' || s === 'sample' || s === 'demos' || s === 'demo') ||
    filename.startsWith('example_') ||
    filename.startsWith('demo_') ||
    filename.startsWith('sample_')
  ) {
    return 'example';
  }

  // 4. Fixtures & Mocks
  if (
    segments.some(s => s === 'fixtures' || s === 'fixture' || s === 'mocks' || s === 'mock' || s === '__mocks__') ||
    filename.startsWith('mock_') ||
    filename.startsWith('fixture_')
  ) {
    return 'fixture';
  }

  // 5. Infrastructure, Migrations, CI/CD & Cloud Configs
  if (
    segments.some(s => s === 'infra' || s === 'infrastructure' || s === 'terraform' || s === 'pulumi' || s === 'k8s' || s === 'kubernetes' || s === 'helm' || s === 'cloudformation' || s === 'migrations' || s === 'migration' || s === 'migrate' || s === 'docker' || s === 'ci' || s === 'cd' || s === 'workflows' || s === '.github') ||
    filename.endsWith('.tf') ||
    filename.endsWith('.tfvars') ||
    filename.endsWith('dockerfile') ||
    filename.startsWith('migration')
  ) {
    return 'infrastructure';
  }

  // 6. Documentation
  if (
    segments.some(s => s === 'docs' || s === 'doc' || s === 'documentation') ||
    filename.endsWith('.md') ||
    filename.endsWith('.mdx') ||
    filename.endsWith('.rst')
  ) {
    return 'documentation';
  }

  // 7. Production Application Code
  if (
    segments.some(s => s === 'src' || s === 'app' || s === 'server' || s === 'backend' || s === 'core' || s === 'lib' || s === 'libs' || s === 'pkg' || s === 'packages' || s === 'api' || s === 'service' || s === 'services' || s === 'web')
  ) {
    return 'production';
  }

  return 'unknown';
}

const SCHEMA_EXCLUDE_KEYWORDS = new Set([
  'function', 'object', 'string', 'number', 'integer', 'boolean', 'array',
  'null', 'parameters', 'properties', 'required', 'description', 'type',
  'items', 'enum', 'default', 'title', '$schema', 'definitions', 'additionalproperties',
  'self', 'cls', 'true', 'false', 'none', 'name', 'tool', 'tools', 'func', 'fn',
  'directory', 'query_engine', 'max_results', 'verbose', 'llm', 'model', 'temperature',
  'api_key', 'instructions', 'role', 'goal', 'backstory', 'expected_output',
  'show_tool_calls', 'stream', 'timeout', 'format'
]);

export function extractDeclaredToolsFromContent(content: string): string[] {
  const discovered: string[] = [];
  const functionAliases = new Map<string, string>(); // funcName -> customToolName

  // 1. JSON / Dict schema functions (OpenAI, Anthropic, Bedrock, Gemini function calling tools)
  const toolsBlocks = content.matchAll(/(?:tools|functions)\s*(?:=|:|\()\s*\[([\s\S]*?)\](?:\s*\)|\s*,|\s*;|\s*\n)/gi);
  for (const tb of toolsBlocks) {
    const blockContent = tb[1];
    const schemaNameMatches = blockContent.matchAll(/(?:["']name["']|\bname\b)\s*:\s*["']([a-zA-Z0-9_\-\.]+)["']/g);
    for (const m of schemaNameMatches) {
      const raw = m[1].trim();
      if (raw && !SCHEMA_EXCLUDE_KEYWORDS.has(raw.toLowerCase()) && raw.length > 1) {
        discovered.push(raw);
      }
    }
  }

  // Also standalone function: { name: "..." } or FunctionTool definitions
  const standaloneFuncMatches = content.matchAll(/(?:function|tool)\s*:\s*\{\s*(?:[\s\S]*?)(?:["']name["']|\bname\b)\s*:\s*["']([a-zA-Z0-9_\-\.]+)["']/gi);
  for (const m of standaloneFuncMatches) {
    const raw = m[1].trim();
    if (raw && !SCHEMA_EXCLUDE_KEYWORDS.has(raw.toLowerCase()) && raw.length > 1) {
      discovered.push(raw);
    }
  }

  // 2. Line-by-line Decorator parsing (LangChain @tool, CrewAI, AutoGen @register_for_llm, Smolagents)
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('@') && (line.includes('tool') || line.includes('register_for_llm') || line.includes('register_for_execution'))) {
      const namedArg = line.match(/(?:name\s*=\s*)?["']([a-zA-Z0-9_\-\.]+)["']/);
      for (let j = i + 1; j <= Math.min(lines.length - 1, i + 3); j++) {
        const nextLine = lines[j].trim();
        const defMatch = nextLine.match(/^(?:async\s+)?def\s+([a-zA-Z0-9_]+)/);
        if (defMatch) {
          const funcName = defMatch[1];
          const target = namedArg ? namedArg[1].trim() : funcName;
          if (namedArg) {
            functionAliases.set(funcName, namedArg[1].trim());
          }
          if (target && !SCHEMA_EXCLUDE_KEYWORDS.has(target.toLowerCase())) {
            discovered.push(target);
          }
          break;
        }
      }
    }
  }

  // 3. AutoGen register_function(func, name="...")
  const autogenMatches = content.matchAll(/register_function\s*\(\s*(?:[\s\S]*?)(?:name\s*=\s*["']([a-zA-Z0-9_\-\.]+)["']|func\s*=\s*([a-zA-Z0-9_]+)|([a-zA-Z0-9_]+)\s*,)/g);
  for (const am of autogenMatches) {
    const target = am[1] || am[2] || am[3];
    if (target && !SCHEMA_EXCLUDE_KEYWORDS.has(target.toLowerCase())) {
      const resolved = functionAliases.get(target.trim()) || target.trim();
      discovered.push(resolved);
    }
  }

  // 4. Tool class instantiations: Tool(name="..."), StructuredTool(name="..."), FunctionTool.from_function(func)
  const wrapperMatches = content.matchAll(/(?:StructuredTool|FunctionTool|QueryEngineTool|Tool)(?:\.from_defaults|\.from_function)?\s*\(\s*(?:(?:name\s*=\s*)?["']([a-zA-Z0-9_\-\.]+)["']|([a-zA-Z0-9_]+))/g);
  for (const m of wrapperMatches) {
    const toolName = m[1] || m[2];
    if (toolName && !SCHEMA_EXCLUDE_KEYWORDS.has(toolName.toLowerCase())) {
      const resolved = functionAliases.get(toolName.trim()) || toolName.trim();
      discovered.push(resolved);
    }
  }

  // 5. tools = [...] or from_tools([...]) or bind_tools([...])
  const toolArrayMatches = content.matchAll(/(?:tools|functions|from_tools|bind_tools)\s*(?:=|:|\()\s*\[([^\]]*)\]/gi);
  for (const tm of toolArrayMatches) {
    const rawList = tm[1];
    if (!rawList.includes('{')) {
      const items = rawList.split(',');
      for (const item of items) {
        const itemTrimmed = item.trim();
        const innerFunc = itemTrimmed.match(/(?:from_function|from_defaults)\s*\(\s*([a-zA-Z0-9_]+)/);
        if (innerFunc && !SCHEMA_EXCLUDE_KEYWORDS.has(innerFunc[1].toLowerCase())) {
          const resolved = functionAliases.get(innerFunc[1].trim()) || innerFunc[1].trim();
          discovered.push(resolved);
          continue;
        }

        const classCall = itemTrimmed.match(/^([a-zA-Z0-9_]+)\s*\(/);
        if (classCall && !SCHEMA_EXCLUDE_KEYWORDS.has(classCall[1].toLowerCase())) {
          const resolved = functionAliases.get(classCall[1].trim()) || classCall[1].trim();
          discovered.push(resolved);
          continue;
        }

        const bare = itemTrimmed.replace(/\(.*\)/g, '').replace(/['"]/g, '').trim();
        if (bare && /^[a-zA-Z0-9_\-\.]+$/.test(bare) && !SCHEMA_EXCLUDE_KEYWORDS.has(bare.toLowerCase())) {
          const resolved = functionAliases.get(bare) || bare;
          discovered.push(resolved);
        }
      }
    }
  }

  // Deduplicate preserving discovery order
  const seen = new Set<string>();
  const result: string[] = [];
  for (const d of discovered) {
    if (!seen.has(d)) {
      seen.add(d);
      result.push(d);
    }
  }
  return result;
}

export function detectCapabilities(
  files: Map<string, string>,
  source: SourceAnalysis
): {
  capabilities: AgentCapability[];
  identities: AgentIdentityBinding[];
  summary: CapabilitiesSummary;
} {
  const capabilities: AgentCapability[] = [];
  const identities: AgentIdentityBinding[] = [];
  const knownGrants: RawGrant[] = [];

  // 1. EXTRACT AUTHORIZATION GRANTS
  for (const [filePath, content] of Array.from(files)) {
    if (!content || content.length > 500000) continue;

    if (filePath.endsWith('.tf') || filePath.endsWith('.json') || filePath.endsWith('.yaml') || filePath.endsWith('.yml')) {
      if (/aws_iam_policy|aws_iam_role_policy/i.test(content) || /"Statement"\s*:\s*\[/i.test(content)) {
        const hasWildcardAction = /"Action"\s*:\s*("\*"|\[\s*"\*"\s*\])/i.test(content) || /actions?\s*=\s*\[\s*"\*"\s*\]/i.test(content);
        const hasWildcardResource = /"Resource"\s*:\s*("\*"|\[\s*"\*"\s*\])/i.test(content) || /resources?\s*=\s*\[\s*"\*"\s*\]/i.test(content);
        
        let systemName = 'AWS Cloud';
        if (/s3|aws_s3/i.test(content)) systemName = 'AWS S3 Storage';
        else if (/dynamodb|aws_dynamodb/i.test(content)) systemName = 'AWS DynamoDB';
        else if (/sqs|sns/i.test(content)) systemName = 'AWS SQS/SNS';
        
        knownGrants.push({
          type: 'iam_policy',
          systemName,
          resourceTarget: hasWildcardResource ? '*' : 'scoped_resource',
          actions: hasWildcardAction ? ['*'] : ['scoped_action'],
          file: filePath,
          snippet: 'IAM Policy Statement definition',
          isWildcard: hasWildcardAction || hasWildcardResource,
          roleOrUser: 'terraform_iam_role'
        });
      }

      if (/kind:\s*(ClusterRole|Role)\b/i.test(content)) {
        const isWildcardVerb = /verbs:\s*\[\s*"\*"\s*\]/.test(content) || /-\s*"\*"\s*$/.test(content);
        knownGrants.push({
          type: 'k8s_role',
          systemName: 'Kubernetes Cluster',
          resourceTarget: '*',
          actions: isWildcardVerb ? ['*'] : ['get', 'list'],
          file: filePath,
          snippet: 'Kubernetes RBAC Role definition',
          isWildcard: isWildcardVerb,
          roleOrUser: 'k8s_service_account'
        });
      }
    }

    if (/\.sql$/i.test(filePath) || /GRANT\s+/i.test(content)) {
      const grantMatches = content.match(/GRANT\s+([\w\s,]+)\s+ON\s+([\w\.\*]+)\s+TO\s+([\w"']+)/gi);
      if (grantMatches) {
        for (const gm of grantMatches) {
          const isAll = /ALL\s+PRIVILEGES/i.test(gm);
          knownGrants.push({
            type: 'db_grant',
            systemName: 'Database (SQL)',
            resourceTarget: gm.split(/ON\s+/i)[1]?.split(/\s+TO/i)[0]?.trim() || 'table',
            actions: isAll ? ['*'] : ['SELECT', 'INSERT'],
            file: filePath,
            snippet: gm.slice(0, 100),
            isWildcard: isAll,
            roleOrUser: gm.split(/TO\s+/i)[1]?.trim() || 'db_user'
          });
        }
      }
    }

    if (/scopes?\s*:\s*\[([^\]]+)\]/i.test(content) || /scope\s*=\s*['"]([^'"]+)['"]/i.test(content)) {
      const scopeMatch = content.match(/scopes?\s*:\s*\[([^\]]+)\]/i) || content.match(/scope\s*=\s*['"]([^'"]+)['"]/i);
      if (scopeMatch && scopeMatch[1]) {
        const rawScopes = scopeMatch[1].replace(/['"]/g, '').split(/[,\s]+/);
        for (const s of rawScopes) {
          if (s.trim().length > 2) {
            knownGrants.push({
              type: 'oauth_scope',
              systemName: s.includes('mail') || s.includes('graph') ? 'Microsoft Office 365' : s.includes('slack') ? 'Slack MCP' : 'OAuth API',
              resourceTarget: s.trim(),
              actions: s.includes('write') || s.includes('send') ? ['WRITE'] : ['READ'],
              file: filePath,
              snippet: `OAuth Scope: ${s.trim()}`,
              isWildcard: s === '*' || s.includes('all'),
              roleOrUser: 'oauth_app'
            });
          }
        }
      }
    }

    if (/service_account|client_email|GOOGLE_APPLICATION_CREDENTIALS|serviceAccountKey/i.test(content)) {
      identities.push({
        agentName: 'SystemAgent',
        identityType: 'service_account',
        identityName: filePath.split('/').pop() || 'service_account.json',
        sourceFile: filePath
      });
    }
  }

  // 2. DISCOVER AGENTS, TOOLS, MCP & CODE ACTIONS
  const agentsList = source.agents || [];
  let capSeq = 0;

  for (const [filePath, content] of Array.from(files)) {
    if (!content || content.length > 500000) continue;
    const filename = filePath.split('/').pop() || filePath;
    const lines = content.split('\n');

    const matchedAgent = agentsList.find(a => 
      (a.filePath && a.filePath === filePath) || 
      filePath.toLowerCase().includes(a.name.toLowerCase()) ||
      content.includes(a.name)
    );
    const agentName = matchedAgent ? matchedAgent.name : `Agent_${filename.replace(/\.[^.]+$/, '')}`;

    // 2.1 DECLARED OPERATIONAL TOOLS & CAPABILITIES (Calibrated: ONE TOOL = ONE CAPABILITY)
    const fileScope = classifyScopeFromPath(filePath);
    const declaredTools = extractDeclaredToolsFromContent(content);
    for (const cleanName of declaredTools) {
      capabilities.push({
        id: `CAP-DEC-${++capSeq}`,
        agentName,
        systemType: 'llm_service',
        systemName: 'Agent Framework Tooling',
        resourceTarget: cleanName,
        action: 'EXECUTE',
        state: 'DECLARED_CAPABILITY',
        filePath,
        isDestructive: /delete|drop|remove|destroy|truncate|terminate|wipe|kill/i.test(cleanName),
        accessesSensitiveData: /pii|customer|financial|patient|credit|cpf|tax|salary|account/i.test(cleanName),
        scope: fileScope,
        provenance: {
          primaryScope: fileScope,
          scopes: [fileScope],
          filePaths: [filePath]
        },
        anomalies: []
      });
    }

    // 2.2 MCP TOOLS
    if (/@modelcontextprotocol\/sdk|mcp\.server|StdioServerTransport/i.test(content) || /ListToolsRequestSchema/i.test(content)) {
      const mcpToolMatches = content.match(/server\.tool\s*\(\s*['"]([^'"]+)['"]/g);
      const mcpToolNames = mcpToolMatches 
        ? mcpToolMatches.map(m => m.replace(/server\.tool\s*\(\s*['"]/, '').replace(/['"]$/, ''))
        : ['mcp_stdio_tool'];

      for (const mTool of mcpToolNames) {
        const mcpScope = classifyScopeFromPath(filePath);
        capabilities.push({
          id: `CAP-MCP-${++capSeq}`,
          agentName,
          systemType: 'mcp_server',
          systemName: 'Model Context Protocol (MCP)',
          resourceTarget: mTool.trim(),
          action: 'EXECUTE',
          state: 'OBSERVED_CAPABILITY',
          filePath,
          isDestructive: /delete|exec|shell|drop|rm/i.test(mTool),
          accessesSensitiveData: /user|contact|invoice|lead/i.test(mTool),
          scope: mcpScope,
          provenance: {
            primaryScope: mcpScope,
            scopes: [mcpScope],
            filePaths: [filePath]
          },
          anomalies: ['OBSERVED_WITHOUT_VERIFIED_AUTH']
        });
      }
    }

    // 2.3 AST ACTIONS PER LINE
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (/DROP\s+TABLE|TRUNCATE\s+TABLE|DELETE\s+FROM/i.test(line)) {
        const tableMatch = line.match(/(?:DROP\s+TABLE(?:\s+IF\s+EXISTS)?|TRUNCATE\s+TABLE|DELETE\s+FROM)\s+([\w\."]+)/i);
        let table = tableMatch ? tableMatch[1].replace(/["']/g, '') : 'database_table';
        if (table.toUpperCase() === 'IF' || table.toUpperCase() === 'EXISTS') {
          table = 'database_table';
        }
        const hasSensitive = /customer|user|account|patient|card|auth|token/i.test(table);

        const matchingGrant = knownGrants.find(g => g.type === 'db_grant' && (g.isWildcard || g.resourceTarget.includes(table)));
        const delDbScope = classifyScopeFromPath(filePath);

        capabilities.push({
          id: `CAP-DB-${++capSeq}`,
          agentName,
          systemType: 'database',
          systemName: 'Relational Database (SQL)',
          resourceTarget: table,
          action: 'DELETE',
          state: matchingGrant ? 'AUTHORIZED_CAPABILITY' : 'UNKNOWN_AUTHORIZATION',
          filePath,
          lineNumber: i + 1,
          codeSnippet: line.trim().slice(0, 120),
          isDestructive: true,
          accessesSensitiveData: hasSensitive,
          scope: delDbScope,
          provenance: {
            primaryScope: delDbScope,
            scopes: [delDbScope],
            filePaths: [filePath]
          },
          authorizationEvidence: matchingGrant ? {
            type: 'db_grant',
            grantFile: matchingGrant.file,
            grantSnippet: matchingGrant.snippet,
            isWildcard: matchingGrant.isWildcard
          } : undefined,
          anomalies: matchingGrant 
            ? ['DESTRUCTIVE_ACTION_WITHOUT_VERIFIED_HITL'] 
            : ['OBSERVED_WITHOUT_VERIFIED_AUTH', 'DESTRUCTIVE_ACTION_WITHOUT_VERIFIED_HITL']
        });
      }
      else if (/\.from\(['"](\w+)['"]\)\.(select|insert|update)/i.test(line) || /SELECT\s+.*FROM\s+(\w+)/i.test(line)) {
        const tableMatch = line.match(/\.from\(['"](\w+)['"]\)/i) || line.match(/FROM\s+(\w+)/i);
        const isWrite = line.includes('insert') || line.includes('update');
        const table = tableMatch ? tableMatch[1] : 'table';
        const hasSensitive = /cpf|email|credit|salary|phone|address|patient|health|customer|invoice|user/i.test(table) || /cpf|salary|credit_score|password|ssn/i.test(line);

        const matchingGrant = knownGrants.find(g => g.type === 'db_grant' && (g.isWildcard || g.resourceTarget.includes(table)));

        const dbScope = classifyScopeFromPath(filePath);
        capabilities.push({
          id: `CAP-DB-${++capSeq}`,
          agentName,
          systemType: 'database',
          systemName: 'PostgreSQL / Database',
          resourceTarget: table,
          action: isWrite ? 'WRITE' : 'READ',
          state: matchingGrant ? 'AUTHORIZED_CAPABILITY' : 'OBSERVED_CAPABILITY',
          filePath,
          lineNumber: i + 1,
          codeSnippet: line.trim().slice(0, 120),
          isDestructive: false,
          accessesSensitiveData: hasSensitive,
          scope: dbScope,
          provenance: {
            primaryScope: dbScope,
            scopes: [dbScope],
            filePaths: [filePath]
          },
          authorizationEvidence: matchingGrant ? {
            type: 'db_grant',
            grantFile: matchingGrant.file,
            grantSnippet: matchingGrant.snippet,
            isWildcard: matchingGrant.isWildcard
          } : undefined,
          anomalies: matchingGrant ? [] : ['OBSERVED_WITHOUT_VERIFIED_AUTH']
        });
      }

      if (/boto3\.client\(['"]s3['"]\)|s3Client\.send|new\s+S3Client/i.test(line) || /deleteObject|deleteBucket|delete_object/i.test(line)) {
        const isDelete = /delete/i.test(line);
        const matchingIam = knownGrants.find(g => g.type === 'iam_policy' && g.systemName.includes('S3'));

        const s3Scope = classifyScopeFromPath(filePath);
        capabilities.push({
          id: `CAP-S3-${++capSeq}`,
          agentName,
          systemType: 'cloud_storage',
          systemName: 'AWS S3 Cloud Storage',
          resourceTarget: matchingIam?.isWildcard ? '*' : 's3://enterprise-data-bucket',
          action: isDelete ? 'DELETE' : matchingIam?.isWildcard ? 'WILDCARD' : 'WRITE',
          state: matchingIam ? 'AUTHORIZED_CAPABILITY' : 'UNKNOWN_AUTHORIZATION',
          filePath,
          lineNumber: i + 1,
          codeSnippet: line.trim().slice(0, 120),
          isDestructive: isDelete,
          accessesSensitiveData: true,
          scope: s3Scope,
          provenance: {
            primaryScope: s3Scope,
            scopes: [s3Scope],
            filePaths: [filePath]
          },
          authorizationEvidence: matchingIam ? {
            type: 'iam_policy',
            grantFile: matchingIam.file,
            grantSnippet: matchingIam.snippet,
            isWildcard: matchingIam.isWildcard
          } : undefined,
          anomalies: matchingIam?.isWildcard 
            ? ['EXCESSIVE_WILDCARD_PERMISSION'] 
            : matchingIam 
              ? [] 
              : ['OBSERVED_WITHOUT_VERIFIED_AUTH']
        });
      }

      if (/child_process\.(exec|spawn|execSync)|subprocess\.(Popen|run|call)|os\.system/i.test(line)) {
        const execScope = classifyScopeFromPath(filePath);
        capabilities.push({
          id: `CAP-EXEC-${++capSeq}`,
          agentName,
          systemType: 'system_exec',
          systemName: 'Operating System Shell (CLI)',
          resourceTarget: '/bin/sh / bash',
          action: 'EXECUTE',
          state: 'UNKNOWN_AUTHORIZATION',
          filePath,
          lineNumber: i + 1,
          codeSnippet: line.trim().slice(0, 120),
          isDestructive: true,
          accessesSensitiveData: false,
          scope: execScope,
          provenance: {
            primaryScope: execScope,
            scopes: [execScope],
            filePaths: [filePath]
          },
          anomalies: ['OBSERVED_WITHOUT_VERIFIED_AUTH', 'DESTRUCTIVE_ACTION_WITHOUT_VERIFIED_HITL', 'PRIVILEGE_ESCALATION_RISK']
        });
      }

      if (/graph\.microsoft\.com|salesforce\.com|hubspot\.com|zendesk\.com/i.test(line)) {
        const isOffice = line.includes('microsoft');
        const matchingOauth = knownGrants.find(g => g.type === 'oauth_scope' && (isOffice ? g.systemName.includes('Office') : true));

        const erpScope = classifyScopeFromPath(filePath);
        capabilities.push({
          id: `CAP-ERP-${++capSeq}`,
          agentName,
          systemType: isOffice ? 'office_365' : 'erp_crm',
          systemName: isOffice ? 'Microsoft 365 Graph API' : 'ERP / CRM Cloud',
          resourceTarget: isOffice ? 'Mail & OneDrive' : 'Customer & Deals Records',
          action: 'READ',
          state: matchingOauth ? 'AUTHORIZED_CAPABILITY' : 'UNKNOWN_AUTHORIZATION',
          filePath,
          lineNumber: i + 1,
          codeSnippet: line.trim().slice(0, 120),
          isDestructive: false,
          accessesSensitiveData: true,
          scope: erpScope,
          provenance: {
            primaryScope: erpScope,
            scopes: [erpScope],
            filePaths: [filePath]
          },
          authorizationEvidence: matchingOauth ? {
            type: 'oauth_scope',
            grantFile: matchingOauth.file,
            grantSnippet: matchingOauth.snippet,
            isWildcard: matchingOauth.isWildcard
          } : undefined,
          anomalies: matchingOauth ? ['CROSS_SYSTEM_ACCESS'] : ['OBSERVED_WITHOUT_VERIFIED_AUTH', 'CROSS_SYSTEM_ACCESS']
        });
      }
    }
  }

  // 3. DEDUPLICATION & SUMMARY
  const dedupedMap = new Map<string, AgentCapability>();
  for (const c of capabilities) {
    const key = `${c.agentName}:${c.systemType}:${c.resourceTarget}:${c.action}`;
    if (!dedupedMap.has(key)) {
      dedupedMap.set(key, c);
    } else {
      const existing = dedupedMap.get(key)!;
      // Preserve provenance sources across multiple occurrences without altering identity or count
      if (existing.provenance && c.provenance) {
        for (const s of c.provenance.scopes) {
          if (!existing.provenance.scopes.includes(s)) {
            existing.provenance.scopes.push(s);
          }
        }
        for (const fp of c.provenance.filePaths) {
          if (!existing.provenance.filePaths.includes(fp)) {
            existing.provenance.filePaths.push(fp);
          }
        }
      }
      for (const a of c.anomalies) {
        if (!existing.anomalies.includes(a)) existing.anomalies.push(a);
      }
    }
  }

  const finalCapabilities = Array.from(dedupedMap.values());

  const summary: CapabilitiesSummary = {
    totalCapabilities: finalCapabilities.length,
    observedCount: finalCapabilities.filter(c => c.state === 'OBSERVED_CAPABILITY').length,
    declaredCount: finalCapabilities.filter(c => c.state === 'DECLARED_CAPABILITY').length,
    authorizedCount: finalCapabilities.filter(c => c.state === 'AUTHORIZED_CAPABILITY').length,
    unknownAuthorizationCount: finalCapabilities.filter(c => c.state === 'UNKNOWN_AUTHORIZATION' || !c.authorizationEvidence).length,
    usedCount: finalCapabilities.filter(c => c.state === 'USED_CAPABILITY' || c.state === 'OBSERVED_CAPABILITY').length,
    destructiveCount: finalCapabilities.filter(c => c.isDestructive).length,
    wildcardCount: finalCapabilities.filter(c => c.action === 'WILDCARD' || c.authorizationEvidence?.isWildcard).length,
    anomaliesCount: finalCapabilities.reduce((acc, c) => acc + c.anomalies.length, 0)
  };

  return {
    capabilities: finalCapabilities,
    identities,
    summary
  };
}