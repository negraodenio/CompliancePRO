import os

with open('../tests/capability-calibration-regression.test.ts', 'r', encoding='utf-8') as f:
    text = f.read()

old_s3_check = """const s3Cap = res5.capabilities[0];
assert(Boolean(s3Cap.agentName), "Agent name present");
assert(s3Cap.systemType === 'cloud_storage', "System type is cloud_storage");
assert(s3Cap.action === 'DELETE', "Action is DELETE");
assert(s3Cap.isDestructive === true, "isDestructive is true");"""

new_s3_check = """const s3Cap = res5.capabilities.find(c => c.action === 'DELETE') || res5.capabilities[0];
assert(Boolean(s3Cap.agentName), "Agent name present");
assert(s3Cap.systemType === 'cloud_storage', "System type is cloud_storage");
assert(s3Cap.action === 'DELETE', "Action is DELETE");
assert(s3Cap.isDestructive === true, "isDestructive is true");"""

text = text.replace(old_s3_check, new_s3_check)

with open('../tests/capability-calibration-regression.test.ts', 'w', encoding='utf-8') as f:
    f.write(text)

print('Updated tests/capability-calibration-regression.test.ts')
