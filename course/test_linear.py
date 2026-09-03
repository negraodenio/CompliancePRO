sample_autogen = """
from autogen import register_function

def calculate_mortgage(principal: float, rate: float, years: int) -> float:
    return principal * (rate / 12)

register_function(
    calculate_mortgage,
    caller=assistant,
    executor=user_proxy,
    name="mortgage_calculator",
    description="Calculate monthly mortgage repayment"
)

@user_proxy.register_for_execution()
@assistant.register_for_llm(name="currency_converter", description="Convert currency amounts")
def convert_fx(amount: float, from_curr: str, to_curr: str) -> float:
    return amount * 1.08
"""

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

def extract_tools_linear(content: str):
    discovered = []
    function_aliases = {}
    lines = content.split('\n')

    # 1. Line-by-line decorator parsing (Linear & ReDoS safe)
    for i in range(len(lines)):
        line = lines[i].trim() if hasattr(lines[i], 'trim') else lines[i].strip()
        if line.startswith('@') and any(k in line for k in ['tool', 'register_for_llm', 'register_for_execution']):
            named_arg = re.search(r'(?:name\s*=\s*)?["\']([a-zA-Z0-9_\-\.]+)["\']', line)
            for j in range(i + 1, min(len(lines), i + 4)):
                next_line = lines[j].strip()
                def_match = re.match(r'^(?:async\s+)?def\s+([a-zA-Z0-9_]+)', next_line)
                if def_match:
                    func_name = def_match.group(1)
                    target = named_arg.group(1).strip() if named_arg and '=' not in named_arg.group(1) else func_name
                    if named_arg and '=' not in named_arg.group(1):
                        function_aliases[func_name] = named_arg.group(1).strip()
                    if target and target.lower() not in SCHEMA_EXCLUDE_KEYWORDS:
                        discovered.append(target)
                    break

    # 2. AutoGen register_function
    for m in re.finditer(r'register_function\s*\(\s*(?:[\s\S]*?)(?:name\s*=\s*["\']([a-zA-Z0-9_\-\.]+)["\']|func\s*=\s*([a-zA-Z0-9_]+)|([a-zA-Z0-9_]+)\s*,)', content):
        target = m.group(1) or m.group(2) or m.group(3)
        if target and target.lower() not in SCHEMA_EXCLUDE_KEYWORDS:
            discovered.append(function_aliases.get(target.strip(), target.strip()))

    seen = set()
    return [d for d in discovered if not (d in seen or seen.add(d))]

print('Linear parsing result:', extract_tools_linear(sample_autogen))
