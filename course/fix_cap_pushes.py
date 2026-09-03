with open('../src/core/capability-detector.ts', 'r', encoding='utf-8') as f:
    text = f.read()

# Let's inspect where capabilities.push occurs
import re

matches = [m.start() for m in re.finditer(r'capabilities\.push\(', text)]
print(f'Found {len(matches)} capabilities.push occurrences')

# Update CAP-DEC
old_dec = """    const declaredTools = extractDeclaredToolsFromContent(content);
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
        anomalies: []
      });
    }"""

new_dec = """    const fileScope = classifyScopeFromPath(filePath);
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
    }"""

text = text.replace(old_dec, new_dec)

# Update CAP-MCP
old_mcp = """      for (const mTool of mcpToolNames) {
        capabilities.push({
          id: `CAP-MCP-${++capSeq}`,
          agentName,
          systemType: 'mcp_server',
          systemName: 'Model Context Protocol (MCP)',
          resourceTarget: mTool.trim(),
          action: 'EXECUTE',
          state: 'OBSERVED_CAPABILITY',
          filePath,
          isDestructive: false,
          accessesSensitiveData: false,
          anomalies: []
        });
      }"""

new_mcp = """      for (const mTool of mcpToolNames) {
        capabilities.push({
          id: `CAP-MCP-${++capSeq}`,
          agentName,
          systemType: 'mcp_server',
          systemName: 'Model Context Protocol (MCP)',
          resourceTarget: mTool.trim(),
          action: 'EXECUTE',
          state: 'OBSERVED_CAPABILITY',
          filePath,
          isDestructive: false,
          accessesSensitiveData: false,
          scope: fileScope,
          provenance: {
            primaryScope: fileScope,
            scopes: [fileScope],
            filePaths: [filePath]
          },
          anomalies: []
        });
      }"""

text = text.replace(old_mcp, new_mcp)

with open('../src/core/capability-detector.ts', 'w', encoding='utf-8') as f:
    f.write(text)

print('Updated CAP-DEC and CAP-MCP with scope and provenance')
