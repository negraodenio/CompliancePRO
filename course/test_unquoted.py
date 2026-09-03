import re

SCHEMA_EXCLUDE_KEYWORDS = {
    'function', 'object', 'string', 'number', 'integer', 'boolean', 'array',
    'null', 'parameters', 'properties', 'required', 'description', 'type',
    'items', 'enum', 'default', 'title', '$schema', 'definitions', 'additionalproperties',
    'self', 'cls', 'true', 'false', 'none', 'name', 'tool', 'tools', 'func', 'fn',
    'directory', 'query_engine', 'max_results', 'verbose', 'llm', 'model', 'temperature',
    'api_key', 'instructions', 'role', 'goal', 'backstory', 'expected_output',
    'show_tool_calls', 'stream', 'timeout', 'format', 'calendarassistant', 'agent', 'assistant'
}

test_js = '''
const assistant = await client.beta.assistants.create({
  name: "CalendarAssistant",
  model: "gpt-4o",
  tools: [
    {
      type: "function",
      function: {
        name: "check_calendar_availability",
        description: "Check calendar for available time slots across timezones",
        parameters: {
          type: "object",
          properties: {
            date: { type: "string", description: "Date in YYYY-MM-DD" },
            duration_minutes: { type: "integer", description: "Duration in minutes" }
          },
          required: ["date", "duration_minutes"]
        }
      }
    }
  ]
});
'''

# 1. Match function tool definitions with function: { name: ... } or tools: [ { name: ... } ]
# Matches: function:\s*\{[^}]*?name:\s*["'](\w+)["'] or (?:["']name["']|\bname)\s*:\s*["'](\w+)["']
matches = re.findall(r'(?:["\']name["\']|\bname)\s*:\s*["\']([a-zA-Z0-9_\-\.]+)["\']', test_js)
print('matches:', matches)
filtered = [m for m in matches if m.lower() not in SCHEMA_EXCLUDE_KEYWORDS]
print('filtered:', filtered)
