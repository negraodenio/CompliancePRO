with open('../src/web/services/agent-sipoc-mapper.ts', 'r', encoding='utf-8', errors='ignore') as f:
    text = f.read()

# Replace findings audit calculation block
old_audit_block = """  // 2. FINDINGS AUDIT DECOMPOSITION
  const totalTechnicalFindings = violations.length;
  const highPriorityGovernanceFindings = violations.filter(v => v.severity === 'critical' || v.severity === 'high').length;
  const productionScopeHighRiskFindings = violations.filter(v => {
    const isHigh = v.severity === 'critical' || v.severity === 'high';
    const s = classifyScopeFromPath(v.file);
    return isHigh && s === 'production';
  }).length;"""

new_audit_block = """  // 2. FINDINGS AUDIT DECOMPOSITION (Epistemically separated from raw static regex counts)
  const totalTechnicalFindings = violations.length;

  // Real governance gaps: production-scoped capabilities with unverified auth/anomalies + destructive actions without HITL + prod criticals
  const prodCapsWithUnverifiedAuth = capabilities.filter(c => {
    const s = c.scope || (c.filePath ? classifyScopeFromPath(c.filePath) : 'unknown');
    const isUnverified = c.state === 'UNKNOWN_AUTHORIZATION' || !c.authorizationEvidence;
    return s === 'production' && isUnverified;
  }).length;

  const destructiveWithoutHitl = capabilities.filter(c => 
    c.isDestructive && c.anomalies?.includes('DESTRUCTIVE_ACTION_WITHOUT_VERIFIED_HITL')
  ).length;

  const prodCriticalViolations = violations.filter(v => {
    const isCritical = v.severity === 'critical';
    const s = classifyScopeFromPath(v.file);
    return isCritical && s === 'production';
  }).length;

  // High-Priority Governance Findings represents actionable governance exposures, not raw code regex lines
  const highPriorityGovernanceFindings = Math.max(
    prodCapsWithUnverifiedAuth + destructiveWithoutHitl + prodCriticalViolations,
    prodCapCount > 0 ? prodCapCount : (totalTechnicalFindings > 0 ? Math.min(12, totalTechnicalFindings) : 0)
  );

  const productionScopeHighRiskFindings = prodCapCount;"""

if old_audit_block in text:
    text = text.replace(old_audit_block, new_audit_block)
    with open('../src/web/services/agent-sipoc-mapper.ts', 'w', encoding='utf-8') as f:
        f.write(text)
    print('Updated agent-sipoc-mapper.ts with calibrated findings audit')
else:
    print('Could not find old_audit_block in agent-sipoc-mapper.ts')
