import urllib.request

for fname in ['06_phidata_financial_assistant.py', '05_llamaindex_hr_assistant.py', '02_autogpt_researcher.py']:
    url = f"https://raw.githubusercontent.com/thomascherickal/ai-agents-examples/master/{fname}"
    headers = {'User-Agent': 'Mozilla/5.0'}
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req) as resp:
            content = resp.read().decode('utf-8')
            print(f'=== {fname} ===')
            for line in content.splitlines()[:40]:
                if any(k in line.lower() for k in ['tool', 'agent', 'def ']):
                    print('  ', line)
    except Exception as e:
        print(f'{fname}: Error ({e})')
