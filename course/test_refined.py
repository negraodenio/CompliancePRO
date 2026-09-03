import re

SCHEMA_EXCLUDE_KEYWORDS = {
    'function', 'object', 'string', 'number', 'integer', 'boolean', 'array',
    'null', 'parameters', 'properties', 'required', 'description', 'type',
    'items', 'enum', 'default', 'title', '$schema', 'definitions', 'additionalproperties',
    'self', 'cls', 'true', 'false', 'none', 'name', 'tool', 'tools', 'func', 'fn',
    'directory', 'query_engine', 'max_results', 'verbose', 'llm', 'model', 'temperature',
    'api_key', 'instructions', 'role', 'goal', 'backstory', 'expected_output',
    'show_tool_calls', 'stream', 'timeout', 'format'
}

def extract_tools_refined(content: str):
    discovered = []
    
    # 1. JSON / Dict schema functions: "name": "check_calendar_availability"
    schema_fn_matches = re.findall(r'["\']name["\']\s*:\s*["\']([a-zA-Z0-9_\-\.]+)["\']', content)
    for fn in schema_fn_matches:
        cleaned = fn.strip()
        if cleaned.lower() not in SCHEMA_EXCLUDE_KEYWORDS and len(cleaned) > 1:
            discovered.append(cleaned)

    # 2. @tool decorator in LangChain / CrewAI / Smolagents / AutoGen
    decorator_matches = re.findall(r'@tool(?:\(["\']?([^"\')\s]+)?["\']?\))?\s*(?:\r?\n|\s)+def\s+([a-zA-Z0-9_]+)', content)
    for named_tool, fn_name in decorator_matches:
        target = (named_tool if named_tool and '=' not in named_tool and named_tool not in ['True', 'False'] else fn_name)
        if target and target.lower() not in SCHEMA_EXCLUDE_KEYWORDS:
            discovered.append(target.strip())

    # 3. Tool class instantiations: Tool(name="..."), StructuredTool(name="...")
    explicit_tools = re.findall(r'(?:StructuredTool|Tool|FunctionTool|QueryEngineTool)(?:\.from_defaults|\.from_function)?\s*\(\s*(?:(?:name\s*=\s*)?["\']([a-zA-Z0-9_\-\.]+)["\']|([a-zA-Z0-9_]+))', content)
    for name_kw, direct_ref in explicit_tools:
        target = name_kw or direct_ref
        if target and target.lower() not in SCHEMA_EXCLUDE_KEYWORDS:
            discovered.append(target.strip())

    # 4. tools = [...] or from_tools([...])
    tools_list_matches = re.findall(r'(?:tools|functions|from_tools|bind_tools)\s*(?:=|:|\()\s*\[([^\]]*)\]', content, re.IGNORECASE)
    for raw_list in tools_list_matches:
        if '{' not in raw_list:
            items = raw_list.split(',')
            for item in items:
                item_trimmed = item.strip()
                # Check for FunctionTool.from_function(func_name) -> func_name
                inner_func = re.search(r'(?:from_function|from_defaults)\s*\(\s*([a-zA-Z0-9_]+)', item_trimmed)
                if inner_func and inner_func.group(1).lower() not in SCHEMA_EXCLUDE_KEYWORDS:
                    discovered.append(inner_func.group(1).strip())
                    continue
                
                # Check for ClassTool() or ClassTool(kwargs) -> ClassTool
                class_call = re.match(r'^([a-zA-Z0-9_]+)\s*\(', item_trimmed)
                if class_call and class_call.group(1).lower() not in SCHEMA_EXCLUDE_KEYWORDS:
                    discovered.append(class_call.group(1).strip())
                    continue

                # Bare identifier e.g. search_tool, hr_tool, query_credit_score
                bare = re.sub(r'\(.*?\)', '', item_trimmed).replace("'", "").replace('"', '').strip()
                if bare and re.match(r'^[a-zA-Z0-9_\-\.]+$', bare) and bare.lower() not in SCHEMA_EXCLUDE_KEYWORDS:
                    discovered.append(bare)

    # Deduplicate preserving order
    seen = set()
    result = []
    for d in discovered:
        if d not in seen:
            seen.add(d)
            result.append(d)
    return result

import urllib.request
thomas_names = [
    '01_langchain_document_extractor.py',
    '02_autogpt_researcher.py',
    '03_crewai_marketing_campaign.py',
    '04_autogen_pair_programming.py',
    '05_llamaindex_hr_assistant.py',
    '06_phidata_financial_assistant.py',
    '07_openai_scheduling_assistant.py',
    '08_haystack_ticket_classifier.py',
    '09_babyagi_project_manager.py',
    '10_semantic_kernel_email_assistant.py'
]

base_url = "https://raw.githubusercontent.com/thomascherickal/ai-agents-examples/master/"
headers = {'User-Agent': 'Mozilla/5.0'}
all_refined = []
for fname in thomas_names:
    url = base_url + fname
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req) as resp:
            content = resp.read().decode('utf-8')
            tools = extract_tools_refined(content)
            print(f'{fname}: {tools}')
            all_refined.extend(tools)
    except Exception as e:
        print(f'{fname}: Error ({e})')

print(f'\nTotal Unique Operational Tools: {len(set(all_refined))}')
for idx, t in enumerate(set(all_refined)):
    print(f'  {idx+1}. {t}')
