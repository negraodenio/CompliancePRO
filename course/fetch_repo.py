import urllib.request
import json

url = 'https://api.github.com/repos/thomascherickal/ai-agents-examples'
headers = {'User-Agent': 'Mozilla/5.0'}
req = urllib.request.Request(url, headers=headers)
try:
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode('utf-8'))
        default_branch = data.get('default_branch', 'main')
        print('Repo found:', data.get('full_name'), 'Default branch:', default_branch)
        
        tree_url = f"https://api.github.com/repos/thomascherickal/ai-agents-examples/git/trees/{default_branch}?recursive=1"
        req_tree = urllib.request.Request(tree_url, headers=headers)
        with urllib.request.urlopen(req_tree) as resp_tree:
            tree_data = json.loads(resp_tree.read().decode('utf-8'))
            print('Files:')
            for item in tree_data.get('tree', []):
                if item.get('path', '').endswith(('.py', '.json', '.md')):
                    print(' -', item['path'])
except Exception as e:
    print('Error:', e)
