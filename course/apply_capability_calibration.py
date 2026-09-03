with open('../src/core/capability-detector.ts', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Add SCHEMA_EXCLUDE_KEYWORDS and extractDeclaredToolsFromContent
helper_fn = """const SCHEMA_EXCLUDE_KEYWORDS = new Set([
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

  // 1. JSON / Dict schema functions (OpenAI, Anthropic, Bedrock, Gemini function calling tools)
  const schemaNameMatches = content.matchAll(/["']name["']\s*:\s*["']([a-zA-Z0-9_\-\.]+)["']/g);
  for (const m of schemaNameMatches) {
    const raw = m[1].trim();
    if (raw && !SCHEMA_EXCLUDE_KEYWORDS.has(raw.toLowerCase()) && raw.length > 1) {
      discovered.push(raw);
    }
  }

  // 2. @tool decorator in LangChain / CrewAI / Smolagents / AutoGen
  const decoratorMatches = content.matchAll(/@tool(?:\((?:name\s*=\s*)?["']?([^"')\s]+)?["']?\))?\s*(?:\r?\n|\s)+def\s+([a-zA-Z0-9_]+)/g);
  for (const m of decoratorMatches) {
    const named = m[1];
    const funcName = m[2];
    const target = (named && !named.includes('=') && named !== 'True' && named !== 'False') ? named : funcName;
    if (target && !SCHEMA_EXCLUDE_KEYWORDS.has(target.toLowerCase())) {
      discovered.push(target.trim());
    }
  }

  // 3. Tool class instantiations: Tool(name="..."), StructuredTool(name="..."), FunctionTool.from_function(func)
  const wrapperMatches = content.matchAll(/(?:StructuredTool|FunctionTool|QueryEngineTool|Tool)(?:\.from_defaults|\.from_function)?\s*\(\s*(?:(?:name\s*=\s*)?["']([a-zA-Z0-9_\-\.]+)["']|([a-zA-Z0-9_]+))/g);
  for (const m of wrapperMatches) {
    const toolName = m[1] || m[2];
    if (toolName && !SCHEMA_EXCLUDE_KEYWORDS.has(toolName.toLowerCase())) {
      discovered.push(toolName.trim());
    }
  }

  // 4. tools = [...] or from_tools([...]) or bind_tools([...])
  const toolArrayMatches = content.matchAll(/(?:tools|functions|from_tools|bind_tools)\s*(?:=|:|\()\s*\[([^\]]*)\]/gi);
  for (const tm of toolArrayMatches) {
    const rawList = tm[1];
    if (!rawList.includes('{')) {
      const items = rawList.split(',');
      for (const item of items) {
        const itemTrimmed = item.trim();
        const innerFunc = itemTrimmed.match(/(?:from_function|from_defaults)\s*\(\s*([a-zA-Z0-9_]+)/);
        if (innerFunc && !SCHEMA_EXCLUDE_KEYWORDS.has(innerFunc[1].toLowerCase())) {
          discovered.push(innerFunc[1].trim());
          continue;
        }

        const classCall = itemTrimmed.match(/^([a-zA-Z0-9_]+)\s*\(/);
        if (classCall && !SCHEMA_EXCLUDE_KEYWORDS.has(classCall[1].toLowerCase())) {
          discovered.push(classCall[1].trim());
          continue;
        }

        const bare = itemTrimmed.replace(/\(.*\)/g, '').replace(/['"]/g, '').trim();
        if (bare && /^[a-zA-Z0-9_\-\.]+$/.test(bare) && !SCHEMA_EXCLUDE_KEYWORDS.has(bare.toLowerCase())) {
          discovered.push(bare);
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

"""

old_detect_func = """export function detectCapabilities(
  files: Map<string, string>,
  source: SourceAnalysis
): {"""

new_detect_func = helper_fn + old_detect_func

code = code.replace(old_detect_func, new_detect_func)

# Replace 2.1 DECLARED CAPABILITIES block
old_declared_block = """    // 2.1 DECLARED CAPABILITIES
    const declaredToolsMatch = content.match(/tools\s*=\s*\[([^\]]*)\]/i);
    if (declaredToolsMatch && declaredToolsMatch[1]) {
      const toolNames = declaredToolsMatch[1].replace(/['"]/g, '').split(',');
      for (const tn of toolNames) {
        const cleanName = tn.trim();
        if (cleanName && cleanName.length > 1 && !cleanName.startsWith('@')) {
          capabilities.push({
            id: `CAP-DEC-${++capSeq}`,
            agentName,
            systemType: 'llm_service',
            systemName: 'Agent Framework Tooling',
            resourceTarget: cleanName,
            action: 'EXECUTE',
            state: 'DECLARED_CAPABILITY',
            filePath,
            isDestructive: /delete|drop|remove|destroy|truncate|terminate/i.test(cleanName),
            accessesSensitiveData: /pii|customer|financial|patient|credit|cpf|tax/i.test(cleanName),
            anomalies: []
          });
        }
      }
    }"""

new_declared_block = """    // 2.1 DECLARED OPERATIONAL TOOLS & CAPABILITIES (Calibrated: ONE TOOL = ONE CAPABILITY)
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
        anomalies: []
      });
    }"""

code = code.replace(old_declared_block, new_declared_block)

# Update unknownAuthorizationCount in summary
old_summary_line = "unknownAuthorizationCount: finalCapabilities.filter(c => c.state === 'UNKNOWN_AUTHORIZATION').length,"
new_summary_line = "unknownAuthorizationCount: finalCapabilities.filter(c => c.state === 'UNKNOWN_AUTHORIZATION' || !c.authorizationEvidence).length,"

code = code.replace(old_summary_line, new_summary_line)

with open('../src/core/capability-detector.ts', 'w', encoding='utf-8') as f:
    f.write(code)

print('Successfully calibrated src/core/capability-detector.ts')


# ==============================================================================
# Update FreeScanSnapshotView.tsx
# ==============================================================================
with open('../src/web/components/FreeScanSnapshotView.tsx', 'r', encoding='utf-8') as f:
    snap_text = f.read()

# Update totalUnknownAuth calculation to match semantics
old_total_unknown = "const totalUnknownAuth = capSummary?.unknownAuthorizationCount ?? capabilities.filter(c => c.state === 'UNKNOWN_AUTHORIZATION').length;"
new_total_unknown = "const totalUnknownAuth = capSummary?.unknownAuthorizationCount ?? capabilities.filter(c => c.state === 'UNKNOWN_AUTHORIZATION' || !c.authorizationEvidence).length;"

snap_text = snap_text.replace(old_total_unknown, new_total_unknown)

# Update copy to be precise for static AST analysis
old_copy_static = "Your code exposes physical execution capabilities (e.g. database queries, cloud storage modifications, shell commands)."
new_copy_static = "Your code reveals declared and coded capabilities (e.g. tool definitions, database operations, cloud storage actions, shell executions)."

snap_text = snap_text.replace(old_copy_static, new_copy_static)

with open('../src/web/components/FreeScanSnapshotView.tsx', 'w', encoding='utf-8') as f:
    f.write(snap_text)

print('Successfully updated src/web/components/FreeScanSnapshotView.tsx')
