import os
import json
import urllib.request
import re

# Load DEMO_PROJECTS
demo_files = {}
with open('../src/web/services/demo-projects.ts', 'r', encoding='utf-8') as f:
    text = f.read()

# Extract fintech credit demo
fintech_files = {
    'credit_agent.py': """
import os
from crewai import Agent, Task, Crew
from langchain.chat_models import ChatOpenAI
from db import query_credit_score

llm = ChatOpenAI(model_name="gpt-4o", temperature=0.2)

risk_analyst = Agent(
    role="Analista de Risco de Credito",
    goal="Avaliar o score de credito do cliente baseado em CPF, renda e historico",
    tools=[query_credit_score]
)
"""
}

# Fetch thomascherickal files
thomas_files = {}
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

headers = {'User-Agent': 'Mozilla/5.0'}
for fname in thomas_names:
    url = f"https://raw.githubusercontent.com/thomascherickal/ai-agents-examples/master/{fname}"
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req) as resp:
            thomas_files[fname] = resp.read().decode('utf-8')
    except Exception as e:
        pass

print(f'Fetched {len(thomas_files)} files from thomascherickal/ai-agents-examples')

# Old detector logic
def old_detect_tools(files):
    capabilities = []
    capSeq = 0
    for path, content in files.items():
        declaredToolsMatch = re.search(r'tools\s*=\s*\[([^\]]*)\]', content, re.IGNORECASE)
        if declaredToolsMatch and declaredToolsMatch.group(1):
            toolNames = declaredToolsMatch.group(1).replace("'", "").replace('"', '').split(',')
            for tn in toolNames:
                cleanName = tn.trim() if hasattr(tn, 'trim') else tn.strip()
                if cleanName and len(cleanName) > 1 and not cleanName.startswith('@'):
                    capabilities.append(cleanName)
    return capabilities

# New calibrated detector logic
SCHEMA_EXCLUDE_KEYWORDS = {
    'function', 'object', 'string', 'number', 'integer', 'boolean', 'array',
    'null', 'parameters', 'properties', 'required', 'description', 'type',
    'items', 'enum', 'default', 'title', '$schema', 'definitions', 'additionalproperties',
    'self', 'cls', 'true', 'false', 'none', 'name', 'tool', 'tools', 'func', 'fn'
}

def new_detect_tools(files):
    capabilities = []
    for path, content in files.items():
        # 1. JSON / Dict schemas
        for m in re.finditer(r'["\']name["\']\s*:\s*["\']([a-zA-Z0-9_\-\.]+)["\']', content):
            raw = m.group(1).strip()
            if raw and raw.lower() not in SCHEMA_EXCLUDE_KEYWORDS and len(raw) > 1:
                capabilities.append(raw)
        
        # 2. Decorators
        for m in re.finditer(r'@tool(?:\((?:name\s*=\s*)?["\']?([^"\')\s]+)?["\']?\))?\s*(?:\r?\n|\s)+def\s+([a-zA-Z0-9_]+)', content):
            named, fn_name = m.group(1), m.group(2)
            target = (named if named and '=' not in named and named not in ['True', 'False'] else fn_name)
            if target and target.lower() not in SCHEMA_EXCLUDE_KEYWORDS:
                capabilities.append(target.strip())
        
        # 3. Tool Wrappers
        for m in re.finditer(r'(?:StructuredTool|FunctionTool|QueryEngineTool|Tool)(?:\.from_function|\.from_defaults)?\s*\(\s*(?:(?:name\s*=\s*)?["\']([a-zA-Z0-9_\-\.]+)["\']|([a-zA-Z0-9_]+))', content):
            toolName = m.group(1) or m.group(2)
            if toolName and toolName.lower() not in SCHEMA_EXCLUDE_KEYWORDS:
                capabilities.append(toolName.strip())
                
        # 4. Array tools
        for tm in re.finditer(r'(?:tools|functions|from_tools|bind_tools)\s*(?:=|:|\()\s*\[([^\]]*)\]', content, re.IGNORECASE):
            rawList = tm.group(1)
            if '{' not in rawList:
                for rawItem in rawList.split(','):
                    inner = re.search(r'(?:from_function|from_defaults|\w+Tool)?\s*\(\s*([a-zA-Z0-9_]+)', rawItem)
                    candidate = inner.group(1) if inner and inner.group(1).lower() not in SCHEMA_EXCLUDE_KEYWORDS else re.sub(r'\(.*?\)', '', rawItem).replace("'", "").replace('"', '').strip()
                    if candidate and re.match(r'^[a-zA-Z0-9_\-\.]+$', candidate) and candidate.lower() not in SCHEMA_EXCLUDE_KEYWORDS:
                        capabilities.append(candidate)
                        
    # Dedup preserving order
    seen = set()
    res = []
    for c in capabilities:
        if c not in seen:
            seen.add(c)
            res.append(c)
    return res

print('\n=== COMPARISON FOR thomascherickal/ai-agents-examples ===')
old_caps = old_detect_tools(thomas_files)
new_caps = new_detect_tools(thomas_files)
print(f'ANTES (Old Parser): {len(old_caps)} capabilities')
for idx, c in enumerate(old_caps):
    print(f'  {idx+1}. {c[:60]}')

print(f'\nDEPOIS (Calibrated Parser): {len(new_caps)} capabilities')
for idx, c in enumerate(new_caps):
    print(f'  {idx+1}. {c}')
