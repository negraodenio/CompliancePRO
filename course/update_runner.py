with open('../run_all_suites.ts', 'r', encoding='utf-8', errors='ignore') as f:
    text = f.read()

target = "'capability-provenance.test.ts',"
addition = "\n  'free-scan-business-xray.test.ts',"

if 'free-scan-business-xray.test.ts' not in text:
    text = text.replace(target, target + addition)
    with open('../run_all_suites.ts', 'w', encoding='utf-8') as f:
        f.write(text)
    print('Added free-scan-business-xray.test.ts to run_all_suites.ts')
else:
    print('Already present')
