with open('../src/core/capability-detector.ts', 'r', encoding='utf-8', errors='ignore') as f:
    text = f.read()

# Replace classifyScopeFromPath
old_scope_fn = """export function classifyScopeFromPath(filePath: string): CapabilityScope {
  if (!filePath) return 'unknown';
  const normalized = filePath.replace(/\\\\/g, '/').toLowerCase();
  const segments = normalized.split('/');
  const filename = segments[segments.length - 1] || '';

  // 1. Tests & Specifications
  if (
    segments.some(s => s === 'tests' || s === 'test' || s === '__tests__' || s === 'spec' || s === 'specs') ||
    filename.startsWith('test_') ||
    filename.endsWith('.test.ts') ||
    filename.endsWith('.test.tsx') ||
    filename.endsWith('.test.js') ||
    filename.endsWith('.test.py') ||
    filename.endsWith('.spec.ts') ||
    filename.endsWith('.spec.js') ||
    filename.endsWith('_test.py') ||
    filename.endsWith('_spec.rb')
  ) {
    return 'test';
  }"""

new_scope_fn = """export function classifyScopeFromPath(filePath: string): CapabilityScope {
  if (!filePath) return 'unknown';
  const normalized = filePath.replace(/\\\\/g, '/').toLowerCase();
  const segments = normalized.split('/');
  const filename = segments[segments.length - 1] || '';

  // 1. Tests & Specifications (File-level test markers take strict precedence over directory markers)
  if (
    segments.some(s => s === 'tests' || s === 'test' || s === '__tests__' || s === 'spec' || s === 'specs') ||
    filename.startsWith('test_') ||
    filename.startsWith('tests_') ||
    filename.startsWith('test.') ||
    filename.startsWith('tests.') ||
    filename === 'tests.rs' ||
    filename === 'test.rs' ||
    filename === 'tests.py' ||
    filename === 'test.py' ||
    filename === 'tests.ts' ||
    filename === 'test.ts' ||
    filename === 'tests.js' ||
    filename === 'test.js' ||
    filename.endsWith('.test.ts') ||
    filename.endsWith('.test.tsx') ||
    filename.endsWith('.test.js') ||
    filename.endsWith('.test.py') ||
    filename.endsWith('.test.rs') ||
    filename.endsWith('.spec.ts') ||
    filename.endsWith('.spec.js') ||
    filename.endsWith('_test.py') ||
    filename.endsWith('_test.rs') ||
    filename.endsWith('_tests.rs') ||
    filename.endsWith('_test.go') ||
    filename.endsWith('_spec.rb') ||
    filename.includes('.test.') ||
    filename.includes('.spec.')
  ) {
    return 'test';
  }"""

if old_scope_fn in text:
    text = text.replace(old_scope_fn, new_scope_fn)
    with open('../src/core/capability-detector.ts', 'w', encoding='utf-8') as f:
        f.write(text)
    print('Updated classifyScopeFromPath in capability-detector.ts')
else:
    print('Could not find old_scope_fn')
