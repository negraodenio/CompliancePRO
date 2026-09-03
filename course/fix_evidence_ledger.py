import os

# ==============================================================================
# 1. FIX ProtectedEvidenceView.tsx
# ==============================================================================
with open('../src/web/views/ProtectedEvidenceView.tsx', 'r', encoding='utf-8') as f:
    ev_text = f.read()

# Add FileDown import
if "FileDown," not in ev_text:
    ev_text = ev_text.replace("import { \n  LockKeyhole,", "import { \n  FileDown,\n  LockKeyhole,")
if "FileDown," not in ev_text:
    ev_text = ev_text.replace("import {\n  LockKeyhole,", "import {\n  FileDown,\n  LockKeyhole,")

# Add handler right after handleVerifyIntegrity
handler_ev = """  const handleDownloadEvidence = (record: any) => {
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
  };"""

if "const handleDownloadEvidence" not in ev_text:
    ev_text = ev_text.replace("  const handleVerifyIntegrity = (evidenceId: string) => {", handler_ev + "\n\n  const handleVerifyIntegrity = (evidenceId: string) => {")

with open('../src/web/views/ProtectedEvidenceView.tsx', 'w', encoding='utf-8') as f:
    f.write(ev_text)

print('Fixed ProtectedEvidenceView.tsx')


# ==============================================================================
# 2. FIX AuditLedgerView.tsx
# ==============================================================================
with open('../src/web/views/AuditLedgerView.tsx', 'r', encoding='utf-8') as f:
    l_text = f.read()

# Add FileDown import
if "FileDown," not in l_text:
    l_text = l_text.replace("import { \n  BookOpen,", "import { \n  FileDown,\n  BookOpen,")
if "FileDown," not in l_text:
    l_text = l_text.replace("import {\n  BookOpen,", "import {\n  FileDown,\n  BookOpen,")

# Add handler right after handleVerifyChain
handler_l = """  const handleExportLedgerProof = () => {
    const list = AuditLedgerStore.getBlocks();
    const verif = AuditLedgerStore.verifyEntireLedger();
    const exportData = {
      ledgerType: 'RFC8785_CRYPTOGRAPHIC_AUDIT_LEDGER',
      exportedAt: new Date().toISOString(),
      totalBlocks: list.length,
      chainIntegrityStatus: verif.isValid ? '100%_VERIFIED' : 'TAMPER_DETECTED',
      rootBlockHash: list[list.length - 1]?.blockHash || '',
      blocks: list.map(b => ({
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
  };"""

if "const handleExportLedgerProof" not in l_text:
    l_text = l_text.replace("  const handleVerifyChain = () => {", handler_l + "\n\n  const handleVerifyChain = () => {")

with open('../src/web/views/AuditLedgerView.tsx', 'w', encoding='utf-8') as f:
    f.write(l_text)

print('Fixed AuditLedgerView.tsx')
