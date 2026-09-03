with open('../tests/free-scan-business-xray.test.ts', 'r', encoding='utf-8', errors='ignore') as f:
    text = f.read()

assert_block = """// --- Migration Scope Classification Check ---
assert(classifyScopeFromPath('src/migrations/001_create_tables.sql') === 'infrastructure', 'Migrations must classify as infrastructure');
assert(classifyScopeFromPath('src/infrastructure/docker.ts') === 'infrastructure', 'Infrastructure files must classify as infrastructure');"""

new_assert_block = """// --- Scope Precedence & tests.rs Checks ---
assert(classifyScopeFromPath('app/flowix-desktop/src/agent_session/tests.rs') === 'test', 'tests.rs must strictly classify as test, even inside src/');
assert(classifyScopeFromPath('src/agent/test.rs') === 'test', 'test.rs must classify as test');
assert(classifyScopeFromPath('src/agent/tests.py') === 'test', 'tests.py must classify as test');
assert(classifyScopeFromPath('src/agent/tests.ts') === 'test', 'tests.ts must classify as test');
assert(classifyScopeFromPath('src/migrations/001_create_tables.sql') === 'infrastructure', 'Migrations must classify as infrastructure');
assert(classifyScopeFromPath('src/infrastructure/docker.ts') === 'infrastructure', 'Infrastructure files must classify as infrastructure');"""

text = text.replace(assert_block, new_assert_block)

with open('../tests/free-scan-business-xray.test.ts', 'w', encoding='utf-8') as f:
    f.write(text)

print('Updated tests/free-scan-business-xray.test.ts with tests.rs precedence tests')
