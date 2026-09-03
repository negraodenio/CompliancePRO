import urllib.request

url = "https://raw.githubusercontent.com/thomascherickal/ai-agents-examples/master/06_phidata_financial_assistant.py"
headers = {'User-Agent': 'Mozilla/5.0'}
req = urllib.request.Request(url, headers=headers)
with urllib.request.urlopen(req) as resp:
    content = resp.read().decode('utf-8')
    for idx, line in enumerate(content.splitlines()):
        if 'tool' in line.lower() or 'agent' in line.lower():
            print(f'{idx+1}: {line}')
