with open('../src/core/capability-detector.ts', 'r', encoding='utf-8', errors='ignore') as f:
    text = f.read()

# Fix 1: MCP scope & provenance
mcp_old = """        capabilities.push({
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
          anomalies: ['OBSERVED_WITHOUT_VERIFIED_AUTH']
        });"""

mcp_new = """        const mcpScope = classifyScopeFromPath(filePath);
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
        });"""

# Fix 2: Destructive DB regex and scope & provenance
db_del_old = """      if (/DROP\s+TABLE|TRUNCATE\s+TABLE|DELETE\s+FROM/i.test(line)) {
        const tableMatch = line.match(/(?:DROP\s+TABLE|TRUNCATE\s+TABLE|DELETE\s+FROM)\s+([\w\."]+)/i);
        const table = tableMatch ? tableMatch[1].replace(/["']/g, '') : 'database_table';
        const hasSensitive = /customer|user|account|patient|card|auth|token/i.test(table);

        const matchingGrant = knownGrants.find(g => g.type === 'db_grant' && (g.isWildcard || g.resourceTarget.includes(table)));

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
      }"""

db_del_new = """      if (/DROP\s+TABLE|TRUNCATE\s+TABLE|DELETE\s+FROM/i.test(line)) {
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
      }"""

text = text.replace(mcp_old, mcp_new)
text = text.replace(db_del_old, db_del_new)

with open('../src/core/capability-detector.ts', 'w', encoding='utf-8') as f:
    f.write(text)

print('Updated capability-detector.ts with MCP and Destructive DB scope inheritance & table regex')
