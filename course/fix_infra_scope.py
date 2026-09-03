with open('../src/core/capability-detector.ts', 'r', encoding='utf-8', errors='ignore') as f:
    text = f.read()

target = """  // 5. Infrastructure & Cloud Configs
  if (
    segments.some(s => s === 'infra' || s === 'infrastructure' || s === 'terraform' || s === 'pulumi' || s === 'k8s' || s === 'kubernetes' || s === 'helm' || s === 'cloudformation') ||
    filename.endsWith('.tf') ||
    filename.endsWith('.tfvars')
  ) {
    return 'infrastructure';
  }"""

replacement = """  // 5. Infrastructure, Migrations, CI/CD & Cloud Configs
  if (
    segments.some(s => s === 'infra' || s === 'infrastructure' || s === 'terraform' || s === 'pulumi' || s === 'k8s' || s === 'kubernetes' || s === 'helm' || s === 'cloudformation' || s === 'migrations' || s === 'migration' || s === 'migrate' || s === 'docker' || s === 'ci' || s === 'cd' || s === 'workflows' || s === '.github') ||
    filename.endsWith('.tf') ||
    filename.endsWith('.tfvars') ||
    filename.endsWith('dockerfile') ||
    filename.startsWith('migration')
  ) {
    return 'infrastructure';
  }"""

if target in text:
    text = text.replace(target, replacement)
    with open('../src/core/capability-detector.ts', 'w', encoding='utf-8') as f:
        f.write(text)
    print('Updated classifyScopeFromPath with migrations and CI/CD')
else:
    print('Target not found in capability-detector.ts')
