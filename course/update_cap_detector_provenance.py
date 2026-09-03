import os

with open('../src/core/capability-detector.ts', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Update imports from ./types
old_import = """import {
  AgentCapability,
  AgentIdentityBinding,
  CapabilitiesSummary,
  CapabilityActionType,
  CapabilityAnomaly,
  CapabilityState,
  CapabilitySystemType,
  DetectedAgent,
  SourceAnalysis
} from './types';"""

new_import = """import {
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
} from './types';"""

text = text.replace(old_import, new_import)

# 2. Add classifyScopeFromPath function
classify_fn = """
export function classifyScopeFromPath(filePath: string): CapabilityScope {
  if (!filePath) return 'unknown';
  const normalized = filePath.replace(/\\\\/g, '/').toLowerCase();
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

  // 5. Infrastructure & Cloud Configs
  if (
    segments.some(s => s === 'infra' || s === 'infrastructure' || s === 'terraform' || s === 'pulumi' || s === 'k8s' || s === 'kubernetes' || s === 'helm' || s === 'cloudformation') ||
    filename.endsWith('.tf') ||
    filename.endsWith('.tfvars')
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
"""

if 'export function classifyScopeFromPath' not in text:
    text = text.replace("const SCHEMA_EXCLUDE_KEYWORDS", classify_fn + "\nconst SCHEMA_EXCLUDE_KEYWORDS")

# 3. Update capability creations to include scope and provenance
# In CAP-TOOL
old_cap_tool = """        capabilities.push({
          id: `CAP-TOOL-${++capSeq}`,
          agentName,
          systemType: 'llm_service',
          systemName: 'Agent Framework Tooling',
          resourceTarget: toolName,
          action: 'EXECUTE',
          state: 'DECLARED_CAPABILITY',
          filePath,
          lineNumber: 1,
          codeSnippet: `Declared tool: ${toolName}`,
          isDestructive: false,
          accessesSensitiveData: false,
          anomalies: []
        });"""

new_cap_tool = """        const fileScope = classifyScopeFromPath(filePath);
        capabilities.push({
          id: `CAP-TOOL-${++capSeq}`,
          agentName,
          systemType: 'llm_service',
          systemName: 'Agent Framework Tooling',
          resourceTarget: toolName,
          action: 'EXECUTE',
          state: 'DECLARED_CAPABILITY',
          filePath,
          lineNumber: 1,
          codeSnippet: `Declared tool: ${toolName}`,
          isDestructive: false,
          accessesSensitiveData: false,
          scope: fileScope,
          provenance: {
            primaryScope: fileScope,
            scopes: [fileScope],
            filePaths: [filePath]
          },
          anomalies: []
        });"""

text = text.replace(old_cap_tool, new_cap_tool)

# In CAP-DB
old_cap_db = """        capabilities.push({
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
          authorizationEvidence: matchingGrant ? {
            type: 'db_grant',
            grantFile: matchingGrant.file,
            grantSnippet: matchingGrant.snippet,
            isWildcard: matchingGrant.isWildcard
          } : undefined,
          anomalies: matchingGrant ? [] : ['OBSERVED_BUT_UNAUTHORIZED']
        });"""

new_cap_db = """        const dbScope = classifyScopeFromPath(filePath);
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
          anomalies: matchingGrant ? [] : ['OBSERVED_BUT_UNAUTHORIZED']
        });"""

text = text.replace(old_cap_db, new_cap_db)

# In CAP-S3
old_cap_s3 = """        capabilities.push({
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
              : ['OBSERVED_BUT_UNAUTHORIZED']
        });"""

new_cap_s3 = """        const s3Scope = classifyScopeFromPath(filePath);
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
              : ['OBSERVED_BUT_UNAUTHORIZED']
        });"""

text = text.replace(old_cap_s3, new_cap_s3)

# In CAP-EXEC
old_cap_exec = """        capabilities.push({
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
          anomalies: ['OBSERVED_BUT_UNAUTHORIZED', 'DESTRUCTIVE_ACTION_WITHOUT_HITL', 'PRIVILEGE_ESCALATION_RISK']
        });"""

new_cap_exec = """        const execScope = classifyScopeFromPath(filePath);
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
          anomalies: ['OBSERVED_BUT_UNAUTHORIZED', 'DESTRUCTIVE_ACTION_WITHOUT_HITL', 'PRIVILEGE_ESCALATION_RISK']
        });"""

text = text.replace(old_cap_exec, new_cap_exec)

# In CAP-ERP
old_cap_erp = """        capabilities.push({
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
          authorizationEvidence: matchingOauth ? {
            type: 'oauth_scope',
            grantFile: matchingOauth.file,
            grantSnippet: matchingOauth.snippet,
            isWildcard: matchingOauth.isWildcard
          } : undefined,
          anomalies: matchingOauth ? ['CROSS_SYSTEM_ACCESS'] : ['OBSERVED_BUT_UNAUTHORIZED', 'CROSS_SYSTEM_ACCESS']
        });"""

new_cap_erp = """        const erpScope = classifyScopeFromPath(filePath);
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
          anomalies: matchingOauth ? ['CROSS_SYSTEM_ACCESS'] : ['OBSERVED_BUT_UNAUTHORIZED', 'CROSS_SYSTEM_ACCESS']
        });"""

text = text.replace(old_cap_erp, new_cap_erp)

# 4. Update deduplication logic
old_dedup = """  // 3. DEDUPLICATION & SUMMARY
  const dedupedMap = new Map<string, AgentCapability>();
  for (const c of capabilities) {
    const key = `${c.agentName}:${c.systemType}:${c.resourceTarget}:${c.action}`;
    if (!dedupedMap.has(key)) {
      dedupedMap.set(key, c);
    } else {
      const existing = dedupedMap.get(key)!;
      for (const a of c.anomalies) {
        if (!existing.anomalies.includes(a)) existing.anomalies.push(a);
      }
    }
  }"""

new_dedup = """  // 3. DEDUPLICATION & SUMMARY
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
  }"""

text = text.replace(old_dedup, new_dedup)

with open('../src/core/capability-detector.ts', 'w', encoding='utf-8') as f:
    f.write(text)

print('Updated src/core/capability-detector.ts with provenance and scope classification')
