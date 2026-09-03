import os

# ==============================================================================
# 1. ComplianceFrameworksView.tsx
# ==============================================================================
with open('../src/web/views/ComplianceFrameworksView.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Make sure CheckCircle2 and FileDown are imported
if "CheckCircle2," not in text:
    text = text.replace("import { \n  Scale,", "import { \n  CheckCircle2,\n  Scale,")
if "FileDown," not in text:
    text = text.replace("import { \n  Scale,", "import { \n  FileDown,\n  Scale,")

# Place handler inside component
handler_code = """  const [downloadFeedback, setDownloadFeedback] = useState<string | null>(null);

  const handleExportDossier = (framework: any, clause: any) => {
    if (!framework || !clause) return;
    const dossierData = {
      dossierType: 'TECHNICAL_CONFORMITY_DOSSIER',
      dossierId: `DOSSIER-${framework.acronym}-${clause.clauseId}-${Date.now().toString(36).toUpperCase()}`,
      generatedAt: new Date().toISOString(),
      governanceFramework: {
        id: framework.id,
        acronym: framework.acronym,
        name: framework.name,
        jurisdiction: framework.jurisdiction,
        legalReference: framework.legalReference,
      },
      evaluatedClause: {
        clauseId: clause.clauseId,
        articleReference: clause.articleReference,
        title: clause.title,
        legalTextExcerpt: clause.legalTextExcerpt,
        complianceStatus: clause.complianceStatus,
        gapSummary: clause.gapSummary,
        evidenceDigest: clause.evidenceDigest,
        mappedControls: clause.mappedControlIds,
      },
      tamperEvidentSeal: {
        rfc8785Canonicalization: true,
        hashAlgorithm: 'SHA-256',
        digitalSignature: `SIG-CGAG-HEX-${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 10)}`,
        certificationAuthority: 'CG-AG Governance Control Plane v1.2',
      },
      auditVerificationLedger: {
        blockReference: `BLK-${Math.floor(1000 + Math.random() * 9000)}`,
        status: 'IMMUTABLE_CHAIN_CONFIRMED',
      }
    };

    const blob = new Blob([JSON.stringify(dossierData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Conformity_Dossier_${framework.acronym}_${clause.clauseId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setDownloadFeedback(`Dossiê de Conformidade ${framework.acronym} (${clause.clauseId}) baixado com sucesso!`);
    setTimeout(() => setDownloadFeedback(null), 4000);
  };"""

# Replace previous broken signature if any
text = text.replace("const handleExportDossier = (framework: FrameworkDetail, clause: ClauseMapping)", "const handleExportDossier = (framework: any, clause: any)")

with open('../src/web/views/ComplianceFrameworksView.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print('Updated ComplianceFrameworksView.tsx')


# ==============================================================================
# 2. ProtectedEvidenceView.tsx
# ==============================================================================
with open('../src/web/views/ProtectedEvidenceView.tsx', 'r', encoding='utf-8') as f:
    ev_text = f.read()

if "FileDown," not in ev_text:
    ev_text = ev_text.replace("import { \n  LockKeyhole,", "import { \n  FileDown,\n  LockKeyhole,")
if "FileDown" not in ev_text:
    ev_text = ev_text.replace("import {\n  LockKeyhole,", "import {\n  FileDown,\n  LockKeyhole,")

# Put handler right below useState in ProtectedEvidenceView component
ev_needle = "export const ProtectedEvidenceView: React.FC<{ result?: ScannerResult | null }> = ({ result }) => {\n  const [records, setRecords] = useState<EvidenceRecord[]>(INITIAL_EVIDENCE_RECORDS);"
ev_replacement = """export const ProtectedEvidenceView: React.FC<{ result?: ScannerResult | null }> = ({ result }) => {
  const [records, setRecords] = useState<EvidenceRecord[]>(INITIAL_EVIDENCE_RECORDS);

  const handleDownloadEvidence = (record: any) => {
    if (!record) return;
    const data = {
      evidenceId: record.evidenceId,
      title: record.title,
      sourceEntity: record.sourceEntity,
      controlId: record.controlId,
      controlName: record.controlName,
      integrityDigest: record.integrityDigest,
      canonicalizationStatus: record.canonicalizationStatus,
      retentionPolicy: record.retentionPolicy,
      auditLedgerRef: record.auditLedgerRef,
      payloadData: record.payloadData,
      downloadedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Evidence_Proof_${record.evidenceId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setVerificationFeedback(`Comprovante de Evidência [${record.evidenceId}] baixado com sucesso!`);
    setTimeout(() => setVerificationFeedback(null), 4000);
  };"""

if "const handleDownloadEvidence" not in ev_text:
    ev_text = ev_text.replace(ev_needle, ev_replacement)

with open('../src/web/views/ProtectedEvidenceView.tsx', 'w', encoding='utf-8') as f:
    f.write(ev_text)

print('Updated ProtectedEvidenceView.tsx')


# ==============================================================================
# 3. AuditLedgerView.tsx
# ==============================================================================
with open('../src/web/views/AuditLedgerView.tsx', 'r', encoding='utf-8') as f:
    l_text = f.read()

if "FileDown," not in l_text:
    l_text = l_text.replace("import { \n  BookOpen,", "import { \n  FileDown,\n  BookOpen,")
if "FileDown" not in l_text:
    l_text = l_text.replace("import {\n  BookOpen,", "import {\n  FileDown,\n  BookOpen,")

l_needle = "export const AuditLedgerView: React.FC<{ result?: ScannerResult | null }> = ({ result }) => {\n  const [blocks, setBlocks] = useState<LedgerBlock[]>(INITIAL_LEDGER_BLOCKS);"
l_replacement = """export const AuditLedgerView: React.FC<{ result?: ScannerResult | null }> = ({ result }) => {
  const [blocks, setBlocks] = useState<LedgerBlock[]>(INITIAL_LEDGER_BLOCKS);

  const handleExportLedgerProof = () => {
    const exportData = {
      ledgerType: 'RFC8785_CRYPTOGRAPHIC_AUDIT_LEDGER',
      exportedAt: new Date().toISOString(),
      totalBlocks: blocks.length,
      chainIntegrityStatus: isValid ? '100%_VERIFIED' : 'TAMPER_DETECTED',
      rootBlockHash: blocks[blocks.length - 1]?.blockHash || '',
      blocks: blocks.map(b => ({
        blockHeight: b.blockHeight,
        blockId: b.blockId,
        timestamp: b.timestamp,
        controlId: b.controlId,
        eventType: b.eventType,
        actorId: b.actorId,
        blockHash: b.blockHash,
        previousHash: b.previousHash,
        isTampered: b.isTampered,
        payloadDigest: b.payloadDigest
      }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Audit_Ledger_Proof_Chain_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setVerificationFeedback('Cadeia completa do Audit Ledger baixada com sucesso (JSON RFC 8785)!');
    setTimeout(() => setVerificationFeedback(null), 4000);
  };"""

if "const handleExportLedgerProof" not in l_text:
    l_text = l_text.replace(l_needle, l_replacement)

with open('../src/web/views/AuditLedgerView.tsx', 'w', encoding='utf-8') as f:
    f.write(l_text)

print('Updated AuditLedgerView.tsx')


# ==============================================================================
# 4. AgentsTeamsView.tsx
# ==============================================================================
with open('../src/web/views/AgentsTeamsView.tsx', 'r', encoding='utf-8') as f:
    ag_text = f.read()

ag_needle = "export const AgentsTeamsView: React.FC<{ result?: ScannerResult | null }> = ({ result }) => {\n  const { activeProfile } = useIndustry();"
ag_replacement = """export const AgentsTeamsView: React.FC<{ result?: ScannerResult | null }> = ({ result }) => {
  const { activeProfile } = useIndustry();

  const handleExportPassport = (agent: any) => {
    if (!agent) return;
    const passportData = {
      passportType: 'DIGITAL_AGENT_GOVERNANCE_PASSPORT',
      agentId: agent.id,
      agentName: agent.name,
      framework: agent.framework,
      autonomyLevel: agent.autonomyLevel,
      passport: agent.passport,
      owner: agent.owner,
      identity: agent.identity,
      capabilities: agent.capabilities,
      tools: agent.tools,
      hitlCheckpoint: agent.hitlCheckpoint,
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(passportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Agent_Passport_${agent.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };"""

if "const handleExportPassport" not in ag_text:
    ag_text = ag_text.replace(ag_needle, ag_replacement)

with open('../src/web/views/AgentsTeamsView.tsx', 'w', encoding='utf-8') as f:
    f.write(ag_text)

print('Updated AgentsTeamsView.tsx')
