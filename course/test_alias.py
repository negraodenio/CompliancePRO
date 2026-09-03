import re

crewAiFile = """
from crewai import Agent, Task, Crew
from crewai.tools import tool

@tool("market_search_tool")
def search_financial_markets(query: str) -> str:
    \"\"\"Searches stock market ticker quotes\"\"\"
    return "Market data"

@tool
def calculate_risk_index(portfolio_id: str, threshold: float) -> float:
    \"\"\"Calculates weighted risk score\"\"\"
    return 0.85

analyst = Agent(
    role="Senior Risk Analyst",
    tools=[search_financial_markets, calculate_risk_index]
)
"""

SCHEMA_EXCLUDE_KEYWORDS = {
    'function', 'object', 'string', 'number', 'integer', 'boolean', 'array',
    'null', 'parameters', 'properties', 'required', 'description', 'type',
    'items', 'enum', 'default', 'title', '$schema', 'definitions', 'additionalproperties',
    'self', 'cls', 'true', 'false', 'none', 'name', 'tool', 'tools', 'func', 'fn',
    'directory', 'query_engine', 'max_results', 'verbose', 'llm', 'model', 'temperature',
    'api_key', 'instructions', 'role', 'goal', 'backstory', 'expected_output',
    'show_tool_calls', 'stream', 'timeout', 'format'
}

def extract_tools(content: str):
    discovered = []
    function_aliases = {} # funcName -> customToolName

    # 1. JSON / Dict schema functions
    toolsBlocks = re.finditer(r'(?:tools|functions)\s*(?:=|:|\()\s*\[([\s\S]*?)\](?:\s*\)|\s*,|\s*;|\s*\n)', content, re.IGNORECASE)
    for tb in toolsBlocks:
        blockContent = tb.group(1)
        for m in re.finditer(r'(?:["\']name["\']|\bname\b)\s*:\s*["\']([a-zA-Z0-9_\-\.]+)["\']', blockContent):
            raw = m.group(1).strip()
            if raw and raw.lower() not in SCHEMA_EXCLUDE_KEYWORDS and len(raw) > 1:
                discovered.append(raw)

    # 2. @tool decorator with alias mapping
    for m in re.finditer(r'@tool(?:\((?:name\s*=\s*)?["\']?([^"\')\s]+)?["\']?\))?\s*(?:\r?\n|\s)+def\s+([a-zA-Z0-9_]+)', content):
        named = m.group(1)
        funcName = m.group(2)
        if named and '=' not in named and named not in ['True', 'False']:
            target = named.strip()
            function_aliases[funcName] = target
        else:
            target = funcName.strip()
        if target and target.lower() not in SCHEMA_EXCLUDE_KEYWORDS:
            discovered.append(target)

    # 3. Tool wrappers
    for m in re.finditer(r'(?:StructuredTool|FunctionTool|QueryEngineTool|Tool)(?:\.from_defaults|\.from_function)?\s*\(\s*(?:(?:name\s*=\s*)?["\']([a-zA-Z0-9_\-\.]+)["\']|([a-zA-Z0-9_]+))', content):
        toolName = m.group(1) or m.group(2)
        if toolName and toolName.lower() not in SCHEMA_EXCLUDE_KEYWORDS:
            discovered.append(function_aliases.get(toolName, toolName).strip())

    # 4. tools = [...]
    for tm in re.finditer(r'(?:tools|functions|from_tools|bind_tools)\s*(?:=|:|\()\s*\[([^\]]*)\]', content, re.IGNORECASE):
        rawList = tm.group(1)
        if '{' not in rawList:
            for rawItem in rawList.split(','):
                itemTrimmed = rawItem.strip()
                innerFunc = re.search(r'(?:from_function|from_defaults)\s*\(\s*([a-zA-Z0-9_]+)', itemTrimmed)
                if innerFunc and innerFunc.group(1).lower() not in SCHEMA_EXCLUDE_KEYWORDS:
                    cand = innerFunc.group(1).strip()
                    discovered.append(function_aliases.get(cand, cand))
                    continue

                classCall = re.match(r'^([a-zA-Z0-9_]+)\s*\(', itemTrimmed)
                if classCall and classCall.group(1).lower() not in SCHEMA_EXCLUDE_KEYWORDS:
                    cand = classCall.group(1).strip()
                    discovered.append(function_aliases.get(cand, cand))
                    continue

                bare = re.sub(r'\(.*?\)', '', itemTrimmed).replace("'", "").replace('"', '').strip()
                if bare and re.match(r'^[a-zA-Z0-9_\-\.]+$', bare) and bare.lower() not in SCHEMA_EXCLUDE_KEYWORDS:
                    discovered.append(function_aliases.get(bare, bare))

    seen = set()
    result = []
    for d in discovered:
        if d not in seen:
            seen.add(d)
            result.append(d)
    return result

print('Discovered in crewAiFile:', extract_tools(crewAiFile))
