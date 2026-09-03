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

sample_anthropic = """
tools = [
    {
        "name": "get_weather_forecast",
        "description": "Get current weather forecast for a given location",
        "input_schema": {
            "type": "object",
            "properties": {
                "location": {
                    "type": "string",
                    "description": "City and country, e.g. London, UK"
                },
                "unit": {
                    "type": "string",
                    "enum": ["celsius", "fahrenheit"]
                }
            },
            "required": ["location"]
        }
    }
]
"""

def extract_tools(content: str):
    discovered = []
    function_aliases = {}

    # 1. Tools blocks (OpenAI, Anthropic, Bedrock, Gemini)
    toolsBlocks = re.finditer(r'(?:tools|functions)\s*(?:=|:|\()\s*\[([\s\S]*?)\](?:\s*\)|\s*,|\s*;|\s*\n)', content, re.IGNORECASE)
    for tb in toolsBlocks:
        blockContent = tb.group(1)
        for m in re.finditer(r'(?:["\']name["\']|\bname\b)\s*:\s*["\']([a-zA-Z0-9_\-\.]+)["\']', blockContent):
            raw = m.group(1).strip()
            if raw and raw.lower() not in SCHEMA_EXCLUDE_KEYWORDS and len(raw) > 1:
                discovered.append(raw)

    # 2. @tool and @assistant.register_for_llm / @register_for_execution decorators
    for m in re.finditer(r'@(?:tool|(?:[\w]+)\.(?:register_for_llm|register_for_execution))(?:\((?:name\s*=\s*)?["\']?([^"\')\s]+)?["\']?\))?\s*(?:\r?\n|\s)+def\s+([a-zA-Z0-9_]+)', content):
        named, funcName = m.group(1), m.group(2)
        if named and '=' not in named and named not in ['True', 'False']:
            target = named.strip()
            function_aliases[funcName.strip()] = target
        else:
            target = funcName.strip()
        if target and target.lower() not in SCHEMA_EXCLUDE_KEYWORDS:
            discovered.append(target)

    # 3. register_function(...) in AutoGen
    for m in re.finditer(r'register_function\s*\(\s*(?:[\s\S]*?)(?:name\s*=\s*["\']([a-zA-Z0-9_\-\.]+)["\']|func\s*=\s*([a-zA-Z0-9_]+)|([a-zA-Z0-9_]+)\s*,)', content):
        named_arg = m.group(1)
        func_kw = m.group(2)
        bare_func = m.group(3)
        target = named_arg or func_kw or bare_func
        if target and target.lower() not in SCHEMA_EXCLUDE_KEYWORDS:
            discovered.append(function_aliases.get(target.strip(), target.strip()))

    seen = set()
    return [d for d in discovered if not (d in seen or seen.add(d))]

print('AutoGen tools extracted:', extract_tools(sample_autogen))
print('Anthropic tools extracted:', extract_tools(sample_anthropic))
