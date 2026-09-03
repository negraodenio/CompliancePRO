import urllib.request
import re

files_to_check = [
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

SCHEMA_KEYWORDS = {
    'function', 'object', 'string', 'number', 'integer', 'boolean', 'array',
    'null', 'parameters', 'properties', 'required', 'description', 'type',
    'items', 'enum', 'default', 'title', '$schema', 'definitions', 'additionalproperties',
    'self', 'cls', 'true', 'false', 'none', 'name'
}

def extract_tools_calibrated(content: str):
    discovered = []
    
    # 1. JSON / Dict schema functions: "name": "..." or 'name': '...'
    schema_fn_matches = re.findall(r'["\']name["\']\s*:\s*["\']([a-zA-Z0-9_\-\.]+)["\']', content)
    for fn in schema_fn_matches:
        cleaned = fn.strip()
        if cleaned.lower() not in SCHEMA_KEYWORDS and len(cleaned) > 1:
            discovered.append(cleaned)

    # 2. @tool decorator in LangChain / CrewAI / Smolagents / AutoGen
    decorator_matches = re.findall(r'@tool(?:\(["\']([^"\']+)["\']\))?\s*(?:\n|\r\n)\s*(?:async\s+)?def\s+([a-zA-Z0-9_]+)', content)
    for named_tool, fn_name in decorator_matches:
        target = named_tool if named_tool else fn_name
        if target and target.lower() not in SCHEMA_KEYWORDS:
            discovered.append(target.strip())

    # 3. tools = [...] or functions = [...] or bind_tools([...])
    tools_list_matches = re.findall(r'(?:tools|functions|bind_tools)\s*(?:=|:|\()\s*\[([^\]]*)\]', content, re.IGNORECASE)
    for raw_list in tools_list_matches:
        if '{' not in raw_list:
            items = raw_list.split(',')
            for item in items:
                cleaned = re.sub(r'\(.*?\)', '', item).replace("'", "").replace('"', '').strip()
                if cleaned and re.match(r'^[a-zA-Z0-9_\-\.]+$', cleaned):
                    if cleaned.lower() not in SCHEMA_KEYWORDS:
                        discovered.append(cleaned)

    # 4. Tool(name="...") / StructuredTool(name="...") / FunctionTool.from_defaults(fn=...)
    explicit_tools = re.findall(r'(?:StructuredTool|Tool|FunctionTool)(?:\.from_defaults|\.from_function)?\s*\(\s*(?:name\s*=\s*)?["\']([a-zA-Z0-9_\-\.]+)["\']', content)
    for et in explicit_tools:
        if et.lower() not in SCHEMA_KEYWORDS:
            discovered.append(et.strip())

    # Deduplicate preserving order
    seen = set()
    result = []
    for d in discovered:
        if d not in seen:
            seen.add(d)
            result.append(d)
    return result

for fname in files_to_check:
    url = base_url + fname
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req) as resp:
            content = resp.read().decode('utf-8')
            tools = extract_tools_calibrated(content)
            print(f'{fname}: {len(tools)} tools discovered -> {tools}')
    except Exception as e:
        print(f'{fname}: Error ({e})')
