import os

# 1. Update AuditLedgerView.tsx
with open('../src/web/views/AuditLedgerView.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('verif.isValid', 'verif.isChainValid')
text = text.replace('actorId: b.actorId', 'actor: b.actor')
text = text.replace('payloadDigest: b.payloadDigest', 'payloadHash: b.payloadHash')

with open('../src/web/views/AuditLedgerView.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print('Updated AuditLedgerView.tsx')


# 2. Update ProtectedEvidenceView.tsx with FileDown import
with open('../src/web/views/ProtectedEvidenceView.tsx', 'r', encoding='utf-8') as f:
    ev_text = f.read()

if "FileDown," not in ev_text:
    ev_text = ev_text.replace("import { \n  LockKeyhole,", "import { \n  FileDown,\n  LockKeyhole,")
    ev_text = ev_text.replace("import {\n  LockKeyhole,", "import {\n  FileDown,\n  LockKeyhole,")

with open('../src/web/views/ProtectedEvidenceView.tsx', 'w', encoding='utf-8') as f:
    f.write(ev_text)

print('Updated ProtectedEvidenceView.tsx')
