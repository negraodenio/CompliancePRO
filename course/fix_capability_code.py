# Write clean helper into capability-detector.ts

with open('../src/core/capability-detector.ts', 'r', encoding='utf-8') as f:
    text = f.read()

# Replace the broken function
broken_fn_start = text.find("const SCHEMA_EXCLUDE_KEYWORDS = new Set([")
broken_fn_end = text.find("export function detectCapabilities(")

clean_helper = r"""const SCHEMA_EXCLUDE_KEYWORDS = new Set([
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

new_text = text[:broken_fn_start] + clean_helper + text[broken_fn_end:]
with open('../src/core/capability-detector.ts', 'w', encoding='utf-8') as f:
    f.write(new_text)

print('Updated src/core/capability-detector.ts with clean raw string regexes')
