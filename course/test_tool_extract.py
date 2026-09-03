import re

sample_openai_tools = """
tools = [
    {
        "type": "function",
        "function": {
            "name": "check_calendar_availability",
            "description": "Check calendar for available time slots",
            "parameters": {
                "type": "object",
                "properties": {
                    "date": {
                        "type": "string",
                        "description": "Date to check in YYYY-MM-DD format"
                    },
                    "duration_minutes": {
                        "type": "integer",
                        "description": "Meeting duration in minutes"
                    }
                },
                "required": ["date", "duration_minutes"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "book_calendar_appointment",
            "description": "Book appointment on calendar",
            "parameters": {
                "type": "object",
                "properties": {
                    "date": {"type": "string"},
                    "time": {"type": "string"},
                    "title": {"type": "string"}
                },
                "required": ["date", "time", "title"]
            }
        }
    }
]
"""

sample_langchain_tools = """
tools = [search_tool, calculator_tool, TavilySearchResults(max_results=5), get_weather]
"""

sample_decorator_tools = """
@tool
def calculate_tax(income: float, rate: float) -> float:
    \"\"\"Calculate tax amount\"\"\"
    return income * rate

@tool("send_email_notification")
def notify_user(email: str, message: str):
    pass
"""

def extract_declared_tools(content: str):
    discovered = []
    
    # 1. Check for JSON / dict schema function definitions: "name": "check_calendar_availability"
    # Matches OpenAI, Anthropic, Bedrock, Gemini tool schemas
    schema_fn_matches = re.findall(r'["\']name["\']\s*:\s*["\']([a-zA-Z0-9_\-\.]+)["\']', content)
    for fn in schema_fn_matches:
        if fn.lower() not in ['function', 'object', 'string', 'number', 'integer', 'boolean', 'array', 'null', 'parameters', 'properties', 'required']:
            discovered.append(fn.strip())

    # 2. Check for @tool decorator
    decorator_matches = re.findall(r'@tool(?:\(["\']([^"\']+)["\']\))?\s*\n\s*(?:async\s+)?def\s+([a-zA-Z0-9_]+)', content)
    for named_tool, fn_name in decorator_matches:
        discovered.append(named_tool if named_tool else fn_name)

    # 3. Check for tools = [...] or bind_tools([...])
    tools_list_matches = re.findall(r'(?:tools|functions|bind_tools)\s*(?:=|:|\()\s*\[([^\]]*)\]', content, re.IGNORECASE)
    for raw_list in tools_list_matches:
        # If the list contains JSON objects with "name": "...", schema_fn_matches already handles it!
        if '{' not in raw_list:
            items = raw_list.split(',')
            for item in items:
                cleaned = re.sub(r'\(.*?\)', '', item) # strip func call parens e.g. TavilySearchResults() -> TavilySearchResults
                cleaned = cleaned.replace("'", "").replace('"', '').strip()
                if cleaned and re.match(r'^[a-zA-Z0-9_\-\.]+$', cleaned):
                    if cleaned.lower() not in ['self', 'cls', 'true', 'false', 'none']:
                        discovered.append(cleaned)
                        
    # 4. Check for StructuredTool / Tool(name="...")
    explicit_tools = re.findall(r'Tool(?:\.from_function)?\s*\(\s*(?:name\s*=\s*)?["\']([a-zA-Z0-9_\-\.]+)["\']', content)
    for et in explicit_tools:
        discovered.append(et.strip())

    # Deduplicate preserving order
    seen = set()
    result = []
    for d in discovered:
        if d not in seen:
            seen.add(d)
            result.append(d)
    return result

print('OpenAI tools extracted:', extract_declared_tools(sample_openai_tools))
print('LangChain tools extracted:', extract_declared_tools(sample_langchain_tools))
print('Decorator tools extracted:', extract_declared_tools(sample_decorator_tools))
