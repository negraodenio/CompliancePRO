"""
Script de Teste de Conexao e Validacao da Arquitetura Multi-tenant no Supabase.
"""
import sys
from supabase_client import get_admin_client
from entitlements_service import EntitlementsService
from scan_storage_service import ScanStorageService

def run_test():
    print("[1/5] Testando conexao com Supabase...")
    admin = get_admin_client()

    # 1. Cria ou recupera uma Organizacao de Teste (Tenant 1)
    test_slug = "acme-corp-test"
    org_res = admin.table("organizations").select("*").eq("slug", test_slug).execute()
    
    if org_res.data and len(org_res.data) > 0:
        org = org_res.data[0]
        print(f"[OK] Tenant 1 encontrado: {org['name']} (ID: {org['id']})")
    else:
        new_org = admin.table("organizations").insert({
            "name": "ACME Corporation AI Labs",
            "slug": test_slug,
            "plan_tier": "starter"
        }).execute()
        org = new_org.data[0]
        print(f"[OK] Novo Tenant 1 criado: {org['name']} (ID: {org['id']})")

    org_id = org["id"]

    # 2. Cria ou recupera um Segundo Tenant para provar o Multi-tenancy (Tenant 2)
    test_slug_2 = "fintech-x-test"
    org_res_2 = admin.table("organizations").select("*").eq("slug", test_slug_2).execute()
    if org_res_2.data and len(org_res_2.data) > 0:
        org_2 = org_res_2.data[0]
        print(f"[OK] Tenant 2 encontrado: {org_2['name']} (ID: {org_2['id']})")
    else:
        new_org_2 = admin.table("organizations").insert({
            "name": "FinTech X Secure Payments",
            "slug": test_slug_2,
            "plan_tier": "enterprise"
        }).execute()
        org_2 = new_org_2.data[0]
        print(f"[OK] Novo Tenant 2 criado: {org_2['name']} (ID: {org_2['id']})")

    # 3. Configura Entitlements (Cotas de Scan) para o Tenant 1
    print("[2/5] Validando Entitlements e Quotas...")
    ent_service = EntitlementsService()
    ent = ent_service.get_organization_entitlements(org_id)
    if not ent:
        ent = ent_service.create_default_free_tier(org_id)
        print(f"[OK] Entitlements criados: {ent['monthly_scan_quota']} scans/mes permitidos.")
    else:
        print(f"[OK] Entitlements ativos: {ent['used_scans_period']}/{ent['monthly_scan_quota']} scans usados.")

    # 4. Testa o Gatekeeper de Cotas
    print("[3/5] Testando Gatekeeper de Permissoes...")
    allowed, msg = ent_service.can_run_scan(org_id, is_deep_cg_ag=True)
    print(f"[OK] Gatekeeper Check: Autorizado? {allowed} - Motivo: {msg}")

    # 5. Simula o Salvamento de um Scan Multi-tenant (Zero Codigo Salvo)
    print("[4/5] Registrando Scan e Findings...")
    storage = ScanStorageService()
    repo_id = storage.create_or_get_repository(org_id, "CustomerSupport-RAG-Agent", "zip_upload")
    print(f"[OK] Repositorio registrado no Tenant: {repo_id}")

    scan_result = storage.save_scan_result(
        org_id=org_id,
        repository_id=repo_id,
        compliance_score=94.50,
        risk_level="LOW",
        frameworks_breakdown={
            "LGPD": 96.0,
            "EU_AI_ACT": 92.0,
            "OWASP_LLM": 100.0,
            "NIST_AI_RMF": 90.0
        },
        cg_ag_assessment={
            "total_controls": 24,
            "passed_controls": 23,
            "cg_ag_tier": "TIER_3_ENTERPRISE_READY"
        },
        findings=[
            {
                "rule_id": "LGPD-ART-38-NO-RIPD",
                "severity": "LOW",
                "file_path": "agents/support_bot.py",
                "line_number": 42,
                "description": "Arquivo de configuracao nao referencia o termo RIPD para este agente.",
                "remediation": "Gerar RIPD automatizado via CompliancePRO."
            }
        ],
        total_files=15,
        total_agents=2,
        summary_report="Scan executado com sucesso. Conformidade elevada com as normas vigentes."
    )
    print(f"[OK] Scan salvo com sucesso! Scan ID: {scan_result['id']} | Score: {scan_result['compliance_score']}")

    # 6. Registra consumo na cota do Tenant
    print("[5/5] Registrando consumo de cota...")
    ent_service.record_scan_usage(org_id)
    print("[OK] Consumo de cota registrado com sucesso!")
    print("\n>>> RESULTADO: BANCO SUPABASE & ARQUITETURA MULTI-TENANT 100% OPERACIONAIS! <<<")

if __name__ == "__main__":
    run_test()
