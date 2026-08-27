"""
Teste do Ciclo Completo de Analises e Historico do Usuario
"""
import uuid
from supabase_client import get_admin_client
from entitlements_service import EntitlementsService
from scan_storage_service import ScanStorageService

def run_user_analysis_test():
    print("=== TESTE DO ESPACO DO USUARIO & HISTORICO DE ANALISES ===")
    admin = get_admin_client()

    # 1. Cria o Workspace do Usuario
    random_id = str(uuid.uuid4())[:8]
    org_slug = f"user-space-{random_id}"
    org_res = admin.table("organizations").insert({
        "name": f"Tech Corp AI Workspace {random_id}",
        "slug": org_slug,
        "plan_tier": "free"
    }).execute()
    org_id = org_res.data[0]["id"]

    ent_svc = EntitlementsService()
    ent_svc.create_default_free_tier(org_id)
    print(f"[1/4] Workspace do Usuario Criado: {org_res.data[0]['name']} (ID: {org_id})")

    # 2. Executa e Salva 2 Analises no Espaco do Usuario (Zero Codigo do Cliente Salvo)
    storage = ScanStorageService()
    
    # Analise 1: SAC Bot
    repo1_id = storage.create_or_get_repository(org_id, "SAC-CustomerService-Bot", "agent_pipeline")
    scan1 = storage.save_scan_result(
        org_id=org_id,
        repository_id=repo1_id,
        compliance_score=78.5,
        risk_level="MEDIUM",
        frameworks_breakdown={"LGPD": 80.0, "EU_AI_ACT": 75.0, "OWASP": 80.0},
        cg_ag_assessment={"tier": "TIER_2_DEVELOPMENT", "passed": 18, "total": 24},
        findings=[
            {
                "rule_id": "LGPD-ART-38-NO-RIPD",
                "severity": "HIGH",
                "file_path": "agents/sac_bot.py",
                "line_number": 12,
                "description": "Ausencia de mapeamento de dados pessoais sensiveis.",
                "remediation": "Adicionar sanitizacao de PII antes de enviar ao LLM."
            }
        ],
        total_files=8,
        total_agents=1,
        summary_report="Scan Inicial: Risco Medio identificado.",
        triggered_by=None
    )
    ent_svc.record_scan_usage(org_id)
    print(f"[2/4] Analise #1 Salva (Score: 78.5% - Scan ID: {scan1['id']})")

    # Analise 2: Apos Correcoes
    scan2 = storage.save_scan_result(
        org_id=org_id,
        repository_id=repo1_id,
        compliance_score=96.0,
        risk_level="LOW",
        frameworks_breakdown={"LGPD": 98.0, "EU_AI_ACT": 94.0, "OWASP": 100.0},
        cg_ag_assessment={"tier": "TIER_3_ENTERPRISE_READY", "passed": 23, "total": 24},
        findings=[],
        total_files=8,
        total_agents=1,
        summary_report="Scan Pos-Correcao: Conformidade Elevada.",
        triggered_by=None
    )
    ent_svc.record_scan_usage(org_id)
    print(f"[2/4] Analise #2 Salva (Score: 96.0% - Scan ID: {scan2['id']})")

    # 3. Consulta o Historico do Espaco
    history = admin.table("scans").select("id, compliance_score, risk_level, created_at, repositories(name)").eq("organization_id", org_id).order("created_at", desc=True).execute()
    print(f"\n[3/4] Historico do Usuario recuperado ({len(history.data)} analises):")
    for s in history.data:
        repo_name = (s.get("repositories") or {}).get("name", "Repo")
        print(f"   -> [{s['created_at'][:19]}] {repo_name} | Score: {s['compliance_score']}% | Risco: {s['risk_level']}")

    # 4. Checa os Entitlements atualizados
    ent = ent_svc.get_organization_entitlements(org_id)
    print(f"\n[4/4] Quotas do Usuario: {ent['used_scans_period']}/{ent['monthly_scan_quota']} scans consumidos.")
    print("\n>>> ESPACO DO USUARIO & HISTORICO DE ANALISES 100% OPERACIONAIS! <<<")

if __name__ == "__main__":
    run_user_analysis_test()
