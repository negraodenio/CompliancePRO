import urllib.request

url = "https://raw.githubusercontent.com/thomascherickal/ai-agents-examples/master/07_openai_scheduling_assistant.py"
headers = {'User-Agent': 'Mozilla/5.0'}
req = urllib.request.Request(url, headers=headers)
try:
    with urllib.request.urlopen(req) as resp:
        content = resp.read().decode('utf-8')
        print('=== 07_openai_scheduling_assistant.py ===')
        print(content)
except Exception as e:
    print('Error:', e)
