with open('../src/core/capability-detector.ts', 'r', encoding='utf-8') as f:
    text = f.read()

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

"""

new_text = text[:broken_fn_start] + clean_helper + text[broken_fn_end:]
with open('../src/core/capability-detector.ts', 'w', encoding='utf-8') as f:
    f.write(new_text)

print('Updated src/core/capability-detector.ts with full 18-case support')
